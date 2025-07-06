// Web-specific Alert implementation
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
