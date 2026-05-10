# @sittir/tools Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate ~100 scattered developer scripts into a single `packages/tools/` workspace package with CLI subcommand delegation from the `sittir` CLI.

**Architecture:** New workspace package `@sittir/tools` depends on `@sittir/codegen` and `@sittir/core`. Scripts are organized by purpose (probe, profile, validate, discover, inspect, exercise). The existing `sittir` CLI in `packages/codegen/src/cli.ts` gains a subcommand router that delegates to `@sittir/tools/cli` when the first arg matches a tool name.

**Tech Stack:** TypeScript ESM, `node:util` `parseArgs`, pnpm workspaces, vitest

---

## File Map

### New files (packages/tools/)
- `packages/tools/package.json`
- `packages/tools/tsconfig.json`
- `packages/tools/src/index.ts`
- `packages/tools/src/cli.ts`
- `packages/tools/src/probe/kind.ts`
- `packages/tools/src/probe/stages.ts`
- `packages/tools/src/probe/parity.ts`
- `packages/tools/src/profile/failures.ts`
- `packages/tools/src/profile/factory.ts`
- `packages/tools/src/profile/bench.ts`
- `packages/tools/src/validate/counts.ts`
- `packages/tools/src/validate/diff.ts`
- `packages/tools/src/validate/baseline.ts`
- `packages/tools/src/validate/perf.ts`
- `packages/tools/src/discover/list-kinds.ts`
- `packages/tools/src/discover/classify.ts`
- `packages/tools/src/discover/phantom.ts`
- `packages/tools/src/discover/provenance.ts`
- `packages/tools/src/inspect/type.ts`
- `packages/tools/src/inspect/overrides.ts`
- `packages/tools/src/inspect/refs.ts`
- `packages/tools/src/exercise/walk.ts`
- `packages/tools/src/exercise/roundtrip.ts`
- `packages/tools/tests/cli.test.ts`

### Modified files
- `packages/codegen/src/cli.ts` — add subcommand router (Task 6)
- `pnpm-workspace.yaml` — already covers `packages/*`, no change needed

### Deleted files (Task 7-8)
- ~75 scratch/ scripts (all `check-*.ts`, `trace-*.ts`, `detail-*.ts`, `debug-*.ts`, plus specific others)
- `scratch/profile-failures.ts`, `scratch/list-groups.ts`, etc. (promoted originals, after tools verified)

---

### Task 1: Create packages/tools/ scaffold

**Files:**
- Create: `packages/tools/package.json`
- Create: `packages/tools/tsconfig.json`
- Create: `packages/tools/src/index.ts`
- Create: `packages/tools/src/cli.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@sittir/tools",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./cli": "./src/cli.ts",
    "./probe": "./src/probe/kind.ts",
    "./profile": "./src/profile/failures.ts"
  },
  "scripts": {
    "test": "vitest run",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@sittir/codegen": "workspace:*",
    "@sittir/core": "workspace:*",
    "@sittir/types": "workspace:*"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "types": ["node"]
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create src/cli.ts — subcommand dispatcher**

```typescript
import { parseArgs } from 'node:util';

type ToolRunner = (argv: string[]) => Promise<number>;

const TOOLS: Record<string, () => Promise<{ run: ToolRunner }>> = {
  'probe-kind': () => import('./probe/kind.ts'),
  'probe-stages': () => import('./probe/stages.ts'),
  'probe-parity': () => import('./probe/parity.ts'),
  'profile': () => import('./profile/failures.ts'),
  'bench': () => import('./profile/bench.ts'),
  'counts': () => import('./validate/counts.ts'),
  'diff-failures': () => import('./validate/diff.ts'),
  'check-baseline': () => import('./validate/baseline.ts'),
  'check-perf': () => import('./validate/perf.ts'),
  'list-kinds': () => import('./discover/list-kinds.ts'),
  'classify': () => import('./discover/classify.ts'),
  'field-provenance': () => import('./discover/provenance.ts'),
  'inspect-type': () => import('./inspect/type.ts'),
  'inspect-refs': () => import('./inspect/refs.ts'),
  'compare-overrides': () => import('./inspect/overrides.ts'),
  'walk': () => import('./exercise/walk.ts'),
  'exercise': () => import('./exercise/roundtrip.ts'),
};

export async function dispatch(argv: string[]): Promise<number> {
  const subcommand = argv[0];
  if (!subcommand || subcommand === '--help') {
    printHelp();
    return 0;
  }
  const loader = TOOLS[subcommand];
  if (!loader) {
    process.stderr.write(`Unknown tool: ${subcommand}\nRun with --help to see available tools.\n`);
    return 1;
  }
  const mod = await loader();
  return mod.run(argv.slice(1));
}

function printHelp(): void {
  const lines = [
    'sittir tools — developer diagnostics',
    '',
    'Probing:',
    '  probe-kind        parse → read → render → reparse diagnostics',
    '  probe-stages      dump rule shape at every compiler phase',
    '  probe-parity      template coverage for a target kind',
    '',
    'Profiling:',
    '  profile           unified validator failure aggregation',
    '  bench             native vs JS render benchmark',
    '',
    'Validation:',
    '  counts            per-grammar validator pass/total',
    '  diff-failures     per-kind validator failures',
    '  check-baseline    baseline regression gate',
    '  check-perf        native perf regression gate',
    '',
    'Discovery:',
    '  list-kinds        list groups, unaliased, phantom kinds',
    '  classify          kind classification through compiler phases',
    '  field-provenance  field source tracking (override/enriched/grammar)',
    '',
    'Inspection:',
    '  inspect-type      Loose type widening verification',
    '  inspect-refs      symbol reference dump',
    '  compare-overrides override key diffs',
    '',
    'Exercise:',
    '  walk              wrapped-node traversal + render',
    '  exercise          round-trip exercise harness',
  ];
  process.stdout.write(lines.join('\n') + '\n');
}

export const TOOL_NAMES = new Set(Object.keys(TOOLS));
```

- [ ] **Step 4: Create src/index.ts — public exports**

```typescript
export { dispatch, TOOL_NAMES } from './cli.ts';
```

- [ ] **Step 5: Install dependencies and verify**

Run: `pnpm install`
Expected: workspace links resolve, no errors

Run: `cd packages/tools && pnpm type-check`
Expected: PASS (may warn about missing tool modules — that's fine, we'll add them next)

- [ ] **Step 6: Commit**

```bash
git add packages/tools/package.json packages/tools/tsconfig.json packages/tools/src/index.ts packages/tools/src/cli.ts
git commit -m "feat(tools): scaffold @sittir/tools package with CLI dispatcher"
```

---

### Task 2: Move probe tools (probe-kind, probe-stages, probe-parity)

**Files:**
- Move: `packages/codegen/src/scripts/probe-kind.ts` → `packages/tools/src/probe/kind.ts`
- Move: `packages/codegen/src/scripts/probe-stages.ts` + `probe-rule.ts` → `packages/tools/src/probe/stages.ts`
- Move: `packages/codegen/src/scripts/probe-parity.ts` → `packages/tools/src/probe/parity.ts`

- [ ] **Step 1: Copy probe-kind.ts**

Copy `packages/codegen/src/scripts/probe-kind.ts` to `packages/tools/src/probe/kind.ts`. Wrap the existing `main()` function in an exported `run` function:

```typescript
// At the bottom of the file, replace:
//   main().catch(…)
// With:
export async function run(argv: string[]): Promise<number> {
  try {
    await main(argv);
    return 0;
  } catch (err) {
    process.stderr.write(String(err) + '\n');
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run(process.argv.slice(2)).then(process.exit);
}
```

Update the `main()` signature to accept `argv: string[]` and change the `parseArgs` call to use `{ args: argv, ... }` instead of reading from `process.argv` implicitly.

Fix import paths: replace relative imports like `'../compiler/generate.ts'` with `'@sittir/codegen/compiler/generate.ts'` or use the appropriate workspace import path. Check each import and verify the export exists in `@sittir/codegen`.

- [ ] **Step 2: Copy and merge probe-stages + probe-rule**

Copy `packages/codegen/src/scripts/probe-stages.ts` to `packages/tools/src/probe/stages.ts`. The existing `probe-rule.ts` is a lighter version — merge its output format as a `--brief` flag on probe-stages.

Add to the `parseArgs` options:
```typescript
brief: { type: 'boolean', default: false },
```

When `--brief` is set, print only the rule name and simplified shape instead of the full per-phase dump. This replaces `probe-rule`.

Wrap `main()` with `export async function run(argv: string[]): Promise<number>` same as probe-kind.

Fix import paths as above.

- [ ] **Step 3: Copy probe-parity**

Copy `packages/codegen/src/scripts/probe-parity.ts` to `packages/tools/src/probe/parity.ts`. Same wrapping pattern.

- [ ] **Step 4: Add re-export shims at old locations**

Create shims so existing `npx tsx packages/codegen/src/scripts/probe-kind.ts` invocations still work:

In `packages/codegen/src/scripts/probe-kind.ts`, replace the entire file with:
```typescript
import { run } from '@sittir/tools/probe/kind.ts';
run(process.argv.slice(2)).then(process.exit);
```

Same pattern for `probe-stages.ts`, `probe-rule.ts` (delegating to stages), `probe-parity.ts`.

- [ ] **Step 5: Verify probes work**

Run: `npx tsx packages/tools/src/probe/stages.ts --grammar rust --kind block --compact`
Expected: JSON output with evaluate, link, optimize, simplify, assemble, emit keys

Run: `npx tsx packages/tools/src/probe/kind.ts --grammar rust --source 'fn foo() {}'`
Expected: JSON output with cst, nodeData, rendered keys

Run: `npx tsx packages/codegen/src/scripts/probe-kind.ts --grammar rust --source 'fn foo() {}'`
Expected: Same output (shim works)

- [ ] **Step 6: Commit**

```bash
git add packages/tools/src/probe/ packages/codegen/src/scripts/probe-kind.ts packages/codegen/src/scripts/probe-stages.ts packages/codegen/src/scripts/probe-rule.ts packages/codegen/src/scripts/probe-parity.ts
git commit -m "feat(tools): move probe tools to @sittir/tools"
```

---

### Task 3: Move validate tools (counts, diff-failures, baseline, perf)

**Files:**
- Move: `packages/codegen/src/scripts/counts.ts` → `packages/tools/src/validate/counts.ts`
- Move: `packages/codegen/src/scripts/diff-failures.ts` → `packages/tools/src/validate/diff.ts`
- Move: `packages/codegen/src/scripts/collect-baseline.ts` + `check-baseline-regression.ts` → `packages/tools/src/validate/baseline.ts`
- Move: `packages/codegen/src/scripts/check-perf-baseline.ts` → `packages/tools/src/validate/perf.ts`

- [ ] **Step 1: Move each validate script**

For each file, apply the same pattern as Task 2:
1. Copy to `packages/tools/src/validate/<name>.ts`
2. Wrap `main()` in `export async function run(argv: string[]): Promise<number>`
3. Accept `argv` parameter and pass to `parseArgs({ args: argv, ... })`
4. Fix import paths to use `@sittir/codegen` workspace imports
5. Leave a shim at the old location

For `baseline.ts`, merge `collect-baseline.ts` and `check-baseline-regression.ts` into a single file with a `--collect` vs `--check` mode flag:
```typescript
const { values } = parseArgs({
  args: argv,
  options: {
    collect: { type: 'boolean', default: false },
    check: { type: 'boolean', default: false },
    base: { type: 'string' },
    head: { type: 'string' },
  }
});
```

- [ ] **Step 2: Verify validate tools**

Run: `npx tsx packages/tools/src/validate/counts.ts`
Expected: Per-grammar pass/total counts for all three grammars

Run: `npx tsx packages/tools/src/validate/diff.ts rust rt`
Expected: Per-kind failure list for Rust read-render-parse

- [ ] **Step 3: Commit**

```bash
git add packages/tools/src/validate/ packages/codegen/src/scripts/counts.ts packages/codegen/src/scripts/diff-failures.ts packages/codegen/src/scripts/collect-baseline.ts packages/codegen/src/scripts/check-baseline-regression.ts packages/codegen/src/scripts/check-perf-baseline.ts
git commit -m "feat(tools): move validate tools to @sittir/tools"
```

---

### Task 4: Move discover and inspect tools + promote scratch scripts

**Files:**
- Move: `packages/codegen/src/scripts/diagnose-phantom-kinds.ts` → `packages/tools/src/discover/phantom.ts`
- Move: `packages/codegen/src/scripts/field-provenance.ts` → `packages/tools/src/discover/provenance.ts`
- Move: `packages/codegen/scripts/inspect-refs.ts` + `inspect-suggestions.ts` → `packages/tools/src/inspect/refs.ts`
- Promote: `scratch/profile-failures.ts` → `packages/tools/src/profile/failures.ts`
- Promote: `scratch/profile-{recursive,shallow,recursive-ast}.ts` → `packages/tools/src/profile/factory.ts`
- Promote: `scratch/list-groups.ts` + `scratch/find-unaliased-groups.ts` → `packages/tools/src/discover/list-kinds.ts`
- Promote: `scratch/classify-kinds.ts` → `packages/tools/src/discover/classify.ts`
- Promote: `scratch/inspect-loose.ts` + `scratch/inspect-container-loose.ts` → `packages/tools/src/inspect/type.ts`
- Promote: `scratch/compare-overrides.ts` → `packages/tools/src/inspect/overrides.ts`
- Move: `packages/codegen/src/scripts/bench-render.ts` → `packages/tools/src/profile/bench.ts`

- [ ] **Step 1: Move discover tools**

Copy `diagnose-phantom-kinds.ts` → `packages/tools/src/discover/phantom.ts` and `field-provenance.ts` → `packages/tools/src/discover/provenance.ts`. Same wrapping pattern as previous tasks.

- [ ] **Step 2: Merge inspect-refs + inspect-suggestions**

Merge `packages/codegen/scripts/inspect-refs.ts` and `inspect-suggestions.ts` into `packages/tools/src/inspect/refs.ts` with a `--mode refs|suggestions` flag:

```typescript
const { values } = parseArgs({
  args: argv,
  options: {
    grammar: { type: 'string', short: 'g', default: 'rust' },
    symbol: { type: 'string', short: 's' },
    mode: { type: 'string', short: 'm', default: 'refs' },
    base: { type: 'boolean', default: false },
    limit: { type: 'string', default: '10' },
  }
});
```

- [ ] **Step 3: Promote profile-failures.ts**

Copy `scratch/profile-failures.ts` to `packages/tools/src/profile/failures.ts`. Parameterize it:

```typescript
const { values } = parseArgs({
  args: argv,
  options: {
    grammar: { type: 'string', short: 'g' },
    top: { type: 'string', default: '15' },
  }
});
const grammars = values.grammar
  ? [values.grammar]
  : ['rust', 'typescript', 'python'];
```

When `--grammar` is provided, run only that grammar. Otherwise run all three. Export `run(argv)`.

- [ ] **Step 4: Promote and merge profile factory scripts**

Merge `scratch/profile-recursive.ts`, `scratch/profile-shallow.ts`, and `scratch/profile-recursive-ast.ts` into `packages/tools/src/profile/factory.ts`:

```typescript
const { values } = parseArgs({
  args: argv,
  options: {
    grammar: { type: 'string', short: 'g' },
    recursive: { type: 'boolean', default: false },
    ast: { type: 'boolean', default: false },
  }
});
if (values.recursive) process.env.SITTIR_VALIDATE_RECURSIVE = '1';
```

- [ ] **Step 5: Promote and merge list-kinds**

Merge `scratch/list-groups.ts` and `scratch/find-unaliased-groups.ts` into `packages/tools/src/discover/list-kinds.ts`:

```typescript
const { values } = parseArgs({
  args: argv,
  options: {
    grammar: { type: 'string', short: 'g', default: 'rust' },
    groups: { type: 'boolean', default: false },
    unaliased: { type: 'boolean', default: false },
    phantom: { type: 'boolean', default: false },
  }
});
```

When `--groups` is set, list all group rules. When `--unaliased`, find unaliased groups. When `--phantom`, delegate to the phantom tool. Default (no flags) lists all.

- [ ] **Step 6: Promote classify, inspect-type, compare-overrides**

Copy and parameterize:
- `scratch/classify-kinds.ts` → `packages/tools/src/discover/classify.ts` — add `--grammar` and `--kind` args
- `scratch/inspect-loose.ts` + `inspect-container-loose.ts` → `packages/tools/src/inspect/type.ts` — add `--kind` filter
- `scratch/compare-overrides.ts` → `packages/tools/src/inspect/overrides.ts` — add `--grammar` arg

- [ ] **Step 7: Move bench-render**

Copy `packages/codegen/src/scripts/bench-render.ts` → `packages/tools/src/profile/bench.ts`. Same wrapping pattern.

- [ ] **Step 8: Verify promoted tools**

Run: `npx tsx packages/tools/src/profile/failures.ts --grammar rust`
Expected: Failure cluster report for Rust

Run: `npx tsx packages/tools/src/discover/list-kinds.ts --grammar rust --groups`
Expected: List of group rules for Rust grammar

Run: `npx tsx packages/tools/src/discover/classify.ts --grammar rust --kind block`
Expected: Kind classification output

- [ ] **Step 9: Commit**

```bash
git add packages/tools/src/discover/ packages/tools/src/inspect/ packages/tools/src/profile/
git commit -m "feat(tools): promote scratch scripts + move discover/inspect/profile tools"
```

---

### Task 5: Promote exercise tools (walk, roundtrip)

**Files:**
- Promote: `scratch/test-walk-wrapped.ts` + `scratch/test-walk-render.ts` → `packages/tools/src/exercise/walk.ts`
- Promote: `scratch/exercise-unaliased-groups.ts` → `packages/tools/src/exercise/roundtrip.ts`
- Move: `packages/codegen/src/scripts/regen-templates-rs.ts` → `packages/tools/src/validate/regen-templates.ts` (bonus — keeps validate category complete)

- [ ] **Step 1: Merge walk scripts**

Merge `scratch/test-walk-wrapped.ts` and `scratch/test-walk-render.ts` into `packages/tools/src/exercise/walk.ts`:

```typescript
const { values } = parseArgs({
  args: argv,
  options: {
    grammar: { type: 'string', short: 'g', default: 'rust' },
    source: { type: 'string', short: 's' },
    render: { type: 'boolean', default: false },
  }
});
```

Without `--render`: walk the wrapped tree, count node types (from test-walk-wrapped). With `--render`: walk and render each node (from test-walk-render).

- [ ] **Step 2: Promote exercise-unaliased-groups**

Copy to `packages/tools/src/exercise/roundtrip.ts`. Parameterize:

```typescript
const { values } = parseArgs({
  args: argv,
  options: {
    grammar: { type: 'string', short: 'g', default: 'rust' },
    kinds: { type: 'string', short: 'k' },
  }
});
const kindList = values.kinds?.split(',') ?? [];
```

- [ ] **Step 3: Verify exercise tools**

Run: `npx tsx packages/tools/src/exercise/walk.ts --grammar rust --source 'fn foo() {}' --render`
Expected: Node walk output with render results

- [ ] **Step 4: Commit**

```bash
git add packages/tools/src/exercise/
git commit -m "feat(tools): promote exercise tools (walk, roundtrip)"
```

---

### Task 6: Wire CLI subcommand delegation

**Files:**
- Modify: `packages/codegen/src/cli.ts`
- Modify: `packages/codegen/package.json` (add @sittir/tools dep)

- [ ] **Step 1: Add @sittir/tools dependency to codegen**

In `packages/codegen/package.json`, add to `dependencies`:
```json
"@sittir/tools": "workspace:*"
```

Run: `pnpm install`

- [ ] **Step 2: Add subcommand router to cli.ts**

At the top of `packages/codegen/src/cli.ts`, after the shebang and imports, before the existing arg parsing, add:

```typescript
import { TOOL_NAMES } from '@sittir/tools';

const firstArg = process.argv[2];
if (firstArg && TOOL_NAMES.has(firstArg)) {
  const { dispatch } = await import('@sittir/tools/cli');
  const code = await dispatch(process.argv.slice(2));
  process.exit(code);
}
```

This check must come before the existing `parseArgs` call so tool subcommands are intercepted first.

- [ ] **Step 3: Verify end-to-end CLI delegation**

Run: `npx tsx packages/codegen/src/cli.ts probe-stages --grammar rust --kind block --compact`
Expected: Same output as running probe-stages directly

Run: `npx tsx packages/codegen/src/cli.ts counts`
Expected: Per-grammar validator counts

Run: `npx tsx packages/codegen/src/cli.ts --help` (should NOT hit tool dispatcher)
Expected: Original codegen CLI help text

Run: `npx tsx packages/codegen/src/cli.ts probe-kind --help`
Expected: probe-kind help text

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/cli.ts packages/codegen/package.json
git commit -m "feat(cli): add subcommand router delegating to @sittir/tools"
```

---

### Task 7: Delete superseded scratch scripts

**Files:**
- Delete: ~75 files in `scratch/`

- [ ] **Step 1: Delete check-* scripts (27 files)**

```bash
rm scratch/check-alias-sources.ts scratch/check-assembled.ts scratch/check-bearers.ts scratch/check-dec-one.ts scratch/check-decorated.ts scratch/check-enrich.ts scratch/check-enrich2.ts scratch/check-field-pat.ts scratch/check-generic-type-parse.ts scratch/check-group-refs.ts scratch/check-if-comments.ts scratch/check-impl-bang.ts scratch/check-impl-regression.ts scratch/check-match-body.ts scratch/check-match-stmt.ts scratch/check-modeltype.ts scratch/check-poly-candidates.ts scratch/check-py-body-rule.ts scratch/check-python-ir.ts scratch/check-raw-fields.ts scratch/check-rust-failures.ts scratch/check-shorthand.ts scratch/check-struct-pat.ts scratch/check-suite.ts scratch/check-tuple-struct.ts scratch/check-turbofish-reparse.ts scratch/check-walker.ts
```

- [ ] **Step 2: Delete trace-* scripts (33 files)**

```bash
rm scratch/trace-both-ls.ts scratch/trace-call.ts scratch/trace-classify.ts scratch/trace-dec-def.ts scratch/trace-dec-render.ts scratch/trace-decorated.ts scratch/trace-fntype-parse.ts scratch/trace-impl-parse.ts scratch/trace-import-pipeline.ts scratch/trace-list-splat.ts scratch/trace-ls-fail.ts scratch/trace-ls-two.ts scratch/trace-ls-validator.ts scratch/trace-macro-forms.ts scratch/trace-macro-parse.ts scratch/trace-modext.ts scratch/trace-mut-pattern.ts scratch/trace-raw-string.ts scratch/trace-recurse.ts scratch/trace-scoped-id.ts scratch/trace-struct-item.ts scratch/trace-tuple-one.ts scratch/trace-undef.ts scratch/trace-unsafe-impl.ts
```

- [ ] **Step 3: Delete detail-* and debug-* scripts (~22 files)**

```bash
rm scratch/detail-delim-token-tree.ts scratch/detail-from.ts scratch/detail-function-type.ts scratch/detail-impl-factory.ts scratch/detail-py-all.ts scratch/detail-py-call.ts scratch/detail-py-expression.ts scratch/detail-py-factory-reparse.ts scratch/detail-py-if.ts scratch/detail-py-ms.ts scratch/detail-rust-all-ast.ts scratch/detail-rust-factory-ast.ts scratch/detail-rust-factory-reparse.ts scratch/detail-rust-rt-ast.ts scratch/detail-rust-rt-reparse.ts scratch/detail-rust-source.ts scratch/detail-struct-pat.ts scratch/detail-tuple-struct-pattern.ts scratch/debug-fntype-walk.ts scratch/debug-suggester-source.ts
```

- [ ] **Step 4: Delete promoted originals + remaining one-offs**

```bash
rm scratch/profile-failures.ts scratch/profile-recursive.ts scratch/profile-shallow.ts scratch/profile-recursive-ast.ts scratch/list-groups.ts scratch/find-unaliased-groups.ts scratch/classify-kinds.ts scratch/inspect-loose.ts scratch/inspect-container-loose.ts scratch/compare-overrides.ts scratch/exercise-unaliased-groups.ts scratch/test-walk-wrapped.ts scratch/test-walk-render.ts scratch/test-drill-as.ts scratch/render-ls.ts scratch/probe-alias-render.ts scratch/probe-other-aliases.ts scratch/inspect-precedence.ts scratch/inspect-precedence2.ts scratch/find-mut-contexts.ts scratch/inspect-generic-type.ts scratch/compare-import-data.ts
```

- [ ] **Step 5: Verify scratch/ only has alias-spike/ remaining**

```bash
ls scratch/
```
Expected: Only `alias-spike/` directory remains.

- [ ] **Step 6: Commit**

```bash
git add -A scratch/
git commit -m "cleanup: delete 75 superseded scratch scripts"
```

---

### Task 8: Smoke tests + cleanup

**Files:**
- Create: `packages/tools/tests/cli.test.ts`

- [ ] **Step 1: Write CLI dispatch smoke tests**

```typescript
import { describe, it, expect } from 'vitest';
import { TOOL_NAMES, dispatch } from '../src/cli.ts';

describe('cli dispatcher', () => {
  it('has all expected tool names', () => {
    expect(TOOL_NAMES.has('probe-kind')).toBe(true);
    expect(TOOL_NAMES.has('probe-stages')).toBe(true);
    expect(TOOL_NAMES.has('counts')).toBe(true);
    expect(TOOL_NAMES.has('profile')).toBe(true);
    expect(TOOL_NAMES.has('list-kinds')).toBe(true);
  });

  it('returns 0 for --help', async () => {
    const code = await dispatch(['--help']);
    expect(code).toBe(0);
  });

  it('returns 1 for unknown subcommand', async () => {
    const code = await dispatch(['nonexistent-tool']);
    expect(code).toBe(1);
  });
});
```

- [ ] **Step 2: Run the smoke tests**

Run: `pnpm -C packages/tools test`
Expected: 3 tests pass

- [ ] **Step 3: Run full workspace validation**

Run: `pnpm type-check`
Expected: No type errors across workspace

Run: `pnpm test`
Expected: All existing tests pass (no import breakage)

- [ ] **Step 4: Commit**

```bash
git add packages/tools/tests/
git commit -m "test(tools): add CLI dispatch smoke tests"
```

---

### Task 9: Move root scripts + final documentation

**Files:**
- Move: `scripts/bench-codemod-runner.ts` → `packages/tools/src/profile/codemod.ts`
- Move: `scripts/check-jinja-templates.ts` → `packages/tools/src/validate/jinja.ts`
- Keep: `scripts/assert-scope-boundaries.sh` (CI entry point, stays at root)
- Keep: `scripts/bench-codemod.sh` (shell wrapper, stays at root — update path to runner)

- [ ] **Step 1: Move bench-codemod-runner.ts**

Copy `scripts/bench-codemod-runner.ts` to `packages/tools/src/profile/codemod.ts`. Wrap with `run()` pattern.

Update `scripts/bench-codemod.sh` to invoke from the new location:
```bash
# Replace:
#   npx tsx scripts/bench-codemod-runner.ts "$CORPUS"
# With:
#   npx tsx packages/tools/src/profile/codemod.ts "$CORPUS"
```

- [ ] **Step 2: Move check-jinja-templates.ts**

Copy `scripts/check-jinja-templates.ts` to `packages/tools/src/validate/jinja.ts`. Wrap with `run()` pattern. Add `'check-jinja'` to the TOOLS map in `cli.ts`.

- [ ] **Step 3: Update CLI dispatcher**

Add the new tools to `packages/tools/src/cli.ts`:

```typescript
'bench-codemod': () => import('./profile/codemod.ts'),
'check-jinja': () => import('./validate/jinja.ts'),
```

Add to the help text under their respective categories.

- [ ] **Step 4: Verify**

Run: `npx tsx packages/tools/src/validate/jinja.ts`
Expected: Template validation output (same as before)

Run: `pnpm type-check && pnpm test`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/profile/codemod.ts packages/tools/src/validate/jinja.ts packages/tools/src/cli.ts scripts/bench-codemod.sh
git commit -m "feat(tools): move root scripts (bench-codemod, check-jinja) to @sittir/tools"
```

---

## Self-Review Checklist

- **Spec coverage:** All 4 phases (scaffold → move → promote/delete → root scripts) have corresponding tasks
- **Placeholder scan:** All steps have concrete commands and code
- **Type consistency:** `run(argv: string[]): Promise<number>` pattern used consistently across all tools
- **Import paths:** All moved files update imports from relative codegen paths to `@sittir/codegen` workspace imports
- **Shim backward compat:** Old script locations get re-export shims (Task 2-5)
- **Deletion safety:** Scratch deletion happens AFTER promoted tools are verified working (Task 7 after Task 4-5)
- **CLI delegation:** Checked that router intercepts before existing parseArgs (Task 6)
