import { describe, it, expect } from 'vitest';
import { validateWithSchema } from '../validate.js';
import { ValidationError } from '../errors.js';
import { z } from 'zod';

describe('validate utils', () => {
  describe('validateWithSchema', () => {
    const testSchema = z.object({
      name: z.string().min(2),
      age: z.number().min(18),
      email: z.string().email()
    });

    it('should validate correct data successfully', () => {
      const testData = {
        name: 'John',
        age: 25,
        email: 'john@example.com'
      };

      const validated = validateWithSchema(testSchema, testData);
      expect(validated).toEqual(testData);
    });

    it('should throw ValidationError for invalid data', () => {
      const invalidData = {
        name: 'J', // too short
        age: 15,  // too young
        email: 'not-an-email' // invalid email
      };

      expect(() => validateWithSchema(testSchema, invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for missing fields', () => {
      const incompleteData = {
        name: 'John'
        // missing age and email
      };

      expect(() => validateWithSchema(testSchema, incompleteData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for wrong types', () => {
      const wrongTypeData = {
        name: 'John',
        age: '25', // should be number
        email: 'john@example.com'
      };

      expect(() => validateWithSchema(testSchema, wrongTypeData))
        .toThrow(ValidationError);
    });
  });
});