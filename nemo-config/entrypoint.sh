#!/bin/sh
mkdir -p /app/configs/default
cp /app/config.yml /app/configs/default/config.yml
cp /app/bot.co /app/configs/default/bot.co
sed -i "s|\${OLLAMA_BASE_URL}|${OLLAMA_BASE_URL}|g" /app/configs/default/config.yml
exec nemoguardrails server --port 8000 --config /app/configs --default-config-id default
