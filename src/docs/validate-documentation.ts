/**
 * Documentation Validation Script
 * 
 * Validates that all endpoints are properly documented with schemas and examples
 */

import { openAPIService } from '../services/openapi/index.js';
import { logInfo, logError } from '../utils/logger.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalPaths: number;
    totalOperations: number;
    documentedOperations: number;
    schemasCount: number;
    securitySchemesCount: number;
  };
}

/**
 * Validate complete endpoint documentation
 */
async function validateDocumentation(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalPaths: 0,
      totalOperations: 0,
      documentedOperations: 0,
      schemasCount: 0,
      securitySchemesCount: 0
    }
  };

  try {
    logInfo('Starting comprehensive documentation validation');
    
    const document = await openAPIService.generateDocument();
    
    // Basic structure validation
    if (!document.openapi) {
      result.errors.push('Missing OpenAPI version');
      result.valid = false;
    }
    
    if (!document.info) {
      result.errors.push('Missing info section');
      result.valid = false;
    }
    
    if (!document.paths) {
      result.errors.push('Missing paths section');
      result.valid = false;
      return result;
    }

    // Count paths and operations
    result.stats.totalPaths = Object.keys(document.paths).length;
    
    for (const [path, pathItem] of Object.entries(document.paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
          result.stats.totalOperations++;
          
          // Validate operation documentation
          const op = operation as any;
          
          if (!op.summary && !op.description) {
            result.warnings.push(`${method.toUpperCase()} ${path}: Missing summary or description`);
          } else {
            result.stats.documentedOperations++;
          }
          
          if (!op.responses) {
            result.errors.push(`${method.toUpperCase()} ${path}: Missing responses`);
            result.valid = false;
          } else {
            // Check for required response codes
            if (!op.responses['200'] && !op.responses['201'] && !op.responses['204']) {
              result.warnings.push(`${method.toUpperCase()} ${path}: Missing success response (200/201/204)`);
            }
            
            if (!op.responses['401']) {
              result.warnings.push(`${method.toUpperCase()} ${path}: Missing 401 Unauthorized response`);
            }
            
            if (!op.responses['500']) {
              result.warnings.push(`${method.toUpperCase()} ${path}: Missing 500 Internal Server Error response`);
            }
          }
          
          if (!op.tags || op.tags.length === 0) {
            result.warnings.push(`${method.toUpperCase()} ${path}: Missing tags`);
          }
          
          // Validate security for protected endpoints
          if (!op.security && !document.security) {
            result.warnings.push(`${method.toUpperCase()} ${path}: No security defined (may be intentional for public endpoints)`);
          }
          
          // Validate request body for POST/PUT/PATCH
          if (['post', 'put', 'patch'].includes(method) && !op.requestBody) {
            result.warnings.push(`${method.toUpperCase()} ${path}: Missing request body schema`);
          }
          
          // Validate parameters for parameterized paths
          if (path.includes('{') && (!op.parameters || op.parameters.length === 0)) {
            result.warnings.push(`${method.toUpperCase()} ${path}: Missing path parameters documentation`);
          }
        }
      }
    }

    // Validate components
    if (document.components) {
      if (document.components.schemas) {
        result.stats.schemasCount = Object.keys(document.components.schemas).length;
        
        // Check for essential schemas
        const essentialSchemas = [
          'Tenant', 'CreateTenant', 'UpdateTenant',
          'Project', 'CreateProject', 'UpdateProject',
          'ProjectType', 'CloudProvider', 'CloudProviderIntegration',
          'SuccessResponse', 'ErrorResponse'
        ];
        
        for (const schema of essentialSchemas) {
          if (!document.components.schemas[schema]) {
            result.warnings.push(`Missing essential schema: ${schema}`);
          }
        }
      } else {
        result.errors.push('Missing schemas in components');
        result.valid = false;
      }
      
      if (document.components.securitySchemes) {
        result.stats.securitySchemesCount = Object.keys(document.components.securitySchemes).length;
        
        // Check for essential security schemes
        if (!document.components.securitySchemes.bearerAuth) {
          result.errors.push('Missing bearerAuth security scheme');
          result.valid = false;
        }
      } else {
        result.errors.push('Missing security schemes in components');
        result.valid = false;
      }
    } else {
      result.errors.push('Missing components section');
      result.valid = false;
    }

    // Feature-specific validation
    await validateFeatureDocumentation(document, result);
    
    logInfo('Documentation validation completed', {
      valid: result.valid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      stats: result.stats
    });

  } catch (error) {
    result.errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    result.valid = false;
    
    logError('Documentation validation failed', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return result;
}

/**
 * Validate feature-specific documentation requirements
 */
async function validateFeatureDocumentation(document: any, result: ValidationResult): Promise<void> {
  const features = [
    { name: 'tenants', requiredPaths: ['/api/v1/tenants', '/api/v1/tenants/me', '/api/v1/tenants/{id}'] },
    { name: 'projects', requiredPaths: ['/api/v1/projects', '/api/v1/projects/{id}'] },
    { name: 'project-types', requiredPaths: ['/api/v1/project-types', '/api/v1/project-types/{id}'] },
    { name: 'cloud-providers', requiredPaths: ['/api/v1/cloud-providers', '/api/v1/cloud-providers/{id}'] },
    { name: 'cloud-integrations', requiredPaths: ['/api/v1/tenants/{tenantId}/cloud-integrations'] },
    { name: 'users', requiredPaths: ['/api/v1/users/{userId}/roles'] },
    { name: 'oauth', requiredPaths: ['/api/v1/oauth/callback'] },
    { name: 'files', requiredPaths: ['/api/v1/projects/{projectId}/files'] }
  ];

  for (const feature of features) {
    let featurePathsFound = 0;
    
    for (const requiredPath of feature.requiredPaths) {
      // Check for exact match or pattern match
      const pathExists = Object.keys(document.paths).some(path => {
        return path === requiredPath || 
               (requiredPath.includes('{') && pathMatches(path, requiredPath));
      });
      
      if (pathExists) {
        featurePathsFound++;
      } else {
        result.warnings.push(`Missing ${feature.name} endpoint: ${requiredPath}`);
      }
    }
    
    if (featurePathsFound === 0) {
      result.errors.push(`No endpoints found for ${feature.name} feature`);
      result.valid = false;
    }
  }
}

/**
 * Check if a path matches a pattern with parameters
 */
function pathMatches(actualPath: string, patternPath: string): boolean {
  const actualParts = actualPath.split('/');
  const patternParts = patternPath.split('/');
  
  if (actualParts.length !== patternParts.length) {
    return false;
  }
  
  for (let i = 0; i < actualParts.length; i++) {
    const actualPart = actualParts[i];
    const patternPart = patternParts[i];
    
    if (patternPart.startsWith('{') && patternPart.endsWith('}')) {
      // Parameter part - matches any value
      continue;
    } else if (actualPart !== patternPart) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate documentation coverage report
 */
async function generateCoverageReport(): Promise<string> {
  const validation = await validateDocumentation();
  
  const coveragePercentage = validation.stats.totalOperations > 0 
    ? Math.round((validation.stats.documentedOperations / validation.stats.totalOperations) * 100)
    : 0;

  let report = `
# 📊 API Documentation Coverage Report

## 📈 Overall Statistics
- **Total Paths**: ${validation.stats.totalPaths}
- **Total Operations**: ${validation.stats.totalOperations}
- **Documented Operations**: ${validation.stats.documentedOperations}
- **Coverage**: ${coveragePercentage}%
- **Schemas**: ${validation.stats.schemasCount}
- **Security Schemes**: ${validation.stats.securitySchemesCount}

## ✅ Validation Status
- **Valid**: ${validation.valid ? '✅ Yes' : '❌ No'}
- **Errors**: ${validation.errors.length}
- **Warnings**: ${validation.warnings.length}

`;

  if (validation.errors.length > 0) {
    report += `## ❌ Errors\n`;
    validation.errors.forEach((error, index) => {
      report += `${index + 1}. ${error}\n`;
    });
    report += '\n';
  }

  if (validation.warnings.length > 0) {
    report += `## ⚠️ Warnings\n`;
    validation.warnings.forEach((warning, index) => {
      report += `${index + 1}. ${warning}\n`;
    });
    report += '\n';
  }

  report += `## 🎯 Recommendations

### High Priority
- Ensure all endpoints have proper error responses (401, 500)
- Add missing request body schemas for POST/PUT/PATCH operations
- Complete parameter documentation for parameterized paths

### Medium Priority
- Add summaries and descriptions for all operations
- Ensure proper tagging for all endpoints
- Add examples to schema definitions

### Low Priority
- Consider adding more detailed operation descriptions
- Add response examples for better developer experience
- Consider adding deprecation notices for legacy endpoints

---
*Report generated on ${new Date().toISOString()}*
`;

  return report;
}

/**
 * Main validation function for CLI usage
 */
async function main() {
  console.log('🔍 Validating API Documentation...\n');
  
  try {
    const validation = await validateDocumentation();
    
    console.log('📊 Validation Results:');
    console.log(`   Valid: ${validation.valid ? '✅' : '❌'}`);
    console.log(`   Errors: ${validation.errors.length}`);
    console.log(`   Warnings: ${validation.warnings.length}`);
    console.log(`   Total Operations: ${validation.stats.totalOperations}`);
    console.log(`   Documented Operations: ${validation.stats.documentedOperations}`);
    console.log(`   Coverage: ${Math.round((validation.stats.documentedOperations / validation.stats.totalOperations) * 100)}%\n`);
    
    if (validation.errors.length > 0) {
      console.log('❌ Errors:');
      validation.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log();
    }
    
    if (validation.warnings.length > 0) {
      console.log('⚠️ Warnings:');
      validation.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
      console.log();
    }
    
    // Generate and save coverage report
    const report = await generateCoverageReport();
    const fs = await import('fs');
    const path = await import('path');
    
    const reportPath = path.join(process.cwd(), 'docs', 'api-documentation-coverage.md');
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Coverage report saved to: ${reportPath}`);
    
    if (validation.valid) {
      console.log('✅ Documentation validation passed!');
      process.exit(0);
    } else {
      console.log('❌ Documentation validation failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
  }
}

// Export functions for programmatic use
export { validateDocumentation, generateCoverageReport };

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}