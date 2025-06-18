import requests
from tests.utils import (
    BASE_URL, 
    HEADERS, 
    TOKEN, 
    SUPERADMIN_TOKEN, 
    assert_status, 
    find_resource_by_name, 
    delete_resource, 
    create_tenant
)

def create_cloud_provider():
    """
    Create a test cloud provider with OAuth configuration.
    
    Returns:
        str: The ID of the created cloud provider
    """
    name = "MockDrive"
    existing_id = find_resource_by_name("/api/v1/cloud-providers", name, SUPERADMIN_TOKEN)
    if existing_id:
        delete_resource("/api/v1/cloud-providers", existing_id, SUPERADMIN_TOKEN)
    
    payload = {
        "name": name,
        "slug": "mockdrive",
        "scopes": ["mock.read", "mock.write"],
        "authUrl": "https://mock.example.com/oauth/authorize",
        "tokenUrl": "https://mock.example.com/oauth/token",
        # New OAuth-specific fields
        "clientId": "mock_client_id",
        "clientSecret": "mock_client_secret",
        "grantType": "authorization_code",
        "tokenMethod": "POST",
        "metadata": {
            "icon": "cloud",
            "color": "#4285F4",
            "description": "Mock cloud storage provider for testing"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/cloud-providers", 
        json=payload, 
        headers=HEADERS(SUPERADMIN_TOKEN)
    )
    assert_status(response, 201, "Create CloudProvider")
    return response.json()["data"]["_id"]

def create_cloud_integration(tenant_id, provider_id):
    """
    Create a test cloud integration for a tenant.
    
    Args:
        tenant_id (str): The ID of the tenant
        provider_id (str): The ID of the cloud provider
        
    Returns:
        str: The ID of the created cloud integration
    """
    # Updated endpoint path
    url = f"{BASE_URL}/api/v1/tenants/{tenant_id}/cloud-integrations"
    
    payload = {
        "providerId": provider_id,
        "metadata": {
            "displayName": "Test Integration",
            "description": "Integration for automated testing"
        }
    }
    
    response = requests.post(url, json=payload, headers=HEADERS(TOKEN))
    assert_status(response, 201, "Create Cloud Integration")
    return response.json()["data"]["_id"]

def test_oauth_flow(tenant_id, provider_id, integration_id):
    """
    Test the OAuth flow for a cloud integration.
    
    Args:
        tenant_id (str): The ID of the tenant
        provider_id (str): The ID of the cloud provider
        integration_id (str): The ID of the cloud integration
        
    Returns:
        bool: True if the OAuth flow was successful
    """
    # This is a mock function to simulate the OAuth flow
    # In a real test, you would:
    # 1. Get the auth URL from the provider
    # 2. Use a headless browser to navigate to the auth URL
    # 3. Authenticate and authorize the app
    # 4. Handle the callback with the authorization code
    
    # Mock the callback with a code
    mock_code = "mock_authorization_code"
    mock_state = "mock_state_value"
    
    # Call the OAuth callback endpoint
    url = f"{BASE_URL}/api/v1/tenants/{tenant_id}/cloud-integrations/{integration_id}/oauth/callback"
    params = {
        "code": mock_code,
        "state": mock_state
    }
    
    # In a real test, this would be called by the OAuth provider's redirect
    # Here we're simulating it with a direct API call
    response = requests.get(url, params=params, headers=HEADERS(TOKEN))
    assert_status(response, 200, "OAuth Callback")
    
    # Verify the integration status is now connected
    get_url = f"{BASE_URL}/api/v1/tenants/{tenant_id}/cloud-integrations/{integration_id}"
    get_response = requests.get(get_url, headers=HEADERS(TOKEN))
    assert_status(get_response, 200, "Get Integration")
    
    integration_data = get_response.json()["data"]
    return integration_data["status"] == "connected"

def refresh_oauth_token(tenant_id, integration_id):
    """
    Test refreshing an OAuth token for a cloud integration.
    
    Args:
        tenant_id (str): The ID of the tenant
        integration_id (str): The ID of the cloud integration
        
    Returns:
        bool: True if the token refresh was successful
    """
    url = f"{BASE_URL}/api/v1/tenants/{tenant_id}/cloud-integrations/{integration_id}/refresh"
    response = requests.post(url, headers=HEADERS(TOKEN))
    assert_status(response, 200, "Refresh OAuth Token")
    
    # Verify the token was refreshed by checking the updated timestamp
    get_url = f"{BASE_URL}/api/v1/tenants/{tenant_id}/cloud-integrations/{integration_id}"
    get_response = requests.get(get_url, headers=HEADERS(TOKEN))
    assert_status(get_response, 200, "Get Integration")
    
    integration_data = get_response.json()["data"]
    return "tokenUpdatedAt" in integration_data and integration_data["status"] == "connected"

def test_cloud_provider_integration_flow():
    """Test the full cloud provider and integration flow"""
    # Create a cloud provider (requires SUPERADMIN)
    provider_id = create_cloud_provider()
    
    # Create a tenant
    tenant_id = create_tenant()
    
    # Create a cloud integration for the tenant
    integration_id = create_cloud_integration(tenant_id, provider_id)
    
    # Test the OAuth flow
    oauth_success = test_oauth_flow(tenant_id, provider_id, integration_id)
    assert oauth_success, "OAuth flow failed"
    
    # Test refreshing the token
    refresh_success = refresh_oauth_token(tenant_id, integration_id)
    assert refresh_success, "Token refresh failed"
    
    # Clean up
    delete_resource(f"/api/v1/tenants/{tenant_id}/cloud-integrations", integration_id, TOKEN)
    delete_resource("/api/v1/tenants", tenant_id, TOKEN)
    delete_resource("/api/v1/cloud-providers", provider_id, SUPERADMIN_TOKEN)