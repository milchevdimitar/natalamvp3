
#!/usr/bin/env bash

# NATALA — Expo Go Wireless Startup Benchmark
# Modes: LAN / Tunnel
# Requires: bash, node, npx, adb, curl
#
# Usage:
#   bash benchmark.sh lan 10
#   bash benchmark.sh tunnel 10
#
# Phone must already be connected through wireless ADB.

set -Eeuo pipefail

MODE="${1:-lan}"
ITERATIONS="${2:-10}"
PORT="${PORT:-8081}"
EXPO_PKG="host.exp.exponent"
RESULTS_DIR="benchmark-results"

if [[ "$MODE" != "lan" && "$MODE" != "tunnel" ]]; then
  echo "Usage: bash benchmark.sh lan|tunnel [iterations]"
  exit 1
fi

if ! [[ "$ITERATIONS" =~ ^[1-9][0-9]*$ ]]; then
  echo "Iterations must be a positive integer."
  exit 1
fi

for cmd in node npx adb curl; do
  command -v "$cmd" >/dev/null || {
    echo "Missing dependency: $cmd"
    exit 1
  }
done

[[ -f package.json ]] || {
  echo "Run from Expo project root."
  exit 1
}

mkdir -p "$RESULTS_DIR"

STAMP="$(date +%Y%m%d_%H%M%S)"
CSV="$RESULTS_DIR/natala_${MODE}_${STAMP}.csv"
LOG="$RESULTS_DIR/metro_${MODE}_${STAMP}.log"

echo "iteration,mode,device,elapsed_ms,status,notes" > "$CSV"

now_ms() {
  node -e 'console.log(Number(process.hrtime.bigint()/1000000n))'
}

# Select one authorized wireless ADB device.
mapfile -t DEVICES < <(
  adb devices |
    awk 'NR>1 && $2=="device" && $1 ~ /:/ {print $1}'
)

if [[ "${#DEVICES[@]}" -ne 1 ]]; then
  echo "Exactly one wireless ADB device is required."
  adb devices
  exit 1
fi

DEVICE="${DEVICES[0]}"
echo "Device: $DEVICE"

METRO_PID=""

cleanup() {
  if [[ -n "$METRO_PID" ]]; then
    kill "$METRO_PID" 2>/dev/null || true
    wait "$METRO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Never kill unrelated processes on port 8081.
if curl -fsS --max-time 1 \
  "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
  echo "Port $PORT is already in use."
  echo "Stop the existing Metro server manually."
  exit 1
fi

echo "Starting Expo in $MODE mode..."

npx expo start "--${MODE}" \
  --port "$PORT" > "$LOG" 2>&1 &

METRO_PID=$!

READY=0

for ((i=0; i<120; i++)); do
  if curl -fsS --max-time 1 \
    "http://127.0.0.1:${PORT}/status" \
    2>/dev/null | grep -q "packager-status:running"; then
    READY=1
    break
  fi

  if ! kill -0 "$METRO_PID" 2>/dev/null; then
    echo "Metro exited. Check $LOG"
    exit 1
  fi

  sleep 0.5
done

if [[ "$READY" -ne 1 ]]; then
  echo "Metro did not become ready."
  exit 1
fi

# Expo CLI may choose a dynamic URL, particularly in Tunnel mode.
# The developer must provide the exact URL printed by Expo.
echo ""
echo "Copy the Expo Go URL printed by Expo CLI."
echo "For LAN it normally starts with exp://"
echo "For Tunnel use the exact URL shown in the terminal."
echo ""

read -rp "Expo URL: " EXPO_URL

if [[ ! "$EXPO_URL" =~ ^exp(s)?:// ]]; then
  echo "Invalid Expo URL."
  exit 1
fi

echo ""
echo "Starting $ITERATIONS measurements..."
echo ""

for ((n=1; n<=ITERATIONS; n++)); do
  echo "Run $n / $ITERATIONS"

  adb -s "$DEVICE" shell am force-stop "$EXPO_PKG" \
    >/dev/null 2>&1 || true

  sleep 1

  # Clear logcat before each run.
  adb -s "$DEVICE" logcat -c >/dev/null 2>&1 || true

  START="$(now_ms)"

  if ! adb -s "$DEVICE" shell am start \
    -a android.intent.action.VIEW \
    -d "$EXPO_URL" \
    "$EXPO_PKG" >/dev/null 2>&1; then

    echo "$n,$MODE,$DEVICE,,launch_error,adb_start_failed" >> "$CSV"
    continue
  fi

  STATUS="timeout"
  ELAPSED=""
  NOTES="no_js_start_marker"

  # Look for React Native JS application startup.
  # This is NOT proof of completed visual rendering.
  for ((j=0; j<300; j++)); do
    if adb -s "$DEVICE" logcat -d \
      2>/dev/null | grep -Eq 'Running "[^"]+"'; then

      END="$(now_ms)"
      ELAPSED="$((END-START))"
      STATUS="ok"
      NOTES="js_start_marker"
      break
    fi

    sleep 0.2
  done

  echo "$n,$MODE,$DEVICE,$ELAPSED,$STATUS,$NOTES" >> "$CSV"

  echo "  $STATUS ${ELAPSED:-N/A} ms"
  sleep 2
done

echo ""
echo "Benchmark complete."
echo "CSV: $CSV"
echo "Metro log: $LOG"
echo ""
echo "Metric: ADB launch to observed JS startup marker."
echo "Not a visual time-to-first-render measurement."
