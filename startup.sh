#!/bin/bash

# Install ODBC Driver 18 for SQL Server (Debian 11 / Azure App Service default)
if ! command -v sqlcmd &> /dev/null; then
    echo "Installing ODBC Driver..."
    curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
    curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list
    apt-get update
    ACCEPT_EULA=Y apt-get install -y msodbcsql18
fi

# Run the application
python -m gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
