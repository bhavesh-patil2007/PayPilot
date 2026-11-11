import base64
from typing import Any

import httpx

from ..core.config import Settings


class PayPalNotConfigured(Exception):
    pass


class PayPalUnavailable(Exception):
    pass


class PayPalClient:
    """Server-side PayPal Sandbox client. No browser receives the credentials or access token."""

    def __init__(self, settings: Settings):
        self.settings = settings

    async def access_token(self) -> str:
        if not self.settings.paypal_configured:
            raise PayPalNotConfigured
        client_id = self.settings.paypal_client_id.get_secret_value()
        secret = self.settings.paypal_client_secret.get_secret_value()
        basic = base64.b64encode(f"{client_id}:{secret}".encode()).decode()
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    f"{self.settings.paypal_base_url}/v1/oauth2/token",
                    headers={"Authorization": f"Basic {basic}"},
                    data={"grant_type": "client_credentials"},
                )
        except httpx.HTTPError as exc:
            raise PayPalUnavailable from exc
        if response.status_code != 200:
            raise PayPalUnavailable
        token = response.json().get("access_token")
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
            "webhook_id": self.settings.paypal_webhook_id,
            "webhook_event": event,
        }
        if any(not verification_payload[key] for key in (
            "auth_algo", "cert_url", "transmission_id", "transmission_sig", "transmission_time"
        )):
            return False
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    f"{self.settings.paypal_base_url}/v1/notifications/verify-webhook-signature",
                    headers={"Authorization": f"Bearer {token}"},
                    json=verification_payload,
                )
        except httpx.HTTPError as exc:
            raise PayPalUnavailable from exc
        if response.status_code != 200:
            raise PayPalUnavailable
        return response.json().get("verification_status") == "SUCCESS"
