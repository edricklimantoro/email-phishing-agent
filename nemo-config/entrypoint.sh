#!/bin/sh
sed -i "s|\${OLLAMA_BASE_URL}|${OLLAMA_BASE_URL}|g" /app/config.yml
exec nemoguardrails server --port 8000 --config .
