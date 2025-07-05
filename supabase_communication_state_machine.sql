-- Communication State Machine Database Extension
-- Phase 1: Add state machine fields to existing communication_modes table
-- Date: July 2, 2025
-- Part of: Strategic Communication Circuit Breaker System

-- Add state machine fields to existing communication_modes table
ALTER TABLE communication_modes 
ADD COLUMN IF NOT EXISTS state_display TEXT DEFAULT 'calm',
ADD COLUMN IF NOT EXISTS active_topic TEXT,
ADD COLUMN IF NOT EXISTS state_color TEXT DEFAULT 'green',
ADD COLUMN IF NOT EXISTS auto_detection_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pattern_confidence REAL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_state_change TIMESTAMPTZ DEFAULT NOW();

-- Create index for performance on state queries
CREATE INDEX IF NOT EXISTS idx_communication_modes_state_display 
ON communication_modes(workspace_id, state_display);

-- Create index for active topic searches
CREATE INDEX IF NOT EXISTS idx_communication_modes_active_topic 
ON communication_modes(workspace_id, active_topic) 
WHERE active_topic IS NOT NULL;

-- Add RLS policy for state machine fields (extends existing policies)
-- This ensures partners can see each other's communication state
CREATE POLICY IF NOT EXISTS "communication_state_read_policy"
ON communication_modes
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Update existing rows to have default state machine values
UPDATE communication_modes 
SET 
  state_display = 'calm',
  state_color = 'green',
  auto_detection_enabled = true,
  pattern_confidence = 0.0,
  last_state_change = NOW()
WHERE state_display IS NULL;

-- Create communication state transition log for analytics
CREATE TABLE IF NOT EXISTS communication_state_transitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'auto_pattern', 'timeout', 'emergency')),
  trigger_data JSONB,
  active_topic TEXT,
  confidence_score REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS for state transitions
ALTER TABLE communication_state_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "state_transitions_workspace_access"
ON communication_state_transitions
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Create index for transition analytics
CREATE INDEX IF NOT EXISTS idx_state_transitions_workspace_time 
ON communication_state_transitions(workspace_id, created_at DESC);

-- Create function to safely update communication state
CREATE OR REPLACE FUNCTION update_communication_state(
  p_workspace_id UUID,
  p_new_state TEXT,
  p_active_topic TEXT DEFAULT NULL,
  p_trigger_type TEXT DEFAULT 'manual',
  p_trigger_data JSONB DEFAULT NULL,
  p_confidence REAL DEFAULT 0.0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_state TEXT;
  v_state_color TEXT;
  v_result JSONB;
BEGIN
  -- Validate state values
  IF p_new_state NOT IN ('calm', 'tense', 'paused') THEN
    RAISE EXCEPTION 'Invalid state: %', p_new_state;
  END IF;
  
  -- Validate trigger type
  IF p_trigger_type NOT IN ('manual', 'auto_pattern', 'timeout', 'emergency') THEN
    RAISE EXCEPTION 'Invalid trigger type: %', p_trigger_type;
  END IF;

  -- Get current state
  SELECT state_display INTO v_old_state
  FROM communication_modes
  WHERE workspace_id = p_workspace_id;

  -- Determine state color
  v_state_color := CASE 
    WHEN p_new_state = 'calm' THEN 'green'
    WHEN p_new_state = 'tense' THEN 'yellow'
    WHEN p_new_state = 'paused' THEN 'red'
    ELSE 'green'
  END;

  -- Update communication mode
  UPDATE communication_modes
  SET 
    state_display = p_new_state,
    state_color = v_state_color,
    active_topic = CASE 
      WHEN p_new_state = 'paused' THEN p_active_topic 
      ELSE NULL 
    END,
    pattern_confidence = p_confidence,
    last_state_change = NOW(),
    updated_at = NOW()
  WHERE workspace_id = p_workspace_id;

  -- Log the transition if state actually changed
  IF v_old_state IS DISTINCT FROM p_new_state THEN
    INSERT INTO communication_state_transitions (
      workspace_id, user_id, from_state, to_state, 
      trigger_type, trigger_data, active_topic, confidence_score
    ) VALUES (
      p_workspace_id, auth.uid(), 
      COALESCE(v_old_state, 'unknown'), p_new_state,
      p_trigger_type, p_trigger_data, p_active_topic, p_confidence
    );
  END IF;

  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'old_state', v_old_state,
    'new_state', p_new_state,
    'state_color', v_state_color,
    'active_topic', CASE WHEN p_new_state = 'paused' THEN p_active_topic ELSE NULL END,
    'timestamp', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_communication_state TO authenticated;

-- Create function to get current communication state for workspace
CREATE OR REPLACE FUNCTION get_communication_state(p_workspace_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'state_display', COALESCE(state_display, 'calm'),
    'state_color', COALESCE(state_color, 'green'),
    'active_topic', active_topic,
    'auto_detection_enabled', COALESCE(auto_detection_enabled, true),
    'pattern_confidence', COALESCE(pattern_confidence, 0.0),
    'last_state_change', last_state_change,
    'current_mode', current_mode,
    'timeout_end', timeout_end
  ) INTO v_result
  FROM communication_modes
  WHERE workspace_id = p_workspace_id;

  -- Return default state if no record exists
  IF v_result IS NULL THEN
    v_result := jsonb_build_object(
      'state_display', 'calm',
      'state_color', 'green',
      'active_topic', null,
      'auto_detection_enabled', true,
      'pattern_confidence', 0.0,
      'last_state_change', NOW(),
      'current_mode', 'normal',
      'timeout_end', null
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_communication_state TO authenticated;

-- Create emergency pause function (combines existing circuit breaker with state machine)
CREATE OR REPLACE FUNCTION emergency_pause_communication(
  p_workspace_id UUID,
  p_topic TEXT,
  p_duration_minutes INTEGER DEFAULT 20
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_timeout_end TIMESTAMPTZ;
BEGIN
  -- Calculate timeout end
  v_timeout_end := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;

  -- Update both circuit breaker and state machine
  UPDATE communication_modes
  SET 
    current_mode = 'paused',
    timeout_end = v_timeout_end,
    state_display = 'paused',
    state_color = 'red',
    active_topic = p_topic,
    last_state_change = NOW(),
    updated_at = NOW()
  WHERE workspace_id = p_workspace_id;

  -- Log the emergency transition
  INSERT INTO communication_state_transitions (
    workspace_id, user_id, from_state, to_state, 
    trigger_type, trigger_data, active_topic, confidence_score
  ) VALUES (
    p_workspace_id, auth.uid(), 
    'calm', 'paused',
    'emergency', 
    jsonb_build_object('duration_minutes', p_duration_minutes),
    p_topic, 
    1.0
  );

  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'state', 'paused',
    'topic', p_topic,
    'timeout_end', v_timeout_end,
    'duration_minutes', p_duration_minutes
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION emergency_pause_communication TO authenticated;
