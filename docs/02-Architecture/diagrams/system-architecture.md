# 🏗️ MWAP System Architecture Diagrams

## 🎯 Overview

This document provides comprehensive visual representations of the MWAP system architecture, including component relationships, data flows, and security boundaries.

## 🌐 High-Level System Architecture

### **Overall System Diagram**
```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile App]
        API_CLIENT[API Client]
    end

    subgraph "CDN & Load Balancer"
        CDN[CloudFlare CDN]
        LB[Load Balancer]
    end

    subgraph "API Gateway Layer"
        NGINX[NGINX Proxy]
        EXPRESS[Express.js Server]
        
        subgraph "Middleware Stack"
            AUTH_MW[JWT Auth Middleware]
            CORS_MW[CORS Middleware]
            RATE_MW[Rate Limiting]
            VALID_MW[Validation Middleware]
            LOG_MW[Logging Middleware]
        end
    end

    subgraph "Application Layer"
        subgraph "Feature Modules"
            TENANT_SVC[Tenant Service]
            PROJECT_SVC[Project Service]
            USER_SVC[User Service]
            FILE_SVC[File Service]
            OAUTH_SVC[OAuth Service]
        end
        
        subgraph "Shared Services"
            AUTH_SVC[Auth Service]
            CACHE_SVC[Cache Service]
            QUEUE_SVC[Queue Service]
            NOTIFY_SVC[Notification Service]
        end
    end

    subgraph "Data Layer"
        MONGODB[(MongoDB Atlas)]
        REDIS[(Redis Cache)]
        AUTH0[Auth0 Service]
        
        subgraph "Cloud Storage"
            AWS_S3[AWS S3]
            GOOGLE_DRIVE[Google Drive API]
            DROPBOX[Dropbox API]
        end
    end

    subgraph "External Services"
        EMAIL[Email Service]
        ANALYTICS[Analytics]
        MONITORING[Monitoring]
        LOGGING[Centralized Logging]
    end

    %% Client connections
    WEB --> CDN
    MOBILE --> CDN
    API_CLIENT --> CDN

    %% CDN to Load Balancer
    CDN --> LB
    LB --> NGINX

    %% API Gateway flow
    NGINX --> EXPRESS
    EXPRESS --> AUTH_MW
    AUTH_MW --> CORS_MW
    CORS_MW --> RATE_MW
    RATE_MW --> VALID_MW
    VALID_MW --> LOG_MW

    %% Middleware to services
    LOG_MW --> TENANT_SVC
    LOG_MW --> PROJECT_SVC
    LOG_MW --> USER_SVC
    LOG_MW --> FILE_SVC
    LOG_MW --> OAUTH_SVC

    %% Service dependencies
    TENANT_SVC --> AUTH_SVC
    PROJECT_SVC --> AUTH_SVC
    USER_SVC --> AUTH_SVC
    FILE_SVC --> CACHE_SVC
    OAUTH_SVC --> QUEUE_SVC

    %% Data layer connections
    TENANT_SVC --> MONGODB
    PROJECT_SVC --> MONGODB
    USER_SVC --> MONGODB
    FILE_SVC --> MONGODB

    AUTH_SVC --> AUTH0
    CACHE_SVC --> REDIS
    QUEUE_SVC --> REDIS

    %% Cloud storage
    FILE_SVC --> AWS_S3
    FILE_SVC --> GOOGLE_DRIVE
    FILE_SVC --> DROPBOX

    %% External services
    NOTIFY_SVC --> EMAIL
    EXPRESS --> ANALYTICS
    EXPRESS --> MONITORING
    LOG_MW --> LOGGING

    %% Styling
    classDef clientLayer fill:#e1f5fe
    classDef gatewayLayer fill:#f3e5f5
    classDef appLayer fill:#e8f5e8
    classDef dataLayer fill:#fff3e0
    classDef externalLayer fill:#fce4ec

    class WEB,MOBILE,API_CLIENT clientLayer
    class CDN,LB,NGINX,EXPRESS,AUTH_MW,CORS_MW,RATE_MW,VALID_MW,LOG_MW gatewayLayer
    class TENANT_SVC,PROJECT_SVC,USER_SVC,FILE_SVC,OAUTH_SVC,AUTH_SVC,CACHE_SVC,QUEUE_SVC,NOTIFY_SVC appLayer
    class MONGODB,REDIS,AUTH0,AWS_S3,GOOGLE_DRIVE,DROPBOX dataLayer
    class EMAIL,ANALYTICS,MONITORING,LOGGING externalLayer
```

## 🔐 Security Architecture

### **Authentication & Authorization Flow**
```mermaid
sequenceDiagram
    participant Client
    participant API_Gateway
    participant Auth_Middleware
    participant Auth0
    participant Business_Logic
    participant Database

    Client->>API_Gateway: Request with JWT Token
    API_Gateway->>Auth_Middleware: Validate Request
    Auth_Middleware->>Auth0: Verify JWT Token
    Auth0-->>Auth_Middleware: Token Valid + User Info
    Auth_Middleware->>Auth_Middleware: Check Permissions (RBAC)
    Auth_Middleware->>Business_Logic: Authorized Request
    Business_Logic->>Database: Query with Tenant Isolation
    Database-->>Business_Logic: Filtered Results
    Business_Logic-->>API_Gateway: Response
    API_Gateway-->>Client: Secure Response

    Note over Auth_Middleware: JWT RS256 Validation
    Note over Business_Logic: Tenant Isolation Applied
    Note over Database: Row-Level Security
```

### **Multi-Tenant Security Boundaries**
```mermaid
graph TB
    subgraph "Tenant A"
        TA_USERS[Users A]
        TA_PROJECTS[Projects A]
        TA_FILES[Files A]
    end

    subgraph "Tenant B"
        TB_USERS[Users B]
        TB_PROJECTS[Projects B]
        TB_FILES[Files B]
    end

    subgraph "Security Layer"
        JWT_AUTH[JWT Authentication]
        RBAC[Role-Based Access Control]
        TENANT_FILTER[Tenant Isolation Filter]
    end

    subgraph "Database Layer"
        MONGODB[(MongoDB with Tenant ID)]
    end

    JWT_AUTH --> RBAC
    RBAC --> TENANT_FILTER

    TENANT_FILTER --> TA_USERS
    TENANT_FILTER --> TA_PROJECTS
    TENANT_FILTER --> TA_FILES

    TENANT_FILTER --> TB_USERS
    TENANT_FILTER --> TB_PROJECTS
    TENANT_FILTER --> TB_FILES

    TA_USERS --> MONGODB
    TA_PROJECTS --> MONGODB
    TA_FILES --> MONGODB
    TB_USERS --> MONGODB
    TB_PROJECTS --> MONGODB
    TB_FILES --> MONGODB

    %% Security boundaries
    classDef tenantA fill:#e3f2fd
    classDef tenantB fill:#f3e5f5
    classDef security fill:#fff3e0
    classDef database fill:#e8f5e8

    class TA_USERS,TA_PROJECTS,TA_FILES tenantA
    class TB_USERS,TB_PROJECTS,TB_FILES tenantB
    class JWT_AUTH,RBAC,TENANT_FILTER security
    class MONGODB database
```

## 📊 Data Architecture

### **Database Schema Relationships**
```mermaid
erDiagram
    TENANT {
        ObjectId _id PK
        string name
        string domain
        string status
        ObjectId ownerId FK
        Date createdAt
        Date updatedAt
    }

    USER {
        string auth0Id PK
        string email
        string name
        string role
        ObjectId tenantId FK
        boolean isActive
        Date lastLogin
        Date createdAt
        Date updatedAt
    }

    PROJECT {
        ObjectId _id PK
        string name
        string description
        ObjectId tenantId FK
        ObjectId projectTypeId FK
        string status
        ObjectId createdBy FK
        Date createdAt
        Date updatedAt
    }

    PROJECT_TYPE {
        ObjectId _id PK
        string name
        string description
        object schema
        boolean isActive
        Date createdAt
        Date updatedAt
    }

    PROJECT_MEMBER {
        ObjectId _id PK
        ObjectId projectId FK
        string userId FK
        string role
        Date joinedAt
        Date updatedAt
    }

    VIRTUAL_FILE {
        ObjectId _id PK
        string name
        string path
        ObjectId projectId FK
        ObjectId tenantId FK
        string cloudProvider
        string cloudFileId
        number size
        string mimeType
        string createdBy FK
        Date createdAt
        Date updatedAt
    }

    CLOUD_PROVIDER {
        ObjectId _id PK
        string name
        string type
        object credentials
        ObjectId tenantId FK
        boolean isActive
        Date createdAt
        Date updatedAt
    }

    %% Relationships
    TENANT ||--o{ USER : "owns"
    TENANT ||--o{ PROJECT : "contains"
    TENANT ||--o{ VIRTUAL_FILE : "stores"
    TENANT ||--o{ CLOUD_PROVIDER : "configures"
    
    USER ||--o{ PROJECT : "creates"
    USER ||--o{ PROJECT_MEMBER : "participates"
    USER ||--o{ VIRTUAL_FILE : "uploads"
    
    PROJECT ||--o{ PROJECT_MEMBER : "has"
    PROJECT ||--o{ VIRTUAL_FILE : "contains"
    PROJECT }o--|| PROJECT_TYPE : "uses"
    
    VIRTUAL_FILE }o--|| CLOUD_PROVIDER : "stored_in"
```

### **Data Flow Architecture**
```mermaid
graph LR
    subgraph "Input Layer"
        API_REQ[API Request]
        FILE_UPLOAD[File Upload]
        WEBHOOK[Webhook]
    end

    subgraph "Processing Layer"
        VALIDATION[Input Validation]
        AUTH_CHECK[Authorization Check]
        BUSINESS_LOGIC[Business Logic]
        FILE_PROCESSOR[File Processor]
    end

    subgraph "Storage Layer"
        MONGODB[(MongoDB)]
        REDIS[(Redis Cache)]
        CLOUD_STORAGE[(Cloud Storage)]
    end

    subgraph "Output Layer"
        API_RESPONSE[API Response]
        NOTIFICATION[Notification]
        WEBHOOK_OUT[Outbound Webhook]
    end

    %% Data flow
    API_REQ --> VALIDATION
    FILE_UPLOAD --> VALIDATION
    WEBHOOK --> VALIDATION

    VALIDATION --> AUTH_CHECK
    AUTH_CHECK --> BUSINESS_LOGIC
    AUTH_CHECK --> FILE_PROCESSOR

    BUSINESS_LOGIC --> MONGODB
    BUSINESS_LOGIC --> REDIS
    FILE_PROCESSOR --> CLOUD_STORAGE

    MONGODB --> API_RESPONSE
    REDIS --> API_RESPONSE
    CLOUD_STORAGE --> API_RESPONSE

    BUSINESS_LOGIC --> NOTIFICATION
    BUSINESS_LOGIC --> WEBHOOK_OUT

    %% Styling
    classDef input fill:#e3f2fd
    classDef processing fill:#e8f5e8
    classDef storage fill:#fff3e0
    classDef output fill:#fce4ec

    class API_REQ,FILE_UPLOAD,WEBHOOK input
    class VALIDATION,AUTH_CHECK,BUSINESS_LOGIC,FILE_PROCESSOR processing
    class MONGODB,REDIS,CLOUD_STORAGE storage
    class API_RESPONSE,NOTIFICATION,WEBHOOK_OUT output
```

## 🔄 Component Interaction Patterns

### **Feature Module Architecture**
```mermaid
graph TB
    subgraph "Feature Module: Projects"
        ROUTES[project.routes.ts]
        CONTROLLER[project.controller.ts]
        SERVICE[project.service.ts]
        MODEL[project.model.ts]
        TYPES[project.types.ts]
        VALIDATION[project.validation.ts]
        TESTS[__tests__/]
    end

    subgraph "Shared Infrastructure"
        AUTH_MW[Auth Middleware]
        ERROR_MW[Error Middleware]
        LOGGER[Logger Service]
        CACHE[Cache Service]
    end

    subgraph "External Dependencies"
        MONGODB[(MongoDB)]
        AUTH0[Auth0]
        REDIS[(Redis)]
    end

    %% Internal module flow
    ROUTES --> CONTROLLER
    CONTROLLER --> SERVICE
    SERVICE --> MODEL
    SERVICE --> VALIDATION
    CONTROLLER --> TYPES

    %% Shared infrastructure
    ROUTES --> AUTH_MW
    ROUTES --> ERROR_MW
    SERVICE --> LOGGER
    SERVICE --> CACHE

    %% External dependencies
    MODEL --> MONGODB
    AUTH_MW --> AUTH0
    CACHE --> REDIS

    %% Testing
    TESTS --> CONTROLLER
    TESTS --> SERVICE
    TESTS --> MODEL

    %% Styling
    classDef module fill:#e8f5e8
    classDef shared fill:#fff3e0
    classDef external fill:#fce4ec

    class ROUTES,CONTROLLER,SERVICE,MODEL,TYPES,VALIDATION,TESTS module
    class AUTH_MW,ERROR_MW,LOGGER,CACHE shared
    class MONGODB,AUTH0,REDIS external
```

### **Request Processing Pipeline**
```mermaid
graph LR
    subgraph "Request Pipeline"
        REQ[HTTP Request]
        NGINX_PROXY[NGINX Proxy]
        EXPRESS[Express Router]
        
        subgraph "Middleware Chain"
            HELMET[Security Headers]
            CORS[CORS Handler]
            RATE_LIMIT[Rate Limiter]
            JWT_AUTH[JWT Authentication]
            RBAC_CHECK[RBAC Authorization]
            VALIDATION[Request Validation]
            LOGGING[Request Logging]
        end
        
        CONTROLLER[Route Controller]
        SERVICE[Business Service]
        
        subgraph "Data Access"
            CACHE_CHECK[Cache Check]
            DB_QUERY[Database Query]
            CACHE_SET[Cache Update]
        end
        
        RESPONSE[HTTP Response]
    end

    %% Request flow
    REQ --> NGINX_PROXY
    NGINX_PROXY --> EXPRESS
    EXPRESS --> HELMET
    HELMET --> CORS
    CORS --> RATE_LIMIT
    RATE_LIMIT --> JWT_AUTH
    JWT_AUTH --> RBAC_CHECK
    RBAC_CHECK --> VALIDATION
    VALIDATION --> LOGGING
    LOGGING --> CONTROLLER
    CONTROLLER --> SERVICE
    SERVICE --> CACHE_CHECK
    CACHE_CHECK --> DB_QUERY
    DB_QUERY --> CACHE_SET
    CACHE_SET --> RESPONSE

    %% Error handling (simplified)
    JWT_AUTH -.-> RESPONSE
    RBAC_CHECK -.-> RESPONSE
    VALIDATION -.-> RESPONSE
    SERVICE -.-> RESPONSE

    %% Styling
    classDef middleware fill:#fff3e0
    classDef business fill:#e8f5e8
    classDef data fill:#e3f2fd

    class HELMET,CORS,RATE_LIMIT,JWT_AUTH,RBAC_CHECK,VALIDATION,LOGGING middleware
    class CONTROLLER,SERVICE business
    class CACHE_CHECK,DB_QUERY,CACHE_SET data
```

## 🚀 Deployment Architecture

### **Production Deployment**
```mermaid
graph TB
    subgraph "Internet"
        USERS[Users]
        DNS[DNS/Route53]
    end

    subgraph "CDN Layer"
        CLOUDFLARE[CloudFlare CDN]
    end

    subgraph "Load Balancer"
        ALB[Application Load Balancer]
    end

    subgraph "Container Orchestration"
        subgraph "Kubernetes Cluster"
            subgraph "API Pods"
                API_POD1[API Pod 1]
                API_POD2[API Pod 2]
                API_POD3[API Pod 3]
            end
            
            subgraph "Services"
                API_SERVICE[API Service]
                INGRESS[Ingress Controller]
            end
        end
    end

    subgraph "Managed Services"
        MONGODB_ATLAS[(MongoDB Atlas)]
        REDIS_CLOUD[(Redis Cloud)]
        AUTH0_SERVICE[Auth0]
    end

    subgraph "Monitoring & Logging"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        ELK_STACK[ELK Stack]
    end

    %% Traffic flow
    USERS --> DNS
    DNS --> CLOUDFLARE
    CLOUDFLARE --> ALB
    ALB --> INGRESS
    INGRESS --> API_SERVICE
    API_SERVICE --> API_POD1
    API_SERVICE --> API_POD2
    API_SERVICE --> API_POD3

    %% Data connections
    API_POD1 --> MONGODB_ATLAS
    API_POD1 --> REDIS_CLOUD
    API_POD1 --> AUTH0_SERVICE
    API_POD2 --> MONGODB_ATLAS
    API_POD2 --> REDIS_CLOUD
    API_POD2 --> AUTH0_SERVICE
    API_POD3 --> MONGODB_ATLAS
    API_POD3 --> REDIS_CLOUD
    API_POD3 --> AUTH0_SERVICE

    %% Monitoring
    API_POD1 --> PROMETHEUS
    API_POD2 --> PROMETHEUS
    API_POD3 --> PROMETHEUS
    PROMETHEUS --> GRAFANA
    API_POD1 --> ELK_STACK
    API_POD2 --> ELK_STACK
    API_POD3 --> ELK_STACK

    %% Styling
    classDef internet fill:#e3f2fd
    classDef cdn fill:#f3e5f5
    classDef container fill:#e8f5e8
    classDef managed fill:#fff3e0
    classDef monitoring fill:#fce4ec

    class USERS,DNS internet
    class CLOUDFLARE cdn
    class ALB,API_POD1,API_POD2,API_POD3,API_SERVICE,INGRESS container
    class MONGODB_ATLAS,REDIS_CLOUD,AUTH0_SERVICE managed
    class PROMETHEUS,GRAFANA,ELK_STACK monitoring
```

### **Development Environment**
```mermaid
graph TB
    subgraph "Developer Machine"
        IDE[VS Code/IDE]
        DOCKER[Docker Desktop]
        GIT[Git Client]
    end

    subgraph "Local Development Stack"
        NODE_APP[Node.js App]
        LOCAL_MONGO[(Local MongoDB)]
        LOCAL_REDIS[(Local Redis)]
        MOCK_AUTH[Mock Auth Service]
    end

    subgraph "Development Services"
        DEV_AUTH0[Dev Auth0 Tenant]
        DEV_MONGO[(Dev MongoDB Atlas)]
        NGROK[ngrok Tunnel]
    end

    subgraph "CI/CD Pipeline"
        GITHUB[GitHub Repository]
        ACTIONS[GitHub Actions]
        DOCKER_HUB[Docker Hub]
    end

    %% Development flow
    IDE --> NODE_APP
    IDE --> GIT
    DOCKER --> LOCAL_MONGO
    DOCKER --> LOCAL_REDIS
    NODE_APP --> LOCAL_MONGO
    NODE_APP --> LOCAL_REDIS
    NODE_APP --> MOCK_AUTH

    %% External development services
    NODE_APP -.-> DEV_AUTH0
    NODE_APP -.-> DEV_MONGO
    NGROK --> NODE_APP

    %% CI/CD flow
    GIT --> GITHUB
    GITHUB --> ACTIONS
    ACTIONS --> DOCKER_HUB

    %% Styling
    classDef local fill:#e8f5e8
    classDef dev fill:#fff3e0
    classDef cicd fill:#e3f2fd

    class IDE,DOCKER,GIT,NODE_APP,LOCAL_MONGO,LOCAL_REDIS,MOCK_AUTH local
    class DEV_AUTH0,DEV_MONGO,NGROK dev
    class GITHUB,ACTIONS,DOCKER_HUB cicd
```

## 📈 Scalability Patterns

### **Horizontal Scaling Architecture**
```mermaid
graph TB
    subgraph "Load Distribution"
        LB[Load Balancer]
        
        subgraph "API Instances"
            API1[API Instance 1]
            API2[API Instance 2]
            API3[API Instance 3]
            API_N[API Instance N]
        end
    end

    subgraph "Caching Layer"
        REDIS_CLUSTER[(Redis Cluster)]
        CDN[CDN Cache]
    end

    subgraph "Database Layer"
        MONGO_PRIMARY[(MongoDB Primary)]
        MONGO_SECONDARY1[(MongoDB Secondary 1)]
        MONGO_SECONDARY2[(MongoDB Secondary 2)]
    end

    subgraph "Message Queue"
        QUEUE_CLUSTER[Redis Queue Cluster]
        
        subgraph "Workers"
            WORKER1[Background Worker 1]
            WORKER2[Background Worker 2]
            WORKER3[Background Worker 3]
        end
    end

    %% Load distribution
    LB --> API1
    LB --> API2
    LB --> API3
    LB --> API_N

    %% Caching
    API1 --> REDIS_CLUSTER
    API2 --> REDIS_CLUSTER
    API3 --> REDIS_CLUSTER
    API_N --> REDIS_CLUSTER
    LB --> CDN

    %% Database replication
    API1 --> MONGO_PRIMARY
    API2 --> MONGO_PRIMARY
    API3 --> MONGO_PRIMARY
    API_N --> MONGO_PRIMARY
    MONGO_PRIMARY --> MONGO_SECONDARY1
    MONGO_PRIMARY --> MONGO_SECONDARY2

    %% Background processing
    API1 --> QUEUE_CLUSTER
    API2 --> QUEUE_CLUSTER
    API3 --> QUEUE_CLUSTER
    API_N --> QUEUE_CLUSTER
    QUEUE_CLUSTER --> WORKER1
    QUEUE_CLUSTER --> WORKER2
    QUEUE_CLUSTER --> WORKER3

    %% Styling
    classDef api fill:#e8f5e8
    classDef cache fill:#fff3e0
    classDef database fill:#e3f2fd
    classDef queue fill:#fce4ec

    class LB,API1,API2,API3,API_N api
    class REDIS_CLUSTER,CDN cache
    class MONGO_PRIMARY,MONGO_SECONDARY1,MONGO_SECONDARY2 database
    class QUEUE_CLUSTER,WORKER1,WORKER2,WORKER3 queue
```

## 🔧 Technology Stack Visualization

### **Full Stack Architecture**
```mermaid
graph TB
    subgraph "Frontend Layer (Future)"
        REACT[React/Next.js]
        TYPESCRIPT_FE[TypeScript]
        TAILWIND[Tailwind CSS]
        ZUSTAND[Zustand State]
    end

    subgraph "API Layer"
        EXPRESS[Express.js]
        TYPESCRIPT_BE[TypeScript]
        ZOD[Zod Validation]
        JWT[JWT Authentication]
    end

    subgraph "Business Layer"
        DOMAIN_SERVICES[Domain Services]
        REPOSITORIES[Repository Pattern]
        EVENTS[Event System]
        CACHING[Redis Caching]
    end

    subgraph "Data Layer"
        MONGODB[(MongoDB Atlas)]
        MONGOOSE[Mongoose ODM]
        REDIS_DB[(Redis)]
        AUTH0_DB[Auth0]
    end

    subgraph "Infrastructure"
        DOCKER[Docker]
        KUBERNETES[Kubernetes]
        NGINX[NGINX]
        CLOUDFLARE[CloudFlare]
    end

    subgraph "Development Tools"
        VITEST[Vitest Testing]
        ESLINT[ESLint]
        PRETTIER[Prettier]
        HUSKY[Husky Hooks]
    end

    %% Connections
    REACT --> EXPRESS
    TYPESCRIPT_FE --> TYPESCRIPT_BE
    EXPRESS --> ZOD
    EXPRESS --> JWT
    JWT --> AUTH0_DB
    
    EXPRESS --> DOMAIN_SERVICES
    DOMAIN_SERVICES --> REPOSITORIES
    REPOSITORIES --> MONGOOSE
    MONGOOSE --> MONGODB
    
    DOMAIN_SERVICES --> CACHING
    CACHING --> REDIS_DB
    
    DOCKER --> KUBERNETES
    KUBERNETES --> NGINX
    NGINX --> CLOUDFLARE

    %% Styling
    classDef frontend fill:#e3f2fd
    classDef api fill:#e8f5e8
    classDef business fill:#fff3e0
    classDef data fill:#fce4ec
    classDef infra fill:#f3e5f5
    classDef tools fill:#e0f2f1

    class REACT,TYPESCRIPT_FE,TAILWIND,ZUSTAND frontend
    class EXPRESS,TYPESCRIPT_BE,ZOD,JWT api
    class DOMAIN_SERVICES,REPOSITORIES,EVENTS,CACHING business
    class MONGODB,MONGOOSE,REDIS_DB,AUTH0_DB data
    class DOCKER,KUBERNETES,NGINX,CLOUDFLARE infra
    class VITEST,ESLINT,PRETTIER,HUSKY tools
```

---

## 📚 Related Documentation

- [🏗️ System Design](../system-design.md) - Detailed system design decisions
- [🗺️ Domain Map](../v3-domainmap.md) - Domain-driven design mapping
- [🔒 Security Architecture](../../04-Backend/security-architecture.md) - Security implementation details
- [📊 Database Schema](../../04-Backend/database-schema.md) - Detailed database design

---

*These architecture diagrams provide visual representations of the MWAP system design, helping developers understand component relationships, data flows, and system boundaries.*