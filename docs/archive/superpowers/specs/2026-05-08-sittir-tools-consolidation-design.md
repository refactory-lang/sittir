# @sittir/tools — Script Consolidation Design

## Context

The sittir monorepo has ~100 developer-facing scripts scattered across three locations:

- `scratch/` — ~87 ad-hoc investigation scripts (one-off debugging)
- `packages/codegen/src/scripts/` — 15 stable diagnostic/validation tools
- `packages/codegen/scripts/` — 3 grammar inspection utilities
- `scripts/` (root) — 4 CI gate and benchmark scripts

These scripts share common patterns (load grammar → run compiler phases → inspect/validate) but have no unified entry point, no shared CLI parsing, and no discoverability. Meanwhile, `scratch/` has grown into a graveyard of hardcoded one-off probes that are superseded by `probe-kind.ts` and `probe-stages.ts`.

## Goals

1. **Consolidate** reusable scripts into a single `packages/tools/` workspace package (`@sittir/tools`)
2. **Expose** tools as CLI subcommands on the existing `sittir` CLI
3. **Delete** ~75 scratch/ scripts that are superseded by parameterized tools
4. **Promote** ~15 scratch/ scripts (consolidated into ~8 tools) that fill genuine gaps

## Non-Goals

- Changing the codegen pipeline itself
- Modifying generated output
- Touching anything Copilot is actively working on (branch `023-native-read-parity` uncommitted changes)

## Package Structure

```
packages/tools/
├── package.json          # @sittir/tools, workspace dep on @sittir/codegen + @sittir/core
├── tsconfig.json
├── src/
│   ├── index.ts          # public exports for programmatic use
│   ├── cli.ts            # subcommand dispatcher (used by main sittir CLI)
│   ├── probe/
│   │   ├── kind.ts       # ← from codegen/src/scripts/probe-kind.ts
│   │   ├── stages.ts     # ← from codegen/src/scripts/probe-stages.ts + probe-rule.ts (merged)
│   │   └── parity.ts     # ← from codegen/src/scripts/probe-parity.ts
│   ├── profile/
│   │   ├── failures.ts   # ← from scratch/profile-failures.ts (unified)
│   │   ├── factory.ts    # ← from scratch/profile-{recursive,shallow,recursive-ast}.ts (merged)
│   │   └── bench.ts      # ← from codegen/src/scripts/bench-render.ts
│   ├── validate/
│   │   ├── counts.ts     # ← from codegen/src/scripts/counts.ts
│   │   ├── diff.ts       # ← from codegen/src/scripts/diff-failures.ts
│   │   ├── baseline.ts   # ← from codegen/src/scripts/{collect,check}-baseline*.ts
│   │   └── perf.ts       # ← from codegen/src/scripts/check-perf-baseline.ts
│   ├── discover/
│   │   ├── list-kinds.ts # ← from scratch/list-groups.ts + find-unaliased-groups.ts
│   │   ├── classify.ts   # ← from scratch/classify-kinds.ts
│   │   ├── phantom.ts    # ← from codegen/src/scripts/diagnose-phantom-kinds.ts
│   │   └── provenance.ts # ← from codegen/src/scripts/field-provenance.ts
│   ├── inspect/
│   │   ├── type.ts       # ← from scratch/inspect-loose.ts + inspect-container-loose.ts
│   │   ├── overrides.ts  # ← from scratch/compare-overrides.ts
│   │   └── refs.ts       # ← from codegen/scripts/inspect-refs.ts + inspect-suggestions.ts
│   └── exercise/
│       ├── walk.ts       # ← from scratch/test-walk-{wrapped,render}.ts
│       └── roundtrip.ts  # ← from scratch/exercise-unaliased-groups.ts
└── tests/
    └── cli.test.ts       # smoke tests for subcommand dispatch
```

## CLI Surface

The main `sittir` CLI (`packages/codegen/src/cli.ts`) gains a subcommand router. When the first arg matches a tool name, it delegates to `@sittir/tools`:

```bash
# Probing
sittir probe-kind --grammar rust --source 'fn foo() {}'
sittir probe-stages --grammar rust --kind block --compact
sittir probe-stages --grammar rust --kind block --brief  # (was probe-rule)
sittir probe-parity rust visibility_modifier

# Profiling
sittir profile --grammar rust                    # unified failure aggregation
sittir profile --grammar rust --recursive --ast  # recursive AST variant
sittir bench                                     # native vs JS render benchmark

# Validation
sittir counts                                    # all grammars pass/total
sittir counts rust                               # single grammar
sittir diff-failures rust rt                     # per-kind failures
sittir check-baseline --base X --head Y          # regression gate

# Discovery
sittir list-kinds --grammar rust --groups        # list groups
sittir list-kinds --grammar rust --unaliased     # find unaliased groups
sittir list-kinds --grammar rust --phantom       # phantom kinds
sittir classify rust                             # kind classification
sittir field-provenance --grammar rust           # field source tracking

# Inspection
sittir inspect-type                              # Loose type widening
sittir inspect-refs rust _type_identifier        # symbol references
sittir compare-overrides rust                    # override key diffs

# Exercise
sittir walk --grammar rust --source 'fn f() {}' --render
sittir exercise --grammar rust --kinds 'block,match_arm'
```

Tools are also directly importable:

```typescript
import { probeKind } from '@sittir/tools/probe';
import { profileFailures } from '@sittir/tools/profile';
```

## CLI Delegation Pattern

In `packages/codegen/src/cli.ts`, add a prefix check before the existing option parser:

```typescript
const TOOL_SUBCOMMANDS = new Set([
  'probe-kind', 'probe-stages', 'probe-parity',
  'profile', 'bench', 'counts', 'diff-failures', 'check-baseline',
  'list-kinds', 'classify', 'field-provenance',
  'inspect-type', 'inspect-refs', 'compare-overrides',
  'walk', 'exercise'
]);

const firstArg = process.argv[2];
if (firstArg && TOOL_SUBCOMMANDS.has(firstArg)) {
  const { dispatch } = await import('@sittir/tools/cli');
  process.exit(await dispatch(process.argv.slice(2)));
}
// ... existing CLI logic
```

## Migration Plan

### Phase 1: Create package + move existing scripts
1. Create `packages/tools/` with package.json, tsconfig
2. Move the 15 codegen/src/scripts/ files into the new structure
3. Move the 3 codegen/scripts/ files
4. Update imports, verify everything still works
5. Add re-export shims in the old locations (deprecation period)

### Phase 2: Promote scratch scripts
1. Promote the 15 identified scratch scripts (consolidating into ~8 tools)
2. Parameterize hardcoded values into CLI args
3. Add `--help` to each tool

### Phase 3: Delete scratch + CLI integration
1. Delete the ~75 superseded scratch/ scripts
2. Keep scratch/alias-spike/ (historical reference)
3. Wire up the CLI subcommand delegation
4. Update CLAUDE.md quick reference

### Phase 4: Root scripts
1. Move root `scripts/` utilities that make sense (bench-codemod, check-jinja-templates)
2. Keep `assert-scope-boundaries.sh` at root (CI entry point)

## Scratch Deletion List

**75 files to delete** — all superseded by parameterized tools:

All `check-*.ts` (27 files), all `trace-*.ts` (33 files), all `detail-*.ts` (20 files except detail-from.ts already covered), `debug-*.ts` (2 files), `render-ls.ts`, `probe-alias-render.ts`, `probe-other-aliases.ts`, `test-drill-as.ts`, `inspect-precedence.ts`, `inspect-precedence2.ts`.

**Keep**: `alias-spike/` directory (historical experiment).

## Constraints

- `@sittir/tools` depends on `@sittir/codegen` and `@sittir/core` — it is a dev-only package, never published
- Tools must work with the existing `npx tsx` invocation pattern during transition
- No changes to generated output or codegen pipeline behavior
- The root `scripts/assert-scope-boundaries.sh` stays at root (CI entry point, not a dev tool)

## Verification

1. Every promoted tool runs and produces output matching its scratch/ predecessor
2. `sittir probe-kind --grammar rust --source 'fn foo() {}'` works end-to-end
3. All existing test suites pass (no import breakage from moves)
4. `pnpm type-check` passes across workspace
