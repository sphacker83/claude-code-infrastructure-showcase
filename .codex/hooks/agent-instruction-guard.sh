#!/bin/bash
set -u

if [ -n "${SKIP_AGENT_SPEC_GUARD:-}" ]; then
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${CODEX_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
export CODEX_PROJECT_DIR="$PROJECT_DIR"

HOOK_TS="$PROJECT_DIR/.codex/hooks/agent-instruction-guard.ts"
HOOK_DIR="$PROJECT_DIR/.codex/hooks"

if [[ ! -f "$HOOK_TS" ]]; then
  exit 0
fi

if ! command -v npx >/dev/null 2>&1; then
  exit 0
fi

INPUT_PAYLOAD=$(cat)

if [[ ! -d "$HOOK_DIR" ]]; then
  exit 0
fi

printf '%s' "$INPUT_PAYLOAD" | (cd "$HOOK_DIR" && npx tsx agent-instruction-guard.ts)
exit $?

