import logging
import os
import time

import requests

from .models import GuardrailResult

logger = logging.getLogger(__name__)


class GuardrailClient:
    def __init__(self):
        self.base_url = os.getenv("NEMO_API_URL", "http://nemo-guardrails:8000")
        self._failures = 0
        self._circuit_open = False
        self._circuit_until = 0.0
        self._max_failures = int(os.getenv("GUARDRAIL_CIRCUIT_BREAKER_MAX", "5"))
        self._circuit_timeout = int(os.getenv("GUARDRAIL_CIRCUIT_BREAKER_TIMEOUT", "60"))
        self._timeout = int(os.getenv("GUARDRAIL_TIMEOUT", "5"))

    def check_email(self, email_text: str) -> GuardrailResult:
        now = time.time()
        if self._circuit_open:
            if now < self._circuit_until:
                logger.warning("Circuit breaker open, skipping NeMo guardrail check")
                return GuardrailResult(safe=True)
            else:
                self._circuit_open = False
                self._failures = 0
                logger.info("Circuit breaker reset")

        try:
            resp = requests.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "config_id": "default",
                    "messages": [{"role": "user", "content": email_text}],
                },
                timeout=self._timeout,
            )
            resp.raise_for_status()
            body = resp.json()
            content = body.get("choices", [{}])[0].get("message", {}).get("content", "")

            self._failures = 0
            if "SECURITY_VIOLATION_DETECTED" in content:
                return GuardrailResult(safe=False, reason=content)
            return GuardrailResult(safe=True)

        except requests.exceptions.Timeout:
            self._record_failure("NeMo guardrail request timed out")
        except requests.exceptions.ConnectionError:
            self._record_failure("NeMo guardrail connection failed")
        except requests.exceptions.HTTPError as e:
            self._record_failure(f"NeMo guardrail HTTP error: {e}")
        except (KeyError, ValueError, TypeError) as e:
            logger.error("NeMo guardrail response parse error: %s", e)

        return GuardrailResult(safe=True)

    def _record_failure(self, msg: str):
        self._failures += 1
        logger.warning("%s (failure %d/%d)", msg, self._failures, self._max_failures)
        if self._failures >= self._max_failures:
            self._circuit_open = True
            self._circuit_until = time.time() + self._circuit_timeout
            logger.error(
                "Circuit breaker opened for %ds after %d consecutive failures",
                self._circuit_timeout,
                self._failures,
            )
