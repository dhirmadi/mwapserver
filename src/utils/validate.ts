import { z } from 'zod';
import { ValidationError } from './errors.js';

export function validateWithSchema<T>(schema: z.Schema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input provided', error.issues);
    }
    throw error;
  }
}