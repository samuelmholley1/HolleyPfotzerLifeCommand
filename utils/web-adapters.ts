// Web implementations for React Native components
import React from 'react';

// Alert implementation for web
const Alert = {
  alert: (title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void }>) => {
    if (buttons && buttons.length > 0) {
      if (confirm(`${title}\n\n${message || ''}`)) {
        const primaryButton = buttons.find(b => b.onPress);
        if (primaryButton && primaryButton.onPress) {
          primaryButton.onPress();
        }
      }
    } else {
      alert(`${title}\n\n${message || ''}`);
    }
  }
};

// useColorScheme hook for web
const useColorScheme = (): 'light' | 'dark' | null => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return null;
};

// Export web-specific implementations
export { Alert, useColorScheme };
