# Getting Started with MWAP

This guide will help you set up and run the MWAP (Modular Web Application Platform) development environment.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 20+**: [Download from nodejs.org](https://nodejs.org/)
- **npm 9+**: Comes with Node.js
- **Git**: [Download from git-scm.com](https://git-scm.com/)
- **MongoDB Atlas Account**: [Sign up at mongodb.com](https://www.mongodb.com/atlas)
- **Auth0 Account**: [Sign up at auth0.com](https://auth0.com/)

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mwapserver
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap

# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Encryption Key (generate a secure random key)
ENCRYPTION_KEY=your-32-character-encryption-key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 🔧 Detailed Setup

### MongoDB Atlas Setup

1. **Create a Cluster**:
   - Log in to MongoDB Atlas
   - Create a new cluster (free tier is sufficient for development)
   - Wait for the cluster to be provisioned

2. **Configure Network Access**:
   - Go to Network Access in the Atlas dashboard
   - Add your IP address or use `0.0.0.0/0` for development (not recommended for production)

3. **Create Database User**:
   - Go to Database Access
   - Create a new database user with read/write permissions
   - Note the username and password for your `.env` file

4. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string and update your `.env` file

### Auth0 Setup

1. **Create an Application**:
   - Log in to Auth0 Dashboard
   - Create a new application (Single Page Application type)
   - Note the Domain, Client ID, and Client Secret

2. **Configure Application**:
   - Set Allowed Callback URLs: `http://localhost:3000/callback`
   - Set Allowed Logout URLs: `http://localhost:3000`
   - Set Allowed Web Origins: `http://localhost:3000`

3. **Create an API**:
   - Go to APIs in the Auth0 Dashboard
   - Create a new API
   - Set the Identifier (this becomes your AUTH0_AUDIENCE)
   - Enable RBAC and Add Permissions in the Access Token

4. **Configure Roles** (Optional):
   - Go to User Management > Roles
   - Create roles like `superadmin`, `tenant-owner`, etc.
   - Assign permissions to roles as needed

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `AUTH0_DOMAIN` | Auth0 tenant domain | `your-domain.auth0.com` |
| `AUTH0_AUDIENCE` | Auth0 API identifier | `https://api.mwap.dev` |
| `AUTH0_CLIENT_ID` | Auth0 application client ID | `abc123...` |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret | `secret123...` |
| `ENCRYPTION_KEY` | 32-character encryption key | `your-32-char-key-here-123456789` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |

## 🧪 Verify Installation

### 1. Health Check

Test that the server is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok"
}
```

### 2. API Documentation

Visit the interactive API documentation (requires authentication):
```
http://localhost:3000/docs
```

### 3. Test Authentication

To test authentication, you'll need a valid JWT token from Auth0. You can:

1. Use the Auth0 Dashboard to generate a test token
2. Implement a simple login flow
3. Use tools like Postman with Auth0 integration

## 📁 Project Structure

```
mwapserver/
├── src/                    # Source code
│   ├── app.ts             # Express app configuration
│   ├── server.ts          # Server startup
│   ├── config/            # Configuration files
│   ├── features/          # Feature modules
│   ├── middleware/        # Express middleware
│   ├── schemas/           # Zod validation schemas
│   └── utils/             # Utility functions
├── docs/                  # Documentation
├── tests/                 # Test files
├── scripts/               # Build and deployment scripts
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vitest.config.ts       # Test configuration
```

## 🛠️ Development Commands

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript type checking

# Documentation
npm run docs:validate # Validate documentation links
npm run docs:check   # Full documentation validation
```

### Development Workflow

1. **Start the development server**: `npm run dev`
2. **Make changes**: Edit files in the `src/` directory
3. **Test changes**: The server will automatically restart
4. **Run tests**: `npm test` to ensure everything works
5. **Check types**: `npm run type-check` for TypeScript errors
6. **Lint code**: `npm run lint` for code style issues

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Change the PORT in your `.env` file or kill the process using the port.

#### MongoDB Connection Failed
```bash
MongoServerError: bad auth : authentication failed
```
**Solutions**:
- Check your MongoDB URI in `.env`
- Verify database user credentials
- Ensure network access is configured in Atlas

#### Auth0 Configuration Issues
```bash
UnauthorizedError: jwt malformed
```
**Solutions**:
- Verify AUTH0_DOMAIN and AUTH0_AUDIENCE in `.env`
- Check that your JWT token is valid
- Ensure Auth0 application is configured correctly

#### Missing Environment Variables
```bash
Error: Missing required environment variable: MONGODB_URI
```
**Solution**: Ensure all required environment variables are set in your `.env` file.

### Getting Help

1. **Check the logs**: The development server provides detailed error messages
2. **Review documentation**: Check the relevant documentation sections
3. **Verify configuration**: Double-check your `.env` file settings
4. **Test components**: Use the health check and API documentation endpoints
5. **Check dependencies**: Ensure all npm packages are installed correctly

## 📚 Next Steps

After completing the setup:

1. **Explore the API**: Use the interactive documentation at `/docs`
2. **Review Architecture**: Read the [System Design](../02-Architecture/system-design.md)
3. **Understand Features**: Check the [Backend Documentation](../04-Backend/)
4. **Learn Development Patterns**: Review [Coding Standards](../07-Standards/coding-standards.md)
5. **Start Contributing**: Follow the [Contributing Guide](../08-Contribution/contributing.md)

## 🎯 Development Tips

### Best Practices

1. **Use TypeScript**: Take advantage of type safety throughout development
2. **Follow ESM**: Use native ES modules (import/export) instead of CommonJS
3. **Validate Early**: Use Zod schemas for request validation
4. **Test Regularly**: Run tests frequently during development
5. **Check Types**: Use `npm run type-check` to catch TypeScript errors

### Recommended VS Code Extensions

- **TypeScript**: Built-in TypeScript support
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **REST Client**: Test API endpoints directly in VS Code
- **MongoDB**: MongoDB integration and query tools

---
*This guide covers the essential setup for MWAP development. For more detailed information, refer to the specific documentation sections.*