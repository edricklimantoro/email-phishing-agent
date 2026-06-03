import json
import logging
import os
import time

import requests

from .models import ClassificationResult

logger = logging.getLogger(__name__)

PHISHING_SYSTEM_PROMPT = (
    "You are an email security classifier. Analyze the email below "
    "and determine if it is a phishing attempt or legitimate (safe).\n\n"
    "Consider these phishing indicators:\n"
    "- Urgent language demanding immediate action\n"
    "- Requests for credentials, passwords, or sensitive information\n"
    "- Suspicious links or attachments (even if described in text)\n"
    "- Impersonation of trusted entities (banks, IT support, executives)\n"
    "- Threats of account closure or legal action\n"
    "- Too-good-to-be-true offers\n"
    "- Grammar and spelling inconsistencies (though sophisticated attacks may lack these)\n\n"
    'Respond with ONLY valid JSON in this exact format, no other text:\n'
    '{"classification": "phishing", "confidence": 0.95}\n'
    'or\n'
    '{"classification": "safe", "confidence": 0.98}\n\n'
    "Where confidence is a float between 0.0 and 1.0."
)


class LLMClient:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        self.model = os.getenv("LLM_MODEL", "qwen3.6:35b-a3b")
        self._timeout = int(os.getenv("LLM_TIMEOUT", "30"))
        self._max_retries = int(os.getenv("LLM_MAX_RETRIES", "3"))

    def classify_email(self, email_text: str) -> ClassificationResult:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": PHISHING_SYSTEM_PROMPT},
                {"role": "user", "content": f"Email:\n```\n{email_text}\n```"},
            ],
            "stream": False,
            "format": "json",
        }

        last_error: Exception | None = None
        for attempt in range(1, self._max_retries + 1):
            try:
                resp = requests.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                    timeout=self._timeout,
                )
                resp.raise_for_status()
                body = resp.json()
                raw = body.get("message", {}).get("content", "")
                data = json.loads(raw)
                classification = data.get("classification", "safe")
                confidence = float(data.get("confidence", 0.0))
                confidence = max(0.0, min(1.0, confidence))
                return ClassificationResult(classification=classification, confidence=confidence)

            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                last_error = e
                logger.warning("LLM request failed (attempt %d/%d): %s", attempt, self._max_retries, e)
            except requests.exceptions.HTTPError as e:
                if e.response is not None and 500 <= e.response.status_code < 600:
                    last_error = e
                    logger.warning("LLM server error (attempt %d/%d): %s", attempt, self._max_retries, e)
                else:
                    logger.error("LLM non-retryable HTTP error: %s", e)
                    return ClassificationResult(classification="safe", confidence=0.0)
            except (json.JSONDecodeError, KeyError, ValueError, TypeError) as e:
                logger.error("LLM response parse error: %s", e)
                return ClassificationResult(classification="safe", confidence=0.0)

            if attempt < self._max_retries:
                time.sleep(2 ** (attempt - 1))

        logger.error("LLM request failed after %d attempts", self._max_retries)
        return ClassificationResult(classification="safe", confidence=0.0)
