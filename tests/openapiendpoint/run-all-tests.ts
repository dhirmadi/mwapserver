#!/usr/bin/env npx tsx
/**
 * OpenAPI Endpoint Test Runner
 * 
 * Runs all OpenAPI endpoint tests in sequence
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [
  'test-services.ts',
  'test-feature.ts', 
  'test-phase4-simple.ts',
  'test-phase4-integration.ts',
  'test-phase5-advanced.ts'
];

async function runAllTests() {
  console.log('🧪 Running All OpenAPI Endpoint Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const testPath = join(__dirname, test);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Running: ${test}`);
    console.log(`${'='.repeat(60)}\n`);
    
    try {
      execSync(`npx tsx "${testPath}"`, { 
        stdio: 'inherit',
        cwd: join(__dirname, '../..')
      });
      console.log(`\n✅ ${test} - PASSED`);
      passed++;
    } catch (error) {
      console.log(`\n❌ ${test} - FAILED`);
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Test Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

runAllTests().catch(console.error);