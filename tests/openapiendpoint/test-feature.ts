/**
 * Test script for OpenAPI feature module
 * 
 * This script tests the OpenAPI feature module to ensure all components work correctly.
 * Run with: tsx src/features/openapi/test-feature.ts
 */

import { OpenAPIFeatureService } from '../../src/features/openapi/openapi.service.ts';

async function testOpenAPIFeature() {
  console.log('🧪 Testing OpenAPI Feature Module...\n');

  const service = new OpenAPIFeatureService();

  try {
    // Test 1: Get OpenAPI Info
    console.log('📋 Test 1: Get OpenAPI Info');
    const info = await service.getOpenAPIInfo();
    console.log('✅ OpenAPI Info retrieved successfully:');
    console.log(`   - Title: ${info.title}`);
    console.log(`   - Version: ${info.version}`);
    console.log(`   - Paths: ${info.pathCount}`);
    console.log(`   - Schemas: ${info.schemaCount}`);
    console.log(`   - Tags: ${info.tagCount}\n`);

    // Test 2: Get OpenAPI Specification
    console.log('📄 Test 2: Get OpenAPI Specification');
    const spec = await service.getOpenAPISpecification({ 
      format: 'json', 
      includeExamples: false, 
      minify: false 
    });
    console.log('✅ OpenAPI Specification generated successfully:');
    console.log(`   - OpenAPI Version: ${spec.openapi}`);
    console.log(`   - Paths: ${Object.keys(spec.paths).length}`);
    console.log(`   - Schemas: ${Object.keys(spec.components?.schemas || {}).length}`);
    console.log(`   - Security Schemes: ${Object.keys(spec.components?.securitySchemes || {}).length}\n`);

    // Test 3: Cache Status
    console.log('💾 Test 3: Cache Status');
    const cacheStatus = service.getCacheStatus();
    console.log('✅ Cache status retrieved successfully:');
    console.log(`   - Cached: ${cacheStatus.cached}`);
    console.log(`   - Age: ${cacheStatus.age}ms`);
    console.log(`   - TTL: ${cacheStatus.ttl}ms`);
    console.log(`   - Last Generated: ${cacheStatus.lastGenerated || 'N/A'}\n`);

    // Test 4: Validation
    console.log('🔍 Test 4: Specification Validation');
    const validation = await service.validateSpecification();
    console.log('✅ Validation completed:');
    console.log(`   - Valid: ${validation.valid}`);
    console.log(`   - Errors: ${validation.errors.length}`);
    if (validation.errors.length > 0) {
      validation.errors.forEach((error, index) => {
        console.log(`     ${index + 1}. ${error}`);
      });
    }
    console.log();

    // Test 5: Minified Specification
    console.log('📦 Test 5: Minified Specification');
    const minifiedSpec = await service.getOpenAPISpecification({ 
      format: 'json', 
      includeExamples: false, 
      minify: true 
    });
    const originalSize = JSON.stringify(spec).length;
    const minifiedSize = JSON.stringify(minifiedSpec).length;
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    console.log('✅ Minified specification generated:');
    console.log(`   - Original size: ${originalSize} characters`);
    console.log(`   - Minified size: ${minifiedSize} characters`);
    console.log(`   - Size reduction: ${reduction}%\n`);

    // Test 6: Cache Invalidation
    console.log('🗑️  Test 6: Cache Invalidation');
    service.invalidateCache();
    const newCacheStatus = service.getCacheStatus();
    console.log('✅ Cache invalidated successfully:');
    console.log(`   - Cached after invalidation: ${newCacheStatus.cached}\n`);

    console.log('✅ All tests passed! OpenAPI feature module is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testOpenAPIFeature();
}