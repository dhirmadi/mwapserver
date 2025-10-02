# Frontend PKCE Integration - Quick Reference Guide

**🚀 Ready to integrate? Here's everything you need at a glance.**

---

## 🔥 CRITICAL - Domain Changes

```typescript
// ❌ OLD (BROKEN)
const PRODUCTION_DOMAIN = 'mwapsp.shibari.photo';  // Missing 'a'

// ✅ NEW (CORRECT)  
const PRODUCTION_DOMAIN = 'mwapps.shibari.photo';  // Fixed
```

---

## 🏗️ Environment Configuration

```typescript
const OAUTH_DOMAINS = {
  production: 'mwapps.shibari.photo',
  staging: 'mwapss.shibari.photo', 
  development: 'localhost:5173'  // or your dev port
};

const OAUTH_PROTOCOLS = {
  production: 'https',
  staging: 'https',
  development: 'http'  // http allowed for dev
};
```

---

## 🔐 PKCE Implementation

### 1. Generate PKCE Parameters
```typescript
// Generate code verifier (43-128 chars, URL-safe base64)
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate code challenge (SHA256 hash)
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

### 2. Store in Integration Metadata
```typescript
const integrationMetadata = {
  code_verifier: codeVerifier,           // Store securely
  code_challenge: codeChallenge,         // Send to OAuth provider
  code_challenge_method: 'S256',         // Use S256 (recommended)
  redirect_uri: getRedirectUri()         // Environment-specific
};
```

---

## 📄 New OAuth Pages Integration

### Popup Handling with Auto-Close
```typescript
// 1. Open OAuth popup
const popup = window.open(oauthUrl, 'oauth', 'width=500,height=600');

// 2. Listen for postMessage
window.addEventListener('message', (event) => {
  // Verify origin
  const allowedOrigins = [
    'https://mwapps.shibari.photo',   // Production
    'https://mwapss.shibari.photo',   // Staging  
    'http://localhost:3001'           // Development backend
  ];
  
  if (!allowedOrigins.includes(event.origin)) return;
  
  // Handle success
  if (event.data.type === 'oauth_success') {
    console.log('OAuth successful:', event.data);
    handleOAuthSuccess(event.data);
    popup.close();
  }
  
  // Handle error
  if (event.data.type === 'oauth_error') {
    console.error('OAuth failed:', event.data);
    handleOAuthError(event.data);
    popup.close();
  }
});

// 3. Handle manual popup close
const checkClosed = setInterval(() => {
  if (popup.closed) {
    clearInterval(checkClosed);
    handlePopupClosed();
  }
}, 1000);
```

---

## 🌐 Updated Endpoints

```typescript
// Existing (unchanged)
POST /api/v1/oauth/initiate     // Start OAuth flow
GET  /api/v1/oauth/callback     // Handle OAuth callback

// New (auto-closing pages)
GET  /api/v1/oauth/success      // Success page (auto-close in 3s)
GET  /api/v1/oauth/error        // Error page (auto-close in 5s)
```

---

## 🧪 Testing Checklist

### ✅ Development Testing
```bash
# Test domains
✅ http://localhost:5173/oauth/callback
✅ https://mwapss.shibari.photo/oauth/callback

# Test PKCE parameters
✅ code_verifier: 43-128 chars, URL-safe base64
✅ code_challenge: SHA256 hash of verifier
✅ code_challenge_method: 'S256'
```

### ✅ Production Testing  
```bash
# Test domains
✅ https://mwapps.shibari.photo/oauth/callback

# Test popup integration
✅ Auto-close after 3-5 seconds
✅ PostMessage communication
✅ Error handling
```

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid redirect URI"
```typescript
// ❌ Wrong
redirect_uri: 'http://mwapps.shibari.photo/oauth/callback'  // HTTP in prod

// ✅ Correct  
redirect_uri: 'https://mwapps.shibari.photo/oauth/callback' // HTTPS in prod
```

### Issue: "PKCE validation failed"
```typescript
// ❌ Wrong
code_verifier: 'short'  // Too short

// ✅ Correct
code_verifier: generateCodeVerifier()  // 43-128 chars
```

### Issue: "Popup not closing"
```typescript
// ❌ Wrong
// Not listening for postMessage

// ✅ Correct
window.addEventListener('message', handleOAuthMessage);
```

---

## 📞 Quick Support

### 🐛 Found a Bug?
1. Check this guide first
2. Test in development environment
3. Create GitHub issue with details
4. Tag @backend-team

### 💬 Need Help?
- **Slack**: #oauth-integration
- **Email**: engineering-team@company.com
- **Docs**: `/plans/design/` folder

---

## 🎯 Ready to Go?

1. ✅ Update domain configuration
2. ✅ Implement PKCE parameter generation  
3. ✅ Add popup postMessage handling
4. ✅ Test in development
5. ✅ Deploy to staging
6. ✅ Test end-to-end
7. ✅ Deploy to production

**🚀 You're all set! The backend is ready and waiting.**