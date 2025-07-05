import React from 'react';

interface SwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  trackColor?: { false?: string; true?: string };
  thumbColor?: string;
}

const Switch: React.FC<SwitchProps> = ({
  value = false,
  onValueChange,
  disabled = false,
  style = {},
  trackColor,
  thumbColor,
}) => {
  return (
    <input
      type="checkbox"
      checked={value}
      onChange={e => onValueChange && onValueChange(e.target.checked)}
      disabled={disabled}
      style={{
        accentColor: value ? (trackColor?.true || thumbColor || '#2196F3') : (trackColor?.false || thumbColor || '#ccc'),
        width: 40,
        height: 20,
        ...style,
      }}
    />
  );
};

export default Switch;
