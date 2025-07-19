import { getDocsRouter as getOriginalDocsRouter, openApiDocument } from './api-docs.js';
import { getEnhancedDocsRouter, invalidateEnhancedDocsCache } from './enhanced-api-docs.js';

// Export enhanced version by default, with fallback to original
export function getDocsRouter() {
  try {
    // Try to use enhanced version
    return getEnhancedDocsRouter();
  } catch (error) {
    console.warn('Failed to load enhanced docs router, falling back to original:', error);
    return getOriginalDocsRouter();
  }
}

// Export both versions for flexibility
export { 
  getOriginalDocsRouter,
  getEnhancedDocsRouter,
  invalidateEnhancedDocsCache,
  openApiDocument 
};