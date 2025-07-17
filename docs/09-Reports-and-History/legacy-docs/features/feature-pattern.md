# 📘 MWAP Feature Implementation Pattern

This document defines the standard pattern for implementing new features in the MWAP backend. This pattern is based on the proven implementation of the tenants and project-types features.

## 📁 Feature Structure

Each feature should be organized in its own directory under `/src/features/{feature-name}/` with the following files:

```
/src/features/{feature-name}/
  ├── {feature}.controller.ts   # Request handlers
  ├── {feature}.service.ts      # Business logic
  └── {feature}.routes.ts       # Route definitions
```

## 🔧 Implementation Pattern

### 1. Schema Definition

Location: `/src/schemas/{feature}.schema.ts`

```typescript
import { z } from 'zod';

// Base schema
export const featureSchema = z.object({
  name: z.string(),
  // ... other fields
});

// Create request schema
export const createFeatureSchema = featureSchema.omit({ 
  createdAt: true, 
  updatedAt: true 
});

// Update request schema
export const updateFeatureSchema = featureSchema
  .partial()
  .omit({ createdAt: true, updatedAt: true });

// Error codes
export const FeatureErrorCodes = {
  NOT_FOUND: 'feature/not-found',
  NAME_EXISTS: 'feature/name-exists',
  // ... other error codes
} as const;

// Types
export type Feature = z.infer<typeof featureSchema>;
export type CreateFeatureRequest = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureRequest = z.infer<typeof updateFeatureSchema>;
```

### 2. Service Implementation

Location: `/src/features/{feature-name}/{feature}.service.ts`

```typescript
import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../../config/db';
import { ApiError } from '../../utils/errors';
import { logAudit } from '../../utils/logger';
import { Feature, CreateFeatureRequest, UpdateFeatureRequest, FeatureErrorCodes } from '../../schemas/feature.schema';

export class FeatureService {
  private collection: Collection<Feature>;

  constructor() {
    this.collection = getDB().collection<Feature>('features');
  }

  async findAll(): Promise<Feature[]> {
    return this.collection.find().toArray();
  }

  async findById(id: string): Promise<Feature> {
    const feature = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!feature) {
      throw new ApiError('Feature not found', 404, FeatureErrorCodes.NOT_FOUND);
    }
    return feature;
  }

  async create(data: CreateFeatureRequest, userId: string): Promise<Feature> {
    const now = new Date();
    const feature: Feature = {
      _id: new ObjectId(),
      ...data,
      createdAt: now,
      updatedAt: now,
      createdBy: userId
    };

    await this.collection.insertOne(feature);
    
    logAudit('feature.create', userId, feature._id.toString(), {
      name: feature.name
    });

    return feature;
  }

  async update(id: string, data: UpdateFeatureRequest, userId: string): Promise<Feature> {
    const feature = await this.findById(id);

    const updates = {
      ...data,
      updatedAt: new Date()
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: feature._id },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new ApiError('Failed to update feature', 500, FeatureErrorCodes.NOT_FOUND);
    }

    logAudit('feature.update', userId, id, {
      updates: data
    });

    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    const feature = await this.findById(id);
    await this.collection.deleteOne({ _id: feature._id });
    logAudit('feature.delete', userId, id);
  }
}
```

### 3. Controller Implementation

Location: `/src/features/{feature-name}/{feature}.controller.ts`

```typescript
import { Request, Response } from 'express';
import { FeatureService } from './feature.service';
import { validateWithSchema } from '../../utils/validate';
import { getUserFromToken } from '../../utils/auth';
import { jsonResponse } from '../../utils/response';
import { ApiError } from '../../utils/errors';
import { createFeatureSchema, updateFeatureSchema, FeatureErrorCodes } from '../../schemas/feature.schema';

const featureService = new FeatureService();

export async function getAllFeatures(req: Request, res: Response) {
  const features = await featureService.findAll();
  return jsonResponse(res, 200, features);
}

export async function getFeatureById(req: Request, res: Response) {
  const feature = await featureService.findById(req.params.id);
  return jsonResponse(res, 200, feature);
}

export async function createFeature(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const data = validateWithSchema(createFeatureSchema, req.body);
    const feature = await featureService.create(data, user.sub);
    return jsonResponse(res, 201, feature);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, FeatureErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function updateFeature(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const data = validateWithSchema(updateFeatureSchema, req.body);
    const feature = await featureService.update(req.params.id, data, user.sub);
    return jsonResponse(res, 200, feature);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, FeatureErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function deleteFeature(req: Request, res: Response) {
  const user = getUserFromToken(req);
  await featureService.delete(req.params.id, user.sub);
  return jsonResponse(res, 204);
}
```

### 4. Routes Implementation

Location: `/src/features/{feature-name}/{feature}.routes.ts`

```typescript
import { Router } from 'express';
import { requireRole } from '../../middleware/roles';
import { wrapAsyncHandler } from '../../utils/response';
import {
  getAllFeatures,
  getFeatureById,
  createFeature,
  updateFeature,
  deleteFeature
} from './feature.controller';

export function getFeatureRouter(): Router {
  const router = Router();

  // Apply role middleware if needed
  router.use(requireRole());

  // GET /api/v1/features
  router.get('/', wrapAsyncHandler(getAllFeatures));

  // GET /api/v1/features/:id
  router.get('/:id', wrapAsyncHandler(getFeatureById));

  // POST /api/v1/features
  router.post('/', wrapAsyncHandler(createFeature));

  // PATCH /api/v1/features/:id
  router.patch('/:id', wrapAsyncHandler(updateFeature));

  // DELETE /api/v1/features/:id
  router.delete('/:id', wrapAsyncHandler(deleteFeature));

  return router;
}
```

### 5. Route Registration

Location: `/src/app.ts`

```typescript
export async function registerRoutes(): Promise<void> {
  // ... other routes

  const { getFeatureRouter } = await import('./features/feature-name/feature.routes');
  console.log('[MWAP] ✅ /api/v1/features route loaded');

  app.use('/api/v1/features', getFeatureRouter());
}
```

## 🔑 Key Principles

1. **Separation of Concerns**
   - Schemas define data structure and validation
   - Services contain business logic
   - Controllers handle HTTP layer
   - Routes define API endpoints

2. **Consistent Patterns**
   - Functional approach in controllers
   - Class-based services with MongoDB collections
   - Centralized error handling
   - Standard response formatting

3. **Database Access**
   - Use `getDB()` to access MongoDB
   - Initialize collections in service constructor
   - Use proper typing for collections

4. **Error Handling**
   - Use `ApiError` for all errors
   - Define feature-specific error codes
   - Consistent error response format
   - Proper HTTP status codes

5. **Authentication & Authorization**
   - JWT auth handled globally in app.ts
   - Role middleware applied in routes
   - User extraction via `getUserFromToken`

6. **Audit Logging**
   - Log all write operations
   - Include user ID and entity ID
   - Add relevant metadata

## 📝 Implementation Checklist

1. [ ] Create feature schema with Zod
2. [ ] Define error codes
3. [ ] Implement service class
4. [ ] Create controller functions
5. [ ] Set up routes
6. [ ] Register routes in app.ts
7. [ ] Add audit logging
8. [ ] Implement proper error handling
9. [ ] Add role-based access control

## 🚫 Common Pitfalls

1. Don't duplicate JWT authentication (handled globally)
2. Don't access MongoDB directly in controllers
3. Don't handle response formatting in services
4. Don't skip audit logging
5. Don't mix business logic in controllers

## 🔍 Testing (Phase 8)

While comprehensive testing is postponed to Phase 8, the feature structure supports:

- Unit tests for services
- Controller tests
- Route integration tests
- Schema validation tests

## 📚 References

- [Architecture Reference](../v3-architecture-reference.md)
- [API Contract](../v3-api.md)
- [Domain Map](../v3-domainmap.md)