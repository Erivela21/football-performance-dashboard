import sys
import os
import importlib

def check_import(module_name):
    try:
        importlib.import_module(module_name)
        print(f"✅ Import successful: {module_name}")
        return True
    except ImportError as e:
        print(f"❌ Import failed: {module_name} - {e}")
        return False

def check_env_vars():
    # These are expected in Azure
    required_vars = [] # None strictly required for app startup as defaults exist, but good to check
    print("ℹ️  Checking environment variables...")
    # In Azure, these are set via App Service Configuration
    azure_vars = ["AZURE_SQL_SERVER", "AZURE_SQL_DATABASE", "AZURE_SQL_USERNAME", "AZURE_SQL_PASSWORD", "APPLICATIONINSIGHTS_CONNECTION_STRING"]
    for var in azure_vars:
        if os.environ.get(var):
            print(f"   Found {var}")
        else:
            print(f"   Missing {var} (Expected in Production)")

def main():
    print("🚀 Starting Deployment Readiness Check...")
    
    # 1. Check Dependencies
    print("\n1️⃣  Checking Critical Dependencies:")
    deps = ["fastapi", "sqlalchemy", "pydantic", "pyodbc", "opencensus.ext.azure"]
    all_deps_ok = all(check_import(dep) for dep in deps)
    
    if not all_deps_ok:
        print("\n❌ Critical dependencies missing. Deployment will likely fail.")
        sys.exit(1)

    # 2. Check Code Import
    print("\n2️⃣  Checking Application Import:")
    try:
        from app.main import app
        print("✅ Successfully imported app.main:app")
    except Exception as e:
        print(f"❌ Failed to import app: {e}")
        sys.exit(1)

    # 3. Env Vars
    print("\n3️⃣  Environment Configuration:")
    check_env_vars()

    print("\n✅ Readiness Check Complete. App seems ready for deployment!")

if __name__ == "__main__":
    main()
