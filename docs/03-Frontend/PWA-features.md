# Progressive Web App Features

This document describes the Progressive Web App (PWA) implementation and capabilities for the MWAP frontend application.

## 🌟 PWA Overview

MWAP implements Progressive Web App features to provide a native app-like experience on web browsers, including offline capabilities, push notifications, and installability across devices.

### PWA Benefits
- **App-like Experience**: Native app feel with web technology
- **Offline Functionality**: Core features work without internet connection
- **Installation**: Can be installed on device home screens
- **Fast Loading**: Service worker caching for instant loading
- **Cross-platform**: Works on desktop, mobile, and tablet devices
- **Auto-updates**: Seamless updates without app store distribution

## 📱 Core PWA Features

### 1. Service Worker Implementation

#### Service Worker Registration
```typescript
// src/serviceWorker.ts
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL!, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('Service worker is ready for localhost');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Content is cached for offline use.');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}
```

#### Service Worker Strategy
```javascript
// public/sw.js
const CACHE_NAME = 'mwap-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### 2. Web App Manifest

#### Manifest Configuration
```json
{
  "name": "MWAP - Modular Web Application Platform",
  "short_name": "MWAP",
  "description": "Multi-tenant project management and cloud integration platform",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#2196f3",
  "background_color": "#ffffff",
  "categories": ["productivity", "business", "utilities"],
  "lang": "en-US",
  "dir": "ltr",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "Go to dashboard",
      "url": "/dashboard",
      "icons": [
        {
          "src": "/icons/dashboard-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Projects",
      "short_name": "Projects",
      "description": "View projects",
      "url": "/projects",
      "icons": [
        {
          "src": "/icons/projects-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Files",
      "short_name": "Files",
      "description": "Access files",
      "url": "/files",
      "icons": [
        {
          "src": "/icons/files-96x96.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard view on desktop"
    },
    {
      "src": "/screenshots/mobile-projects.png",
      "sizes": "360x640",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Projects view on mobile"
    }
  ]
}
```

### 3. Offline Functionality

#### Offline Detection
```typescript
// hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
```

#### Offline UI Components
```typescript
// components/OfflineIndicator.tsx
import { Alert, Box } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Box pos="fixed" top={0} left={0} right={0} style={{ zIndex: 1000 }}>
      <Alert
        icon={<IconWifiOff size={16} />}
        color="red"
        variant="filled"
        radius={0}
      >
        You're currently offline. Some features may be limited.
      </Alert>
    </Box>
  );
};
```

#### Offline Data Management
```typescript
// services/offlineStorage.ts
interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: number;
}

class OfflineStorageService {
  private readonly STORAGE_KEY = 'mwap_offline_actions';

  saveAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): void {
    const actions = this.getActions();
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    actions.push(newAction);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(actions));
  }

  getActions(): OfflineAction[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  clearActions(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  async syncActions(): Promise<void> {
    const actions = this.getActions();
    
    for (const action of actions) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        // Keep failed actions for retry
        continue;
      }
    }
    
    this.clearActions();
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    // Implementation depends on action type and entity
    switch (action.type) {
      case 'CREATE':
        // Call appropriate API create method
        break;
      case 'UPDATE':
        // Call appropriate API update method
        break;
      case 'DELETE':
        // Call appropriate API delete method
        break;
    }
  }
}

export const offlineStorage = new OfflineStorageService();
```

### 4. Push Notifications

#### Push Notification Setup
```typescript
// services/pushNotifications.ts
export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    this.registration = await navigator.serviceWorker.ready;
  }

  async requestPermission(): Promise<NotificationPermission> {
    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    const subscription = await this.registration!.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(
        process.env.VITE_VAPID_PUBLIC_KEY!
      ),
    });

    // Send subscription to server
    await this.sendSubscriptionToServer(subscription);
    
    return subscription;
  }

  async unsubscribe(): Promise<void> {
    if (!this.registration) return;

    const subscription = await this.registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await this.removeSubscriptionFromServer(subscription);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // Send to your backend API
    await fetch('/api/v1/push-subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    // Remove from your backend API
    await fetch('/api/v1/push-subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  }
}
```

#### Push Notification Component
```typescript
// components/NotificationSettings.tsx
import { Button, Switch, Text, Stack, Card } from '@mantine/core';
import { IconBell, IconBellOff } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { PushNotificationService } from '../services/pushNotifications';

export const NotificationSettings: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const pushService = new PushNotificationService();

  useEffect(() => {
    setPermission(Notification.permission);
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      await pushService.initialize();
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleToggleNotifications = async () => {
    setLoading(true);
    
    try {
      if (subscribed) {
        await pushService.unsubscribe();
        setSubscribed(false);
      } else {
        const newPermission = await pushService.requestPermission();
        setPermission(newPermission);
        
        if (newPermission === 'granted') {
          await pushService.subscribe();
          setSubscribed(true);
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Stack>
        <Text fw={500}>Push Notifications</Text>
        
        <Text size="sm" c="dimmed">
          Receive notifications about project updates, mentions, and important events.
        </Text>

        {permission === 'denied' ? (
          <Text size="sm" c="red">
            Notifications are blocked. Please enable them in your browser settings.
          </Text>
        ) : (
          <Switch
            label="Enable push notifications"
            checked={subscribed}
            onChange={handleToggleNotifications}
            disabled={loading}
            thumbIcon={
              subscribed ? (
                <IconBell size={12} stroke={2.5} />
              ) : (
                <IconBellOff size={12} stroke={2.5} />
              )
            }
          />
        )}
      </Stack>
    </Card>
  );
};
```

### 5. App Installation

#### Install Prompt
```typescript
// hooks/useInstallPrompt.ts
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler as any);
    window.addEventListener('appinstalled', installedHandler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setIsInstallable(false);
    
    return outcome === 'accepted';
  };

  return {
    isInstallable,
    isInstalled,
    install,
  };
};
```

#### Install Banner Component
```typescript
// components/InstallBanner.tsx
import { Alert, Button, Group, Text } from '@mantine/core';
import { IconDownload, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export const InstallBanner: React.FC = () => {
  const { isInstallable, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    const installed = await install();
    if (installed) {
      setDismissed(true);
    }
  };

  return (
    <Alert
      variant="light"
      color="blue"
      icon={<IconDownload size={16} />}
      withCloseButton
      onClose={() => setDismissed(true)}
      mb="md"
    >
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text fw={500} size="sm">Install MWAP</Text>
          <Text size="xs" c="dimmed">
            Add MWAP to your home screen for quick access
          </Text>
        </div>
        <Button size="xs" onClick={handleInstall}>
          Install
        </Button>
      </Group>
    </Alert>
  );
};
```

### 6. Background Sync

#### Background Sync Implementation
```typescript
// services/backgroundSync.ts
export class BackgroundSyncService {
  private readonly SYNC_TAG = 'mwap-background-sync';

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(this.SYNC_TAG);
  }

  async queueAction(action: any): Promise<void> {
    // Store action in IndexedDB for background sync
    const db = await this.openDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    await store.add({
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('mwap-sync', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };
    });
  }
}
```

### 7. Cache Management

#### Cache Strategies
```typescript
// services/cacheManager.ts
export class CacheManager {
  private readonly CACHE_NAME = 'mwap-data-cache';
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  async get<T>(key: string): Promise<T | null> {
    const cache = await caches.open(this.CACHE_NAME);
    const response = await cache.match(key);
    
    if (!response) return null;

    const data = await response.json();
    
    // Check if expired
    if (Date.now() - data.timestamp > this.CACHE_EXPIRY) {
      await cache.delete(key);
      return null;
    }

    return data.value;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const cache = await caches.open(this.CACHE_NAME);
    const data = {
      value,
      timestamp: Date.now(),
    };
    
    const response = new Response(JSON.stringify(data));
    await cache.put(key, response);
  }

  async delete(key: string): Promise<void> {
    const cache = await caches.open(this.CACHE_NAME);
    await cache.delete(key);
  }

  async clear(): Promise<void> {
    await caches.delete(this.CACHE_NAME);
  }
}
```

## 📊 PWA Analytics

### PWA Metrics Tracking
```typescript
// services/pwaAnalytics.ts
export class PWAAnalytics {
  trackInstallPromptShown(): void {
    // Track when install prompt is shown
    this.track('pwa_install_prompt_shown');
  }

  trackInstallAccepted(): void {
    // Track when user accepts install
    this.track('pwa_install_accepted');
  }

  trackInstallDismissed(): void {
    // Track when user dismisses install
    this.track('pwa_install_dismissed');
  }

  trackOfflineUsage(duration: number): void {
    // Track offline usage duration
    this.track('pwa_offline_usage', { duration });
  }

  trackCacheHit(resource: string): void {
    // Track cache hits for performance analysis
    this.track('pwa_cache_hit', { resource });
  }

  private track(event: string, properties?: Record<string, any>): void {
    // Send to your analytics service
    console.log('PWA Analytics:', event, properties);
  }
}
```

## 🔧 Development and Testing

### PWA Testing
```typescript
// tests/pwa.test.ts
describe('PWA Features', () => {
  it('registers service worker', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    expect(registration).toBeDefined();
  });

  it('handles offline state', () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    window.dispatchEvent(new Event('offline'));
    
    // Verify offline UI is shown
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('caches important resources', async () => {
    const cache = await caches.open('mwap-v1.0.0');
    const response = await cache.match('/');
    expect(response).toBeDefined();
  });
});
```

### PWA Debugging
```typescript
// utils/pwaDebug.ts
export const PWADebugger = {
  async checkServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      console.log('Service Worker Registration:', registration);
    }
  },

  async checkCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    console.log('Available Caches:', cacheNames);
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      console.log(`Cache ${cacheName}:`, requests.map(r => r.url));
    }
  },

  checkManifest(): void {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    console.log('Manifest Link:', manifestLink?.getAttribute('href'));
  },
};
```

---

*This PWA implementation provides a comprehensive native app experience while maintaining the benefits of web technology, ensuring MWAP works seamlessly across all devices and network conditions.* 