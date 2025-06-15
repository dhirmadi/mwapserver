#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, existsSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';

// Create dist directory if it doesn't exist
if (!existsSync('./dist')) {
  mkdirSync('./dist', { recursive: true });
}

// Function to copy non-TypeScript files
function copyNonTsFiles(sourceDir, targetDir) {
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const items = readdirSync(sourceDir);
  
  for (const item of items) {
    const sourcePath = join(sourceDir, item);
    const targetPath = join(targetDir, item);
    
    if (statSync(sourcePath).isDirectory()) {
      // Skip node_modules and dist directories
      if (item === 'node_modules' || item === 'dist') {
        continue;
      }
      copyNonTsFiles(sourcePath, targetPath);
    } else if (!sourcePath.endsWith('.ts') && !sourcePath.endsWith('.tsx')) {
      // Copy non-TypeScript files
      const targetDir = dirname(targetPath);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }
      copyFileSync(sourcePath, targetPath);
    }
  }
}

// Copy non-TypeScript files
copyNonTsFiles('./src', './dist');

// Use tsx to compile TypeScript files
console.log('Building TypeScript files...');
try {
  execSync('npx tsx --no-warnings ./scripts/compile.js', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}