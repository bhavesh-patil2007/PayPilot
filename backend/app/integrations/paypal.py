import asyncio
from typing import Any

import httpx

from ..core.config import Settings


class PayPalNotConfigured(Exception):
    pass


class PayPalUnavailable(Exception):
    pass


class PayPalClient:
    """Server-side PayPal client; selected environment credentials never reach the browser."""

    def __init__(self, settings: Settings):
        self.settings = settings

    async def access_token(self) -> str:
        if not self.settings.paypal_configured:
            raise PayPalNotConfigured
        client_id = self.settings.paypal_active_client_id.get_secret_value()
        secret = self.settings.paypal_active_client_secret.get_secret_value()
        try:
            # PayPal's official Server SDK is APIMatic-generated and returns its
            # typed OAuth token model. Run its synchronous transport off-loop.
            from paypalserversdk.configuration import Environment
            from paypalserversdk.http.auth.o_auth_2 import ClientCredentialsAuthCredentials
            from paypalserversdk.paypal_serversdk_client import PaypalServersdkClient

            sdk = PaypalServersdkClient(
                client_credentials_auth_credentials=ClientCredentialsAuthCredentials(
                    o_auth_client_id=client_id,
                    o_auth_client_secret=secret,
                ),
                environment=Environment.PRODUCTION if self.settings.paypal_environment == "live" else Environment.SANDBOX,
                timeout=12,
            )
            token_response = await asyncio.to_thread(sdk.oauth_2.fetch_token)
        except Exception as exc:
            if isinstance(exc, (PayPalNotConfigured, PayPalUnavailable)):
                raise
            if isinstance(exc, httpx.HTTPError):
                raise PayPalUnavailable from exc
            # SDK exceptions can include request/response details; do not expose them.
            raise PayPalUnavailable from exc
        token = getattr(token_response, "access_token", None)
        if not isinstance(token, str) or not token:
            raise PayPalUnavailable
        return token

    async def verify_webhook(self, headers: Any, event: dict[str, Any]) -> bool:
        if not self.settings.paypal_webhooks_configured:
            raise PayPalNotConfigured
        token = await self.access_token()
        verification_payload = {
            "auth_algo": headers.get("paypal-auth-algo"),
            "cert_url": headers.get("paypal-cert-url"),
            "transmission_id": headers.get("paypal-transmission-id"),
            "transmission_sig": headers.get("paypal-transmission-sig"),
            "transmission_time": headers.get("paypal-transmission-time"),
            "webhook_id": self.settings.paypal_active_webhook_id,
            "webhook_event": event,
        }
        if any(not verification_payload[key] for key in (
            "auth_algo", "cert_url", "transmission_id", "transmission_sig", "transmission_time"
        )):
            return False
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    f"{self.settings.paypal_api_base_url}/v1/notifications/verify-webhook-signature",
                    headers={"Authorization": f"Bearer {token}"},
                    json=verification_payload,
                )
        except httpx.HTTPError as exc:
            raise PayPalUnavailable from exc
        if response.status_code != 200:
            raise PayPalUnavailable
        return response.json().get("verification_status") == "SUCCESS"
