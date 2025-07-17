# 👥 MWAP User Flow Diagrams

## 🎯 Overview

This document provides comprehensive user flow diagrams for key MWAP features, illustrating user interactions, system responses, and decision points throughout the application lifecycle.

## 🔐 Authentication & Authorization Flows

### **User Registration & Onboarding Flow**
```mermaid
flowchart TD
    START([User visits MWAP]) --> CHECK_AUTH{Authenticated?}
    CHECK_AUTH -->|No| SIGNUP[Sign Up Button]
    CHECK_AUTH -->|Yes| DASHBOARD[Redirect to Dashboard]
    
    SIGNUP --> AUTH0_SIGNUP[Auth0 Registration Form]
    AUTH0_SIGNUP --> VERIFY_EMAIL[Email Verification Required]
    VERIFY_EMAIL --> EMAIL_SENT[Verification Email Sent]
    EMAIL_SENT --> USER_CLICKS[User Clicks Verification Link]
    
    USER_CLICKS --> EMAIL_VERIFIED{Email Verified?}
    EMAIL_VERIFIED -->|No| VERIFICATION_FAILED[Show Error Message]
    EMAIL_VERIFIED -->|Yes| PROFILE_SETUP[Complete Profile Setup]
    
    PROFILE_SETUP --> TENANT_SELECTION{Has Tenant?}
    TENANT_SELECTION -->|No| CREATE_TENANT[Create New Tenant]
    TENANT_SELECTION -->|Yes| JOIN_TENANT[Join Existing Tenant]
    
    CREATE_TENANT --> TENANT_SETUP[Tenant Configuration]
    TENANT_SETUP --> OWNER_ROLE[Assign Tenant Owner Role]
    
    JOIN_TENANT --> PENDING_APPROVAL[Pending Tenant Approval]
    PENDING_APPROVAL --> APPROVAL_WAIT[Wait for Approval]
    
    OWNER_ROLE --> ONBOARDING_COMPLETE[Onboarding Complete]
    APPROVAL_WAIT --> APPROVED{Approved?}
    APPROVED -->|Yes| MEMBER_ROLE[Assign Member Role]
    APPROVED -->|No| ACCESS_DENIED[Access Denied]
    
    MEMBER_ROLE --> ONBOARDING_COMPLETE
    ONBOARDING_COMPLETE --> DASHBOARD
    
    VERIFICATION_FAILED --> AUTH0_SIGNUP
    ACCESS_DENIED --> SIGNUP

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffebee

    class START,ONBOARDING_COMPLETE,DASHBOARD startEnd
    class CHECK_AUTH,EMAIL_VERIFIED,TENANT_SELECTION,APPROVED decision
    class SIGNUP,AUTH0_SIGNUP,VERIFY_EMAIL,PROFILE_SETUP,CREATE_TENANT,JOIN_TENANT process
    class VERIFICATION_FAILED,ACCESS_DENIED error
```

### **Login & Session Management Flow**
```mermaid
flowchart TD
    LOGIN_START([User Clicks Login]) --> AUTH0_LOGIN[Auth0 Login Form]
    AUTH0_LOGIN --> CREDENTIALS[Enter Credentials]
    CREDENTIALS --> MFA_CHECK{MFA Enabled?}
    
    MFA_CHECK -->|Yes| MFA_PROMPT[MFA Challenge]
    MFA_CHECK -->|No| AUTH_VALIDATE[Validate Credentials]
    
    MFA_PROMPT --> MFA_CODE[Enter MFA Code]
    MFA_CODE --> MFA_VERIFY{MFA Valid?}
    MFA_VERIFY -->|No| MFA_FAILED[MFA Failed]
    MFA_VERIFY -->|Yes| AUTH_VALIDATE
    
    AUTH_VALIDATE --> AUTH_SUCCESS{Auth Success?}
    AUTH_SUCCESS -->|No| LOGIN_FAILED[Login Failed]
    AUTH_SUCCESS -->|Yes| JWT_ISSUE[Issue JWT Token]
    
    JWT_ISSUE --> USER_LOOKUP[Lookup User in Database]
    USER_LOOKUP --> USER_EXISTS{User Exists?}
    USER_EXISTS -->|No| CREATE_USER[Create User Record]
    USER_EXISTS -->|Yes| UPDATE_LOGIN[Update Last Login]
    
    CREATE_USER --> ASSIGN_ROLE[Assign Default Role]
    ASSIGN_ROLE --> UPDATE_LOGIN
    UPDATE_LOGIN --> SESSION_CREATE[Create Session]
    SESSION_CREATE --> REDIRECT_DASHBOARD[Redirect to Dashboard]
    
    MFA_FAILED --> MFA_PROMPT
    LOGIN_FAILED --> AUTH0_LOGIN

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffebee

    class LOGIN_START,REDIRECT_DASHBOARD startEnd
    class MFA_CHECK,MFA_VERIFY,AUTH_SUCCESS,USER_EXISTS decision
    class AUTH0_LOGIN,CREDENTIALS,MFA_PROMPT,JWT_ISSUE,USER_LOOKUP process
    class MFA_FAILED,LOGIN_FAILED error
```

## 📊 Project Management Flows

### **Project Creation Flow**
```mermaid
flowchart TD
    START([User Clicks Create Project]) --> AUTH_CHECK{Authenticated?}
    AUTH_CHECK -->|No| LOGIN_REDIRECT[Redirect to Login]
    AUTH_CHECK -->|Yes| PERM_CHECK{Has Create Permission?}
    
    PERM_CHECK -->|No| ACCESS_DENIED[Access Denied Message]
    PERM_CHECK -->|Yes| PROJECT_FORM[Show Project Creation Form]
    
    PROJECT_FORM --> FORM_FILL[User Fills Form]
    FORM_FILL --> CLIENT_VALIDATE[Client-side Validation]
    CLIENT_VALIDATE --> VALIDATION_OK{Validation Passed?}
    
    VALIDATION_OK -->|No| SHOW_ERRORS[Show Validation Errors]
    VALIDATION_OK -->|Yes| SUBMIT_REQUEST[Submit to API]
    
    SUBMIT_REQUEST --> SERVER_VALIDATE[Server-side Validation]
    SERVER_VALIDATE --> SERVER_VALID{Server Validation OK?}
    
    SERVER_VALID -->|No| API_ERROR[Return Validation Errors]
    SERVER_VALID -->|Yes| NAME_CHECK[Check Project Name Uniqueness]
    
    NAME_CHECK --> NAME_UNIQUE{Name Available?}
    NAME_UNIQUE -->|No| NAME_ERROR[Name Already Exists Error]
    NAME_UNIQUE -->|Yes| TYPE_VALIDATE[Validate Project Type]
    
    TYPE_VALIDATE --> TYPE_VALID{Project Type Valid?}
    TYPE_VALID -->|No| TYPE_ERROR[Invalid Project Type Error]
    TYPE_VALID -->|Yes| CREATE_PROJECT[Create Project in Database]
    
    CREATE_PROJECT --> PROJECT_CREATED{Creation Success?}
    PROJECT_CREATED -->|No| DB_ERROR[Database Error]
    PROJECT_CREATED -->|Yes| ASSIGN_OWNER[Assign User as Project Owner]
    
    ASSIGN_OWNER --> INIT_STRUCTURE[Initialize Project Structure]
    INIT_STRUCTURE --> SEND_NOTIFICATION[Send Creation Notification]
    SEND_NOTIFICATION --> LOG_ACTIVITY[Log Activity]
    LOG_ACTIVITY --> SUCCESS_RESPONSE[Return Success Response]
    
    SUCCESS_RESPONSE --> REDIRECT_PROJECT[Redirect to Project View]
    
    SHOW_ERRORS --> PROJECT_FORM
    API_ERROR --> PROJECT_FORM
    NAME_ERROR --> PROJECT_FORM
    TYPE_ERROR --> PROJECT_FORM
    DB_ERROR --> PROJECT_FORM
    ACCESS_DENIED --> END([End])
    LOGIN_REDIRECT --> END

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffebee

    class START,REDIRECT_PROJECT,END startEnd
    class AUTH_CHECK,PERM_CHECK,VALIDATION_OK,SERVER_VALID,NAME_UNIQUE,TYPE_VALID,PROJECT_CREATED decision
    class PROJECT_FORM,FORM_FILL,SUBMIT_REQUEST,CREATE_PROJECT,ASSIGN_OWNER process
    class ACCESS_DENIED,SHOW_ERRORS,API_ERROR,NAME_ERROR,TYPE_ERROR,DB_ERROR error
```

### **Project Collaboration Flow**
```mermaid
flowchart TD
    INVITE_START([Project Owner Invites User]) --> MEMBER_FORM[Fill Invitation Form]
    MEMBER_FORM --> EMAIL_VALIDATE[Validate Email Address]
    EMAIL_VALIDATE --> EMAIL_VALID{Email Valid?}
    
    EMAIL_VALID -->|No| EMAIL_ERROR[Invalid Email Error]
    EMAIL_VALID -->|Yes| USER_CHECK[Check if User Exists]
    
    USER_CHECK --> USER_EXISTS{User in System?}
    USER_EXISTS -->|No| SEND_SIGNUP_INVITE[Send Signup Invitation]
    USER_EXISTS -->|Yes| ROLE_SELECT[Select Member Role]
    
    ROLE_SELECT --> ROLE_VALID{Valid Role?}
    ROLE_VALID -->|No| ROLE_ERROR[Invalid Role Error]
    ROLE_VALID -->|Yes| SEND_INVITE[Send Project Invitation]
    
    SEND_INVITE --> INVITE_SENT[Invitation Email Sent]
    INVITE_SENT --> USER_RECEIVES[User Receives Email]
    USER_RECEIVES --> USER_CLICKS[User Clicks Accept Link]
    
    USER_CLICKS --> TOKEN_VALIDATE[Validate Invitation Token]
    TOKEN_VALIDATE --> TOKEN_VALID{Token Valid?}
    TOKEN_VALID -->|No| TOKEN_EXPIRED[Token Expired/Invalid]
    TOKEN_VALID -->|Yes| USER_AUTH{User Authenticated?}
    
    USER_AUTH -->|No| LOGIN_REQUIRED[Require Login First]
    USER_AUTH -->|Yes| ACCEPT_INVITE[Accept Invitation]
    
    ACCEPT_INVITE --> ADD_MEMBER[Add User to Project]
    ADD_MEMBER --> ASSIGN_ROLE[Assign Selected Role]
    ASSIGN_ROLE --> NOTIFY_TEAM[Notify Existing Members]
    NOTIFY_TEAM --> LOG_JOIN[Log Join Activity]
    LOG_JOIN --> SUCCESS_JOIN[Join Success]
    
    SUCCESS_JOIN --> PROJECT_ACCESS[Grant Project Access]
    
    SEND_SIGNUP_INVITE --> SIGNUP_FLOW[User Signup Flow]
    SIGNUP_FLOW --> ROLE_SELECT
    
    EMAIL_ERROR --> MEMBER_FORM
    ROLE_ERROR --> ROLE_SELECT
    TOKEN_EXPIRED --> END([Invitation Expired])
    LOGIN_REQUIRED --> LOGIN_FLOW[Login Flow]
    LOGIN_FLOW --> ACCEPT_INVITE

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffebee

    class INVITE_START,PROJECT_ACCESS,END startEnd
    class EMAIL_VALID,USER_EXISTS,ROLE_VALID,TOKEN_VALID,USER_AUTH decision
    class MEMBER_FORM,EMAIL_VALIDATE,SEND_INVITE,ACCEPT_INVITE,ADD_MEMBER process
    class EMAIL_ERROR,ROLE_ERROR,TOKEN_EXPIRED error
```

## 📁 File Management Flows

### **File Upload Flow**
```mermaid
flowchart TD
    UPLOAD_START([User Selects Files]) --> FILE_SELECT[File Selection Dialog]
    FILE_SELECT --> FILES_CHOSEN[Files Chosen]
    FILES_CHOSEN --> CLIENT_VALIDATE[Client-side Validation]
    
    CLIENT_VALIDATE --> SIZE_CHECK{File Size OK?}
    SIZE_CHECK -->|No| SIZE_ERROR[File Too Large Error]
    SIZE_CHECK -->|Yes| TYPE_CHECK{File Type Allowed?}
    
    TYPE_CHECK -->|No| TYPE_ERROR[File Type Not Allowed]
    TYPE_CHECK -->|Yes| UPLOAD_START_REQ[Start Upload Request]
    
    UPLOAD_START_REQ --> AUTH_CHECK{User Authenticated?}
    AUTH_CHECK -->|No| AUTH_ERROR[Authentication Required]
    AUTH_CHECK -->|Yes| PERM_CHECK{Upload Permission?}
    
    PERM_CHECK -->|No| PERM_ERROR[No Upload Permission]
    PERM_CHECK -->|Yes| STORAGE_CHECK[Check Storage Quota]
    
    STORAGE_CHECK --> QUOTA_OK{Quota Available?}
    QUOTA_OK -->|No| QUOTA_ERROR[Storage Quota Exceeded]
    QUOTA_OK -->|Yes| CLOUD_SELECT[Select Cloud Provider]
    
    CLOUD_SELECT --> PROVIDER_VALID{Provider Available?}
    PROVIDER_VALID -->|No| PROVIDER_ERROR[Provider Not Available]
    PROVIDER_VALID -->|Yes| UPLOAD_CLOUD[Upload to Cloud Storage]
    
    UPLOAD_CLOUD --> UPLOAD_PROGRESS[Show Upload Progress]
    UPLOAD_PROGRESS --> UPLOAD_COMPLETE{Upload Success?}
    
    UPLOAD_COMPLETE -->|No| UPLOAD_ERROR[Upload Failed]
    UPLOAD_COMPLETE -->|Yes| CREATE_RECORD[Create File Record]
    
    CREATE_RECORD --> RECORD_CREATED{Record Created?}
    RECORD_CREATED -->|No| DB_ERROR[Database Error]
    RECORD_CREATED -->|Yes| UPDATE_QUOTA[Update Storage Quota]
    
    UPDATE_QUOTA --> NOTIFY_TEAM[Notify Team Members]
    NOTIFY_TEAM --> LOG_UPLOAD[Log Upload Activity]
    LOG_UPLOAD --> SUCCESS_RESPONSE[Upload Success]
    
    SUCCESS_RESPONSE --> REFRESH_LIST[Refresh File List]
    
    SIZE_ERROR --> FILE_SELECT
    TYPE_ERROR --> FILE_SELECT
    AUTH_ERROR --> LOGIN_FLOW[Login Flow]
    PERM_ERROR --> END([Access Denied])
    QUOTA_ERROR --> END
    PROVIDER_ERROR --> CLOUD_SELECT
    UPLOAD_ERROR --> RETRY_OPTION[Offer Retry Option]
    DB_ERROR --> CLEANUP_CLOUD[Cleanup Cloud File]
    
    RETRY_OPTION --> UPLOAD_CLOUD
    CLEANUP_CLOUD --> UPLOAD_ERROR
    LOGIN_FLOW --> UPLOAD_START_REQ

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffebee

    class UPLOAD_START,REFRESH_LIST,END startEnd
    class SIZE_CHECK,TYPE_CHECK,AUTH_CHECK,PERM_CHECK,QUOTA_OK,PROVIDER_VALID,UPLOAD_COMPLETE,RECORD_CREATED decision
    class FILE_SELECT,CLIENT_VALIDATE,UPLOAD_CLOUD,CREATE_RECORD,UPDATE_QUOTA process
    class SIZE_ERROR,TYPE_ERROR,AUTH_ERROR,PERM_ERROR,QUOTA_ERROR,UPLOAD_ERROR,DB_ERROR error
```

### **File Sharing Flow**
```mermaid
flowchart TD
    SHARE_START([User Clicks Share File]) --> FILE_SELECTED[File Selected]
    FILE_SELECTED --> PERM_CHECK{Share Permission?}
    
    PERM_CHECK -->|No| NO_PERMISSION[No Share Permission]
    PERM_CHECK -->|Yes| SHARE_OPTIONS[Show Share Options]
    
    SHARE_OPTIONS --> SHARE_TYPE{Share Type?}
    SHARE_TYPE -->|Internal| INTERNAL_SHARE[Share with Team Members]
    SHARE_TYPE -->|External| EXTERNAL_SHARE[Generate Public Link]
    SHARE_TYPE -->|Project| PROJECT_SHARE[Share with Project]
    
    INTERNAL_SHARE --> SELECT_MEMBERS[Select Team Members]
    SELECT_MEMBERS --> MEMBER_PERMS[Set Member Permissions]
    MEMBER_PERMS --> SEND_INTERNAL[Send Internal Notifications]
    
    EXTERNAL_SHARE --> LINK_CONFIG[Configure Link Settings]
    LINK_CONFIG --> EXPIRY_SET[Set Expiry Date]
    EXPIRY_SET --> PASSWORD_OPT[Optional Password]
    PASSWORD_OPT --> GENERATE_LINK[Generate Secure Link]
    
    PROJECT_SHARE --> SELECT_PROJECT[Select Target Project]
    SELECT_PROJECT --> PROJECT_PERMS[Set Project Permissions]
    PROJECT_PERMS --> COPY_FILE[Copy File to Project]
    
    SEND_INTERNAL --> LOG_INTERNAL[Log Internal Share]
    GENERATE_LINK --> LOG_EXTERNAL[Log External Share]
    COPY_FILE --> LOG_PROJECT[Log Project Share]
    
    LOG_INTERNAL --> SHARE_SUCCESS[Share Success]
    LOG_EXTERNAL --> SHARE_SUCCESS
    LOG_PROJECT --> SHARE_SUCCESS
    
    SHARE_SUCCESS --> UPDATE_UI[Update File UI]
    
    NO_PERMISSION --> END([Access Denied])

    %% External link access flow
    GENERATE_LINK --> LINK_CREATED[Link Created]
    LINK_CREATED --> USER_ACCESSES[External User Accesses Link]
    USER_ACCESSES --> LINK_VALID{Link Valid?}
    
    LINK_VALID -->|No| LINK_EXPIRED[Link Expired/Invalid]
    LINK_VALID -->|Yes| PASSWORD_CHECK{Password Required?}
    
    PASSWORD_CHECK -->|Yes| PASSWORD_PROMPT[Password Prompt]
    PASSWORD_CHECK -->|No| DOWNLOAD_ACCESS[Grant Download Access]
    
    PASSWORD_PROMPT --> PASSWORD_VALID{Password Correct?}
    PASSWORD_VALID -->|No| PASSWORD_ERROR[Wrong Password]
    PASSWORD_VALID -->|Yes| DOWNLOAD_ACCESS
    
    DOWNLOAD_ACCESS --> LOG_ACCESS[Log Access]
    LOG_ACCESS --> FILE_DOWNLOAD[File Download]
    
    PASSWORD_ERROR --> PASSWORD_PROMPT
    LINK_EXPIRED --> END

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffebee

    class SHARE_START,UPDATE_UI,FILE_DOWNLOAD,END startEnd
    class PERM_CHECK,SHARE_TYPE,LINK_VALID,PASSWORD_CHECK,PASSWORD_VALID decision
    class SHARE_OPTIONS,SELECT_MEMBERS,LINK_CONFIG,GENERATE_LINK,COPY_FILE process
    class NO_PERMISSION,LINK_EXPIRED,PASSWORD_ERROR error
```

## ⚙️ System Administration Flows

### **Tenant Management Flow**
```mermaid
flowchart TD
    ADMIN_LOGIN([Super Admin Login]) --> ADMIN_DASHBOARD[Admin Dashboard]
    ADMIN_DASHBOARD --> TENANT_MGMT[Tenant Management]
    TENANT_MGMT --> ADMIN_ACTION{Admin Action?}
    
    ADMIN_ACTION -->|Create| CREATE_TENANT[Create New Tenant]
    ADMIN_ACTION -->|View| VIEW_TENANTS[View All Tenants]
    ADMIN_ACTION -->|Edit| EDIT_TENANT[Edit Tenant]
    ADMIN_ACTION -->|Delete| DELETE_TENANT[Delete Tenant]
    
    CREATE_TENANT --> TENANT_FORM[Tenant Creation Form]
    TENANT_FORM --> VALIDATE_DATA[Validate Tenant Data]
    VALIDATE_DATA --> DATA_VALID{Data Valid?}
    
    DATA_VALID -->|No| FORM_ERRORS[Show Form Errors]
    DATA_VALID -->|Yes| DOMAIN_CHECK[Check Domain Availability]
    
    DOMAIN_CHECK --> DOMAIN_AVAILABLE{Domain Available?}
    DOMAIN_AVAILABLE -->|No| DOMAIN_ERROR[Domain Already Taken]
    DOMAIN_AVAILABLE -->|Yes| CREATE_DB_RECORD[Create Database Record]
    
    CREATE_DB_RECORD --> SETUP_OWNER[Setup Tenant Owner]
    SETUP_OWNER --> INIT_SETTINGS[Initialize Default Settings]
    INIT_SETTINGS --> SEND_WELCOME[Send Welcome Email]
    SEND_WELCOME --> TENANT_CREATED[Tenant Created Successfully]
    
    VIEW_TENANTS --> TENANT_LIST[Display Tenant List]
    TENANT_LIST --> FILTER_SORT[Filter and Sort Options]
    FILTER_SORT --> TENANT_DETAILS[View Tenant Details]
    
    EDIT_TENANT --> EDIT_FORM[Tenant Edit Form]
    EDIT_FORM --> UPDATE_VALIDATE[Validate Updates]
    UPDATE_VALIDATE --> UPDATE_VALID{Updates Valid?}
    UPDATE_VALID -->|No| UPDATE_ERRORS[Show Update Errors]
    UPDATE_VALID -->|Yes| SAVE_CHANGES[Save Changes]
    SAVE_CHANGES --> NOTIFY_OWNER[Notify Tenant Owner]
    NOTIFY_OWNER --> TENANT_UPDATED[Tenant Updated]
    
    DELETE_TENANT --> CONFIRM_DELETE[Confirm Deletion]
    CONFIRM_DELETE --> DELETE_CONFIRMED{Deletion Confirmed?}
    DELETE_CONFIRMED -->|No| CANCEL_DELETE[Cancel Deletion]
    DELETE_CONFIRMED -->|Yes| CHECK_DEPENDENCIES[Check Dependencies]
    
    CHECK_DEPENDENCIES --> HAS_DEPENDENCIES{Has Active Data?}
    HAS_DEPENDENCIES -->|Yes| DEPENDENCY_ERROR[Cannot Delete - Has Data]
    HAS_DEPENDENCIES -->|No| SOFT_DELETE[Soft Delete Tenant]
    
    SOFT_DELETE --> ARCHIVE_DATA[Archive Tenant Data]
    ARCHIVE_DATA --> NOTIFY_DELETION[Notify Stakeholders]
    NOTIFY_DELETION --> TENANT_DELETED[Tenant Deleted]
    
    FORM_ERRORS --> TENANT_FORM
    DOMAIN_ERROR --> TENANT_FORM
    UPDATE_ERRORS --> EDIT_FORM
    CANCEL_DELETE --> TENANT_MGMT
    DEPENDENCY_ERROR --> TENANT_MGMT

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffebee

    class ADMIN_LOGIN,TENANT_CREATED,TENANT_UPDATED,TENANT_DELETED startEnd
    class ADMIN_ACTION,DATA_VALID,DOMAIN_AVAILABLE,UPDATE_VALID,DELETE_CONFIRMED,HAS_DEPENDENCIES decision
    class TENANT_FORM,CREATE_DB_RECORD,SETUP_OWNER,EDIT_FORM,SOFT_DELETE process
    class FORM_ERRORS,DOMAIN_ERROR,UPDATE_ERRORS,DEPENDENCY_ERROR error
```

### **User Role Management Flow**
```mermaid
flowchart TD
    ROLE_START([Admin Manages User Roles]) --> SELECT_USER[Select User]
    SELECT_USER --> USER_PROFILE[View User Profile]
    USER_PROFILE --> CURRENT_ROLES[Display Current Roles]
    
    CURRENT_ROLES --> ROLE_ACTION{Role Action?}
    ROLE_ACTION -->|Add| ADD_ROLE[Add New Role]
    ROLE_ACTION -->|Remove| REMOVE_ROLE[Remove Existing Role]
    ROLE_ACTION -->|Modify| MODIFY_ROLE[Modify Role Permissions]
    
    ADD_ROLE --> AVAILABLE_ROLES[Show Available Roles]
    AVAILABLE_ROLES --> SELECT_ROLE[Select Role to Add]
    SELECT_ROLE --> ROLE_SCOPE[Define Role Scope]
    
    ROLE_SCOPE --> SCOPE_VALID{Scope Valid?}
    SCOPE_VALID -->|No| SCOPE_ERROR[Invalid Scope Error]
    SCOPE_VALID -->|Yes| CONFLICT_CHECK[Check Role Conflicts]
    
    CONFLICT_CHECK --> NO_CONFLICTS{No Conflicts?}
    NO_CONFLICTS -->|No| CONFLICT_ERROR[Role Conflict Error]
    NO_CONFLICTS -->|Yes| ASSIGN_ROLE[Assign Role to User]
    
    REMOVE_ROLE --> CONFIRM_REMOVAL[Confirm Role Removal]
    CONFIRM_REMOVAL --> REMOVAL_CONFIRMED{Removal Confirmed?}
    REMOVAL_CONFIRMED -->|No| CANCEL_REMOVAL[Cancel Removal]
    REMOVAL_CONFIRMED -->|Yes| DEPENDENCY_CHECK[Check Role Dependencies]
    
    DEPENDENCY_CHECK --> SAFE_REMOVE{Safe to Remove?}
    SAFE_REMOVE -->|No| DEPENDENCY_WARNING[Dependency Warning]
    SAFE_REMOVE -->|Yes| REVOKE_ROLE[Revoke Role from User]
    
    MODIFY_ROLE --> PERMISSION_EDITOR[Permission Editor]
    PERMISSION_EDITOR --> EDIT_PERMISSIONS[Edit Role Permissions]
    EDIT_PERMISSIONS --> VALIDATE_PERMS[Validate Permissions]
    
    VALIDATE_PERMS --> PERMS_VALID{Permissions Valid?}
    PERMS_VALID -->|No| PERM_ERROR[Permission Error]
    PERMS_VALID -->|Yes| UPDATE_ROLE[Update Role Permissions]
    
    ASSIGN_ROLE --> LOG_ASSIGNMENT[Log Role Assignment]
    REVOKE_ROLE --> LOG_REVOCATION[Log Role Revocation]
    UPDATE_ROLE --> LOG_MODIFICATION[Log Role Modification]
    
    LOG_ASSIGNMENT --> NOTIFY_USER[Notify User of Changes]
    LOG_REVOCATION --> NOTIFY_USER
    LOG_MODIFICATION --> NOTIFY_USER
    
    NOTIFY_USER --> REFRESH_SESSIONS[Refresh User Sessions]
    REFRESH_SESSIONS --> ROLE_SUCCESS[Role Change Success]
    
    SCOPE_ERROR --> ROLE_SCOPE
    CONFLICT_ERROR --> SELECT_ROLE
    CANCEL_REMOVAL --> CURRENT_ROLES
    DEPENDENCY_WARNING --> CONFIRM_REMOVAL
    PERM_ERROR --> EDIT_PERMISSIONS

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffebee

    class ROLE_START,ROLE_SUCCESS startEnd
    class ROLE_ACTION,SCOPE_VALID,NO_CONFLICTS,REMOVAL_CONFIRMED,SAFE_REMOVE,PERMS_VALID decision
    class SELECT_USER,USER_PROFILE,ADD_ROLE,ASSIGN_ROLE,REVOKE_ROLE,UPDATE_ROLE process
    class SCOPE_ERROR,CONFLICT_ERROR,DEPENDENCY_WARNING,PERM_ERROR error
```

## 🔄 Error Handling & Recovery Flows

### **System Error Recovery Flow**
```mermaid
flowchart TD
    ERROR_OCCURS([System Error Occurs]) --> ERROR_TYPE{Error Type?}
    
    ERROR_TYPE -->|Authentication| AUTH_ERROR[Authentication Error]
    ERROR_TYPE -->|Authorization| AUTHZ_ERROR[Authorization Error]
    ERROR_TYPE -->|Validation| VALID_ERROR[Validation Error]
    ERROR_TYPE -->|Database| DB_ERROR[Database Error]
    ERROR_TYPE -->|Network| NET_ERROR[Network Error]
    ERROR_TYPE -->|System| SYS_ERROR[System Error]
    
    AUTH_ERROR --> LOG_AUTH[Log Authentication Error]
    LOG_AUTH --> CLEAR_SESSION[Clear User Session]
    CLEAR_SESSION --> REDIRECT_LOGIN[Redirect to Login]
    
    AUTHZ_ERROR --> LOG_AUTHZ[Log Authorization Error]
    LOG_AUTHZ --> SHOW_403[Show Access Denied]
    SHOW_403 --> SUGGEST_CONTACT[Suggest Contact Admin]
    
    VALID_ERROR --> LOG_VALID[Log Validation Error]
    LOG_VALID --> SHOW_VALIDATION[Show Validation Messages]
    SHOW_VALIDATION --> HIGHLIGHT_FIELDS[Highlight Error Fields]
    
    DB_ERROR --> LOG_DB[Log Database Error]
    LOG_DB --> DB_RETRY{Retry Possible?}
    DB_RETRY -->|Yes| RETRY_DB[Retry Database Operation]
    DB_RETRY -->|No| SHOW_DB_ERROR[Show Database Error]
    
    NET_ERROR --> LOG_NET[Log Network Error]
    LOG_NET --> NET_RETRY{Retry Possible?}
    NET_RETRY -->|Yes| RETRY_NET[Retry Network Request]
    NET_RETRY -->|No| SHOW_NET_ERROR[Show Network Error]
    
    SYS_ERROR --> LOG_SYS[Log System Error]
    LOG_SYS --> CRITICAL{Critical Error?}
    CRITICAL -->|Yes| ALERT_ADMIN[Alert System Admin]
    CRITICAL -->|No| SHOW_SYS_ERROR[Show System Error]
    
    RETRY_DB --> RETRY_SUCCESS{Retry Success?}
    RETRY_SUCCESS -->|Yes| CONTINUE_OPERATION[Continue Operation]
    RETRY_SUCCESS -->|No| SHOW_DB_ERROR
    
    RETRY_NET --> NET_SUCCESS{Retry Success?}
    NET_SUCCESS -->|Yes| CONTINUE_OPERATION
    NET_SUCCESS -->|No| SHOW_NET_ERROR
    
    ALERT_ADMIN --> EMERGENCY_MODE[Enter Emergency Mode]
    EMERGENCY_MODE --> SHOW_MAINTENANCE[Show Maintenance Page]
    
    REDIRECT_LOGIN --> USER_ACTION[User Takes Action]
    SUGGEST_CONTACT --> USER_ACTION
    HIGHLIGHT_FIELDS --> USER_ACTION
    SHOW_DB_ERROR --> USER_ACTION
    SHOW_NET_ERROR --> USER_ACTION
    SHOW_SYS_ERROR --> USER_ACTION
    SHOW_MAINTENANCE --> USER_ACTION
    CONTINUE_OPERATION --> SUCCESS([Operation Success])

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffebee

    class ERROR_OCCURS,SUCCESS,USER_ACTION startEnd
    class ERROR_TYPE,DB_RETRY,NET_RETRY,CRITICAL,RETRY_SUCCESS,NET_SUCCESS decision
    class LOG_AUTH,CLEAR_SESSION,RETRY_DB,RETRY_NET,ALERT_ADMIN process
    class AUTH_ERROR,AUTHZ_ERROR,VALID_ERROR,DB_ERROR,NET_ERROR,SYS_ERROR,SHOW_DB_ERROR,SHOW_NET_ERROR error
```

## 📊 Performance Monitoring Flow

### **System Performance Monitoring Flow**
```mermaid
flowchart TD
    MONITOR_START([System Monitoring Active]) --> COLLECT_METRICS[Collect Performance Metrics]
    COLLECT_METRICS --> METRIC_TYPES{Metric Types}
    
    METRIC_TYPES -->|Response Time| RESPONSE_METRICS[API Response Times]
    METRIC_TYPES -->|Database| DB_METRICS[Database Query Performance]
    METRIC_TYPES -->|Memory| MEMORY_METRICS[Memory Usage]
    METRIC_TYPES -->|CPU| CPU_METRICS[CPU Utilization]
    METRIC_TYPES -->|Network| NETWORK_METRICS[Network Performance]
    
    RESPONSE_METRICS --> RESPONSE_THRESHOLD{Above Threshold?}
    DB_METRICS --> DB_THRESHOLD{Above Threshold?}
    MEMORY_METRICS --> MEMORY_THRESHOLD{Above Threshold?}
    CPU_METRICS --> CPU_THRESHOLD{Above Threshold?}
    NETWORK_METRICS --> NETWORK_THRESHOLD{Above Threshold?}
    
    RESPONSE_THRESHOLD -->|Yes| RESPONSE_ALERT[Response Time Alert]
    DB_THRESHOLD -->|Yes| DB_ALERT[Database Performance Alert]
    MEMORY_THRESHOLD -->|Yes| MEMORY_ALERT[Memory Usage Alert]
    CPU_THRESHOLD -->|Yes| CPU_ALERT[CPU Usage Alert]
    NETWORK_THRESHOLD -->|Yes| NETWORK_ALERT[Network Performance Alert]
    
    RESPONSE_ALERT --> INVESTIGATE_API[Investigate API Performance]
    DB_ALERT --> INVESTIGATE_DB[Investigate Database]
    MEMORY_ALERT --> INVESTIGATE_MEMORY[Investigate Memory Usage]
    CPU_ALERT --> INVESTIGATE_CPU[Investigate CPU Usage]
    NETWORK_ALERT --> INVESTIGATE_NETWORK[Investigate Network]
    
    INVESTIGATE_API --> API_OPTIMIZATION[Optimize API Performance]
    INVESTIGATE_DB --> DB_OPTIMIZATION[Optimize Database Queries]
    INVESTIGATE_MEMORY --> MEMORY_CLEANUP[Memory Cleanup]
    INVESTIGATE_CPU --> CPU_OPTIMIZATION[CPU Optimization]
    INVESTIGATE_NETWORK --> NETWORK_OPTIMIZATION[Network Optimization]
    
    API_OPTIMIZATION --> VERIFY_FIX[Verify Performance Fix]
    DB_OPTIMIZATION --> VERIFY_FIX
    MEMORY_CLEANUP --> VERIFY_FIX
    CPU_OPTIMIZATION --> VERIFY_FIX
    NETWORK_OPTIMIZATION --> VERIFY_FIX
    
    VERIFY_FIX --> FIX_SUCCESSFUL{Fix Successful?}
    FIX_SUCCESSFUL -->|Yes| UPDATE_MONITORING[Update Monitoring]
    FIX_SUCCESSFUL -->|No| ESCALATE_ISSUE[Escalate to Senior Team]
    
    RESPONSE_THRESHOLD -->|No| CONTINUE_MONITORING[Continue Monitoring]
    DB_THRESHOLD -->|No| CONTINUE_MONITORING
    MEMORY_THRESHOLD -->|No| CONTINUE_MONITORING
    CPU_THRESHOLD -->|No| CONTINUE_MONITORING
    NETWORK_THRESHOLD -->|No| CONTINUE_MONITORING
    
    UPDATE_MONITORING --> CONTINUE_MONITORING
    ESCALATE_ISSUE --> SENIOR_INVESTIGATION[Senior Team Investigation]
    SENIOR_INVESTIGATION --> CONTINUE_MONITORING
    
    CONTINUE_MONITORING --> COLLECT_METRICS

    %% Styling
    classDef startEnd fill:#e8f5e8
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef alert fill:#ffebee

    class MONITOR_START startEnd
    class METRIC_TYPES,RESPONSE_THRESHOLD,DB_THRESHOLD,MEMORY_THRESHOLD,CPU_THRESHOLD,NETWORK_THRESHOLD,FIX_SUCCESSFUL decision
    class COLLECT_METRICS,INVESTIGATE_API,API_OPTIMIZATION,VERIFY_FIX,UPDATE_MONITORING process
    class RESPONSE_ALERT,DB_ALERT,MEMORY_ALERT,CPU_ALERT,NETWORK_ALERT alert
```

## 📚 Related Documentation

- [🏗️ System Architecture Diagrams](./diagrams/system-architecture.md) - Visual system architecture
- [🧩 Component Structure](./component-structure.md) - Component relationships and dependencies
- [🔒 Security Architecture](../04-Backend/security-architecture.md) - Security implementation details
- [📊 Database Schema](../04-Backend/database-schema.md) - Database design and relationships

---

*These user flow diagrams provide comprehensive visualization of user interactions and system processes throughout the MWAP platform, helping developers understand the complete user experience and system behavior.*