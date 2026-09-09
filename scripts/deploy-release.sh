#!/usr/bin/env bash
set -euo pipefail
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${PM2_APP_NAME:?PM2_APP_NAME is required}"
: "${RELEASE_ARCHIVE:?RELEASE_ARCHIVE is required}"
APP_PORT="${APP_PORT:-3000}"
CHECK_PORT="${CHECK_PORT:-3107}"
[[ "$DEPLOY_PATH" =~ ^/[A-Za-z0-9_./-]+$ && "$DEPLOY_PATH" != / ]]
[[ "$PM2_APP_NAME" =~ ^[A-Za-z0-9_.-]+$ ]]
[[ "$APP_PORT" =~ ^[0-9]+$ && "$CHECK_PORT" =~ ^[0-9]+$ && "$APP_PORT" != "$CHECK_PORT" ]]
command -v pm2 >/dev/null
test -s "$RELEASE_ARCHIVE"
test -s "$DEPLOY_PATH/.env.local"
if [ -e "$DEPLOY_PATH/current" ] && [ ! -L "$DEPLOY_PATH/current" ]; then
  echo "Refusing to replace a non-symlink current directory" >&2
  exit 1
fi
old_link="$(readlink "$DEPLOY_PATH/current" || true)"
old_cwd="$(pm2 jlist | node -e 'let raw="";process.stdin.on("data",d=>raw+=d);process.stdin.on("end",()=>{const p=JSON.parse(raw).find(p=>p.name===process.argv[1]);process.stdout.write(p?.pm2_env?.pm_cwd||"")})' "$PM2_APP_NAME")"
release_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
release="$DEPLOY_PATH/releases/$release_id"
mkdir -p "$release"
tar -xzf "$RELEASE_ARCHIVE" -C "$release"
ln -s "$DEPLOY_PATH/.env.local" "$release/.env.local"
cd "$release"
npm ci --no-audit --no-fund
test -f .next/BUILD_ID
quant_path="$DEPLOY_PATH/quant_service"
quant_changed=false
if [ -f "$quant_path/api/server.py" ] && [ -x "$quant_path/venv/bin/python" ]; then
  "$quant_path/venv/bin/python" -m py_compile "$release/quant_service/api/server.py"
  cp -p "$quant_path/api/server.py" "$release/quant-server.previous.py"
fi

health() {
  curl --fail --silent --max-time 5 "http://127.0.0.1:$1/api-health" |
    node -e 'let raw="";process.stdin.on("data",d=>raw+=d);process.stdin.on("end",()=>{try{const j=JSON.parse(raw);process.exit(j.status==="ready"&&j.release===process.argv[1]?0:1)}catch{process.exit(1)}})' "$release_id"
}
RELEASE_ID="$release_id" node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port "$CHECK_PORT" > "$release/preflight.log" 2>&1 &
check_pid=$!
cleanup() { kill "$check_pid" 2>/dev/null || true; }
trap cleanup EXIT
ready=false
for attempt in $(seq 1 30); do
  kill -0 "$check_pid" 2>/dev/null || break
  if health "$CHECK_PORT"; then ready=true; break; fi
  sleep 1
done
if [ "$ready" != true ]; then
  echo "Preflight failed; existing application was not changed. Check schema migration and preflight.log." >&2
  exit 1
fi
cleanup
wait "$check_pid" || true
trap - EXIT

start_app() {
  RELEASE_ID="$release_id" pm2 start "$1/node_modules/next/dist/bin/next" --name "$PM2_APP_NAME" --cwd "$1" --interpreter node -- start --hostname 127.0.0.1 --port "$APP_PORT"
}
if [ -n "$old_cwd" ]; then pm2 delete "$PM2_APP_NAME"; fi
live_ready=false
if start_app "$release"; then
  for attempt in $(seq 1 15); do
    if health "$APP_PORT"; then
      live_ready=true
      break
    fi
    sleep 1
  done
fi
if [ "$live_ready" = true ] && [ -f "$release/quant-server.previous.py" ]; then
  quant_changed=true
  live_ready=false
  cp "$release/quant_service/api/server.py" "$quant_path/api/server.py"
  if pm2 restart quant-api; then
    for attempt in $(seq 1 30); do
      if curl --fail --silent --max-time 3 http://127.0.0.1:8100/health >/dev/null; then
        live_ready=true
        break
      fi
      sleep 1
    done
  fi
fi
if [ "$live_ready" = true ]; then
  ln -s "$release" "$DEPLOY_PATH/current.next-$$"
  mv -Tf "$DEPLOY_PATH/current.next-$$" "$DEPLOY_PATH/current"
  pm2 save
  echo "Release $release_id is healthy"
  exit 0
fi
echo "New process failed health checks; restoring the previous application" >&2
if [ "$quant_changed" = true ]; then
  cp -p "$release/quant-server.previous.py" "$quant_path/api/server.py"
  pm2 restart quant-api || true
fi
pm2 delete "$PM2_APP_NAME" || true
if [ -n "$old_cwd" ]; then start_app "$old_cwd"; pm2 save; fi
if [ -n "$old_link" ]; then
  ln -s "$old_link" "$DEPLOY_PATH/current.rollback-$$"
  mv -Tf "$DEPLOY_PATH/current.rollback-$$" "$DEPLOY_PATH/current"
fi
exit 1
