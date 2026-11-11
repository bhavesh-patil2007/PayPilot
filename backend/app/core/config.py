from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import SecretStr, field_validator, model_validator
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
    ai_provider: Literal["none", "openai", "gemini"] = "none"
    openai_api_key: SecretStr | None = None
    gemini_api_key: SecretStr | None = None
    database_url: SecretStr | None = None
    supabase_url: str | None = None
    supabase_publishable_key: SecretStr | None = None
    paypal_client_id: SecretStr | None = None
    paypal_client_secret: SecretStr | None = None
    paypal_webhook_id: str | None = None
    paypal_live_client_id: SecretStr | None = None
    paypal_live_client_secret: SecretStr | None = None
    paypal_live_webhook_id: str | None = None
    paypal_environment: Literal["sandbox", "live"] = "sandbox"
    paypal_base_url: str | None = None
    channel3_api_key: SecretStr | None = None
    channel3_base_url: str = "https://api.trychannel3.com"
    elasticsearch_url: str | None = None
    elasticsearch_api_key: SecretStr | None = None
    elasticsearch_index: str = "paypilot-evidence"
    astropods_api_key: SecretStr | None = None
    astropods_deployment_id: str | None = None
    astropods_read_only_confirmed: bool = False
    kernel_api_key: SecretStr | None = None
    kernel_key_rotated_after_incident: bool = False
    zapier_mcp_endpoint: str | None = None
    zapier_mcp_token: SecretStr | None = None
    zapier_mcp_allowed_tools: str = ""
    render_api_key: SecretStr | None = None
    render_workflow_slug: str | None = None
    cors_origins: str = "http://localhost:5173"

    @field_validator(
        "database_url",
        "openai_api_key",
        "gemini_api_key",
        "supabase_url",
        "supabase_publishable_key",
        "paypal_client_id",
        "paypal_client_secret",
        "paypal_webhook_id",
        "paypal_live_client_id",
        "paypal_live_client_secret",
        "paypal_live_webhook_id",
        "channel3_api_key",
        "elasticsearch_api_key",
        "astropods_api_key",
        "kernel_api_key",
        "zapier_mcp_token",
        "render_api_key",
        mode="before",
    )
    @classmethod
    def blank_or_example_values_are_unset(cls, value):
        if value is None:
            return None
        text = value.get_secret_value() if isinstance(value, SecretStr) else str(value)
        if not text.strip() or any(marker in text.upper() for marker in (
            "YOUR_PROJECT", "YOUR_PUBLIC_", "CHANGE_ME", "REPLACE_ME"
        )):
            return None
        return value

    @field_validator("supabase_url", "channel3_base_url", "elasticsearch_url", "zapier_mcp_endpoint")
    @classmethod
    def validate_http_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().rstrip("/")
        parsed = urlsplit(normalized)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("must be an absolute HTTP(S) URL")
        if parsed.username or parsed.password:
            raise ValueError("must not contain embedded credentials; configure credentials separately")
        return normalized

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_postgres_dsn(cls, value):
        if value is None:
            return None
        raw = value.get_secret_value() if isinstance(value, SecretStr) else str(value)
        if not raw.strip():
            return None
        if not raw.startswith(("postgres://", "postgresql://")):
            raise ValueError("must be a postgres:// or postgresql:// DSN used by asyncpg")
        return value

    @field_validator("elasticsearch_index")
    @classmethod
    def validate_elasticsearch_index(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("must not be empty")
        return normalized

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        origins = [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]
        if not origins:
            raise ValueError("must contain at least one allowed frontend origin")
        for origin in origins:
            parsed = urlsplit(origin)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path or parsed.query or parsed.fragment:
                raise ValueError(f"'{origin}' must be an origin only, such as https://app.example.com")
        return ",".join(origins)

    @field_validator("paypal_base_url")
    @classmethod
    def normalize_paypal_base_url(cls, value: str | None) -> str | None:
        return value.rstrip("/") if value else None

    @model_validator(mode="after")
    def validate_optional_integration_pairs(self) -> "Settings":
        pairs = (
            ("Supabase Auth", self.supabase_url, self.supabase_publishable_key,
             "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set together."),
            ("PayPal Sandbox", self.paypal_client_id, self.paypal_client_secret,
             "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set together."),
            ("PayPal Live", self.paypal_live_client_id, self.paypal_live_client_secret,
             "PAYPAL_LIVE_CLIENT_ID and PAYPAL_LIVE_CLIENT_SECRET must be set together."),
            ("Elastic", self.elasticsearch_url, self.elasticsearch_api_key,
             "ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY must be set together."),
        )
        for integration, first, second, message in pairs:
            if bool(first) != bool(second):
                raise ValueError(f"{integration} configuration is incomplete. {message}")
        if self.ai_provider == "openai" and not self.openai_api_key:
            raise ValueError("AI_PROVIDER=openai requires OPENAI_API_KEY.")
        if self.ai_provider == "gemini" and not self.gemini_api_key:
            raise ValueError("AI_PROVIDER=gemini requires GEMINI_API_KEY.")
        if self.paypal_webhook_id and not (self.paypal_client_id and self.paypal_client_secret):
            raise ValueError("PAYPAL_WEBHOOK_ID requires both Sandbox client credentials.")
        if self.paypal_live_webhook_id and not (self.paypal_live_client_id and self.paypal_live_client_secret):
            raise ValueError("PAYPAL_LIVE_WEBHOOK_ID requires both Live client credentials.")
        expected_base_url = self.paypal_api_base_url
        if self.paypal_base_url and self.paypal_base_url != expected_base_url:
            raise ValueError(
                f"PAYPAL_BASE_URL must match PAYPAL_ENVIRONMENT ({expected_base_url}). "
                "Use separate credentials for Sandbox and Live."
            )
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def paypal_configured(self) -> bool:
        client_id = self.paypal_active_client_id
        client_secret = self.paypal_active_client_secret
        return bool(
            client_id
            and client_id.get_secret_value().strip()
            and client_secret
            and client_secret.get_secret_value().strip()
        )

    @property
    def paypal_sandbox_configured(self) -> bool:
        return bool(self.paypal_client_id and self.paypal_client_secret)

    @property
    def paypal_webhooks_configured(self) -> bool:
        return self.paypal_configured and bool(self.paypal_active_webhook_id)

    @property
    def paypal_active_client_id(self) -> SecretStr | None:
        return self.paypal_live_client_id if self.paypal_environment == "live" else self.paypal_client_id

    @property
    def paypal_active_client_secret(self) -> SecretStr | None:
        return self.paypal_live_client_secret if self.paypal_environment == "live" else self.paypal_client_secret

    @property
    def paypal_active_webhook_id(self) -> str | None:
        return self.paypal_live_webhook_id if self.paypal_environment == "live" else self.paypal_webhook_id

    @property
    def paypal_api_base_url(self) -> str:
        if self.paypal_environment == "live":
            return "https://api-m.paypal.com"
        return "https://api-m.sandbox.paypal.com"

    @property
    def supabase_auth_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_publishable_key)

    @property
    def channel3_configured(self) -> bool:
        return bool(self.channel3_api_key and self.channel3_api_key.get_secret_value().strip())

    @property
    def elasticsearch_configured(self) -> bool:
        return bool(self.elasticsearch_url and self.elasticsearch_api_key)

    @property
    def astropods_configured(self) -> bool:
        return bool(self.astropods_api_key and self.astropods_deployment_id and self.astropods_read_only_confirmed)

    @property
    def kernel_configured(self) -> bool:
        return bool(self.kernel_api_key)

    @property
    def zapier_configured(self) -> bool:
        return bool(self.zapier_mcp_endpoint and self.zapier_mcp_token)

    @property
    def zapier_allowed_tool_names(self) -> set[str]:
        return {name.strip() for name in self.zapier_mcp_allowed_tools.split(",") if name.strip()}

    @property
    def render_workflow_configured(self) -> bool:
        return bool(self.render_api_key and self.render_workflow_slug)



@lru_cache
def get_settings() -> Settings:
    return Settings()
