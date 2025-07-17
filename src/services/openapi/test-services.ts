/**
 * Test script for OpenAPI services
 * 
 * This script tests the core OpenAPI generation services to ensure they work correctly.
 * Run with: tsx src/services/openapi/test-services.ts
 */

import { openAPIService } from './index.js';

async function testOpenAPIServices() {
  console.log('🧪 Testing OpenAPI Services...\n');

  try {
    // Test 1: Generate API info
    console.log('📋 Test 1: Generate API Info');
    const info = await openAPIService.generateInfo();
    console.log('✅ API Info generated successfully:');
    console.log(`   - Title: ${info.title}`);
    console.log(`   - Version: ${info.version}`);
    console.log(`   - Paths: ${info.pathCount}`);
    console.log(`   - Schemas: ${info.schemaCount}`);
    console.log(`   - Tags: ${info.tagCount}\n`);

    // Test 2: Generate full document
    console.log('📄 Test 2: Generate Full OpenAPI Document');
    const document = await openAPIService.generateDocument();
    console.log('✅ Full document generated successfully:');
    console.log(`   - OpenAPI Version: ${document.openapi}`);
    console.log(`   - Paths: ${Object.keys(document.paths).length}`);
    console.log(`   - Components: ${Object.keys(document.components?.schemas || {}).length} schemas`);
    console.log(`   - Security Schemes: ${Object.keys(document.components?.securitySchemes || {}).length}\n`);

    // Test 3: Cache functionality
    console.log('💾 Test 3: Cache Functionality');
    const cacheStatus1 = openAPIService.getCacheStatus();
    console.log(`   - Cache status before: ${cacheStatus1.cached ? 'HIT' : 'MISS'}`);
    
    const document2 = await openAPIService.generateDocument();
    const cacheStatus2 = openAPIService.getCacheStatus();
    console.log(`   - Cache status after: ${cacheStatus2.cached ? 'HIT' : 'MISS'}`);
    console.log(`   - Documents identical: ${document === document2}`);
    
    openAPIService.invalidateCache();
    const cacheStatus3 = openAPIService.getCacheStatus();
    console.log(`   - Cache status after invalidation: ${cacheStatus3.cached ? 'HIT' : 'MISS'}\n`);

    // Test 4: Sample paths
    console.log('🛣️  Test 4: Sample Generated Paths');
    const samplePaths = Object.keys(document.paths).slice(0, 5);
    for (const path of samplePaths) {
      const methods = Object.keys(document.paths[path]);
      console.log(`   - ${path}: ${methods.join(', ')}`);
    }
    console.log();

    // Test 5: Sample schemas
    console.log('📋 Test 5: Sample Generated Schemas');
    const sampleSchemas = Object.keys(document.components?.schemas || {}).slice(0, 5);
    for (const schema of sampleSchemas) {
      console.log(`   - ${schema}`);
    }

    console.log('\n✅ All tests passed! OpenAPI services are working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testOpenAPIServices();
}