/**
 * @format
 * Web entry point for React Native Web
 */

import { AppRegistry } from 'react-native';
import App from './App';
import appConfig from './app.json';
import { loadGoogleAuthScript } from './lib/google-auth-web-helper';

// Load Google Auth API for proper sign-out handling
loadGoogleAuthScript();

// Register the app component
AppRegistry.registerComponent(appConfig.name, () => App);

// Run the application
AppRegistry.runApplication(appConfig.name, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
