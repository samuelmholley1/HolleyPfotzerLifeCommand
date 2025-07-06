import React, { useState } from 'react';

interface AssumptionClarificationProps {
  onProposeConversation: (topic: string, assumptions: string[]) => Promise<void>;
  workspaceId: string;
}

export const AssumptionClarification: React.FC<AssumptionClarificationProps> = ({
  onProposeConversation,
  workspaceId,
}) => {
  const [conversationTopic, setConversationTopic] = useState('');
  const [myAssumptions, setMyAssumptions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode] = useState(false); // Since we don't have useColorScheme in web

  const MAX_TOPIC_LENGTH = 200;
  const MAX_ASSUMPTIONS_LENGTH = 1000;
  const MAX_ASSUMPTIONS_COUNT = 10;
  const MAX_ASSUMPTION_ITEM_LENGTH = 200;

  const handleProposeConversation = async () => {
    if (isSubmitting) return;
    
    if (!conversationTopic.trim()) {
      alert('Missing Topic: Please enter a conversation topic.');
      return;
    }

    if (conversationTopic.length > MAX_TOPIC_LENGTH) {
      alert(`Topic Too Long: Please keep the topic under ${MAX_TOPIC_LENGTH} characters.`);
      return;
    }

    if (myAssumptions.length > MAX_ASSUMPTIONS_LENGTH) {
      alert(`Assumptions Too Long: Please keep assumptions under ${MAX_ASSUMPTIONS_LENGTH} characters total.`);
      return;
    }

    const assumptionsArray = myAssumptions
      .split('\n')
      .map(assumption => assumption.trim())
      .filter(assumption => assumption.length > 0)
      .filter((assumption, index, arr) => arr.indexOf(assumption) === index);

    if (assumptionsArray.length === 0) {
      alert('Missing Assumptions: Please list at least one assumption (one per line).');
      return;
    }

    if (assumptionsArray.length > MAX_ASSUMPTIONS_COUNT) {
      alert(`Too Many Assumptions: Please limit to ${MAX_ASSUMPTIONS_COUNT} assumptions or fewer.`);
      return;
    }

    const tooLongAssumption = assumptionsArray.find(assumption => assumption.length > MAX_ASSUMPTION_ITEM_LENGTH);
    if (tooLongAssumption) {
      alert(
        `Assumption Too Long: Each assumption must be under ${MAX_ASSUMPTION_ITEM_LENGTH} characters. Please shorten: "${tooLongAssumption.substring(0, 50)}..."`
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onProposeConversation(conversationTopic, assumptionsArray);
      
      setConversationTopic('');
      setMyAssumptions('');
      
      alert('Success! Your conversation proposal has been sent to your partner for review.');
    } catch (error) {
      console.error('Error in handleProposeConversation:', error);
      alert('Error: Failed to send your conversation proposal. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: '20px',
    borderRadius: '12px',
    margin: '16px',
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    color: isDarkMode ? '#fff' : '#000',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${isDarkMode ? '#555' : '#ddd'}`,
    borderRadius: '8px',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
    color: isDarkMode ? '#fff' : '#000',
    fontFamily: 'inherit',
    resize: 'vertical',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: isSubmitting ? '#9E9E9E' : '#4285F4',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    opacity: isSubmitting ? 0.7 : 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
        Assumption Clarifier
      </h2>
      
      <p style={{ fontSize: '14px', textAlign: 'center', marginBottom: '24px', opacity: 0.8 }}>
        Make your assumptions explicit before starting a conversation
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
          Conversation Topic
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: '60px' }}
          value={conversationTopic}
          onChange={(e) => setConversationTopic(e.target.value)}
          placeholder="What do you want to discuss?"
          maxLength={MAX_TOPIC_LENGTH}
        />
        <div style={{ fontSize: '12px', textAlign: 'right', marginTop: '4px', opacity: 0.6 }}>
          {conversationTopic.length}/{MAX_TOPIC_LENGTH}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
          My Assumptions
        </label>
        <p style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.7, fontStyle: 'italic' }}>
          List your assumptions, one per line (max {MAX_ASSUMPTIONS_COUNT} assumptions, {MAX_ASSUMPTION_ITEM_LENGTH} chars each)
        </p>
        <textarea
          style={{ ...inputStyle, minHeight: '120px' }}
          value={myAssumptions}
          onChange={(e) => setMyAssumptions(e.target.value)}
          placeholder={`You already know about the deadline
You have time to discuss this now
This is urgent and needs immediate attention`}
          maxLength={MAX_ASSUMPTIONS_LENGTH}
        />
        <div style={{ fontSize: '12px', textAlign: 'right', marginTop: '4px', opacity: 0.6 }}>
          {myAssumptions.length}/{MAX_ASSUMPTIONS_LENGTH}
        </div>
      </div>

      <button 
        style={buttonStyle}
        onClick={handleProposeConversation}
        disabled={isSubmitting}
      >
        {isSubmitting && <span>⏳</span>}
        {isSubmitting ? 'Sending...' : 'Propose Conversation'}
      </button>
    </div>
  );
};
