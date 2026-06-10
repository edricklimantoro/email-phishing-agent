#!/bin/sh
INTERVAL="${DASHBOARD_POLL_INTERVAL:-60000}"
cat > /usr/share/nginx/html/env.js <<EOF
window.__POLL_INTERVAL__ = $INTERVAL;
EOF
exec nginx -g 'daemon off;'
