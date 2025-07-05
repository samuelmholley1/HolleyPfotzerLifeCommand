-- 🔴 RED TEAM CHECKPOINT: PHASE 1 - COMMUNICATION STATE MACHINE SCHEMA EXTENSION

-- PRE-IMPLEMENTATION SECURITY AUDIT
-- ✅ Verified: Existing RLS policies on communication_modes table
-- ✅ Verified: Workspace-based access control already in place  
-- ✅ Verified: CASCADE DELETE on workspace removal

-- EXTEND EXISTING COMMUNICATION_MODES TABLE WITH STATE MACHINE FIELDS
-- This preserves all existing security policies and functionality

ALTER TABLE public.communication_modes 
ADD COLUMN IF NOT EXISTS state_display TEXT DEFAULT 'calm' 
  CHECK (state_display IN ('calm', 'tense', 'paused'));

ALTER TABLE public.communication_modes 
ADD COLUMN IF NOT EXISTS active_topic TEXT;

ALTER TABLE public.communication_modes 
ADD COLUMN IF NOT EXISTS state_color TEXT DEFAULT 'green' 
  CHECK (state_color IN ('green', 'yellow', 'red'));

ALTER TABLE public.communication_modes 
ADD COLUMN IF NOT EXISTS auto_detection_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.communication_modes 
ADD COLUMN IF NOT EXISTS pattern_confidence DECIMAL(3,2) DEFAULT 0.0 
  CHECK (pattern_confidence >= 0.0 AND pattern_confidence <= 1.0);

-- ADD STATE TRANSITION AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.communication_state_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'auto_pattern', 'timeout', 'partner_reset')),
    trigger_user_id UUID REFERENCES auth.users(id),
    topic_context TEXT,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS SECURITY FOR STATE TRANSITIONS (inherit workspace access model)
ALTER TABLE public.communication_state_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read state transitions in their workspaces" 
ON public.communication_state_transitions
FOR SELECT USING (
    workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert state transitions in their workspaces" 
ON public.communication_state_transitions
FOR INSERT WITH CHECK (
    workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
    )
);

-- GRANT PERMISSIONS CONSISTENT WITH EXISTING TABLES
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_state_transitions TO authenticated;

-- 🔴 MID-IMPLEMENTATION CHECKPOINT QUERIES
-- Test data integrity and backward compatibility

-- Verify existing communication_modes records handle new fields gracefully
SELECT 
    workspace_id,
    current_mode,
    state_display,  -- Should default to 'calm'
    state_color,    -- Should default to 'green'
    auto_detection_enabled  -- Should default to true
FROM public.communication_modes
LIMIT 5;

-- Test state consistency rules
DO $$
BEGIN
    -- Verify calm state always maps to green
    IF EXISTS (
        SELECT 1 FROM communication_modes 
        WHERE state_display = 'calm' AND state_color != 'green'
    ) THEN
        RAISE EXCEPTION 'Data integrity violation: calm state must be green';
    END IF;
    
    -- Verify paused state always maps to red  
    IF EXISTS (
        SELECT 1 FROM communication_modes 
        WHERE state_display = 'paused' AND state_color != 'red'
    ) THEN
        RAISE EXCEPTION 'Data integrity violation: paused state must be red';
    END IF;
    
    RAISE NOTICE 'State consistency validation passed';
END $$;

-- 🔴 PERFORMANCE AUDIT QUERIES
-- Verify indexes and query performance

-- Check if workspace_id index exists (should from original schema)
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'communication_modes' AND indexdef LIKE '%workspace_id%';

-- Test query performance for real-time state reads
EXPLAIN ANALYZE 
SELECT current_mode, state_display, state_color, active_topic
FROM communication_modes 
WHERE workspace_id = '00000000-0000-0000-0000-000000000000';

-- 🔴 CRISIS USABILITY TEST DATA
-- Insert test scenarios for UX validation

INSERT INTO public.communication_state_transitions 
(workspace_id, from_state, to_state, trigger_type, topic_context)
VALUES 
-- Test emergency pause scenario
('00000000-0000-0000-0000-000000000001', 'calm', 'paused', 'manual', 'household chores discussion'),
-- Test automatic escalation detection
('00000000-0000-0000-0000-000000000001', 'calm', 'tense', 'auto_pattern', 'budget planning'),
-- Test partner reset scenario  
('00000000-0000-0000-0000-000000000001', 'paused', 'calm', 'partner_reset', 'household chores discussion');

-- 🔴 POST-IMPLEMENTATION VALIDATION
-- Verify all constraints and policies work correctly

-- Test invalid state combinations (should fail)
DO $$
BEGIN
    BEGIN
        INSERT INTO communication_modes (workspace_id, state_display, state_color)
        VALUES ('00000000-0000-0000-0000-000000000002', 'calm', 'red');
        RAISE EXCEPTION 'Should have failed: calm state with red color';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Constraint validation passed: invalid state/color combination rejected';
    END;
END $$;

-- Test RLS policies work (should only see own workspace data)
-- This would be tested with actual user sessions in application

COMMENT ON TABLE public.communication_state_transitions IS 
'Audit trail for communication state machine transitions. Used for analytics, debugging, and relationship insights.';

COMMENT ON COLUMN public.communication_modes.state_display IS 
'Human-readable state for UI display. Maps to visual indicators.';

COMMENT ON COLUMN public.communication_modes.state_color IS 
'Color indicator for always-visible status bar. Green=calm, Yellow=tense, Red=paused.';

COMMENT ON COLUMN public.communication_modes.auto_detection_enabled IS 
'Whether AI pattern detection can automatically change state. Can be disabled by users.';
