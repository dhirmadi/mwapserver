# MWAP Development Guide

This comprehensive guide covers everything you need to know for developing with the MWAP platform, from quick setup to advanced debugging and AI agent development.

## 🚀 Quick Start (15 Minutes)

### Prerequisites
Before you begin, ensure you have:
- **Node.js 20+** installed ([download here](https://nodejs.org/))
- **Git** installed and configured
- **MongoDB Atlas** account (free tier works)
- **Auth0** account (free tier works)
- **Code Editor** (VS Code recommended)

### ⚡ 5-Minute Setup

#### 1. Clone and Install
```bash
# Clone the repository
git clone <repo-url>
cd mwap-server

# Install dependencies
npm install
```

#### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required environment variables:**
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=your-mongodb-atlas-connection-string
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.mwap.dev
JWT_SECRET=your-random-secret-for-development
ENCRYPTION_KEY=your-32-character-encryption-key
```

#### 3. Start Development Server
```bash
# Start development server
npm run dev

# Server should start on http://localhost:3000
# Check health: curl http://localhost:3000/health
```

### 🔧 Detailed Configuration

#### MongoDB Atlas Setup (2 minutes)
1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create Cluster**: Choose free tier and closest region
3. **Database Access**: Add user with `Atlas Admin` role
4. **Network Access**: Add your IP (or `0.0.0.0/0` for development)
5. **Connect**: Copy connection string and update `.env`

#### Auth0 Setup (3 minutes)
1. **Create Account**: Go to [Auth0](https://auth0.com/)
2. **Create Application**: 
   - Name: "MWAP Development"
   - Type: "Single Page Web Applications"
3. **Create API**:
   - Name: "MWAP Backend API"  
   - Identifier: `https://api.mwap.dev`
   - Signing Algorithm: RS256
4. **Copy Configuration**: Update `.env` with domain and audience

#### Generate Security Keys
```bash
# JWT Secret (for development only)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 🧪 Verify Your Setup

#### 1. Health Check
```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy","database":"connected","auth":"configured"}
```

#### 2. Database Connection
```bash
# Check server logs for:
# ✓ Connected to MongoDB Atlas
# ✓ Database indexes created successfully
```

#### 3. Run Tests
```bash
npm test
# All tests should pass
```

#### 4. First API Request
```bash
# Without authentication (health check)
curl http://localhost:3000/health

# With authentication (get user roles)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/users/me/roles
```

## 🎯 Development Workflow

### Daily Development Commands
```bash
# Start development server with hot reload
npm run dev

# Run tests in watch mode (separate terminal)
npm run test:watch

# Check TypeScript types
npm run type-check

# Lint and format code
npm run lint
npm run lint:fix
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes following established patterns
# ... edit files ...

# Test changes
npm test
npm run type-check

# Commit with descriptive message
git add .
git commit -m "feat: add user profile management"

# Push feature branch
git push origin feature/your-feature-name

# Create pull request through GitHub/GitLab
```

### Code Organization Patterns

#### Feature-Based Structure
```
src/features/{feature-name}/
├── {feature}.controller.ts   # Request handlers
├── {feature}.service.ts      # Business logic
├── {feature}.routes.ts       # Route definitions
└── {feature}.types.ts        # TypeScript interfaces
```

#### Adding a New Feature
```typescript
// 1. Define schema (src/schemas/{feature}.schema.ts)
export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  projectId: z.string(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

// 2. Add route (src/features/tasks/tasks.routes.ts)
import { Router } from 'express';
import { validateRequest } from '../../utils/validate.js';
import * as controller from './tasks.controller.js';

const router = Router();
router.post('/', validateRequest(CreateTaskSchema), controller.create);
export function getTasksRouter() { return router; }

// 3. Add controller (src/features/tasks/tasks.controller.ts)
export async function create(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const taskData = validateWithSchema(CreateTaskSchema, req.body);
  
  const task = await taskService.create(taskData, user.sub);
  return jsonResponse(res, task, 201);
}

// 4. Add service (src/features/tasks/tasks.service.ts)
export class TaskService {
  async create(data: CreateTaskRequest, userId: string): Promise<Task> {
    const task = {
      _id: new ObjectId(),
      ...data,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.collection.insertOne(task);
    return task;
  }
}

// 5. Register routes (src/app.ts)
const { getTasksRouter } = await import('./features/tasks/tasks.routes.js');
app.use('/api/v1/tasks', getTasksRouter());
```

## 🔍 Debugging and Troubleshooting

### Development Debugging Tools

#### Structured Logging
```typescript
import { logInfo, logError, logWarning } from '../utils/logger.js';

// Log with context
logInfo('User action completed', {
  userId: user.sub,
  action: 'createProject',
  projectId: result._id,
  duration: Date.now() - startTime
});

// Error logging with full context
logError('Database operation failed', {
  operation: 'insertProject',
  userId: user.sub,
  error: error.message,
  stack: error.stack
});
```

#### Node.js Debugging
```bash
# Start with Node.js debugger
NODE_OPTIONS="--inspect" npm run dev

# Connect Chrome DevTools
# Navigate to chrome://inspect
```

#### VS Code Debugging Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.ts",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true
    }
  ]
}
```

### Common Issues and Solutions

#### Authentication Problems

**JWT Token Issues:**
```bash
# Error: jwt malformed
→ Check Authorization header format: "Bearer <token>"
→ Verify token is properly encoded
→ Check for extra whitespace or newlines

# Error: jwt audience invalid
→ Verify AUTH0_AUDIENCE matches API identifier
→ Check Auth0 API configuration

# Error: Unable to verify signature
→ Verify AUTH0_DOMAIN is correct
→ Check Auth0 tenant configuration
→ Ensure JWKS endpoint is accessible
```

**Debug Steps:**
```typescript
// Add debug logging to auth middleware
export const authenticateJWT = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    logInfo('JWT Debug', {
      hasAuthHeader: !!req.headers.authorization,
      headerFormat: req.headers.authorization?.substring(0, 20),
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20)
    });
    
    // ... rest of implementation
  };
};
```

#### Database Issues

**Connection Problems:**
```bash
# Error: MongoNetworkError
→ Check MONGODB_URI format
→ Verify MongoDB server is running
→ Check network connectivity
→ Verify credentials and permissions

# Error: Authentication failed
→ Check MongoDB username/password
→ Verify database exists
→ Check user permissions on database
```

**Query Debugging:**
```typescript
// Add query logging
export async function findTenantById(id: string) {
  const startTime = Date.now();
  
  logInfo('Database query start', {
    operation: 'findTenantById',
    collection: 'tenants',
    query: { _id: id }
  });
  
  try {
    const result = await db.collection('tenants').findOne({ 
      _id: new ObjectId(id) 
    });
    
    logInfo('Database query success', {
      operation: 'findTenantById',
      duration: Date.now() - startTime,
      found: !!result
    });
    
    return result;
  } catch (error) {
    logError('Database query failed', {
      operation: 'findTenantById',
      duration: Date.now() - startTime,
      error: error.message
    });
    throw error;
  }
}
```

#### Server Startup Issues

**Port Already in Use:**
```bash
# Error: EADDRINUSE :::3000
→ Kill existing process: lsof -ti:3000 | xargs kill
→ Change PORT environment variable
→ Check for duplicate server instances
```

**Environment Variables:**
```bash
# Error: Environment variable required
→ Check .env file exists and is loaded
→ Verify variable names and values
→ Check for typos in variable names
```

#### API Response Issues

**404 Not Found:**
```bash
# API endpoints returning 404
→ Verify route registration order
→ Check dynamic import paths
→ Ensure middleware doesn't interfere
→ Verify route patterns match requests
```

### Debugging Workflows

#### API Request Debugging
```bash
# Step 1: Check request format
curl -X POST http://localhost:3000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Test Tenant"}' \
  -v

# Step 2: Check server logs
npm run dev # Watch console output

# Step 3: Test individual components
curl http://localhost:3000/health
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/users/me/roles
```

#### Database Query Debugging
```bash
# MongoDB Compass connection
mongodb://localhost:27017/mwap_dev

# CLI debugging
mongosh mwap_dev
> db.tenants.find().pretty()
> db.projects.find({"members.userId": "auth0|123"})
```

### Performance Debugging

#### Response Time Analysis
```typescript
// Performance monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (duration > 1000) { // Log slow requests
      logWarning('Slow request detected', {
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
        userId: req.auth?.sub
      });
    }
  });
  
  next();
});
```

#### Memory Usage Monitoring
```typescript
// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  
  logInfo('Memory usage', {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
    external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
  });
}, 60000); // Every minute
```

## 🚀 Minimal Heroku Testing Strategy (No CI/CD)

When pushing to the default branch, Heroku auto-deploys to staging. Keep checks minimal and fast:

### Local (pre-push)
- Run fast type and critical tests:
  - `npm run type-check` (optional if configured)
  - `npm run test:critical` (utils subset; fast and green)
- Optional OpenAPI smoke:
  - `npx tsx tests/openapiendpoint/test-phase4-simple.ts`

### Additional suites (manual, not in release gate)
- Middleware auth tests:
  - `npx vitest run tests/middleware/auth.test.ts`
- OAuth callback security tests:
  - `npx vitest run tests/oauth/oauthCallbackSecurity.test.ts`
- Optional OpenAPI smoke:
  - `npx tsx tests/openapiendpoint/test-phase4-simple.ts`

### Heroku Release Phase (automatic)
- The `Procfile` runs a one-line release gate to catch issues quickly:
  - `release: npx --yes tsx scripts/production-readiness-check.ts && npx --yes tsx scripts/verify-oauth-security.ts && npx --yes tsx scripts/deployment-validation.ts`
- If any step fails, the release aborts and staging is not flipped.

### Database Indexes (build-time)
- Heroku `heroku-postbuild` runs `scripts/create-indexes.ts` to ensure essential indexes:
  - `tenants.ownerId` (unique)
  - `projects.tenantId`
  - `projects.members.userId`
  - `superadmins.userId` (unique)

### After Dyno Starts (staging sanity)
- Rely on `GET /health`.
- Optional: curl one protected endpoint with a test JWT to confirm 401/200 behavior.

### Intentionally Not Automatic
- Heavy integration/performance suites; run ad-hoc to keep deploys fast.

## 🤖 AI Agent Development

### Agent Development Overview

AI Agents in MWAP are modular components that provide automated functionality for projects. They follow a standardized pattern for easy integration and maintenance.

### Planning Your Agent

#### Define Agent Specification
```typescript
interface AgentSpecification {
  name: string;
  purpose: string;
  capabilities: string[];
  inputs: InputSchema[];
  outputs: OutputSchema[];
  dependencies: string[];
  performance: PerformanceRequirements;
}

const documentSummarizerSpec: AgentSpecification = {
  name: 'DocumentSummarizerAgent',
  purpose: 'Generate concise summaries of project documents',
  capabilities: ['text-analysis', 'summarization', 'keyword-extraction'],
  inputs: [
    { name: 'document', type: 'File', required: true },
    { name: 'maxLength', type: 'number', required: false, default: 500 }
  ],
  outputs: [
    { name: 'summary', type: 'string' },
    { name: 'keywords', type: 'string[]' },
    { name: 'confidence', type: 'number' }
  ],
  dependencies: ['OpenAI API', 'File Service'],
  performance: {
    maxProcessingTime: 30000, // 30 seconds
    maxMemoryUsage: 256 * 1024 * 1024, // 256MB
    concurrentRequests: 10
  }
};
```

### Agent Implementation

#### Create Agent Structure
```
src/features/agents/document-summarizer/
├── documentSummarizer.controller.ts
├── documentSummarizer.service.ts
├── documentSummarizer.routes.ts
├── documentSummarizer.types.ts
└── __tests__/
    ├── documentSummarizer.controller.test.ts
    └── documentSummarizer.service.test.ts
```

#### Base Agent Service
```typescript
// src/features/agents/document-summarizer/documentSummarizer.service.ts
import { BaseAgent } from '../base/BaseAgent.js';
import { AgentResult, AgentError } from '../types/index.js';

export interface DocumentSummarizerInput {
  tenantId: string;
  document: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    path: string;
  };
  maxLength?: number;
}

export interface DocumentSummarizerOutput {
  summary: string;
  keywords: string[];
  confidence: number;
}

export class DocumentSummarizerService extends BaseAgent<DocumentSummarizerInput, DocumentSummarizerOutput> {
  constructor(
    private openAIService: OpenAIService,
    private fileService: FileService,
    logger: Logger
  ) {
    super({
      name: 'document-summarizer',
      version: '1.0.0',
      capabilities: ['text-analysis', 'summarization', 'keyword-extraction']
    }, logger);
  }

  async validateInput(input: DocumentSummarizerInput): Promise<void> {
    if (!input.tenantId) {
      throw new AgentError('VALIDATION_FAILED', 'Tenant ID is required');
    }
    
    if (!input.document || !input.document.id) {
      throw new AgentError('VALIDATION_FAILED', 'Document is required');
    }
    
    if (input.maxLength && (input.maxLength < 50 || input.maxLength > 2000)) {
      throw new AgentError('VALIDATION_FAILED', 'Max length must be between 50 and 2000 characters');
    }
  }

  async executeAgent(input: DocumentSummarizerInput): Promise<DocumentSummarizerOutput> {
    const startTime = Date.now();
    
    try {
      // 1. Verify file exists and is accessible
      const fileExists = await this.fileService.exists(input.document.id);
      if (!fileExists) {
        throw new AgentError('FILE_NOT_FOUND', 'Document not found');
      }

      // 2. Read file content
      const content = await this.fileService.readTextFile(input.document.id);
      if (!content || content.length === 0) {
        throw new AgentError('INVALID_CONTENT', 'Document is empty or unreadable');
      }

      // 3. Generate summary
      const maxLength = input.maxLength || 500;
      const summary = await this.generateSummary(content, maxLength);

      // 4. Extract keywords
      const keywords = await this.extractKeywords(content);

      // 5. Calculate confidence score
      const confidence = this.calculateConfidence(content, summary, keywords);

      this.logInfo('Document summarization completed', {
        tenantId: input.tenantId,
        documentId: input.document.id,
        contentLength: content.length,
        summaryLength: summary.length,
        keywordCount: keywords.length,
        confidence,
        duration: Date.now() - startTime
      });

      return {
        summary,
        keywords,
        confidence
      };

    } catch (error) {
      this.logError('Document summarization failed', {
        tenantId: input.tenantId,
        documentId: input.document.id,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  private async generateSummary(content: string, maxLength: number): Promise<string> {
    const prompt = `Please provide a concise summary of the following document in no more than ${maxLength} characters:\n\n${content}`;
    
    const response = await this.openAIService.complete({
      prompt,
      maxTokens: Math.ceil(maxLength / 4), // Rough token estimation
      temperature: 0.3
    });

    return response.trim();
  }

  private async extractKeywords(content: string): Promise<string[]> {
    const prompt = `Extract the most important keywords from this document. Return only the keywords separated by commas:\n\n${content}`;
    
    const response = await this.openAIService.complete({
      prompt,
      maxTokens: 100,
      temperature: 0.1
    });

    return response.split(',').map(keyword => keyword.trim()).filter(Boolean);
  }

  private calculateConfidence(content: string, summary: string, keywords: string[]): number {
    // Simple confidence calculation based on content analysis
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on content length
    if (content.length > 1000) confidence += 0.2;
    
    // Increase confidence based on summary quality
    if (summary.length > 100 && summary.length < content.length * 0.3) {
      confidence += 0.2;
    }
    
    // Increase confidence based on keyword extraction
    if (keywords.length >= 3 && keywords.length <= 10) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  }
}
```

#### Agent Controller
```typescript
// src/features/agents/document-summarizer/documentSummarizer.controller.ts
import { Request, Response } from 'express';
import { DocumentSummarizerService } from './documentSummarizer.service.js';
import { validateWithSchema } from '../../../utils/validate.js';
import { jsonResponse, errorResponse } from '../../../utils/response.js';
import { getUserFromToken } from '../../../utils/auth.js';
import { DocumentSummarizerInputSchema } from './documentSummarizer.types.js';

export class DocumentSummarizerController {
  constructor(private service: DocumentSummarizerService) {}

  async process(req: Request, res: Response): Promise<Response> {
    try {
      const user = getUserFromToken(req);
      const input = validateWithSchema(DocumentSummarizerInputSchema, {
        ...req.body,
        tenantId: user.tenantId // Add tenant context
      });

      const result = await this.service.execute(input);

      if (result.success) {
        return jsonResponse(res, result.data, 'Document summarized successfully');
      } else {
        return errorResponse(res, 400, result.error.message, result.error.code);
      }
    } catch (error) {
      return errorResponse(res, 500, 'Internal server error', 'AGENT_ERROR');
    }
  }

  async getStatus(req: Request, res: Response): Promise<Response> {
    const status = await this.service.getStatus();
    return jsonResponse(res, status);
  }
}
```

#### Agent Routes
```typescript
// src/features/agents/document-summarizer/documentSummarizer.routes.ts
import { Router } from 'express';
import { requireProjectRole } from '../../../middleware/authorization.js';
import { wrapAsyncHandler } from '../../../utils/response.js';
import { DocumentSummarizerController } from './documentSummarizer.controller.js';

export function getDocumentSummarizerRouter(): Router {
  const router = Router();
  const controller = new DocumentSummarizerController(/* inject dependencies */);

  // Process document (requires project member access)
  router.post('/process', 
    requireProjectRole('MEMBER'),
    wrapAsyncHandler(controller.process.bind(controller))
  );

  // Get agent status
  router.get('/status',
    wrapAsyncHandler(controller.getStatus.bind(controller))
  );

  return router;
}
```

### Agent Testing

#### Unit Tests
```typescript
// src/features/agents/document-summarizer/__tests__/documentSummarizer.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentSummarizerService } from '../documentSummarizer.service.js';

describe('DocumentSummarizerService', () => {
  let service: DocumentSummarizerService;
  let mockOpenAI: any;
  let mockFileService: any;
  let mockLogger: any;

  beforeEach(() => {
    mockOpenAI = {
      complete: vi.fn()
    };
    
    mockFileService = {
      exists: vi.fn(),
      readTextFile: vi.fn()
    };
    
    mockLogger = {
      info: vi.fn(),
      error: vi.fn()
    };

    service = new DocumentSummarizerService(mockOpenAI, mockFileService, mockLogger);
  });

  describe('execute', () => {
    it('should process document and return summary', async () => {
      // Arrange
      const input = {
        tenantId: 'tenant-123',
        document: {
          id: 'doc-456',
          name: 'test.txt',
          mimeType: 'text/plain',
          size: 1000,
          path: '/files/test.txt'
        },
        maxLength: 200
      };

      mockFileService.exists.mockResolvedValue(true);
      mockFileService.readTextFile.mockResolvedValue('This is a test document content that needs to be summarized...');
      mockOpenAI.complete
        .mockResolvedValueOnce('This is a summary of the document.')
        .mockResolvedValueOnce('test, document, content, summary');

      // Act
      const result = await service.execute(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toBe('This is a summary of the document.');
        expect(result.data.keywords).toEqual(['test', 'document', 'content', 'summary']);
        expect(result.data.confidence).toBeGreaterThan(0);
      }
    });

    it('should handle validation errors', async () => {
      // Arrange
      const input = {
        tenantId: '',
        document: null as any
      };

      // Act
      const result = await service.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_FAILED');
      }
    });
  });
});
```

### Agent Registration

#### Update Agent Registry
```typescript
// src/features/agents/registry/agentRegistry.ts
import { DocumentSummarizerService } from '../document-summarizer/documentSummarizer.service.js';

export class AgentRegistry {
  private agents: Map<string, AgentFactory> = new Map();

  registerAgents(): void {
    // Register document summarizer agent
    this.agents.set('document-summarizer', {
      create: (config: AgentConfig) => new DocumentSummarizerService(
        config.openAI,
        config.fileService,
        config.logger
      ),
      metadata: {
        name: 'document-summarizer',
        version: '1.0.0',
        capabilities: ['text-analysis', 'summarization', 'keyword-extraction'],
        description: 'Generates summaries and extracts keywords from documents',
        supportedFileTypes: ['text/plain', 'application/pdf', 'application/msword']
      }
    });
  }

  getAgent(name: string): AgentFactory | undefined {
    return this.agents.get(name);
  }

  listAgents(): AgentMetadata[] {
    return Array.from(this.agents.values()).map(factory => factory.metadata);
  }
}
```

#### Update Routes Registration
```typescript
// src/app.ts
import { getDocumentSummarizerRouter } from './features/agents/document-summarizer/documentSummarizer.routes.js';

// Add agent routes
app.use('/api/v1/agents/document-summarizer', getDocumentSummarizerRouter());
```

### Agent Configuration

#### Environment Variables
```bash
# .env
DOCUMENT_SUMMARIZER_ENABLED=true
DOCUMENT_SUMMARIZER_MAX_FILE_SIZE=10485760  # 10MB
DOCUMENT_SUMMARIZER_CONCURRENT_LIMIT=5
DOCUMENT_SUMMARIZER_CACHE_TTL=3600

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
```

#### Configuration Schema
```typescript
// config/agents/documentSummarizer.config.ts
import { z } from 'zod';

export const DocumentSummarizerConfigSchema = z.object({
  enabled: z.coerce.boolean().default(true),
  maxFileSize: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  concurrentLimit: z.coerce.number().default(5),
  cacheTTL: z.coerce.number().default(3600),
  supportedTypes: z.array(z.string()).default([
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]),
  openai: z.object({
    model: z.string().default('gpt-3.5-turbo'),
    maxTokens: z.number().default(2000),
    temperature: z.number().min(0).max(1).default(0.3)
  })
});

export const documentSummarizerConfig = DocumentSummarizerConfigSchema.parse({
  enabled: process.env.DOCUMENT_SUMMARIZER_ENABLED,
  maxFileSize: process.env.DOCUMENT_SUMMARIZER_MAX_FILE_SIZE,
  concurrentLimit: process.env.DOCUMENT_SUMMARIZER_CONCURRENT_LIMIT,
  cacheTTL: process.env.DOCUMENT_SUMMARIZER_CACHE_TTL,
  openai: {
    model: process.env.OPENAI_MODEL,
    maxTokens: process.env.OPENAI_MAX_TOKENS,
    temperature: process.env.OPENAI_TEMPERATURE
  }
});
```

## 💡 Development Tips

### VS Code Setup
Install recommended extensions:
- **TypeScript and JavaScript Language Features**
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **MongoDB for VS Code** - Database browsing
- **Thunder Client** - API testing
- **GitLens** - Git integration

### Useful Commands
```bash
# Development workflow
npm run dev              # Start development server with hot reload
npm run test:watch       # Run tests in watch mode
npm run type-check       # Check TypeScript errors
npm run lint             # Check code quality
npm run format           # Format code with Prettier

# Production tasks
npm run build            # Build for production
npm run start            # Start production server
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage

# Database tasks
npm run migrate:dev      # Run development migrations
npm run db:seed          # Seed development database
npm run db:reset         # Reset development database
```

### Code Quality Guidelines

#### TypeScript Best Practices
```typescript
// Use strict typing
interface User {
  id: string;
  email: string;
  name: string;
}

// Use utility types
type CreateUserRequest = Omit<User, 'id'>;
type UpdateUserRequest = Partial<Pick<User, 'email' | 'name'>>;

// Use enums for constants
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

// Use generic types for reusability
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

#### Error Handling Patterns
```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error boundary in services
export class UserService {
  async createUser(data: CreateUserRequest): Promise<User> {
    try {
      // Validate input
      const validatedData = validateWithSchema(CreateUserSchema, data);
      
      // Business logic
      const user = await this.repository.create(validatedData);
      
      // Log success
      logInfo('User created successfully', { userId: user.id });
      
      return user;
    } catch (error) {
      // Log error with context
      logError('User creation failed', {
        error: error.message,
        data: data,
        stack: error.stack
      });
      
      // Re-throw with appropriate error type
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error('Failed to create user');
    }
  }
}
```

## 📚 Next Steps

### Essential Reading
1. **[Architecture Overview](../02-Architecture/architecture.md)** - Understand the system design
2. **[API Reference](../04-Backend/api-reference.md)** - Learn the API endpoints
3. **[Security Guide](../04-Backend/security.md)** - Security best practices
4. **[Testing Guide](./testing-guide.md)** - Testing strategies and patterns

### Advanced Topics
- **Performance Optimization**: Learn about caching, database optimization, and scaling
- **Security Hardening**: Implement advanced security measures and monitoring
- **AI Agent Development**: Build sophisticated AI-powered features
- **Cloud Integration**: Integrate with additional cloud services

### Contributing
- Read the [Contributing Guide](../08-Contribution/contributing-guide.md)
- Join development discussions
- Submit bug reports and feature requests
- Help improve documentation

---
*This comprehensive development guide provides everything needed for productive MWAP development, from quick setup to advanced AI agent creation.* 