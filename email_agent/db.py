import sqlite3
import threading
from datetime import datetime
from .models import EmailRecord, StatsResponse


class EmailStore:
    def __init__(self, db_path: str = "email_agent.db"):
        self.db_path = db_path
        self._lock = threading.Lock()
        self._conn = None
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self._conn.row_factory = sqlite3.Row
            self._conn.execute("PRAGMA journal_mode=WAL")
        return self._conn

    def _init_db(self):
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS email_records (
                message_id TEXT PRIMARY KEY,
                sender TEXT NOT NULL,
                subject TEXT NOT NULL,
                body_text TEXT NOT NULL,
                received_at TEXT,
                processed_at TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                guardrail_safe INTEGER,
                guardrail_reason TEXT,
                classification TEXT,
                confidence REAL
            )
        """)
        conn.commit()

    def store_email(self, record: EmailRecord) -> EmailRecord:
        with self._lock:
            conn = self._get_conn()
            conn.execute("""
                INSERT OR REPLACE INTO email_records
                (message_id, sender, subject, body_text, received_at, processed_at,
                 status, guardrail_safe, guardrail_reason, classification, confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.message_id,
                record.sender,
                record.subject,
                record.body_text,
                record.received_at.isoformat() if record.received_at else None,
                record.processed_at.isoformat() if record.processed_at else None,
                record.status,
                int(record.guardrail_safe) if record.guardrail_safe is not None else None,
                record.guardrail_reason,
                record.classification,
                record.confidence,
            ))
            conn.commit()
        return record

    def get_email(self, message_id: str) -> EmailRecord | None:
        conn = self._get_conn()
        row = conn.execute(
            "SELECT * FROM email_records WHERE message_id = ?", (message_id,)
        ).fetchone()
        if row is None:
            return None
        return self._row_to_record(row)

    def get_all_emails(
        self, page: int = 1, page_size: int = 50, status: str | None = None
    ) -> tuple[list[EmailRecord], int]:
        conn = self._get_conn()
        offset = (page - 1) * page_size

        if status:
            count_row = conn.execute(
                "SELECT COUNT(*) FROM email_records WHERE status = ?", (status,)
            ).fetchone()
            total = count_row[0]
            rows = conn.execute(
                "SELECT * FROM email_records WHERE status = ? ORDER BY processed_at DESC LIMIT ? OFFSET ?",
                (status, page_size, offset),
            ).fetchall()
        else:
            count_row = conn.execute("SELECT COUNT(*) FROM email_records").fetchone()
            total = count_row[0]
            rows = conn.execute(
                "SELECT * FROM email_records ORDER BY processed_at DESC LIMIT ? OFFSET ?",
                (page_size, offset),
            ).fetchall()

        return [self._row_to_record(r) for r in rows], total

    def get_stats(self) -> StatsResponse:
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT status, COUNT(*) as cnt FROM email_records GROUP BY status"
        ).fetchall()
        stats = StatsResponse()
        for row in rows:
            key = row["status"]
            count = row["cnt"]
            if key == "safe":
                stats.safe = count
            elif key == "phishing":
                stats.phishing = count
            elif key == "security_violation":
                stats.security_violation = count
            stats.total += count
        return stats

    @staticmethod
    def _row_to_record(row: sqlite3.Row) -> EmailRecord:
        raw = dict(row)
        received = raw.get("received_at")
        processed = raw.get("processed_at")
        return EmailRecord(
            message_id=raw["message_id"],
            sender=raw["sender"],
            subject=raw["subject"],
            body_text=raw["body_text"],
            received_at=datetime.fromisoformat(received) if received else None,
            processed_at=datetime.fromisoformat(processed) if processed else None,
            status=raw["status"],
            guardrail_safe=bool(raw["guardrail_safe"]) if raw["guardrail_safe"] is not None else None,
            guardrail_reason=raw["guardrail_reason"],
            classification=raw["classification"],
            confidence=raw["confidence"],
        )
