# ADR-0009 Implementation Plan — Remove installGrammarWrapper

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete `installGrammarWrapper` + all legacy module-level accumulator state in `dsl/synthetic-rules.ts`. `wire()` becomes the single owner of synthetic-rule synthesis, polymorph-variant metadata, conflict accumulation, and `currentRuleKind` tracking.

**Architecture:** All three in-repo grammars (`rust`, `python`, `typescript`) already wrap opts in `wire({...})`. Zero inline `variant()` calls in overrides. Zero two-arg `field(name, 'literal')` at config-literal positions. So the dual-write paths in `synthetic-rules.ts` are pure shadow bookkeeping with no live consumers. Remove them in phases with `pnpm test` gates between each.

**Note on "no module state":** the ADR's "single source of truth" rule targets _accumulator_ state (drained-and-repopulated across invocations, shared globally). Wire still holds a transient **active-context pointer** (`currentContext` in wire.ts:70), set per-invocation by `wrapOneRuleFn` / `withWireContext` and restored on return. That pointer is the only way DSL helpers (`variant()`, `alias()`, `field()`) can thread context without taking an explicit `ctx` argument — effectively a synchronous thread-local. It stays.

**Tech Stack:** TypeScript, vitest, pnpm workspaces. Three generated grammars + codegen DSL.

---

## File Structure

After this plan, `dsl/synthetic-rules.ts` deletes entirely. Its contents go:

- `maybeKeywordSymbol` → `dsl/field.ts` (inseparable from `field()` semantics)
- `registerAliasedVariant` + local helpers (`matchesEmpty`, `factorOutEmptiness`, `extractNonEmpty`) → `dsl/transform.ts` (its only caller)
- `wrapInPrecStack` → `dsl/transform-path.ts` (next to `reconstructPrec` which it already delegates to)

Modified:

- `dsl/index.ts` — drop `installGrammarWrapper()` import + invocation
- `dsl/wire.ts` — delete `absorbModuleLoadSyntheticRules`, drop legacy helper imports, add a small test-facing `withWireContext` helper
- `dsl/field.ts` — absorbs `maybeKeywordSymbol`, stops importing from `synthetic-rules`
- `dsl/transform.ts` — absorbs `registerAliasedVariant` + helpers; route placeholder-resolution state writes through wire context directly
- `dsl/transform-path.ts` — absorbs `wrapInPrecStack`
- `compiler/evaluate.ts` — replace `withSyntheticRuleScope` / `setCurrentRuleKind` / `drainPolymorphVariants` usage with reads from `__wireContext__`
- `__tests__/polymorph-metadata.test.ts` + `__tests__/transform-hoist.test.ts` — rewrite to use `withWireContext` test helper

Deleted:

- `dsl/synthetic-rules.ts`

---

## Constraints

1. After each phase: `pnpm test` must pass AND `pnpm -r run type-check` must pass.
2. After phases 1, 3, 6: generate all three grammars with `npx tsx packages/codegen/src/cli.ts --grammar <lang> --all --output packages/<lang>/src` and verify no regressions in `pnpm test`.
3. Don't touch generated files in `packages/<lang>/.sittir/grammar.js` — they'll regenerate naturally when the overrides are next re-transpiled; they're gitignored fixtures.

---

## Task 1: Delete `installGrammarWrapper` invocation + function body

**Files:**

- Modify: `packages/codegen/src/dsl/index.ts`
- Modify: `packages/codegen/src/dsl/synthetic-rules.ts`

The wrapper monkey-patches `globalThis.grammar` at DSL module load. Since every grammar uses `wire()` and every DSL helper routes registrations through the wire context, the wrapper has nothing to do — removing it proves that empirically.

- [ ] **Step 1: Run baseline test suite so we know the starting state**

Run: `pnpm test 2>&1 | tail -30`
Expected: all tests pass. Record counts.

- [ ] **Step 2: Remove the import + invocation from `dsl/index.ts`**

Delete these two lines at the bottom of `packages/codegen/src/dsl/index.ts`:

```ts
import { installGrammarWrapper } from './synthetic-rules.ts';
installGrammarWrapper();
```

- [ ] **Step 3: Delete the `installGrammarWrapper` function from `synthetic-rules.ts`**

Delete lines 373–593 of `packages/codegen/src/dsl/synthetic-rules.ts` (the entire `installGrammarWrapper` export plus the surrounding docstring).

- [ ] **Step 4: Run tests**

Run: `pnpm test 2>&1 | tail -30`
Expected: same pass count as step 1.

- [ ] **Step 5: Regenerate grammars to prove round-trip still works**

Run: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src && npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src && npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src`
Expected: exit 0 for all three.

- [ ] **Step 6: Run type-check**

Run: `pnpm -r run type-check 2>&1 | tail -20`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/dsl/index.ts packages/codegen/src/dsl/synthetic-rules.ts
git commit -m "adr-0009 phase 1: delete installGrammarWrapper

wire() already owns every responsibility the wrapper provided:
synthetic-rule deposits, polymorph metadata, conflict accumulation,
currentRuleKind tracking. The wrapper was shadow bookkeeping kept
alive for migration. All three grammars use wire(); safe to remove."
```

---

## Task 2: Make `registerSyntheticRule` / `registerPolymorphVariant` / `registerConflict` wire-only

**Files:**

- Modify: `packages/codegen/src/dsl/synthetic-rules.ts`

Remove the dual-writes to module-level accumulators. When wire context isn't active, throw a clear error. Callers are already inside wire-wrapped rule callbacks, so this becomes fail-loud instead of silent drift.

- [ ] **Step 1: Rewrite `registerSyntheticRule` to wire-only**

In `packages/codegen/src/dsl/synthetic-rules.ts`, replace the existing `registerSyntheticRule` function (lines 45–78) with:

```ts
export function registerSyntheticRule(
	name: string,
	content: RuntimeRule
): void {
	if (!wireRegisterSyntheticRule(name, content)) {
		throw new Error(
			`registerSyntheticRule('${name}'): called outside a wire() context. ` +
				`Wrap your grammar() opts in wire({...}) so synthetic rules route through it.`
		);
	}
}
```

- [ ] **Step 2: Rewrite `registerPolymorphVariant` to wire-only**

Replace the existing function (lines 121–140) with:

```ts
export function registerPolymorphVariant(
	parentKind: string,
	childSuffix: string
): void {
	if (!wireRegisterPolymorphVariant(parentKind, childSuffix)) {
		throw new Error(
			`registerPolymorphVariant('${parentKind}'/'${childSuffix}'): called outside a wire() context. ` +
				`variant()/alias() must be resolved inside a rule callback that runs under wire().`
		);
	}
}
```

- [ ] **Step 3: Rewrite `registerConflict` to wire-only**

Replace the existing function (lines 177–188) with:

```ts
export function registerConflict(names: readonly string[]): void {
	if (names.length === 0) return;
	if (!wireRegisterConflict(names)) {
		throw new Error(
			`registerConflict(${JSON.stringify(names)}): called outside a wire() context.`
		);
	}
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test 2>&1 | tail -30`
Expected: two test files fail (`polymorph-metadata.test.ts`, `transform-hoist.test.ts`) because they call into these functions without a wire context. Other tests should pass. **This failure is expected and handled in Task 3.**

If any OTHER test fails, stop — that's a real regression: a production code path registers synthetic rules without a wire context. Investigate before proceeding.

- [ ] **Step 5: Commit (WIP — broken tests will be fixed in Task 3)**

```bash
git add packages/codegen/src/dsl/synthetic-rules.ts
git commit -m "adr-0009 phase 2: make register*() wire-only, remove dual-writes

registerSyntheticRule / registerPolymorphVariant / registerConflict
now route to the active wire context and throw if none is present.
Legacy module-level accumulators still exist (dead code) — drained
in phase 3. Unit tests in polymorph-metadata / transform-hoist are
now broken; rewritten to use a test helper in phase 3."
```

---

## Task 3: Delete legacy module state; add `withWireContext` test helper; rewrite broken tests

**Files:**

- Modify: `packages/codegen/src/dsl/wire.ts`
- Modify: `packages/codegen/src/dsl/synthetic-rules.ts`
- Modify: `packages/codegen/src/dsl/__tests__/polymorph-metadata.test.ts`
- Modify: `packages/codegen/src/dsl/__tests__/transform-hoist.test.ts`
- Modify: `packages/codegen/src/compiler/evaluate.ts`

Delete every module-level accumulator + the functions that read/write/drain them. Production callers (`evaluate.ts`, `wire.ts`) stop importing the legacy API. Tests get a focused helper that installs a wire context for unit assertions.

- [ ] **Step 1: Add `withWireContext` to `wire.ts`**

Append to `packages/codegen/src/dsl/wire.ts` near the other context accessors (after `wireGetCurrentRuleKind` at line 133):

```ts
/**
 * Install a fresh `WireContext` for the duration of `fn` and return
 * both the callback result and the context so tests can assert on
 * deposits / polymorphVariants / conflictGroups that were registered
 * during the call.
 *
 * Intended for unit tests of DSL helpers (variant/alias/transform/
 * hoist) that need a wire context without going through full wire()
 * composition. Production callers should use `wire()`.
 */
export function withWireContext<T>(
	ruleKind: string | null,
	fn: (ctx: WireContext) => T
): { result: T; ctx: WireContext } {
	const ctx: WireContext = {
		deposits: new Map(),
		polymorphVariants: [],
		conflictGroups: [],
		currentRuleKind: ruleKind
	};
	const prev = currentContext;
	currentContext = ctx;
	try {
		const result = fn(ctx);
		return { result, ctx };
	} finally {
		currentContext = prev;
	}
}
```

- [ ] **Step 2: Drop `absorbModuleLoadSyntheticRules` + its call site in `wire.ts`**

In `packages/codegen/src/dsl/wire.ts`:

- Delete line 43's import of `drainSyntheticRules`:

  Replace `import { forgetPolymorphVariantsFor, drainSyntheticRules } from './synthetic-rules.ts'`
  with `import { forgetPolymorphVariantsFor } from './synthetic-rules.ts'`

- Delete the entire `absorbModuleLoadSyntheticRules` function (lines 344–350) and its call site at line 250:

  Remove the line `absorbModuleLoadSyntheticRules(outRules)` from the `wire(config)` body.

- Delete lines 244–250's preceding comment block about module-load-time drain (the four lines ending with `"inject as static rule fns."`).

- [ ] **Step 3: Drop `forgetPolymorphVariantsFor` entirely**

In `packages/codegen/src/dsl/wire.ts`:

- Delete its import: remove the `import { forgetPolymorphVariantsFor } from './synthetic-rules.ts'` line entirely.

- Delete the call site inside `wrapOneRuleFn` (around line 495):

  ```ts
  // Clear the legacy accumulator's entries for this rule so that
  // re-entry (wrapper pass-1 + pass-2, repeated test invocations,
  // nested grammar extension evaluation) doesn't trip the hard
  // duplicate-throw in `registerPolymorphVariant`. Wire's own
  // polymorph list is idempotent and keeps accumulating across
  // invocations for this wire context.
  forgetPolymorphVariantsFor(name);
  ```

  Remove those six lines + the `forgetPolymorphVariantsFor(name)` call.

- [ ] **Step 4: Update `evaluate.ts` to read wire context directly**

In `packages/codegen/src/compiler/evaluate.ts`:

- Replace line 16's import:

  ```ts
  import {
  	withSyntheticRuleScope,
  	setCurrentRuleKind,
  	drainPolymorphVariants
  } from '../dsl/synthetic-rules.ts';
  ```

  with (empty — we stop importing from synthetic-rules entirely):

  nothing — delete the line.

- Replace the `withSyntheticRuleScope` block (lines 780–791). The new body reads synthetic rules from `opts.__wireContext__.deposits`:

  ```ts
  // wire() populates its per-invocation context with the
  // synthetic-rule bodies registered during rule-fn evaluation
  // (variant/alias placeholder resolution). Pull them out once
  // evaluation is done and merge into the rules map.
  evaluateRuleFunctions(opts, baseRules, refs, rules);
  const wireCtx = (opts as unknown as { __wireContext__?: WireContext })
  	.__wireContext__;
  if (wireCtx) injectSyntheticRules(wireCtx.deposits, rules);
  ```

  Keep the surrounding `withRoleScope` / `evaluateMetadataCallbacks` calls untouched — only the synthetic-scope-wrapper goes.

- Remove the `setCurrentRuleKind(name)` / `setCurrentRuleKind(null)` bracketing in `evaluateRuleFunctions` (lines 929 and 938). Wire's rule-fn wrapper already sets `context.currentRuleKind` around every invocation, so the legacy call was a no-op under wire.

  Keep the `try { ... } finally { ... }` structure but drop the `setCurrentRuleKind` calls:

  ```ts
  function evaluateRuleFunctions(
  	opts: GrammarOptions,
  	baseRules: Record<string, Rule>,
  	refs: SymbolRef[],
  	rules: Record<string, Rule>
  ): void {
  	for (const [name, ruleFn] of Object.entries(opts.rules)) {
  		const $ = createProxy(name, refs);
  		const baseRule = baseRules[name];
  		const result = ruleFn.call($, $, baseRule);
  		rules[name] = normalize(result);
  	}
  }
  ```

- Replace `drainPolymorphMetadata` (lines 841–848). Wire context is now always present:

  ```ts
  function drainPolymorphMetadata(opts: GrammarOptions): PolymorphVariant[] {
  	const wireCtx = (opts as unknown as { __wireContext__?: WireContext })
  		.__wireContext__;
  	return wireCtx ? [...wireCtx.polymorphVariants] : [];
  }
  ```

  Add the `PolymorphVariant` import at the top of `evaluate.ts`:

  ```ts
  import type { WireContext } from '../dsl/wire.ts';
  import type { PolymorphVariant } from './types.ts';
  ```

  (Check that `types.ts` exports `PolymorphVariant` — it does per the grep earlier.)

- [ ] **Step 5: Rewrite `polymorph-metadata.test.ts` using `withWireContext`**

Replace `packages/codegen/src/dsl/__tests__/polymorph-metadata.test.ts` with:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform.ts';
import { variant } from '../variant.ts';
import { withWireContext } from '../wire.ts';
import type { Rule } from '../../compiler/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const sym = (name: string): Rule => ({ type: 'symbol', name }) as Rule;
const str = (value: string): Rule => ({ type: 'string', value }) as Rule;

beforeAll(() => {
	installFakeDsl();
});
afterAll(() => {
	restoreFakeDsl();
});

describe('polymorph metadata registration', () => {
	it('registers variant when alias placeholder is resolved in transform', () => {
		const original = {
			type: 'seq',
			members: [
				sym('left'),
				{
					type: 'choice',
					members: [
						{ type: 'seq', members: [str('='), sym('right')] },
						{ type: 'seq', members: [str(':'), sym('type')] }
					]
				}
			]
		} as Rule;

		const { ctx } = withWireContext('assignment', () => {
			transform(original, {
				'1/0': variant('eq'),
				'1/1': variant('type')
			});
		});

		expect(
			ctx.polymorphVariants.filter((v) => v.parent === 'assignment')
		).toEqual([
			{ parent: 'assignment', child: 'eq' },
			{ parent: 'assignment', child: 'type' }
		]);
		expect(ctx.deposits.size).toBe(2);
	});

	it('throws when variant() is used without a current rule kind', () => {
		const original = {
			type: 'seq',
			members: [sym('a'), { type: 'choice', members: [sym('b'), sym('c')] }]
		} as Rule;

		expect(() => {
			withWireContext(null, () => {
				transform(original, {
					'1/0': variant('b')
				});
			});
		}).toThrow(/no current rule kind/);
	});

	it('accumulates variants from multiple rules', () => {
		const makeChoice = () =>
			({
				type: 'seq',
				members: [{ type: 'choice', members: [sym('a'), sym('b')] }]
			}) as Rule;

		const { ctx: ctx1 } = withWireContext('rule_one', () => {
			transform(makeChoice(), { '0/0': variant('a'), '0/1': variant('b') });
		});
		const { ctx: ctx2 } = withWireContext('rule_two', () => {
			transform(makeChoice(), { '0/0': variant('x') });
		});

		expect(ctx1.polymorphVariants).toEqual([
			{ parent: 'rule_one', child: 'a' },
			{ parent: 'rule_one', child: 'b' }
		]);
		expect(ctx2.polymorphVariants).toEqual([
			{ parent: 'rule_two', child: 'x' }
		]);
	});
});
```

Note: the T029a "duplicate variant on same parent" test is **dropped** — with wire-context-only registration, `wireRegisterPolymorphVariant` is idempotent (see wire.ts:108 comment). Duplicate-detection moved to authoring-time in the polymorph config-object literal (same-key-twice overwrites). The "drainPolymorphVariants clears the accumulator" test is also dropped — there's no accumulator to drain.

- [ ] **Step 6: Rewrite `transform-hoist.test.ts` using `withWireContext`**

Replace `packages/codegen/src/dsl/__tests__/transform-hoist.test.ts` with:

```ts
/**
 * transform-hoist.test.ts — unit coverage for tryHoistSiblingVariants.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform.ts';
import { variant } from '../variant.ts';
import { withWireContext } from '../wire.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

describe('tryHoistSiblingVariants (via transform)', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('hoists sibling variants through a parent prec wrapper and registers them as self-conflicts', () => {
		const { result: patched, ctx } = withWireContext('demo', () => {
			const g = globalThis as any;
			const original = g.prec.left(
				2,
				g.seq(
					{ type: 'string', value: '[' } as any,
					g.choice(
						{ type: 'blank' } as any,
						g.repeat({ type: 'symbol', name: 'X' } as any)
					),
					{ type: 'string', value: ']' } as any
				)
			);
			return transform(original, {
				'1/0': variant('empty'),
				'1/1': variant('list')
			}) as any;
		});

		expect(patched.type).toBe('choice');
		expect(patched.members).toHaveLength(2);
		expect(patched.members[0].type).toBe('symbol');
		expect(patched.members[0].name).toBe('demo_empty');
		expect(patched.members[1].name).toBe('demo_list');

		expect(ctx.deposits.has('demo_empty')).toBe(true);
		expect(ctx.deposits.has('demo_list')).toBe(true);
		const emptyBody: any = ctx.deposits.get('demo_empty');
		expect(emptyBody.type).toBe('prec_left');
		expect(emptyBody.value).toBe(2);

		expect(ctx.conflictGroups).toContainEqual(['demo_empty', 'demo_list']);
		expect(ctx.conflictGroups).toContainEqual(['demo_empty']);
		expect(ctx.conflictGroups).toContainEqual(['demo_list']);

		expect(ctx.polymorphVariants).toContainEqual({
			parent: 'demo',
			child: 'empty'
		});
		expect(ctx.polymorphVariants).toContainEqual({
			parent: 'demo',
			child: 'list'
		});
	});

	it('skips hoist when no variant alternative matches empty (non-empty alts go per-patch)', () => {
		const { ctx } = withWireContext('nonempty', () => {
			const g = globalThis as any;
			const original = g.seq(
				{ type: 'string', value: '(' } as any,
				g.choice(
					{ type: 'symbol', name: 'X' } as any,
					{ type: 'symbol', name: 'Y' } as any
				),
				{ type: 'string', value: ')' } as any
			);
			transform(original, {
				'1/0': variant('x'),
				'1/1': variant('y')
			});
		});
		expect(ctx.conflictGroups).toEqual([]);
	});

	it('bails on mixed choice positions (variants at different choicePos)', () => {
		const { ctx } = withWireContext('mixed', () => {
			const g = globalThis as any;
			const original = g.seq(
				g.choice(
					{ type: 'symbol', name: 'A' } as any,
					{ type: 'symbol', name: 'B' } as any
				),
				{ type: 'string', value: '|' } as any,
				g.choice(
					{ type: 'symbol', name: 'C' } as any,
					{ type: 'symbol', name: 'D' } as any
				)
			);
			transform(original, {
				'0/0': variant('left_a'),
				'2/0': variant('right_c')
			});
		});
		expect(ctx.conflictGroups).toEqual([]);
		expect(ctx.polymorphVariants.map((v) => v.child).sort()).toEqual([
			'left_a',
			'right_c'
		]);
	});
});
```

- [ ] **Step 7: Delete legacy module state + API in `synthetic-rules.ts`**

Open `packages/codegen/src/dsl/synthetic-rules.ts` and delete:

- Module-level state:
  - `let currentSyntheticRules: Map<...> | null = null`
  - `let currentRuleKind: string | null = null`
  - `let currentOptsRules: Record<string, unknown> | null = null`
  - `let currentBlankFn: (() => unknown) | null = null`
  - `let currentPolymorphVariants: PolymorphVariant[] = []`
  - `let currentConflicts: string[][] = []`

- Exported functions no longer referenced anywhere:
  - `setCurrentRuleKind` (still referenced? grep — it's gone after Step 4)
  - `getCurrentRuleKind` is still used by `transform.ts`. **Rewrite it to just call `wireGetCurrentRuleKind`**:

    ```ts
    export function getCurrentRuleKind(): string | null {
    	return wireGetCurrentRuleKind();
    }
    ```

  - `drainSyntheticRules`
  - `drainPolymorphVariants`
  - `drainConflicts`
  - `forgetPolymorphVariantsFor`
  - `withSyntheticRuleScope`
  - `setCurrentRuleKind`

- Keep:
  - `maybeKeywordSymbol`
  - `registerSyntheticRule` (already rewritten in Task 2)
  - `registerPolymorphVariant` (already rewritten in Task 2)
  - `registerConflict` (already rewritten in Task 2)
  - `registerAliasedVariant` + the `matchesEmpty` / `factorOutEmptiness` / `extractNonEmpty` helpers
  - `wrapInPrecStack`
  - `getCurrentRuleKind` (rewritten as wire-only passthrough)

- Also drop the now-unused import of `PolymorphVariant` if nothing local references it anymore.

- [ ] **Step 8: Type-check + test**

Run: `pnpm -r run type-check 2>&1 | tail -20`
Expected: no errors.

Run: `pnpm test 2>&1 | tail -30`
Expected: all tests pass.

- [ ] **Step 9: Regenerate grammars end-to-end**

Run: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src && npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src && npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src`
Expected: exit 0 for all three; `pnpm test` still passes after.

- [ ] **Step 10: Commit**

```bash
git add packages/codegen/src/dsl/synthetic-rules.ts packages/codegen/src/dsl/wire.ts packages/codegen/src/dsl/__tests__/polymorph-metadata.test.ts packages/codegen/src/dsl/__tests__/transform-hoist.test.ts packages/codegen/src/compiler/evaluate.ts
git commit -m "adr-0009 phase 3: delete legacy accumulators, route via wire context

- Removed module-level state (currentSyntheticRules/Conflicts/
  PolymorphVariants/RuleKind/OptsRules/BlankFn) and the drain/scope
  API (drainSyntheticRules, drainConflicts, drainPolymorphVariants,
  withSyntheticRuleScope, setCurrentRuleKind, forgetPolymorphVariantsFor).
- Added wire.ts::withWireContext test helper.
- evaluate.ts now reads synthetic rules + polymorph variants directly
  from opts.__wireContext__.deposits / .polymorphVariants.
- wire.ts drops absorbModuleLoadSyntheticRules (no module-load
  two-arg field() calls in any in-repo grammar — confirmed by audit).
- Unit tests rewritten to use withWireContext; T029a duplicate-variant
  throw test dropped (wire registration is idempotent by design)."
```

---

## Task 4: Relocate `maybeKeywordSymbol` → `field.ts`

**Files:**

- Modify: `packages/codegen/src/dsl/field.ts`
- Modify: `packages/codegen/src/dsl/synthetic-rules.ts`
- Modify: `packages/codegen/src/dsl/transform.ts`

Move `maybeKeywordSymbol` into `field.ts` (its semantic home — field-name → keyword-symbol) and re-export from `synthetic-rules.ts` until Task 6 deletes the file. Update direct importers.

- [ ] **Step 1: Copy `maybeKeywordSymbol` into `field.ts`**

Prepend to `packages/codegen/src/dsl/field.ts` (after the existing imports, before `type Input`):

```ts
import { registerSyntheticRule } from './synthetic-rules.ts';
import { isStringType, type RuntimeRule } from './runtime-shapes.ts';

/**
 * Shared `FIELD(name, bare-STRING)` → `FIELD(name, SYMBOL(_kw_<name>))`
 * transformation. Synthesizes a hidden `_kw_<name>: prec.left(1, 'kw')`
 * rule via registerSyntheticRule and returns a SYMBOL reference
 * matching the runtime's case. Callers receive the symbol to pass as
 * the FIELD's content — tree-sitter's normalizer preserves FIELD
 * around SYMBOL (unlike FIELD around bare STRING).
 *
 * Used by:
 *   - transform.ts resolvePatch (one-arg field() placeholder path)
 *   - the two-arg field(name, 'literal') path below
 *
 * Optional `wrapSyntheticBody` lets callers apply an extra wrap
 * (e.g., transform's accumulated prec stack) around the synthetic
 * rule's body before registration. Returns the content unchanged
 * when it isn't a bare STRING.
 */
export function maybeKeywordSymbol(
	fieldName: string,
	content: unknown,
	wrapSyntheticBody?: (body: RuntimeRule) => RuntimeRule
): unknown {
	const c = content as { type?: string; value?: string };
	if (!c || typeof c.type !== 'string') return content;
	if (!isStringType(c.type)) return content;
	const isUpperCase = c.type === 'STRING';
	const hiddenName = `_kw_${fieldName}`;
	const nativePrec = (
		globalThis as {
			prec?: { left?: (v: number, c: unknown) => unknown };
		}
	).prec;
	let precBody: RuntimeRule = (
		typeof nativePrec?.left === 'function'
			? nativePrec.left(1, content)
			: content
	) as RuntimeRule;
	if (wrapSyntheticBody) precBody = wrapSyntheticBody(precBody);
	registerSyntheticRule(hiddenName, precBody);
	return {
		type: isUpperCase ? 'SYMBOL' : 'symbol',
		name: hiddenName
	};
}
```

Remove `import { maybeKeywordSymbol } from './synthetic-rules.ts'` (line 28) since it's defined locally now.

- [ ] **Step 2: Delete `maybeKeywordSymbol` from `synthetic-rules.ts`**

Delete the `maybeKeywordSymbol` function body (lines 97–119 of the current file, with adjusted offsets after Task 3's deletions).

- [ ] **Step 3: Update `transform.ts` to import from `field.ts`**

In `packages/codegen/src/dsl/transform.ts`, change the import on line 28 from:

```ts
import {
	getCurrentRuleKind,
	registerPolymorphVariant,
	maybeKeywordSymbol,
	registerAliasedVariant,
	registerSyntheticRule,
	registerConflict,
	wrapInPrecStack,
	matchesEmpty
} from './synthetic-rules.ts';
```

to:

```ts
import {
	getCurrentRuleKind,
	registerPolymorphVariant,
	registerAliasedVariant,
	registerSyntheticRule,
	registerConflict,
	wrapInPrecStack,
	matchesEmpty
} from './synthetic-rules.ts';
import { maybeKeywordSymbol } from './field.ts';
```

- [ ] **Step 4: Type-check + test**

Run: `pnpm -r run type-check && pnpm test 2>&1 | tail -20`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/dsl/field.ts packages/codegen/src/dsl/synthetic-rules.ts packages/codegen/src/dsl/transform.ts
git commit -m "adr-0009 phase 4: relocate maybeKeywordSymbol to field.ts

Its semantics are inseparable from field(name, 'literal') — move it
next to field() instead of living in the synthetic-rules graveyard."
```

---

## Task 5: Relocate `registerAliasedVariant` + empty-match helpers → `transform.ts`; `wrapInPrecStack` → `transform-path.ts`

**Files:**

- Modify: `packages/codegen/src/dsl/transform.ts`
- Modify: `packages/codegen/src/dsl/transform-path.ts`
- Modify: `packages/codegen/src/dsl/synthetic-rules.ts`

- [ ] **Step 1: Move `wrapInPrecStack` to `transform-path.ts`**

Append to `packages/codegen/src/dsl/transform-path.ts`:

```ts
import type { RuntimeRule as RuntimeRule2 } from './runtime-shapes.ts';

/**
 * Wrap `content` in the accumulated prec stack collected during path
 * descent. Each entry in `precStack` is the original prec wrapper the
 * path crossed; we reapply them inner-first so the outer-most prec is
 * the outermost in the result.
 */
export function wrapInPrecStack(
	content: RuntimeRule2,
	precStack: readonly RuntimeRule2[] | undefined,
	reconstructPrec: (
		wrapper: RuntimeRule2,
		newContent: RuntimeRule2
	) => RuntimeRule2
): RuntimeRule2 {
	if (!precStack?.length) return content;
	let result = content;
	for (let i = precStack.length - 1; i >= 0; i--) {
		result = reconstructPrec(precStack[i]!, result);
	}
	return result;
}
```

(If `transform-path.ts` already imports `RuntimeRule` from `runtime-shapes.ts`, reuse the existing import alias instead of the `RuntimeRule2` workaround above — inspect the file first.)

- [ ] **Step 2: Move `registerAliasedVariant` + local helpers into `transform.ts`**

At the bottom of `packages/codegen/src/dsl/transform.ts`, append the functions (copy verbatim from `synthetic-rules.ts`):

```ts
// ---------------------------------------------------------------------------
// Aliased-variant synthesis — shared between variant() and alias()
// placeholders. Handles the mechanics of "extract an arbitrary sub-rule
// into a hidden named rule, return an alias node that points at it,
// wrap in prec where needed, and factor out empty-matching content
// tree-sitter won't accept as a syntactic rule."
// ---------------------------------------------------------------------------

export function registerAliasedVariant(
	hiddenName: string,
	aliasValue: string,
	originalMember: RuntimeRule,
	bodyWrapper: (body: RuntimeRule) => RuntimeRule
): RuntimeRule {
	const isUpperCase = originalMember.type === originalMember.type.toUpperCase();
	const wasEmpty = matchesEmpty(originalMember);
	const factored = factorOutEmptiness(originalMember);
	if (wasEmpty && !factored) {
		throw new Error(
			`variant()/alias(): can't extract '${hiddenName}' — its content matches the empty string and no non-empty core could be factored out. ` +
				`Tree-sitter rejects syntactic rules that match empty. Restructure the parent rule (e.g. lift the empty case outside the choice) before splitting.`
		);
	}
	const body = factored ? factored.nonEmpty : originalMember;
	registerSyntheticRule(hiddenName, bodyWrapper(body as RuntimeRule));
	const aliasNode = {
		type: isUpperCase ? 'ALIAS' : 'alias',
		content: { type: isUpperCase ? 'SYMBOL' : 'symbol', name: hiddenName },
		named: true,
		value: aliasValue
	} as unknown as RuntimeRule;
	if (factored) {
		const optional = (globalThis as { optional?: (c: unknown) => unknown })
			.optional;
		if (typeof optional !== 'function') {
			throw new Error(
				'transform: no global optional() found — variant()/alias() on empty-matching content needs runtime optional()'
			);
		}
		return optional(aliasNode) as RuntimeRule;
	}
	return aliasNode;
}

export function matchesEmpty(rule: RuntimeRule): boolean {
	const t = rule.type;
	if (isBlankType(t)) return true;
	if (isOptionalType(t)) return true;
	if (isPlainRepeatType(t)) return true;
	if (isChoiceType(t)) {
		const members = (rule as unknown as { members: RuntimeRule[] }).members;
		return members.some((m) => matchesEmpty(m));
	}
	if (isSeqType(t)) {
		const members = (rule as unknown as { members: RuntimeRule[] }).members;
		return members.every((m) => matchesEmpty(m));
	}
	return false;
}

function factorOutEmptiness(rule: RuntimeRule): { nonEmpty: unknown } | null {
	if (!matchesEmpty(rule)) return null;
	return extractNonEmpty(rule);
}

function extractNonEmpty(rule: RuntimeRule): { nonEmpty: unknown } | null {
	const t = rule.type;
	if (isPlainRepeatType(t)) {
		const r = rule as unknown as Record<string, unknown>;
		const nonEmpty: Record<string, unknown> = {
			...r,
			type: t === 'REPEAT' ? 'REPEAT1' : 'repeat1'
		};
		return { nonEmpty };
	}
	if (isOptionalType(t)) {
		const inner = (rule as unknown as { content: RuntimeRule }).content;
		return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner };
	}
	if (isChoiceType(t)) {
		const members = (rule as unknown as { members: RuntimeRule[] }).members;
		const nonEmpty = members.filter((m) => !matchesEmpty(m));
		if (nonEmpty.length === 0) return null;
		if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] };
		return { nonEmpty: { type: t, members: nonEmpty } };
	}
	if (isSeqType(t)) {
		const members = [
			...(rule as unknown as { members: RuntimeRule[] }).members
		];
		for (let i = 0; i < members.length; i++) {
			const factored = extractNonEmpty(members[i]!);
			if (factored) {
				members[i] = factored.nonEmpty as RuntimeRule;
				return { nonEmpty: { type: t, members } };
			}
		}
		return null;
	}
	return null;
}
```

- [ ] **Step 3: Update `transform.ts` imports**

At the top of `transform.ts`, adjust the imports. Drop `registerAliasedVariant`, `wrapInPrecStack`, `matchesEmpty` from the `synthetic-rules.ts` import; add `wrapInPrecStack` from `transform-path.ts`; add `isBlankType`, `isOptionalType`, `isPlainRepeatType` to the existing `runtime-shapes.ts` import:

```ts
import {
	parsePath,
	applyPath,
	reconstructWrapper,
	reconstructPrec,
	reconstructContainer,
	wrapInPrecStack
} from './transform-path.ts';
import {
	isFieldPlaceholder,
	type FieldPlaceholder,
	maybeKeywordSymbol
} from './field.ts';
import { isAliasPlaceholder, type AliasPlaceholder } from './alias.ts';
import { isVariantPlaceholder, type VariantPlaceholder } from './variant.ts';
import {
	getCurrentRuleKind,
	registerPolymorphVariant,
	registerSyntheticRule,
	registerConflict
} from './synthetic-rules.ts';
import {
	isFieldLike,
	isPrecWrapper,
	isWrapperType,
	isSeqType,
	isChoiceType,
	isBlankType,
	isOptionalType,
	isPlainRepeatType,
	type RuntimeRule
} from './runtime-shapes.ts';
```

- [ ] **Step 4: Delete the moved definitions from `synthetic-rules.ts`**

Delete from `packages/codegen/src/dsl/synthetic-rules.ts`:

- `registerAliasedVariant` (the whole export + its docstring)
- `matchesEmpty` (the whole export + its docstring)
- `factorOutEmptiness` (the local fn + its docstring)
- `extractNonEmpty` (the local fn + its docstring)
- `wrapInPrecStack` (the whole export + its docstring)

- [ ] **Step 5: Type-check + test + regenerate**

Run: `pnpm -r run type-check && pnpm test 2>&1 | tail -20`
Expected: clean.

Run: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src && npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src && npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src`
Expected: exit 0 for all three.

Run: `pnpm test 2>&1 | tail -20`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/dsl/transform.ts packages/codegen/src/dsl/transform-path.ts packages/codegen/src/dsl/synthetic-rules.ts
git commit -m "adr-0009 phase 5: relocate registerAliasedVariant + wrapInPrecStack

registerAliasedVariant + matchesEmpty / factorOutEmptiness / extractNonEmpty
move to transform.ts (their only caller). wrapInPrecStack moves to
transform-path.ts next to reconstructPrec which it delegates to."
```

---

## Task 6: Delete `synthetic-rules.ts`

**Files:**

- Modify: `packages/codegen/src/dsl/transform.ts`
- Delete: `packages/codegen/src/dsl/synthetic-rules.ts`

Final state: `synthetic-rules.ts` should now only hold three wire-only registration wrappers (`registerSyntheticRule`, `registerPolymorphVariant`, `registerConflict`) and a `getCurrentRuleKind` passthrough. All four are thin shims that bounce to wire. Merge them into their single caller (`transform.ts`) and delete the file.

- [ ] **Step 1: Inline the four shims into `transform.ts`**

In `packages/codegen/src/dsl/transform.ts`, replace the `synthetic-rules.ts` import line with direct wire-module calls. Adjust the top-of-file imports:

```ts
import {
	isFieldPlaceholder,
	type FieldPlaceholder,
	maybeKeywordSymbol
} from './field.ts';
import { isAliasPlaceholder, type AliasPlaceholder } from './alias.ts';
import { isVariantPlaceholder, type VariantPlaceholder } from './variant.ts';
import {
	wireRegisterSyntheticRule,
	wireRegisterPolymorphVariant,
	wireRegisterConflict,
	wireGetCurrentRuleKind
} from './wire.ts';
```

Then replace call sites inside `transform.ts`:

- `getCurrentRuleKind()` → `wireGetCurrentRuleKind()`
- `registerPolymorphVariant(parentKind, name)` → replace with:

  ```ts
  if (!wireRegisterPolymorphVariant(parentKind, name)) {
  	throw new Error(
  		`variant('${name}'): no active wire() context — variant() must run inside a rule callback under wire()`
  	);
  }
  ```

- `registerSyntheticRule(hidden, body)` → replace with:

  ```ts
  if (!wireRegisterSyntheticRule(hidden, body)) {
  	throw new Error(
  		`registerSyntheticRule('${hidden}'): no active wire() context`
  	);
  }
  ```

- `registerConflict(names)` → replace with:

  ```ts
  if (names.length > 0 && !wireRegisterConflict(names)) {
  	throw new Error(`registerConflict: no active wire() context`);
  }
  ```

Search the file for every call and apply. Use the Grep tool to double-check no stragglers.

- [ ] **Step 2: Update `field.ts` to call wire directly**

In `packages/codegen/src/dsl/field.ts`, replace `import { registerSyntheticRule } from './synthetic-rules.ts'` with `import { wireRegisterSyntheticRule } from './wire.ts'`, and inline the check inside `maybeKeywordSymbol`:

```ts
if (!wireRegisterSyntheticRule(hiddenName, precBody)) {
	throw new Error(
		`field('${fieldName}', <STRING>): no active wire() context — call must occur inside a rule callback wrapped by wire()`
	);
}
```

Replacing the prior `registerSyntheticRule(hiddenName, precBody)` line.

- [ ] **Step 3: Delete `synthetic-rules.ts`**

Run: `rm packages/codegen/src/dsl/synthetic-rules.ts`

- [ ] **Step 4: Sanity — no dangling imports**

Run: grep for `synthetic-rules` across the repo.

```
Grep: pattern = "synthetic-rules", scope = packages/
```

Expected: zero matches in any `.ts` file (transpiled `grammar.js` under `.sittir/` may still reference deleted symbols — regenerate in the next step).

- [ ] **Step 5: Regenerate all grammars**

Run: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src && npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src && npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src`
Expected: exit 0 for all three.

- [ ] **Step 6: Full test suite + type-check**

Run: `pnpm -r run type-check && pnpm test 2>&1 | tail -30`
Expected: all pass.

- [ ] **Step 7: Update the ADR status to Accepted**

Edit the top of `docs/adr/0009-remove-grammar-wrapper.md`, changing `**Status**: Proposed` to `**Status**: Accepted` with the current date.

- [ ] **Step 8: Commit**

```bash
git add -u
git commit -m "adr-0009 phase 6: delete synthetic-rules.ts

File had shrunk to four wire-shim wrappers after phases 1-5. Inlined
each into the single caller (transform.ts + field.ts::maybeKeywordSymbol)
and removed the file. ADR-0009 decision implemented; status → Accepted.

packages/codegen/src/dsl/ is now wire-context-native end to end — no
module-level accumulators, no globalThis.grammar monkey-patch."
```

---

## Task 7: Invert wire composition order; migrate three inline transforms to declarative

**Files:**

- Modify: `packages/codegen/src/dsl/wire.ts`
- Modify: `packages/rust/overrides.ts`

Wire currently composes polymorphs first, transforms second — transforms wrap the polymorph-wrapped fn. This leaves paths like `'2/_expression'` broken inside `array_expression` / `or_pattern` / `range_expression` (polymorph already replaced arms with aliases before transforms see them), forcing those three rules to stay as inline `transform()` calls in `rules:`. Invert the order: transforms wrap the user fn first, polymorphs wrap the transforms-wrapped fn second. Then the three migrate declaratively.

Execution order before: `user → polymorph-variants → transforms`.
After: `user → transforms → polymorph-variants`. Transforms see base shape; polymorphs split whatever remains.

`_pattern` (line 514) stays inline — it uses `alias($._wildcard_pattern, $.wildcard_pattern)` which needs `$` at rule-fn-call time, and `TransformsConfig` values are evaluated at config-object-literal time (no `$`). Adding a callback form of `TransformsConfig` is YAGNI for one site; revisit if a second case emerges.

- [ ] **Step 1: Swap composition order in `wire()`**

In `packages/codegen/src/dsl/wire.ts`, reorder the two compose calls inside `wire(config)`. Change:

```ts
composeOrSynthesizePolymorphParents(outRules, polymorphs);
composeOrSynthesizeTransformParents(outRules, transforms);
```

to:

```ts
// Transforms first, polymorphs second — transforms wrap the user
// fn innermost and see the base-shape rule tree; polymorphs wrap
// the transforms-wrapped fn outermost and split what remains.
// Reversing this (polymorphs first) made inline transforms that
// address base-shape paths (e.g. 'N/_expression' kind-match) break
// because the polymorph already aliased the choice arms.
composeOrSynthesizeTransformParents(outRules, transforms);
composeOrSynthesizePolymorphParents(outRules, polymorphs);
```

- [ ] **Step 2: Run tests to catch anything that depended on the old order**

Run: `pnpm test 2>&1 | tail -30`
Expected: all pass. If any test fails whose rule has BOTH a `polymorphs:` entry and inline `transform()` patches on base-shape paths, investigate — migrating that rule to declarative `transforms:` in step 3 should fix it.

- [ ] **Step 3: Regenerate grammars to verify corpus parity**

Run: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src && npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src && npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src && pnpm test 2>&1 | tail -20`
Expected: no regression in corpus tests. Save the pass/fail counts for comparison after step 5.

- [ ] **Step 4: Migrate three inline transforms in `packages/rust/overrides.ts` to declarative `transforms:`**

In `packages/rust/overrides.ts`, locate the `transforms: {...}` block (starts around line 30). Add these three entries, keeping alphabetical ordering with the existing entries:

```ts
        // array_expression polymorph splits '2/0' (semi) / '2/1' (list).
        // These base-shape patches add field labels BEFORE polymorph
        // aliasing — see wire() composition order.
        array_expression: [
            { 1: field('attributes') },
            { '2/_expression': field('elements') },
        ],

        // or_pattern polymorph splits '0' (binary) / '1' (prefix).
        // Field labels land on base-shape choice arms pre-alias.
        or_pattern: {
            '0/0': field('left'), '0/2': field('right'), '1/1': field('right'),
        },

        // range_expression polymorph splits '0'..'3'. Field labels
        // land on base-shape choice arms pre-alias.
        range_expression: {
            '0/0': field('start'), '0/1': field('operator'), '0/2': field('end'),
            '1/0': field('start'), '1/1': field('operator'),
            '2/0': field('operator'), '2/1': field('end'),
            '3': field('operator'),
        },
```

Then delete the corresponding `rules:` entries (the inline `array_expression`, `or_pattern`, `range_expression` callbacks at lines 438–471 before modification). Leave the `_pattern` entry untouched — its `$`-dependent body must stay inline.

- [ ] **Step 5: Regenerate + test**

Run: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src && pnpm test 2>&1 | tail -30`
Expected: pass count matches step 3.

Run: `pnpm -r run type-check 2>&1 | tail -10`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/dsl/wire.ts packages/rust/overrides.ts packages/rust/src
git commit -m "adr-0009 phase 7: invert wire composition, migrate 3 inline transforms

Wire now composes transforms innermost and polymorphs outermost.
Transforms see base-shape rule trees; polymorphs split whatever
remains. Migrates array_expression, or_pattern, range_expression
from inline transform() calls in rules: to declarative transforms:
entries. _pattern stays inline — its body needs \$ at rule-fn-call
time, and TransformsConfig values are evaluated statically."
```

---

## Task 8: Relocate DSL files into subfolders

**Files:**

- Move several `packages/codegen/src/dsl/*.ts` into subfolders
- Update internal imports
- `dsl/index.ts` stays at top, re-exports public surface

Target layout (per ADR):

```
packages/codegen/src/dsl/
  index.ts
  enrich.ts
  runtime-shapes.ts
  primitives/
    field.ts
    variant.ts
    alias.ts
    role.ts
  transform/
    transform.ts
    transform-path.ts
  wire/
    wire.ts
```

Note the ADR also proposed splitting `wire/wire.ts` + `wire/wire-context.ts` and a separate `transform/transform-variant.ts` for `registerAliasedVariant`. Skip both: after Task 5 consolidation `registerAliasedVariant` lives inside `transform.ts` (single-caller colocation — one file, not two), and `WireContext` is small enough that splitting it out gains nothing but an extra hop.

Overrides files import from `@sittir/codegen/dsl` (a package-qualified name resolved to `dsl/index.ts`), so their imports don't change at all.

- [ ] **Step 1: Inspect current imports to map the move**

Run: grep for `from '\\./(field|variant|alias|role|transform|transform-path|wire)\\.ts'` across `packages/codegen/src/dsl/`.

```
Grep: pattern = "from './(field|variant|alias|role|transform|transform-path|wire)\\.ts'", path = packages/codegen/src/dsl
```

Expected: one match per cross-file import. Record them for rewriting.

- [ ] **Step 2: Move files with `git mv`**

Create the subfolders and relocate files, one batch:

```bash
mkdir -p packages/codegen/src/dsl/primitives packages/codegen/src/dsl/transform packages/codegen/src/dsl/wire
git mv packages/codegen/src/dsl/field.ts packages/codegen/src/dsl/primitives/field.ts
git mv packages/codegen/src/dsl/variant.ts packages/codegen/src/dsl/primitives/variant.ts
git mv packages/codegen/src/dsl/alias.ts packages/codegen/src/dsl/primitives/alias.ts
git mv packages/codegen/src/dsl/role.ts packages/codegen/src/dsl/primitives/role.ts
git mv packages/codegen/src/dsl/transform.ts packages/codegen/src/dsl/transform/transform.ts
git mv packages/codegen/src/dsl/transform-path.ts packages/codegen/src/dsl/transform/transform-path.ts
git mv packages/codegen/src/dsl/wire.ts packages/codegen/src/dsl/wire/wire.ts
```

Check: `ls packages/codegen/src/dsl/` should now only show `index.ts`, `enrich.ts`, `runtime-shapes.ts`, and the three subfolders.

- [ ] **Step 3: Rewrite imports inside the moved files**

For each moved file, update imports of sibling modules to their new paths. Concretely:

- `primitives/field.ts`:
  - `from './synthetic-rules.ts'` (if any remain) → gone (file deleted)
  - `from './runtime-shapes.ts'` → `from '../runtime-shapes.ts'`
  - `from './wire.ts'` → `from '../wire/wire.ts'`

- `primitives/variant.ts` + `primitives/alias.ts` + `primitives/role.ts`:
  - any `'./runtime-shapes.ts'` → `'../runtime-shapes.ts'`
  - any `'./wire.ts'` → `'../wire/wire.ts'`
  - any `'./field.ts'` / `'./variant.ts'` / `'./alias.ts'` / `'./role.ts'` → `'./field.ts'` / `./variant.ts` / etc. (same folder — unchanged)

- `transform/transform.ts`:
  - `'./field.ts'` → `'../primitives/field.ts'`
  - `'./alias.ts'` → `'../primitives/alias.ts'`
  - `'./variant.ts'` → `'../primitives/variant.ts'`
  - `'./runtime-shapes.ts'` → `'../runtime-shapes.ts'`
  - `'./transform-path.ts'` → `'./transform-path.ts'` (same folder)
  - `'./wire.ts'` → `'../wire/wire.ts'`

- `transform/transform-path.ts`:
  - `'./runtime-shapes.ts'` → `'../runtime-shapes.ts'`

- `wire/wire.ts`:
  - `'./field.ts'` → `'../primitives/field.ts'`
  - `'./alias.ts'` → `'../primitives/alias.ts'`
  - `'./variant.ts'` → `'../primitives/variant.ts'`
  - `'./transform.ts'` → `'../transform/transform.ts'`
  - `'./runtime-shapes.ts'` → `'../runtime-shapes.ts'`

Open each file and adjust imports exactly. Use TS compiler error output to catch misses (step 5).

- [ ] **Step 4: Update `dsl/index.ts` re-exports**

Rewrite `packages/codegen/src/dsl/index.ts`:

```ts
/**
 * @sittir/codegen/dsl — sittir's DSL layer for override files.
 *
 * Stable import surface for `packages/<lang>/overrides.ts`. The
 * internal layout is a detail — consumers always import from here.
 */

export { transform, insert, replace } from './transform/transform.ts';
export { role } from './primitives/role.ts';
export { enrich } from './enrich.ts';
export { alias } from './primitives/alias.ts';
export { variant } from './primitives/variant.ts';
export { field } from './primitives/field.ts';
export { wire } from './wire/wire.ts';
```

- [ ] **Step 5: Update `enrich.ts` + any other top-level `dsl/` file imports**

In `packages/codegen/src/dsl/enrich.ts`, adjust any imports it has of sibling DSL files to the new subfolder paths. (Run a grep to find any.)

- [ ] **Step 6: Update `compiler/evaluate.ts` imports**

In `packages/codegen/src/compiler/evaluate.ts`, adjust the wire import:

```ts
import type { WireContext } from '../dsl/wire/wire.ts';
```

(And `../dsl/role.ts` → `../dsl/primitives/role.ts` if used.)

- [ ] **Step 7: Move test files**

Tests under `packages/codegen/src/dsl/__tests__/` don't need to move — they already live in a sibling folder. But their imports change. Grep all test files for the moved modules and rewrite:

```
Grep: pattern = "from '\\.\\./(field|variant|alias|role|transform|transform-path|wire)\\.ts'", path = packages/codegen/src/dsl/__tests__
```

For each match, change `'../field.ts'` → `'../primitives/field.ts'`, `'../transform.ts'` → `'../transform/transform.ts'`, `'../wire.ts'` → `'../wire/wire.ts'`, etc.

- [ ] **Step 8: Type-check + test**

Run: `pnpm -r run type-check 2>&1 | tail -40`
Expected: no errors. If errors appear, they'll tell you exactly which import path is wrong — fix and re-run.

Run: `pnpm test 2>&1 | tail -30`
Expected: all tests pass.

- [ ] **Step 9: Regenerate grammars end-to-end**

Run: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src && npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src && npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src && pnpm test 2>&1 | tail -20`
Expected: exit 0; test pass count unchanged.

- [ ] **Step 10: Commit**

```bash
git add -u
git commit -m "adr-0009 phase 8: reorganize dsl/ into primitives/, transform/, wire/ subfolders

Pure file-layout hygiene — index.ts re-exports so the public import
surface ('@sittir/codegen/dsl') stays unchanged. Overrides files
don't touch.

Layout:
  primitives/  — author-facing DSL (field, variant, alias, role)
  transform/   — transform family (transform, transform-path)
  wire/        — wire (currently single file; split later if grows)
  enrich.ts, runtime-shapes.ts, index.ts — top-level"
```

---

## Self-Review

**Spec coverage:**

- ADR: delete installGrammarWrapper — ✅ Task 1
- ADR: wire single owner of synthetic-rule state — ✅ Tasks 2–3
- ADR: register\*() throw outside wire context — ✅ Task 2 (throws via wire's active-context pointer — per plan's "Note on no module state", that pointer is intentional, not an accumulator)
- ADR: `absorbModuleLoadSyntheticRules` deleted — ✅ Task 3 step 2
- ADR: relocate `maybeKeywordSymbol` → field.ts — ✅ Task 4
- ADR: relocate `registerAliasedVariant` → transform.ts — ✅ Task 5
- ADR: relocate `matchesEmpty`/`factorOutEmptiness`/`extractNonEmpty` — ✅ Task 5 (moved as private to transform.ts; design note says `runtime-shapes.ts`, but they're consumed only by `registerAliasedVariant` which also moves — colocating with the caller is cleaner than splitting for YAGNI reasons)
- ADR: relocate `wrapInPrecStack` → transform-path.ts — ✅ Task 5
- ADR: delete synthetic-rules.ts — ✅ Task 6
- ADR follow-up: deprecate inline `transform()` / migrate `rust/overrides.ts:438/448/464` — ✅ Task 7 (composition-order inversion per ADR option b). Line 514's `_pattern` stays inline with a `why` note (needs `$` — adding callback-form `TransformsConfig` values is YAGNI for one site).
- ADR follow-up: DSL subfolder layout — ✅ Task 8 (simplified: wire stays one file; `registerAliasedVariant` stays in transform.ts since Task 5 already colocates it with its only caller).

**Placeholder scan:** No TBD / TODO / "similar to". Every code block is actual content.

**Type consistency:** `withWireContext` signature used identically across polymorph-metadata + transform-hoist tests. `WireContext` imported from `wire.ts` (then `wire/wire.ts` after Task 8) in every consumer. `PolymorphVariant` import path in `evaluate.ts` matches `types.ts`. `TransformsConfig` keeps its existing `PatchMap | PatchMap[]` value shape — no expansion to callback form.

**Rollback plan:** Each phase commits separately. Task 2's "register\*() throw" is the highest-risk step — if it reveals a production path not under wire, revert and investigate. Task 7's composition-order inversion is the second-highest — if a rule that mixes polymorphs + transforms breaks, the fix is usually a declarative migration (that rule's inline transform was depending on the old order). Task 8 is pure file moves; failures are import-path errors that TypeScript flags immediately.
