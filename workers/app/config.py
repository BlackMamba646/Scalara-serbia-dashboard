from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://scalara:scalara_dev_password@localhost:5432/scalara_radar"

    @model_validator(mode="after")
    def _fix_db_url(self):
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        url = url.replace("sslmode=", "ssl=")
        self.database_url = url
        return self

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "scalara_radar"
    postgres_user: str = "scalara"
    postgres_password: str = "scalara_dev_password"

    llm_provider: str = "anthropic"
    llm_api_key: str = ""
    llm_model_fast: str = "claude-haiku-4-5-20251001"
    llm_model_mid: str = "claude-sonnet-5"
    llm_model_strong: str = "claude-opus-5"

    frontend_url: str = "http://localhost:3000"
    workers_port: int = 8000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
