import logging
import os
import threading
import time
from datetime import datetime

from .db import EmailStore
from .guardrail_client import GuardrailClient
from .imap_client import IMAPClient
from .llm_client import LLMClient
from .models import EmailPayload, EmailRecord, ImapSettings

logger = logging.getLogger(__name__)


class EmailAgent:
    def __init__(self):
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()
        logging.basicConfig(
            level=getattr(logging, log_level, logging.INFO),
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        )
        self.store = EmailStore()
        self.imap = IMAPClient()
        self.guardrail = GuardrailClient()
        self.llm = LLMClient()
        self.poll_interval = int(os.getenv("AGENT_POLL_INTERVAL", "60"))
        self.running = False
        self._thread: threading.Thread | None = None

    def process_email(self, payload: EmailPayload) -> EmailRecord:
        existing = self.store.get_email(payload.message_id)
        if existing and existing.status != "pending":
            logger.debug("Skipping already processed email: %s", payload.message_id)
            return existing

        record = EmailRecord(
            message_id=payload.message_id,
            sender=payload.sender,
            subject=payload.subject,
            body_text=payload.body_text,
            received_at=payload.received_at,
        )

        guardrail_result = self.guardrail.check_email(payload.body_text)
        record.guardrail_safe = guardrail_result.safe
        record.guardrail_reason = guardrail_result.reason

        if not guardrail_result.safe:
            record.status = "security_violation"
            record.processed_at = datetime.utcnow()
            self.store.store_email(record)
            logger.info(
                "Security violation: %s from %s — %s",
                payload.message_id[:40],
                payload.sender,
                guardrail_result.reason[:100],
            )
            return record

        classification_result = self.llm.classify_email(payload.body_text)
        record.classification = classification_result.classification
        record.confidence = classification_result.confidence
        record.status = classification_result.classification
        record.processed_at = datetime.utcnow()
        self.store.store_email(record)

        logger.info(
            "Classified %s: %s (%.2f) — from %s",
            payload.message_id[:40],
            classification_result.classification,
            classification_result.confidence,
            payload.sender,
        )
        return record

    def configure_imap(self, settings: ImapSettings):
        self.imap.update_config(settings)
        logger.info("IMAP reconfigured, will use new settings on next poll cycle")

    def run_once(self):
        try:
            self.imap.connect()
        except Exception as e:
            logger.error("Failed to connect to IMAP: %s", e)
            return

        try:
            emails = self.imap.fetch_unseen()
        except Exception as e:
            logger.error("Failed to fetch unseen emails: %s", e)
            return
        finally:
            self.imap.disconnect()

        if not emails:
            logger.debug("No new emails to process")
            return

        processed = 0
        errors = 0
        for payload in emails:
            try:
                self.process_email(payload)
                processed += 1
            except Exception as e:
                logger.exception("Error processing email %s: %s", payload.message_id[:40], e)
                errors += 1

        logger.info("Cycle complete: %d processed, %d errors", processed, errors)

    def run_forever(self):
        self.running = True
        logger.info("Agent loop started (interval=%ds)", self.poll_interval)
        while self.running:
            try:
                self.run_once()
            except Exception as e:
                logger.exception("Unhandled error in agent loop: %s", e)
            time.sleep(self.poll_interval)
        logger.info("Agent loop stopped")

    def start(self):
        self._thread = threading.Thread(target=self.run_forever, daemon=True)
        self._thread.start()

    def stop(self):
        self.running = False
        if self._thread:
            self._thread.join(timeout=10)
        logger.info("Agent stopped")


if __name__ == "__main__":
    agent = EmailAgent()
    agent.run_forever()
