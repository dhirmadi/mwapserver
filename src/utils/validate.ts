import { z } from 'zod';
import { ValidationError } from './errors.js';

export function validateWithSchema<T>(schema: z.Schema<T>, input: unknown): T {
  try {
    // DEBUG: Log the input and schema
    console.log('DEBUG - Validate - Input:', JSON.stringify(input, null, 2));
    console.log('DEBUG - Validate - Schema:', schema);
    
    const result = schema.parse(input);
    
    // DEBUG: Log the successful validation result
    console.log('DEBUG - Validate - Result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // DEBUG: Log the detailed Zod error
      console.log('DEBUG - Validate - ZodError:', JSON.stringify(error.format(), null, 2));
      console.log('DEBUG - Validate - ZodError Issues:', JSON.stringify(error.issues, null, 2));
      
      const details: Record<string, string> = {};
      for (const issue of error.issues) {
        details[issue.path.join('.')] = issue.message;
        // DEBUG: Log each validation issue
        console.log(`DEBUG - Validate - Issue: Path=${issue.path.join('.')}, Message=${issue.message}, Code=${issue.code}`);
      }
      
      throw new ValidationError('Invalid input', details);
    }
    
    // DEBUG: Log any other errors
    console.log('DEBUG - Validate - Unknown Error:', error);
    
    throw error;
  }
}