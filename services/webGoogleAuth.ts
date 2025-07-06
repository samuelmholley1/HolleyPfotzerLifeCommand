// Web-specific Google auth implementation
let webGoogleAuth: any = null;

if (typeof window !== 'undefined') {
  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if ((window as any).google) {
        resolve((window as any).google);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        // Wait for google object to be available
        const checkGoogle = () => {
          if ((window as any).google) {
            resolve((window as any).google);
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  webGoogleAuth = {
    initialize: async () => {
      const google = await loadGoogleScript();
      return google;
    },
    
    signIn: async (clientId: string) => {
      const google = await webGoogleAuth.initialize();
      
      return new Promise((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            resolve(response);
          }
        });

        google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large' }
        );

        // Trigger the sign-in flow
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup
            google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'email profile',
              callback: (tokenResponse: any) => {
                resolve(tokenResponse);
              }
            }).requestAccessToken();
          }
        });
      });
    },

    signOut: async () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
    }
  };
}

export { webGoogleAuth };
