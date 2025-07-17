# 📱 MWAP Progressive Web App Features

## 🎯 Overview

MWAP is designed as a Progressive Web App (PWA) that provides native app-like experiences across all devices. The PWA implementation ensures offline functionality, push notifications, and seamless installation while maintaining security and performance standards.

## 🚀 PWA Core Features

### **1. App Manifest**
```json
{
  "name": "MWAP - Modular Web Application Platform",
  "short_name": "MWAP",
  "description": "Secure, scalable SaaS platform for multi-tenant applications",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "categories": ["productivity", "business"],
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### **2. Service Worker Implementation**
```typescript
// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Service Worker Strategy
const CACHE_NAME = 'mwap-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch Event - Network First Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
```

### **3. Offline Functionality**
```typescript
// Offline Detection Hook
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

// Offline Data Sync
export const useOfflineSync = () => {
  const [pendingActions, setPendingActions] = useState<Action[]>([]);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      // Sync pending actions when back online
      syncPendingActions(pendingActions);
      setPendingActions([]);
    }
  }, [isOnline, pendingActions]);

  const addPendingAction = (action: Action) => {
    setPendingActions(prev => [...prev, action]);
  };

  return { addPendingAction, pendingActions };
};
```

## 🔔 Push Notifications

### **Notification Setup**
```typescript
// Push Notification Registration
export const registerPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications not supported');
  }

  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  // Send subscription to server
  await fetch('/api/v1/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(subscription)
  });

  return subscription;
};

// Notification Types
interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
}

// Handle Push Events in Service Worker
self.addEventListener('push', (event) => {
  const options: NotificationPayload = event.data?.json() || {};
  
  event.waitUntil(
    self.registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/badge-72x72.png',
      tag: options.tag,
      data: options.data,
      actions: options.actions
    })
  );
});
```

### **Notification Categories**
```typescript
// Project Notifications
interface ProjectNotification {
  type: 'project_update' | 'project_invite' | 'project_deadline';
  projectId: string;
  message: string;
  actionUrl?: string;
}

// System Notifications
interface SystemNotification {
  type: 'maintenance' | 'security_alert' | 'feature_update';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

// Team Notifications
interface TeamNotification {
  type: 'team_invite' | 'role_change' | 'team_update';
  tenantId: string;
  message: string;
  actionRequired?: boolean;
}
```

## 💾 Local Storage & Caching

### **Data Persistence Strategy**
```typescript
// IndexedDB for Structured Data
import { openDB, DBSchema } from 'idb';

interface MWAPDatabase extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-tenant': string };
  };
  files: {
    key: string;
    value: FileMetadata;
    indexes: { 'by-project': string };
  };
  cache: {
    key: string;
    value: {
      data: any;
      timestamp: number;
      expiry: number;
    };
  };
}

const db = await openDB<MWAPDatabase>('mwap-db', 1, {
  upgrade(db) {
    const projectStore = db.createObjectStore('projects', {
      keyPath: 'id'
    });
    projectStore.createIndex('by-tenant', 'tenantId');

    const fileStore = db.createObjectStore('files', {
      keyPath: 'id'
    });
    fileStore.createIndex('by-project', 'projectId');

    db.createObjectStore('cache', {
      keyPath: 'key'
    });
  }
});

// Cache Management Hook
export const useLocalCache = <T>(key: string, ttl: number = 3600000) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const getCachedData = async (): Promise<T | null> => {
    const cached = await db.get('cache', key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  };

  const setCachedData = async (data: T) => {
    await db.put('cache', {
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
    setData(data);
  };

  return { data, loading, getCachedData, setCachedData };
};
```

### **Background Sync**
```typescript
// Background Sync Registration
export const registerBackgroundSync = async (tag: string) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
  }
};

// Background Sync Handler in Service Worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'project-sync') {
    event.waitUntil(syncProjects());
  } else if (event.tag === 'file-upload') {
    event.waitUntil(syncFileUploads());
  }
});

const syncProjects = async () => {
  // Sync project data when connection is restored
  const pendingProjects = await getStoredPendingProjects();
  
  for (const project of pendingProjects) {
    try {
      await fetch('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getStoredToken()}`
        },
        body: JSON.stringify(project)
      });
      
      await removePendingProject(project.id);
    } catch (error) {
      console.error('Failed to sync project:', error);
    }
  }
};
```

## 📱 Installation & App-like Experience

### **Install Prompt**
```typescript
// Install Prompt Component
export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="install-prompt">
      <p>Install MWAP for a better experience!</p>
      <button onClick={handleInstallClick}>Install</button>
      <button onClick={() => setShowInstallPrompt(false)}>Later</button>
    </div>
  );
};
```

### **App Shell Architecture**
```typescript
// App Shell Component
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth0();
  const isOnline = useOnlineStatus();

  return (
    <div className="app-shell">
      <Header user={user} isOnline={isOnline} />
      <Navigation />
      <main className="app-content">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <InstallPrompt />
      <OfflineIndicator isOnline={isOnline} />
    </div>
  );
};

// Offline Indicator
const OfflineIndicator: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="offline-indicator">
      <Icon name="wifi-off" />
      <span>You're offline. Changes will sync when connection is restored.</span>
    </div>
  );
};
```

## 🔧 PWA Development Tools

### **PWA Testing Checklist**
```typescript
// PWA Audit Function
export const auditPWA = async () => {
  const checks = {
    manifest: await checkManifest(),
    serviceWorker: await checkServiceWorker(),
    https: checkHTTPS(),
    responsive: await checkResponsive(),
    offline: await checkOffline(),
    installable: await checkInstallable()
  };

  return checks;
};

const checkManifest = async () => {
  try {
    const response = await fetch('/manifest.json');
    const manifest = await response.json();
    
    return {
      exists: true,
      hasName: !!manifest.name,
      hasIcons: manifest.icons?.length > 0,
      hasStartUrl: !!manifest.start_url,
      hasDisplay: !!manifest.display
    };
  } catch {
    return { exists: false };
  }
};
```

### **Performance Monitoring**
```typescript
// PWA Performance Metrics
export const trackPWAMetrics = () => {
  // Track installation events
  window.addEventListener('appinstalled', () => {
    analytics.track('pwa_installed');
  });

  // Track offline usage
  window.addEventListener('offline', () => {
    analytics.track('went_offline');
  });

  window.addEventListener('online', () => {
    analytics.track('came_online');
  });

  // Track service worker updates
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    analytics.track('sw_updated');
  });
};

// Core Web Vitals for PWA
export const measurePWAVitals = () => {
  // Measure app shell load time
  const appShellLoadTime = performance.now();
  
  // Measure time to interactive
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        analytics.track('pwa_load_time', {
          loadTime: entry.loadEventEnd - entry.loadEventStart
        });
      }
    }
  });
  
  observer.observe({ entryTypes: ['navigation'] });
};
```

## 📊 PWA Analytics & Monitoring

### **Usage Tracking**
```typescript
// PWA-specific analytics
interface PWAAnalytics {
  installationRate: number;
  offlineUsage: number;
  pushNotificationEngagement: number;
  backgroundSyncSuccess: number;
  cacheHitRate: number;
}

// Track PWA engagement
export const trackPWAEngagement = () => {
  // Track how often users use the app offline
  const trackOfflineUsage = () => {
    if (!navigator.onLine) {
      const startTime = Date.now();
      
      const handleOnline = () => {
        const offlineTime = Date.now() - startTime;
        analytics.track('offline_session', { duration: offlineTime });
        window.removeEventListener('online', handleOnline);
      };
      
      window.addEventListener('online', handleOnline);
    }
  };

  // Track push notification interactions
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data.type === 'notification_clicked') {
      analytics.track('push_notification_clicked', {
        notificationType: event.data.notificationType
      });
    }
  });
};
```

## 🔒 PWA Security Considerations

### **Secure Service Worker**
```typescript
// Secure service worker implementation
const ALLOWED_ORIGINS = ['https://api.mwap.com', 'https://auth.mwap.com'];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache requests from allowed origins
  if (!ALLOWED_ORIGINS.includes(url.origin)) {
    return;
  }

  // Validate request headers
  if (event.request.headers.get('Authorization')) {
    // Handle authenticated requests securely
    event.respondWith(handleAuthenticatedRequest(event.request));
  } else {
    // Handle public requests
    event.respondWith(handlePublicRequest(event.request));
  }
});

// Secure token storage
const storeTokenSecurely = async (token: string) => {
  // Use IndexedDB with encryption for token storage
  const encryptedToken = await encrypt(token);
  await db.put('secure', { key: 'auth_token', value: encryptedToken });
};
```

### **Content Security Policy for PWA**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.auth0.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.mwap.com https://*.auth0.com;
  manifest-src 'self';
  worker-src 'self';
">
```

---

## 📚 Related Documentation

- [🏗️ Frontend Architecture](./architecture.md) - Overall frontend architecture
- [🔐 Authentication](./authentication.md) - Auth0 integration patterns
- [🧩 Component Structure](./component-structure.md) - Component organization
- [🔌 API Integration](./api-integration.md) - Backend API integration

---

*MWAP's PWA implementation provides a native app-like experience while maintaining web accessibility and security standards, ensuring users can be productive regardless of network conditions.*