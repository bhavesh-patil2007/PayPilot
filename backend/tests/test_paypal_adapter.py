import unittest
from types import SimpleNamespace
from unittest.mock import patch

from backend.app.core.config import Settings
from backend.app.integrations.paypal import PayPalClient


class PayPalApimaticAdapterTests(unittest.IsolatedAsyncioTestCase):
    async def test_access_token_uses_apimatic_generated_sdk_and_sandbox_environment(self):
        settings = Settings(
            _env_file=None,
            PAYPAL_CLIENT_ID="sandbox-client",
            PAYPAL_CLIENT_SECRET="sandbox-secret",
            PAYPAL_ENVIRONMENT="sandbox",
        )
        with patch("paypalserversdk.paypal_serversdk_client.PaypalServersdkClient") as sdk_class:
            sdk_class.return_value.oauth_2.fetch_token.return_value = SimpleNamespace(access_token="sandbox-token")

            token = await PayPalClient(settings).access_token()

        self.assertEqual(token, "sandbox-token")
        credentials = sdk_class.call_args.kwargs["client_credentials_auth_credentials"]
        self.assertEqual(credentials.o_auth_client_id, "sandbox-client")
        self.assertEqual(credentials.o_auth_client_secret, "sandbox-secret")
        self.assertEqual(sdk_class.call_args.kwargs["environment"].name, "SANDBOX")

    async def test_live_credentials_use_the_generated_sdk_production_environment(self):
        settings = Settings(
            _env_file=None,
            PAYPAL_ENVIRONMENT="live",
            PAYPAL_CLIENT_ID="sandbox-client",
            PAYPAL_CLIENT_SECRET="sandbox-secret",
            PAYPAL_LIVE_CLIENT_ID="live-client",
            PAYPAL_LIVE_CLIENT_SECRET="live-secret",
        )
        with patch("paypalserversdk.paypal_serversdk_client.PaypalServersdkClient") as sdk_class:
            sdk_class.return_value.oauth_2.fetch_token.return_value = SimpleNamespace(access_token="live-token")

            token = await PayPalClient(settings).access_token()

        self.assertEqual(token, "live-token")
        credentials = sdk_class.call_args.kwargs["client_credentials_auth_credentials"]
        self.assertEqual(credentials.o_auth_client_id, "live-client")
        self.assertEqual(sdk_class.call_args.kwargs["environment"].name, "PRODUCTION")


if __name__ == "__main__":
    unittest.main()
