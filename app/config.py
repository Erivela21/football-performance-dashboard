"""Configuration settings for the Football Performance Dashboard."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database settings
    database_url: str = ""
    azure_sql_server: str = ""
    azure_sql_database: str = ""
    azure_sql_username: str = ""
    azure_sql_password: str = ""

    # Application Insights
    applicationinsights_connection_string: str = ""

    # Application settings
    app_name: str = "Football Performance Dashboard"
    debug: bool = False

    # Security / Auth
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    # CORS settings (comma-separated list of allowed origins)
    cors_allowed_origins: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def get_database_url(self) -> str:
        """Get the database connection URL for Azure SQL."""
        if self.database_url:
            return self.database_url
        
        # Azure SQL Connection
        if self.azure_sql_server and self.azure_sql_database:
            from urllib.parse import quote_plus
            driver = "ODBC Driver 18 for SQL Server"
            return (
                f"mssql+pyodbc://{self.azure_sql_username}:{self.azure_sql_password}"
                f"@{self.azure_sql_server}/{self.azure_sql_database}"
                f"?driver={quote_plus(driver)}&Encrypt=yes&TrustServerCertificate=no"
            )
            
        return "sqlite:///./test.db"

    def get_cors_origins(self) -> list[str]:
        """Get list of allowed CORS origins."""
        if self.cors_allowed_origins:
            return [origin.strip() for origin in self.cors_allowed_origins.split(",")]
        return ["*"]


settings = Settings()
