from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EmailPayload(BaseModel):
    message_id: str
    sender: str
    subject: str
    body_text: str
    received_at: Optional[datetime] = None


class GuardrailResult(BaseModel):
    safe: bool
    reason: str = ""


class ClassificationResult(BaseModel):
    classification: str
    confidence: float


class EmailRecord(BaseModel):
    message_id: str
    sender: str
    subject: str
    body_text: str
    received_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    status: str = "pending"
    guardrail_safe: Optional[bool] = None
    guardrail_reason: Optional[str] = None
    classification: Optional[str] = None
    confidence: Optional[float] = None


class StatsResponse(BaseModel):
    total: int = 0
    safe: int = 0
    phishing: int = 0
    security_violation: int = 0


class EmailListResponse(BaseModel):
    emails: list[EmailRecord]
    total: int
    page: int
    page_size: int


class ImapSettings(BaseModel):
    host: str = "imap.gmail.com"
    port: int = 993
    user: str
    password: str
    mailbox: str = "INBOX"
