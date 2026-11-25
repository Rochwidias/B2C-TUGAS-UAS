#!/usr/bin/env bash
# Verifikasi menyeluruh Aether Creative dalam satu perintah (alur WhatsApp,
# tanpa AI — kontrak docs/WHATSAPP-FLOW.md).
#
#   cd frontend && bash tests/verify.sh
#
# Alasan skrip ini ada: uji keamanan sengaja menabrakkan rate limit, jadi
# penghitung per-IP harus dimulai dari nol. Menjalankan suite berurutan pada
# server yang sudah lama hidup akan menghasilkan 429 palsu yang menyesatkan.
# Karena itu setiap suite mendapat server baru di port sendiri.
#
# Exit 0 hanya bila SEMUA suite lolos.

set -u

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$FRONTEND_DIR" || exit 1

PORT_BASE="${PORT_BASE:-3710}"
PY="${PY:-python3}"
# Interpreter yang benar-benar punya playwright (venv lama sudah dihapus).
PW_PY="${PW_PY:-D:/Applications/Python312/python.exe}"
SHOTS="${SHOT_DIR:-D:/hermes/cache/scratch/shots-verify}"
# Backend Express tempat rate limit in-memory disimpan — wajib di-restart tiap
# suite supaya penghitungnya mulai dari nol.
BACKEND_DIR="$(cd "$FRONTEND_DIR/../backend" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-4000}"
FAILED=0

log() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }

kill_port() {
  for pid in $(netstat -ano 2>/dev/null | grep LISTENING | grep ":$1 " | awk '{print $NF}' | sort -u); do
    MSYS_NO_PATHCONV=1 taskkill /PID "$pid" /F >/dev/null 2>&1
  done
}

# Apakah port masih didengarkan proses (cocok persis pada akhir local address).
port_busy() {
  netstat -ano 2>/dev/null | awk -v p=":$1" '$4=="LISTENING" && $2 ~ p"$" {f=1} END {exit(f ? 0 : 1)}'
}

wait_ready() {
  for _ in $(seq 1 60); do
    if curl -fsS "http://localhost:$1/api/templates" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  return 1
}

# Matikan backend lama di :4000 lalu nyalakan ulang dari dist/ — counter rate
# limit in-memory kembali bersih. Backend sengaja dibiarkan hidup setelah skrip
# selesai agar langsung bisa dipakai.
backend_restart() {
  for _ in $(seq 1 15); do
    if ! port_busy "$BACKEND_PORT"; then break; fi
    kill_port "$BACKEND_PORT"
    sleep 1
  done
  if [ -f "$BACKEND_DIR/dist/index.js" ]; then
    (cd "$BACKEND_DIR" && node dist/index.js) >/tmp/craftai-backend.log 2>&1 &
  else
    (cd "$BACKEND_DIR" && npm start) >/tmp/craftai-backend.log 2>&1 &
  fi
  if wait_ready "$BACKEND_PORT"; then
    printf 'backend :%s siap — rate limit bersih\n' "$BACKEND_PORT"
    return 0
  fi
  echo "Backend gagal siap di :$BACKEND_PORT — lihat /tmp/craftai-backend.log"
  FAILED=1
  return 1
}

# --- 1. typecheck, lint, build -------------------------------------------------
log "typecheck"
npx tsc --noEmit || FAILED=1

log "lint"
npx eslint src || FAILED=1

log "build"
npm run build || FAILED=1

# --- 2. API + keamanan (server baru: penghitung rate limit bersih) -------------
# Backend Express juga di-restart: rate limit in-memory di :4000 ikut terbakar
# saat suite keamanan, jadi tiap suite butuh penghitung yang bersih.
log "build backend"
(cd "$BACKEND_DIR" && npx tsc) || FAILED=1

PORT=$PORT_BASE
kill_port "$PORT"
backend_restart
npx next start -p "$PORT" >/tmp/craftai-api.log 2>&1 &
if wait_ready "$PORT"; then
  log "api contract (server :$PORT)"
  BASE_URL="http://localhost:$PORT" "$PY" tests/test_api.py || FAILED=1

  # Restart sebelum suite keamanan: dia menabrakkan rate limit dengan sengaja.
  kill_port "$PORT"
  backend_restart
  npx next start -p "$PORT" >/tmp/craftai-sec.log 2>&1 &
  wait_ready "$PORT" || FAILED=1

  log "keamanan & validasi (server baru :$PORT)"
  BASE_URL="http://localhost:$PORT" "$PY" tests/test_security.py || FAILED=1
else
  echo "Server gagal siap di :$PORT"; FAILED=1
fi
kill_port "$PORT"

# --- 3. E2E + fitur UI (server baru lagi) --------------------------------------
PORT=$((PORT_BASE + 1))
kill_port "$PORT"
# Suite keamanan membakar rate limit -> backend harus bersih sebelum E2E login.
backend_restart
npx next start -p "$PORT" >/tmp/craftai-e2e.log 2>&1 &
if wait_ready "$PORT"; then
  mkdir -p "$SHOTS"
  log "e2e alur utama (server :$PORT)"
  BASE_URL="http://localhost:$PORT" SHOT_DIR="$SHOTS" "$PW_PY" tests/test_e2e.py || FAILED=1

  log "fitur UX baru (server :$PORT)"
  BASE_URL="http://localhost:$PORT" "$PW_PY" tests/test_features.py || FAILED=1
else
  echo "Server gagal siap di :$PORT"; FAILED=1
fi
kill_port "$PORT"

echo
if [ "$FAILED" -eq 0 ]; then
  echo "SEMUA SUITE LOLOS"
  echo "Bukti screenshot: $SHOTS"
else
  echo "ADA SUITE GAGAL — lihat log di atas"
fi
exit "$FAILED"