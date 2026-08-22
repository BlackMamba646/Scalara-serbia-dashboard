from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://scalara:scalara_dev_password@localhost:5432/scalara_radar"
    redis_url: str = "redis://localhost:6379"

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
