# API Response Patterns

## Response Structure

### Success Response

All successful responses follow this structure:
```typescript
{
  success: true,
  data: {
    // Response data
  }
}
```

Example:
```typescript
{
  success: true,
  data: {
    id: 'tenant-123',
    name: 'Test Tenant',
    settings: {
      allowPublicProjects: true,
      maxProjects: 20
    }
  }
}
```

### Error Response

All error responses follow this structure:
```typescript
{
  success: false,
  error: {
    code: string,    // Error code in format 'domain/error-type'
    message: string  // Human-readable error message
  }
}
```

Example:
```typescript
{
  success: false,
  error: {
    code: 'auth/invalid-token',
    message: 'Invalid authentication token provided'
  }
}
```

## Testing Response Patterns

### Success Response Testing

1. **Basic Success Test**
```typescript
it('should return successful response', async () => {
  const response = await request(app)
    .get('/api/resource')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
});
```

2. **Testing Response Data**
```typescript
it('should return correct data structure', async () => {
  const response = await request(app)
    .post('/api/tenants')
    .send(tenantData);

  expect(response.status).toBe(201);
  expect(response.body).toMatchObject({
    success: true,
    data: {
      name: tenantData.name,
      settings: tenantData.settings
    }
  });
});
```

### Error Response Testing

1. **Basic Error Test**
```typescript
it('should handle invalid input', async () => {
  const response = await request(app)
    .post('/api/resource')
    .send({});

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    success: false,
    error: {
      code: 'validation/invalid-input',
      message: expect.any(String)
    }
  });
});
```

2. **Testing Specific Error Cases**
```typescript
it('should handle unauthorized access', async () => {
  const response = await request(app)
    .get('/api/protected-resource');

  expect(response.status).toBe(401);
  expect(response.body).toEqual({
    success: false,
    error: {
      code: 'auth/invalid-token',
      message: expect.any(String)
    }
  });
});
```

## Common Response Status Codes

| Status Code | Description | Example Use Case |
|-------------|-------------|------------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST creating new resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Unexpected server error |

## Testing Utilities

### Response Assertion Helpers

```typescript
export function expectSuccess(response: Response, status = 200) {
  expect(response.status).toBe(status);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
}

export function expectError(
  response: Response, 
  status: number, 
  code: string
) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({
    success: false,
    error: {
      code,
      message: expect.any(String)
    }
  });
}
```

### Usage Examples

```typescript
describe('Tenant API', () => {
  it('should create tenant', async () => {
    const response = await request(app)
      .post('/api/tenants')
      .send(validTenantData);

    expectSuccess(response, 201);
    expect(response.body.data).toMatchObject({
      name: validTenantData.name
    });
  });

  it('should reject invalid data', async () => {
    const response = await request(app)
      .post('/api/tenants')
      .send({});

    expectError(response, 400, 'validation/invalid-input');
  });
});
```

## Best Practices

1. **Consistent Response Structure**
   - Always use the standard success/error response format
   - Include all required fields
   - Use consistent error codes

2. **Status Code Usage**
   - Use appropriate status codes
   - Be consistent across similar operations
   - Document any non-standard usage

3. **Error Handling**
   - Use descriptive error messages
   - Include relevant error details
   - Maintain security (don't leak sensitive info)

4. **Testing**
   - Test both success and error cases
   - Verify response structure
   - Check status codes
   - Validate error codes
   - Test edge cases

5. **Documentation**
   - Document response formats
   - List possible error codes
   - Provide examples
   - Explain non-obvious behavior