import json
import os
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware

from .db import EmailStore
from .main import EmailAgent
from .models import EmailListResponse, EmailRecord, ImapSettings, StatsResponse

app = FastAPI(title="Email Security Agent API")

origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
cors_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = EmailStore()
agent = EmailAgent()

_API_KEY = os.getenv("API_KEY", "")
_SETTINGS_FILE = Path(os.getenv("SETTINGS_FILE", "/data/imap_settings.json"))


def _load_settings() -> ImapSettings | None:
    if _SETTINGS_FILE.exists():
        try:
            data = json.loads(_SETTINGS_FILE.read_text())
            return ImapSettings(**data)
        except Exception as e:
            print(f"Failed to load settings: {e}")
    return None


def _save_settings(settings: ImapSettings):
    _SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    _SETTINGS_FILE.write_text(settings.model_dump_json(indent=2))


def verify_auth(authorization: str | None = Header(None)):
    if not _API_KEY:
        return
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or token != _API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")


@app.on_event("startup")
async def startup():
    saved = _load_settings()
    if saved:
        agent.configure_imap(saved)
    agent.start()


@app.on_event("shutdown")
async def shutdown():
    agent.stop()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/settings", response_model=ImapSettings, dependencies=[Depends(verify_auth)])
def get_settings():
    saved = _load_settings()
    if saved:
        return saved
    return ImapSettings(
        host=os.getenv("IMAP_HOST", "imap.gmail.com"),
        port=int(os.getenv("IMAP_PORT", "993")),
        user=os.getenv("IMAP_USER", ""),
        password=os.getenv("IMAP_PASS", ""),
        mailbox=os.getenv("IMAP_MAILBOX", "INBOX"),
    )


@app.post("/api/settings", dependencies=[Depends(verify_auth)])
def save_settings(settings: ImapSettings):
    _save_settings(settings)
    agent.configure_imap(settings)
    return {"status": "ok", "message": "IMAP settings saved"}


@app.post("/api/emails", response_model=EmailRecord, dependencies=[Depends(verify_auth)])
def create_email(record: EmailRecord):
    stored = store.store_email(record)
    return stored


@app.get("/api/stats", response_model=StatsResponse, dependencies=[Depends(verify_auth)])
def get_stats():
    return store.get_stats()


@app.get("/api/emails", response_model=EmailListResponse, dependencies=[Depends(verify_auth)])
def get_emails(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: str | None = None,
):
    emails, total = store.get_all_emails(page=page, page_size=page_size, status=status)
    return EmailListResponse(emails=emails, total=total, page=page, page_size=page_size)


@app.get("/api/emails/{message_id}", response_model=EmailRecord, dependencies=[Depends(verify_auth)])
def get_email(message_id: str):
    record = store.get_email(message_id)
    if not record:
        raise HTTPException(status_code=404, detail="Email not found")
    return record
