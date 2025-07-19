# User Flows

This document describes the key user interaction patterns and workflows within the MWAP platform.

## 🧭 Overview

MWAP supports multiple user personas with distinct workflows:
- **Tenant Owners**: Manage organizations and high-level settings
- **Project Admins**: Manage projects and team members
- **Project Members**: Collaborate on projects and access files
- **System Admins**: Manage platform-wide settings (super admin)

## 🔐 Authentication Flows

### Initial User Registration & Login

```mermaid
graph TD
    A[User Visits App] --> B{Has Account?}
    B -->|No| C[Click Sign Up]
    B -->|Yes| D[Click Sign In]
    
    C --> E[Auth0 Universal Login]
    D --> E
    
    E --> F[Auth0 Authentication]
    F --> G{Authentication Success?}
    
    G -->|No| H[Show Error Message]
    G -->|Yes| I[Receive JWT Token]
    
    H --> E
    I --> J{First Time User?}
    
    J -->|Yes| K[Create User Profile]
    J -->|No| L[Load User Dashboard]
    
    K --> L
```

### Token Refresh Flow

```mermaid
graph TD
    A[API Request] --> B{Token Valid?}
    B -->|Yes| C[Process Request]
    B -->|No| D[Check Refresh Token]
    
    D --> E{Refresh Token Valid?}
    E -->|Yes| F[Request New Access Token]
    E -->|No| G[Redirect to Login]
    
    F --> H[Auth0 Token Refresh]
    H --> I[Receive New Token]
    I --> J[Retry Original Request]
    J --> C
```

## 🏢 Tenant Management Flows

### Tenant Creation (First-Time User)

```mermaid
graph TD
    A[User First Login] --> B[No Tenant Found]
    B --> C[Show Tenant Creation Form]
    
    C --> D[User Fills Form]
    D --> E[Validate Tenant Name]
    E --> F{Name Available?}
    
    F -->|No| G[Show Error: Name Taken]
    F -->|Yes| H[Create Tenant]
    
    G --> D
    H --> I[Set User as Tenant Owner]
    I --> J[Redirect to Dashboard]
```

### Tenant Settings Management

```mermaid
graph TD
    A[Tenant Owner Login] --> B[Navigate to Settings]
    B --> C[View Tenant Settings]
    
    C --> D{Action?}
    D -->|Update Settings| E[Modify Configuration]
    D -->|Manage Members| F[User Management]
    D -->|View Usage| G[Analytics Dashboard]
    
    E --> H[Validate Changes]
    H --> I[Save Settings]
    I --> J[Show Success Message]
    
    F --> K[Invite/Remove Users]
    K --> L[Update User Roles]
    L --> J
```

## 📁 Project Management Flows

### Project Creation Flow

```mermaid
graph TD
    A[User Dashboard] --> B[Click Create Project]
    B --> C[Select Project Type]
    
    C --> D[Fill Project Details]
    D --> E[Configure Settings]
    E --> F[Validate Input]
    
    F --> G{Validation Pass?}
    G -->|No| H[Show Validation Errors]
    G -->|Yes| I[Create Project]
    
    H --> D
    I --> J[Set User as Project Owner]
    J --> K[Initialize Project Structure]
    K --> L[Redirect to Project Dashboard]
```

### Project Member Management

```mermaid
graph TD
    A[Project Admin] --> B[Open Project Settings]
    B --> C[Navigate to Members Tab]
    
    C --> D{Action?}
    D -->|Add Member| E[Send Invitation]
    D -->|Update Role| F[Change Member Role]
    D -->|Remove Member| G[Remove Access]
    
    E --> H[User Receives Invitation]
    H --> I[User Accepts/Declines]
    I --> J{Accepted?}
    
    J -->|Yes| K[Add to Project]
    J -->|No| L[Remove Invitation]
    
    F --> M[Update Permissions]
    G --> N[Revoke Access]
    
    K --> O[Update Member List]
    M --> O
    N --> O
```

## ☁️ Cloud Integration Flows

### Cloud Provider Connection

```mermaid
graph TD
    A[User Dashboard] --> B[Navigate to Integrations]
    B --> C[Select Cloud Provider]
    
    C --> D[Click Connect Button]
    D --> E[Redirect to OAuth Provider]
    
    E --> F[User Authorizes Access]
    F --> G{Authorization Success?}
    
    G -->|No| H[Show Error Message]
    G -->|Yes| I[Receive OAuth Tokens]
    
    H --> B
    I --> J[Encrypt and Store Tokens]
    J --> K[Test Connection]
    K --> L[Show Success Message]
    L --> M[Integration Active]
```

### File Access Flow

```mermaid
graph TD
    A[User in Project] --> B[Navigate to Files]
    B --> C[Select Cloud Integration]
    
    C --> D[Fetch File List]
    D --> E{Token Valid?}
    
    E -->|No| F[Refresh Token]
    E -->|Yes| G[Call Cloud API]
    
    F --> H{Refresh Success?}
    H -->|No| I[Show Re-auth Required]
    H -->|Yes| G
    
    G --> J[Receive File Metadata]
    J --> K[Display Files]
    
    K --> L{User Action?}
    L -->|View File| M[Open Cloud File]
    L -->|Download| N[Initiate Download]
    L -->|Share| O[Generate Share Link]
```

## 🔄 Token Refresh Flow

### Automatic Token Refresh

```mermaid
graph TD
    A[Background Service] --> B[Check Token Expiry]
    B --> C{Token Expires Soon?}
    
    C -->|No| D[Schedule Next Check]
    C -->|Yes| E[Attempt Token Refresh]
    
    E --> F{Refresh Success?}
    F -->|Yes| G[Update Stored Tokens]
    F -->|No| H[Mark Integration as Expired]
    
    G --> I[Log Success]
    H --> J[Notify User]
    
    D --> K[Wait for Next Cycle]
    I --> K
    J --> K
    K --> B
```

## 👥 Collaboration Flows

### Project Access Flow

```mermaid
graph TD
    A[Team Member Login] --> B[View Project List]
    B --> C[Select Project]
    
    C --> D{Has Access?}
    D -->|No| E[Show Access Denied]
    D -->|Yes| F[Load Project Dashboard]
    
    F --> G{Role?}
    G -->|Owner| H[Full Access]
    G -->|Admin| I[Management Access]
    G -->|Member| J[Standard Access]
    G -->|Viewer| K[Read-Only Access]
    
    H --> L[All Features Available]
    I --> M[Project Management + Files]
    J --> N[Files + Limited Settings]
    K --> O[Files Read-Only]
```

### File Sharing Flow

```mermaid
graph TD
    A[User Selects File] --> B[Click Share Button]
    B --> C[Choose Share Method]
    
    C --> D{Share Type?}
    D -->|Internal| E[Select Team Members]
    D -->|External| F[Generate Public Link]
    D -->|Download| G[Create Download Link]
    
    E --> H[Set Permissions]
    H --> I[Send Internal Notification]
    
    F --> J[Set Expiration]
    J --> K[Generate Secure Link]
    
    G --> L[Create Temporary Access]
    L --> M[Provide Download URL]
    
    I --> N[Recipients Notified]
    K --> O[Link Ready to Share]
    M --> O
```

## 🔒 Security Flows

### Role-Based Access Control

```mermaid
graph TD
    A[User Request] --> B[Extract User Context]
    B --> C[Identify Resource]
    
    C --> D{Resource Type?}
    D -->|Tenant| E[Check Tenant Ownership]
    D -->|Project| F[Check Project Role]
    D -->|File| G[Check File Permissions]
    
    E --> H{Is Owner?}
    H -->|Yes| I[Grant Full Access]
    H -->|No| J[Deny Access]
    
    F --> K{Has Role?}
    K -->|Owner/Admin| L[Grant Management Access]
    K -->|Member| M[Grant Standard Access]
    K -->|Viewer| N[Grant Read Access]
    K -->|None| O[Deny Access]
    
    G --> P{In Project?}
    P -->|Yes| Q[Apply Project Role]
    P -->|No| R[Deny Access]
    
    Q --> S[Check File-Specific Permissions]
    S --> T[Grant Appropriate Access]
```

### Audit Trail Flow

```mermaid
graph TD
    A[User Action] --> B[Log Action Details]
    B --> C[Capture Context]
    
    C --> D[Record Data]
    D --> E{Sensitive Action?}
    
    E -->|Yes| F[Enhanced Logging]
    E -->|No| G[Standard Logging]
    
    F --> H[Store Audit Record]
    G --> H
    
    H --> I[Update Activity Feed]
    I --> J[Check Alert Rules]
    
    J --> K{Alert Triggered?}
    K -->|Yes| L[Send Notification]
    K -->|No| M[Continue Processing]
    
    L --> N[Update Admin Dashboard]
    M --> N
```

## 📊 Error Handling Flows

### API Error Flow

```mermaid
graph TD
    A[API Request] --> B[Process Request]
    B --> C{Error Occurs?}
    
    C -->|No| D[Return Success Response]
    C -->|Yes| E[Classify Error Type]
    
    E --> F{Error Type?}
    F -->|Validation| G[Format Validation Error]
    F -->|Authentication| H[Return 401 Unauthorized]
    F -->|Authorization| I[Return 403 Forbidden]
    F -->|Not Found| J[Return 404 Not Found]
    F -->|Server Error| K[Return 500 Internal Error]
    
    G --> L[Include Field Details]
    H --> M[Clear Auth Context]
    I --> N[Log Access Attempt]
    J --> O[Log Resource Request]
    K --> P[Log Error Details]
    
    L --> Q[Return Error Response]
    M --> Q
    N --> Q
    O --> Q
    P --> Q
```

### Recovery Flow

```mermaid
graph TD
    A[Error Detected] --> B{Error Type?}
    
    B -->|Network| C[Retry with Backoff]
    B -->|Auth| D[Refresh Token]
    B -->|Rate Limit| E[Wait and Retry]
    B -->|Server| F[Fallback Response]
    
    C --> G{Retry Success?}
    G -->|Yes| H[Continue Operation]
    G -->|No| I[Show User Error]
    
    D --> J{Refresh Success?}
    J -->|Yes| K[Retry Original Request]
    J -->|No| L[Redirect to Login]
    
    E --> M[Schedule Retry]
    M --> N[Attempt Operation]
    
    F --> O[Return Cached Data]
    O --> P[Queue for Later]
```

## 🎯 User Experience Flows

### Onboarding Flow

```mermaid
graph TD
    A[New User Login] --> B[Welcome Screen]
    B --> C[Tutorial Overview]
    
    C --> D{Skip Tutorial?}
    D -->|Yes| E[Go to Dashboard]
    D -->|No| F[Start Guided Tour]
    
    F --> G[Create First Tenant]
    G --> H[Set up First Project]
    H --> I[Connect Cloud Provider]
    I --> J[Invite Team Member]
    J --> K[Complete Onboarding]
    
    K --> L[Show Achievement]
    L --> E
```

### Dashboard Navigation

```mermaid
graph TD
    A[User Dashboard] --> B{Primary Action?}
    
    B -->|Projects| C[View Project List]
    B -->|Files| D[Quick File Access]
    B -->|Team| E[Team Management]
    B -->|Settings| F[Account Settings]
    B -->|Integrations| G[Cloud Integrations]
    
    C --> H[Filter/Search Projects]
    H --> I[Select Project]
    I --> J[Project Dashboard]
    
    D --> K[Recent Files View]
    K --> L[File Actions]
    
    E --> M[Team Member List]
    M --> N[Member Actions]
    
    F --> O[User Preferences]
    G --> P[Integration Management]
```

---

*These user flows ensure intuitive and secure user experiences across all MWAP platform interactions.* 