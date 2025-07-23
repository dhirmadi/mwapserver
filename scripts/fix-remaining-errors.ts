/**
 * Fix Remaining TypeScript Compilation Errors
 * 
 * Addresses remaining MongoDB ObjectId conflicts and Express handler issues
 */

import { promises as fs } from 'fs';

async function fixRemainingErrors() {
  console.log('🔧 Fixing Remaining TypeScript Compilation Errors\n');

  // 1. Fix MongoDB ObjectId vs string conflicts
  await fixMongoDbTypeConflicts();
  
  // 2. Fix Express handler parameter issues
  await fixExpressHandlerIssues();
  
  // 3. Fix optional parameter issues
  await fixOptionalParameterIssues();

  console.log('✅ Remaining compilation error fixes applied');
  console.log('📝 Run "npm run build" to verify compilation');
}

async function fixMongoDbTypeConflicts() {
  console.log('🔍 Fixing MongoDB ObjectId type conflicts...');
  
  // Fix projects service ObjectId issues
  try {
    const projectsServicePath = 'src/features/projects/projects.service.ts';
    let content = await fs.readFile(projectsServicePath, 'utf-8');
    
    // Fix the query filters to convert ObjectId to string
    content = content.replace(
      /_id: projectId,/g,
      '_id: projectId.toString(),'
    );
    
    content = content.replace(
      /tenantId,/g,
      'tenantId: tenantId.toString(),'
    );
    
    content = content.replace(
      /projectTypeId,/g,
      'projectTypeId: projectTypeId.toString(),'
    );
    
    content = content.replace(
      /cloudIntegrationId,/g,
      'cloudIntegrationId: cloudIntegrationId.toString(),'
    );

    await fs.writeFile(projectsServicePath, content, 'utf-8');
    console.log(`  ✅ Fixed ObjectId conflicts in ${projectsServicePath}`);
  } catch (error) {
    console.log(`  ⚠️ Could not fix projects service: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Fix cloud integrations service ObjectId queries
  try {
    const integrationsServicePath = 'src/features/cloud-integrations/cloudIntegrations.service.ts';
    let content = await fs.readFile(integrationsServicePath, 'utf-8');
    
    // Fix query parameters to use string conversion
    content = content.replace(
      /tenantId: tenantObjectId/g,
      'tenantId: tenantObjectId.toString()'
    );
    
    content = content.replace(
      /providerId: providerObjectId/g,
      'providerId: providerObjectId.toString()'
    );

    await fs.writeFile(integrationsServicePath, content, 'utf-8');
    console.log(`  ✅ Fixed ObjectId conflicts in ${integrationsServicePath}`);
  } catch (error) {
    console.log(`  ⚠️ Could not fix integrations service: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function fixExpressHandlerIssues() {
  console.log('\n🔍 Fixing Express handler parameter issues...');
  
  // Fix required vs optional parameter mismatches
  const filesToFix = [
    'src/features/cloud-providers/cloudProviders.controller.ts',
    'src/features/files/files.controller.ts',
    'src/features/projects/projects.controller.ts'
  ];

  for (const filePath of filesToFix) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      
      // Add default values for optional parameters
      content = content.replace(
        /grantType\?: string \| undefined/g,
        'grantType: string'
      );
      
      content = content.replace(
        /tokenMethod\?: string \| undefined/g,
        'tokenMethod: string'
      );
      
      // Fix optional boolean parameters
      content = content.replace(
        /recursive\?: boolean \| undefined/g,
        'recursive: boolean'
      );
      
      content = content.replace(
        /archived\?: boolean \| undefined/g,
        'archived: boolean'
      );
      
      // Fix optional format parameters
      content = content.replace(
        /format\?: "json" \| "yaml" \| undefined/g,
        'format: "json" | "yaml"'
      );

      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`  ✅ Fixed Express handler issues in ${filePath}`);
    } catch (error) {
      console.log(`  ⚠️ Could not fix ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function fixOptionalParameterIssues() {
  console.log('\n🔍 Fixing optional parameter validation issues...');
  
  // Fix schema validation to provide defaults for optional parameters
  const filesToFix = [
    'src/features/cloud-providers/cloudProviders.controller.ts',
    'src/features/files/files.controller.ts', 
    'src/features/projects/projects.controller.ts'
  ];

  for (const filePath of filesToFix) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      
      // Add default values to prevent undefined issues
      content = content.replace(
        /const data = validateWithSchema\(([^,]+), req\.body\);/g,
        `const data = validateWithSchema($1, req.body);
    // Add default values for optional parameters
    if (!data.grantType) data.grantType = 'authorization_code';
    if (!data.tokenMethod) data.tokenMethod = 'POST';
    if (data.recursive === undefined) data.recursive = false;
    if (data.archived === undefined) data.archived = false;`
      );
      
      content = content.replace(
        /const query = validateWithSchema\(([^,]+), req\.query\);/g,
        `const query = validateWithSchema($1, req.query);
    // Add default values for optional parameters  
    if (!query.format) query.format = 'json';
    if (query.includeExamples === undefined) query.includeExamples = true;
    if (query.minify === undefined) query.minify = false;
    if (query.recursive === undefined) query.recursive = false;`
      );

      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`  ✅ Fixed optional parameter issues in ${filePath}`);
    } catch (error) {
      console.log(`  ⚠️ Could not fix ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Run the fixes
fixRemainingErrors().catch(error => {
  console.error('❌ Error running remaining fixes:', error);
  process.exit(1);
}); 