import { z } from 'zod';
import { ValidationError } from './errors.js';

export function validateWithSchema<T>(schema: z.Schema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: Record<string, string> = {};
      for (const issue of error.issues) {
        details[issue.path.join('.')] = issue.message;
      }
      throw new ValidationError('Invalid input', details);
    }
    throw error;
  }
}