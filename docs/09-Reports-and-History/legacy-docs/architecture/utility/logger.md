# 📝 Logging Utilities

## Overview
The logging utilities provide structured JSON logging with support for different log levels, metadata, and audit trails.

## Functions

### `logInfo`
```typescript
function logInfo(message: string, meta?: Record<string, unknown>): void
```

Logs informational messages with optional metadata.

#### Parameters
- `message`: Main log message
- `meta`: Optional metadata object

#### Output Format
```json
{
  "level": "info",
  "message": "Server started",
  "timestamp": "2025-05-08T07:35:30.457Z",
  "meta": {
    "port": 3001,
    "env": "development"
  }
}
```

### `logError`
```typescript
function logError(message: string, error?: unknown): void
```

Logs error messages with stack traces and error details.

#### Parameters
- `message`: Error description
- `error`: Error object or unknown error value

#### Output Format
```json
{
  "level": "error",
  "message": "Database connection failed",
  "timestamp": "2025-05-08T07:35:30.457Z",
  "error": {
    "name": "MongoError",
    "message": "Connection timeout",
    "stack": "..."
  }
}
```

### `logAudit`
```typescript
function logAudit(
  action: string,
  actor: string,
  target: string,
  meta?: Record<string, unknown>
): void
```

Logs audit events for security and compliance tracking.

#### Parameters
- `action`: The action being performed
- `actor`: The user or system performing the action
- `target`: The resource being acted upon
- `meta`: Optional additional context

#### Output Format
```json
{
  "level": "audit",
  "action": "user.delete",
  "actor": "admin@example.com",
  "target": "user123",
  "timestamp": "2025-05-08T07:35:30.457Z",
  "meta": {
    "reason": "Account inactive",
    "requestId": "req-123"
  }
}
```

## Usage Examples

### Information Logging
```typescript
// Basic info log
logInfo('Server started successfully');

// Info log with metadata
logInfo('New user registered', {
  userId: 'user123',
  plan: 'premium',
  source: 'api'
});
```

### Error Logging
```typescript
try {
  await someOperation();
} catch (error) {
  logError('Operation failed', error);
}
```

### Audit Logging
```typescript
// Track resource creation
logAudit(
  'project.create',
  'user@example.com',
  'project-123',
  {
    projectName: 'New Project',
    template: 'basic'
  }
);

// Track security event
logAudit(
  'login.failed',
  'unknown',
  'auth-system',
  {
    reason: 'Invalid credentials',
    attempts: 3
  }
);
```

## Best Practices

1. **Information Logs**
   - Use for operational events
   - Include relevant context
   - Keep messages clear and concise

2. **Error Logs**
   - Always include error objects
   - Provide context message
   - Log stack traces

3. **Audit Logs**
   - Track security events
   - Log user actions
   - Include all relevant metadata

4. **Metadata**
   - Use consistent keys
   - Avoid sensitive data
   - Keep structure flat

## Integration Example
```typescript
import { logInfo, logError, logAudit } from '../utils/logger.js';

async function createProject(userId: string, data: ProjectData) {
  try {
    logInfo('Creating new project', { userId, projectName: data.name });
    
    const project = await Project.create(data);
    
    logAudit(
      'project.create',
      userId,
      project.id,
      {
        name: project.name,
        type: project.type
      }
    );

    return project;
  } catch (error) {
    logError('Project creation failed', error);
    throw error;
  }
}
```