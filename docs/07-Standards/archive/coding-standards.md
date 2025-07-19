# Coding Standards

This document outlines the coding standards, conventions, and best practices for the MWAP platform development.

## 📋 Overview

Consistent coding standards ensure maintainable, readable, and high-quality code across the MWAP platform. These standards apply to both backend (Node.js/TypeScript) and frontend (React/TypeScript) development.

## 🎯 General Principles

### Code Quality Principles
- **Readability**: Code should be self-documenting and easy to understand
- **Consistency**: Follow established patterns and conventions
- **Simplicity**: Prefer simple, clear solutions over complex ones
- **DRY (Don't Repeat Yourself)**: Avoid code duplication
- **SOLID Principles**: Write maintainable and extensible code
- **Performance**: Consider performance implications of code decisions

### TypeScript First
- All code must be written in TypeScript with strict type checking
- No `any` types unless absolutely necessary (and documented why)
- Proper type definitions for all functions, interfaces, and classes
- Use type guards and proper type narrowing

## 📁 Project Structure Standards

### File Naming Conventions
```
# Files and directories
kebab-case for directories: user-management/
PascalCase for components: UserProfile.tsx
camelCase for utilities: userHelpers.ts
lowercase for configs: package.json, tsconfig.json

# TypeScript files
.ts for regular TypeScript files
.tsx for React components
.test.ts/.test.tsx for test files
.types.ts for type definition files
.schema.ts for validation schemas
```

### Directory Organization
```
src/
├── components/          # Shared UI components (frontend)
├── features/           # Feature-based modules
│   └── feature-name/   # kebab-case feature names
│       ├── components/ # Feature-specific components
│       ├── hooks/      # Feature-specific hooks
│       ├── services/   # Feature business logic
│       ├── types/      # Feature type definitions
│       └── utils/      # Feature utilities
├── hooks/              # Shared custom hooks (frontend)
├── services/           # Shared business logic
├── types/              # Shared type definitions
├── utils/              # Shared utilities
└── __tests__/          # Test files (mirror src structure)
```

## 💻 TypeScript Standards

### Type Definitions
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Use types for unions, primitives, and computed types
type UserRole = 'admin' | 'member' | 'viewer';
type UserWithRole = User & { role: UserRole };

// Prefer readonly for immutable data
interface ReadonlyConfig {
  readonly apiUrl: string;
  readonly features: readonly string[];
}

// Use generics for reusable types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

### Function Standards
```typescript
// Use function expressions with explicit return types
const getUserById = async (id: string): Promise<User | null> => {
  const user = await userService.findById(id);
  return user;
};

// Use arrow functions for simple operations
const isValidEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email);

// Use proper async/await instead of promises
// ✅ Good
const fetchUser = async (id: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new UserNotFoundError(`User ${id} not found`);
  }
};

// ❌ Avoid
const fetchUser = (id: string): Promise<User> => {
  return api.get(`/users/${id}`)
    .then(response => response.data)
    .catch(error => {
      throw new UserNotFoundError(`User ${id} not found`);
    });
};
```

### Error Handling Standards
```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// Proper error handling in async functions
const createUser = async (userData: CreateUserRequest): Promise<User> => {
  try {
    validateUserData(userData);
    const user = await userService.create(userData);
    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error; // Re-throw known errors
    }
    throw new AppError('Failed to create user', 500, 'USER_CREATION_FAILED');
  }
};
```

## ⚛️ React/Frontend Standards

### Component Standards
```typescript
// Use function components with proper typing
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
  className,
}) => {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  return (
    <div className={className}>
      {/* Component content */}
    </div>
  );
};
```

### Hook Standards
```typescript
// Custom hooks should start with 'use'
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};
```

### State Management Standards
```typescript
// Use proper state typing
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// Use reducer for complex state
interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'RESET':
      return { user: null, loading: false, error: null };
    default:
      return state;
  }
};
```

## 🚀 Backend/Node.js Standards

### Express Controller Standards
```typescript
// Controller class structure
export class UsersController {
  constructor(private userService: UserService) {}

  // Use arrow functions to maintain 'this' context
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getById(id);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body as CreateUserRequest;
      const user = await this.userService.create(userData);
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### Service Layer Standards
```typescript
// Service class structure
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getById(id: string): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new ValidationError('Invalid user ID format');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async create(userData: CreateUserRequest): Promise<User> {
    // Validate input
    await this.validateCreateUserData(userData);
    
    // Check for existing user
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return user;
  }

  private async validateCreateUserData(data: CreateUserRequest): Promise<void> {
    // Use Zod or similar for validation
    const result = CreateUserSchema.safeParse(data);
    if (!result.success) {
      throw new ValidationError('Invalid user data', result.error.message);
    }
  }
}
```

## 🔍 Code Review Standards

### Code Review Checklist

#### General
- [ ] Code follows TypeScript strict mode requirements
- [ ] No `any` types without justification
- [ ] Proper error handling implemented
- [ ] Code is properly tested
- [ ] Documentation updated if needed

#### Security
- [ ] Input validation implemented
- [ ] No hardcoded secrets or sensitive data
- [ ] Proper authorization checks
- [ ] SQL/NoSQL injection prevention

#### Performance
- [ ] No unnecessary re-renders (React)
- [ ] Proper database query optimization
- [ ] Appropriate use of caching
- [ ] Memory leak prevention

#### Maintainability
- [ ] Code follows established patterns
- [ ] Functions are small and focused
- [ ] Proper separation of concerns
- [ ] Consistent naming conventions

### Review Process
1. **Self-review**: Author reviews their own code before requesting review
2. **Automated checks**: All CI checks must pass
3. **Peer review**: At least one team member reviews the code
4. **Testing**: Manual testing of new features
5. **Documentation**: Update relevant documentation

## 🧪 Testing Standards

### Test Structure
```typescript
// Test file naming: ComponentName.test.tsx or functionName.test.ts
describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
    } as any;
    
    userService = new UserService(mockUserRepository);
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 'valid-id';
      const expectedUser = { id: userId, email: 'test@example.com' };
      mockUserRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.getById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getById(userId)).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Test Categories
- **Unit Tests**: Test individual functions/methods
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Test performance characteristics

## 📝 Documentation Standards

### Code Documentation
```typescript
/**
 * Retrieves user information by ID with caching support
 * 
 * @param id - The unique user identifier
 * @param options - Optional retrieval options
 * @returns Promise resolving to user data or null if not found
 * 
 * @throws {ValidationError} When ID format is invalid
 * @throws {NotFoundError} When user doesn't exist
 * 
 * @example
 * ```typescript
 * const user = await getUserById('user123', { includeProfile: true });
 * console.log(user?.email);
 * ```
 */
async getUserById(
  id: string, 
  options: GetUserOptions = {}
): Promise<User | null> {
  // Implementation
}
```

### README Standards
Every feature/module should have a README with:
- Purpose and overview
- Installation/setup instructions
- Usage examples
- API documentation (if applicable)
- Contributing guidelines
- License information

## 🔧 Tool Configuration

### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## 🚀 Performance Standards

### General Performance Guidelines
- Use lazy loading for large components/modules
- Implement proper caching strategies
- Optimize database queries with indexes
- Use compression for API responses
- Implement proper error boundaries

### React Performance
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo<Props>(({ data, onUpdate }) => {
  // Expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item));
  }, [data]);

  // Stable callbacks
  const handleUpdate = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);

  return <div>{/* Component content */}</div>;
});

// Use proper key props for lists
{items.map(item => (
  <ItemComponent 
    key={item.id} // Use stable, unique keys
    item={item} 
  />
))}
```

### Backend Performance
```typescript
// Use database indexes
await db.collection('users').createIndex({ email: 1 }, { unique: true });

// Implement pagination
const getUsers = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  return await db.collection('users')
    .find({})
    .skip(skip)
    .limit(limit)
    .toArray();
};

// Use projection to limit returned fields
const getUserSummary = async (id: string) => {
  return await db.collection('users').findOne(
    { _id: new ObjectId(id) },
    { projection: { name: 1, email: 1, _id: 1 } }
  );
};
```

## 📊 Monitoring & Logging Standards

### Logging Standards
```typescript
// Use structured logging
logger.info('User created successfully', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
  requestId: req.id,
});

// Log levels
// ERROR: System errors, exceptions
// WARN: Deprecated features, recoverable errors
// INFO: General application flow
// DEBUG: Detailed diagnostic information

// Never log sensitive information
logger.info('User authenticated', {
  userId: user.id,
  // DON'T LOG: password, tokens, personal data
});
```

---

*These coding standards ensure consistency, maintainability, and quality across the MWAP platform codebase.*