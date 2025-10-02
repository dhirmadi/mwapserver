# Agent Patterns

## Overview

This guide presents proven design patterns for AI agents within the MWAP platform. These patterns address common challenges in agent development, provide reusable solutions, and ensure consistent, maintainable agent architectures.

## Core Agent Patterns

### 1. Command Pattern

#### Intent
Encapsulate agent operations as command objects, enabling parameterization, queuing, and undo functionality.

#### Structure
```typescript
interface AgentCommand {
  id: string;
  execute(): Promise<CommandResult>;
  undo?(): Promise<void>;
  validate(): Promise<ValidationResult>;
}

class CommandInvoker {
  private history: AgentCommand[] = [];
  
  async executeCommand(command: AgentCommand): Promise<CommandResult> {
    const validation = await command.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid command: ${validation.errors.join(', ')}`);
    }
    
    const result = await command.execute();
    this.history.push(command);
    
    return result;
  }
  
  async undoLast(): Promise<void> {
    const lastCommand = this.history.pop();
    if (lastCommand?.undo) {
      await lastCommand.undo();
    }
  }
}
```

#### Implementation Example
```typescript
// File processing command
class AnalyzeFileCommand implements AgentCommand {
  constructor(
    private fileId: string,
    private tenantId: string,
    private analysisType: AnalysisType
  ) {}

  async execute(): Promise<AnalysisResult> {
    const file = await this.fileService.getFile(this.fileId, this.tenantId);
    const agent = this.agentFactory.createAnalysisAgent(this.analysisType);
    
    return await agent.analyze(file);
  }

  async validate(): Promise<ValidationResult> {
    const exists = await this.fileService.exists(this.fileId, this.tenantId);
    return {
      isValid: exists,
      errors: exists ? [] : ['File not found']
    };
  }
}

// Usage
const command = new AnalyzeFileCommand('file_123', 'tenant_456', 'security');
const result = await commandInvoker.executeCommand(command);
```

### 2. Strategy Pattern

#### Intent
Define a family of algorithms (agent behaviors), encapsulate each one, and make them interchangeable.

#### Structure
```typescript
interface AgentStrategy {
  name: string;
  capabilities: string[];
  execute(context: ExecutionContext): Promise<StrategyResult>;
  canHandle(request: AgentRequest): boolean;
}

class StrategySelector {
  private strategies: Map<string, AgentStrategy> = new Map();
  
  register(strategy: AgentStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }
  
  selectStrategy(request: AgentRequest): AgentStrategy | null {
    for (const strategy of this.strategies.values()) {
      if (strategy.canHandle(request)) {
        return strategy;
      }
    }
    return null;
  }
}
```

#### Implementation Example
```typescript
// Different strategies for code generation
class ReactComponentStrategy implements AgentStrategy {
  name = 'react-component';
  capabilities = ['jsx', 'typescript', 'react-hooks'];
  
  canHandle(request: AgentRequest): boolean {
    return request.framework === 'react' && request.type === 'component';
  }
  
  async execute(context: ExecutionContext): Promise<ComponentCode> {
    return this.generateReactComponent(context.specification);
  }
}

class ExpressRouteStrategy implements AgentStrategy {
  name = 'express-route';
  capabilities = ['express', 'typescript', 'rest-api'];
  
  canHandle(request: AgentRequest): boolean {
    return request.framework === 'express' && request.type === 'route';
  }
  
  async execute(context: ExecutionContext): Promise<RouteCode> {
    return this.generateExpressRoute(context.specification);
  }
}

// Multi-tenant code generation agent using strategy pattern
class CodeGenerationAgent {
  constructor(private strategySelector: StrategySelector) {}
  
  async generateCode(request: CodeGenerationRequest): Promise<GeneratedCode> {
    const strategy = this.strategySelector.selectStrategy(request);
    if (!strategy) {
      throw new Error(`No strategy found for request: ${request.type}`);
    }
    
    const context = await this.buildContext(request);
    return await strategy.execute(context);
  }
}
```

### 3. Observer Pattern

#### Intent
Define a one-to-many dependency between agents so that when one agent changes state, all dependents are notified.

#### Structure
```typescript
interface AgentObserver {
  update(event: AgentEvent): Promise<void>;
}

interface AgentSubject {
  attach(observer: AgentObserver): void;
  detach(observer: AgentObserver): void;
  notify(event: AgentEvent): Promise<void>;
}

class ObservableAgent implements AgentSubject {
  private observers: AgentObserver[] = [];
  
  attach(observer: AgentObserver): void {
    this.observers.push(observer);
  }
  
  detach(observer: AgentObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }
  
  async notify(event: AgentEvent): Promise<void> {
    await Promise.all(
      this.observers.map(observer => observer.update(event))
    );
  }
}
```

#### Implementation Example
```typescript
// File processing workflow with observers
class FileProcessingAgent extends ObservableAgent {
  async processFile(file: FileData): Promise<ProcessingResult> {
    await this.notify({
      type: 'processing-started',
      fileId: file.id,
      timestamp: new Date()
    });
    
    try {
      const result = await this.analyzeFile(file);
      
      await this.notify({
        type: 'processing-completed',
        fileId: file.id,
        result,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      await this.notify({
        type: 'processing-failed',
        fileId: file.id,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }
}

// Observers for different concerns
class MetricsCollectorObserver implements AgentObserver {
  async update(event: AgentEvent): Promise<void> {
    await this.metricsService.recordEvent(event);
  }
}

class NotificationObserver implements AgentObserver {
  async update(event: AgentEvent): Promise<void> {
    if (event.type === 'processing-completed') {
      await this.notificationService.notifyUser(event.userId, 'File processed successfully');
    }
  }
}

class AuditLogObserver implements AgentObserver {
  async update(event: AgentEvent): Promise<void> {
    await this.auditService.logEvent(event);
  }
}
```

### 4. Chain of Responsibility Pattern

#### Intent
Pass requests along a chain of agents until one of them handles the request.

#### Structure
```typescript
abstract class AgentHandler {
  protected nextHandler?: AgentHandler;
  
  setNext(handler: AgentHandler): AgentHandler {
    this.nextHandler = handler;
    return handler;
  }
  
  async handle(request: AgentRequest): Promise<AgentResponse | null> {
    const result = await this.process(request);
    
    if (result) {
      return result;
    }
    
    if (this.nextHandler) {
      return await this.nextHandler.handle(request);
    }
    
    return null;
  }
  
  protected abstract process(request: AgentRequest): Promise<AgentResponse | null>;
}
```

#### Implementation Example
```typescript
// Content analysis chain
class SecurityAnalysisHandler extends AgentHandler {
  protected async process(request: ContentAnalysisRequest): Promise<SecurityAnalysis | null> {
    if (request.analysisType !== 'security') {
      return null;
    }
    
    return await this.performSecurityAnalysis(request.content);
  }
}

class PerformanceAnalysisHandler extends AgentHandler {
  protected async process(request: ContentAnalysisRequest): Promise<PerformanceAnalysis | null> {
    if (request.analysisType !== 'performance') {
      return null;
    }
    
    return await this.performPerformanceAnalysis(request.content);
  }
}

class GeneralAnalysisHandler extends AgentHandler {
  protected async process(request: ContentAnalysisRequest): Promise<GeneralAnalysis | null> {
    // Always handles as fallback
    return await this.performGeneralAnalysis(request.content);
  }
}

// Setup chain
const analysisChain = new SecurityAnalysisHandler();
analysisChain
  .setNext(new PerformanceAnalysisHandler())
  .setNext(new GeneralAnalysisHandler());

// Usage
const result = await analysisChain.handle({
  analysisType: 'security',
  content: fileContent
});
```

## Behavioral Patterns

### 5. State Machine Pattern

#### Intent
Allow an agent to alter its behavior when its internal state changes.

#### Structure
```typescript
interface AgentState {
  name: string;
  onEnter?(context: StateContext): Promise<void>;
  onExit?(context: StateContext): Promise<void>;
  execute(context: StateContext): Promise<StateTransition>;
}

interface StateTransition {
  nextState: string;
  data?: any;
}

class StatefulAgent {
  private currentState: AgentState;
  private states: Map<string, AgentState> = new Map();
  
  constructor(initialState: string) {
    this.currentState = this.states.get(initialState)!;
  }
  
  addState(name: string, state: AgentState): void {
    this.states.set(name, state);
  }
  
  async transition(context: StateContext): Promise<void> {
    const transition = await this.currentState.execute(context);
    
    if (transition.nextState !== this.currentState.name) {
      await this.currentState.onExit?.(context);
      
      this.currentState = this.states.get(transition.nextState)!;
      
      await this.currentState.onEnter?.(context);
    }
  }
}
```

#### Implementation Example
```typescript
// File processing state machine
class IdleState implements AgentState {
  name = 'idle';
  
  async execute(context: FileProcessingContext): Promise<StateTransition> {
    if (context.hasQueuedFiles()) {
      return { nextState: 'processing' };
    }
    return { nextState: 'idle' };
  }
}

class ProcessingState implements AgentState {
  name = 'processing';
  
  async onEnter(context: FileProcessingContext): Promise<void> {
    context.startProcessing();
  }
  
  async execute(context: FileProcessingContext): Promise<StateTransition> {
    try {
      const result = await context.processNextFile();
      
      if (context.hasMoreFiles()) {
        return { nextState: 'processing' };
      } else {
        return { nextState: 'completed', data: result };
      }
    } catch (error) {
      return { nextState: 'error', data: error };
    }
  }
}

class CompletedState implements AgentState {
  name = 'completed';
  
  async execute(context: FileProcessingContext): Promise<StateTransition> {
    await context.notifyCompletion();
    return { nextState: 'idle' };
  }
}

class ErrorState implements AgentState {
  name = 'error';
  
  async execute(context: FileProcessingContext): Promise<StateTransition> {
    await context.handleError();
    return { nextState: 'idle' };
  }
}
```

### 6. Template Method Pattern

#### Intent
Define the skeleton of an algorithm in a base class, letting subclasses override specific steps.

#### Structure
```typescript
abstract class AgentTemplate {
  async execute(request: AgentRequest): Promise<AgentResult> {
    await this.initialize(request);
    await this.validateInput(request);
    
    const processed = await this.processRequest(request);
    const result = await this.generateResult(processed);
    
    await this.cleanup();
    
    return result;
  }
  
  protected async initialize(request: AgentRequest): Promise<void> {
    // Default implementation
  }
  
  protected abstract validateInput(request: AgentRequest): Promise<void>;
  protected abstract processRequest(request: AgentRequest): Promise<any>;
  protected abstract generateResult(processed: any): Promise<AgentResult>;
  
  protected async cleanup(): Promise<void> {
    // Default implementation
  }
}
```

#### Implementation Example
```typescript
// Code generation template
abstract class CodeGenerationTemplate extends AgentTemplate {
  protected async validateInput(request: CodeGenerationRequest): Promise<void> {
    if (!request.specification) {
      throw new Error('Specification is required');
    }
    
    if (!request.framework) {
      throw new Error('Framework is required');
    }
    
    // Framework-specific validation will be implemented by subclasses
    await this.validateFrameworkRequirements(request);
  }
  
  protected async processRequest(request: CodeGenerationRequest): Promise<GeneratedCode> {
    const context = await this.buildContext(request);
    const template = await this.selectTemplate(request);
    
    return await this.generateFromTemplate(template, context);
  }
  
  protected async generateResult(code: GeneratedCode): Promise<CodeGenerationResult> {
    const validated = await this.validateGeneratedCode(code);
    const formatted = await this.formatCode(validated);
    
    return {
      code: formatted,
      metadata: this.extractMetadata(formatted)
    };
  }
  
  // Abstract methods for subclasses
  protected abstract validateFrameworkRequirements(request: CodeGenerationRequest): Promise<void>;
  protected abstract buildContext(request: CodeGenerationRequest): Promise<GenerationContext>;
  protected abstract selectTemplate(request: CodeGenerationRequest): Promise<CodeTemplate>;
  protected abstract generateFromTemplate(template: CodeTemplate, context: GenerationContext): Promise<GeneratedCode>;
}

// React-specific implementation
class ReactCodeGenerator extends CodeGenerationTemplate {
  protected async validateFrameworkRequirements(request: CodeGenerationRequest): Promise<void> {
    if (request.framework !== 'react') {
      throw new Error('React framework required');
    }
    
    if (!request.componentType) {
      throw new Error('Component type is required for React');
    }
  }
  
  protected async buildContext(request: CodeGenerationRequest): Promise<ReactGenerationContext> {
    return {
      componentName: request.componentName,
      props: request.props,
      hooks: request.hooks,
      styling: request.styling
    };
  }
  
  // ... other React-specific implementations
}
```

## Architectural Patterns

### 7. Microservices Pattern

#### Intent
Structure agents as a collection of loosely coupled, independently deployable services.

#### Structure
```typescript
interface AgentService {
  name: string;
  version: string;
  health(): Promise<HealthStatus>;
  execute(request: ServiceRequest): Promise<ServiceResponse>;
}

class AgentOrchestrator {
  private services: Map<string, AgentService> = new Map();
  
  registerService(service: AgentService): void {
    this.services.set(service.name, service);
  }
  
  async orchestrate(workflow: WorkflowDefinition): Promise<WorkflowResult> {
    const results = new Map<string, any>();
    
    for (const step of workflow.steps) {
      const service = this.services.get(step.serviceName);
      if (!service) {
        throw new Error(`Service ${step.serviceName} not found`);
      }
      
      const request = this.buildRequest(step, results);
      const response = await service.execute(request);
      
      results.set(step.name, response);
    }
    
    return this.aggregateResults(results);
  }
}
```

#### Implementation Example
```typescript
// Document processing microservices
class DocumentAnalysisService implements AgentService {
  name = 'document-analysis';
  version = '1.0.0';
  
  async health(): Promise<HealthStatus> {
    return { status: 'healthy', timestamp: new Date() };
  }
  
  async execute(request: AnalysisRequest): Promise<AnalysisResponse> {
    const document = await this.loadDocument(request.documentId);
    const analysis = await this.analyzeDocument(document);
    
    return {
      analysisId: generateId(),
      result: analysis,
      metadata: {
        processingTime: Date.now() - request.timestamp,
        version: this.version
      }
    };
  }
}

class ContentExtractionService implements AgentService {
  name = 'content-extraction';
  version = '1.0.0';
  
  async execute(request: ExtractionRequest): Promise<ExtractionResponse> {
    const analysis = request.previousResults.analysis;
    const content = await this.extractContent(analysis);
    
    return {
      extractionId: generateId(),
      content,
      format: this.detectFormat(content)
    };
  }
}

// Workflow definition
const documentProcessingWorkflow: WorkflowDefinition = {
  name: 'document-processing',
  steps: [
    {
      name: 'analyze',
      serviceName: 'document-analysis',
      inputs: ['documentId']
    },
    {
      name: 'extract',
      serviceName: 'content-extraction',
      inputs: ['analysis'],
      dependsOn: ['analyze']
    }
  ]
};
```

### 8. Event Sourcing Pattern

#### Intent
Store agent state changes as a sequence of events rather than storing current state.

#### Structure
```typescript
interface AgentEvent {
  id: string;
  agentId: string;
  type: string;
  data: any;
  timestamp: Date;
  version: number;
}

class EventStore {
  async append(agentId: string, events: AgentEvent[]): Promise<void> {
    // Store events in append-only log
  }
  
  async getEvents(agentId: string, fromVersion?: number): Promise<AgentEvent[]> {
    // Retrieve events for agent
  }
}

class EventSourcedAgent {
  private version = 0;
  private uncommittedEvents: AgentEvent[] = [];
  
  constructor(
    private agentId: string,
    private eventStore: EventStore
  ) {}
  
  async loadFromHistory(): Promise<void> {
    const events = await this.eventStore.getEvents(this.agentId);
    events.forEach(event => this.apply(event));
    this.version = events.length;
  }
  
  protected raiseEvent(type: string, data: any): void {
    const event: AgentEvent = {
      id: generateId(),
      agentId: this.agentId,
      type,
      data,
      timestamp: new Date(),
      version: this.version + this.uncommittedEvents.length + 1
    };
    
    this.uncommittedEvents.push(event);
    this.apply(event);
  }
  
  async commit(): Promise<void> {
    if (this.uncommittedEvents.length > 0) {
      await this.eventStore.append(this.agentId, this.uncommittedEvents);
      this.version += this.uncommittedEvents.length;
      this.uncommittedEvents = [];
    }
  }
  
  protected abstract apply(event: AgentEvent): void;
}
```

#### Implementation Example
```typescript
// File processing agent with event sourcing
class FileProcessingAgent extends EventSourcedAgent {
  private state: FileProcessingState = {
    status: 'idle',
    processedFiles: [],
    errors: []
  };
  
  async startProcessing(files: FileData[]): Promise<void> {
    this.raiseEvent('processing-started', { files: files.map(f => f.id) });
  }
  
  async completeFileProcessing(fileId: string, result: ProcessingResult): Promise<void> {
    this.raiseEvent('file-processed', { fileId, result });
  }
  
  async failFileProcessing(fileId: string, error: string): Promise<void> {
    this.raiseEvent('file-processing-failed', { fileId, error });
  }
  
  protected apply(event: AgentEvent): void {
    switch (event.type) {
      case 'processing-started':
        this.state.status = 'processing';
        break;
      
      case 'file-processed':
        this.state.processedFiles.push({
          fileId: event.data.fileId,
          result: event.data.result,
          timestamp: event.timestamp
        });
        break;
      
      case 'file-processing-failed':
        this.state.errors.push({
          fileId: event.data.fileId,
          error: event.data.error,
          timestamp: event.timestamp
        });
        break;
    }
  }
  
  getState(): FileProcessingState {
    return { ...this.state };
  }
}
```

## Integration Patterns

### 9. API Gateway Pattern

#### Intent
Provide a single entry point for all agent interactions with external services.

#### Structure
```typescript
interface AgentGateway {
  route(request: GatewayRequest): Promise<GatewayResponse>;
  register(pattern: string, handler: RequestHandler): void;
  middleware(middleware: GatewayMiddleware): void;
}

class AgentAPIGateway implements AgentGateway {
  private routes: Map<string, RequestHandler> = new Map();
  private middlewares: GatewayMiddleware[] = [];
  
  async route(request: GatewayRequest): Promise<GatewayResponse> {
    // Apply middlewares
    for (const middleware of this.middlewares) {
      request = await middleware.process(request);
    }
    
    // Find matching route
    const handler = this.findHandler(request.path);
    if (!handler) {
      throw new Error(`No handler found for ${request.path}`);
    }
    
    return await handler.handle(request);
  }
  
  register(pattern: string, handler: RequestHandler): void {
    this.routes.set(pattern, handler);
  }
  
  middleware(middleware: GatewayMiddleware): void {
    this.middlewares.push(middleware);
  }
}
```

#### Implementation Example
```typescript
// Agent-specific gateways
class CodeGenerationGateway extends AgentAPIGateway {
  constructor() {
    super();
    this.setupRoutes();
    this.setupMiddleware();
  }
  
  private setupRoutes(): void {
    this.register('/generate/component', new ComponentGenerationHandler());
    this.register('/generate/api', new APIGenerationHandler());
    this.register('/generate/test', new TestGenerationHandler());
  }
  
  private setupMiddleware(): void {
    this.middleware(new AuthenticationMiddleware());
    this.middleware(new TenantIsolationMiddleware());
    this.middleware(new RateLimitingMiddleware());
    this.middleware(new ValidationMiddleware());
  }
}

class FileProcessingGateway extends AgentAPIGateway {
  constructor() {
    super();
    this.register('/process/analyze', new FileAnalysisHandler());
    this.register('/process/extract', new ContentExtractionHandler());
    this.register('/process/transform', new FileTransformationHandler());
  }
}

// Gateway orchestrator
class GatewayOrchestrator {
  private gateways: Map<string, AgentGateway> = new Map();
  
  registerGateway(domain: string, gateway: AgentGateway): void {
    this.gateways.set(domain, gateway);
  }
  
  async routeRequest(request: IncomingRequest): Promise<Response> {
    const domain = this.extractDomain(request.path);
    const gateway = this.gateways.get(domain);
    
    if (!gateway) {
      throw new Error(`No gateway found for domain: ${domain}`);
    }
    
    return await gateway.route(request);
  }
}
```

### 10. Circuit Breaker Pattern

#### Intent
Prevent agents from making calls to external services that are likely to fail.

#### Structure
```typescript
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: Date;
  
  constructor(
    private failureThreshold: number,
    private timeout: number,
    private resetTimeout: number
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
  
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.resetTimeout;
  }
}
```

#### Implementation Example
```typescript
// External service integration with circuit breaker
class ExternalAIServiceAgent {
  private circuitBreaker: CircuitBreaker;
  
  constructor(private apiClient: AIServiceClient) {
    this.circuitBreaker = new CircuitBreaker(
      5, // failure threshold
      30000, // timeout
      60000  // reset timeout
    );
  }
  
  async generateCode(prompt: string): Promise<GeneratedCode> {
    return await this.circuitBreaker.execute(async () => {
      return await this.apiClient.generateCode(prompt);
    });
  }
  
  async analyzeCode(code: string): Promise<CodeAnalysis> {
    return await this.circuitBreaker.execute(async () => {
      return await this.apiClient.analyzeCode(code);
    });
  }
}

// Fallback strategy when circuit is open
class ResilientCodeGenerationAgent {
  constructor(
    private primaryService: ExternalAIServiceAgent,
    private fallbackService: LocalCodeGenerator
  ) {}
  
  async generateCode(prompt: string): Promise<GeneratedCode> {
    try {
      return await this.primaryService.generateCode(prompt);
    } catch (error) {
      if (error.message.includes('Circuit breaker is OPEN')) {
        // Use local fallback
        return await this.fallbackService.generateCode(prompt);
      }
      throw error;
    }
  }
}
```

## Best Practices

### Pattern Selection Guidelines

1. **Command Pattern**: Use for operations that need queuing, undo/redo, or auditing
2. **Strategy Pattern**: Use when you have multiple algorithms for the same task
3. **Observer Pattern**: Use for event-driven architectures and loose coupling
4. **Chain of Responsibility**: Use for filtering or processing pipelines
5. **State Machine**: Use for agents with complex state transitions
6. **Template Method**: Use for algorithms with fixed steps but variable implementations
7. **Microservices**: Use for scalable, independently deployable agent functions
8. **Event Sourcing**: Use when you need complete audit trails and state reconstruction
9. **API Gateway**: Use for centralized routing and cross-cutting concerns
10. **Circuit Breaker**: Use for resilient external service integration

### Anti-Patterns to Avoid

#### 1. God Agent
```typescript
// ❌ Bad: Single agent doing everything
class GodAgent {
  async processEverything(data: any): Promise<any> {
    // Hundreds of lines of code handling multiple responsibilities
    const analyzed = await this.analyzeFile(data);
    const extracted = await this.extractContent(analyzed);
    const transformed = await this.transformData(extracted);
    const validated = await this.validateResult(transformed);
    const stored = await this.storeResult(validated);
    const notified = await this.notifyUsers(stored);
    // ... more responsibilities
  }
}

// ✅ Good: Specialized agents with single responsibilities
class FileAnalysisAgent { /* ... */ }
class ContentExtractionAgent { /* ... */ }
class DataTransformationAgent { /* ... */ }
```

#### 2. Tight Coupling
```typescript
// ❌ Bad: Direct dependencies
class CodeGenerationAgent {
  private openAIClient = new OpenAIClient();  // Hard dependency
  
  async generate(prompt: string): Promise<string> {
    return await this.openAIClient.complete(prompt);
  }
}

// ✅ Good: Dependency injection
class CodeGenerationAgent {
  constructor(private aiService: AIService) {}  // Abstraction
  
  async generate(prompt: string): Promise<string> {
    return await this.aiService.complete(prompt);
  }
}
```

#### 3. Synchronous Processing
```typescript
// ❌ Bad: Blocking operations
class FileProcessingAgent {
  async processFiles(files: FileData[]): Promise<ProcessingResult[]> {
    const results = [];
    for (const file of files) {
      results.push(await this.processFile(file));  // Sequential
    }
    return results;
  }
}

// ✅ Good: Asynchronous processing
class FileProcessingAgent {
  async processFiles(files: FileData[]): Promise<ProcessingResult[]> {
    return await Promise.all(
      files.map(file => this.processFile(file))  // Parallel
    );
  }
}
```

### Pattern Composition

#### Combining Patterns
```typescript
// Example: Strategy + Command + Observer patterns
class SmartCodeGenerationAgent extends ObservableAgent {
  constructor(
    private strategySelector: StrategySelector,
    private commandInvoker: CommandInvoker
  ) {
    super();
  }
  
  async generateCode(request: CodeGenerationRequest): Promise<GeneratedCode> {
    // Strategy pattern for algorithm selection
    const strategy = this.strategySelector.selectStrategy(request);
    
    // Command pattern for operation encapsulation
    const command = new GenerateCodeCommand(strategy, request);
    
    // Observer pattern for event notification
    await this.notify({
      type: 'generation-started',
      requestId: request.id,
      strategy: strategy.name
    });
    
    try {
      const result = await this.commandInvoker.executeCommand(command);
      
      await this.notify({
        type: 'generation-completed',
        requestId: request.id,
        result
      });
      
      return result;
    } catch (error) {
      await this.notify({
        type: 'generation-failed',
        requestId: request.id,
        error: error.message
      });
      throw error;
    }
  }
}
```

### Testing Patterns

#### Pattern-Specific Testing
```typescript
// Testing Strategy Pattern
describe('CodeGenerationAgent', () => {
  it('should select correct strategy for React components', () => {
    const mockStrategy = new MockReactStrategy();
    const strategySelector = new StrategySelector();
    strategySelector.register(mockStrategy);
    
    const agent = new CodeGenerationAgent(strategySelector);
    const request = { framework: 'react', type: 'component' };
    
    expect(strategySelector.selectStrategy(request)).toBe(mockStrategy);
  });
});

// Testing Observer Pattern
describe('ObservableAgent', () => {
  it('should notify all observers', async () => {
    const mockObserver1 = jest.fn();
    const mockObserver2 = jest.fn();
    
    const agent = new TestObservableAgent();
    agent.attach({ update: mockObserver1 });
    agent.attach({ update: mockObserver2 });
    
    await agent.triggerEvent({ type: 'test' });
    
    expect(mockObserver1).toHaveBeenCalledWith({ type: 'test' });
    expect(mockObserver2).toHaveBeenCalledWith({ type: 'test' });
  });
});
```

## Conclusion

These agent patterns provide a solid foundation for building maintainable, scalable, and robust AI agents within the MWAP platform. Choose patterns based on your specific requirements, and don't hesitate to combine multiple patterns when beneficial. Remember that patterns are tools to solve problems – use them judiciously and adapt them to your specific context. 