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
        ['@babel/preset-env', { targets: { node: 'current' }, modules: false }],
        '@babel/preset-typescript'
      ],
      // Don't transform ES modules to CommonJS
      // plugins: [
      //   '@babel/plugin-transform-modules-commonjs'
      // ]
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
    
    // Fix import paths by adding .js extension
    let code = result.code;
    code = code.replace(/from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
      // Skip external modules
      if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
        return match;
      }
      
      // Skip imports that already have an extension
      if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
        return match;
      }
      
      // Add .js extension
      return `from '${importPath}.js'`;
    });
    
    // Write the JavaScript file
    writeFileSync(outputPath, code);
    console.log(`Compiled: ${file} -> ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}