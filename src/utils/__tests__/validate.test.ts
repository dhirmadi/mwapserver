import { describe, it, expect } from 'vitest';
import { validateWithSchema } from '../validate.js';
import { ValidationError } from '../errors.js';
import { z } from 'zod';
import { ERROR_CODES } from '../../__tests__/constants';

// Import test setup
import '../../__tests__/setup';

describe('validate utils', () => {
  describe('validateWithSchema', () => {
    const testSchema = z.object({
      name: z.string().min(2),
      age: z.number().min(18),
      email: z.string().email()
    });

    it('should validate correct data successfully', () => {
      // Create test data
      const testData = {
        name: 'John',
        age: 25,
        email: 'john@example.com'
      };

      // Execute and verify
      const validated = validateWithSchema(testSchema, testData);
      expect(validated).toEqual(testData);
    });

    it('should throw ValidationError for invalid data', () => {
      // Create test data
      const invalidData = {
        name: 'J', // too short
        age: 15,  // too young
        email: 'not-an-email' // invalid email
      };

      // Execute and verify
      expect(() => validateWithSchema(testSchema, invalidData))
        .toThrow(new ValidationError('Invalid input', {
          name: 'String must contain at least 2 character(s)',
          age: 'Number must be greater than or equal to 18',
          email: 'Invalid email'
        }));
    });

    it('should throw ValidationError for missing fields', () => {
      // Create test data
      const incompleteData = {
        name: 'John'
        // missing age and email
      };

      // Execute and verify
      expect(() => validateWithSchema(testSchema, incompleteData))
        .toThrow(new ValidationError('Invalid input', {
          age: 'Required',
          email: 'Required'
        }));
    });

    it('should throw ValidationError for wrong types', () => {
      // Create test data
      const wrongTypeData = {
        name: 'John',
        age: '25', // should be number
        email: 'john@example.com'
      };

      // Execute and verify
      expect(() => validateWithSchema(testSchema, wrongTypeData))
        .toThrow(new ValidationError('Invalid input', {
          age: 'Expected number, received string'
        }));
    });
  });
});