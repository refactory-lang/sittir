# Native Bundle Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the separate `--rust-render` regeneration path, make `--all` regenerate both TS and native render artifacts in one pass, and add a guard so checked-in TS/native bundle hashes cannot drift again.

**Architecture:** Keep the strict native hash gate in `packages/*/src/backend.ts` unchanged. Fix the problem at the generation boundary: `packages/codegen/src/cli.ts` should treat `--all` as the single source of truth for both TS-side output and native `rust-render` output, while a dedicated regression test verifies the checked-in TS/native hashes match for all three grammars.

**Tech Stack:** TypeScript ESM, Vitest, pnpm workspaces, napi-rs native crates, `npx tsx packages/codegen/src/cli.ts`, `pnpm test`, `pnpm -r run type-check`

---

## File Structure

**Modify**

- `packages/codegen/src/cli.ts` — remove the user-facing `--rust-render` branch and make `--all` perform the full TS + native artifact regeneration path for supported grammars.
- `packages/codegen/src/emitters/rust-render.ts` — update generated header comments and command hints so they reference the one-flag workflow.
- `packages/codegen/src/emitters/parity-fixtures.ts` — update comments that still describe fixture extraction as `--rust-render`-specific.
- `packages/codegen/src/emitters/rust-render.test.ts` — update emitter expectations to the one-flag contract.
- `packages/codegen/src/__tests__/collect-baseline.test.ts` — extend baseline tests so native parity regressions fail loudly when bundle sync is broken.
- `README.md` — update public regeneration commands to the one-flag workflow.
- `CLAUDE.md` — update repo commands and contributor guidance so native sync is part of the normal regen path.

**Create**

- `packages/codegen/src/__tests__/native-hash-sync.test.ts` — repository-level regression test that compares checked-in `src/hash.ts` and `rust-render/src/hash.rs` for `python`, `rust`, and `typescript`.

**Regenerate / Refresh**

- `packages/{python,rust,typescript}/src/hash.ts`
- `packages/{python,rust,typescript}/rust-render/src/hash.rs`
- `packages/{python,rust,typescript}/rust-render/src/templates.rs`
- `packages/{python,rust,typescript}/rust-render/src/lib.rs`
- `packages/{python,rust,typescript}/rust-render/templates/*.jinja`
- `packages/{python,rust,typescript}/rust-render/test-fixtures.json`
- `specs/016-parity-regressions/baselines/native.json`
- `specs/054-post-016-perf-tracking/baselines/perf-native.json` (only if metrics are intentionally refreshed as part of verification)

**Native build surface**

- `rust/crates/sittir-rust-napi/package.json` — existing build command reference only; no code change expected unless the one-flag path needs an explicit build invocation update.

---

### Task 1: Lock the new one-flag contract with failing tests

**Files:**

- Create: `packages/codegen/src/__tests__/native-hash-sync.test.ts`
- Modify: `packages/codegen/src/emitters/rust-render.test.ts`
- Modify: `packages/codegen/src/__tests__/collect-baseline.test.ts`
- Test: `packages/codegen/src/__tests__/native-hash-sync.test.ts`

- [ ] **Step 1: Add a failing checked-in hash sync test**

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const GRAMMARS = ["python", "rust", "typescript"] as const;

function readTsHash(grammar: (typeof GRAMMARS)[number]): string {
	const text = readFileSync(resolve(`packages/${grammar}/src/hash.ts`), "utf8");
	const match = /TEMPLATE_BUNDLE_HASH = '([0-9a-f]{64})'/.exec(text);
	if (!match?.[1]) throw new Error(`missing TS hash for ${grammar}`);
	return match[1];
}

function readNativeHash(grammar: (typeof GRAMMARS)[number]): string {
	const text = readFileSync(resolve(`packages/${grammar}/rust-render/src/hash.rs`), "utf8");
	const match = /TEMPLATE_BUNDLE_HASH: &str = "([0-9a-f]{64})"/.exec(text);
	if (!match?.[1]) throw new Error(`missing native hash for ${grammar}`);
	return match[1];
}

describe("checked-in native bundle sync", () => {
	it.each(GRAMMARS)("%s TS/native hashes match", (grammar) => {
		expect(readTsHash(grammar)).toBe(readNativeHash(grammar));
	});
});
```

- [ ] **Step 2: Run the new test to verify it fails on the current tree**

Run:

```bash
pnpm test packages/codegen/src/__tests__/native-hash-sync.test.ts
```

Expected: **FAIL** with at least one grammar reporting mismatched TS/native bundle hashes.

- [ ] **Step 3: Update the emitter test to the one-flag contract**

```ts
it("references the one-flag regen command in generated headers", () => {
	const emit = emitHashFiles("typescript", sample);
	expect(emit.hashRs.contents).toMatch(/--grammar typescript --all/);
	expect(emit.hashRs.contents).not.toMatch(/--rust-render/);
	expect(emit.hashTs.contents).toMatch(/--grammar typescript --all/);
});
```

- [ ] **Step 4: Add a native collect-baseline assertion that makes the mismatch easier to diagnose**

```ts
it("native parity render path does not silently mask bundle drift", async () => {
	await expect(collectBaseline("native")).resolves.toBeDefined();
});
```

Add a focused inline assertion or error expectation near the existing native-mode tests so a future failure clearly mentions bundle sync rather than surfacing as an opaque parity drop.

- [ ] **Step 5: Run the focused codegen test set**

Run:

```bash
pnpm test packages/codegen/src/emitters/rust-render.test.ts packages/codegen/src/__tests__/collect-baseline.test.ts packages/codegen/src/__tests__/native-hash-sync.test.ts
```

Expected: **FAIL** on the new sync assertion until the CLI/generation changes land; existing unrelated tests stay green.

- [ ] **Step 6: Commit the red tests**

```bash
git add packages/codegen/src/emitters/rust-render.test.ts \
        packages/codegen/src/__tests__/collect-baseline.test.ts \
        packages/codegen/src/__tests__/native-hash-sync.test.ts
git commit -m "test: lock one-flag native bundle sync contract"
```

---

### Task 2: Remove the separate flag and make `--all` regenerate native artifacts too

**Files:**

- Modify: `packages/codegen/src/cli.ts`
- Modify: `packages/codegen/src/emitters/rust-render.ts`
- Modify: `packages/codegen/src/emitters/parity-fixtures.ts`
- Test: `packages/codegen/src/emitters/rust-render.test.ts`

- [ ] **Step 1: Remove `rustRender` from the CLI argument shape and parser**

```ts
interface CliArgs {
	grammar?: string;
	nodes?: string[];
	outputDir?: string;
	all?: boolean;
	testsDir?: string;
	roundtrip?: boolean;
	compileParser?: boolean;
	transpile?: boolean;
	tsGenerate?: boolean;
	skipTsChain?: boolean;
	buildNative?: boolean;
	help?: boolean;
}
```

Delete the `case "--rust-render":` parser branch entirely.

- [ ] **Step 2: Rewrite the help text so `--all` is the only regeneration path**

```ts
console.log(`
Usage: sittir --grammar <name> [--all | --nodes <kinds>] --output <dir>

Options:
  --all, -a        Generate TS output plus native rust-render artifacts
                   for supported grammars (rust, typescript, python)
  --no-build-native  Skip the post-regen napi crate rebuild
`);
```

Remove all mentions of `--rust-render`.

- [ ] **Step 3: Move the rust-render emission branch under the `--all` flow**

```ts
const shouldEmitRustRender =
	cliArgs.all &&
	(config.grammar === "rust" || config.grammar === "typescript" || config.grammar === "python");

if (shouldEmitRustRender) {
	// existing emitRenderCrate + template copy + parity fixture extraction
}
```

The implementation should keep the current native artifact emission logic intact; only the trigger condition changes.

- [ ] **Step 4: Update generated header comments to the one-flag command**

```ts
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src
```

Apply that command string consistently in `rust-render.ts` for `hash.rs`, `hash.ts`, `templates.rs`, `lib.rs`, and `Cargo.toml` headers.

- [ ] **Step 5: Update parity-fixture comments so they describe the new contract**

```ts
/**
 * Runs from `cli.ts --all` after TS + native render artifacts are emitted;
 * produces `packages/{lang}/rust-render/test-fixtures.json` per grammar.
 */
```

- [ ] **Step 6: Run the focused codegen tests**

Run:

```bash
pnpm test packages/codegen/src/emitters/rust-render.test.ts packages/codegen/src/__tests__/native-hash-sync.test.ts
```

Expected: the emitter test passes; the repo-level sync test may still fail until checked-in artifacts are regenerated in Task 3.

- [ ] **Step 7: Commit the one-flag CLI change**

```bash
git add packages/codegen/src/cli.ts \
        packages/codegen/src/emitters/rust-render.ts \
        packages/codegen/src/emitters/parity-fixtures.ts \
        packages/codegen/src/emitters/rust-render.test.ts
git commit -m "feat(codegen): fold native artifact emission into --all"
```

---

### Task 3: Regenerate, rebuild native crates, and make the sync test go green

**Files:**

- Modify: `packages/{python,rust,typescript}/src/hash.ts`
- Modify: `packages/{python,rust,typescript}/rust-render/src/hash.rs`
- Modify: `packages/{python,rust,typescript}/rust-render/src/templates.rs`
- Modify: `packages/{python,rust,typescript}/rust-render/src/lib.rs`
- Modify: `packages/{python,rust,typescript}/rust-render/templates/*.jinja`
- Modify: `packages/{python,rust,typescript}/rust-render/test-fixtures.json`
- Test: `packages/codegen/src/__tests__/native-hash-sync.test.ts`

- [ ] **Step 1: Regenerate all three grammars with the single flag**

Run:

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Expected: each run reports generated TS files, regenerated rust-render crate files, and refreshed `rust-render/test-fixtures.json`.

- [ ] **Step 2: Rebuild the native napi crate**

Run:

```bash
pnpm -C rust/crates/sittir-rust-napi run build
```

Expected: **PASS** and the native addon rebuild completes without template/hash errors.

- [ ] **Step 3: Run the sync regression test**

Run:

```bash
pnpm test packages/codegen/src/__tests__/native-hash-sync.test.ts
```

Expected: **PASS** for `python`, `rust`, and `typescript`.

- [ ] **Step 4: Run the parity sanity tests for all grammar packages**

Run:

```bash
pnpm --filter @sittir/python test tests/parity.test.ts
pnpm --filter @sittir/rust test tests/parity.test.ts
pnpm --filter @sittir/typescript test tests/parity.test.ts
```

Expected: native boundary no longer fails immediately on bundle mismatch; any remaining failures now indicate real renderer divergence.

- [ ] **Step 5: Commit the regenerated artifacts**

```bash
git add packages/python/src/hash.ts packages/python/rust-render \
        packages/rust/src/hash.ts packages/rust/rust-render \
        packages/typescript/src/hash.ts packages/typescript/rust-render
git commit -m "chore: resync checked-in native render artifacts"
```

---

### Task 4: Refresh baselines and update contributor-facing commands

**Files:**

- Modify: `specs/016-parity-regressions/baselines/native.json`
- Modify: `specs/054-post-016-perf-tracking/baselines/perf-native.json` (only if refreshed)
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Test: `packages/codegen/src/__tests__/collect-baseline.test.ts`

- [ ] **Step 1: Refresh the native baseline from a trustworthy run**

Run:

```bash
SITTIR_BACKEND=native npx tsx packages/codegen/src/scripts/collect-baseline.ts > specs/016-parity-regressions/baselines/native.json
```

Expected: the baseline completes without hash-mismatch throws, and `parityFixtures.pass` is no longer artificially zero because of boundary failure.

- [ ] **Step 2: Refresh native perf metrics if the implementation intentionally changes the measured native path**

Run:

```bash
SITTIR_BACKEND=native SITTIR_METRICS=1 npx tsx packages/codegen/src/scripts/collect-baseline.ts > /tmp/native-baseline.json
```

If `metrics-native.json` is emitted and the run is part of the fix verification, copy the refreshed metrics into `specs/054-post-016-perf-tracking/baselines/perf-native.json`.

- [ ] **Step 3: Update contributor-facing regeneration commands**

```md
```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```
```

Apply that command set in both `README.md` and `CLAUDE.md`, removing any mention of a separate `--rust-render` flag.

- [ ] **Step 4: Run the full validation sweep**

Run:

```bash
pnpm -r run type-check
pnpm test
pnpm format:check
```

Expected: all commands pass. If `pnpm test` still shows native parity failures, they should now be real render mismatches rather than bundle-hash guard failures.

- [ ] **Step 5: Commit the verification and docs update**

```bash
git add specs/016-parity-regressions/baselines/native.json \
        specs/054-post-016-perf-tracking/baselines/perf-native.json \
        README.md CLAUDE.md
git commit -m "docs: make --all the only native sync workflow"
```

---

## Self-Review

### Spec coverage

- **Restore hash equality:** covered by Task 2 and Task 3.
- **Keep strict hash gate:** preserved explicitly in Task 2; no backend relaxation work is planned.
- **Add recurrence guard:** covered by Task 1 (`native-hash-sync.test.ts`).
- **Refresh trustworthy native baseline:** covered by Task 4.

### Placeholder scan

- No `TBD`, `TODO`, or “similar to Task N” references remain.
- Every command step includes an exact command and expected outcome.
- Code-change steps include concrete code blocks rather than abstract directions.

### Type consistency

- The plan consistently uses `CliArgs.buildNative` and removes `CliArgs.rustRender`.
- The new regression test names and file paths stay consistent across all tasks.

---

Plan complete and saved to `docs/superpowers/plans/2026-04-27-native-bundle-sync.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
