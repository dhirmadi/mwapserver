# Component Structure

This document describes the architectural components and their organization within the MWAP platform.

## 🏗️ Overall Architecture

MWAP follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                 │
│  ┌─────────────────────────────────────────────────┐ │
│  │            HTTP Interface (Express)             │ │
│  │  Routes → Controllers → Middleware → Response   │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────┐
│                   Business Layer                    │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Service Classes                    │ │
│  │   Business Logic → Validation → Processing     │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────┐
│                   Data Access Layer                 │
│  ┌─────────────────────────────────────────────────┐ │
│  │           Database Operations                   │ │
│  │     MongoDB → Collections → Documents          │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────┐
│                 Infrastructure Layer                │
│  ┌─────────────────────────────────────────────────┐ │
│  │   Auth0 → MongoDB Atlas → Cloud Providers      │ │
│  │        External Services & Dependencies        │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 📁 Directory Structure

### Core Application Structure
```
src/
├── app.ts                 # Main application entry point
├── server.ts             # Server configuration and startup
├── config/               # Configuration management
│   ├── db.ts            # Database connection setup
│   ├── auth0.ts         # Auth0 configuration
│   └── env.ts           # Environment variable validation
├── features/            # Feature-based organization
│   ├── tenants/         # Tenant management
│   ├── projects/        # Project operations
│   ├── cloud-providers/ # Cloud provider management
│   ├── cloud-integrations/ # OAuth integrations
│   ├── files/           # Virtual file operations
│   ├── oauth/           # OAuth callback handling
│   └── users/           # User management
├── middleware/          # Cross-cutting concerns
│   ├── auth.ts          # Authentication middleware
│   ├── authorization.ts # Authorization middleware
│   ├── errorHandler.ts  # Error handling middleware
│   └── roles.ts         # Role-based access control
├── schemas/             # Data validation schemas
│   ├── tenant.schema.ts
│   ├── project.schema.ts
│   ├── cloudProvider.schema.ts
│   └── user.schema.ts
└── utils/               # Shared utilities
    ├── auth.ts          # Authentication utilities
    ├── errors.ts        # Custom error classes
    ├── logger.ts        # Logging utilities
    ├── response.ts      # Response formatting
    └── validate.ts      # Validation utilities
```

## 🔧 Component Types

### 1. Application Components

#### App Entry Point (`app.ts`)
- **Purpose**: Main Express application setup
- **Responsibilities**:
  - Middleware registration
  - Route registration
  - Error handler setup
  - CORS configuration
  - Security headers (Helmet)

#### Server Configuration (`server.ts`)
- **Purpose**: Server startup and lifecycle management
- **Responsibilities**:
  - Database connection initialization
  - Server startup logic
  - Graceful shutdown handling
  - Health check endpoint

### 2. Configuration Components

#### Database Configuration (`config/db.ts`)
- **Purpose**: MongoDB connection management
- **Responsibilities**:
  - Connection string validation
  - Connection pooling
  - Connection lifecycle management
  - Error handling for database operations

#### Auth0 Configuration (`config/auth0.ts`)
- **Purpose**: Authentication service setup
- **Responsibilities**:
  - JWT verification configuration
  - JWKS endpoint management
  - Auth0 domain and audience validation

#### Environment Configuration (`config/env.ts`)
- **Purpose**: Environment variable validation
- **Responsibilities**:
  - Zod schema validation for env vars
  - Type-safe environment access
  - Default value management
  - Environment-specific configurations

### 3. Feature Components

Each feature follows a consistent structure:

```
features/{domain}/
├── {domain}.routes.ts      # Route definitions
├── {domain}.controller.ts  # Request/response handling
└── {domain}.service.ts     # Business logic
```

#### Routes (`*.routes.ts`)
- **Purpose**: HTTP endpoint definitions
- **Responsibilities**:
  - URL pattern matching
  - HTTP method handling
  - Middleware application
  - Controller delegation

#### Controllers (`*.controller.ts`)
- **Purpose**: Request/response coordination
- **Responsibilities**:
  - Request parameter extraction
  - Input validation (Zod schemas)
  - Service method invocation
  - Response formatting
  - Error handling

#### Services (`*.service.ts`)
- **Purpose**: Business logic implementation
- **Responsibilities**:
  - Domain-specific operations
  - Data validation and transformation
  - Database operations
  - External service integration
  - Business rule enforcement

### 4. Middleware Components

#### Authentication Middleware (`middleware/auth.ts`)
- **Purpose**: JWT token validation
- **Responsibilities**:
  - Token extraction from headers
  - JWT signature verification
  - Token expiration checking
  - User information extraction

#### Authorization Middleware (`middleware/authorization.ts`)
- **Purpose**: Permission and role checking
- **Responsibilities**:
  - Role-based access control
  - Tenant ownership verification
  - Project-level permissions
  - Resource access validation

#### Error Handler (`middleware/errorHandler.ts`)
- **Purpose**: Centralized error processing
- **Responsibilities**:
  - Error type classification
  - Error response formatting
  - Error logging and monitoring
  - Security-safe error messages

### 5. Schema Components

#### Validation Schemas (`schemas/*.schema.ts`)
- **Purpose**: Data structure validation
- **Responsibilities**:
  - Input validation for API requests
  - Type generation for TypeScript
  - Data transformation and coercion
  - Error message generation

Example schema structure:
```typescript
// schemas/tenant.schema.ts
export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  settings: z.object({
    allowPublicProjects: z.boolean().default(false),
    maxProjects: z.number().int().positive().default(10)
  }).optional()
});

export type CreateTenantRequest = z.infer<typeof CreateTenantSchema>;
```

### 6. Utility Components

#### Authentication Utils (`utils/auth.ts`)
- **Purpose**: Authentication helper functions
- **Responsibilities**:
  - User data extraction from tokens
  - Permission checking utilities
  - Auth0 integration helpers

#### Error Utils (`utils/errors.ts`)
- **Purpose**: Custom error classes
- **Responsibilities**:
  - Standardized error types
  - HTTP status code mapping
  - Error context preservation

#### Response Utils (`utils/response.ts`)
- **Purpose**: Consistent API responses
- **Responsibilities**:
  - Success response formatting
  - Error response formatting
  - Pagination support
  - Metadata inclusion

## 🔄 Component Interactions

### Request Flow
1. **HTTP Request** → Express Router
2. **Router** → Authentication Middleware
3. **Auth Middleware** → Authorization Middleware
4. **Auth Middleware** → Controller
5. **Controller** → Input Validation (Zod)
6. **Controller** → Service Layer
7. **Service** → Database Operations
8. **Service** → Business Logic Processing
9. **Controller** → Response Formatting
10. **Response** → Client

### Error Flow
1. **Error Occurs** → Any Layer
2. **Error** → Error Handler Middleware
3. **Error Handler** → Error Classification
4. **Error Handler** → Logging
5. **Error Handler** → Response Formatting
6. **Error Response** → Client

### Authentication Flow
1. **Request** → Auth Middleware
2. **Auth Middleware** → JWT Extraction
3. **Auth Middleware** → Auth0 Verification
4. **Auth Middleware** → User Context Setup
5. **Request** → Authorization Middleware (if needed)
6. **Auth Middleware** → Role/Permission Check
7. **Request** → Controller

## 🧩 Component Dependencies

### High-Level Dependencies
```
Controllers ──► Services ──► Database
     │              │
     ▼              ▼
  Schemas      Utils/Helpers
     │              │
     ▼              ▼
 Middleware ◄─── Error Handling
```

### External Dependencies
- **Auth0**: JWT validation and user management
- **MongoDB Atlas**: Data persistence
- **Cloud Providers**: OAuth integrations and file operations
- **Express.js**: HTTP server framework
- **Zod**: Schema validation and type generation

## 🎯 Design Principles

### 1. Separation of Concerns
- Each component has a single, well-defined responsibility
- Clear boundaries between layers
- Minimal coupling between components

### 2. Dependency Inversion
- High-level modules don't depend on low-level modules
- Dependencies flow inward (toward business logic)
- External services are abstracted through interfaces

### 3. Single Responsibility
- Each class/module has one reason to change
- Components are focused on specific functionality
- Clear ownership of business logic

### 4. Open/Closed Principle
- Components are open for extension
- Components are closed for modification
- New features add components rather than modify existing ones

## 🔒 Security Components

### Authentication Chain
```
Request → JWT Extraction → Token Validation → User Context
                │                 │              │
                ▼                 ▼              ▼
         Auth0 JWKS        Signature Check   Role Assignment
```

### Authorization Chain
```
User Context → Role Check → Resource Check → Permission Grant
      │           │             │               │
      ▼           ▼             ▼               ▼
   User Roles  Tenant Access  Project Access  Action Allowed
```

## 📊 Component Monitoring

### Health Check Components
- **Database Connection**: MongoDB Atlas connectivity
- **Auth Service**: Auth0 JWKS endpoint availability  
- **Application Health**: Memory usage, uptime, version
- **External Services**: Cloud provider API status

### Logging Components
- **Request Logging**: HTTP requests and responses
- **Error Logging**: Application and system errors
- **Audit Logging**: Security-relevant actions
- **Performance Logging**: Response times and resource usage

## 🔄 Future Component Extensions

### Planned Components
- **Caching Layer**: Redis integration for performance
- **Message Queue**: Async processing for heavy operations
- **File Processing**: Advanced file operations and transformations
- **Notification System**: Real-time updates and alerts
- **Analytics**: Usage tracking and reporting

### Extension Points
- **Plugin Architecture**: Modular feature extensions
- **Event System**: Decoupled component communication
- **Service Discovery**: Dynamic service registration
- **Configuration Management**: Dynamic configuration updates

---

*This component structure ensures maintainable, scalable, and testable architecture for the MWAP platform.* 