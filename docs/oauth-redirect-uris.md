# OAuth Redirect URI Configuration

This document specifies the exact redirect URIs that must be registered with OAuth providers (Dropbox, etc.) for the MWAP application.

## 🔗 Required Redirect URIs

### Production Environment
- **Server**: `mwapsp.shibari.photo`
- **Redirect URI**: `https://mwapsp.shibari.photo/api/v1/oauth/callback`
- **Environment**: `NODE_ENV=production`
- **Protocol**: HTTPS (enforced)

### Staging/Development Environment  
- **Server**: `mwapss.shibari.photo`
- **Redirect URI**: `https://mwapss.shibari.photo/api/v1/oauth/callback`
- **Environment**: `NODE_ENV=development` or `NODE_ENV=staging`
- **Protocol**: HTTPS (recommended)

### Local Development
- **Servers**: `localhost`, `127.0.0.1`
- **Redirect URIs**: 
  - `http://localhost:3001/api/v1/oauth/callback`
  - `http://127.0.0.1:3001/api/v1/oauth/callback`
- **Environment**: `NODE_ENV=development`
- **Protocol**: HTTP (allowed for localhost only)

## 📋 Dropbox App Configuration

When configuring your Dropbox app, add these exact redirect URIs:

```
https://mwapsp.shibari.photo/api/v1/oauth/callback
https://mwapss.shibari.photo/api/v1/oauth/callback
http://localhost:3001/api/v1/oauth/callback
http://127.0.0.1:3001/api/v1/oauth/callback
```

## 🔒 Security Notes

1. **HTTPS Enforcement**: Production environment automatically enforces HTTPS redirect URIs
2. **Host Validation**: Only the specified hosts are allowed in the security service
3. **Path Validation**: Only `/api/v1/oauth/callback` path is accepted
4. **Environment Detection**: The system automatically detects the environment and applies appropriate protocol rules

## 🚨 Common Issues

### "redirect_uri_mismatch" Error
- **Cause**: The redirect URI in your Dropbox app doesn't exactly match what the server constructs
- **Solution**: Ensure the redirect URI in Dropbox matches exactly (including protocol and path)

### HTTP in Production Error
- **Cause**: Server is constructing HTTP redirect URI in production environment
- **Solution**: Verify `NODE_ENV=production` is set and `app.enable('trust proxy')` is configured

### Host Not Allowed Error
- **Cause**: Request is coming from a domain not in the allowed hosts list
- **Solution**: Add the domain to `ALLOWED_REDIRECT_HOSTS` in `oauthCallbackSecurity.service.ts`

## 🔧 Environment Variables

Ensure these environment variables are set correctly:

```bash
# Production
NODE_ENV=production

# Staging
NODE_ENV=development  # or NODE_ENV=staging

# Local Development  
NODE_ENV=development
```

## 📝 Testing

Use the provided test suite to validate redirect URI handling:

```bash
npm test tests/oauth/redirect-uri-validation.test.ts
```

The tests cover:
- HTTPS enforcement in production
- HTTP acceptance in development
- Host validation
- Path validation
- Environment-specific protocol handling