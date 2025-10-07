#!/usr/bin/env python3
"""
MWAP Staging API Integration Test Suite

This script performs comprehensive integration testing of the MWAP API
hosted on the staging server (https://mwapss.shibari.photo/api/v1).

Usage:
    python staging-api-test.py

The script will:
1. Prompt for Auth0 JWT token
2. Test all major API endpoints (CRUD operations)
3. Test OAuth flow (with mock data where applicable)
4. Generate a detailed test report

Requirements:
    pip install requests colorama
"""

import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import requests
from colorama import init, Fore, Style, Back

# Initialize colorama for cross-platform colored output
init(autoreset=True)

# Configuration
API_BASE_URL = "https://mwapss.shibari.photo/api/v1"
REPORT_DIR = "docs/09-Reports-and-History"
TEST_TIMEOUT = 30  # seconds


class TestResult:
    """Represents the result of a single test"""
    
    def __init__(self, name: str, passed: bool, message: str = "", 
                 response_time: float = 0, details: Dict = None):
        self.name = name
        self.passed = passed
        self.message = message
        self.response_time = response_time
        self.details = details or {}
        self.timestamp = datetime.now()


class APITester:
    """Main test runner for MWAP Staging API"""
    
    def __init__(self, token: str):
        self.token = token
        self.base_url = API_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        self.results: List[TestResult] = []
        self.test_data = {
            "tenant_id": None,
            "project_id": None,
            "integration_id": None,
            "cloud_provider_id": None
        }
    
    def _make_request(self, method: str, endpoint: str, 
                      data: Dict = None, params: Dict = None,
                      use_auth: bool = True) -> Tuple[Optional[requests.Response], float]:
        """Make HTTP request with timing"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers if use_auth else {"Content-Type": "application/json"}
        
        start_time = datetime.now()
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params,
                timeout=TEST_TIMEOUT
            )
            duration = (datetime.now() - start_time).total_seconds()
            return response, duration
        except requests.exceptions.RequestException as e:
            duration = (datetime.now() - start_time).total_seconds()
            print(f"{Fore.RED}✗ Request failed: {e}")
            return None, duration
    
    def _log_test(self, name: str, passed: bool, message: str = "", 
                  response_time: float = 0, details: Dict = None):
        """Log a test result"""
        result = TestResult(name, passed, message, response_time, details)
        self.results.append(result)
        
        status = f"{Fore.GREEN}✓" if passed else f"{Fore.RED}✗"
        time_info = f"{Fore.CYAN}({response_time:.2f}s)" if response_time > 0 else ""
        print(f"{status} {name} {time_info}")
        if message:
            print(f"  {Fore.YELLOW}{message}")
    
    def print_section(self, title: str):
        """Print a section header"""
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"{Fore.CYAN}{Back.BLUE} {title} ")
        print(f"{Fore.CYAN}{'='*60}")
    
    # ==================== Health & Connectivity Tests ====================
    
    def test_health_endpoint(self):
        """Test public health check endpoint"""
        self.print_section("Health & Connectivity Tests")
        
        response, duration = self._make_request("GET", "/health", use_auth=False)
        
        if response and response.status_code == 200:
            self._log_test(
                "Health Check",
                True,
                f"API is healthy - Status: {response.status_code}",
                duration,
                {"status_code": response.status_code}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Health Check",
                False,
                f"Health check failed - Status: {status}",
                duration
            )
    
    def test_authentication(self):
        """Test JWT authentication"""
        response, duration = self._make_request("GET", "/users/me/roles")
        
        if response and response.status_code == 200:
            data = response.json()
            self._log_test(
                "JWT Authentication",
                True,
                f"Authentication successful - User has {len(data.get('data', {}).get('roles', []))} role(s)",
                duration,
                {"roles": data.get('data', {}).get('roles', [])}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "JWT Authentication",
                False,
                f"Authentication failed - Status: {status}",
                duration
            )
    
    # ==================== Tenant Tests ====================
    
    def test_get_my_tenant(self):
        """Test getting current user's tenant"""
        self.print_section("Tenant Management Tests")
        
        response, duration = self._make_request("GET", "/tenants/me")
        
        if response and response.status_code == 200:
            data = response.json()
            tenant = data.get('data', {})
            self.test_data['tenant_id'] = tenant.get('_id')
            
            self._log_test(
                "Get My Tenant",
                True,
                f"Retrieved tenant: {tenant.get('name', 'N/A')} (ID: {self.test_data['tenant_id']})",
                duration,
                {"tenant": tenant}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Get My Tenant",
                False,
                f"Failed to get tenant - Status: {status}",
                duration
            )
    
    def test_update_tenant(self):
        """Test updating tenant details"""
        if not self.test_data['tenant_id']:
            self._log_test("Update Tenant", False, "Skipped: No tenant ID available")
            return
        
        update_data = {
            "description": f"Updated by test script at {datetime.now().isoformat()}"
        }
        
        response, duration = self._make_request(
            "PATCH",
            f"/tenants/{self.test_data['tenant_id']}",
            data=update_data
        )
        
        if response and response.status_code == 200:
            self._log_test(
                "Update Tenant",
                True,
                "Tenant updated successfully",
                duration
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Update Tenant",
                False,
                f"Update failed - Status: {status}",
                duration
            )
    
    # ==================== Project Tests ====================
    
    def test_create_project(self):
        """Test creating a new project"""
        self.print_section("Project CRUD Tests")
        
        project_data = {
            "name": f"Test Project {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "description": "Created by automated test script",
            "status": "active"
        }
        
        response, duration = self._make_request("POST", "/projects", data=project_data)
        
        if response and response.status_code == 201:
            data = response.json()
            project = data.get('data', {})
            self.test_data['project_id'] = project.get('_id')
            
            self._log_test(
                "Create Project",
                True,
                f"Project created: {project.get('name')} (ID: {self.test_data['project_id']})",
                duration,
                {"project": project}
            )
        else:
            status = response.status_code if response else "No Response"
            message = ""
            if response:
                try:
                    error_data = response.json()
                    message = error_data.get('error', {}).get('message', '')
                except:
                    pass
            
            self._log_test(
                "Create Project",
                False,
                f"Failed to create project - Status: {status} - {message}",
                duration
            )
    
    def test_list_projects(self):
        """Test listing accessible projects"""
        response, duration = self._make_request("GET", "/projects")
        
        if response and response.status_code == 200:
            data = response.json()
            projects = data.get('data', [])
            
            self._log_test(
                "List Projects",
                True,
                f"Retrieved {len(projects)} project(s)",
                duration,
                {"project_count": len(projects)}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "List Projects",
                False,
                f"Failed to list projects - Status: {status}",
                duration
            )
    
    def test_get_project(self):
        """Test getting project by ID"""
        if not self.test_data['project_id']:
            self._log_test("Get Project", False, "Skipped: No project ID available")
            return
        
        response, duration = self._make_request(
            "GET",
            f"/projects/{self.test_data['project_id']}"
        )
        
        if response and response.status_code == 200:
            data = response.json()
            project = data.get('data', {})
            
            self._log_test(
                "Get Project",
                True,
                f"Retrieved project: {project.get('name')}",
                duration,
                {"project": project}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Get Project",
                False,
                f"Failed to get project - Status: {status}",
                duration
            )
    
    def test_update_project(self):
        """Test updating project details"""
        if not self.test_data['project_id']:
            self._log_test("Update Project", False, "Skipped: No project ID available")
            return
        
        update_data = {
            "description": f"Updated by test script at {datetime.now().isoformat()}"
        }
        
        response, duration = self._make_request(
            "PATCH",
            f"/projects/{self.test_data['project_id']}",
            data=update_data
        )
        
        if response and response.status_code == 200:
            self._log_test(
                "Update Project",
                True,
                "Project updated successfully",
                duration
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Update Project",
                False,
                f"Update failed - Status: {status}",
                duration
            )
    
    def test_get_project_members(self):
        """Test getting project members"""
        if not self.test_data['project_id']:
            self._log_test("Get Project Members", False, "Skipped: No project ID available")
            return
        
        response, duration = self._make_request(
            "GET",
            f"/projects/{self.test_data['project_id']}/members"
        )
        
        if response and response.status_code == 200:
            data = response.json()
            members = data.get('data', [])
            
            self._log_test(
                "Get Project Members",
                True,
                f"Retrieved {len(members)} member(s)",
                duration,
                {"member_count": len(members)}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Get Project Members",
                False,
                f"Failed to get members - Status: {status}",
                duration
            )
    
    def test_get_my_membership(self):
        """Test getting my membership in project"""
        if not self.test_data['project_id']:
            self._log_test("Get My Membership", False, "Skipped: No project ID available")
            return
        
        response, duration = self._make_request(
            "GET",
            f"/projects/{self.test_data['project_id']}/members/me"
        )
        
        if response and response.status_code == 200:
            data = response.json()
            membership = data.get('data', {})
            
            self._log_test(
                "Get My Membership",
                True,
                f"My role: {membership.get('role', 'N/A')}",
                duration,
                {"membership": membership}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Get My Membership",
                False,
                f"Failed to get membership - Status: {status}",
                duration
            )
    
    # ==================== Cloud Provider Tests ====================
    
    def test_list_cloud_providers(self):
        """Test listing available cloud providers"""
        self.print_section("Cloud Provider Tests")
        
        response, duration = self._make_request("GET", "/cloud-providers")
        
        if response and response.status_code == 200:
            data = response.json()
            providers = data.get('data', [])
            
            if providers:
                self.test_data['cloud_provider_id'] = providers[0].get('_id')
            
            self._log_test(
                "List Cloud Providers",
                True,
                f"Retrieved {len(providers)} cloud provider(s)",
                duration,
                {"providers": [p.get('name') for p in providers]}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "List Cloud Providers",
                False,
                f"Failed to list providers - Status: {status}",
                duration
            )
    
    def test_get_cloud_provider(self):
        """Test getting cloud provider by ID"""
        if not self.test_data['cloud_provider_id']:
            self._log_test("Get Cloud Provider", False, "Skipped: No provider ID available")
            return
        
        response, duration = self._make_request(
            "GET",
            f"/cloud-providers/{self.test_data['cloud_provider_id']}"
        )
        
        if response and response.status_code == 200:
            data = response.json()
            provider = data.get('data', {})
            
            self._log_test(
                "Get Cloud Provider",
                True,
                f"Retrieved provider: {provider.get('name')}",
                duration,
                {"provider": provider}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Get Cloud Provider",
                False,
                f"Failed to get provider - Status: {status}",
                duration
            )
    
    # ==================== Cloud Integration Tests ====================
    
    def test_create_integration(self):
        """Test creating a cloud integration"""
        self.print_section("Cloud Integration Tests")
        
        if not self.test_data['tenant_id'] or not self.test_data['cloud_provider_id']:
            self._log_test("Create Integration", False, 
                          "Skipped: Missing tenant or provider ID")
            return
        
        integration_data = {
            "providerId": self.test_data['cloud_provider_id'],
            "status": "active"
        }
        
        response, duration = self._make_request(
            "POST",
            f"/tenants/{self.test_data['tenant_id']}/integrations",
            data=integration_data
        )
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            integration = data.get('data', {})
            self.test_data['integration_id'] = integration.get('_id')
            
            self._log_test(
                "Create Integration",
                True,
                f"Integration created (ID: {self.test_data['integration_id']})",
                duration,
                {"integration": integration}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Create Integration",
                False,
                f"Failed to create integration - Status: {status}",
                duration
            )
    
    def test_list_integrations(self):
        """Test listing tenant integrations"""
        if not self.test_data['tenant_id']:
            self._log_test("List Integrations", False, "Skipped: No tenant ID available")
            return
        
        response, duration = self._make_request(
            "GET",
            f"/tenants/{self.test_data['tenant_id']}/integrations"
        )
        
        if response and response.status_code == 200:
            data = response.json()
            integrations = data.get('data', [])
            
            self._log_test(
                "List Integrations",
                True,
                f"Retrieved {len(integrations)} integration(s)",
                duration,
                {"integration_count": len(integrations)}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "List Integrations",
                False,
                f"Failed to list integrations - Status: {status}",
                duration
            )
    
    def test_oauth_initiation(self):
        """Test OAuth flow initiation (without completing OAuth)"""
        if not self.test_data['tenant_id'] or not self.test_data['integration_id']:
            self._log_test("OAuth Initiation", False, 
                          "Skipped: Missing tenant or integration ID")
            return
        
        response, duration = self._make_request(
            "POST",
            f"/oauth/tenants/{self.test_data['tenant_id']}/integrations/{self.test_data['integration_id']}/initiate"
        )
        
        if response and response.status_code == 200:
            data = response.json()
            oauth_data = data.get('data', {})
            
            has_url = 'authorizationUrl' in oauth_data
            has_state = 'state' in oauth_data
            has_provider = 'provider' in oauth_data
            
            self._log_test(
                "OAuth Initiation",
                has_url and has_state and has_provider,
                f"OAuth URL generated - Provider: {oauth_data.get('provider', {}).get('name', 'N/A')}",
                duration,
                {
                    "has_authorization_url": has_url,
                    "has_state": has_state,
                    "has_provider": has_provider,
                    "provider": oauth_data.get('provider', {}).get('name')
                }
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "OAuth Initiation",
                False,
                f"Failed to initiate OAuth - Status: {status}",
                duration
            )
    
    def test_integration_health(self):
        """Test integration health check"""
        if not self.test_data['tenant_id'] or not self.test_data['integration_id']:
            self._log_test("Integration Health", False, 
                          "Skipped: Missing tenant or integration ID")
            return
        
        response, duration = self._make_request(
            "GET",
            f"/tenants/{self.test_data['tenant_id']}/integrations/{self.test_data['integration_id']}/health"
        )
        
        if response and response.status_code == 200:
            data = response.json()
            health = data.get('data', {})
            
            self._log_test(
                "Integration Health",
                True,
                f"Health status: {'healthy' if health.get('healthy') else 'unhealthy'}",
                duration,
                {"health": health}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Integration Health",
                False,
                f"Failed to check health - Status: {status}",
                duration
            )
    
    # ==================== File Operations Tests ====================
    
    def test_list_project_files(self):
        """Test listing project files"""
        self.print_section("File Operations Tests")
        
        if not self.test_data['project_id']:
            self._log_test("List Project Files", False, "Skipped: No project ID available")
            return
        
        response, duration = self._make_request(
            "GET",
            f"/projects/{self.test_data['project_id']}/files"
        )
        
        if response and response.status_code in [200, 404]:
            # 404 is acceptable if no cloud integrations are set up yet
            data = response.json() if response.status_code == 200 else {}
            files = data.get('data', [])
            
            self._log_test(
                "List Project Files",
                True,
                f"Retrieved {len(files)} file(s) - Status: {response.status_code}",
                duration,
                {"file_count": len(files), "status": response.status_code}
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "List Project Files",
                False,
                f"Failed to list files - Status: {status}",
                duration
            )
    
    # ==================== OpenAPI Tests ====================
    
    def test_openapi_spec(self):
        """Test OpenAPI specification endpoint"""
        self.print_section("OpenAPI Tests")
        
        response, duration = self._make_request("GET", "/openapi", params={"format": "json"})
        
        if response and response.status_code == 200:
            try:
                spec = response.json()
                has_openapi = 'openapi' in spec
                has_paths = 'paths' in spec
                has_info = 'info' in spec
                
                self._log_test(
                    "OpenAPI Specification",
                    has_openapi and has_paths and has_info,
                    f"OpenAPI spec retrieved - Version: {spec.get('openapi', 'N/A')}",
                    duration,
                    {
                        "openapi_version": spec.get('openapi'),
                        "path_count": len(spec.get('paths', {})),
                        "title": spec.get('info', {}).get('title')
                    }
                )
            except json.JSONDecodeError:
                self._log_test(
                    "OpenAPI Specification",
                    False,
                    "Failed to parse OpenAPI spec",
                    duration
                )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "OpenAPI Specification",
                False,
                f"Failed to get OpenAPI spec - Status: {status}",
                duration
            )
    
    # ==================== Cleanup Tests ====================
    
    def test_delete_integration(self):
        """Test deleting integration"""
        self.print_section("Cleanup Tests")
        
        if not self.test_data['tenant_id'] or not self.test_data['integration_id']:
            self._log_test("Delete Integration", False, 
                          "Skipped: Missing tenant or integration ID")
            return
        
        response, duration = self._make_request(
            "DELETE",
            f"/tenants/{self.test_data['tenant_id']}/integrations/{self.test_data['integration_id']}"
        )
        
        if response and response.status_code in [200, 204]:
            self._log_test(
                "Delete Integration",
                True,
                "Integration deleted successfully",
                duration
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Delete Integration",
                False,
                f"Failed to delete integration - Status: {status}",
                duration
            )
    
    def test_delete_project(self):
        """Test deleting project"""
        if not self.test_data['project_id']:
            self._log_test("Delete Project", False, "Skipped: No project ID available")
            return
        
        response, duration = self._make_request(
            "DELETE",
            f"/projects/{self.test_data['project_id']}"
        )
        
        if response and response.status_code in [200, 204]:
            self._log_test(
                "Delete Project",
                True,
                "Project deleted successfully",
                duration
            )
        else:
            status = response.status_code if response else "No Response"
            self._log_test(
                "Delete Project",
                False,
                f"Failed to delete project - Status: {status}",
                duration
            )
    
    # ==================== Test Runner ====================
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"\n{Fore.CYAN}{Style.BRIGHT}╔{'═'*58}╗")
        print(f"{Fore.CYAN}{Style.BRIGHT}║{' '*15}MWAP STAGING API TEST SUITE{' '*15}║")
        print(f"{Fore.CYAN}{Style.BRIGHT}╚{'═'*58}╝")
        print(f"\n{Fore.YELLOW}API Base URL: {API_BASE_URL}")
        print(f"{Fore.YELLOW}Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Health & Auth Tests
        self.test_health_endpoint()
        self.test_authentication()
        
        # Tenant Tests
        self.test_get_my_tenant()
        self.test_update_tenant()
        
        # Project Tests
        self.test_create_project()
        self.test_list_projects()
        self.test_get_project()
        self.test_update_project()
        self.test_get_project_members()
        self.test_get_my_membership()
        
        # Cloud Provider Tests
        self.test_list_cloud_providers()
        self.test_get_cloud_provider()
        
        # Cloud Integration Tests
        self.test_create_integration()
        self.test_list_integrations()
        self.test_oauth_initiation()
        self.test_integration_health()
        
        # File Operations Tests
        self.test_list_project_files()
        
        # OpenAPI Tests
        self.test_openapi_spec()
        
        # Cleanup Tests
        self.test_delete_integration()
        self.test_delete_project()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        passed = sum(1 for r in self.results if r.passed)
        failed = len(self.results) - passed
        total_time = sum(r.response_time for r in self.results)
        
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"{Fore.CYAN}{Back.BLUE} TEST SUMMARY ")
        print(f"{Fore.CYAN}{'='*60}")
        
        print(f"\n{Fore.GREEN}Passed: {passed}/{len(self.results)}")
        print(f"{Fore.RED}Failed: {failed}/{len(self.results)}")
        print(f"{Fore.CYAN}Total Time: {total_time:.2f}s")
        print(f"{Fore.YELLOW}Average Response Time: {total_time/len(self.results):.2f}s")
        
        if failed > 0:
            print(f"\n{Fore.RED}Failed Tests:")
            for result in self.results:
                if not result.passed:
                    print(f"  {Fore.RED}✗ {result.name}: {result.message}")
        
        success_rate = (passed / len(self.results)) * 100
        print(f"\n{Fore.CYAN}Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print(f"{Fore.GREEN}{Style.BRIGHT}✓ API is functioning well!")
        elif success_rate >= 70:
            print(f"{Fore.YELLOW}{Style.BRIGHT}⚠ API has some issues")
        else:
            print(f"{Fore.RED}{Style.BRIGHT}✗ API has significant issues")
    
    def generate_report(self) -> str:
        """Generate detailed test report in Markdown format"""
        passed = sum(1 for r in self.results if r.passed)
        failed = len(self.results) - passed
        total_time = sum(r.response_time for r in self.results)
        success_rate = (passed / len(self.results)) * 100
        
        report = f"""# MWAP Staging API Test Report

**Test Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**API Base URL:** {API_BASE_URL}  
**Total Tests:** {len(self.results)}  
**Passed:** {passed}  
**Failed:** {failed}  
**Success Rate:** {success_rate:.1f}%  
**Total Time:** {total_time:.2f}s  
**Average Response Time:** {total_time/len(self.results):.2f}s

---

## 📊 Test Results Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Passed | {passed} | {success_rate:.1f}% |
| ❌ Failed | {failed} | {100-success_rate:.1f}% |

---

## 🎯 Overall Assessment

"""
        
        if success_rate >= 90:
            report += "✅ **EXCELLENT** - API is functioning well across all tested endpoints.\n"
        elif success_rate >= 70:
            report += "⚠️ **WARNING** - API has some issues that need attention.\n"
        else:
            report += "❌ **CRITICAL** - API has significant issues requiring immediate attention.\n"
        
        report += "\n---\n\n## 📋 Detailed Test Results\n\n"
        
        # Group results by section
        current_section = None
        for result in self.results:
            # Determine section based on test name
            section = self._get_section_for_test(result.name)
            
            if section != current_section:
                current_section = section
                report += f"\n### {section}\n\n"
            
            status = "✅ PASSED" if result.passed else "❌ FAILED"
            report += f"#### {result.name}\n\n"
            report += f"- **Status:** {status}\n"
            report += f"- **Response Time:** {result.response_time:.2f}s\n"
            
            if result.message:
                report += f"- **Message:** {result.message}\n"
            
            if result.details:
                report += f"- **Details:**\n"
                for key, value in result.details.items():
                    if isinstance(value, (dict, list)):
                        report += f"  - {key}: `{json.dumps(value, indent=2)[:200]}`\n"
                    else:
                        report += f"  - {key}: `{value}`\n"
            
            report += "\n"
        
        # Add test data summary
        report += "---\n\n## 🔑 Test Data Created\n\n"
        report += "| Resource | ID |\n"
        report += "|----------|----|\n"
        for key, value in self.test_data.items():
            display_value = value if value else "Not Created"
            report += f"| {key} | `{display_value}` |\n"
        
        # Add performance metrics
        report += "\n---\n\n## ⚡ Performance Metrics\n\n"
        report += "| Test Category | Avg Response Time |\n"
        report += "|---------------|-------------------|\n"
        
        sections = {}
        for result in self.results:
            section = self._get_section_for_test(result.name)
            if section not in sections:
                sections[section] = []
            sections[section].append(result.response_time)
        
        for section, times in sections.items():
            avg_time = sum(times) / len(times)
            report += f"| {section} | {avg_time:.2f}s |\n"
        
        # Add recommendations
        report += "\n---\n\n## 💡 Recommendations\n\n"
        
        if failed > 0:
            report += "### Failed Tests\n\n"
            for result in self.results:
                if not result.passed:
                    report += f"- **{result.name}**: {result.message}\n"
            report += "\n"
        
        slow_tests = [r for r in self.results if r.response_time > 2.0]
        if slow_tests:
            report += "### Slow Endpoints (>2s)\n\n"
            for result in slow_tests:
                report += f"- **{result.name}**: {result.response_time:.2f}s\n"
            report += "\n"
        
        report += "### Next Steps\n\n"
        if success_rate >= 90:
            report += "- ✅ API is production-ready\n"
            report += "- Monitor performance metrics\n"
            report += "- Set up automated testing\n"
        else:
            report += "- ⚠️ Fix failing tests before production deployment\n"
            report += "- Review error logs for failed endpoints\n"
            report += "- Re-run tests after fixes\n"
        
        report += "\n---\n\n"
        report += f"*Report generated by automated test script*  \n"
        report += f"*Timestamp: {datetime.now().isoformat()}*\n"
        
        return report
    
    def _get_section_for_test(self, test_name: str) -> str:
        """Determine section for a test based on its name"""
        if "Health" in test_name or "Authentication" in test_name:
            return "Health & Authentication"
        elif "Tenant" in test_name:
            return "Tenant Management"
        elif "Project" in test_name or "Member" in test_name:
            return "Project Management"
        elif "Cloud Provider" in test_name:
            return "Cloud Providers"
        elif "Integration" in test_name or "OAuth" in test_name:
            return "Cloud Integrations & OAuth"
        elif "File" in test_name:
            return "File Operations"
        elif "OpenAPI" in test_name:
            return "OpenAPI Documentation"
        else:
            return "Other"


def main():
    """Main entry point"""
    print(f"{Fore.CYAN}{Style.BRIGHT}")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 11 + "MWAP STAGING API TEST SUITE" + " " * 19 + "║")
    print("╚" + "═" * 58 + "╝")
    print(Style.RESET_ALL)
    
    # Get JWT token from user
    print(f"\n{Fore.YELLOW}Please enter your Auth0 JWT token:")
    print(f"{Fore.CYAN}(Get it from: https://mwapss.shibari.photo/api/v1/docs or Auth0 Dashboard)")
    token = input(f"{Fore.GREEN}Token: {Style.RESET_ALL}").strip()
    
    if not token:
        print(f"{Fore.RED}Error: Token is required!")
        sys.exit(1)
    
    # Create tester and run tests
    tester = APITester(token)
    tester.run_all_tests()
    
    # Generate and save report
    print(f"\n{Fore.CYAN}Generating test report...")
    report = tester.generate_report()
    
    # Save report
    os.makedirs(REPORT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_filename = f"staging-api-test-report-{timestamp}.md"
    report_path = os.path.join(REPORT_DIR, report_filename)
    
    with open(report_path, 'w') as f:
        f.write(report)
    
    print(f"{Fore.GREEN}✓ Report saved to: {report_path}")
    
    # Determine exit code
    passed = sum(1 for r in tester.results if r.passed)
    success_rate = (passed / len(tester.results)) * 100
    
    if success_rate < 70:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Test interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Fore.RED}Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


