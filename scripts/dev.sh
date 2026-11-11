#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

find_free_port() {
  python3 - "$1" "$2" <<'PY'
import socket
import sys

start, end = map(int, sys.argv[1:3])
for candidate in range(start, end + 1):
    with socket.socket() as sock:
        try:
            sock.bind(("127.0.0.1", candidate))
        except OSError:
            continue
    print(candidate)
    break
else:
    raise SystemExit(f"No free port found in range {start}-{end}")
PY
}

BACKEND_PORT="$(find_free_port 8011 8099)"
FRONTEND_PORT="$(find_free_port 5174 5249)"
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}"

if [[ ! -x "$ROOT_DIR/backend/.venv/bin/uvicorn" ]]; then
  echo "Backend virtualenv is missing. Create it with:"
  echo "  python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt"
  exit 1
fi

if [[ ! -x "$ROOT_DIR/frontend/node_modules/.bin/vite" ]]; then
  echo "Frontend dependencies are missing. Install them with:"
  echo "  cd frontend && npm ci"
  exit 1
fi

cleanup() {
  if [[ -n "${FRONTEND_PID:-}" ]]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  if [[ -n "${BACKEND_PID:-}" ]]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT TERM

echo "PayPilot is starting:"
echo "  Frontend: ${FRONTEND_URL}"
echo "  Backend:  ${BACKEND_URL}"
echo "  API docs: ${BACKEND_URL}/docs"
echo "Press Ctrl+C to stop both servers."

export CORS_ORIGINS="$FRONTEND_URL"
(cd "$ROOT_DIR" && "$ROOT_DIR/backend/.venv/bin/uvicorn" app.main:app \
  --app-dir "$ROOT_DIR/backend" --reload --host 127.0.0.1 --port "$BACKEND_PORT") &
BACKEND_PID=$!

export VITE_API_BASE_URL="${BACKEND_URL}/api/v1"
(cd "$ROOT_DIR/frontend" && npm run dev -- \
  --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
