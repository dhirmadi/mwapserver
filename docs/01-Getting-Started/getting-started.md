# Getting Started

Welcome to MWAP! This guide will get you up and running in under 15 minutes.

## Prerequisites

**System Requirements:**
- Node.js 20+ and npm 9+
- Git
- 8GB+ RAM recommended

**Accounts needed:**
- [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- [Auth0](https://auth0.com/) (free tier)

**Recommended Tools:**
- VS Code with TypeScript extension
- Docker (optional, for containerized development)

## Quick Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd mwapserver
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Security
JWT_SECRET=your-256-bit-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 3. Configure Services

#### MongoDB Atlas
1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create database user
3. Whitelist your IP address
4. Copy connection string to `MONGODB_URI`

#### Auth0 Setup
1. Create application at [Auth0 Dashboard](https://manage.auth0.com)
2. Set application type to "Single Page Application"
3. Configure allowed URLs:
   - **Allowed Callback URLs**: `http://localhost:3000/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
4. Copy Domain, Client ID, and Client Secret to `.env`

### 4. Start Development
```bash
# Start the server
npm run dev

# In another terminal, run tests
npm test

# Check API health
curl http://localhost:3000/api/health
```

## Verify Installation

Visit these endpoints to confirm everything is working:
- **API Health**: http://localhost:3000/api/health
- **API Docs**: http://localhost:3000/api/docs
- **MongoDB**: Check connection in server logs

**Expected response from health endpoint:**
```json
{
  "status": "ok",
  "database": "connected",
  "auth": "configured",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Project Structure
```
mwapserver/
├── src/
│   ├── app.ts           # Express app configuration
│   ├── server.ts        # Server startup
│   ├── features/        # Feature modules
│   ├── middleware/      # Custom middleware
│   ├── schemas/         # Data validation schemas
│   └── utils/           # Utility functions
├── tests/               # Test files
├── docs/                # Documentation
└── .env                 # Environment variables
```

## Development Workflow

### 1. Daily Development
```bash
# Start development server with hot reload
npm run dev

# Run tests in watch mode
npm run test:watch

# Lint and format code
npm run lint
npm run format
```

### 2. Before Committing
```bash
# Run full test suite
npm test

# Check TypeScript compilation
npm run build

# Lint and fix issues
npm run lint:fix
```

### 3. Common Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run test suite
npm run lint         # Check code style
npm run format       # Format code
npm run docs:serve   # Serve documentation locally
```

## Next Steps

1. **Explore the API**: Visit http://localhost:3000/api/docs
2. **Read Architecture**: Check [System Design](../02-Architecture/architecture.md)
3. **Join the Team**: Follow [Team Onboarding](./team-onboarding.md)
4. **Start Contributing**: See [Contributing Guide](../08-Contribution/contributing-guide.md)

## Need Help?

- **Common Issues**: See [Troubleshooting](./troubleshooting.md)
- **Frequently Asked Questions**: Check [FAQ](./faq.md)
- **Team Support**: Ask in team Slack channel
- **Documentation**: Browse [docs folder](../README.md)

## Platform Overview

MWAP is a multi-tenant project management platform with:
- **Multi-tenant Architecture**: Isolated data per organization
- **Role-based Access Control**: Granular permissions
- **Cloud Integrations**: AWS, Azure, GCP support
- **AI Agents**: Automated workflow assistance
- **RESTful API**: Comprehensive v1 API

**Technology Stack:**
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (native Node.js driver)
- **Authentication**: Auth0 with JWT
- **Testing**: Vitest
- **Documentation**: OpenAPI/Swagger