import os
import unittest
from unittest.mock import patch

from fastapi import FastAPI, HTTPException
from pydantic import ValidationError

from backend.app.api.v1.routes import channel3_product_search
from backend.app.core.auth import AuthenticatedUser
from backend.app.core.config import Settings
from backend.app.integrations.paypal import PayPalClient, PayPalNotConfigured
from backend.app.main import lifespan


def isolated_settings(**values) -> Settings:
    with patch.dict(os.environ, {}, clear=True):
        return Settings(_env_file=None, **values)


class SettingsTests(unittest.TestCase):
    def test_optional_integrations_are_disabled_by_default(self):
        settings = isolated_settings()

        self.assertFalse(settings.database_url)
        self.assertFalse(settings.supabase_auth_configured)
        self.assertFalse(settings.paypal_configured)
        self.assertFalse(settings.paypal_sandbox_configured)
        self.assertFalse(settings.paypal_webhooks_configured)
        self.assertFalse(settings.channel3_configured)
        self.assertFalse(settings.elasticsearch_configured)
        self.assertEqual(settings.elasticsearch_index, "paypilot-evidence")
        self.assertEqual(settings.paypal_api_base_url, "https://api-m.sandbox.paypal.com")

    def test_supabase_url_and_publishable_key_must_be_paired(self):
        with self.assertRaisesRegex(ValidationError, "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY"):
            isolated_settings(SUPABASE_URL="https://project.supabase.co")

    def test_ai_provider_selection_requires_matching_credentials(self):
        with self.assertRaisesRegex(ValidationError, "AI_PROVIDER=openai requires OPENAI_API_KEY"):
            isolated_settings(AI_PROVIDER="openai")
        with self.assertRaisesRegex(ValidationError, "AI_PROVIDER=gemini requires GEMINI_API_KEY"):
            isolated_settings(AI_PROVIDER="gemini")

    def test_ai_provider_credentials_are_validated_without_exposing_values(self):
        settings = isolated_settings(AI_PROVIDER="gemini", GEMINI_API_KEY="test-secret")

        self.assertEqual(settings.gemini_api_key.get_secret_value(), "test-secret")
        self.assertNotIn("test-secret", repr(settings))

    def test_paypal_client_credentials_must_be_paired(self):
        with self.assertRaisesRegex(ValidationError, "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET"):
            isolated_settings(PAYPAL_CLIENT_ID="sandbox-id")

    def test_paypal_webhook_id_requires_sandbox_client_credentials(self):
        with self.assertRaisesRegex(ValidationError, "PAYPAL_WEBHOOK_ID requires"):
            isolated_settings(PAYPAL_WEBHOOK_ID="sandbox-webhook-id")

    def test_live_paypal_endpoint_is_rejected_in_sandbox_mode(self):
        with self.assertRaisesRegex(ValidationError, "must match PAYPAL_ENVIRONMENT"):
            isolated_settings(PAYPAL_BASE_URL="https://api-m.paypal.com")

    def test_live_paypal_uses_separate_credentials_and_endpoint(self):
        settings = isolated_settings(
            PAYPAL_ENVIRONMENT="live",
            PAYPAL_BASE_URL="https://api-m.paypal.com",
            PAYPAL_CLIENT_ID="sandbox-id",
            PAYPAL_CLIENT_SECRET="sandbox-secret",
            PAYPAL_LIVE_CLIENT_ID="live-id",
            PAYPAL_LIVE_CLIENT_SECRET="live-secret",
        )

        self.assertEqual(settings.paypal_api_base_url, "https://api-m.paypal.com")
        self.assertEqual(settings.paypal_active_client_id.get_secret_value(), "live-id")
        self.assertEqual(settings.paypal_active_client_secret.get_secret_value(), "live-secret")

    def test_live_mode_does_not_reuse_sandbox_credentials(self):
        settings = isolated_settings(
            PAYPAL_ENVIRONMENT="live",
            PAYPAL_CLIENT_ID="sandbox-id",
            PAYPAL_CLIENT_SECRET="sandbox-secret",
        )

        self.assertFalse(settings.paypal_configured)

    def test_live_webhook_id_requires_live_client_credentials(self):
        with self.assertRaisesRegex(ValidationError, "PAYPAL_LIVE_WEBHOOK_ID requires"):
            isolated_settings(PAYPAL_LIVE_WEBHOOK_ID="live-webhook-id")

    def test_elasticsearch_url_and_key_must_be_paired(self):
        with self.assertRaisesRegex(ValidationError, "ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY"):
            isolated_settings(ELASTICSEARCH_URL="https://elastic.example.com")

    def test_database_url_must_be_an_asyncpg_postgres_dsn(self):
        with self.assertRaisesRegex(ValidationError, "postgres:// or postgresql://"):
            isolated_settings(DATABASE_URL="mysql://db.example.com/paypilot")

    def test_cors_requires_origins_without_paths(self):
        with self.assertRaisesRegex(ValidationError, "must be an origin only"):
            isolated_settings(CORS_ORIGINS="https://app.example.com/path")


class OptionalIntegrationFailureTests(unittest.IsolatedAsyncioTestCase):
    async def test_backend_lifespan_starts_with_optional_integrations_disabled(self):
        app = FastAPI()
        with patch("backend.app.main.get_settings", return_value=isolated_settings()):
            async with lifespan(app):
                self.assertIsNone(app.state.database_pool)

    async def test_channel3_returns_clear_disabled_error_without_key(self):
        with self.assertRaises(HTTPException) as caught:
            await channel3_product_search(
                query="coffee",
                limit=10,
                user=AuthenticatedUser(id="user-id"),
                settings=isolated_settings(),
            )

        self.assertEqual(caught.exception.status_code, 503)
        self.assertIn("CHANNEL3_API_KEY is not configured", caught.exception.detail)

    async def test_paypal_client_reports_missing_sandbox_credentials(self):
        with self.assertRaises(PayPalNotConfigured):
            await PayPalClient(isolated_settings()).access_token()


if __name__ == "__main__":
    unittest.main()
