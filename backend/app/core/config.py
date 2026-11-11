from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: str = "development"
    database_url: SecretStr | None = None
    supabase_url: str | None = None
    supabase_publishable_key: SecretStr | None = None
    paypal_client_id: SecretStr | None = None
    paypal_client_secret: SecretStr | None = None
    paypal_webhook_id: str | None = None
    paypal_base_url: str = "https://api-m.sandbox.paypal.com"
    cors_origins: str = "http://localhost:5173"

    @field_validator(
        "database_url",
        "supabase_url",
        "supabase_publishable_key",
        "paypal_client_id",
        "paypal_client_secret",
        "paypal_webhook_id",
        mode="before",
    )
    @classmethod
    def blank_or_example_values_are_unset(cls, value):
        if value is None:
            return None
        text = value.get_secret_value() if isinstance(value, SecretStr) else str(value)
        if not text.strip() or "YOUR_PROJECT" in text or "YOUR_PUBLIC_" in text:
            return None
        return value

    @field_validator("paypal_base_url")
    @classmethod
    def sandbox_only(cls, value: str) -> str:
        normalized = value.rstrip("/")
        if normalized != "https://api-m.sandbox.paypal.com":
            raise ValueError("This backend currently supports PayPal Sandbox only")
        return normalized

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def paypal_configured(self) -> bool:
        return bool(
            self.paypal_client_id
            and self.paypal_client_id.get_secret_value().strip()
            and self.paypal_client_secret
            and self.paypal_client_secret.get_secret_value().strip()
        )

    @property
    def paypal_webhooks_configured(self) -> bool:
        return self.paypal_configured and bool(self.paypal_webhook_id)


@lru_cache
def get_settings() -> Settings:
    return Settings()
