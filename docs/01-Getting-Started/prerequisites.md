# 📋 MWAP Prerequisites

## 🎯 System Requirements

Before setting up MWAP, ensure your development environment meets these requirements.

## 💻 Development Environment

### **Operating System**
- **macOS**: 10.15 (Catalina) or later
- **Windows**: Windows 10 or later with WSL2 recommended
- **Linux**: Ubuntu 18.04+, CentOS 7+, or equivalent distributions

### **Hardware Requirements**
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: Minimum 10GB free space for development environment
- **CPU**: Multi-core processor recommended for optimal performance

## 🛠️ Required Software

### **Node.js (Required)**
- **Version**: Node.js 18.x or later (LTS recommended)
- **Package Manager**: npm 9.x or later (included with Node.js)

**Installation:**
```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or later
```

**Alternative Installation:**
- Download from [nodejs.org](https://nodejs.org/)
- Use package managers: `brew install node` (macOS), `apt install nodejs npm` (Ubuntu)

### **Git (Required)**
- **Version**: Git 2.20 or later
- **Configuration**: User name and email configured

**Installation:**
```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt update && sudo apt install git

# Windows
# Download from https://git-scm.com/download/win

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### **Code Editor (Recommended)**
- **Visual Studio Code** with TypeScript support
- **Extensions**: TypeScript, ESLint, Prettier, MongoDB for VS Code

**VS Code Extensions:**
```bash
# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension mongodb.mongodb-vscode
```

## 🗄️ Database Requirements

### **MongoDB Atlas (Required)**
- **Account**: Free MongoDB Atlas account
- **Cluster**: M0 (free tier) or higher
- **Network Access**: IP whitelist configured
- **Database User**: Created with read/write permissions

**Setup Steps:**
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster (M0 free tier sufficient for development)
3. Configure network access (add your IP or use 0.0.0.0/0 for development)
4. Create database user with read/write permissions
5. Get connection string for application configuration

**Connection String Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### **MongoDB Compass (Optional)**
- **Purpose**: GUI for MongoDB database management
- **Download**: [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
- **Usage**: Database visualization, query testing, performance monitoring

## 🔐 Authentication Requirements

### **Auth0 Account (Required)**
- **Account**: Free Auth0 account
- **Application**: Single Page Application configured
- **Domain**: Auth0 domain for JWT validation
- **API**: Auth0 API configured for backend authentication

**Setup Steps:**
1. Create account at [auth0.com](https://auth0.com/)
2. Create new tenant (development environment)
3. Create Single Page Application
4. Configure allowed callback URLs and origins
5. Create API for backend authentication
6. Note down domain, client ID, and client secret

**Required Auth0 Configuration:**
```javascript
// Application Settings
Application Type: Single Page Application
Allowed Callback URLs: http://localhost:3000/callback
Allowed Web Origins: http://localhost:3000
Allowed Logout URLs: http://localhost:3000

// API Settings
Identifier: https://api.mwap.local
Signing Algorithm: RS256
```

## 🌐 Development Tools

### **API Testing (Recommended)**
- **Postman**: API testing and documentation
- **Insomnia**: Alternative API client
- **curl**: Command-line HTTP client

**Postman Setup:**
1. Download from [postman.com](https://www.postman.com/)
2. Import MWAP API collection (provided in repository)
3. Configure environment variables for local development

### **Terminal/Shell (Required)**
- **macOS/Linux**: Built-in terminal
- **Windows**: PowerShell, Command Prompt, or WSL2
- **Enhanced**: iTerm2 (macOS), Windows Terminal, or Hyper

### **Package Managers (Optional)**
- **macOS**: Homebrew for system packages
- **Windows**: Chocolatey or Scoop for system packages
- **Linux**: System package manager (apt, yum, etc.)

## 🔧 Environment Setup

### **Environment Variables**
Create `.env` file with required configuration:

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap?retryWrites=true&w=majority

# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://api.mwap.local

# Application Configuration
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret-key

# Security Configuration
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Network Configuration**
- **Firewall**: Allow connections on development ports (3000, 5000)
- **DNS**: Ensure internet connectivity for Auth0 and MongoDB Atlas
- **Proxy**: Configure if behind corporate proxy

## 📦 Dependency Management

### **Global Dependencies**
```bash
# TypeScript compiler (optional, included in project)
npm install -g typescript

# Development utilities (optional)
npm install -g nodemon
npm install -g concurrently
```

### **Project Dependencies**
All project dependencies are managed through `package.json` and installed via:
```bash
npm install
```

## 🧪 Testing Requirements

### **Testing Framework**
- **Vitest**: Modern testing framework (included in project)
- **Supertest**: HTTP assertion library (included in project)
- **MongoDB Memory Server**: In-memory MongoDB for testing (included in project)

### **Test Database**
- **Separate Database**: Use different database for testing
- **Memory Database**: MongoDB Memory Server for isolated testing
- **Test Data**: Seed data for consistent testing

## 🔍 Verification Checklist

Before proceeding with MWAP setup, verify all prerequisites:

### **System Verification**
- [ ] Operating system meets minimum requirements
- [ ] Sufficient RAM and storage available
- [ ] Internet connection stable and unrestricted

### **Software Verification**
```bash
# Verify Node.js installation
node --version    # Should show v18.x.x or later
npm --version     # Should show 9.x.x or later

# Verify Git installation
git --version     # Should show 2.20 or later

# Verify Git configuration
git config --global user.name
git config --global user.email
```

### **Service Verification**
- [ ] MongoDB Atlas cluster created and accessible
- [ ] Database user created with proper permissions
- [ ] Network access configured for development IP
- [ ] Auth0 account created with application and API configured
- [ ] Auth0 domain, client ID, and client secret available

### **Environment Verification**
- [ ] Code editor installed with TypeScript support
- [ ] Terminal/shell configured and accessible
- [ ] API testing tool installed (Postman/Insomnia)
- [ ] Environment variables template prepared

## 🚨 Common Issues

### **Node.js Version Issues**
```bash
# If using wrong Node.js version
nvm list          # Show installed versions
nvm use 18        # Switch to Node.js 18
nvm alias default 18  # Set as default
```

### **MongoDB Connection Issues**
- **Network Access**: Ensure IP address is whitelisted
- **Credentials**: Verify username and password are correct
- **Connection String**: Check for special characters in password
- **Firewall**: Ensure port 27017 is not blocked

### **Auth0 Configuration Issues**
- **Domain**: Ensure correct Auth0 domain format
- **URLs**: Verify callback and origin URLs match exactly
- **API Identifier**: Ensure API identifier matches configuration
- **Permissions**: Verify API permissions are properly configured

### **Permission Issues**
```bash
# Fix npm permission issues (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Alternative: Use nvm for Node.js management
```

## 📞 Getting Help

### **Documentation Resources**
- [Environment Setup](./env-setup.md) - Detailed setup instructions
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [FAQ](./faq.md) - Frequently asked questions

### **Community Support**
- **GitHub Issues**: Technical questions and bug reports
- **GitHub Discussions**: General questions and community support
- **Documentation**: Comprehensive guides and references

### **External Resources**
- [Node.js Documentation](https://nodejs.org/docs/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Auth0 Documentation](https://auth0.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## ✅ Next Steps

Once all prerequisites are met:

1. **Clone Repository**: Get the MWAP source code
2. **Environment Setup**: Configure environment variables
3. **Install Dependencies**: Run `npm install`
4. **Database Setup**: Initialize database schema
5. **Start Development**: Run development server

Continue to [Environment Setup](./env-setup.md) for detailed configuration instructions.

---

*These prerequisites ensure a smooth MWAP development experience. Take time to properly configure each component before proceeding.*