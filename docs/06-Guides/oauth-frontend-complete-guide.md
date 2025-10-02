# Complete Frontend Guide: Cloud Provider Integration Feature

**Last Updated:** 2024-10-01  
**Audience:** Frontend React/TypeScript Developers  
**Status:** ✅ Production Ready

This guide walks you through building a complete cloud provider integration feature from scratch, covering the entire user journey with working code examples.

---

## 📋 Table of Contents

1. [Feature Overview](#feature-overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Complete Code Examples](#complete-code-examples)
5. [TypeScript Interfaces](#typescript-interfaces)
6. [State Management](#state-management)
7. [Error Handling & Recovery](#error-handling--recovery)
8. [Development & Testing](#development--testing)

---

## 🎯 Feature Overview

### What We're Building

A cloud provider integration feature that allows users to:
- View available cloud providers (Dropbox, Google Drive, OneDrive)
- Connect their accounts via OAuth
- See connection status for each provider
- Reconnect expired integrations
- Disconnect providers

### Complete User Journey

```
┌────────────────────────────────────────────────────────────────┐
│ 1. User views "Cloud Providers" page                           │
│    → Fetches available providers                               │
│    → Fetches existing integrations for tenant                  │
│    → Shows connected vs available providers                    │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 2. User clicks "Connect Dropbox"                               │
│    → Creates integration record (status: 'active')             │
│    → Gets integration ID from response                         │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 3. Frontend starts OAuth flow                                  │
│    → Calls /oauth/.../initiate with integration ID            │
│    → Gets authorization URL                                    │
│    → Opens popup window                                        │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 4. User authorizes in popup                                    │
│    → OAuth provider shows consent screen                       │
│    → User grants permissions                                   │
│    → Provider redirects to backend callback                    │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 5. Backend processes callback                                  │
│    → Validates state parameter                                 │
│    → Exchanges code for tokens                                 │
│    → Stores tokens in integration record                       │
│    → Redirects popup to success page                           │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 6. Success page sends postMessage                              │
│    → Parent window receives message                            │
│    → Refetches integrations (now shows tokens connected)       │
│    → Closes popup                                              │
│    → Shows success notification                                │
└────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Prerequisites

### Backend Endpoints Used

```typescript
// 1. Get available cloud providers
GET /api/v1/cloud-providers
Response: CloudProvider[]

// 2. Get tenant's integrations
GET /api/v1/tenants/:tenantId/integrations
Response: Integration[]

// 3. Create integration (before OAuth)
POST /api/v1/tenants/:tenantId/integrations
Body: { providerId: string, status?: string }
Response: Integration

// 4. Start OAuth flow
POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/initiate
Response: { authorizationUrl, provider, redirectUri, state }

// 5. Check integration health (optional)
GET /api/v1/tenants/:tenantId/integrations/:integrationId/health
Response: { healthy: boolean, lastChecked: string }

// 6. Refresh tokens (when expired)
POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh
Response: Integration (with redacted tokens)

// 7. Delete integration
DELETE /api/v1/tenants/:tenantId/integrations/:integrationId
Response: 204 No Content
```

### Required State

```typescript
// From your auth context/hook
const { tenantId, jwtToken } = useAuth();
```

---

## 🚀 Step-by-Step Implementation

### Step 1: TypeScript Interfaces

Create `types/cloudProviders.ts`:

```typescript
// types/cloudProviders.ts

/**
 * Cloud provider configuration
 */
export interface CloudProvider {
  _id: string;
  name: string;              // e.g., "dropbox", "google-drive"
  displayName: string;       // e.g., "Dropbox", "Google Drive"
  slug: string;              // URL-friendly identifier
  scopes: string[];          // OAuth scopes required
  authUrl: string;           // OAuth authorization URL
  tokenUrl: string;          // OAuth token exchange URL
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cloud provider integration for a tenant
 */
export interface Integration {
  _id: string;
  tenantId: string;
  providerId: string;
  status: IntegrationStatus;
  accessToken?: string;      // Redacted in API responses
  refreshToken?: string;     // Redacted in API responses
  tokenExpiresAt?: string;   // ISO date string
  scopesGranted?: string[];
  connectedAt?: string;      // ISO date string when tokens were first obtained
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;         // User ID who created integration
}

/**
 * Integration status values
 */
export type IntegrationStatus = 
  | 'active'   // Connected and working
  | 'expired'  // Tokens expired, needs refresh
  | 'revoked'  // User revoked access, needs reauth
  | 'error';   // Error state, may need debugging

/**
 * Integration health check response
 */
export interface IntegrationHealth {
  healthy: boolean;
  lastChecked: string;
  error?: string;
}

/**
 * Request body for creating integration
 */
export interface CreateIntegrationDto {
  providerId: string;
  status?: 'active';
  metadata?: Record<string, unknown>;
}

/**
 * OAuth initiation response
 */
export interface OAuthInitiationResponse {
  authorizationUrl: string;
  provider: {
    name: string;
    displayName: string;
  };
  redirectUri: string;
  state: string;
}

/**
 * postMessage data from OAuth success page
 */
export interface OAuthSuccessMessage {
  type: 'oauth_success';
  tenantId: string;
  integrationId: string;
}

/**
 * postMessage data from OAuth error page
 */
export interface OAuthErrorMessage {
  type: 'oauth_error';
  message: string;
  code: string;
}

/**
 * API response wrapper
 */
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: any } };
```

---

### Step 2: API Client

Create `api/cloudProviders.ts`:

```typescript
// api/cloudProviders.ts

import { 
  CloudProvider, 
  Integration, 
  CreateIntegrationDto,
  IntegrationHealth,
  ApiResponse 
} from '../types/cloudProviders';

/**
 * API client for cloud provider operations
 */
export class CloudProvidersAPI {
  constructor(private baseUrl: string = '/api/v1') {}

  /**
   * Get all available cloud providers
   */
  async getProviders(token: string): Promise<CloudProvider[]> {
    const response = await fetch(`${this.baseUrl}/cloud-providers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.statusText}`);
    }

    const data: ApiResponse<CloudProvider[]> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error.message);
    }

    return data.data;
  }

  /**
   * Get all integrations for a tenant
   */
  async getIntegrations(tenantId: string, token: string): Promise<Integration[]> {
    const response = await fetch(
      `${this.baseUrl}/tenants/${tenantId}/integrations`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch integrations: ${response.statusText}`);
    }

    const data: ApiResponse<Integration[]> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error.message);
    }

    return data.data;
  }

  /**
   * Create a new integration (before starting OAuth)
   */
  async createIntegration(
    tenantId: string,
    dto: CreateIntegrationDto,
    token: string
  ): Promise<Integration> {
    const response = await fetch(
      `${this.baseUrl}/tenants/${tenantId}/integrations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dto)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create integration: ${response.statusText}`);
    }

    const data: ApiResponse<Integration> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error.message);
    }

    return data.data;
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(
    tenantId: string,
    integrationId: string,
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/tenants/${tenantId}/integrations/${integrationId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete integration: ${response.statusText}`);
    }
  }

  /**
   * Check integration health
   */
  async checkHealth(
    tenantId: string,
    integrationId: string,
    token: string
  ): Promise<IntegrationHealth> {
    const response = await fetch(
      `${this.baseUrl}/tenants/${tenantId}/integrations/${integrationId}/health`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check health: ${response.statusText}`);
    }

    const data: ApiResponse<IntegrationHealth> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error.message);
    }

    return data.data;
  }

  /**
   * Manually refresh integration tokens
   */
  async refreshToken(
    tenantId: string,
    integrationId: string,
    token: string
  ): Promise<Integration> {
    const response = await fetch(
      `${this.baseUrl}/oauth/tenants/${tenantId}/integrations/${integrationId}/refresh`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data: ApiResponse<Integration> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error.message);
    }

    return data.data;
  }
}

// Export singleton instance
export const cloudProvidersAPI = new CloudProvidersAPI();
```

---

### Step 3: OAuth Hook (from original guide)

Create `hooks/useOAuthIntegration.ts`:

```typescript
// hooks/useOAuthIntegration.ts
// (From original guide - included here for completeness)

import { useState } from 'react';
import { OAuthSuccessMessage, OAuthErrorMessage } from '../types/cloudProviders';

export function useOAuthIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startOAuthFlow = async (
    tenantId: string,
    integrationId: string,
    jwtToken: string
  ): Promise<OAuthSuccessMessage> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Request authorization URL from backend
      const response = await fetch(
        `/api/v1/oauth/tenants/${tenantId}/integrations/${integrationId}/initiate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to initiate OAuth: ${response.statusText}`);
      }

      const data = await response.json();

      // 2. Open OAuth in popup window
      const popup = window.open(
        data.authorizationUrl,
        'oauth',
        'width=600,height=700,scrollbars=yes'
      );

      if (!popup) {
        throw new Error('Failed to open OAuth popup. Please allow popups for this site.');
      }

      // 3. Wait for OAuth completion
      return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          const data = event.data as OAuthSuccessMessage | OAuthErrorMessage;

          if (data.type === 'oauth_success') {
            window.removeEventListener('message', messageHandler);
            clearInterval(popupCheck);
            setIsLoading(false);
            resolve(data);
          } else if (data.type === 'oauth_error') {
            window.removeEventListener('message', messageHandler);
            clearInterval(popupCheck);
            setIsLoading(false);
            setError(data.message);
            reject(new Error(data.message));
          }
        };

        window.addEventListener('message', messageHandler);

        const popupCheck = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupCheck);
            window.removeEventListener('message', messageHandler);
            setIsLoading(false);
            setError('OAuth window closed');
            reject(new Error('OAuth window was closed before completion'));
          }
        }, 500);
      });
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  return { startOAuthFlow, isLoading, error };
}
```

---

### Step 4: Custom Hooks for Data Management

Create `hooks/useCloudProviders.ts`:

```typescript
// hooks/useCloudProviders.ts

import { useState, useEffect } from 'react';
import { CloudProvider } from '../types/cloudProviders';
import { cloudProvidersAPI } from '../api/cloudProviders';
import { useAuth } from './useAuth'; // Your auth hook

/**
 * Hook to fetch and manage cloud providers
 */
export function useCloudProviders() {
  const { jwtToken } = useAuth();
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    if (!jwtToken) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await cloudProvidersAPI.getProviders(jwtToken);
      setProviders(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch providers';
      setError(message);
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [jwtToken]);

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders
  };
}
```

Create `hooks/useIntegrations.ts`:

```typescript
// hooks/useIntegrations.ts

import { useState, useEffect, useCallback } from 'react';
import { Integration, CreateIntegrationDto } from '../types/cloudProviders';
import { cloudProvidersAPI } from '../api/cloudProviders';
import { useAuth } from './useAuth';

/**
 * Hook to fetch and manage cloud provider integrations
 */
export function useIntegrations() {
  const { tenantId, jwtToken } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!tenantId || !jwtToken) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await cloudProvidersAPI.getIntegrations(tenantId, jwtToken);
      setIntegrations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch integrations';
      setError(message);
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, jwtToken]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const createIntegration = useCallback(async (dto: CreateIntegrationDto) => {
    if (!tenantId || !jwtToken) {
      throw new Error('Tenant ID or token not available');
    }

    const integration = await cloudProvidersAPI.createIntegration(
      tenantId,
      dto,
      jwtToken
    );

    // Optimistically add to local state
    setIntegrations(prev => [...prev, integration]);

    return integration;
  }, [tenantId, jwtToken]);

  const deleteIntegration = useCallback(async (integrationId: string) => {
    if (!tenantId || !jwtToken) {
      throw new Error('Tenant ID or token not available');
    }

    await cloudProvidersAPI.deleteIntegration(tenantId, integrationId, jwtToken);

    // Optimistically remove from local state
    setIntegrations(prev => prev.filter(i => i._id !== integrationId));
  }, [tenantId, jwtToken]);

  const refreshToken = useCallback(async (integrationId: string) => {
    if (!tenantId || !jwtToken) {
      throw new Error('Tenant ID or token not available');
    }

    const updatedIntegration = await cloudProvidersAPI.refreshToken(
      tenantId,
      integrationId,
      jwtToken
    );

    // Update in local state
    setIntegrations(prev => 
      prev.map(i => i._id === integrationId ? updatedIntegration : i)
    );

    return updatedIntegration;
  }, [tenantId, jwtToken]);

  return {
    integrations,
    loading,
    error,
    refetch: fetchIntegrations,
    createIntegration,
    deleteIntegration,
    refreshToken
  };
}
```

---

### Step 5: Main Component

Create `components/CloudProvidersList.tsx`:

```typescript
// components/CloudProvidersList.tsx

import React, { useState } from 'react';
import { useCloudProviders } from '../hooks/useCloudProviders';
import { useIntegrations } from '../hooks/useIntegrations';
import { useOAuthIntegration } from '../hooks/useOAuthIntegration';
import { useAuth } from '../hooks/useAuth';
import { CloudProvider, Integration } from '../types/cloudProviders';

export function CloudProvidersList() {
  const { tenantId, jwtToken } = useAuth();
  const { providers, loading: providersLoading } = useCloudProviders();
  const { 
    integrations, 
    loading: integrationsLoading,
    refetch: refetchIntegrations,
    createIntegration,
    deleteIntegration 
  } = useIntegrations();
  const { startOAuthFlow, isLoading: oauthLoading } = useOAuthIntegration();
  
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  // Separate connected and available providers
  const connectedIntegrations = integrations.filter(i => i.status === 'active');
  const expiredIntegrations = integrations.filter(i => i.status === 'expired');
  const connectedProviderIds = integrations.map(i => i.providerId);
  const availableProviders = providers.filter(
    p => !connectedProviderIds.includes(p._id)
  );

  /**
   * Handle connecting a new provider
   */
  const handleConnect = async (provider: CloudProvider) => {
    if (!tenantId || !jwtToken) return;

    try {
      setConnectingProvider(provider._id);

      // Step 1: Create integration record
      const integration = await createIntegration({
        providerId: provider._id,
        status: 'active'
      });

      // Step 2: Start OAuth flow
      await startOAuthFlow(tenantId, integration._id, jwtToken);

      // Step 3: Refetch integrations to get updated status with tokens
      await refetchIntegrations();

      // Show success notification
      alert(`Successfully connected to ${provider.displayName}!`);
    } catch (error) {
      console.error('Failed to connect provider:', error);
      alert(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setConnectingProvider(null);
    }
  };

  /**
   * Handle reconnecting an expired integration
   */
  const handleReconnect = async (integration: Integration) => {
    if (!tenantId || !jwtToken) return;

    try {
      setConnectingProvider(integration.providerId);

      // Start OAuth flow with existing integration
      await startOAuthFlow(tenantId, integration._id, jwtToken);

      // Refetch to see updated status
      await refetchIntegrations();

      alert('Successfully reconnected!');
    } catch (error) {
      console.error('Failed to reconnect:', error);
      alert(`Failed to reconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setConnectingProvider(null);
    }
  };

  /**
   * Handle disconnecting a provider
   */
  const handleDisconnect = async (integration: Integration) => {
    if (!confirm('Are you sure you want to disconnect this provider?')) {
      return;
    }

    try {
      await deleteIntegration(integration._id);
      alert('Provider disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert(`Failed to disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getProviderById = (providerId: string) => {
    return providers.find(p => p._id === providerId);
  };

  if (providersLoading || integrationsLoading) {
    return <div>Loading cloud providers...</div>;
  }

  return (
    <div className="cloud-providers-container">
      <h1>Cloud Provider Integrations</h1>

      {/* Connected Providers */}
      {connectedIntegrations.length > 0 && (
        <section>
          <h2>Connected Providers</h2>
          <div className="providers-grid">
            {connectedIntegrations.map(integration => {
              const provider = getProviderById(integration.providerId);
              if (!provider) return null;

              return (
                <div key={integration._id} className="provider-card connected">
                  <div className="provider-icon">
                    {/* Add provider icon/logo here */}
                    <img src={`/icons/${provider.slug}.svg`} alt={provider.displayName} />
                  </div>
                  <h3>{provider.displayName}</h3>
                  <p className="status">✅ Connected</p>
                  <p className="connected-date">
                    Since: {new Date(integration.connectedAt || integration.createdAt).toLocaleDateString()}
                  </p>
                  <button 
                    onClick={() => handleDisconnect(integration)}
                    className="btn-secondary"
                  >
                    Disconnect
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Expired Integrations (Need Reconnection) */}
      {expiredIntegrations.length > 0 && (
        <section>
          <h2>⚠️ Needs Reconnection</h2>
          <div className="providers-grid">
            {expiredIntegrations.map(integration => {
              const provider = getProviderById(integration.providerId);
              if (!provider) return null;

              return (
                <div key={integration._id} className="provider-card expired">
                  <div className="provider-icon">
                    <img src={`/icons/${provider.slug}.svg`} alt={provider.displayName} />
                  </div>
                  <h3>{provider.displayName}</h3>
                  <p className="status">⚠️ Connection Expired</p>
                  <p className="help-text">
                    Your connection has expired. Reconnect to continue using this provider.
                  </p>
                  <button 
                    onClick={() => handleReconnect(integration)}
                    disabled={connectingProvider === integration.providerId || oauthLoading}
                    className="btn-primary"
                  >
                    {connectingProvider === integration.providerId ? 'Connecting...' : 'Reconnect'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available Providers */}
      {availableProviders.length > 0 && (
        <section>
          <h2>Available Providers</h2>
          <div className="providers-grid">
            {availableProviders.map(provider => (
              <div key={provider._id} className="provider-card available">
                <div className="provider-icon">
                  <img src={`/icons/${provider.slug}.svg`} alt={provider.displayName} />
                </div>
                <h3>{provider.displayName}</h3>
                <p className="description">
                  Connect your {provider.displayName} account to access files and folders.
                </p>
                <button 
                  onClick={() => handleConnect(provider)}
                  disabled={connectingProvider === provider._id || oauthLoading}
                  className="btn-primary"
                >
                  {connectingProvider === provider._id ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

### Step 6: Styling (Optional)

Create `styles/CloudProviders.css`:

```css
/* styles/CloudProviders.css */

.cloud-providers-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.cloud-providers-container h1 {
  margin-bottom: 2rem;
}

.cloud-providers-container h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #333;
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.provider-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: box-shadow 0.2s;
}

.provider-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.provider-card.connected {
  border-color: #4caf50;
  background-color: #f1f8f4;
}

.provider-card.expired {
  border-color: #ff9800;
  background-color: #fff8f0;
}

.provider-card.available {
  border-color: #e0e0e0;
}

.provider-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
}

.provider-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.provider-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

.provider-card .status {
  font-weight: 600;
  margin: 0.5rem 0;
}

.provider-card .description,
.provider-card .help-text {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.provider-card .connected-date {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 1rem;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1976d2;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}
```

---

## 🎯 Complete Code Examples

### Example 1: Simple Integration Button

```typescript
// components/ConnectDropboxButton.tsx

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIntegrations } from '../hooks/useIntegrations';
import { useOAuthIntegration } from '../hooks/useOAuthIntegration';

export function ConnectDropboxButton({ providerId }: { providerId: string }) {
  const { tenantId, jwtToken } = useAuth();
  const { createIntegration, refetch } = useIntegrations();
  const { startOAuthFlow, isLoading } = useOAuthIntegration();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);

      // Create integration
      const integration = await createIntegration({ providerId });

      // Start OAuth
      await startOAuthFlow(tenantId!, integration._id, jwtToken!);

      // Refetch to get updated status
      await refetch();

      alert('Successfully connected!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
    }
  };

  return (
    <div>
      <button onClick={handleConnect} disabled={isLoading}>
        {isLoading ? 'Connecting...' : 'Connect Dropbox'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Example 2: Integration Status Badge

```typescript
// components/IntegrationStatusBadge.tsx

import { IntegrationStatus } from '../types/cloudProviders';

const statusConfig: Record<IntegrationStatus, { label: string; color: string; icon: string }> = {
  active: { label: 'Connected', color: '#4caf50', icon: '✅' },
  expired: { label: 'Expired', color: '#ff9800', icon: '⚠️' },
  revoked: { label: 'Revoked', color: '#f44336', icon: '❌' },
  error: { label: 'Error', color: '#9e9e9e', icon: '⚠️' }
};

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const config = statusConfig[status];

  return (
    <span 
      style={{ 
        color: config.color,
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        backgroundColor: `${config.color}20`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.9rem'
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
```

### Example 3: Auto-Reconnect on Expiration

```typescript
// hooks/useAutoReconnect.ts

import { useEffect } from 'react';
import { useIntegrations } from './useIntegrations';
import { useOAuthIntegration } from './useOAuthIntegration';
import { useAuth } from './useAuth';

/**
 * Automatically prompt user to reconnect expired integrations
 */
export function useAutoReconnect() {
  const { tenantId, jwtToken } = useAuth();
  const { integrations, refetch } = useIntegrations();
  const { startOAuthFlow } = useOAuthIntegration();

  useEffect(() => {
    const expiredIntegrations = integrations.filter(i => i.status === 'expired');

    if (expiredIntegrations.length > 0) {
      // Show notification or modal
      const shouldReconnect = confirm(
        `${expiredIntegrations.length} integration(s) have expired. Reconnect now?`
      );

      if (shouldReconnect && expiredIntegrations[0]) {
        const integration = expiredIntegrations[0];
        startOAuthFlow(tenantId!, integration._id, jwtToken!)
          .then(() => refetch())
          .catch(console.error);
      }
    }
  }, [integrations]);
}
```

---

## 🧪 Development & Testing

### Local Development Setup

```typescript
// config/environment.ts

export const config = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    // Note: OAuth will redirect to backend's callback URL
    // which is typically production URL even in development
  },
  staging: {
    apiBaseUrl: 'https://staging-api.mwap.dev',
  },
  production: {
    apiBaseUrl: 'https://api.mwap.dev',
  }
};

export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return config[env as keyof typeof config];
};
```

### Mock OAuth for Testing

```typescript
// __tests__/mocks/oauth.mock.ts

import { OAuthSuccessMessage } from '../../types/cloudProviders';

/**
 * Mock OAuth flow for testing
 */
export function mockOAuthFlow(success: boolean = true): Promise<OAuthSuccessMessage> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) {
        resolve({
          type: 'oauth_success',
          tenantId: 'mock-tenant-id',
          integrationId: 'mock-integration-id'
        });
      } else {
        reject(new Error('OAuth failed'));
      }
    }, 1000);
  });
}
```

### Testing with React Testing Library

```typescript
// __tests__/CloudProvidersList.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CloudProvidersList } from '../components/CloudProvidersList';
import { mockOAuthFlow } from './mocks/oauth.mock';

// Mock hooks
jest.mock('../hooks/useOAuthIntegration', () => ({
  useOAuthIntegration: () => ({
    startOAuthFlow: mockOAuthFlow,
    isLoading: false,
    error: null
  })
}));

test('displays available providers', async () => {
  render(<CloudProvidersList />);
  
  await waitFor(() => {
    expect(screen.getByText('Dropbox')).toBeInTheDocument();
    expect(screen.getByText('Google Drive')).toBeInTheDocument();
  });
});

test('handles connect button click', async () => {
  render(<CloudProvidersList />);
  
  const connectButton = screen.getByText('Connect Dropbox');
  fireEvent.click(connectButton);
  
  await waitFor(() => {
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });
});
```

---

## 🔐 Error Handling & Recovery

### Error Boundary

```typescript
// components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('OAuth Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage:
// <ErrorBoundary>
//   <CloudProvidersList />
// </ErrorBoundary>
```

---

## 📖 Summary

You now have:
- ✅ Complete TypeScript interfaces
- ✅ API client with all CRUD operations
- ✅ Custom hooks for data management
- ✅ OAuth integration hook
- ✅ Full-featured UI component
- ✅ Error handling and recovery
- ✅ Testing utilities

### Next Steps

1. Copy the code examples into your project
2. Customize styling to match your design system
3. Add your auth provider's implementation
4. Test with actual OAuth providers
5. Add monitoring and analytics

### Related Documentation

- **[OAuth Integration Guide](./oauth-integration-guide.md)** - OAuth popup mechanics
- **[API Reference](../04-Backend/api-reference.md)** - Complete API documentation
- **[TypeScript Best Practices](./typescript-guide.md)** - Type safety guidelines

---

**Questions?** This guide covers the complete feature. Check the troubleshooting sections or reach out for support!

