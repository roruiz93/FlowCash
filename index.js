// Polyfill FormData for Firebase + Hermes/New Architecture compatibility
if (typeof FormData === 'undefined') {
  global.FormData = require('react-native/Libraries/Network/FormData').default;
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
