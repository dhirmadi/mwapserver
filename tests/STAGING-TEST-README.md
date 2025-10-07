# MWAP Staging API Test Suite

Comprehensive Python-based integration test suite for the MWAP staging API.

## 🎯 Purpose

This test suite validates the complete functionality of the MWAP API hosted on the staging server (`https://mwapss.shibari.photo/api/v1`), ensuring all endpoints are working correctly before production deployment.

## ✨ Features

- **Comprehensive Coverage**: Tests all major API endpoints
- **CRUD Operations**: Full create, read, update, delete testing
- **OAuth Flow**: Tests OAuth initiation and integration management
- **Performance Metrics**: Measures response times for all endpoints
- **Detailed Reporting**: Generates markdown reports with test results
- **Color-Coded Output**: Easy-to-read console output with status indicators

## 📋 Test Coverage

### Health & Authentication
- Health check endpoint
- JWT authentication validation
- User roles verification

### Tenant Management
- Get current user's tenant
- Update tenant details

### Project Management (Full CRUD)
- Create project
- List all projects
- Get project by ID
- Update project
- Get project members
- Get user's membership
- Delete project

### Cloud Providers
- List available providers
- Get provider details

### Cloud Integrations
- Create integration
- List integrations
- OAuth flow initiation
- Integration health check
- Delete integration

### File Operations
- List project files from cloud providers

### OpenAPI Documentation
- Validate OpenAPI specification endpoint

## 🚀 Prerequisites

### 1. Python 3.7 or higher

```bash
python3 --version
```

### 2. Install Dependencies

```bash
# Navigate to tests directory
cd tests

# Install Python dependencies
pip3 install -r requirements.txt
```

### 3. Get Auth0 Token

You need a valid Auth0 JWT token to run the tests:

**Option A: From Auth0 Dashboard**
1. Go to Auth0 Dashboard
2. Navigate to your application
3. Get a test token for the staging environment

**Option B: From API Documentation** (if authentication is set up)
1. Visit: `https://mwapss.shibari.photo/api/v1/docs`
2. Authenticate with Auth0
3. Copy the JWT token

**Option C: From Frontend Application**
1. Log into your frontend application
2. Open browser DevTools > Application > Local Storage
3. Copy the JWT token

## 🏃 Running the Tests

### Basic Usage

```bash
# Navigate to tests directory
cd tests

# Run the test script
python3 staging-api-test.py
```

### What Happens

1. **Prompt for Token**: Script will ask you to paste your Auth0 JWT token
2. **Run Tests**: Executes all test cases sequentially
3. **Display Results**: Shows real-time pass/fail status with colors
4. **Generate Report**: Creates a detailed markdown report in `docs/09-Reports-and-History/`

### Example Run

```bash
$ python3 staging-api-test.py

╔══════════════════════════════════════════════════════════╗
║           MWAP STAGING API TEST SUITE                    ║
╚══════════════════════════════════════════════════════════╝

Please enter your Auth0 JWT token:
(Get it from: https://mwapss.shibari.photo/api/v1/docs or Auth0 Dashboard)
Token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

API Base URL: https://mwapss.shibari.photo/api/v1
Test Started: 2024-10-02 10:30:15

============================================================
 Health & Connectivity Tests 
============================================================
✓ Health Check (0.45s)
  API is healthy - Status: 200
✓ JWT Authentication (0.32s)
  Authentication successful - User has 2 role(s)

============================================================
 Tenant Management Tests 
============================================================
✓ Get My Tenant (0.28s)
  Retrieved tenant: My Tenant (ID: 507f1f77bcf86cd799439011)
✓ Update Tenant (0.35s)
  Tenant updated successfully

...

============================================================
 TEST SUMMARY 
============================================================

Passed: 22/24
Failed: 2/24
Total Time: 8.45s
Average Response Time: 0.35s

Success Rate: 91.7%
✓ API is functioning well!

✓ Report saved to: docs/09-Reports-and-History/staging-api-test-report-20241002_103024.md
```

## 📊 Understanding Results

### Console Output

- **Green ✓**: Test passed
- **Red ✗**: Test failed
- **Cyan (time)**: Response time in seconds
- **Yellow**: Additional information/warnings

### Exit Codes

- `0`: Success (≥70% tests passed)
- `1`: Failure (<70% tests passed)
- `130`: Interrupted by user (Ctrl+C)

### Generated Report

The script generates a detailed markdown report containing:

- **Summary Statistics**: Pass/fail counts, success rate
- **Detailed Results**: Individual test outcomes with response times
- **Performance Metrics**: Average response times by category
- **Test Data**: IDs of created resources
- **Recommendations**: Next steps based on results

Reports are saved to: `docs/09-Reports-and-History/staging-api-test-report-YYYYMMDD_HHMMSS.md`

## 🔧 Test Configuration

### Modifying Base URL

Edit the script to change the API base URL:

```python
# In staging-api-test.py
API_BASE_URL = "https://your-api-url.com/api/v1"
```

### Adjusting Timeout

```python
# In staging-api-test.py
TEST_TIMEOUT = 30  # seconds
```

## 🐛 Troubleshooting

### "Token is required" Error

- Make sure you paste the complete JWT token
- Token should start with `eyJ...`
- Don't include quotes or extra whitespace

### "Authentication failed" Error

- Token may be expired (tokens typically expire after 24 hours)
- Get a fresh token from Auth0
- Verify the token is for the correct environment (staging)

### Connection Errors

- Verify the staging server is running: `https://mwapss.shibari.photo/api/v1/health`
- Check your network connection
- Ensure firewall/VPN isn't blocking requests

### Import Errors

```bash
# Install dependencies again
pip3 install -r requirements.txt

# Or install individually
pip3 install requests colorama
```

## 📝 Test Data Cleanup

The script automatically cleans up test data:

- **Projects**: Created test projects are deleted at the end
- **Integrations**: Created integrations are removed
- **Tenants**: Existing tenant is only updated, not created/deleted

If a test is interrupted, you may need to manually clean up:

1. Log into the application
2. Navigate to Projects
3. Delete any projects starting with "Test Project"
4. Navigate to Integrations
5. Remove any test integrations

## 🔄 Integration with CI/CD

### GitHub Actions Example

```yaml
name: Staging API Tests

on:
  push:
    branches: [staging]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          cd tests
          pip install -r requirements.txt
      
      - name: Run staging tests
        env:
          AUTH0_TOKEN: ${{ secrets.STAGING_AUTH0_TOKEN }}
        run: |
          cd tests
          echo "$AUTH0_TOKEN" | python3 staging-api-test.py
      
      - name: Upload test report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-report
          path: docs/09-Reports-and-History/staging-api-test-report-*.md
```

## 📖 Related Documentation

- **[API Reference](../docs/04-Backend/api-reference.md)** - Complete API documentation
- **[API Quick Reference](../docs/04-Backend/api-quickreference.md)** - Quick endpoint reference
- **[OAuth Integration Guide](../docs/06-Guides/oauth-integration-guide.md)** - OAuth flow details
- **[Testing Guide](../docs/06-Guides/testing-guide.md)** - Overall testing strategy

## 🤝 Contributing

To add new tests:

1. Add a new test method to the `APITester` class
2. Follow the naming convention: `test_<feature>_<action>`
3. Call the test method in `run_all_tests()`
4. Log results using `self._log_test()`

Example:

```python
def test_new_feature(self):
    """Test new feature"""
    response, duration = self._make_request("GET", "/new-endpoint")
    
    if response and response.status_code == 200:
        self._log_test(
            "New Feature Test",
            True,
            "Feature works correctly",
            duration
        )
    else:
        self._log_test(
            "New Feature Test",
            False,
            "Feature failed",
            duration
        )
```

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the generated test report for details
3. Check API logs on the staging server
4. Contact the development team

---

**Last Updated:** 2024-10-02  
**Script Version:** 1.0  
**Maintainer:** MWAP Development Team


