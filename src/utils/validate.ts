import { z } from 'zod';
import { ValidationError } from './errors.js';

export function validateWithSchema<T>(schema: z.Schema<T>, input: unknown): T {
  try {
    console.log('DEBUG - Validating input:', JSON.stringify(input, null, 2));
    console.log('DEBUG - Schema description:', schema.description || 'No description available');
    
    // Try to get schema shape if available
    try {
      if ('shape' in schema) {
        console.log('DEBUG - Schema shape keys:', Object.keys((schema as any).shape));
      }
    } catch (e) {
      console.log('DEBUG - Could not extract schema shape:', e);
    }
    
    const result = schema.parse(input);
    console.log('DEBUG - Validation successful, result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.log('DEBUG - Validation error:', error);
    
    if (error instanceof z.ZodError) {
      console.log('DEBUG - ZodError issues:', JSON.stringify(error.issues, null, 2));
      
      const details: Record<string, string> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        details[path || issue.path[0] as string] = issue.message;
        console.log(`DEBUG - Issue at path "${path}": ${issue.message}`);
      }
      
      const validationError = new ValidationError('Invalid input', details);
      console.log('DEBUG - Created ValidationError:', validationError);
      throw validationError;
    }
    
    console.log('DEBUG - Non-ZodError thrown during validation');
    throw error;
  }
}