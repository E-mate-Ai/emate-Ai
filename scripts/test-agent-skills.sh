#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_OUTPUT="$(mktemp -d)"
trap 'rm -rf "$TEMP_OUTPUT"' EXIT
cd "$ROOT"
./node_modules/.bin/tsc \
  src/lib/agent-skills/core.ts \
  src/lib/agent-skills/registry.ts \
  src/lib/agent-skills/tools.ts \
  src/lib/agent-skills/openrouter-key.ts \
  --target ES2020 \
  --module commonjs \
  --moduleResolution node \
  --esModuleInterop \
  --skipLibCheck \
  --types node \
  --outDir "$TEMP_OUTPUT"
AGENT_SKILLS_TEST_MODULES="$TEMP_OUTPUT" node --test tests/agent-skills.test.cjs
