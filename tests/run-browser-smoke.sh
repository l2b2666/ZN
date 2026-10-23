#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ZN_TEST_DATA="$(mktemp -d /tmp/zn-browser-XXXXXX)"
ZN_TEST_PORT="${ZN_TEST_PORT:-3101}"
ZN_TEST_PID=''
cleanup() {
  if [[ -n "$ZN_TEST_PID" ]]; then kill "$ZN_TEST_PID" 2>/dev/null || true; wait "$ZN_TEST_PID" 2>/dev/null || true; fi
  rm -rf "$ZN_TEST_DATA"
}
trap cleanup EXIT
npm run build > "$ZN_TEST_DATA/build.log" 2>&1 || { cat "$ZN_TEST_DATA/build.log"; exit 1; }
DATA_DIR="$ZN_TEST_DATA" PORT="$ZN_TEST_PORT" NODE_ENV=production node server/index.js > "$ZN_TEST_DATA/server.log" 2>&1 &
ZN_TEST_PID=$!
for n in {1..40}; do
  if curl --silent --fail "http://127.0.0.1:$ZN_TEST_PORT/api/health" > /dev/null; then break; fi
  sleep 0.2
done
DATA_DIR="$ZN_TEST_DATA" ZN_TEST_URL="http://127.0.0.1:$ZN_TEST_PORT" python tests/browser-smoke.py
