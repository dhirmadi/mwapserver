import { describe, it, expect } from 'vitest';
import { validateWithSchema } from '../../src/utils/validate';
import { z } from 'zod';

describe('validateWithSchema', () => {
  it('should validate data against a schema', () => {
    const schema = z.object({
      name: z.string().min(3)
    });

    const data = { name: 'test' };
    const result = validateWithSchema(schema, data);
    expect(result).toEqual(data);
  });
});