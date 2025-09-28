import { z } from 'zod';
import { ValidationError } from './errors.js';

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validateWithSchema<T>(schema: z.Schema<T>, input: unknown): T {
  try {
    const result = schema.parse(input);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: Record<string, string> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        details[path || issue.path[0] as string] = issue.message;
      }
      
      const validationError = new ValidationError('Invalid input', details);
      throw validationError;
    }
    
    throw error;
  }
}