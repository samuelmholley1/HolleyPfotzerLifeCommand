// types/global.d.ts

// This tells TypeScript that the 'google' object, provided by the
// Google Identity Services script, exists on the global window object.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (momentNotification?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
          revoke: (email: string, done: () => void) => void;
        };
      };
    };
  }
}

// This empty export is required to make the file a module and allow declarations to be merged.
export {};
