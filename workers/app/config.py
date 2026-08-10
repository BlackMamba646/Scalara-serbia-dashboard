from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "scalara_radar"
    postgres_user: str = "scalara"
    postgres_password: str = "scalara_dev_password"

    redis_host: str = "localhost"
    redis_port: int = 6379

    llm_provider: str = "anthropic"
    llm_api_key: str = ""
    llm_model_fast: str = "claude-haiku-4-5-20251001"
    llm_model_mid: str = "claude-sonnet-5"
    llm_model_strong: str = "claude-opus-5"

    workers_port: int = 8000

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
