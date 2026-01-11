/**
 * Service Worker for Push Notifications
 * This file handles incoming push notifications and notification clicks
 */

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let notificationData = {
    title: 'UnravelDocs',
    body: 'You have a new notification',
    icon: '/assets/logo.svg',
    badge: '/assets/logo.svg',
    tag: 'unraveldocs-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || payload.id || notificationData.tag,
        data: payload.data || payload
      };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
      notificationData.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
      .then(() => {
        // Notify the app that a push notification was received
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_RECEIVED',
            payload: notificationData
          });
        });
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  // Handle different actions
  if (action === 'dismiss') {
    return;
  }

  // Default action or 'view' action - open or focus the app
  let targetUrl = '/notifications';

  // Determine URL based on notification type
  if (notificationData.type) {
    switch (notificationData.type) {
      case 'DOCUMENT_UPLOAD_SUCCESS':
      case 'DOCUMENT_UPLOAD_FAILED':
      case 'DOCUMENT_DELETED':
        if (notificationData.documentId) {
          targetUrl = '/documents/' + notificationData.documentId;
        } else {
          targetUrl = '/documents';
        }
        break;
      case 'OCR_PROCESSING_STARTED':
      case 'OCR_PROCESSING_COMPLETED':
      case 'OCR_PROCESSING_FAILED':
        if (notificationData.documentId) {
          targetUrl = '/ocr/' + notificationData.documentId;
        } else {
          targetUrl = '/ocr';
        }
        break;
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
      case 'PAYMENT_REFUNDED':
        targetUrl = '/subscription/billing';
        break;
      case 'SUBSCRIPTION_EXPIRING_7_DAYS':
      case 'SUBSCRIPTION_EXPIRING_3_DAYS':
      case 'SUBSCRIPTION_EXPIRING_1_DAY':
      case 'SUBSCRIPTION_EXPIRED':
      case 'SUBSCRIPTION_RENEWED':
      case 'SUBSCRIPTION_UPGRADED':
      case 'SUBSCRIPTION_DOWNGRADED':
      case 'TRIAL_EXPIRING_SOON':
      case 'TRIAL_EXPIRED':
        targetUrl = '/subscription';
        break;
      case 'TEAM_INVITATION_RECEIVED':
      case 'TEAM_MEMBER_ADDED':
      case 'TEAM_MEMBER_REMOVED':
      case 'TEAM_ROLE_CHANGED':
        targetUrl = '/teams';
        break;
      case 'STORAGE_WARNING_80':
      case 'STORAGE_WARNING_90':
      case 'STORAGE_WARNING_95':
      case 'STORAGE_LIMIT_REACHED':
        targetUrl = '/subscription/usage';
        break;
      default:
        targetUrl = '/notifications';
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate existing window to target URL and focus
            client.postMessage({
              type: 'PUSH_NOTIFICATION_CLICKED',
              payload: {
                notification: notificationData,
                action: action,
                targetUrl: targetUrl
              }
            });
            return client.focus();
          }
        }
        // If no existing window, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

