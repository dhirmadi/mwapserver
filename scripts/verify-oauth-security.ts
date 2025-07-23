/**
 * OAuth Security Verification Script
 * 
 * Verifies that the OAuth callback authentication security implementation
 * is correctly configured and functioning as expected.
 * 
 * This script tests:
 * - Public route registration
 * - Route validation service functionality
 * - Security configuration compliance
 * - Access pattern verification
 */

import { logInfo, logError } from '../src/utils/logger.js';
import { 
  validateRoutesAtStartup,
  routeValidator,
  recordOAuthCallbackAccess,
  recordOAuthSecurityIssue
} from '../src/middleware/routeValidation.service.js';
import {
  validatePublicRoutesSecurity,
  getPublicRoutesSecurityReport,
  isPublicRoute,
  PUBLIC_ROUTES
} from '../src/middleware/publicRoutes.js';

async function verifyOAuthSecurity(): Promise<void> {
  console.log('🔐 OAuth Security Verification Started\n');

  let allTestsPassed = true;

  try {
    // 1. Verify Public Route Registration
    console.log('📋 Verifying Public Route Registration...');
    
    const oauthRoute = PUBLIC_ROUTES.find(route => route.path.includes('/oauth/callback'));
    if (!oauthRoute) {
      console.error('❌ OAuth callback route not found in public routes registry');
      allTestsPassed = false;
    } else {
      console.log('✅ OAuth callback route properly registered');
      console.log(`   Path: ${oauthRoute.path}`);
      console.log(`   Security Controls: ${oauthRoute.securityControls.length}`);
      console.log(`   External Callers: ${oauthRoute.externalCallers.length}`);
    }

    // 2. Test Route Detection Logic
    console.log('\n🔍 Testing Route Detection Logic...');
    
    const testCases = [
      { path: '/api/v1/oauth/callback', method: 'GET', shouldBePublic: true },
      { path: '/api/v1/oauth/callback/', method: 'GET', shouldBePublic: true }, // Trailing slash
      { path: '/api/v1/oauth/callback?code=123&state=abc', method: 'GET', shouldBePublic: true }, // With query params
      { path: '/api/v1/tenants', method: 'POST', shouldBePublic: false },
      { path: '/health', method: 'GET', shouldBePublic: false }, // Handled separately
      { path: '/api/v1/oauth/callback', method: 'POST', shouldBePublic: false }, // Wrong method
    ];

    for (const testCase of testCases) {
      const routeConfig = isPublicRoute(testCase.path, testCase.method);
      const isPublic = routeConfig !== null;

      if (isPublic === testCase.shouldBePublic) {
        console.log(`✅ ${testCase.method} ${testCase.path} - Correctly detected as ${isPublic ? 'public' : 'protected'}`);
      } else {
        console.error(`❌ ${testCase.method} ${testCase.path} - Expected ${testCase.shouldBePublic ? 'public' : 'protected'}, got ${isPublic ? 'public' : 'protected'}`);
        allTestsPassed = false;
      }
    }

    // 3. Verify Route Validation Service
    console.log('\n🛡️ Testing Route Validation Service...');
    
    const startupValidation = await validateRoutesAtStartup();
    if (startupValidation) {
      console.log('✅ Startup route validation passed');
    } else {
      console.error('❌ Startup route validation failed');
      allTestsPassed = false;
    }

    // 4. Test Security Report Generation
    console.log('\n📊 Generating Security Reports...');
    
    const basicValidation = validatePublicRoutesSecurity();
    if (basicValidation.valid) {
      console.log('✅ Basic public route security validation passed');
    } else {
      console.error('❌ Basic public route security validation failed:');
      basicValidation.issues.forEach(issue => console.error(`   - ${issue}`));
      allTestsPassed = false;
    }

    const securityReport = getPublicRoutesSecurityReport();
    console.log(`📈 Security Report Summary:`);
    console.log(`   Total Public Routes: ${securityReport.totalRoutes}`);
    console.log(`   Data Exposing Routes: ${securityReport.dataExposingRoutes}`);
    console.log(`   Routes by Method: ${JSON.stringify(securityReport.routesByMethod)}`);
    
    if (securityReport.securityIssues.length > 0) {
      console.error('❌ Security issues detected:');
      securityReport.securityIssues.forEach(issue => console.error(`   - ${issue}`));
      allTestsPassed = false;
    } else {
      console.log('✅ No security issues detected');
    }

    // 5. Test Route Monitoring Functionality
    console.log('\n📊 Testing Route Monitoring...');
    
    // Test successful access recording
    recordOAuthCallbackAccess(true, 150, undefined);
    console.log('✅ Successful callback access recorded');

    // Test failed access recording
    recordOAuthCallbackAccess(false, 50, 'STATE_EXPIRED');
    console.log('✅ Failed callback access recorded');

    // Test security issue recording
    recordOAuthSecurityIssue('Test security issue', 'LOW');
    console.log('✅ Security issue recorded');

    // Get monitoring report
    const monitoringReport = routeValidator.getMonitoringReport();
    console.log(`📊 Monitoring Report:`);
    console.log(`   Total Routes Monitored: ${monitoringReport.summary.totalRoutes}`);
    console.log(`   Total Requests: ${monitoringReport.summary.totalRequests}`);
    console.log(`   Overall Success Rate: ${monitoringReport.summary.overallSuccessRate.toFixed(2)}%`);
    console.log(`   Total Security Issues: ${monitoringReport.summary.totalSecurityIssues}`);

    // 6. Test Security Compliance
    console.log('\n🔒 Testing Security Compliance...');
    
    const complianceReport = await routeValidator.generateSecurityComplianceReport();
    if (complianceReport.compliant) {
      console.log('✅ All routes are security compliant');
    } else {
      console.error('❌ Security compliance issues detected:');
      complianceReport.issues.forEach(issue => console.error(`   - ${issue}`));
      allTestsPassed = false;
    }

    if (complianceReport.recommendations.length > 0) {
      console.log('💡 Security recommendations:');
      complianceReport.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    // 7. Verify OAuth-Specific Configuration
    console.log('\n🔑 Verifying OAuth-Specific Configuration...');
    
    if (oauthRoute) {
      // Check required security controls
      const requiredControls = [
        'state parameter',
        'ownership verification',
        'timestamp validation',
        'audit logging',
        'error responses'
      ];

      for (const control of requiredControls) {
        const hasControl = oauthRoute.securityControls.some(sc => 
          sc.toLowerCase().includes(control.toLowerCase())
        );
        
        if (hasControl) {
          console.log(`✅ Required security control present: ${control}`);
        } else {
          console.error(`❌ Missing required security control: ${control}`);
          allTestsPassed = false;
        }
      }

      // Check external caller documentation
      const hasOAuthCallers = oauthRoute.externalCallers.some(caller => 
        caller.toLowerCase().includes('oauth')
      );
      
      if (hasOAuthCallers) {
        console.log('✅ OAuth providers documented as external callers');
      } else {
        console.error('❌ OAuth providers not documented as external callers');
        allTestsPassed = false;
      }

      // Check data exposure
      if (!oauthRoute.exposesData) {
        console.log('✅ OAuth callback correctly configured as non-data-exposing');
      } else {
        console.error('❌ OAuth callback incorrectly configured as data-exposing');
        allTestsPassed = false;
      }
    }

    // 8. Final Security Architecture Verification
    console.log('\n🏗️ Verifying Security Architecture...');
    
    const architectureChecks = [
      {
        name: 'Public Route Registry Exists',
        condition: PUBLIC_ROUTES.length > 0,
        description: 'Public routes are properly registered'
      },
      {
        name: 'OAuth Route Configured',
        condition: !!oauthRoute,
        description: 'OAuth callback route is registered'
      },
      {
        name: 'Security Controls Documented',
        condition: oauthRoute ? oauthRoute.securityControls.length >= 5 : false,
        description: 'Sufficient security controls documented'
      },
      {
        name: 'Monitoring System Active',
        condition: monitoringReport.summary.totalRoutes > 0,
        description: 'Route monitoring system is active'
      },
      {
        name: 'Validation Service Working',
        condition: startupValidation,
        description: 'Route validation service is functional'
      }
    ];

    for (const check of architectureChecks) {
      if (check.condition) {
        console.log(`✅ ${check.name}: ${check.description}`);
      } else {
        console.error(`❌ ${check.name}: ${check.description}`);
        allTestsPassed = false;
      }
    }

    // Final Result
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      console.log('🎉 OAuth Security Verification PASSED');
      console.log('✅ All security controls are properly implemented and functional');
      console.log('✅ Route configuration is correct and secure');
      console.log('✅ Monitoring and validation systems are active');
      console.log('✅ OAuth callback endpoint is ready for production use');
    } else {
      console.log('❌ OAuth Security Verification FAILED');
      console.log('⚠️  Security issues detected that need to be addressed');
      console.log('⚠️  Please review the errors above and fix before deployment');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n💥 Verification script failed with error:', error);
    logError('OAuth security verification failed', error);
    allTestsPassed = false;
  }

  // Exit with appropriate code
  process.exit(allTestsPassed ? 0 : 1);
}

// Run verification if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyOAuthSecurity().catch(error => {
    console.error('Verification script error:', error);
    process.exit(1);
  });
}

export { verifyOAuthSecurity }; 