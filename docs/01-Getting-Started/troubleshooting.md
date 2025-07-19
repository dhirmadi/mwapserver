# Troubleshooting

Quick solutions for common MWAP development issues.

## Server Issues

### Port Already in Use
```bash
# Error: EADDRINUSE: address already in use :::3000
# Solution: Kill process or change port
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
# OR change PORT in .env file
```

### Environment Variables Missing
```bash
# Error: Missing required environment variable
# Solution: Check .env file exists and has all required variables
cp .env.example .env
# Then edit .env with your actual values
```

## Database Issues

### MongoDB Connection Failed
```bash
# Error: MongoServerError: bad auth
# Solutions:
1. Check MONGODB_URI in .env
2. Verify database user/password in Atlas
3. Whitelist your IP in Atlas Network Access
4. Ensure cluster is running
```

### Database Queries Failing
```typescript
// Problem: Tenant isolation errors
// Solution: Always include tenantId in queries
const projects = await Project.find({ 
  userId, 
  tenantId  // ← Don't forget this!
});
```

## Authentication Issues

### JWT Token Errors
```bash
# Error: UnauthorizedError: jwt malformed
# Solutions:
1. Check AUTH0_DOMAIN and AUTH0_AUDIENCE in .env
2. Verify token format: "Bearer your_token_here"
3. Ensure Auth0 application is configured correctly
4. Check token expiration
```

### Auth0 Configuration Issues
```bash
# Error: Invalid callback URL
# Solution: In Auth0 Dashboard, set:
# Allowed Callback URLs: http://localhost:3000/callback
# Allowed Logout URLs: http://localhost:3000
# Allowed Web Origins: http://localhost:3000
```

## Build and Testing Issues

### TypeScript Compilation Errors
```bash
# Error: Cannot find module or its corresponding type declarations
# Solutions:
npm install @types/node @types/express  # Install missing types
npm run type-check                      # Check for type errors
```

### Test Failures
```bash
# Common test issues:
1. Database not cleared between tests
2. Async operations not properly awaited
3. Mock functions not reset

# Solutions:
beforeEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
```

## Performance Issues

### Slow API Responses
```typescript
// Problem: N+1 database queries
// Bad:
for (const project of projects) {
  project.files = await File.find({ projectId: project.id });
}

// Good: Use aggregation
const projects = await Project.aggregate([
  { $lookup: { from: 'files', localField: '_id', foreignField: 'projectId', as: 'files' }}
]);
```

### Memory Leaks
```bash
# Symptoms: Gradually increasing memory usage
# Solutions:
1. Close database connections properly
2. Clear timers and intervals
3. Remove event listeners
4. Use --inspect flag to debug: node --inspect src/server.ts
```

## API Issues

### CORS Errors
```bash
# Error: Access to fetch blocked by CORS policy
# Solution: Check CORS_ORIGIN in .env matches your frontend URL
CORS_ORIGIN=http://localhost:3000
```

### Request Validation Errors
```typescript
// Problem: Zod validation failing
// Solution: Check request body matches schema
const schema = z.object({
  name: z.string().min(1),
  tenantId: z.string().uuid()
});

// Debug validation errors:
const result = schema.safeParse(req.body);
if (!result.success) {
  console.log(result.error.errors);  // Shows exact validation failures
}
```

## Docker Issues

### Container Won't Start
```bash
# Error: docker: Error response from daemon
# Solutions:
docker system prune          # Clean up unused containers
docker-compose down -v       # Remove volumes
docker-compose up --build    # Rebuild containers
```

### File Permission Issues
```bash
# Error: Permission denied in container
# Solution: Fix file ownership
sudo chown -R $USER:$USER .
```

## Quick Diagnostic Commands

### Check System Health
```bash
# Verify Node.js and npm
node --version && npm --version

# Check environment variables
cat .env | grep -v "PASSWORD\|SECRET"

# Test database connection
npm run db:test

# Check API health
curl http://localhost:3000/api/health
```

### Debug API Issues
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Test specific endpoint
curl -X GET http://localhost:3000/api/v3/projects \
  -H "Authorization: Bearer your_token"

# Check server logs
tail -f logs/app.log
```

## Get Help

**Still stuck?**
1. **Search existing issues** in the repository
2. **Check logs** for specific error messages
3. **Ask in Slack** `#mwap-dev` channel
4. **Create an issue** with reproduction steps
5. **Book office hours** with senior developers

**When asking for help, include:**
- Error message (full stack trace)
- Steps to reproduce
- Your environment (OS, Node version, etc.)
- What you've already tried

## Prevention Tips

### Daily Best Practices
- Run `npm run lint` before committing
- Use `npm run type-check` regularly
- Keep dependencies updated: `npm audit`
- Clear caches when issues arise: `npm cache clean --force`

### Environment Management
- Never commit `.env` files
- Use `.env.example` as template
- Document all required environment variables
- Use different `.env` files for different environments 