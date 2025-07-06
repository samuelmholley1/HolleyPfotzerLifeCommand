// React Native Web type declarations for seamless web compatibility

declare module 'react-native' {
  import * as RNWeb from 'react-native-web';
  
  // Core components
  export const View: typeof RNWeb.View;
  export const Text: typeof RNWeb.Text;
  export const TouchableOpacity: typeof RNWeb.TouchableOpacity;
  export const TextInput: typeof RNWeb.TextInput;
  export const ScrollView: typeof RNWeb.ScrollView;
  export const Image: typeof RNWeb.Image;
  export const Modal: typeof RNWeb.Modal;
  export const ActivityIndicator: typeof RNWeb.ActivityIndicator;
  export const Animated: typeof RNWeb.Animated;
  export const FlatList: typeof RNWeb.FlatList;
  export const RefreshControl: typeof RNWeb.RefreshControl;
  
  // StyleSheet
  export const StyleSheet: typeof RNWeb.StyleSheet;
  
  // Hooks and utilities
  export const useColorScheme: () => 'light' | 'dark' | null;
  
  // Types
  export type StyleProp<T> = RNWeb.StyleProp<T>;
  export type ViewStyle = RNWeb.ViewStyle;
  export type TextStyle = RNWeb.TextStyle;
  export type ImageStyle = RNWeb.ImageStyle;
  
  // Alert interface with proper button types
  export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }
  
  export const Alert: {
    alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  };
  
  // Switch component (web implementation)
  export const Switch: React.FC<{
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    style?: RNWeb.StyleProp<RNWeb.ViewStyle>;
    trackColor?: { false?: string; true?: string };
    thumbColor?: string;
    disabled?: boolean;
  }>;
  
  // Re-export everything else from react-native-web
  export * from 'react-native-web';
}
