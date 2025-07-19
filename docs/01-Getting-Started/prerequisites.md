# Prerequisites

This document outlines the system requirements, tools, and dependencies needed to develop and run the MWAP platform.

## 🖥️ System Requirements

### Operating System
- **macOS**: 10.15 (Catalina) or later
- **Windows**: Windows 10 or later with WSL2 recommended
- **Linux**: Ubuntu 18.04+ or equivalent distributions

### Hardware Requirements
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: At least 5GB free space for development environment
- **CPU**: Modern multi-core processor (Intel i5/AMD Ryzen 5 or better)

## 🛠️ Development Tools

### Node.js
- **Version**: Node.js 20.x LTS or later
- **Download**: [nodejs.org](https://nodejs.org/)
- **Verification**: `node --version` (should show v20.x.x or later)
- **npm**: Comes bundled with Node.js, version 10.x or later

### Package Manager
- **npm**: Default package manager (included with Node.js)
- **Alternative**: pnpm or yarn (optional, but npm is recommended)

### Code Editor
- **Recommended**: Visual Studio Code with TypeScript support
- **Extensions**:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - MongoDB for VS Code (optional)

### Git
- **Version**: Git 2.25 or later
- **Download**: [git-scm.com](https://git-scm.com/)
- **Configuration**: Set up user name and email
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 🗄️ Database Requirements

### MongoDB Atlas
- **Account**: Create a free account at [mongodb.com](https://www.mongodb.com/atlas)
- **Cluster**: Set up a free cluster (M0 tier sufficient for development)
- **Network Access**: Configure IP whitelist for your development machine
- **Database User**: Create a database user with read/write permissions
- **Connection String**: Obtain MongoDB URI for your cluster

### Local MongoDB (Optional)
- **Alternative**: Local MongoDB installation for offline development
- **Version**: MongoDB 6.0 or later
- **Installation**: Follow MongoDB installation guide for your OS

## 🔐 Authentication Services

### Auth0 Account
- **Account**: Create a free account at [auth0.com](https://auth0.com/)
- **Application**: Create a new Single Page Application
- **Configuration**:
  - Set allowed callback URLs
  - Configure JWT settings
  - Note down Domain and Client ID
- **API**: Create an API identifier for backend authentication

### Environment Configuration
- **Required Variables**: See [Environment Setup](./env-setup.md) for detailed configuration
- **Security**: Never commit secrets to version control
- **Local Development**: Use `.env` file for local configuration

## 🌐 Network Requirements

### Internet Connection
- **Bandwidth**: Stable internet connection for package downloads
- **Access**: Ability to reach npm registry, MongoDB Atlas, and Auth0
- **Firewall**: Ensure development ports (3000, 5173) are not blocked

### Development Ports
- **Backend**: Port 3000 (default, configurable)
- **Frontend**: Port 5173 (Vite development server)
- **Database**: MongoDB default port 27017 (if using local MongoDB)

## 🧰 Development Dependencies

### TypeScript
- **Installation**: Installed via npm as project dependency
- **Version**: 5.0 or later
- **Configuration**: Project includes `tsconfig.json`

### ESLint and Prettier
- **Purpose**: Code quality and formatting
- **Configuration**: Pre-configured in project
- **Editor Integration**: Install editor extensions for better experience

### Testing Framework
- **Vitest**: Modern testing framework with native ESM support
- **Installation**: Included in project dependencies
- **Purpose**: Unit and integration testing

## 📚 Knowledge Prerequisites

### Required Skills
- **JavaScript/TypeScript**: Intermediate to advanced proficiency
- **Node.js**: Understanding of server-side JavaScript
- **Express.js**: Basic knowledge of web application frameworks
- **MongoDB**: Basic understanding of NoSQL databases
- **RESTful APIs**: Understanding of API design principles
- **JWT Authentication**: Basic knowledge of token-based authentication

### Recommended Skills
- **OAuth 2.0**: Understanding of authorization flows
- **Testing**: Experience with unit and integration testing
- **Git**: Version control and branching strategies
- **Docker**: Containerization concepts (for future deployment)

## 🔧 Optional Tools

### Database Management
- **MongoDB Compass**: Official GUI for MongoDB
- **Studio 3T**: Advanced MongoDB IDE (commercial)
- **VS Code Extensions**: MongoDB for VS Code

### API Testing
- **Postman**: API development and testing tool
- **Insomnia**: Alternative REST client
- **Thunder Client**: VS Code extension for API testing

### Development Utilities
- **Nodemon**: Auto-restart development server (included in project)
- **Docker**: Container platform (for advanced setups)
- **Homebrew** (macOS): Package manager for development tools

## ✅ Verification Checklist

Before starting development, verify you have:

### System Check
- [ ] Node.js 20.x or later installed
- [ ] npm 10.x or later available
- [ ] Git configured with user credentials
- [ ] Code editor with TypeScript support
- [ ] Stable internet connection

### Service Setup
- [ ] MongoDB Atlas cluster created and accessible
- [ ] Auth0 account with application configured
- [ ] Environment variables documented
- [ ] Network ports available (3000, 5173)

### Development Environment
- [ ] Repository cloned locally
- [ ] Dependencies installed (`npm install`)
- [ ] Environment configuration completed
- [ ] Development server starts successfully
- [ ] Database connection verified

## 🚀 Next Steps

After meeting all prerequisites:

1. **Setup Environment**: Follow [Environment Setup](./env-setup.md) guide
2. **Initial Configuration**: Complete [Getting Started](./getting-started.md) steps
3. **Development Workflow**: Review [Contributing Guidelines](../00-Overview/contributors.md)
4. **Troubleshooting**: Check [Troubleshooting Guide](./troubleshooting.md) if issues arise

## 📞 Getting Help

If you encounter issues with prerequisites:

1. **Documentation**: Check the specific setup guides for each tool
2. **Community**: Search for solutions in official documentation
3. **Team Support**: Reach out to team members for assistance
4. **GitHub Issues**: Create an issue if problems persist

---

*This prerequisites guide ensures a smooth development experience with MWAP.* 