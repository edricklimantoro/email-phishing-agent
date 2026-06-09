import imaplib
import email
import logging
import os
import socket
import time
from email.utils import parsedate_to_datetime
from bs4 import BeautifulSoup
from .models import EmailPayload, ImapSettings

logger = logging.getLogger(__name__)


class IMAPClient:
    def __init__(self):
        self.host = os.getenv("IMAP_HOST", "imap.gmail.com")
        self.port = int(os.getenv("IMAP_PORT", "993"))
        self.user = os.getenv("IMAP_USER", "")
        self.password = os.getenv("IMAP_PASS", "")
        self.mailbox = os.getenv("IMAP_MAILBOX", "INBOX")
        self.max_body_chars = int(os.getenv("MAX_BODY_CHARS", "50000"))
        self.conn = None

    def update_config(self, settings: ImapSettings):
        self.host = settings.host
        self.port = settings.port
        self.user = settings.user
        self.password = settings.password
        self.mailbox = settings.mailbox
        self.disconnect()
        logger.info("IMAP config updated: %s@%s:%d/%s", self.user, self.host, self.port, self.mailbox)

    def connect(self):
        self.disconnect()
        self.conn = imaplib.IMAP4_SSL(self.host, self.port, timeout=15)
        self.conn.sock.settimeout(15)
        self.conn.capability()
        time.sleep(0.5)
        self.conn.login(self.user, self.password)
        self.conn.select(self.mailbox)
        logger.info("Connected to IMAP %s as %s", self.host, self.user)

    def fetch_unseen(self) -> list[EmailPayload]:
        self.connect()
        logger.info("Searching for UNSEEN emails...")
        from datetime import datetime, timedelta
        since_date = (datetime.utcnow() - timedelta(hours=int(os.getenv("IMAP_FETCH_HOURS", "24")))).strftime("%d-%b-%Y")
        try:
            result, data = self.conn.search(None, f'(UNSEEN SINCE {since_date})')
            logger.info("IMAP search completed: %s with %d IDs", result, len(data[0].split()) if data and data[0] else 0)
        except imaplib.IMAP4.abort as e:
            logger.error("IMAP connection aborted during search: %s", e)
            self.conn = None
            return []
        except (socket.timeout, TimeoutError) as e:
            logger.error("IMAP search timed out: %s", e)
            self.conn = None
            return []
        except Exception as e:
            logger.error("IMAP search failed: %s", e)
            self.conn = None
            return []
        if result != "OK":
            logger.warning("IMAP search failed: %s", result)
            return []

        ids = data[0].split()
        if not ids:
            logger.debug("No unseen emails found")
            return []

        max_fetch = int(os.getenv("IMAP_MAX_FETCH", "25"))
        if len(ids) > max_fetch:
            logger.info("Limiting fetch to %d of %d unseen emails", max_fetch, len(ids))
            ids = ids[:max_fetch]

        payloads: list[EmailPayload] = []
        for idx, mid in enumerate(ids):
            try:
                logger.debug("Fetching email %d/%d: %s", idx + 1, len(ids), mid)
                result, data = self.conn.fetch(mid, "(RFC822)")
                if result != "OK":
                    continue
                raw_email = data[0][1]
                parsed = email.message_from_bytes(raw_email)
                payload = self._parse_email(parsed)
                if payload:
                    payloads.append(payload)
                self.conn.store(mid, "+FLAGS", "\\Seen")
            except socket.timeout:
                logger.error("Timeout fetching email %s, reconnecting...", mid)
                self.conn = None
                break
            except imaplib.IMAP4.abort as e:
                logger.error("IMAP connection lost fetching email %s: %s", mid, e)
                self.conn = None
                break
            except Exception as e:
                logger.error("Failed to fetch email %s: %s", mid, e)

        logger.info("Fetched %d unseen emails", len(payloads))
        return payloads

    def _parse_email(self, msg: email.message.Message) -> EmailPayload | None:
        message_id = msg.get("Message-ID", "")
        sender = msg.get("From", "")
        subject = msg.get("Subject", "")
        date_str = msg.get("Date")
        received_at = parsedate_to_datetime(date_str) if date_str else None

        body_text = self._extract_body(msg)
        if body_text:
            body_text = body_text[:self.max_body_chars]

        if not message_id:
            message_id = f"no-id-{sender}-{subject}"

        return EmailPayload(
            message_id=message_id,
            sender=sender,
            subject=subject,
            body_text=body_text or "",
            received_at=received_at,
        )

    def _extract_body(self, msg: email.message.Message) -> str | None:
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                if ctype == "text/plain":
                    try:
                        return self._decode_payload(part)
                    except Exception:
                        continue
            for part in msg.walk():
                ctype = part.get_content_type()
                if ctype == "text/html":
                    try:
                        raw = self._decode_payload(part)
                        return self.sanitize_body(raw, "text/html")
                    except Exception:
                        continue
            return None
        else:
            ctype = msg.get_content_type()
            raw = self._decode_payload(msg)
            if not raw:
                return None
            if ctype == "text/html":
                return self.sanitize_body(raw, "text/html")
            return raw

    def _decode_payload(self, part: email.message.Message) -> str | None:
        payload = part.get_payload(decode=True)
        if payload is None:
            return None
        charset = part.get_content_charset() or "utf-8"
        try:
            return payload.decode(charset, errors="replace")
        except (LookupError, UnicodeDecodeError):
            return payload.decode("utf-8", errors="replace")

    def sanitize_body(self, body: str, content_type: str = "text/plain") -> str:
        if content_type == "text/html":
            soup = BeautifulSoup(body, "lxml")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = soup.get_text(separator=" ", strip=True)
        else:
            text = body
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return " ".join(lines)

    def disconnect(self):
        if self.conn:
            try:
                self.conn.close()
                self.conn.logout()
            except Exception:
                pass
            self.conn = None
            logger.info("Disconnected from IMAP")
