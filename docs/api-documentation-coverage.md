
# 📊 API Documentation Coverage Report

## 📈 Overall Statistics
- **Total Paths**: 19
- **Total Operations**: 36
- **Documented Operations**: 36
- **Coverage**: 100%
- **Schemas**: 22
- **Security Schemes**: 4

## ✅ Validation Status
- **Valid**: ❌ No
- **Errors**: 1
- **Warnings**: 2

## ❌ Errors
1. No endpoints found for cloud-integrations feature

## ⚠️ Warnings
1. POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/refresh: Missing request body schema
2. Missing cloud-integrations endpoint: /api/v1/tenants/{tenantId}/cloud-integrations

## 🎯 Recommendations

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
*Report generated on 2025-07-17T12:32:20.061Z*
