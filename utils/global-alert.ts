// Global Alert polyfill for React Native Web
import { Alert as WebAlert } from '../utils/alert-web';

declare global {
  interface Window {
    Alert: typeof WebAlert;
  }
}

// Add to global if we're in a browser environment
if (typeof window !== 'undefined') {
  window.Alert = WebAlert;
}

export {};
