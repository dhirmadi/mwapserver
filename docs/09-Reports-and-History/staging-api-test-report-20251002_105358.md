# MWAP Staging API Test Report

**Test Date:** 2025-10-02 10:53:58  
**API Base URL:** https://mwapss.shibari.photo/api/v1  
**Total Tests:** 20  
**Passed:** 4  
**Failed:** 16  
**Success Rate:** 20.0%  
**Total Time:** 11.10s  
**Average Response Time:** 0.56s

---

## 📊 Test Results Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Passed | 4 | 20.0% |
| ❌ Failed | 16 | 80.0% |

---

## 🎯 Overall Assessment

❌ **CRITICAL** - API has significant issues requiring immediate attention.

---

## 📋 Detailed Test Results


### Health & Authentication

#### Health Check

- **Status:** ❌ FAILED
- **Response Time:** 9.91s
- **Message:** Health check failed - Status: No Response

#### JWT Authentication

- **Status:** ✅ PASSED
- **Response Time:** 0.33s
- **Message:** Authentication successful - User has 0 role(s)
- **Details:**
  - roles: `[]`


### Tenant Management

#### Get My Tenant

- **Status:** ❌ FAILED
- **Response Time:** 0.13s
- **Message:** Failed to get tenant - Status: No Response

#### Update Tenant

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: No tenant ID available


### Project Management

#### Create Project

- **Status:** ❌ FAILED
- **Response Time:** 0.12s
- **Message:** Failed to create project - Status: No Response - 

#### List Projects

- **Status:** ✅ PASSED
- **Response Time:** 0.14s
- **Message:** Retrieved 0 project(s)
- **Details:**
  - project_count: `0`

#### Get Project

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: No project ID available

#### Update Project

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: No project ID available

#### Get Project Members

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: No project ID available

#### Get My Membership

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: No project ID available


### Cloud Providers

#### List Cloud Providers

- **Status:** ✅ PASSED
- **Response Time:** 0.14s
- **Message:** Retrieved 1 cloud provider(s)
- **Details:**
  - providers: `[
  "Dropbox"
]`

#### Get Cloud Provider

- **Status:** ✅ PASSED
- **Response Time:** 0.14s
- **Message:** Retrieved provider: Dropbox
- **Details:**
  - provider: `{
  "_id": "68550f580c60d54d0eaf4373",
  "name": "Dropbox",
  "slug": "dropbox",
  "scopes": [
    "files.content.read",
    "files.content.write",
    "files.metadata.read",
    "files.metadata.write`


### Cloud Integrations & OAuth

#### Create Integration

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: Missing tenant or provider ID

#### List Integrations

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: No tenant ID available

#### OAuth Initiation

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: Missing tenant or integration ID


### Health & Authentication

#### Integration Health

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: Missing tenant or integration ID


### Project Management

#### List Project Files

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: No project ID available


### OpenAPI Documentation

#### OpenAPI Specification

- **Status:** ❌ FAILED
- **Response Time:** 0.19s
- **Message:** OpenAPI spec retrieved - Version: N/A
- **Details:**
  - openapi_version: `None`
  - path_count: `0`
  - title: `None`


### Cloud Integrations & OAuth

#### Delete Integration

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: Missing tenant or integration ID


### Project Management

#### Delete Project

- **Status:** ❌ FAILED
- **Response Time:** 0.00s
- **Message:** Skipped: No project ID available

---

## 🔑 Test Data Created

| Resource | ID |
|----------|----|
| tenant_id | `Not Created` |
| project_id | `Not Created` |
| integration_id | `Not Created` |
| cloud_provider_id | `68550f580c60d54d0eaf4373` |

---

## ⚡ Performance Metrics

| Test Category | Avg Response Time |
|---------------|-------------------|
| Health & Authentication | 3.42s |
| Tenant Management | 0.07s |
| Project Management | 0.03s |
| Cloud Providers | 0.14s |
| Cloud Integrations & OAuth | 0.00s |
| OpenAPI Documentation | 0.19s |

---

## 💡 Recommendations

### Failed Tests

- **Health Check**: Health check failed - Status: No Response
- **Get My Tenant**: Failed to get tenant - Status: No Response
- **Update Tenant**: Skipped: No tenant ID available
- **Create Project**: Failed to create project - Status: No Response - 
- **Get Project**: Skipped: No project ID available
- **Update Project**: Skipped: No project ID available
- **Get Project Members**: Skipped: No project ID available
- **Get My Membership**: Skipped: No project ID available
- **Create Integration**: Skipped: Missing tenant or provider ID
- **List Integrations**: Skipped: No tenant ID available
- **OAuth Initiation**: Skipped: Missing tenant or integration ID
- **Integration Health**: Skipped: Missing tenant or integration ID
- **List Project Files**: Skipped: No project ID available
- **OpenAPI Specification**: OpenAPI spec retrieved - Version: N/A
- **Delete Integration**: Skipped: Missing tenant or integration ID
- **Delete Project**: Skipped: No project ID available

### Slow Endpoints (>2s)

- **Health Check**: 9.91s

### Next Steps

- ⚠️ Fix failing tests before production deployment
- Review error logs for failed endpoints
- Re-run tests after fixes

---

*Report generated by automated test script*  
*Timestamp: 2025-10-02T10:53:58.599123*
