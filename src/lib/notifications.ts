export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const sendLocalNotification = (title: string, body: string, icon?: string) => {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker for PWA push
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `skyhigh-${Date.now()}`,
          silent: false,
        });
      });
    } else {
      // Fallback
      new Notification(title, {
        body,
        icon: icon || '/pwa-192x192.png'
      });
    }
  }
};
