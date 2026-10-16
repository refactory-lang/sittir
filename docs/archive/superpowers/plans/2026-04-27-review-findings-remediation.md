# Review Findings Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate every 016 review finding by making native execution strict, aligning the JS↔Rust wire contract, making baseline/perf scripts honest, and finishing the one-flag regeneration cleanup.

**Architecture:** Fix the reviewed defects at the boundaries where drift currently happens. Backend selection remains the single place that can choose JS/TS fallback, while runtime execution, validator dispatch, and codegen scripts stop masking native failures. Shared contract helpers should live in shared packages (`@sittir/core`, `@sittir/types`, `sittir-core`) instead of being reimplemented per grammar crate.

**Tech Stack:** TypeScript ESM, Vitest, pnpm workspaces, Rust 1.82+, napi-rs, `npx tsx packages/codegen/src/cli.ts`, `pnpm test`, `pnpm -r run type-check`, `cargo test`

---

## File Structure

**Create**

- `packages/core/src/native-boundary.ts` — shared runtime validation for JS→Rust render payloads and native runtime error formatting.
- `packages/typescript/tests/backend-boundary.test.ts` — TS grammar regression tests for native render/applyEdits failure surfacing.
- `packages/rust/tests/backend-boundary.test.ts` — Rust grammar regression tests for native render/applyEdits failure surfacing.
- `packages/python/tests/backend-boundary.test.ts` — Python grammar regression tests for native render/applyEdits failure surfacing.

**Modify**

- `packages/types/src/core-types.ts` — add strict native wire types alongside permissive `AnyNodeData`.
- `packages/types/src/index.ts` — re-export strict native wire types.
- `packages/core/src/index.ts` — export native-boundary helpers.
- `packages/typescript/src/backend.ts` — make backend status a discriminated union and keep fallback reasons explicit.
- `packages/rust/src/backend.ts` — same backend-status cleanup for rust grammar package.
- `packages/python/src/backend.ts` — same backend-status cleanup for python grammar package.
- `packages/typescript/src/boundary.ts` — validate native payload shape and surface native execution failures.
- `packages/rust/src/boundary.ts` — same boundary strictness for rust grammar package.
- `packages/python/src/boundary.ts` — same boundary strictness for python grammar package.
- `packages/codegen/src/scripts/collect-baseline.ts` — make parity failures loud and run validators under the requested backend.
- `packages/codegen/src/__tests__/collect-baseline.test.ts` — lock native validator dispatch and parity-failure semantics.
- `packages/codegen/src/validate/common.ts` — make forced-native validator reads fail loudly instead of silently falling back.
- `packages/codegen/src/scripts/check-perf-baseline.ts` — use the canonical metrics shape and reject non-native-shaped input.
- `packages/codegen/src/__tests__/check-perf-baseline.test.ts` — lock native-perf validation semantics.
- `rust/crates/sittir-core/src/lib.rs` — export shared node-id validation helper.
- `rust/crates/sittir-core/src/boundary.rs` — implement shared `f64 -> u64` node-id validation.
- `rust/crates/sittir-{lang}/src/lib.rs` — use shared node-id validation helper.
- `packages/codegen/src/cli.ts` — remove `--all` and make `--all` the single regen path.
- `packages/codegen/src/emitters/render-module.ts` — update generated header commands to the one-flag workflow.
- `packages/codegen/src/emitters/parity-fixtures.ts` — align comments with the one-flag regen flow.
- `packages/codegen/src/emitters/render-module.test.ts` — lock the one-flag command strings.
- `.github/workflows/ci.yml` — regenerate fixtures with the supported one-flag command.
- `packages/codegen/src/compiler/link.ts` — delete stale alias-synthesis wording.
- `packages/codegen/src/compiler/node-map.ts` — fix stale derivation-helper wording.
- `packages/codegen/src/dsl/enrich.ts` — refresh stale enrich-pass documentation.
- `CLAUDE.md` — remove outdated Nunjucks-only guidance where review flagged drift.
- `packages/typescript/tests/parity.test.ts` — remove stale `--all` regen wording.
- `packages/rust/tests/parity.test.ts` — remove stale `--all` regen wording.
- `packages/python/tests/parity.test.ts` — remove stale `--all` regen wording.

**Regenerate / refresh**

- `packages/{python,rust,typescript}/src/hash.ts`
- `rust/crates/sittir-{python,rust,typescript}/src/render/hash.rs`
- `rust/crates/sittir-{python,rust,typescript}/src/render/templates.rs`
- `rust/crates/sittir-{python,rust,typescript}/src/render/mod.rs`
- `rust/crates/sittir-{python,rust,typescript}/templates/*.jinja`
- `rust/crates/sittir-{python,rust,typescript}/test-fixtures.json`

---

### Task 1: Lock the reviewed behavior with failing tests

**Files:**

- Create: `packages/typescript/tests/backend-boundary.test.ts`
- Create: `packages/rust/tests/backend-boundary.test.ts`
- Create: `packages/python/tests/backend-boundary.test.ts`
- Modify: `packages/codegen/src/__tests__/collect-baseline.test.ts`
- Modify: `packages/codegen/src/__tests__/check-perf-baseline.test.ts`
- Test: `packages/typescript/tests/backend-boundary.test.ts`
- Test: `packages/rust/tests/backend-boundary.test.ts`
- Test: `packages/python/tests/backend-boundary.test.ts`

- [ ] **Step 1: Add boundary tests that prove native runtime failures are not silently retried on JS/TS**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/backend.ts', () => ({
	getActiveBackend: () => ({
		name: 'native',
		hashMatch: true,
		native: {
			SittirEngine: class {
				render(): string {
					throw new Error('native render boom');
				}
				applyEdits(): string {
					throw new Error('native apply boom');
				}
			}
		}
	})
}));

describe('native boundary', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('throws when native render fails', async () => {
		const { render } = await import('../src/boundary.ts');
		expect(() =>
			render({
				$type: 'identifier',
				$source: 'factory',
				$named: true,
				$text: 'x'
			})
		).toThrow(/native render boom/);
	});
});
```

Use the same test shape in all three grammar packages, adjusting only the relative import path.

- [ ] **Step 2: Extend `collect-baseline` tests to lock native-validator dispatch and parity-failure surfacing**

```ts
import * as common from '../validate/common.ts';
import * as baseline from '../scripts/collect-baseline.ts';

it('native baseline runs validators with SITTIR_BACKEND=native', async () => {
	const seen = new Set<string | undefined>();
	const original = common.buildReadHandle;
	const spy = vi
		.spyOn(common, 'buildReadHandle')
		.mockImplementation((...args) => {
			seen.add(process.env.SITTIR_BACKEND);
			return original(...args);
		});
	await baseline.collectBaseline('native');
	expect(seen).toEqual(new Set(['native']));
	spy.mockRestore();
});

it('parity render exceptions surface with fixture context', async () => {
	vi.spyOn(baseline, 'loadBoundaryRender').mockResolvedValue(() => {
		throw new Error('boom');
	});
	await expect(baseline.collectBaseline('native')).rejects.toThrow(
		/\[python\]\[native\]\[render #0\].*boom/
	);
});
```

- [ ] **Step 3: Extend `check-perf-baseline` tests so native perf checks reject TS-shaped input**

```ts
it('rejects a metrics file with backend ts for the native perf gate', () => {
	const v = evaluateVerdict(
		makeBaseline(baselineFfi),
		{ ...makeFresh(baselineFfi), backend: 'ts' },
		false
	);
	expect(v.kind).toBe('backend-mismatch');
});

it('rejects a native metrics file with no ffi block', () => {
	const v = evaluateVerdict(
		makeBaseline(baselineFfi),
		makeFresh(undefined),
		false
	);
	expect(v.kind).toBe('missing-ffi');
});
```

- [ ] **Step 4: Run the new focused red-test set**

Run:

```bash
pnpm test \
  packages/typescript/tests/backend-boundary.test.ts \
  packages/rust/tests/backend-boundary.test.ts \
  packages/python/tests/backend-boundary.test.ts \
  packages/codegen/src/__tests__/collect-baseline.test.ts \
  packages/codegen/src/__tests__/check-perf-baseline.test.ts
```

Expected: **FAIL** on the new assertions because the current branch still silently falls back, still allows TS-shaped perf input, and still weakens parity failures.

- [ ] **Step 5: Commit the red tests**

```bash
git add packages/typescript/tests/backend-boundary.test.ts \
        packages/rust/tests/backend-boundary.test.ts \
        packages/python/tests/backend-boundary.test.ts \
        packages/codegen/src/__tests__/collect-baseline.test.ts \
        packages/codegen/src/__tests__/check-perf-baseline.test.ts
git commit -m "test: lock review remediation behavior"
```

---

### Task 2: Implement the strict native boundary contract

**Files:**

- Create: `packages/core/src/native-boundary.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/types/src/core-types.ts`
- Modify: `packages/types/src/index.ts`
- Modify: `packages/typescript/src/backend.ts`
- Modify: `packages/rust/src/backend.ts`
- Modify: `packages/python/src/backend.ts`
- Modify: `packages/typescript/src/boundary.ts`
- Modify: `packages/rust/src/boundary.ts`
- Modify: `packages/python/src/boundary.ts`
- Test: `packages/typescript/tests/backend-boundary.test.ts`
- Test: `packages/rust/tests/backend-boundary.test.ts`
- Test: `packages/python/tests/backend-boundary.test.ts`

- [ ] **Step 1: Add strict native wire types to `@sittir/types`**

```ts
export type NativeFieldValue =
	| NativeNodeData
	| readonly NativeNodeData[]
	| string;

export interface NativeNodeData {
	$type: string;
	$source: 'ts' | 'sg' | 'factory';
	$named: boolean;
	$fields?: { readonly [key: string]: NativeFieldValue };
	$children?: readonly NativeNodeData[];
	$text?: string;
	$span?: { start: number; end: number };
	$nodeId?: number;
}
```

Export these from `packages/types/src/index.ts` beside `AnyNodeData`.

- [ ] **Step 2: Add shared runtime validation in `@sittir/core`**

```ts
import type {
	AnyNodeData,
	NativeNodeData,
	NodeFieldValue
} from '@sittir/types';

export function assertNativeNodeData(
	node: AnyNodeData,
	path = '$'
): asserts node is NativeNodeData {
	if (typeof node.$source !== 'string')
		throw new Error(`${path}.$source is required for native render`);
	if (typeof node.$named !== 'boolean')
		throw new Error(`${path}.$named is required for native render`);
	for (const [field, value] of Object.entries(node.$fields ?? {})) {
		assertNativeFieldValue(value as NodeFieldValue, `${path}.$fields.${field}`);
	}
	for (const [index, child] of (node.$children ?? []).entries()) {
		assertNativeNodeData(child, `${path}.$children[${index}]`);
	}
}
```

Add a small private `assertNativeFieldValue()` in the same file so the three grammar packages share one validator instead of duplicating it.

- [ ] **Step 3: Replace the loose backend-status interface with a discriminated union**

```ts
export type BackendStatus =
	| {
			readonly name: 'native';
			readonly hashMatch: true;
			readonly native: NativeModule;
	  }
	| {
			readonly name: 'typescript';
			readonly reason: string;
			readonly hashMatch?: false;
	  };
```

Keep the existing selection behavior, but make each return site build one of the two legal union members explicitly.

- [ ] **Step 4: Make the three boundary shims validate payloads and throw on native runtime failures**

```ts
import {
	assertNativeNodeData,
	createRenderer,
	recordFfi,
	metricsEnabled,
	readNode as coreReadNode
} from '@sittir/core';

export function render(node: AnyNodeData): string {
	const engine = getNativeEngine();
	if (engine !== null) {
		assertNativeNodeData(node);
		const json = JSON.stringify(node);
		if (metricsEnabled) {
			const t0 = performance.now();
			const result = engine.render(json);
			recordFfi(
				GRAMMAR,
				node.$type,
				json.length,
				performance.now() - t0,
				result.length
			);
			return result;
		}
		return engine.render(json);
	}
	return getTsRenderer().render(node);
}
```

For `getNativeEngine()` and `applyEdits()`, delete the bare `catch {}` fallback blocks. Convert them into `catch (error)` blocks that rethrow with grammar-specific context.

- [ ] **Step 5: Run the focused boundary tests**

Run:

```bash
pnpm test \
  packages/typescript/tests/backend-boundary.test.ts \
  packages/rust/tests/backend-boundary.test.ts \
  packages/python/tests/backend-boundary.test.ts
pnpm -r run type-check
```

Expected: **PASS**. The new strict native boundary type checks cleanly and the three grammar-package boundary tests stop seeing silent fallback behavior.

- [ ] **Step 6: Commit the boundary contract cleanup**

```bash
git add packages/core/src/native-boundary.ts \
        packages/core/src/index.ts \
        packages/types/src/core-types.ts \
        packages/types/src/index.ts \
        packages/typescript/src/backend.ts \
        packages/typescript/src/boundary.ts \
        packages/rust/src/backend.ts \
        packages/rust/src/boundary.ts \
        packages/python/src/backend.ts \
        packages/python/src/boundary.ts
git commit -m "fix: make native boundary strict"
```

---

### Task 3: Make native baseline collection and validator dispatch truthful

**Files:**

- Modify: `packages/codegen/src/scripts/collect-baseline.ts`
- Modify: `packages/codegen/src/validate/common.ts`
- Modify: `packages/codegen/src/__tests__/collect-baseline.test.ts`
- Test: `packages/codegen/src/__tests__/collect-baseline.test.ts`

- [ ] **Step 1: Add a helper that runs validator collection under the requested backend**

```ts
async function withBackendEnv<T>(
	backend: Backend,
	fn: () => Promise<T>
): Promise<T> {
	const prev = process.env.SITTIR_BACKEND;
	process.env.SITTIR_BACKEND = backend === 'native' ? 'native' : 'typescript';
	try {
		return await fn();
	} finally {
		if (prev === undefined) delete process.env.SITTIR_BACKEND;
		else process.env.SITTIR_BACKEND = prev;
	}
}
```

Wrap the `Promise.all([...validators])` call in `collectValidatorsForGrammar()` with this helper so `collectBaseline("native")` actually drives native validator reads.

- [ ] **Step 2: Make `buildReadHandle()` fail loudly when native was requested but cannot load**

```ts
export function buildReadHandle(
	grammar: string,
	tree: TS.Tree,
	source: string
): TreeHandle {
	if (process.env.SITTIR_BACKEND === 'native') {
		const engine = loadNativeEngineForGrammar(grammar);
		if (!engine) {
			throw new Error(
				`SITTIR_BACKEND=native but no native engine is available for grammar '${grammar}'`
			);
		}
		return nativeTreeHandle(engine, source);
	}
	return treeHandle(tree, source);
}
```

- [ ] **Step 3: Stop parity collection from swallowing render exceptions**

```ts
fixtures.forEach((fx, idx) => {
	const actual = renderer.render(fx.input);
	if (actual === fx.expectedOutput) {
		pass++;
		return;
	}
	const kind = fx.input.$type;
	const id = `render #${idx}`;
	const existing = failingByKind.get(kind) ?? [];
	existing.push(id);
	failingByKind.set(kind, existing);
});
```

If you need richer diagnostics, wrap `renderer.render` with `catch (error)` and rethrow:

```ts
throw new Error(
	`[${grammar}][${backend}][render #${idx}] ${fx.input.$type}: ${message}`
);
```

Do not convert the error into `null`.

- [ ] **Step 4: Update the tests to assert strict native behavior**

```ts
it('native-mode validator collection fails if native read handles are unavailable', async () => {
	await expect(collectBaseline('native')).rejects.toThrow(
		/SITTIR_BACKEND=native/
	);
});

it('native parity render exceptions surface with fixture context', async () => {
	await expect(collectBaseline('native')).rejects.toThrow(
		/\[rust\]\[native\]\[render #/
	);
});
```

- [ ] **Step 5: Run the focused baseline tests**

Run:

```bash
pnpm test packages/codegen/src/__tests__/collect-baseline.test.ts
```

Expected: **PASS**. Native-mode collection either produces a real native baseline or fails with an explicit native-only error; it never quietly reports TS behavior as native.

- [ ] **Step 6: Commit the baseline/validator fix**

```bash
git add packages/codegen/src/scripts/collect-baseline.ts \
        packages/codegen/src/validate/common.ts \
        packages/codegen/src/__tests__/collect-baseline.test.ts
git commit -m "fix: make native baseline collection honest"
```

---

### Task 4: Validate node ids through a shared Rust helper

**Files:**

- Modify: `rust/crates/sittir-core/src/lib.rs`
- Modify: `rust/crates/sittir-core/src/boundary.rs`
- Modify: `rust/crates/sittir-{lang}/src/lib.rs`
- Test: `rust/crates/sittir-core/src/boundary.rs`

- [ ] **Step 1: Add a shared node-id validator to `sittir-core`**

```rust
pub fn coerce_node_id(node_id: f64) -> Result<u64, String> {
    if !node_id.is_finite() {
        return Err("node id must be finite".to_string());
    }
    if node_id < 0.0 {
        return Err("node id must be non-negative".to_string());
    }
    if node_id.fract() != 0.0 {
        return Err("node id must be an integer".to_string());
    }
    Ok(node_id as u64)
}
```

Export it from `rust/crates/sittir-core/src/lib.rs` via `pub mod boundary;`.

- [ ] **Step 2: Replace direct `as u64` casts in the shared N-API crate**

```rust
let id = sittir_core::boundary::coerce_node_id(node_id)
    .map_err(|msg| Error::from_reason(msg))?;
```

Apply the same replacement in `rust/crates/sittir-{lang}/src/lib.rs`.

- [ ] **Step 3: Add Rust unit tests for invalid ids**

```rust
#[cfg(test)]
mod tests {
    use super::coerce_node_id;

    #[test]
    fn rejects_nan() {
        assert!(coerce_node_id(f64::NAN).is_err());
    }

    #[test]
    fn rejects_fractional() {
        assert!(coerce_node_id(1.5).is_err());
    }

    #[test]
    fn accepts_whole_non_negative_ids() {
        assert_eq!(coerce_node_id(42.0).unwrap(), 42);
    }
}
```

- [ ] **Step 4: Run the Rust test slice**

Run:

```bash
cargo test -p sittir-core
cargo test -p sittir-{lang}
```

Expected: **PASS**. Invalid ids are rejected before tree lookup and no crate still uses `node_id as u64`.

- [ ] **Step 5: Commit the node-id validation fix**

```bash
git add rust/crates/sittir-core/src/lib.rs \
        rust/crates/sittir-core/src/boundary.rs \
        rust/crates/sittir-{lang}/src/lib.rs
git commit -m "fix(napi): validate read_node ids"
```

---

### Task 5: Tighten perf validation, finish the one-flag workflow, and clean up stale docs/comments

**Files:**

- Modify: `packages/codegen/src/scripts/check-perf-baseline.ts`
- Modify: `packages/codegen/src/__tests__/check-perf-baseline.test.ts`
- Modify: `packages/codegen/src/cli.ts`
- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/emitters/parity-fixtures.ts`
- Modify: `packages/codegen/src/emitters/render-module.test.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `packages/codegen/src/compiler/link.ts`
- Modify: `packages/codegen/src/compiler/node-map.ts`
- Modify: `packages/codegen/src/dsl/enrich.ts`
- Modify: `CLAUDE.md`
- Modify: `packages/typescript/tests/parity.test.ts`
- Modify: `packages/rust/tests/parity.test.ts`
- Modify: `packages/python/tests/parity.test.ts`
- Test: `packages/codegen/src/__tests__/check-perf-baseline.test.ts`
- Test: `packages/codegen/src/emitters/render-module.test.ts`

- [ ] **Step 1: Replace the local metrics schema with the canonical type and stricter verdicts**

```ts
import type { MetricsFile } from '@sittir/core';

export type Verdict =
	| { kind: 'ok' }
	| {
			kind: 'backend-mismatch';
			expected: 'native';
			fresh: MetricsFile['backend'];
	  }
	| { kind: 'missing-ffi' }
	| {
			kind: 'platform-mismatch';
			baselinePlatform: string;
			freshPlatform: string;
	  }
	| { kind: 'schema-mismatch'; baselineVersion: number; freshVersion: number }
	| {
			kind: 'regression';
			field: 'meanRoundtripMs' | 'totalCalls';
			baseline: number;
			fresh: number;
			deltaPct: number;
			warnOnly: boolean;
	  };
```

Then gate native-only checks explicitly:

```ts
if (fresh.backend !== 'native')
	return { kind: 'backend-mismatch', expected: 'native', fresh: fresh.backend };
if (!fresh.ffi) return { kind: 'missing-ffi' };
```

- [ ] **Step 2: Remove `--all` from the CLI contract**

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

Delete the `case "--all":` parser branch and move the render-module emission path under:

```ts
const shouldEmitRustRender =
	cliArgs.all &&
	(config.grammar === 'rust' ||
		config.grammar === 'typescript' ||
		config.grammar === 'python');
```

- [ ] **Step 3: Update generated command strings and CI to the one supported workflow**

```ts
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src
```

Use that command in:

- `packages/codegen/src/emitters/render-module.ts`
- `packages/codegen/src/emitters/parity-fixtures.ts`
- `packages/codegen/src/emitters/render-module.test.ts`
- `.github/workflows/ci.yml`

- [ ] **Step 4: Fix the stale comments/docs called out by review**

```ts
// Hidden-rule alias collapse is recorded here for assemble-time subtype rewriting.
// Alias-target synthesis now happens during evaluate so Link only consumes the derived map.
```

Apply the same “describe the current behavior, not the removed behavior” cleanup to:

- `packages/codegen/src/compiler/link.ts`
- `packages/codegen/src/compiler/node-map.ts`
- `packages/codegen/src/dsl/enrich.ts`
- `CLAUDE.md`
- `packages/{python,rust,typescript}/tests/parity.test.ts`

- [ ] **Step 5: Run the focused script/codegen/doc-adjacent tests**

Run:

```bash
pnpm test \
  packages/codegen/src/__tests__/check-perf-baseline.test.ts \
  packages/codegen/src/emitters/render-module.test.ts \
  packages/typescript/tests/parity.test.ts \
  packages/rust/tests/parity.test.ts \
  packages/python/tests/parity.test.ts
```

Expected: **PASS**. Native perf checks reject malformed input, and all one-flag text/test surfaces agree on `--all`.

- [ ] **Step 6: Commit the perf/workflow/comment cleanup**

```bash
git add packages/codegen/src/scripts/check-perf-baseline.ts \
        packages/codegen/src/__tests__/check-perf-baseline.test.ts \
        packages/codegen/src/cli.ts \
        packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/emitters/parity-fixtures.ts \
        packages/codegen/src/emitters/render-module.test.ts \
        .github/workflows/ci.yml \
        packages/codegen/src/compiler/link.ts \
        packages/codegen/src/compiler/node-map.ts \
        packages/codegen/src/dsl/enrich.ts \
        CLAUDE.md \
        packages/typescript/tests/parity.test.ts \
        packages/rust/tests/parity.test.ts \
        packages/python/tests/parity.test.ts
git commit -m "fix: finish review remediation cleanup"
```

---

### Task 6: Regenerate artifacts and run the full verification set

**Files:**

- Modify: `packages/{python,rust,typescript}/src/hash.ts`
- Modify: `rust/crates/sittir-{python,rust,typescript}/src/render/hash.rs`
- Modify: `rust/crates/sittir-{python,rust,typescript}/src/render/templates.rs`
- Modify: `rust/crates/sittir-{python,rust,typescript}/src/render/mod.rs`
- Modify: `rust/crates/sittir-{python,rust,typescript}/templates/*.jinja`
- Modify: `rust/crates/sittir-{python,rust,typescript}/test-fixtures.json`
- Test: repository-wide verification commands

- [ ] **Step 1: Regenerate all three grammars with the one-flag command**

Run:

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Expected: TS output, render-module artifacts, and `render-module/test-fixtures.json` refresh in one pass for each grammar.

- [ ] **Step 2: Run the targeted verification commands**

Run:

```bash
pnpm test \
  packages/typescript/tests/backend-boundary.test.ts \
  packages/rust/tests/backend-boundary.test.ts \
  packages/python/tests/backend-boundary.test.ts \
  packages/codegen/src/__tests__/collect-baseline.test.ts \
  packages/codegen/src/__tests__/check-perf-baseline.test.ts \
  packages/codegen/src/emitters/render-module.test.ts
pnpm test
pnpm -r run type-check
cargo test -p sittir-core
cargo test -p sittir-{lang}
```

Expected: **PASS**. No review finding remains reproducible, and the repo stays green across the existing TS and Rust verification surfaces.

- [ ] **Step 3: Commit regenerated artifacts and any final snapshots**

```bash
git add packages/python/src rust/crates/sittir-python/src/render \
        packages/rust/src rust/crates/sittir-rust/src/render \
        packages/typescript/src rust/crates/sittir-typescript/src/render
git commit -m "chore: regenerate render artifacts after remediation"
```

---

## Self-Review

- **Spec coverage:** native execution strictness is covered in Task 2; validator/baseline truthfulness is covered in Task 3; node-id validation is covered in Task 4; perf checker + one-flag workflow + comment drift are covered in Task 5; regeneration and full verification are covered in Task 6.
- **Placeholder scan:** no `TBD` / `TODO` placeholders remain; every task includes exact file paths, code targets, and commands.
- **Type consistency:** the plan consistently uses `NativeNodeData`, `BackendStatus`, `assertNativeNodeData`, and `coerce_node_id` across later tasks.
