# API Error Handling Guide

This guide covers how to handle errors when integrating with the MWAP backend API from React applications.

## 🚨 Error Response Format

The MWAP backend returns consistent error responses:

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## 📋 Common Error Codes

### Authentication Errors
- `AUTH_TOKEN_MISSING` - No Authorization header provided
- `AUTH_TOKEN_INVALID` - JWT token is malformed or expired
- `AUTH_TOKEN_EXPIRED` - Token expired, needs refresh
- `AUTH_USER_NOT_FOUND` - User not found in Auth0

### Authorization Errors  
- `INSUFFICIENT_PERMISSIONS` - User lacks required role/permission
- `TENANT_ACCESS_DENIED` - User not authorized for this tenant
- `PROJECT_ACCESS_DENIED` - User not authorized for this project
- `SUPERADMIN_REQUIRED` - Endpoint requires SuperAdmin role

### Validation Errors
- `VALIDATION_ERROR` - Request data validation failed
- `INVALID_INPUT` - Generic input validation error
- `MISSING_REQUIRED_FIELD` - Required field not provided
- `INVALID_FORMAT` - Field format is incorrect

### Resource Errors
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RESOURCE_ALREADY_EXISTS` - Duplicate resource creation attempt
- `RESOURCE_CONFLICT` - Resource state conflict

### External Service Errors
- `OAUTH_ERROR` - OAuth provider error
- `CLOUD_PROVIDER_ERROR` - Cloud service integration error
- `DATABASE_ERROR` - Database operation failed

## 🛠️ Error Handling Implementation

### 1. Axios Error Interceptor

```tsx
// src/utils/api.ts
import axios, { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// Create custom error class
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// API client with error handling
export const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api/v1`,
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network or request setup error
    if (!error.response) {
      throw new AppError(
        'NETWORK_ERROR',
        'Network error or server unavailable',
        0,
        { originalError: error.message }
      );
    }

    const { status, data } = error.response;
    
    // API returned error response
    if (data && typeof data === 'object' && 'error' in data) {
      const apiError = data as ApiErrorResponse;
      throw new AppError(
        apiError.error.code,
        apiError.error.message,
        status,
        apiError.error.details
      );
    }

    // Generic HTTP error
    throw new AppError(
      'HTTP_ERROR',
      `HTTP ${status}: ${error.response.statusText}`,
      status
    );
  }
);
```

### 2. React Query Error Handling

```tsx
// src/utils/queryClient.ts
import { QueryClient } from 'react-query';
import { AppError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on authentication/authorization errors
        if (error instanceof AppError) {
          if (error.statusCode === 401 || error.statusCode === 403) {
            return false;
          }
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Global error handler
queryClient.setMutationDefaults(['*'], {
  onError: (error) => {
    if (error instanceof AppError) {
      handleApiError(error);
    }
  },
});
```

### 3. Error Handler Hook

```tsx
// src/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { useNotification } from './useNotification';
import { useAuth0 } from '@auth0/auth0-react';
import { AppError } from '../utils/api';

export const useErrorHandler = () => {
  const { showNotification } = useNotification();
  const { loginWithRedirect, logout } = useAuth0();

  const handleError = useCallback((error: unknown) => {
    if (error instanceof AppError) {
      switch (error.code) {
        // Authentication errors
        case 'AUTH_TOKEN_MISSING':
        case 'AUTH_TOKEN_INVALID':
        case 'AUTH_TOKEN_EXPIRED':
          showNotification('Please log in again', 'warning');
          loginWithRedirect();
          break;

        case 'AUTH_USER_NOT_FOUND':
          showNotification('Account not found. Please contact support.', 'error');
          logout();
          break;

        // Authorization errors
        case 'INSUFFICIENT_PERMISSIONS':
          showNotification('You do not have permission to perform this action', 'warning');
          break;

        case 'TENANT_ACCESS_DENIED':
          showNotification('Access denied for this tenant', 'warning');
          break;

        case 'PROJECT_ACCESS_DENIED':
          showNotification('Access denied for this project', 'warning');
          break;

        case 'SUPERADMIN_REQUIRED':
          showNotification('This action requires administrator privileges', 'warning');
          break;

        // Validation errors
        case 'VALIDATION_ERROR':
          if (error.details?.fields) {
            // Show field-specific errors
            Object.entries(error.details.fields).forEach(([field, message]) => {
              showNotification(`${field}: ${message}`, 'error');
            });
          } else {
            showNotification(error.message, 'error');
          }
          break;

        case 'RESOURCE_NOT_FOUND':
          showNotification('The requested resource was not found', 'error');
          break;

        case 'RESOURCE_ALREADY_EXISTS':
          showNotification('This resource already exists', 'warning');
          break;

        // OAuth/Integration errors
        case 'OAUTH_ERROR':
          showNotification('OAuth integration failed. Please try again.', 'error');
          break;

        case 'CLOUD_PROVIDER_ERROR':
          showNotification('Cloud provider error. Please check your integration.', 'error');
          break;

        // Network errors
        case 'NETWORK_ERROR':
          showNotification('Network error. Please check your connection.', 'error');
          break;

        // Generic errors
        default:
          showNotification(error.message || 'An unexpected error occurred', 'error');
      }
    } else {
      // Handle non-API errors
      console.error('Unexpected error:', error);
      showNotification('An unexpected error occurred', 'error');
    }
  }, [showNotification, loginWithRedirect, logout]);

  return { handleError };
};
```

### 4. Form Validation Error Display

```tsx
// src/components/FormField.tsx
import { AppError } from '../utils/api';

interface FormFieldProps {
  label: string;
  error?: AppError | string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => {
  const getErrorMessage = (error: AppError | string | undefined): string | undefined => {
    if (!error) return undefined;
    
    if (typeof error === 'string') return error;
    
    // Handle API validation errors
    if (error.code === 'VALIDATION_ERROR' && error.details?.field) {
      return error.details.message || error.message;
    }
    
    return error.message;
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
};
```

### 5. Custom Hook for API Calls with Error Handling

```tsx
// src/hooks/useApiCall.ts
import { useState, useCallback } from 'react';
import { AppError } from '../utils/api';
import { useErrorHandler } from './useErrorHandler';

interface UseApiCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  showSuccessMessage?: string;
}

export const useApiCall = <T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const { handleError } = useErrorHandler();
  
  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      if (options.showSuccessMessage) {
        // Show success notification
      }
      
      return result;
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred',
        500
      );
      
      setError(appError);
      
      if (options.onError) {
        options.onError(appError);
      } else {
        handleError(appError);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, options, handleError]);

  return {
    execute,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

// Usage example
const CreateTenantForm = () => {
  const { execute: createTenant, isLoading, error } = useApiCall(
    (data: CreateTenantData) => api.post('/tenants', data),
    {
      onSuccess: () => {
        // Redirect to tenant dashboard
        navigate('/dashboard');
      },
      showSuccessMessage: 'Tenant created successfully!',
    }
  );

  const handleSubmit = (formData: CreateTenantData) => {
    createTenant(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && (
        <div className="error-banner">
          {error.message}
        </div>
      )}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Tenant'}
      </button>
    </form>
  );
};
```

## 🎯 Best Practices

### 1. Error Boundaries for Unexpected Errors

```tsx
// src/components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // Log to error reporting service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="error-fallback">
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
    <button onClick={() => window.location.reload()}>
      Reload page
    </button>
  </div>
);
```

### 2. Retry Logic for Failed Requests

```tsx
// src/utils/retry.ts
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry authentication/authorization errors
      if (error instanceof AppError && [401, 403].includes(error.statusCode)) {
        throw error;
      }
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
};
```

### 3. Loading States and Error Recovery

```tsx
// src/components/DataList.tsx
import { useQuery } from 'react-query';
import { useErrorHandler } from '../hooks/useErrorHandler';

const DataList = () => {
  const { handleError } = useErrorHandler();
  
  const { data, isLoading, error, refetch } = useQuery(
    'data-list',
    fetchData,
    {
      onError: handleError,
      retry: 2,
    }
  );

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Failed to load data</p>
        <button onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

## 📖 Related Documentation

- [API Integration Guide](api-integration.md) - General API usage patterns
- [Authentication Guide](authentication.md) - Auth0 and JWT error handling
- [Backend API Reference](../04-Backend/API-v3.md) - Complete error code reference

---

*This guide focuses on frontend error handling. For backend error handling patterns, refer to the backend documentation.* 