import { z } from 'zod';
import { ValidationError } from './errors.js';
export function validateWithSchema(schema, input) {
    try {
        return schema.parse(input);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const details = {};
            for (const issue of error.issues) {
                details[issue.path[0]] = issue.message;
            }
            throw new ValidationError('Invalid input', details);
        }
        throw error;
    }
}
