FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd -m -u 1000 agent

COPY . ./email_agent/
RUN chown -R agent:agent /app && mkdir -p /data && chown -R agent:agent /data

USER agent

EXPOSE 8001

HEALTHCHECK CMD curl -f http://localhost:8001/api/health || exit 1

CMD ["uvicorn", "email_agent.api:app", "--host", "0.0.0.0", "--port", "8001"]
