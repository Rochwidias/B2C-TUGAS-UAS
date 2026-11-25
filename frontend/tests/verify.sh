#!/usr/bin/env bash
# Verifikasi suite uji Aether Creative dalam satu perintah — FRONTEND-ONLY.
#
#   cd frontend && bash tests/verify.sh
#
# Mengapa hanya test_e2e.py + test_features.py?
#   test_api.py dan test_security.py DIHAPUS: subjeknya endpoint backend
#   (/api/templates, rate limit, login server, validasi request) yang sudah
#   tidak ada sejak backend dihapus total 2026-11-25 — kontrak berlaku
#   docs/FRONTEND-ONLY.md (frontend-only, data di localStorage, tanpa API).
#
# Mengapa tanpa restart-per-suite?
#   Alasan lama (penghitung rate limit in-memory backend harus bersih per
#   suite) hilang bersama backendnya. Kini satu server Next cukup untuk semua
#   suite, tanpa restart dan tanpa backend.
#
# Skrip menyalakan sendiri server Next di depan (next start bila build sudah
# ada, next dev bila belum) dan mematikannya lagi lewat trap. Exit 0 hanya
# bila SEMUA suite lolos.
#
# Env yang bisa di-override:
#   PORT   port server Next   (default 3720)
#   PW_PY  interpreter Python dengan playwright + pytest (default python3)
#   BASE_URL  base URL uji    (default http://localhost:$PORT)
#   SHOT_DIR folder screenshot (default: folder sementara sistem)

set -u

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$TESTS_DIR/.." && pwd)"
PORT="${PORT:-3720}"
PW_PY="${PW_PY:-python3}"
BASE_URL="${BASE_URL:-http://localhost:$PORT}"
SHOTS="${SHOT_DIR:-$(mktemp -d)/aether-shots}"
SERVER_LOG="$SHOTS/server.log"
SERVER_PID=""
FAILED=0

# Matikan server apa pun yang terjadi. `next dev`/`next start` menjalankan
# proses anak yang tetap memegang port, jadi selain mematikan PID npx kita
# juga mematikan siapa pun yang mendengarkan di PORT (lsof/fuser).
kill_port_listeners() {
  if command -v lsof >/dev/null 2>&1; then
    for pid in $(lsof -ti tcp:"$1" 2>/dev/null); do kill "$pid" 2>/dev/null; done
  fi
  command -v fuser >/dev/null 2>&1 && fuser -k "$1/tcp" >/dev/null 2>&1
}

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    command -v pkill >/dev/null 2>&1 && pkill -P "$SERVER_PID" >/dev/null 2>&1
    kill "$SERVER_PID" >/dev/null 2>&1
    wait "$SERVER_PID" 2>/dev/null
  fi
  kill_port_listeners "$PORT"
}
trap cleanup EXIT INT TERM

# Cek kesiapan server; pakai curl bila ada, kalau tidak python urllib.
probe() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS -o /dev/null --max-time 3 "$1"
  else
    "$PW_PY" -c "import sys,urllib.request; urllib.request.urlopen(sys.argv[1], timeout=3)" "$1"
  fi
}

wait_ready() {
  for _ in $(seq 1 120); do
    if probe "http://localhost:$1/"; then return 0; fi
    sleep 1
  done
  return 1
}

cd "$FRONTEND_DIR" || exit 1
mkdir -p "$SHOTS"

echo "== Menyalakan server Next di :$PORT =="
if [ -f .next/BUILD_ID ]; then
  npx next start -p "$PORT" >"$SERVER_LOG" 2>&1 &
else
  npx next dev -p "$PORT" >"$SERVER_LOG" 2>&1 &
fi
SERVER_PID=$!

if ! wait_ready "$PORT"; then
  echo "Server gagal siap di :$PORT — lihat log: $SERVER_LOG"
  exit 1
fi
echo "Server siap: $BASE_URL"

echo
echo "== e2e alur utama + fitur UI (tanpa backend) =="
"$PW_PY" -m pytest -q "$TESTS_DIR/test_e2e.py" "$TESTS_DIR/test_features.py" || FAILED=1

echo
if [ "$FAILED" -eq 0 ]; then
  echo "SEMUA SUITE LOLOS"
else
  echo "ADA SUITE GAGAL — log server: $SERVER_LOG"
fi
exit "$FAILED"
