#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_OUTPUT="$(mktemp -d)"
trap 'rm -rf "$TEMP_OUTPUT"' EXIT
cd "$ROOT"
./node_modules/.bin/tsc \
  src/lib/chat/streamProtocol.ts \
  src/lib/prompts/index.ts \
  --target ES2020 \
  --module commonjs \
  --moduleResolution node \
  --esModuleInterop \
  --skipLibCheck \
  --types node \
  --outDir "$TEMP_OUTPUT"
CHAT_STREAM_TEST_MODULES="$TEMP_OUTPUT" node --test tests/chat-stream-protocol.test.cjs
