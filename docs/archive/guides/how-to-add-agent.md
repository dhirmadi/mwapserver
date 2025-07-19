# How to Add AI Agents

## Overview

This guide walks you through the process of adding new AI agents to the MWAP platform. You'll learn how to design, implement, test, and deploy custom agents that integrate seamlessly with the existing architecture.

## Prerequisites

Before adding a new agent, ensure you have:
- Understanding of the MWAP platform architecture
- Knowledge of TypeScript and Express.js
- Familiarity with the agent patterns used in the platform
- Access to the development environment
- Required permissions to deploy agents

## Step 1: Planning Your Agent

### Define Agent Purpose
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

const myAgentSpec: AgentSpecification = {
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

### Choose Agent Pattern
Select the appropriate pattern based on your requirements:
- **Command Pattern**: For operations with undo/retry functionality
- **Strategy Pattern**: For multiple algorithms or processing methods
- **Observer Pattern**: For event-driven behavior
- **Chain of Responsibility**: For processing pipelines
- **State Machine**: For complex state transitions

## Step 2: Create Agent Structure

### Directory Structure
```
src/features/agents/
├── my-agent/
│   ├── myAgent.controller.ts
│   ├── myAgent.service.ts
│   ├── myAgent.routes.ts
│   ├── myAgent.types.ts
│   └── __tests__/
│       ├── myAgent.controller.test.ts
│       └── myAgent.service.test.ts
```

### Base Agent Implementation
```typescript
// src/features/agents/my-agent/myAgent.service.ts
import { BaseAgent } from '../base/BaseAgent';
import { AgentResult, AgentError } from '../types';

export interface MyAgentInput {
  tenantId: string;
  document: FileData;
  maxLength?: number;
}

export interface MyAgentOutput {
  summary: string;
  keywords: string[];
  confidence: number;
}

export class MyAgentService extends BaseAgent<MyAgentInput, MyAgentOutput> {
  constructor(
    private openAIService: OpenAIService,
    private fileService: FileService,
    logger: Logger
  ) {
    super({
      name: 'my-agent',
      version: '1.0.0',
      capabilities: ['text-analysis', 'summarization'],
      timeout: 30000
    }, logger);
  }

  protected async validateInput(input: MyAgentInput): Promise<void> {
    if (!input.tenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    if (!input.document) {
      throw new ValidationError('Document is required');
    }

    // Validate file exists and is accessible
    const exists = await this.fileService.exists(input.document.id, input.tenantId);
    if (!exists) {
      throw new ValidationError('Document not found or access denied');
    }

    // Validate file type
    if (!this.isSupportedFileType(input.document.mimeType)) {
      throw new ValidationError(`Unsupported file type: ${input.document.mimeType}`);
    }
  }

  protected async processInput(input: MyAgentInput): Promise<MyAgentOutput> {
    try {
      // Extract text content from document
      const content = await this.extractTextContent(input.document);
      
      // Generate summary using AI
      const summary = await this.generateSummary(content, input.maxLength || 500);
      
      // Extract keywords
      const keywords = await this.extractKeywords(content);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(content, summary);

      return {
        summary,
        keywords,
        confidence
      };
    } catch (error) {
      throw new ProcessingError(`Failed to process document: ${error.message}`);
    }
  }

  private async extractTextContent(document: FileData): Promise<string> {
    // Implementation depends on file type
    switch (document.mimeType) {
      case 'text/plain':
        return await this.fileService.readTextFile(document.id);
      
      case 'application/pdf':
        return await this.fileService.extractPDFText(document.id);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await this.fileService.extractDocxText(document.id);
      
      default:
        throw new Error(`Unsupported file type: ${document.mimeType}`);
    }
  }

  private async generateSummary(content: string, maxLength: number): Promise<string> {
    const prompt = `
      Please provide a concise summary of the following document content.
      Maximum length: ${maxLength} characters.
      
      Content:
      ${content}
    `;

    const response = await this.openAIService.complete({
      prompt,
      maxTokens: Math.ceil(maxLength / 4), // Approximate token calculation
      temperature: 0.3
    });

    return response.trim();
  }

  private async extractKeywords(content: string): Promise<string[]> {
    const prompt = `
      Extract the 10 most important keywords from the following text.
      Return them as a comma-separated list.
      
      Content:
      ${content}
    `;

    const response = await this.openAIService.complete({
      prompt,
      maxTokens: 100,
      temperature: 0.1
    });

    return response.split(',').map(keyword => keyword.trim());
  }

  private calculateConfidence(content: string, summary: string): number {
    // Simple confidence calculation based on length ratio
    const lengthRatio = summary.length / content.length;
    const optimalRatio = 0.1; // 10% of original length
    
    const confidence = Math.max(0, 1 - Math.abs(lengthRatio - optimalRatio) * 10);
    return Math.round(confidence * 100) / 100;
  }

  private isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    return supportedTypes.includes(mimeType);
  }
}
```

### Controller Implementation
```typescript
// src/features/agents/my-agent/myAgent.controller.ts
import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../middleware/auth.guard';
import { TenantGuard } from '../../middleware/tenant.guard';
import { MyAgentService } from './myAgent.service';
import { ApiResponse } from '../../utils/response';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import { User } from '../../types/user.types';

@Controller('api/v1/agents/my-agent')
@UseGuards(AuthGuard, TenantGuard)
export class MyAgentController {
  constructor(private myAgentService: MyAgentService) {}

  @Post('/process')
  async processDocument(
    @Body() request: ProcessDocumentRequest,
    @CurrentUser() user: User
  ): Promise<ApiResponse<MyAgentOutput>> {
    try {
      const input: MyAgentInput = {
        tenantId: user.tenantId,
        document: request.document,
        maxLength: request.maxLength
      };

      const result = await this.myAgentService.execute(input);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Document processed successfully'
        };
      } else {
        return {
          success: false,
          error: result.error.message,
          code: result.error.code
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process document',
        code: 'PROCESSING_ERROR'
      };
    }
  }

  @Post('/batch')
  async processBatch(
    @Body() request: BatchProcessRequest,
    @CurrentUser() user: User
  ): Promise<ApiResponse<MyAgentOutput[]>> {
    try {
      const results = await Promise.all(
        request.documents.map(doc => 
          this.myAgentService.execute({
            tenantId: user.tenantId,
            document: doc,
            maxLength: request.maxLength
          })
        )
      );

      const successful = results
        .filter(result => result.success)
        .map(result => result.data);

      const failed = results
        .filter(result => !result.success)
        .map(result => result.error);

      return {
        success: true,
        data: successful,
        message: `Processed ${successful.length} documents successfully`,
        metadata: {
          total: request.documents.length,
          successful: successful.length,
          failed: failed.length,
          errors: failed
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Batch processing failed',
        code: 'BATCH_PROCESSING_ERROR'
      };
    }
  }
}
```

### Route Configuration
```typescript
// src/features/agents/my-agent/myAgent.routes.ts
import { Router } from 'express';
import { MyAgentController } from './myAgent.controller';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { rateLimitMiddleware } from '../../middleware/rateLimit';

const router = Router();
const controller = new MyAgentController();

// Apply middleware
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(rateLimitMiddleware({ windowMs: 60000, max: 100 })); // 100 requests per minute

// Routes
router.post('/process', controller.processDocument.bind(controller));
router.post('/batch', controller.processBatch.bind(controller));

export { router as myAgentRoutes };
```

## Step 3: Type Definitions

### Create Type Definitions
```typescript
// src/features/agents/my-agent/myAgent.types.ts
export interface ProcessDocumentRequest {
  document: FileData;
  maxLength?: number;
}

export interface BatchProcessRequest {
  documents: FileData[];
  maxLength?: number;
}

export interface FileData {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface MyAgentConfig {
  openAI: {
    apiKey: string;
    model: string;
    timeout: number;
  };
  processing: {
    maxFileSize: number;
    supportedTypes: string[];
    concurrentLimit: number;
  };
}
```

## Step 4: Write Tests

### Unit Tests
```typescript
// src/features/agents/my-agent/__tests__/myAgent.service.test.ts
import { MyAgentService } from '../myAgent.service';
import { createMockOpenAIService, createMockFileService } from '../../../test/mocks';

describe('MyAgentService', () => {
  let service: MyAgentService;
  let mockOpenAI: jest.Mocked<OpenAIService>;
  let mockFileService: jest.Mocked<FileService>;

  beforeEach(() => {
    mockOpenAI = createMockOpenAIService();
    mockFileService = createMockFileService();
    service = new MyAgentService(mockOpenAI, mockFileService, mockLogger);
  });

  describe('execute', () => {
    it('should process document and return summary', async () => {
      // Arrange
      const input: MyAgentInput = {
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
      mockFileService.readTextFile.mockResolvedValue('This is a test document content...');
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
      const input: MyAgentInput = {
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

### Integration Tests
```typescript
// src/features/agents/my-agent/__tests__/myAgent.integration.test.ts
import { TestApp } from '../../../test/testApp';
import { createTestFile, createTestUser } from '../../../test/helpers';

describe('MyAgent Integration', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await TestApp.create();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  it('should process document through API', async () => {
    // Arrange
    const user = await createTestUser(app);
    const file = await createTestFile(app, user.tenantId);
    
    const request = {
      document: file,
      maxLength: 300
    };

    // Act
    const response = await app.request()
      .post('/api/v1/agents/my-agent/process')
      .set('Authorization', `Bearer ${user.token}`)
      .send(request);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary).toBeDefined();
    expect(response.body.data.keywords).toBeInstanceOf(Array);
  });
});
```

## Step 5: Register Agent

### Update Agent Registry
```typescript
// src/features/agents/registry/agentRegistry.ts
import { MyAgentService } from '../my-agent/myAgent.service';

export class AgentRegistry {
  private agents: Map<string, AgentFactory> = new Map();

  registerAgents(): void {
    // Register existing agents...
    
    // Register new agent
    this.agents.set('my-agent', {
      create: (config: AgentConfig) => new MyAgentService(
        config.openAI,
        config.fileService,
        config.logger
      ),
      metadata: {
        name: 'my-agent',
        version: '1.0.0',
        capabilities: ['text-analysis', 'summarization'],
        description: 'Generates summaries and extracts keywords from documents'
      }
    });
  }
}
```

### Update Routes
```typescript
// src/app.ts
import { myAgentRoutes } from './features/agents/my-agent/myAgent.routes';

// Add agent routes
app.use('/api/v1/agents/my-agent', myAgentRoutes);
```

## Step 6: Configuration

### Environment Variables
```bash
# .env
MY_AGENT_ENABLED=true
MY_AGENT_MAX_FILE_SIZE=10485760  # 10MB
MY_AGENT_CONCURRENT_LIMIT=5
MY_AGENT_CACHE_TTL=3600
```

### Configuration Schema
```typescript
// config/agents/myAgent.config.ts
import { z } from 'zod';

export const MyAgentConfigSchema = z.object({
  enabled: z.coerce.boolean().default(true),
  maxFileSize: z.coerce.number().default(10 * 1024 * 1024),
  concurrentLimit: z.coerce.number().default(5),
  cacheTTL: z.coerce.number().default(3600),
  supportedTypes: z.array(z.string()).default([
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
});

export const myAgentConfig = MyAgentConfigSchema.parse({
  enabled: process.env.MY_AGENT_ENABLED,
  maxFileSize: process.env.MY_AGENT_MAX_FILE_SIZE,
  concurrentLimit: process.env.MY_AGENT_CONCURRENT_LIMIT,
  cacheTTL: process.env.MY_AGENT_CACHE_TTL
});
```

## Step 7: Documentation

### API Documentation
```typescript
// Update OpenAPI schema
const myAgentSchema = {
  '/api/v1/agents/my-agent/process': {
    post: {
      summary: 'Process document with My Agent',
      tags: ['Agents'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                document: { $ref: '#/components/schemas/FileData' },
                maxLength: { type: 'number', minimum: 50, maximum: 2000 }
              },
              required: ['document']
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Document processed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      summary: { type: 'string' },
                      keywords: { type: 'array', items: { type: 'string' } },
                      confidence: { type: 'number', minimum: 0, maximum: 1 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
```

### User Documentation
```markdown
# My Agent Documentation

## Overview
The My Agent service provides document summarization and keyword extraction capabilities.

## Usage

### Basic Processing
```javascript
const response = await fetch('/api/v1/agents/my-agent/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    document: {
      id: 'doc-123',
      name: 'report.pdf',
      mimeType: 'application/pdf'
    },
    maxLength: 500
  })
});

const result = await response.json();
console.log(result.data.summary);
```

## Limitations
- Maximum file size: 10MB
- Supported formats: PDF, DOCX, TXT
- Processing time: Up to 30 seconds
- Rate limit: 100 requests per minute
```

## Step 8: Deployment

### Build Process
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build agent
npm run build

# Lint code
npm run lint
```

### Deployment Checklist
- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Performance testing completed
- [ ] Security review passed
- [ ] Monitoring configured
- [ ] Rollback plan prepared

### Production Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Run integration tests
npm run test:integration

# Deploy to production
npm run deploy:production

# Verify deployment
npm run verify:production
```

## Step 9: Monitoring

### Metrics to Track
```typescript
// Agent-specific metrics
const agentMetrics = {
  'my_agent_requests_total': 'Total number of processing requests',
  'my_agent_processing_duration': 'Time taken to process documents',
  'my_agent_success_rate': 'Percentage of successful processing',
  'my_agent_file_size_bytes': 'Size of processed files',
  'my_agent_summary_length': 'Length of generated summaries',
  'my_agent_confidence_score': 'Average confidence scores'
};
```

### Health Checks
```typescript
class MyAgentHealthCheck implements HealthCheck {
  constructor(private agentService: MyAgentService) {}

  async check(): Promise<HealthStatus> {
    try {
      // Test with minimal document
      const testResult = await this.agentService.execute({
        tenantId: 'health-check',
        document: this.createTestDocument(),
        maxLength: 50
      });

      return {
        status: testResult.success ? 'healthy' : 'unhealthy',
        message: testResult.success ? 'Agent responding normally' : 'Agent processing failed',
        responseTime: testResult.processingTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error.message}`,
        error: error.stack
      };
    }
  }
}
```

## Troubleshooting

### Common Issues
1. **High Processing Times**: Check OpenAI API response times and file sizes
2. **Memory Issues**: Monitor memory usage and implement streaming for large files
3. **Rate Limiting**: Implement proper queuing and retry mechanisms
4. **Authentication Errors**: Verify JWT tokens and tenant permissions
5. **File Access Issues**: Check file permissions and storage connectivity

### Debug Mode
```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';
process.env.MY_AGENT_DEBUG = 'true';

// Access debug metrics
const debugMetrics = await agentService.getDebugMetrics();
console.log(debugMetrics);
```

## Best Practices

### Performance
- Cache results when possible
- Use streaming for large files
- Implement concurrency limits
- Monitor resource usage

### Security
- Validate all inputs
- Sanitize file content
- Implement rate limiting
- Log security events

### Reliability
- Handle errors gracefully
- Implement retry mechanisms
- Use circuit breakers for external services
- Monitor and alert on failures

### Maintainability
- Follow coding standards
- Write comprehensive tests
- Document all public APIs
- Use semantic versioning

## Next Steps

After successfully adding your agent:
1. Monitor its performance in production
2. Collect user feedback
3. Plan feature enhancements
4. Consider agent composition with other agents
5. Explore advanced AI capabilities

## Resources

- [Agent Patterns Documentation](../05-AI-Agents/agent-patterns.md)
- [Best Practices Guide](../05-AI-Agents/best-practices.md)
- [API Documentation](../04-Backend/API-v3.md)
- [Testing Guide](../06-Guides/how-to-test.md)
- [Security Guidelines](../06-Guides/security-guide.md) 