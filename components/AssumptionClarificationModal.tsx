// Assumption Clarification System - Core of Anti-Debugging Circuit
import React, { useState } from 'react';

interface AssumptionClarificationProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (clarification: AssumptionClarification) => void;
}

interface AssumptionClarification {
  originalStatement: string;
  hiddenAssumptions: string[];
  explicitRequest: string;
  contextualInfo: string;
  emotionalState: 'calm' | 'stressed' | 'overwhelmed' | 'triggered';
}

export const AssumptionClarificationModal: React.FC<AssumptionClarificationProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [originalStatement, setOriginalStatement] = useState('');
  const [assumptions, setAssumptions] = useState(['']);
  const [explicitRequest, setExplicitRequest] = useState('');
  const [contextualInfo, setContextualInfo] = useState('');
  const [emotionalState, setEmotionalState] = useState<AssumptionClarification['emotionalState']>('calm');

  // Simple dark mode detection
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const themeStyles = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
    textColor: isDarkMode ? '#fff' : '#000',
    inputBackground: isDarkMode ? '#2a2a2a' : '#f9f9f9',
    inputBorder: isDarkMode ? '#555' : '#ddd',
    buttonColor: '#4285F4',
  };

  const addAssumption = () => {
    setAssumptions([...assumptions, '']);
  };

  const updateAssumption = (index: number, value: string) => {
    const newAssumptions = [...assumptions];
    newAssumptions[index] = value;
    setAssumptions(newAssumptions);
  };

  const removeAssumption = (index: number) => {
    setAssumptions(assumptions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!originalStatement.trim() || !explicitRequest.trim()) {
      window.alert('Missing Information: Please fill in the original statement and explicit request.');
      return;
    }

    const clarification: AssumptionClarification = {
      originalStatement,
      hiddenAssumptions: assumptions.filter(a => a.trim()),
      explicitRequest,
      contextualInfo,
      emotionalState,
    };

    onSubmit(clarification);
    setOriginalStatement('');
    setAssumptions(['']);
    setExplicitRequest('');
    setContextualInfo('');
    setEmotionalState('calm');
  };

  const emotionalStateOptions = [
    { value: 'calm', label: '😌 Calm', color: '#27ae60' },
    { value: 'stressed', label: '😰 Stressed', color: '#f39c12' },
    { value: 'overwhelmed', label: '😵 Overwhelmed', color: '#e67e22' },
    { value: 'triggered', label: '🔥 Triggered', color: '#e74c3c' },
  ] as const;

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center',
    }}>
      <div style={{
        width: '95%', maxWidth: 500, maxHeight: '90%', borderRadius: 16, padding: 20, backgroundColor: themeStyles.backgroundColor, overflowY: 'auto',
      }}>
        <h2 style={{ color: themeStyles.textColor, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
          Clarify Communication
        </h2>
        <p style={{ color: themeStyles.textColor, fontSize: 14, textAlign: 'center', marginBottom: 24, opacity: 0.8 }}>
          Break the debugging loop by making implicit assumptions explicit
        </p>
        {/* Original Statement */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: themeStyles.textColor, fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'block' }}>
            What did you just say? (exact words)
          </label>
          <textarea
            style={{
              width: '100%', border: `1px solid ${themeStyles.inputBorder}`,
              borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80, backgroundColor: themeStyles.inputBackground, color: themeStyles.textColor, marginBottom: 0,
            }}
            value={originalStatement}
            onChange={e => setOriginalStatement(e.target.value)}
            placeholder="e.g., 'I feel sick and think we should have a restful day'"
          />
        </div>
        {/* Hidden Assumptions */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: themeStyles.textColor, fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'block' }}>
            Hidden Assumptions (what you didn&apos;t say but expected)
          </label>
          {assumptions.map((assumption, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
              <textarea
                style={{
                  flex: 1, border: `1px solid ${themeStyles.inputBorder}`,
                  borderRadius: 8, padding: 12, fontSize: 14, minHeight: 60, backgroundColor: themeStyles.inputBackground, color: themeStyles.textColor, marginRight: 8,
                }}
                value={assumption}
                onChange={e => updateAssumption(index, e.target.value)}
                placeholder={`e.g., This should automatically change tomorrow's plans`}
              />
              {assumptions.length > 1 && (
                <button
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e74c3c', color: '#fff', fontWeight: 'bold', border: 'none', marginTop: 4, cursor: 'pointer' }}
                  onClick={() => removeAssumption(index)}
                  aria-label="Remove assumption"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            style={{ border: `1px dashed ${themeStyles.buttonColor}`, borderRadius: 8, padding: 12, width: '100%', background: 'none', color: themeStyles.buttonColor, fontWeight: 500, cursor: 'pointer' }}
            onClick={addAssumption}
            type="button"
          >
            + Add Assumption
          </button>
        </div>
        {/* Explicit Request */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: themeStyles.textColor, fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'block' }}>
            What do you actually need/want? (explicit request)
          </label>
          <textarea
            style={{
              width: '100%', border: `1px solid ${themeStyles.inputBorder}`,
              borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80, backgroundColor: themeStyles.inputBackground, color: themeStyles.textColor, marginBottom: 0,
            }}
            value={explicitRequest}
            onChange={e => setExplicitRequest(e.target.value)}
            placeholder="e.g., Can we discuss modifying tomorrow's plans given my current state?"
          />
        </div>
        {/* Contextual Information */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: themeStyles.textColor, fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'block' }}>
            Current Context (health, capacity, urgent factors)
          </label>
          <textarea
            style={{
              width: '100%', border: `1px solid ${themeStyles.inputBorder}`,
              borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80, backgroundColor: themeStyles.inputBackground, color: themeStyles.textColor, marginBottom: 0,
            }}
            value={contextualInfo}
            onChange={e => setContextualInfo(e.target.value)}
            placeholder="e.g., Energy at 30%, have important deadline, financial anxiety triggered"
          />
        </div>
        {/* Emotional State */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: themeStyles.textColor, fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'block' }}>
            Current Emotional State
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {emotionalStateOptions.map(option => (
              <button
                key={option.value}
                style={{
                  border: `2px solid ${option.color}`,
                  borderRadius: 20,
                  padding: '8px 16px',
                  minWidth: 100,
                  background: emotionalState === option.value ? option.color : 'transparent',
                  color: emotionalState === option.value ? '#fff' : option.color,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
                onClick={() => setEmotionalState(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            style={{ flex: 1, padding: '14px 0', borderRadius: 8, background: '#6c757d', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            style={{ flex: 1, padding: '14px 0', borderRadius: 8, background: themeStyles.buttonColor, color: '#fff', fontWeight: 600, border: 'none', fontSize: 16, cursor: 'pointer' }}
            onClick={handleSubmit}
            type="button"
          >
            Send Clarification
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssumptionClarificationModal;
