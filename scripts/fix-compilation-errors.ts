/**
 * Fix Critical Compilation Errors Script
 * 
 * This script addresses the most critical TypeScript compilation errors
 * that are preventing the OAuth callback authentication system from compiling.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

async function fixCompilationErrors() {
  console.log('🔧 Fixing Critical TypeScript Compilation Errors\n');

  // 1. Fix ERROR_CODES references throughout the codebase
  await fixErrorCodesReferences();
  
  // 2. Fix logAudit function calls
  await fixLogAuditCalls();
  
  // 3. Fix errorResponse function calls  
  await fixErrorResponseCalls();
  
  // 4. Add missing schema properties
  await fixSchemaProperties();

  console.log('✅ Critical compilation error fixes applied');
  console.log('📝 Run "npm run build" to verify compilation');
}

async function fixErrorCodesReferences() {
  console.log('🔍 Fixing ERROR_CODES.INTERNAL_ERROR references...');
  
  const filesToFix = [
    'src/features/openapi/openapi.controller.ts',
    'src/features/openapi/openapi.service.ts'
  ];

  for (const filePath of filesToFix) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      content = content.replace(/ERROR_CODES\.INTERNAL_ERROR/g, 'ERROR_CODES.SERVER.INTERNAL_ERROR');
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`  ✅ Fixed ERROR_CODES references in ${filePath}`);
    } catch (error) {
      console.log(`  ⚠️ Could not fix ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function fixLogAuditCalls() {
  console.log('\n🔍 Fixing logAudit function calls...');
  
  const filesToFix = [
    'src/features/openapi/openapi.controller.ts',
    'src/features/openapi/performance.service.ts',
    'src/features/openapi/security.service.ts',
    'src/features/openapi/validation.service.ts'
  ];

  for (const filePath of filesToFix) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      
      // Fix common logAudit patterns - add missing target parameter
      content = content.replace(
        /logAudit\('([^']+)',\s*\{([^}]+)\}\);/g,
        "logAudit('$1', 'system', '$1', {$2});"
      );
      
      // Fix specific patterns in openapi controller
      content = content.replace(
        /logAudit\('OpenAPI ([^']+) requested',\s*\{/g,
        "logAudit('OpenAPI $1 requested', user?.sub || 'system', 'openapi_$1', {"
      );

      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`  ✅ Fixed logAudit calls in ${filePath}`);
    } catch (error) {
      console.log(`  ⚠️ Could not fix ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function fixErrorResponseCalls() {
  console.log('\n🔍 Fixing errorResponse function calls...');
  
  const filesToFix = [
    'src/features/openapi/openapi.controller.ts'
  ];

  for (const filePath of filesToFix) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      
      // Fix errorResponse calls with 4 parameters to use ApiError constructor
      content = content.replace(
        /errorResponse\(res,\s*(\d+),\s*'([^']+)',\s*([^)]+)\)/g,
        'errorResponse(res, new ApiError(\'$2\', $1, $3))'
      );
      
      // Fix errorResponse calls that access error.statusCode
      content = content.replace(
        /errorResponse\(res,\s*error\.statusCode,\s*error\.message,\s*error\.code\)/g,
        'errorResponse(res, error)'
      );

      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`  ✅ Fixed errorResponse calls in ${filePath}`);
    } catch (error) {
      console.log(`  ⚠️ Could not fix ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function fixSchemaProperties() {
  console.log('\n🔍 Adding missing schema properties...');
  
  // Fix the cloudProviderIntegration schema to include all properties
  try {
    const schemaPath = 'src/schemas/cloudProviderIntegration.schema.ts';
    let content = await fs.readFile(schemaPath, 'utf-8');
    
    // Make sure all properties are included in the update schema
    const updateSchemaFix = `
// Schema for updating an existing cloud provider integration
export const updateCloudProviderIntegrationSchema = z.object({
  providerId: objectIdSchema.optional(),
  status: z.enum(['active', 'expired', 'revoked', 'error']).optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
  scopesGranted: z.array(z.string()).optional(),
  connectedAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  tenantId: objectIdSchema.optional()
});`;

    if (!content.includes('updateCloudProviderIntegrationSchema')) {
      content += '\n' + updateSchemaFix;
      await fs.writeFile(schemaPath, content, 'utf-8');
      console.log(`  ✅ Added missing schema properties to ${schemaPath}`);
    }
  } catch (error) {
    console.log(`  ⚠️ Could not fix schema: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the fixes
fixCompilationErrors().catch(error => {
  console.error('❌ Error running compilation fixes:', error);
  process.exit(1);
}); 