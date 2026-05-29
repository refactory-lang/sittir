#!/usr/bin/env bash
# SubagentStop hook — auto-initiate the sittir regen + covPass compile when a
# sub-agent left codegen source NEWER than the last regen (i.e. it edited
# packages/codegen/src/** or overrides but didn't regen, or we want the gate to
# run off the LLM loop). Non-blocking: launches the compile in the BACKGROUND so
# it never hits the hook timeout. The controller reads .git/sittir-gate.log /
# .git/sittir-gate.result to gate covPass and revert on regression.
#
# Self-guards so it is a fast no-op for every sub-agent that didn't touch codegen.
set -euo pipefail

repo="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$repo" ] || exit 0
cd "$repo" || exit 0

manifest="packages/python/.sittir/generated.manifest.json"
[ -f "$manifest" ] || exit 0

# Staleness check (mtime): any codegen source .ts newer than the last regen?
stale="$(find packages/codegen/src -name '*.ts' -newer "$manifest" 2>/dev/null | head -1 || true)"
[ -n "$stale" ] || exit 0   # codegen unchanged since last regen → nothing to compile

# Don't stack runs.
lock=".git/sittir-gate.lock"
[ -f "$lock" ] && { echo "sittir: compile gate already running — skipping" >&2; exit 0; }

# Fire-and-forget the regen + native covPass gate. Captures per-grammar covPass
# into .git/sittir-gate.result for the controller to gate against the baseline.
nohup bash -c '
  set +e
  touch .git/sittir-gate.lock
  : > .git/sittir-gate.log
  : > .git/sittir-gate.result
  # Regen all three so the artifacts (incl. test-fixtures.json) match the codegen.
  for g in rust python typescript; do
    echo "=== regen $g ===" >> .git/sittir-gate.log
    pnpm exec tsx packages/cli/src/cli.ts gen --grammar "$g" --all --output "packages/$g/src" >> .git/sittir-gate.log 2>&1
  done
  # Full native gate via the canonical script. Capture covPass + RT pass + AST match
  # (AST match is the real fidelity metric — covPass alone can hold while AST regresses).
  echo "=== pnpm run validate:native ===" >> .git/sittir-gate.log
  pnpm run validate:native 2>&1 \
    | tee -a .git/sittir-gate.log \
    | grep -E "covPass|read-render-parsePass|read-render-parseAstMatchPass" >> .git/sittir-gate.result
  echo "DONE $(date)" >> .git/sittir-gate.result
  rm -f .git/sittir-gate.lock
' >/dev/null 2>&1 &

echo "sittir: codegen newer than last regen → regen+covPass gate launched in background. Result: .git/sittir-gate.result (log: .git/sittir-gate.log)" >&2
exit 0
