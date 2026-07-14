# Enrich Base-Grammar Un-aliasing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new enrich pass that automatically drops a base-grammar `alias($.X, $.Y)` whenever `X`'s rule body is structurally distinct from the other rule(s) aliasing onto the same target name `Y`, resolving all 7 currently-live `parsekind-noninjective` diagnostics.

**Architecture:** Reuse the existing `diagnoseParseKindCollisions` decision function unmodified, fed by a new per-rule enrich pass that walks each rule's `ALIAS` nodes, groups them by target name, and computes structural signatures via a phase-generalized `rulesEqual`. On a genuine collision, rewrite the grammar to drop the offending alias(es) and emit the diagnostic at a downgraded (non-blocking) severity as an audit trail.

**Tech Stack:** TypeScript, sittir's phase-tagged `Rule<Phase>` compiler IR (`packages/codegen/src/types/rule.ts`), `packages/codegen/src/dsl/enrich.ts`.

## Global Constraints

- DRY is the #1 rule: reuse `diagnoseParseKindCollisions` (`compiler/diagnostics/parsekind-collisions.ts:35`) and the generalized `rulesEqual` (`compiler/normalize.ts:1138`) — do not reimplement either's decision logic.
- Never hand-edit generated artifacts (`packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`, `overrides.suggested.ts`) — fix codegen source and regenerate.
- No casts to clear type errors — fix the real type.
- Every codegen-source-touching task must regenerate all 3 grammars and stage the regenerated manifest/fixtures before committing.
- `validate:native` output changes land in dedicated `chore(validator)` commits, separate from feature/source commits.
- Rust-touching tasks must run `cargo check --workspace --features napi-bindings` cleanly (this plan touches no Rust source directly, but the regen tasks still trigger native builds — run it anyway).
- Every codegen-source-touching or regen-touching task must run the FULL `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` sweep (not a targeted subset). Baseline to reconfirm fresh at Task 1: `rust=125 / typescript=76 / python=107` (`readRenderParseAstMatchPass`). Some baseline movement in the 7 specifically-touched kinds (listed in Task 3) is *expected* (real CST shape change) — verify each via `probe-kind` round-trip, don't wave it through OR treat it as an automatic regression. Any movement outside those 7 kinds is stop-and-investigate.

## Known facts (verified this session — use directly, do not re-derive)

- `AliasRule<Phase extends WrapperPhase = 'link'>` (`types/rule.ts:593-600`): `{ type: typeof ALIAS, content: Rule<Phase>, named: boolean, value: string }`. `content` is the rule being aliased (`X` in `alias($.X, $.Y)`); `value` is the resolved target name string (`Y`). Valid only at `WrapperPhase` = `'evaluate' | 'link'` (`types/rule.ts`, near the `PhaseName`/`WrapperPhase` definitions) — wrapper-deletion strips `ALIAS` nodes by `'normalize'`/`'simplify'`.
- `PhaseName = 'evaluate' | 'link' | 'normalize' | 'simplify'` (`types/rule.ts`).
- `dsl/primitives/alias.ts`'s `alias(rule, value?)` (the DSL primitive authors/enrich call) delegates to a native `alias()` injected at runtime, producing the `AliasRule` shape above — confirms the field mapping (first positional arg → `content`, second → resolved `value` string).
- `dsl/enrich.ts`'s `enrich(base)` (L109-227) iterates every top-level rule name in `base.grammar.rules` (a `Record<string, Rule>`, aliased as `rulesBag`), calling `applyEnrichPasses(name, rule, kwRules, supertypeNames, rulesBag, clauseGroupRules, clauseDedupeMap, groupDedupeMap, visibleGroupHiddenNames, wordMatcher)` per rule, then merges all results back into `base.grammar.rules` before returning. `rulesBag` gives lookup access to every OTHER top-level rule's current body by name.
- `applyEnrichPasses` (`dsl/enrich.ts:250-311`) runs a fixed-point loop of `applySymbolToField`/`applyOptionalKeyword`, then (once converged) runs `applyClauseHoist` once. The new pass is added as a further step, after `applyClauseHoist`, in this same per-rule function.
- `diagnoseParseKindCollisions<T>(input: {ownerKind: string, slotName: string, values: {original: T, parseKind: string|undefined, storageKind: string|undefined, structuralSignature: string}[]})` (`compiler/diagnostics/parsekind-collisions.ts:35-98`) returns `{values: T[], diagnostics: ParseKindCollisionDiagnostic[]}`. Buckets `values` by `parseKind`; for buckets with 2+ distinct `storageKind`s, checks `distinct(structuralSignature)`: length 1 → silently picks a representative (merges); length >1 → emits a `ParseKindCollisionDiagnostic` (`code: 'parsekind-noninjective'`, `severity: 'error'`, `canProceed: true`, `shape: 'propose-distinct-alias'`, plus `ownerKind`/`slotName`/`parseKind`/`storageKinds`/`message`/`proposal`).
- `rulesEqual(a: Rule<'link'>, b: Rule<'link'>): boolean` (`compiler/normalize.ts:1138-1189`) recursively compares `STRING`/`PATTERN`/`SYMBOL`/`SEQ`/`CHOICE`/`OPTIONAL`/`REPEAT`/`FIELD`/`VARIANT`/`SUPERTYPE` rule shapes by structure (not reference). Every field it reads (`type`, `members`, `content`, `name`, `value`, `separator`, `aliasedFrom`) exists identically on the corresponding `Rule<'evaluate'>` variant.
- The 7 live `parsekind-noninjective` instances (as of 2026-07-14, `packages/{rust,typescript}/.sittir/grammar-diagnostics.json`) to expect resolved after this plan: rust `scoped_type_identifier.path` (`[generic_type_with_turbofish, generic_type]` → `generic_type`); typescript `_arrow_function_parameter.parameter`, `_index_signature_colon.name`, `augmented_assignment_expression.left` (all `[_reserved_identifier, identifier]`/`[identifier, _reserved_identifier]` → `identifier`), `_jsx_string.content` (`[unescaped_double_jsx_string_fragment, unescaped_single_jsx_string_fragment]` → `string_fragment`), `string.contents` (`[unescaped_double_string_fragment, unescaped_single_string_fragment]` → `string_fragment`), `type_predicate.name` (`[identifier, predefined_type]` → `identifier`).

---

## Task 1: Generalize `rulesEqual`'s phase typing

**Files:**
- Modify: `packages/codegen/src/compiler/normalize.ts:1138` (the `rulesEqual` function signature only — body is unchanged, it already only touches phase-generic fields)
- Test: `packages/codegen/src/compiler/__tests__/normalize.test.ts` (check this file exists and find `rulesEqual`'s existing test coverage first; if no dedicated test file, create `packages/codegen/src/compiler/__tests__/rules-equal.test.ts`)

**Interfaces:**
- Consumes: nothing new — reads the existing `Rule<Phase>`/`PhaseName`/`WrapperPhase` types from `types/rule.ts`.
- Produces: `rulesEqual<P extends PhaseName>(a: Rule<P>, b: Rule<P>): boolean` — a phase-generic version callable at any phase, used by Task 2's new enrich pass with `P = 'evaluate'`, and still callable by all existing `Rule<'link'>` call sites unchanged (TypeScript will infer `P = 'link'` there).

- [ ] **Step 1: Read `rulesEqual`'s current full body and existing call sites**

Read `packages/codegen/src/compiler/normalize.ts:1138-1189` (the full function, already quoted above in "Known facts" — confirm no drift since this plan was written) and find every current call site via `find_all_references`/`trace_callers` on `rulesEqual`. Confirm all existing callers pass `Rule<'link'>` values (if any pass something else, that changes this task's risk — note it before proceeding).

- [ ] **Step 2: Write a failing test proving the current signature rejects `Rule<'evaluate'>`**

Add to the test file:

```typescript
import { describe, it, expect } from 'vitest';
import { rulesEqual } from '../normalize.ts';
import type { Rule } from '../../types/rule.ts';
import { STRING, SEQ } from '../../types/rule-types.ts';

describe('rulesEqual — phase-generic', () => {
	it('accepts Rule<\'evaluate\'> values (not just Rule<\'link\'>)', () => {
		const a: Rule<'evaluate'> = { type: STRING, value: 'x' } as Rule<'evaluate'>;
		const b: Rule<'evaluate'> = { type: STRING, value: 'x' } as Rule<'evaluate'>;
		// This line is the actual test: it must TYPE-CHECK, not just run.
		// Before Step 3, rulesEqual is typed (a: Rule<'link'>, b: Rule<'link'>),
		// so passing Rule<'evaluate'> values is a TYPE ERROR — the test file
		// itself will fail to compile (tsgo), which is the "RED" state here.
		expect(rulesEqual(a, b)).toBe(true);
	});

	it('still works for Rule<\'link\'> values (existing behavior unchanged)', () => {
		const a: Rule<'link'> = { type: SEQ, members: [{ type: STRING, value: 'x' } as Rule<'link'>] } as Rule<'link'>;
		const b: Rule<'link'> = { type: SEQ, members: [{ type: STRING, value: 'x' } as Rule<'link'>] } as Rule<'link'>;
		expect(rulesEqual(a, b)).toBe(true);
	});

	it('detects structurally distinct rules', () => {
		const a: Rule<'evaluate'> = { type: STRING, value: 'x' } as Rule<'evaluate'>;
		const b: Rule<'evaluate'> = { type: STRING, value: 'y' } as Rule<'evaluate'>;
		expect(rulesEqual(a, b)).toBe(false);
	});
});
```

- [ ] **Step 2b: Run tsgo to confirm the RED state is a type error, not a runtime failure**

Run: `pnpm exec tsgo --noEmit -p packages/codegen/tsconfig.json`
Expected: FAIL — a type error on the `rulesEqual(a, b)` call in the first test (`Rule<'evaluate'>` not assignable to `Rule<'link'>`), confirming the current signature is the thing under test.

- [ ] **Step 3: Generalize the signature**

In `packages/codegen/src/compiler/normalize.ts`, change:

```typescript
export function rulesEqual(a: Rule<'link'>, b: Rule<'link'>): boolean {
```

to:

```typescript
export function rulesEqual<P extends PhaseName>(a: Rule<P>, b: Rule<P>): boolean {
```

Add `PhaseName` to the existing `Rule` import from `../types/rule.ts` at the top of the file if not already imported (check the current import line first — `Rule` is almost certainly already imported given the function's existing usage; `PhaseName` likely needs adding). Every internal recursive call (`rulesEqual(m, (b as typeof a).members[i]!)` etc.) and every `as typeof a` cast in the function body stays exactly as-is — they already operate structurally and don't reference the phase parameter by name.

- [ ] **Step 4: Run tsgo + tests to confirm they pass**

Run: `pnpm exec tsgo --noEmit -p packages/codegen/tsconfig.json`
Expected: PASS (no type errors)

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/rules-equal.test.ts` (or the actual test file path from Step 1)
Expected: PASS, all 3 new tests green

- [ ] **Step 5: Run the full codegen vitest suite to confirm zero regressions from the signature change**

Run: `pnpm exec vitest run packages/codegen/src`
Expected: same failure count as HEAD before this change (record the exact count first via `git stash` + a baseline run, per this project's established A/B discipline — do not assume zero pre-existing failures)

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/compiler/normalize.ts packages/codegen/src/compiler/__tests__/rules-equal.test.ts
git commit -m "refactor(codegen): generalize rulesEqual to any Rule<Phase>

Widens rulesEqual's signature from Rule<'link'> to a phase-generic
<P extends PhaseName>(a: Rule<P>, b: Rule<P>) — the comparison body
already only touches fields (type/members/content/name/value/separator/
aliasedFrom) that exist identically across every phase's Rule<Phase>
variant, so this is a type-only change with no behavior difference for
existing Rule<'link'> callers. Needed so the new enrich un-aliasing pass
(next commit) can reuse this exact comparison logic on Rule<'evaluate'>
values, per DRY."
```

---

## Task 2: Implement the new enrich un-aliasing pass

**Files:**
- Modify: `packages/codegen/src/dsl/enrich.ts` (add the new pass function + wire it into `applyEnrichPasses`)
- Test: `packages/codegen/src/dsl/__tests__/enrich-unalias.test.ts` (new file, following the naming convention of the existing `enrich-clause-hoist.test.ts` in the same directory)

**Interfaces:**
- Consumes: `rulesEqual<P extends PhaseName>` (Task 1), `diagnoseParseKindCollisions` (`compiler/diagnostics/parsekind-collisions.ts`), `ALIAS`/`CHOICE`/`SEQ`/`SYMBOL` type guards already imported in `enrich.ts` (`isChoiceType`/`isSeqType` from `types/runtime-shapes.ts`, matching `applyClauseHoist`'s existing import pattern).
- Produces: a new internal function `applyUnaliasDistinct(ruleName: string, rule: Rule, rulesBag: Record<string, Rule>): { rule: Rule; diagnostics: ParseKindCollisionDiagnostic[] }`, called from `applyEnrichPasses` after the existing `applyClauseHoist` call; a module-level diagnostic accumulator with exported `resetUnaliasDiagnostics(): void` / `drainUnaliasDiagnostics(): ParseKindCollisionDiagnostic[]` (test-facing, matching this file's existing export convention) and internal `recordUnaliasDiagnostic(d: ParseKindCollisionDiagnostic): void`; an exported `canonicalRuleSignature(node: unknown): string` helper.

- [ ] **Step 1: Read the exact current `applyEnrichPasses` body one more time to confirm no drift**

Read `packages/codegen/src/dsl/enrich.ts:250-311` directly (quoted in full under "Known facts" above) — confirm the fixed-point loop + `applyClauseHoist` call are still exactly as described before adding a new step after them.

- [ ] **Step 2: Write a failing test for the detection + drop behavior on a structurally-distinct collision**

Create `packages/codegen/src/dsl/__tests__/enrich-unalias.test.ts`, following the established convention in this directory (`enrich-clause-hoist.test.ts`): test through `enrich()`'s public interface with `installFakeDsl()`, not by hand-constructing raw `Rule` literals and calling an internal function directly.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich, drainUnaliasDiagnostics, resetUnaliasDiagnostics } from '../enrich.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

describe('enrich — base-grammar un-aliasing', () => {
	it('drops an alias when the colliding storage kinds are structurally distinct', () => {
		resetUnaliasDiagnostics();
		const g = globalThis as unknown as {
			seq: (...m: unknown[]) => unknown;
			choice: (...m: unknown[]) => unknown;
			alias: (rule: unknown, value: unknown) => unknown;
			sym: (name: string) => unknown;
		};
		// Mirrors the real rust collision: scoped_type_identifier.path
		// collapses [generic_type_with_turbofish, generic_type] onto parse
		// kind 'generic_type' — generic_type_with_turbofish has an extra
		// string member, making it structurally distinct from generic_type.
		const base = {
			grammar: {
				rules: {
					generic_type: g.seq(g.sym('type_identifier')),
					generic_type_with_turbofish: g.seq(g.sym('type_identifier'), '::<>'),
					scoped_type_identifier: g.choice(
						g.sym('generic_type'),
						g.alias(g.sym('generic_type_with_turbofish'), g.sym('generic_type'))
					)
				}
			}
		};

		const result = enrich(base) as typeof base;

		// The ALIAS wrapper is gone — the member now references the bare
		// symbol under its own name, not coerced into 'generic_type'.
		const scoped = result.grammar.rules.scoped_type_identifier as { members: Array<{ type: string; name?: string }> };
		expect(scoped.members.some((m) => m.type === 'ALIAS')).toBe(false);
		expect(scoped.members.some((m) => m.name === 'generic_type_with_turbofish')).toBe(true);

		// A diagnostic was still emitted, at a downgraded (non-blocking) severity.
		const diagnostics = drainUnaliasDiagnostics();
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]!.code).toBe('parsekind-noninjective');
		expect(diagnostics[0]!.severity).not.toBe('error');
		expect(diagnostics[0]!.canProceed).toBe(true);
	});

	it('leaves a structurally-identical alias untouched, with no diagnostic', () => {
		resetUnaliasDiagnostics();
		const g = globalThis as unknown as {
			choice: (...m: unknown[]) => unknown;
			alias: (rule: unknown, value: unknown) => unknown;
			sym: (name: string) => unknown;
		};
		const base = {
			grammar: {
				rules: {
					foo_a: 'x',
					foo_b: 'x',
					some_parent: g.choice(
						g.alias(g.sym('foo_a'), g.sym('shared_name')),
						g.alias(g.sym('foo_b'), g.sym('shared_name'))
					)
				}
			}
		};

		const result = enrich(base) as typeof base;

		const parent = result.grammar.rules.some_parent as { members: Array<{ type: string }> };
		expect(parent.members.every((m) => m.type === 'ALIAS')).toBe(true);
		expect(drainUnaliasDiagnostics()).toHaveLength(0);
	});
});

describe('canonicalRuleSignature — agrees with rulesEqual', () => {
	// The design (docs/superpowers/specs/2026-07-14-enrich-base-grammar-unaliasing-design.md
	// §4 point 2) uses canonicalRuleSignature for the actual bucketing key in
	// applyUnaliasDistinct, but relies on rulesEqual as the independently-
	// verified ground truth for "structurally equal" — this test proves the
	// two agree, so a future change to either can't silently diverge them.
	function check(a: Rule, b: Rule, expectedEqual: boolean): void {
		expect(canonicalRuleSignature(a) === canonicalRuleSignature(b)).toBe(expectedEqual);
		expect(rulesEqual(a as Rule<'evaluate'>, b as Rule<'evaluate'>)).toBe(expectedEqual);
	}

	it('identical rules: both signature-equal and rulesEqual-true', () => {
		check({ type: STRING, value: 'x' } as Rule, { type: STRING, value: 'x' } as Rule, true);
	});

	it('distinct rules: both signature-unequal and rulesEqual-false', () => {
		check(
			{ type: SEQ, members: [{ type: SYMBOL, name: 'a' } as Rule] } as Rule,
			{
				type: SEQ,
				members: [{ type: SYMBOL, name: 'a' } as Rule, { type: STRING, value: '::<>' } as Rule]
			} as Rule,
			false
		);
	});

	it('key insertion order does not affect either check', () => {
		const a = { value: 'x', type: STRING } as Rule;
		const b = { type: STRING, value: 'x' } as Rule;
		check(a, b, true);
	});
});
```

This requires importing `rulesEqual` from `../../compiler/normalize.ts` and `canonicalRuleSignature` from `../enrich.ts` (export it, even though it's otherwise `@internal` — mark it `/** @internal — exported for testing only */` matching this file's existing convention for other test-only exports, if any; check `applyClauseHoist`'s own export status first, since it's also referenced directly by `enrich-clause-hoist.test.ts`).

Adjust the exact literal `Rule` shapes above (field names like `name` on `SYMBOL`, `value` on `STRING`/`ALIAS`) against the REAL current `types/rule.ts` definitions if anything doesn't match — the shapes above are drawn from this session's direct reading of `AliasRule` and the `alias()` DSL primitive, but confirm against the file before trusting the test compiles.

- [ ] **Step 3: Run the test to confirm it fails**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/enrich-unalias.test.ts`
Expected: FAIL — `drainUnaliasDiagnostics`/`resetUnaliasDiagnostics` are not exported from `enrich.ts` yet (module resolution / import error). If the file's TypeScript still compiles somehow (e.g. via a loose `any`-typed import), the first test's assertions on `scoped.members` should fail instead, since nothing currently strips the alias.

- [ ] **Step 4: Implement `applyUnaliasDistinct`**

In `packages/codegen/src/dsl/enrich.ts`, add:

```typescript
/**
 * Deterministic JSON serialization of a rule tree, for use as a bucketing
 * key. A flat `JSON.stringify(x, keys)` replacer-array only whitelists
 * TOP-LEVEL keys and does not sort nested objects' own keys, which would
 * silently corrupt comparisons for a nested Rule tree (inner `members`/
 * `content` objects have different key sets at each level). This sorts
 * every object's keys recursively before stringifying, so two
 * structurally-identical rules always produce byte-identical strings
 * regardless of property insertion order.
 */
function canonicalRuleSignature(node: unknown): string {
	function sortKeysDeep(value: unknown): unknown {
		if (Array.isArray(value)) return value.map(sortKeysDeep);
		if (value !== null && typeof value === 'object') {
			const sorted: Record<string, unknown> = {};
			for (const key of Object.keys(value as Record<string, unknown>).sort()) {
				sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
			}
			return sorted;
		}
		return value;
	}
	return JSON.stringify(sortKeysDeep(node));
}

// Module-level accumulator, mirroring the exact pattern already used for
// the later, assemble-time parsekind-noninjective check
// (compiler/model/node-map.ts:93-122: _parseKindCollisionDiagnostics /
// recordParseKindCollisionDiagnostic / resetParseKindCollisionDiagnostics /
// drainParseKindCollisionDiagnostics). Read that exact code first and
// match its shape precisely (reset-on-drain semantics, array vs Set,
// etc.) rather than inventing a new pattern.
let _unaliasDiagnostics: ParseKindCollisionDiagnostic[] = [];

/** @internal — exported for testing only, matching this file's existing convention. */
export function resetUnaliasDiagnostics(): void {
	_unaliasDiagnostics = [];
}

/** @internal — exported for testing only, matching this file's existing convention. */
export function drainUnaliasDiagnostics(): ParseKindCollisionDiagnostic[] {
	const result = _unaliasDiagnostics;
	_unaliasDiagnostics = [];
	return result;
}

function recordUnaliasDiagnostic(diagnostic: ParseKindCollisionDiagnostic): void {
	_unaliasDiagnostics.push(diagnostic);
}

/**
 * @internal — walk `rule` for ALIAS nodes, group by target name (`.value`),
 * and for any group with 2+ structurally-distinct source rules, drop the
 * offending alias(es) so each surfaces under its own name instead of the
 * shared target. Reuses `diagnoseParseKindCollisions` (the same decision
 * function the later, assemble-time parsekind-noninjective check calls)
 * fed by locally-computed storage/parse-kind facts, since that function's
 * comparison logic is phase-agnostic. See
 * docs/superpowers/specs/2026-07-14-enrich-base-grammar-unaliasing-design.md.
 *
 * Structurally-identical collisions (the common, intentional case) merge
 * with no diagnostic — unchanged from diagnoseParseKindCollisions's
 * existing behavior. Only genuinely-distinct collisions trigger a rewrite,
 * which is always safe: a distinct-storage-kind collision makes read-time
 * dispatch non-injective regardless of author intent, so there is no case
 * where keeping the alias would have been correct.
 */
function applyUnaliasDistinct(
	ruleName: string,
	rule: Rule,
	rulesBag: Record<string, Rule>
): { rule: Rule; diagnostics: ParseKindCollisionDiagnostic[] } {
	// Find every ALIAS node directly reachable from `rule` without descending
	// through another rule's own top-level definition (mirrors applyClauseHoist's
	// descent pattern: SEQ/CHOICE/REPEAT/FIELD members, not SYMBOL targets).
	type AliasSite = { path: (string | number)[]; aliasRule: Rule & { type: typeof ALIAS; content: Rule; value: string } };
	const sites: AliasSite[] = [];
	function collectAliasSites(node: Rule, path: (string | number)[]): void {
		if (node.type === ALIAS) {
			sites.push({ path, aliasRule: node as AliasSite['aliasRule'] });
			return; // do not descend into an alias's own content for nested collection
		}
		if (isSeqType(node.type) || isChoiceType(node.type)) {
			const members = (node as unknown as { members?: Rule[] }).members;
			if (Array.isArray(members)) {
				members.forEach((m, i) => collectAliasSites(m, [...path, 'members', i]));
			}
			return;
		}
		if (isRepeatType(node.type) || isPrecWrapper(node as { type: string })) {
			const content = (node as unknown as { content?: Rule }).content;
			if (content) collectAliasSites(content, [...path, 'content']);
			return;
		}
		if (isFieldType(node.type)) {
			const content = (node as unknown as { content?: Rule }).content;
			if (content) collectAliasSites(content, [...path, 'content']);
		}
	}
	collectAliasSites(rule, []);

	if (sites.length === 0) return { rule, diagnostics: [] };

	// Group by target name — every symbol also naturally has its own
	// "target name" (itself), so include the rule's own non-aliased SYMBOL
	// siblings in the same bucket when they share a name with an alias site's
	// target (mirrors diagnoseParseKindCollisions's real input shape, which
	// buckets ALL values sharing a parseKind, not just the aliased ones).
	const byTargetName = new Map<string, AliasSite[]>();
	for (const site of sites) {
		const bucket = byTargetName.get(site.aliasRule.value) ?? [];
		bucket.push(site);
		byTargetName.set(site.aliasRule.value, bucket);
	}

	const toDrop = new Set<AliasSite>();
	const diagnostics: ParseKindCollisionDiagnostic[] = [];

	for (const [targetName, group] of byTargetName) {
		if (group.length < 2) continue; // no collision possible with a single aliaser
		const values = group.map((site) => {
			// Resolve content to its underlying rule body for comparison —
			// content is typically SYMBOL(name); look it up in rulesBag.
			const resolved =
				site.aliasRule.content.type === SYMBOL
					? (rulesBag[(site.aliasRule.content as { name: string }).name] ?? site.aliasRule.content)
					: site.aliasRule.content;
			return {
				original: site,
				parseKind: targetName,
				storageKind: site.aliasRule.content.type === SYMBOL ? (site.aliasRule.content as { name: string }).name : undefined,
				structuralSignature: canonicalRuleSignature(resolved)
			};
		});
		const resolution = diagnoseParseKindCollisions({ ownerKind: ruleName, slotName: targetName, values });
		for (const diag of resolution.diagnostics) {
			diagnostics.push({ ...diag, severity: 'info', canProceed: true });
			// Every site in a group that produced a diagnostic gets its alias
			// dropped — diagnoseParseKindCollisions doesn't tell us WHICH
			// individual sites collided (it reasons in aggregate), and since
			// the diagnostic only fires on genuine structural distinctness,
			// dropping all of them is always correct (never safe to keep one
			// aliased and not the other once distinctness is proven).
			for (const site of group) toDrop.add(site);
		}
	}

	if (toDrop.size === 0) return { rule, diagnostics: [] };

	// Rewrite: replace each dropped alias site's node with its own `content`
	// (i.e. `alias($.X, $.Y)` → `$.X`), at the recorded path.
	function rewriteAt(node: Rule, path: (string | number)[], replacement: Rule): Rule {
		if (path.length === 0) return replacement;
		const [key, ...rest] = path;
		if (key === 'members') {
			const idx = path[1] as number;
			const members = (node as unknown as { members: Rule[] }).members.slice();
			members[idx] = rest.length > 2 ? rewriteAt(members[idx]!, path.slice(2), replacement) : replacement;
			return { ...node, members } as Rule;
		}
		if (key === 'content') {
			const content = (node as unknown as { content: Rule }).content;
			return { ...node, content: rest.length > 0 ? rewriteAt(content, rest, replacement) : replacement } as Rule;
		}
		return node;
	}

	let result = rule;
	for (const site of toDrop) {
		result = rewriteAt(result, site.path, site.aliasRule.content);
	}

	return { rule: result, diagnostics };
}
```

Import `diagnoseParseKindCollisions` and `ParseKindCollisionDiagnostic` from `../compiler/diagnostics/parsekind-collisions.ts`, and `SYMBOL`/`ALIAS` from `../types/rule-types.ts` (add to the existing type-guard imports already present in `enrich.ts` — check the current import block first, since `isSeqType`/`isChoiceType`/`isRepeatType`/`isPrecWrapper`/`isFieldType` are already imported per `applyClauseHoist`'s existing usage).

**This is a first-pass implementation — validate the path-based rewrite mechanism (`rewriteAt`) carefully against a REAL rule shape during Step 5's regen, not just the unit test's synthetic fixtures.** The `path` tracking (`'members'`/index vs `'content'`) must exactly mirror `collectAliasSites`'s own descent, and needs a case added for any rule position `applyClauseHoist`'s own descent pattern doesn't cover (it currently omits `OPTIONAL` — check if base-grammar aliases ever sit directly under `optional(...)` without a `CHOICE[x,BLANK]` wrapper already normalizing it away by evaluate time; add an `OPTIONAL` case to both `collectAliasSites` and `rewriteAt` if so).

- [ ] **Step 5: Run the test to confirm it passes**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/enrich-unalias.test.ts`
Expected: PASS, both tests green

- [ ] **Step 6: Wire into `applyEnrichPasses` and the outer `enrich()` driver**

In `applyEnrichPasses` (`dsl/enrich.ts:250-311`), after the existing `applyClauseHoist` call and before `return r;`, add:

```typescript
const unaliasResult = applyUnaliasDistinct(ruleName, r, rulesBag);
r = unaliasResult.rule;
for (const diagnostic of unaliasResult.diagnostics) {
	recordUnaliasDiagnostic(diagnostic);
}
```

This matches the exact established pattern `resolveParseKindCollisionsInSlot` (`compiler/model/node-map.ts:1056-1079`) already uses for the later, assemble-time check: a pure function returns diagnostics, and the call site explicitly records each one into the module-level accumulator (`recordUnaliasDiagnostic`, added in Step 4 above).

Separately, trace `enrich()`'s own callers (`find_all_references` on `enrich`) to find where `.sittir/grammar-diagnostics.json` currently gets assembled from other diagnostic sources (`compiler/diagnostics/grammar-diagnostics.ts`'s `collectGrammarDiagnostics`, or its caller) and wire in a call to `drainUnaliasDiagnostics()` there, merging its output into the same diagnostics list the later `parsekind-noninjective`/other checks feed — so these new, downgraded diagnostics actually surface in the generated `grammar-diagnostics.json` file, not just in-memory for tests.

- [ ] **Step 7: Run the full dsl test suite**

Run: `pnpm exec vitest run packages/codegen/src/dsl`
Expected: same failure count as the Task 1 Step 5 baseline (zero new failures from this task)

- [ ] **Step 8: Commit**

```bash
git add packages/codegen/src/dsl/enrich.ts packages/codegen/src/dsl/__tests__/enrich-unalias.test.ts
git commit -m "feat(codegen): auto-drop structurally-distinct base-grammar aliases

New enrich pass (applyUnaliasDistinct) detects alias(X, Y) sites where
2+ colliding storage kinds share a target parse-kind name and are
structurally distinct, using the existing diagnoseParseKindCollisions
decision function fed by locally-computed facts (not reimplemented).
Drops the offending alias(es) so each storage kind surfaces under its
own name, and still emits a downgraded (info, non-blocking) diagnostic
as an audit trail of the auto-fix.

Wired into applyEnrichPasses, after the existing clause-hoist pass.
Not yet regenerated against real grammars — next commit."
```

---

## Task 3: Full 3-grammar regen + verification

**Files:**
- Regenerate: `packages/{rust,typescript,python}/src/*`, `.sittir/*`, `tests/nodes.test.ts` (via the `gen` CLI command, never hand-edited)

**Interfaces:**
- Consumes: Task 2's `applyUnaliasDistinct`, wired live.
- Produces: regenerated grammar output for all 3 grammars, reflecting the 7 un-aliased kinds.

- [ ] **Step 1: Regenerate all 3 grammars**

Run for each grammar:
```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
```
Expected: each completes without error; the "Regen diff vs HEAD" summary each command prints should show changes ONLY for the touched kinds (rust: `scoped_type_identifier` and whatever else references `generic_type_with_turbofish`/`generic_type`; typescript: `_arrow_function_parameter`, `_index_signature_colon`, `_jsx_string`, `augmented_assignment_expression`, `string`, `type_predicate`, and anything referencing `_reserved_identifier`/`identifier`/`unescaped_double_jsx_string_fragment`/etc.) — python is not expected to change (no live instances there).

- [ ] **Step 2: Confirm the 7 known diagnostics resolved/downgraded**

Run:
```bash
cat packages/rust/.sittir/grammar-diagnostics.json | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log((Array.isArray(d)?d:d.diagnostics||[]).filter(x=>x.code==='parsekind-noninjective'))"
cat packages/typescript/.sittir/grammar-diagnostics.json | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log((Array.isArray(d)?d:d.diagnostics||[]).filter(x=>x.code==='parsekind-noninjective'))"
```
Expected: rust's blocking-severity `parsekind-noninjective` list is empty (the one instance is gone or downgraded); typescript's is empty too (all 6 gone/downgraded). If Task 2 Step 6's diagnostic-emission wiring routes the downgraded diagnostics into a DIFFERENT file/field than `grammar-diagnostics.json`'s existing `parsekind-noninjective` bucket, check there instead — confirm the actual output location against what Task 2 Step 6 implemented, don't assume it matches this exact command.

- [ ] **Step 3: `probe-kind` round-trip verification for each of the 7 touched kinds**

For each of the 7 kinds (rust: `scoped_type_identifier`; typescript: `_arrow_function_parameter`, `_index_signature_colon`, `_jsx_string`, `augmented_assignment_expression`, `string`, `type_predicate`), run:
```bash
pnpm exec tsx packages/cli/src/cli.ts tool probe-kind --grammar <rust|typescript> --kind <kind_name> --reparse
```
Expected: for each, confirm the kind still round-trips correctly (parse → read → render → reparse, byte-identical or the tool's own pass criterion) — a real CST shape change happened here (the un-aliased storage kind now surfaces under its own name instead of being coerced), so this is the check that confirms the change didn't break anything, not an automatic pass.

- [ ] **Step 4: Stage the regenerated files**

```bash
git add packages/rust/src packages/rust/.sittir packages/typescript/src packages/typescript/.sittir packages/python/src packages/python/.sittir
```

- [ ] **Step 5: Commit the regen**

```bash
git commit -m "chore(codegen): regenerate all 3 grammars for un-aliasing pass

Reflects the new applyUnaliasDistinct enrich pass: the 7 previously-live
parsekind-noninjective kinds now surface their un-aliased storage kinds
under their own names. probe-kind round-trip verified for all 7."
```

---

## Task 4: Full validate:native + cargo check gate

**Files:** none (verification-only task)

- [ ] **Step 1: Run cargo check**

Run: `cd rust && cargo check --workspace --features napi-bindings`
Expected: clean, no errors

- [ ] **Step 2: Run the full validate:native sweep**

Run: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native`
Expected: `readRenderParseAstMatchPass` for rust/typescript/python — compare against the Task 1 baseline (reconfirmed fresh at that task's start). Movement in the 7 touched kinds specifically is expected and already verified via Task 3 Step 3's `probe-kind` checks; movement ANYWHERE ELSE is stop-and-investigate, not something to explain away.

- [ ] **Step 3: If validator output changed, commit it separately**

```bash
git add packages/tools/validation-history.jsonl packages/tools/validation-report.json
git commit -m "chore(validator): record validation run (rust/native, typescript/native, python/native)"
```

- [ ] **Step 4: Final summary**

No code changes in this step — just confirm and report: baseline before vs. after, the 7 kinds' individual `probe-kind` results, and that this plan's work is complete and ready for the dependent PR-L plan to build on.
