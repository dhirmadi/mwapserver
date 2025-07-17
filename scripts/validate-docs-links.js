#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '..', 'docs');
const configPath = path.join(__dirname, '..', '.docs-config.json');
const errors = [];
const warnings = [];

// Load configuration
let config = {
  validation: { checkLinks: true, checkStructure: true, checkDuplicates: true },
  structure: { requiredDirectories: [], requiredFiles: [] },
  quality: { maxLineLength: 120, requireHeadings: true }
};

try {
  if (fs.existsSync(configPath)) {
    config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
  }
} catch (error) {
  console.warn('⚠️  Warning: Could not load .docs-config.json, using defaults');
}

// Get all markdown files
function getAllMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Extract links from markdown content
function extractLinks(content) {
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      fullMatch: match[0]
    });
  }
  
  return links;
}

// Validate internal links
function validateInternalLink(linkUrl, sourceFile) {
  // Skip external links
  if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
    return true;
  }
  
  // Skip anchors only
  if (linkUrl.startsWith('#')) {
    return true;
  }
  
  // Handle relative paths
  let targetPath;
  if (linkUrl.startsWith('/')) {
    // Absolute path from repo root
    targetPath = path.join(__dirname, '..', linkUrl);
  } else {
    // Relative path from source file
    const sourceDir = path.dirname(sourceFile);
    targetPath = path.resolve(sourceDir, linkUrl);
  }
  
  // Remove anchor if present
  const [filePath] = targetPath.split('#');
  
  return fs.existsSync(filePath);
}

// Validate documentation structure
function validateStructure() {
  console.log('📁 Validating documentation structure...\n');
  
  // Check required directories
  for (const dir of config.structure.requiredDirectories) {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      errors.push({
        type: 'structure',
        message: `Required directory missing: ${dir}`
      });
      console.log(`  ❌ Missing directory: ${dir}`);
    } else {
      console.log(`  ✅ Directory exists: ${dir}`);
    }
  }
  
  // Check required files
  for (const file of config.structure.requiredFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) {
      errors.push({
        type: 'structure',
        message: `Required file missing: ${file}`
      });
      console.log(`  ❌ Missing file: ${file}`);
    } else {
      console.log(`  ✅ File exists: ${file}`);
    }
  }
  
  console.log('');
}

// Main validation function
function validateDocumentationLinks() {
  const markdownFiles = getAllMarkdownFiles(docsDir);
  
  console.log(`🔍 Validating links in ${markdownFiles.length} markdown files...\n`);
  
  for (const file of markdownFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const links = extractLinks(content);
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    
    console.log(`📄 ${relativePath} (${links.length} links)`);
    
    for (const link of links) {
      if (!validateInternalLink(link.url, file)) {
        errors.push({
          file: relativePath,
          link: link.fullMatch,
          url: link.url,
          text: link.text
        });
        console.log(`  ❌ Broken: ${link.fullMatch}`);
      } else if (link.url.startsWith('http')) {
        console.log(`  🌐 External: ${link.text}`);
      } else {
        console.log(`  ✅ Valid: ${link.text}`);
      }
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  
  if (errors.length === 0) {
    console.log('✅ All internal links are valid!');
  } else {
    console.log(`❌ Found ${errors.length} broken links:`);
    for (const error of errors) {
      console.log(`  - ${error.file}: ${error.link}`);
    }
  }
}

// Run validation
function runValidation() {
  console.log('🚀 Starting documentation validation...\n');
  
  // Validate structure if enabled
  if (config.validation.checkStructure) {
    validateStructure();
  }
  
  // Validate links if enabled
  if (config.validation.checkLinks) {
    validateDocumentationLinks();
  }
  
  return errors.length === 0;
}

const isValid = runValidation();
process.exit(isValid ? 0 : 1);