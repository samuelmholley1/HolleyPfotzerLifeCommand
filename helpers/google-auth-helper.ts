// google-auth-helper.ts
// Helper for Google Identity Services authentication

export function getGoogleIdToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Ensure GIS script is loaded
    if (typeof window === 'undefined') {
      reject(new Error('Not running in a browser environment'));
      return;
    }
    const clientId =
      process.env.REACT_APP_GOOGLE_CLIENT_ID ||
      process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      reject(new Error('Google Client ID not found in environment variables'));
      return;
    }
    // Load GIS script if not already present
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        initializeGis();
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
      document.head.appendChild(script);
    } else {
      initializeGis();
    }

    function initializeGis() {
      let resolved = false;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response.credential) {
            resolved = true;
            resolve(response.credential);
          } else {
            reject(new Error('No credential returned from Google'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
          if (!resolved) reject(new Error('Google sign-in was cancelled or failed to display'));
        }
      });
    }
  });
}
