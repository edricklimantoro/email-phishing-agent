# Email Security Agent

A production-ready, defense-in-depth email security system that combines deterministic prompt injection guardrails with probabilistic LLM-based phishing detection. Instead of relying on traditional heuristic filters or static link analysis, this agent analyzes the **semantic intent** of email text to identify sophisticated social engineering and weaponized language. The architecture layers **NeMo Guardrails** (input sanitization) with a **fine-tuned LLaMA model** (phishing classification) orchestrated through **n8n** and surfaced via a **React dashboard**.

## Architecture & Data Flow

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Email Inbox │────▶│  n8n Orchestrator │────▶│ NeMo Guardrails     │────▶│ Fine-tuned LLaMA  │
│  (IMAP/OAuth)│     │  (Ingestion &     │     │  (Prompt Injection  │     │  (Phishing vs.    │
│              │     │   Sanitization)   │     │   Detection)        │     │   Safe Inference) │
└──────────────┘     └──────────────────┘     └─────────────────────┘     └──────────────────┘
                                                         │                       │
                                                         │ (Injection Detected)  │
                                                         ▼                       ▼
                                              ┌────────────────────┐  ┌────────────────────┐
                                              │ "Security          │  │ Phishing / Safe    │
                                              │  Exception"        │  │ Classification     │
                                              └────────┬───────────┘  └────────┬───────────┘
                                                       │                       │
                                                       └───────┬───────────────┘
                                                               ▼
                                                     ┌──────────────────┐
                                                     │  React Dashboard │
                                                     │  (1-min Polling) │
                                                     └──────────────────┘
```

1. **Email Ingestion** — n8n monitors a configured mailbox via IMAP/OAuth2, sanitizes raw HTML to plain text, and extracts a structured JSON payload (`message_id`, `sender`, `subject`, `body_text`).

2. **Guardrail Checkpoint** — The payload is sent to the NeMo Guardrails API for prompt injection analysis (Colang scripts detect patterns like `"ignore previous instructions"` or `"system override"`).
   - **Injection Detected** → Pipeline halts. The email is labeled `SECURITY_VIOLATION_DETECTED` and routed directly to the dashboard as a Security Exception.
   - **Safe** → Payload proceeds to the LLM inference stage.

3. **LLM Inference** — Clean email text is forwarded via HTTP to a fine-tuned LLaMA model (hosted on Ollama) for probabilistic binary classification: **Phishing** or **Safe**.

4. **Dashboard Update** — The final verdict and metadata are POSTed to the React frontend, which refreshes every 60 seconds to display real-time metrics and email summaries.

## Repository Structure

```text
.
├── nemo-config/
│   ├── bot.co              # Colang script defining prompt injection flows
│   ├── config.yml          # NeMo model config (Ollama / OpenAI backend)
│   └── Dockerfile          # Docker build for NeMo Guardrails server
├── workflows/
│   └── email_analysis.json # Exported n8n workflow (IMAP ingestion → API calls → dashboard)
├── docker-compose.yml      # Multi-container setup (n8n + nemo-guardrails)
├── .env.example            # Template for Gmail OAuth credentials & API tokens
├── .gitignore              # Files excluded from version control
└── README.md               # This file
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

### React Dashboard (frontend, separate repository)

Polls the backend API every 60 seconds. Displays:
- Total emails analyzed
- Classification breakdown (Safe / Phishing / Security Exception)
- Per-email detail view with raw text, LLM confidence score, and guardrail status

