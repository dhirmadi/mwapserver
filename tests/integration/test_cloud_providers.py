#!/usr/bin/env python3
"""
Simple sanity checks for cloud provider endpoints without JWT (should reject).

Usage:
  BASE_URL=https://<app>.herokuapp.com python3 tests/integration/test_cloud_providers.py
"""

import os
import sys
import requests


def base() -> str:
    return (
        os.environ.get("BASE_URL")
        or os.environ.get("HEROKU_APP_URL")
        or "http://localhost:3000"
    ).rstrip("/")


def main() -> int:
    base_url = base()
    url = f"{base_url}/api/v1/cloud-providers"
    try:
        resp = requests.get(url, timeout=10)
        print(f"GET {url} -> {resp.status_code}")
        # Without JWT this should be unauthorized/forbidden
        if resp.status_code in {401, 403}:
            print("Cloud providers endpoint correctly protected")
            return 0
        print("Expected 401/403 for protected endpoint without JWT")
        return 2
    except requests.RequestException as e:
        print(f"Request failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())


