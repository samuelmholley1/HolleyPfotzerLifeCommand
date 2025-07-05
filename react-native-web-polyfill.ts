// React Native Web polyfill for components
import React from 'react';
import { CSSProperties } from 'react';

// Basic style type
type Style = CSSProperties;

// View component (maps to div)
export const View: React.FC<{ style?: Style; children?: React.ReactNode; [key: string]: any }> = ({ 
  style, 
  children, 
  ...props 
}) => (
  <div style={style} {...props}>
    {children}
  </div>
);

// Text component (maps to span/p)
export const Text: React.FC<{ style?: Style; children?: React.ReactNode; [key: string]: any }> = ({ 
  style, 
  children, 
  ...props 
}) => (
  <span style={style} {...props}>
    {children}
  </span>
);

// TouchableOpacity component (maps to button)
export const TouchableOpacity: React.FC<{ 
  style?: Style; 
  onPress?: () => void;
  children?: React.ReactNode;
  [key: string]: any;
}> = ({ 
  style, 
  onPress, 
  children, 
  ...props 
}) => (
  <button 
    style={{ 
      background: 'none', 
      border: 'none', 
      padding: 0, 
      margin: 0,
      cursor: 'pointer',
      ...style 
    }} 
    onClick={onPress}
    {...props}
  >
    {children}
  </button>
);

// TextInput component (maps to input)
export const TextInput: React.FC<{ 
  style?: Style; 
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  [key: string]: any;
}> = ({ 
  style, 
  value, 
  onChangeText, 
  placeholder,
  ...props 
}) => (
  <input 
    style={style}
    value={value}
    onChange={(e) => onChangeText && onChangeText(e.target.value)}
    placeholder={placeholder}
    {...props}
  />
);

// ScrollView component (maps to div with overflow)
export const ScrollView: React.FC<{ style?: Style; children?: React.ReactNode; [key: string]: any }> = ({ 
  style, 
  children, 
  ...props 
}) => (
  <div style={{ overflow: 'auto', ...style }} {...props}>
    {children}
  </div>
);

// Image component
export const Image: React.FC<{ 
  style?: Style; 
  source?: { uri?: string } | any;
  [key: string]: any;
}> = ({ 
  style, 
  source, 
  ...props 
}) => (
  <img 
    style={style}
    src={source?.uri || source}
    {...props}
  />
);

// Modal component (basic implementation)
export const Modal: React.FC<{ 
  visible?: boolean;
  style?: Style; 
  children?: React.ReactNode;
  [key: string]: any;
}> = ({ 
  visible = true,
  style, 
  children, 
  ...props 
}) => {
  if (!visible) return null;
  
  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        ...style 
      }} 
      {...props}
    >
      {children}
    </div>
  );
};

// ActivityIndicator component (basic spinner)
export const ActivityIndicator: React.FC<{ 
  style?: Style; 
  size?: 'small' | 'large';
  color?: string;
  [key: string]: any;
}> = ({ 
  style, 
  size = 'small',
  color = '#000',
  ...props 
}) => (
  <div 
    style={{ 
      width: size === 'large' ? 40 : 20,
      height: size === 'large' ? 40 : 20,
      border: `2px solid ${color}`,
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      ...style 
    }}
    {...props}
  />
);

// StyleSheet
export const StyleSheet = {
  create: <T extends Record<string, Style>>(styles: T): T => styles,
  flatten: (style: any) => style,
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  absoluteFillObject: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hairlineWidth: 1,
};

// Alert
export const Alert = {
  alert: (title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    if (buttons && buttons.length > 0) {
      // For multiple buttons, show a confirm dialog
      let userResponse = true;
      if (buttons.length > 1) {
        userResponse = confirm(`${title}\n\n${message || ''}`);
      } else {
        alert(`${title}\n\n${message || ''}`);
        userResponse = true;
      }
      
      if (userResponse) {
        // Find the primary button (not cancel)
        const primaryButton = buttons.find(b => b.style !== 'cancel' && b.onPress);
        if (primaryButton && primaryButton.onPress) {
          primaryButton.onPress();
        }
      } else {
        // Find the cancel button
        const cancelButton = buttons.find(b => b.style === 'cancel' && b.onPress);
        if (cancelButton && cancelButton.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      alert(`${title}\n\n${message || ''}`);
    }
  }
};

// useColorScheme hook
export const useColorScheme = (): 'light' | 'dark' | null => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return null;
};

// Animated (basic implementation)
export const Animated = {
  View,
  Text,
  Value: class {
    constructor(public value: number) {}
    setValue(value: number) { this.value = value; }
  },
  timing: () => ({ start: () => {} }),
  spring: () => ({ start: () => {} }),
  decay: () => ({ start: () => {} }),
  sequence: () => ({ start: () => {} }),
  parallel: () => ({ start: () => {} }),
  stagger: () => ({ start: () => {} }),
  loop: () => ({ start: () => {} }),
};

// Add CSS for spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
