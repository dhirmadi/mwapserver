# FAQ

Common questions about MWAP development and architecture.

## Getting Started

### Q: How do I set up the development environment?
**A:** Follow the [Getting Started guide](./getting-started.md):
1. Install Node.js 20+ and npm 9+
2. Clone repo and run `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run `npm run dev`

### Q: What accounts do I need to create?
**A:** You need:
- **MongoDB Atlas** (free tier) for database
- **Auth0** (free tier) for authentication

### Q: Why is my server not starting?
**A:** Common causes:
- Port 3000 is already in use (change PORT in `.env`)
- Missing environment variables (check `.env` file)
- Dependencies not installed (run `npm install`)

## Architecture

### Q: Why TypeScript instead of JavaScript?
**A:** TypeScript provides:
- Type safety catches errors early
- Better IDE support and autocomplete
- Easier refactoring and team collaboration
- Self-documenting code through types

### Q: Why MongoDB instead of PostgreSQL?
**A:** MongoDB offers:
- Schema flexibility for evolving requirements
- Native JSON support for JS/TS applications
- Excellent cloud hosting with Atlas
- Better fit for our multi-tenant architecture

### Q: Why Auth0 instead of custom authentication?
**A:** Auth0 provides:
- Enterprise-grade security without building it ourselves
- Social logins (Google, GitHub, etc.)
- Multi-factor authentication
- Compliance features (GDPR, SOC2)
- Regular security updates

## Development

### Q: How does multi-tenancy work?
**A:** Every request includes a `tenantId` that isolates data:
```typescript
// Always include tenantId in database queries
const projects = await Project.find({ userId, tenantId });
```

### Q: What's the difference between roles?
**A:** 
- **SuperAdmin**: Platform-wide access
- **TenantAdmin**: Manage their organization
- **ProjectManager**: Manage specific projects
- **TeamMember**: Limited project access
- **Viewer**: Read-only access

### Q: How do I add a new API endpoint?
**A:** Follow this pattern:
1. Add route in `routes/` folder
2. Create controller in `features/` folder
3. Add validation schema
4. Write tests
5. Update API documentation

### Q: How do I debug API issues?
**A:** 
- Check server logs: `npm run dev`
- Use API docs: http://localhost:3000/api/docs
- Test with curl: `curl http://localhost:3000/api/health`
- Enable debug logging: `NODE_ENV=development`

## Testing

### Q: How do I run tests?
**A:** 
- All tests: `npm test`
- Watch mode: `npm run test:watch`
- Specific test: `npm test -- filename`

### Q: Why are my tests failing?
**A:** Common issues:
- Database not cleared between tests
- Missing environment variables
- Async operations not properly awaited
- Mock functions not reset

## Deployment

### Q: How do I deploy to production?
**A:** See the [Deployment Guide](../06-Guides/deployment-guide.md):
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy using Docker or your preferred platform

### Q: What environment variables are required in production?
**A:** Essential variables:
```
NODE_ENV=production
MONGODB_URI=your_production_db
AUTH0_DOMAIN=your_domain.auth0.com
AUTH0_AUDIENCE=your_api_identifier
JWT_SECRET=your_secret_key
ENCRYPTION_KEY=your_encryption_key
```

## Troubleshooting

### Q: "Port already in use" error?
**A:** 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or change port in .env
PORT=3001
```

### Q: "Cannot connect to MongoDB" error?
**A:** Check:
- MONGODB_URI in `.env` is correct
- IP address is whitelisted in Atlas
- Database user has correct permissions
- Internet connection is working

### Q: "JWT malformed" error?
**A:** Verify:
- AUTH0_DOMAIN and AUTH0_AUDIENCE in `.env`
- Token format: `Bearer your_token`
- Auth0 application configuration
- Token hasn't expired

### Q: How do I clear caches when things aren't working?
**A:** 
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Best Practices

### Q: What code style should I follow?
**A:** 
- Use TypeScript strict mode
- Follow ESLint rules: `npm run lint`
- Format code: `npm run format`
- Write tests for new features
- Include JSDoc comments for public APIs

### Q: How should I handle errors?
**A:** 
```typescript
// Use Result pattern for better error handling
async function getProject(id: string): Promise<Result<Project, Error>> {
  try {
    const project = await projectService.find(id);
    return Result.ok(project);
  } catch (error) {
    return Result.err(error);
  }
}
```

### Q: How do I contribute to the project?
**A:** 
1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes and write tests
4. Run `npm run lint` and `npm test`
5. Create pull request
6. Address code review feedback

## Support

### Q: Where can I get help?
**A:** 
- **Documentation**: Check `/docs` folder first
- **Troubleshooting**: See [troubleshooting guide](./troubleshooting.md)
- **Team Slack**: Ask in `#mwap-dev` channel
- **Issues**: Create GitHub issue with reproduction steps
- **Office Hours**: Tuesdays 2-4 PM with senior developers

### Q: How do I report a bug?
**A:** Create an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces
- Your environment (OS, Node version, etc.)
- What you've already tried 