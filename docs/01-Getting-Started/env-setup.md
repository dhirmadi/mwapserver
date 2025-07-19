# Environment Setup

This guide provides detailed instructions for setting up your development environment for the MWAP platform.

## 📋 Environment Variables

### Required Variables

Create a `.env` file in the project root with the following variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap?retryWrites=true&w=majority

# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier

# Security
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# External APIs (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DROPBOX_CLIENT_ID=your-dropbox-client-id
DROPBOX_CLIENT_SECRET=your-dropbox-client-secret
ONEDRIVE_CLIENT_ID=your-onedrive-client-id
ONEDRIVE_CLIENT_SECRET=your-onedrive-client-secret
```

### Environment Variable Details

#### Server Configuration
- **NODE_ENV**: Set to `development` for local development
- **PORT**: Port number for the Express server (default: 3000)

#### Database Configuration
- **MONGODB_URI**: Complete MongoDB Atlas connection string
  - Replace `username` and `password` with your database credentials
  - Replace `cluster` with your actual cluster name
  - Database name `mwap` will be created automatically

#### Auth0 Configuration
- **AUTH0_DOMAIN**: Your Auth0 tenant domain (e.g., `your-app.auth0.com`)
- **AUTH0_AUDIENCE**: API identifier from your Auth0 API configuration

#### Security Keys
- **JWT_SECRET**: Random string for JWT signing (development only)
- **ENCRYPTION_KEY**: 32-character key for encrypting sensitive data

## 🔧 Step-by-Step Setup

### 1. MongoDB Atlas Setup

#### Create Account and Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account or sign in
3. Create a new project (e.g., "MWAP Development")
4. Create a free cluster (M0 tier)

#### Configure Database Access
1. **Database Access** → **Add New Database User**
   - Username: Choose a username
   - Password: Generate a secure password
   - Built-in Role: `Atlas Admin` (for development)

2. **Network Access** → **Add IP Address**
   - Add your current IP address
   - For development, you can use `0.0.0.0/0` (allow from anywhere)
   - ⚠️ **Never use `0.0.0.0/0` in production**

#### Get Connection String
1. **Clusters** → **Connect** → **Connect your application**
2. Select **Node.js** and version **4.1 or later**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `mwap`

### 2. Auth0 Setup

#### Create Auth0 Account
1. Go to [Auth0](https://auth0.com/)
2. Create a free account
3. Create a new tenant (e.g., "mwap-dev")

#### Create Application
1. **Applications** → **Create Application**
2. Name: "MWAP Development"
3. Type: **Single Page Web Applications**
4. Technology: **React**

#### Configure Application
1. **Settings** tab:
   - **Allowed Callback URLs**: `http://localhost:5173/callback`
   - **Allowed Logout URLs**: `http://localhost:5173`
   - **Allowed Web Origins**: `http://localhost:5173`
   - **Allowed Origins (CORS)**: `http://localhost:5173`

2. **Advanced Settings** → **Grant Types**:
   - Enable **Authorization Code**
   - Enable **Refresh Token**

#### Create API
1. **APIs** → **Create API**
2. **Name**: "MWAP Backend API"
3. **Identifier**: `https://api.mwap.dev` (use this exact value)
4. **Signing Algorithm**: **RS256**

#### Get Configuration Values
- **Domain**: Found in Application settings (e.g., `your-app.auth0.com`)
- **Client ID**: Found in Application settings
- **Audience**: The API identifier you created (`https://api.mwap.dev`)

### 3. Generate Security Keys

#### JWT Secret (Development)
```bash
# Generate random string for JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Encryption Key
```bash
# Generate 32-character encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 4. Cloud Provider Setup (Optional)

If you plan to work with cloud integrations:

#### Google Drive API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create credentials (OAuth 2.0 Client ID)
5. Configure redirect URIs: `http://localhost:3000/api/v1/oauth/google/callback`

#### Dropbox API
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app
3. Choose **Scoped access**
4. Choose **Full Dropbox**
5. Configure redirect URIs: `http://localhost:3000/api/v1/oauth/dropbox/callback`

#### Microsoft OneDrive
1. Go to [Azure App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Create a new registration
3. Configure redirect URIs: `http://localhost:3000/api/v1/oauth/onedrive/callback`
4. Generate client secret

## 🔒 Security Best Practices

### Environment File Security
- **Never commit `.env` files** to version control
- Use different `.env` files for different environments
- Store production secrets in secure secret management systems
- Regularly rotate API keys and secrets

### Development vs Production
```bash
# Development (.env)
NODE_ENV=development
MONGODB_URI=mongodb+srv://dev-user:password@dev-cluster.mongodb.net/mwap-dev

# Production (use secret management)
NODE_ENV=production
MONGODB_URI=<secure-production-uri>
```

### Secret Management
- **Development**: Use `.env` files
- **Staging/Production**: Use environment variables from secure systems
- **Docker**: Use Docker secrets or environment files
- **Cloud**: Use cloud provider secret management (AWS Secrets Manager, Azure Key Vault)

## ✅ Verification Steps

### 1. Environment Loading
```bash
# Start the development server
npm run dev

# Check for environment variable errors
# Server should start without configuration errors
```

### 2. Database Connection
```bash
# Check server logs for database connection
# Should see: "Connected to MongoDB Atlas"
```

### 3. Auth0 Configuration
```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return:
# {"status":"healthy","database":"connected","auth":"configured"}
```

### 4. API Testing
```bash
# Test API documentation endpoint
curl http://localhost:3000/docs

# Should return HTML page with API documentation
```

## 🚨 Troubleshooting

### Common Issues

#### MongoDB Connection Errors
```bash
# Error: Authentication failed
# Solution: Check username/password in connection string

# Error: IP not whitelisted
# Solution: Add your IP address to MongoDB Atlas Network Access

# Error: Database name issues
# Solution: Ensure database name is 'mwap' in connection string
```

#### Auth0 Configuration Errors
```bash
# Error: Invalid domain
# Solution: Check AUTH0_DOMAIN format (should not include https://)

# Error: Invalid audience
# Solution: Verify AUTH0_AUDIENCE matches API identifier exactly
```

#### Environment Variable Issues
```bash
# Error: Missing required environment variable
# Solution: Check .env file exists and contains all required variables

# Error: Variables not loading
# Solution: Restart development server after changing .env
```

### Validation Commands
```bash
# Check environment variables are loaded
npm run env:check

# Validate database connection
npm run db:test

# Test Auth0 configuration
npm run auth:test
```

## 📱 Mobile Development Setup

For mobile app development (future):

```bash
# Additional environment variables for mobile
MOBILE_DEEP_LINK_SCHEME=mwap
MOBILE_AUTH_REDIRECT=mwap://auth/callback
```

## 🐳 Docker Setup (Optional)

For containerized development:

```bash
# docker-compose.yml will use .env file
# Ensure all required variables are set
docker-compose up -d
```

## 🔄 Environment Updates

When environment changes:
1. Update `.env` file
2. Restart development server
3. Clear any cached tokens or data
4. Test affected functionality

---

*This environment setup ensures secure and consistent development across all team members.* 