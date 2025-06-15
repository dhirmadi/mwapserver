#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { transformSync } from '@babel/core';
import { glob } from 'glob';

// Find all TypeScript files
const tsFiles = glob.sync('src/**/*.ts');

// Process each file
for (const file of tsFiles) {
  try {
    // Read the TypeScript file
    const source = readFileSync(file, 'utf8');
    
    // Transform TypeScript to JavaScript
    const result = transformSync(source, {
      filename: file,
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs'
      ]
    });
    
    if (!result || !result.code) {
      console.error(`Failed to transform ${file}`);
      continue;
    }
    
    // Determine the output path
    const outputPath = file.replace(/^src\//, 'dist/').replace(/\.ts$/, '.js');
    
    // Create directory if it doesn't exist
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Write the JavaScript file
    writeFileSync(outputPath, result.code);
    console.log(`Compiled: ${file} -> ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}