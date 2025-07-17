#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '..', 'docs');
const results = {
  navigation: [],
  accessibility: [],
  structure: []
};

console.log('🧭 Testing documentation navigation and accessibility...\n');

// Test 1: Main entry points are accessible
function testMainEntryPoints() {
  console.log('📍 Testing main entry points...');
  
  const entryPoints = [
    'docs/README.md',
    'docs/v3-architecture-reference.md',
    'docs/v3-api.md',
    'docs/features/feature-pattern.md',
    'docs/integrations/oauth-guide.md',
    'docs/testing/README.md'
  ];
  
  for (const entry of entryPoints) {
    const fullPath = path.join(__dirname, '..', entry);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${entry} - accessible`);
      results.accessibility.push({ file: entry, status: 'accessible' });
    } else {
      console.log(`  ❌ ${entry} - missing`);
      results.accessibility.push({ file: entry, status: 'missing' });
    }
  }
  console.log('');
}

// Test 2: Navigation flow from main index
function testNavigationFlow() {
  console.log('🔗 Testing navigation flow from main index...');
  
  const mainIndex = path.join(docsDir, 'README.md');
  if (!fs.existsSync(mainIndex)) {
    console.log('  ❌ Main documentation index missing');
    return;
  }
  
  const content = fs.readFileSync(mainIndex, 'utf8');
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  let validLinks = 0;
  let totalLinks = 0;
  
  while ((match = linkPattern.exec(content)) !== null) {
    const linkText = match[1];
    const linkUrl = match[2];
    totalLinks++;
    
    // Skip external links
    if (linkUrl.startsWith('http')) {
      continue;
    }
    
    // Resolve relative path
    const linkPath = path.resolve(path.dirname(mainIndex), linkUrl);
    
    if (fs.existsSync(linkPath)) {
      console.log(`  ✅ ${linkText} → ${linkUrl}`);
      validLinks++;
      results.navigation.push({ text: linkText, url: linkUrl, status: 'valid' });
    } else {
      console.log(`  ❌ ${linkText} → ${linkUrl} (broken)`);
      results.navigation.push({ text: linkText, url: linkUrl, status: 'broken' });
    }
  }
  
  console.log(`  📊 Navigation summary: ${validLinks}/${totalLinks} links valid\n`);
}

// Test 3: Directory structure accessibility
function testDirectoryStructure() {
  console.log('📁 Testing directory structure accessibility...');
  
  const expectedDirs = [
    'features',
    'testing',
    'integrations',
    'archive',
    'architecture',
    'frontend'
  ];
  
  for (const dir of expectedDirs) {
    const dirPath = path.join(docsDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      console.log(`  ✅ ${dir}/ - ${files.length} markdown files`);
      results.structure.push({ directory: dir, fileCount: files.length, status: 'accessible' });
      
      // Check if directory has an index/README
      const hasIndex = files.some(f => f.toLowerCase() === 'readme.md' || f.toLowerCase() === 'index.md');
      if (hasIndex) {
        console.log(`    📋 Has index file`);
      } else {
        console.log(`    ⚠️  No index file found`);
      }
    } else {
      console.log(`  ❌ ${dir}/ - missing`);
      results.structure.push({ directory: dir, fileCount: 0, status: 'missing' });
    }
  }
  console.log('');
}

// Test 4: Cross-reference accessibility
function testCrossReferences() {
  console.log('🔗 Testing cross-reference accessibility...');
  
  const keyFiles = [
    'docs/v3-architecture-reference.md',
    'docs/features/feature-pattern.md',
    'docs/integrations/oauth-guide.md'
  ];
  
  for (const file of keyFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ❌ ${file} - missing`);
      continue;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let crossRefs = 0;
    
    while ((match = linkPattern.exec(content)) !== null) {
      const linkUrl = match[2];
      
      // Count internal cross-references (not external or anchors)
      if (!linkUrl.startsWith('http') && !linkUrl.startsWith('#') && linkUrl.includes('/')) {
        crossRefs++;
      }
    }
    
    console.log(`  📄 ${path.basename(file)} - ${crossRefs} cross-references`);
  }
  console.log('');
}

// Test 5: Archive accessibility
function testArchiveAccessibility() {
  console.log('📦 Testing archive accessibility...');
  
  const archivePath = path.join(docsDir, 'archive');
  if (!fs.existsSync(archivePath)) {
    console.log('  ❌ Archive directory missing');
    return;
  }
  
  const archiveReadme = path.join(archivePath, 'README.md');
  if (fs.existsSync(archiveReadme)) {
    console.log('  ✅ Archive README.md exists');
  } else {
    console.log('  ⚠️  Archive README.md missing');
  }
  
  // Count archived files
  function countFiles(dir) {
    let count = 0;
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        count += countFiles(itemPath);
      } else if (item.endsWith('.md')) {
        count++;
      }
    }
    
    return count;
  }
  
  const archivedFiles = countFiles(archivePath);
  console.log(`  📊 ${archivedFiles} archived markdown files`);
  console.log('');
}

// Run all tests
function runNavigationTests() {
  testMainEntryPoints();
  testNavigationFlow();
  testDirectoryStructure();
  testCrossReferences();
  testArchiveAccessibility();
  
  // Summary
  console.log('📊 NAVIGATION TEST SUMMARY');
  console.log('='.repeat(50));
  
  const accessibleCount = results.accessibility.filter(r => r.status === 'accessible').length;
  const totalAccessibility = results.accessibility.length;
  
  const validNavCount = results.navigation.filter(r => r.status === 'valid').length;
  const totalNav = results.navigation.length;
  
  const accessibleDirs = results.structure.filter(r => r.status === 'accessible').length;
  const totalDirs = results.structure.length;
  
  console.log(`✅ Entry Points: ${accessibleCount}/${totalAccessibility} accessible`);
  console.log(`✅ Navigation: ${validNavCount}/${totalNav} links valid`);
  console.log(`✅ Structure: ${accessibleDirs}/${totalDirs} directories accessible`);
  
  const allPassed = accessibleCount === totalAccessibility && 
                   validNavCount === totalNav && 
                   accessibleDirs === totalDirs;
  
  if (allPassed) {
    console.log('\n🎉 All navigation tests passed!');
    return true;
  } else {
    console.log('\n⚠️  Some navigation issues found');
    return false;
  }
}

// Execute tests
const success = runNavigationTests();
process.exit(success ? 0 : 1);