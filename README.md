# Email Security Agent

A production-ready, defense-in-depth email security system that combines deterministic prompt injection guardrails with probabilistic LLM-based phishing detection. Instead of relying on traditional heuristic filters or static link analysis, this agent analyzes the **semantic intent** of email text to identify sophisticated social engineering and weaponized language. The architecture layers **NeMo Guardrails** (input sanitization) with a **fine-tuned LLaMA model** (phishing classification) orchestrated through **n8n** and surfaced via a **React dashboard**.

## Architecture & Data Flow

```
┌──────────────┐
│  Email Inbox │────▶ Email Agent (Python) ───▶ NeMo Guardrails ───▶ Ollama LLaMA ───▶ SQLite Store ───▶ React Dashboard
│  (IMAP/OAuth)│       ┌────────────────┐         ┌────────────────┐      ┌──────────────┐
│              │       │ IMAP Poller    │         │ Prompt Inj.   │      │ Phishing     │
│              │       │ HTML Sanitizer │         │ Detection      │      │ Classification│
│              │       │ FastAPI Server │         └────────────────┘      └──────────────┘
└──────────────┘       └────────────────┘
        │
        └────▶ n8n (alternative visual orchestration)
                    │
                    ├──▶ NeMo Guardrails
                    └──▶ Ollama LLaMA
                         │
                         ▼
                    email-agent API
                         │
                         ▼
                   React Dashboard (polls every 60s)
```

The system has **two parallel ingestion paths**:

1. **Email Agent (Python)** — Primary active runtime. Continuously polls IMAP, runs the guardrail → LLM pipeline, stores results in SQLite, and serves them via FastAPI.

2. **n8n Workflow** — Alternative visual orchestration. Monitors the same mailbox, calls the same guardrail/LLM services, and POSTs results to the email-agent API.

**Pipeline stages:**
- **Ingestion** — Email fetched via IMAP, HTML sanitized to plain text
- **Guardrail Check** — NeMo Guardrails scans for prompt injection. If detected → `SECURITY_VIOLATION_DETECTED`
- **LLM Classification** — Clean text sent to LLaMA (Ollama) → `phishing` or `safe`
- **Storage & API** — Results stored in SQLite, exposed via REST API
- **Dashboard** — React frontend polls `/api/stats` and `/api/emails` every 60s

## Repository Structure

```text
.
├── email_agent/
│   ├── __init__.py
│   ├── api.py              # FastAPI REST server
│   ├── db.py               # SQLite storage
│   ├── guardrail_client.py # NeMo Guardrails HTTP client
│   ├── imap_client.py      # IMAP polling & HTML sanitization
│   ├── llm_client.py       # Ollama LLM classification client
│   ├── main.py             # Agent orchestrator loop
│   ├── models.py           # Pydantic data models
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── dashboard/              # React frontend (see its own section)
├── nemo-config/
│   ├── bot.co              # Colang script defining prompt injection flows
│   ├── config.yml          # NeMo model config (Ollama / OpenAI backend)
│   └── Dockerfile          # Docker build for NeMo Guardrails server
├── workflows/
│   └── email_analysis.json # Exported n8n workflow
├── docker-compose.yml      # Multi-container setup (all services)
├── .env.example            # Environment variable template
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites

- Docker & Docker Compose v2
- Ollama (with a compatible model pulled, e.g., `qwen3.6:35b-a3b`)


### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/email-security-agent.git
cd email-security-agent

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your Gmail credentials and Ollama endpoint

# 3. Start the infrastructure
docker compose up -d

# 4. Import the n8n workflow
#    - Open http://localhost:5678
#    - Create an admin account (first-run only)
#    - Settings → Import → Select workflows/email_analysis.json
#    - Update the HTTP Request nodes to point to your Guardrail & LLM APIs
#    - Activate the workflow
```

### Exporting Workflow Changes to Git

The n8n editor lets you modify the pipeline visually. To version-control those changes:

```bash
# 1. Open http://localhost:5678 and edit your workflow

# 2. Export the updated workflow as JSON:
#    Workflow → Download → JSON File
#    Save it to workflows/email_analysis.json (overwrite the existing file)

# 3. Commit and push:
git add workflows/email_analysis.json
git commit -m "update n8n workflow: <describe change>"
git push
```

On the next pull, teammates import the updated JSON via **Settings → Import** in their own n8n instance. This keeps the pipeline definition in sync without sharing the n8n database.

### Environment Variables

| Variable            | Description                              | Example                              |
|---------------------|------------------------------------------|--------------------------------------|
| `OLLAMA_BASE_URL`   | Base URL of the Ollama inference host    | `http://host.docker.internal:11434`  |
| `LLM_MODEL`         | Ollama model name                        | `qwen3.6:35b-a3b`                    |

## Key Components

### NeMo Guardrails (`nemo-config/`)

Detects prompt injection attempts before they reach the LLM. The Colang script in `bot.co` defines attack patterns as canonical forms:

```
define user express prompt injection
  "ignore previous instructions"
  "system override"

define flow
  user express prompt injection
  bot respond "SECURITY_VIOLATION_DETECTED"
```

When matched, the pipeline returns a `SECURITY_VIOLATION_DETECTED` response, the email is quarantined, and the dashboard displays it as a **Security Exception**.

### n8n Orchestrator (`docker-compose.yml`)

The central workflow engine. The exported pipeline in `workflows/email_analysis.json` performs:
- IMAP email polling on a configurable cron schedule
- HTML-to-text sanitization
- Sequential HTTP calls to Guardrails → LLM → Dashboard
- Error handling with retry logic

### LLM Inference (external, via Ollama)

A LLaMA-based model fine-tuned (using LLaMA-Factory) on curated phishing corpora. Accepts clean text and returns a `{"classification": "phishing" | "safe", "confidence": 0.0–1.0}` JSON response.

### React Dashboard (`dashboard/`, included)

Built with Vite + React 18 + TypeScript + Recharts. Polls the agent API every 60 seconds. Displays:
- Total emails analyzed
- Classification breakdown (Safe / Phishing / Security Exception)
- Per-email detail view with raw text, LLM confidence score, and guardrail status

---

## Email Agent (`email_agent/`)

A Python-based active runtime that continuously monitors a mailbox and processes emails through the security pipeline. Can run alongside or independently of n8n.

### Components

| File | Purpose |
|------|---------|
| `main.py` | Agent orchestrator — poll loop, email processing pipeline |
| `imap_client.py` | IMAP connection, unseen email fetching, HTML sanitization |
| `guardrail_client.py` | HTTP client for NeMo Guardrails (with circuit breaker) |
| `llm_client.py` | HTTP client for Ollama LLaMA classification (with retry) |
| `db.py` | SQLite storage with WAL mode, thread-safe |
| `api.py` | FastAPI REST server — serves stats, email records, ingestion endpoint |
| `models.py` | Pydantic v2 data models |

### Pipeline (per email)

1. **IMAP Poll** — connect, fetch UNSEEN, mark as seen
2. **NeMo Guardrails** — check for prompt injection. If detected → `security_violation`
3. **LLM Classification** — if guardrail passes, classify as `phishing` or `safe`
4. **Store** — write result to SQLite, expose via API

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/emails` | Store an email record (used by n8n) |
| `GET` | `/api/emails` | List emails (?page, ?page_size, ?status) |
| `GET` | `/api/emails/:id` | Single email detail |
| `GET` | `/api/stats` | Aggregate counts (total, safe, phishing, violations) |

