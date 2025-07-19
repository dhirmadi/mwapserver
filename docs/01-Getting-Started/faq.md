# Frequently Asked Questions (FAQ)

This document answers common questions about MWAP development, architecture, and usage.

## 🏗️ Architecture & Design

### Q: Why does MWAP use TypeScript instead of JavaScript?
**A:** TypeScript provides several critical benefits for MWAP:
- **Type Safety**: Catches errors at compile time rather than runtime
- **Better IDE Support**: Enhanced autocomplete, refactoring, and navigation
- **Self-Documenting Code**: Types serve as inline documentation
- **Easier Refactoring**: Changes are safer and more predictable
- **Team Collaboration**: Consistent interfaces across team members

### Q: Why MongoDB instead of PostgreSQL or MySQL?
**A:** MongoDB was chosen for MWAP because:
- **Schema Flexibility**: Easy to evolve data models as requirements change
- **JSON Native**: Natural fit for JavaScript/TypeScript applications
- **Cloud Integration**: MongoDB Atlas provides excellent managed hosting
- **Scalability**: Built-in horizontal scaling capabilities
- **Developer Experience**: Intuitive query syntax and operations

### Q: What is the ESM-only approach and why?
**A:** MWAP uses only ECMAScript Modules (ESM) because:
- **Future-Proof**: ESM is the JavaScript standard going forward
- **Better Tree Shaking**: Improved bundle optimization
- **Static Analysis**: Better tooling and IDE support
- **Performance**: Faster module loading and resolution
- **Consistency**: Same module system in both Node.js and browsers

### Q: Why Auth0 instead of building custom authentication?
**A:** Auth0 provides enterprise-grade authentication features:
- **Security**: Battle-tested security implementations
- **Compliance**: Built-in GDPR, SOC2, and other compliance features
- **Time to Market**: Faster development without reinventing authentication
- **Social Logins**: Easy integration with Google, GitHub, etc.
- **MFA Support**: Multi-factor authentication out of the box
- **Maintenance**: Regular security updates without internal effort

## 🚀 Development

### Q: How do I set up the development environment?
**A:** Follow these steps:
1. Install [Node.js 20+](https://nodejs.org/)
2. Clone the repository: `git clone <repo-url>`
3. Install dependencies: `npm install`
4. Set up environment variables (see [Environment Setup](./env-setup.md))
5. Start development server: `npm run dev`

For detailed instructions, see [Getting Started](./getting-started.md).

### Q: Can I use yarn or pnpm instead of npm?
**A:** While technically possible, **npm is strongly recommended** because:
- Project is configured and tested with npm
- Package-lock.json is optimized for npm
- Documentation assumes npm usage
- CI/CD pipelines use npm

If you must use alternatives, ensure compatibility and test thoroughly.

### Q: How do I add a new API endpoint?
**A:** Follow the established pattern:
1. **Create route file**: `src/features/{domain}/{domain}.routes.ts`
2. **Add controller**: `src/features/{domain}/{domain}.controller.ts`
3. **Add service logic**: `src/features/{domain}/{domain}.service.ts`
4. **Update schemas**: `src/schemas/{domain}.schema.ts`
5. **Add tests**: `tests/features/{domain}/`

See [Feature Pattern Guide](../features/feature-pattern.md) for details.

### Q: How do I run tests locally?
**A:** Use these commands:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

### Q: Why are some tests postponed to Phase 8?
**A:** MWAP follows a **build-first, test-comprehensive-later** approach:
- **Rapid Development**: Focus on core functionality first
- **Avoiding Test Debt**: Tests written after functionality is stable
- **Better Test Design**: Tests based on real usage patterns
- **Comprehensive Coverage**: Phase 8 focuses entirely on testing quality

## 🔐 Security

### Q: How does authentication work in MWAP?
**A:** MWAP uses JWT-based authentication:
1. **Frontend**: Users log in via Auth0 Universal Login
2. **Token**: Auth0 issues a JWT token to the frontend
3. **API Calls**: Frontend sends token in Authorization header
4. **Validation**: Backend validates token using Auth0's public keys
5. **Access Control**: Roles and permissions control resource access

### Q: How is multi-tenancy implemented?
**A:** MWAP implements multi-tenancy through:
- **Data Isolation**: All data is scoped by `tenantId`
- **Access Control**: Users can only access their tenant's data
- **Database Design**: Tenant ID is included in all relevant documents
- **Middleware**: Automatic tenant validation on all requests
- **Security**: No cross-tenant data leakage possible

### Q: How are sensitive data like OAuth tokens stored?
**A:** Sensitive data is protected through:
- **Encryption at Rest**: OAuth tokens encrypted before database storage
- **Secure Keys**: Encryption keys stored in secure environment variables
- **Access Logging**: All token access is logged for audit trails
- **Rotation**: Tokens are refreshed using OAuth refresh flows
- **Minimal Storage**: Only necessary tokens are stored

### Q: What security measures are in place?
**A:** MWAP implements comprehensive security:
- **JWT Validation**: RS256 signatures with Auth0 JWKS
- **Input Validation**: Zod schemas validate all inputs
- **SQL Injection Prevention**: MongoDB's BSON prevents injection
- **CORS Protection**: Configured for specific origins only
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Security Headers**: Helmet.js adds security headers
- **HTTPS Only**: All production traffic uses TLS

## 🗄️ Database

### Q: How do I perform database migrations?
**A:** MWAP uses application-level migrations:
```bash
# Development
npm run migrate:dev

# Production (with backup)
npm run db:backup
npm run migrate:prod
```

See [Migration Guide](./migration-deployment-guide.md) for details.

### Q: Can I use a local MongoDB instead of Atlas?
**A:** Yes, for development only:
```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community

# Start MongoDB
brew services start mongodb-community

# Update .env
MONGODB_URI=mongodb://localhost:27017/mwap-dev
```

**Production must use MongoDB Atlas** for security and reliability.

### Q: How do I backup the database?
**A:** Use MongoDB tools:
```bash
# Backup
mongodump --uri="mongodb+srv://..." --archive=backup.archive

# Restore
mongorestore --uri="mongodb+srv://..." --archive=backup.archive
```

## 🔌 Integrations

### Q: How do I add a new cloud provider?
**A:** Follow the OAuth integration pattern:
1. **Add Provider**: Create entry in `cloudProviders` collection
2. **OAuth Flow**: Implement OAuth 2.0 authorization
3. **Token Management**: Store and refresh tokens securely
4. **API Integration**: Implement file listing and operations
5. **Testing**: Add comprehensive tests for the integration

See existing providers (Google Drive, Dropbox) as examples.

### Q: Why are cloud integrations tenant-scoped?
**A:** Tenant-scoped integrations provide:
- **Data Isolation**: Each tenant's integrations are separate
- **Security**: No cross-tenant access to cloud accounts
- **Management**: Tenants can manage their own integrations
- **Billing**: Usage can be tracked per tenant
- **Compliance**: Easier to meet data residency requirements

### Q: How do OAuth tokens get refreshed?
**A:** Token refresh is automatic:
1. **Expiry Detection**: API calls detect expired tokens
2. **Refresh Flow**: Use stored refresh token to get new access token
3. **Update Storage**: New tokens are encrypted and stored
4. **Retry Request**: Original API request is retried with new token
5. **Error Handling**: If refresh fails, user must re-authenticate

## 📊 Performance

### Q: How does MWAP handle large file operations?
**A:** Performance optimizations include:
- **Virtual Files**: Only metadata is stored, not file content
- **Pagination**: File lists are paginated to prevent memory issues
- **Caching**: Frequently accessed metadata is cached
- **Streaming**: Large operations use streams when possible
- **Background Processing**: Heavy operations run asynchronously

### Q: What are the rate limits?
**A:** Rate limiting protects against abuse:
- **API Endpoints**: 100 requests per minute per IP
- **Authentication**: 5 login attempts per minute per IP
- **File Operations**: 50 file API calls per minute per user
- **Cloud APIs**: Respect provider-specific rate limits

### Q: How do I optimize database queries?
**A:** Follow these practices:
- **Use Indexes**: Add indexes for frequently queried fields
- **Limit Results**: Always use pagination for large datasets
- **Project Fields**: Only fetch required fields with projection
- **Aggregate Efficiently**: Use aggregation pipelines for complex queries
- **Monitor Performance**: Use MongoDB Compass to analyze slow queries

## 🧪 Testing

### Q: Why does MWAP use Vitest instead of Jest?
**A:** Vitest is chosen for:
- **ESM Support**: Native ESM compatibility without configuration
- **Speed**: Faster test execution and watch mode
- **Vite Integration**: Seamless integration with Vite tooling
- **TypeScript**: Better TypeScript support out of the box
- **Modern Features**: Latest testing features and APIs

### Q: How do I mock external services in tests?
**A:** Use Vitest mocking:
```typescript
// Mock Auth0
vi.mock('jsonwebtoken', () => ({
  verify: vi.fn().mockReturnValue({ sub: 'test-user' })
}));

// Mock MongoDB
vi.mock('../config/db', () => ({
  getCollection: vi.fn().mockReturnValue({
    findOne: vi.fn(),
    insertOne: vi.fn()
  })
}));
```

### Q: What testing strategies does MWAP use?
**A:** MWAP employs multiple testing strategies:
- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test API endpoints and database operations
- **Service Tests**: Test business logic in service classes
- **Mock Testing**: Test with mocked external dependencies
- **Contract Testing**: Ensure API contracts are maintained

## 🚀 Deployment

### Q: How do I deploy MWAP to production?
**A:** Production deployment involves:
1. **Build**: `npm run build` creates optimized code
2. **Environment**: Set production environment variables
3. **Database**: Run migrations and verify connectivity
4. **Deploy**: Use platform-specific deployment (Heroku, AWS, etc.)
5. **Verify**: Test health endpoints and core functionality

See [Deployment Guide](./migration-deployment-guide.md) for platform-specific instructions.

### Q: Can I use Docker for deployment?
**A:** Yes, MWAP supports Docker deployment:
```bash
# Build image
docker build -t mwap-api .

# Run container
docker run -p 3000:3000 --env-file .env.production mwap-api
```

See Docker section in [Deployment Guide](./migration-deployment-guide.md).

### Q: How do I monitor MWAP in production?
**A:** Production monitoring includes:
- **Health Checks**: `/health` endpoint for uptime monitoring
- **Application Logs**: Structured JSON logging with levels
- **Error Tracking**: Integration with error tracking services
- **Performance Metrics**: Response times and resource usage
- **Security Monitoring**: Failed authentication attempts and suspicious activity

## 🤝 Contributing

### Q: How do I contribute to MWAP?
**A:** Follow the contribution process:
1. **Fork Repository**: Create your own fork
2. **Create Branch**: Use descriptive branch names
3. **Make Changes**: Follow coding standards and patterns
4. **Test**: Ensure all tests pass
5. **Documentation**: Update relevant documentation
6. **Pull Request**: Use the PR template

See [Contributing Guide](../00-Overview/contributors.md) for details.

### Q: What coding standards does MWAP follow?
**A:** MWAP enforces:
- **TypeScript Strict**: No implicit `any` types
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automated code formatting
- **Feature Pattern**: Consistent file and folder structure
- **Security First**: Security considerations in all code
- **DRY Principle**: Don't repeat yourself

### Q: How do I report bugs or request features?
**A:** Use GitHub issues:
- **Bug Reports**: Use the bug report template with reproduction steps
- **Feature Requests**: Use the feature request template with use cases
- **Documentation**: Use the documentation issue template
- **Security Issues**: Report privately to maintainers first

## 🔍 Troubleshooting

### Q: The development server won't start. What should I check?
**A:** Common issues and solutions:
1. **Port in use**: Change PORT in `.env` or kill process using port 3000
2. **Environment variables**: Verify `.env` file exists and has required variables
3. **Dependencies**: Run `npm install` to ensure all packages are installed
4. **Node version**: Verify Node.js 20+ is installed
5. **Database**: Check MongoDB Atlas connectivity

See [Troubleshooting Guide](./troubleshooting.md) for more issues.

### Q: I'm getting authentication errors. How do I debug?
**A:** Debug authentication issues:
1. **Check Auth0 Config**: Verify domain and audience in `.env`
2. **Token Format**: Ensure `Authorization: Bearer <token>` header format
3. **Token Validity**: Check token at [jwt.io](https://jwt.io/)
4. **CORS Settings**: Verify Auth0 application CORS configuration
5. **Network**: Ensure Auth0 JWKS endpoint is accessible

### Q: Database operations are slow. How do I optimize?
**A:** Optimize database performance:
1. **Add Indexes**: Create indexes for frequently queried fields
2. **Limit Results**: Use pagination to limit result sets
3. **Monitor Queries**: Use MongoDB Compass to identify slow queries
4. **Connection Pooling**: Ensure proper connection pool configuration
5. **Query Optimization**: Review and optimize aggregation pipelines

## 📚 Learning Resources

### Q: Where can I learn more about the technologies used?
**A:** Recommended learning resources:
- **Node.js**: [Official Documentation](https://nodejs.org/docs/)
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Express.js**: [Express Guide](https://expressjs.com/en/guide/)
- **MongoDB**: [MongoDB University](https://university.mongodb.com/)
- **Auth0**: [Auth0 Documentation](https://auth0.com/docs/)
- **Testing**: [Vitest Documentation](https://vitest.dev/)

### Q: How do I stay updated with MWAP changes?
**A:** Stay informed through:
- **Git History**: Review commit messages and pull requests
- **Documentation**: Check for documentation updates
- **Team Meetings**: Participate in development discussions
- **Changelog**: Review the [Changelog](../00-Overview/changelog.md)
- **GitHub Notifications**: Watch the repository for updates

---

*This FAQ is regularly updated based on common questions from the MWAP development team and community.* 