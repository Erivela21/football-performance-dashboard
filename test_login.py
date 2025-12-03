#!/usr/bin/env python
"""Quick test to verify login works"""

import httpx
import json

BASE_URL = "http://localhost:8000"

def test_login():
    """Test the login endpoint"""
    with httpx.Client() as client:
        # Test login with demo credentials
        response = client.post(
            f"{BASE_URL}/auth/login",
            json={
                "username": "demo",
                "password": "Demo1234"
            }
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✓ Login successful!")
            print(f"Access Token: {data.get('access_token')[:50]}...")
            print(f"Token Type: {data.get('token_type')}")
        else:
            print("\n✗ Login failed!")

if __name__ == "__main__":
    test_login()
