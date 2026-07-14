# Enrich Base-Grammar Un-aliasing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new enrich pass that automatically drops a base-grammar `alias($.X, $.Y)` whenever `X`'s rule body is structurally distinct from the other rule(s) aliasing onto the same target name `Y`, resolving all 7 currently-live `parsekind-noninjective` diagnostics.

**Architecture:** Reuse the existing `diagnoseParseKindCollisions` decision function unmodified, fed by a new per-rule enrich pass that walks each rule's `ALIAS` nodes, groups them by target name, and clusters by structural equality via `dsl/list-patterns.ts`'s existing, already phase-agnostic `rulesEqual`. On a genuine collision, rewrite the grammar to drop the offending alias(es) and emit the diagnostic at a downgraded (non-blocking) severity as an audit trail.

**Tech Stack:** TypeScript, sittir's phase-tagged `Rule<Phase>` compiler IR (`packages/codegen/src/types/rule.ts`), `packages/codegen/src/dsl/enrich.ts`.

## Revision note (post Task 1 attempt, 2026-07-14)

This plan originally had a Task 1 generalizing `compiler/normalize.ts`'s `rulesEqual` (typed `Rule<'link'>`) to a phase-generic signature. An implementer correctly got BLOCKED on it: `RepeatRule<T>`'s `.separator` field type is a conditional type keyed on the *concrete* phase literal (object-shaped for `'link'`, string for `'evaluate'`) — under a generic, unresolved `P`, TypeScript widens `.separator` to the union of both shapes, breaking the existing `separatorFactsEqual` call with a real type error (not fixable without a cast, which the Global Constraints forbid). Separately, `dsl/enrich.ts` cannot import from `compiler/normalize.ts` at all — this codebase enforces a `dsl → types ← compiler` layering (confirmed via `docs/superpowers/plans/2026-07-06-separator-canonical-mechanism-refresh.md`'s Task 2, which explicitly keeps a second `rulesEqual` in `dsl/list-patterns.ts` "so this stays inside the dsl→types←compiler layering — no compiler/ import"). Generalizing the `compiler/`-side function was never actually usable from `dsl/enrich.ts` regardless of the type issue.

The correct fix: `dsl/list-patterns.ts`'s existing `rulesEqual(a: RuntimeRule, b: RuntimeRule): boolean` (`RuntimeRule = { readonly type: string }`, `types/runtime-shapes.ts:68`) is ALREADY phase-agnostic (any `Rule<Phase>` trivially satisfies the loose `RuntimeRule` shape), already lives in the right layer (`dsl/`, a sibling of `dsl/enrich.ts` — same-layer import, no violation), and already correctly handles the exact separator ambiguity that broke the generic-`compiler/normalize.ts` approach (its own comment: "`.separator` is either a plain string (evaluate-phase, unlifted) or the nested `{value, trailing?, leading?}` fact (link-phase, PR-S)" — it branches on `typeof` at runtime instead of relying on a type-level distinction). Per DRY, this plan now imports and reuses it directly — no generalization work needed at all. The original Task 1 is eliminated; former Tasks 2/3/4 are renumbered 1/2/3 below. This also simplifies what was Task 2's design: no `canonicalRuleSignature` custom serialization helper is needed — `rulesEqual` is used directly for pairwise clustering (see Task 1 below).

## Global Constraints

- DRY is the #1 rule: reuse `diagnoseParseKindCollisions` (`compiler/diagnostics/parsekind-collisions.ts:35`) and `dsl/list-patterns.ts`'s existing `rulesEqual` — do not reimplement either's decision logic, and do not re-attempt generalizing `compiler/normalize.ts`'s `rulesEqual` (see Revision note above — it's both type-infeasible and a layering violation).
- Never hand-edit generated artifacts (`packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`, `overrides.suggested.ts`) — fix codegen source and regenerate.
- No casts to clear type errors — fix the real type.
- Every codegen-source-touching task must regenerate all 3 grammars and stage the regenerated manifest/fixtures before committing.
- `validate:native` output changes land in dedicated `chore(validator)` commits, separate from feature/source commits.
- Rust-touching tasks must run `cargo check --workspace --features napi-bindings` cleanly (this plan touches no Rust source directly, but the regen tasks still trigger native builds — run it anyway).
- Every codegen-source-touching or regen-touching task must run the FULL `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` sweep (not a targeted subset). Baseline to reconfirm fresh at Task 1: `rust=125 / typescript=76 / python=107` (`readRenderParseAstMatchPass`). Some baseline movement in the 7 specifically-touched kinds (listed in Task 2) is *expected* (real CST shape change) — verify each via `probe-kind` round-trip, don't wave it through OR treat it as an automatic regression. Any movement outside those 7 kinds is stop-and-investigate.

## Known facts (verified this session — use directly, do not re-derive)

- `AliasRule<Phase extends WrapperPhase = 'link'>` (`types/rule.ts:593-600`): `{ type: typeof ALIAS, content: Rule<Phase>, named: boolean, value: string }`. `content` is the rule being aliased (`X` in `alias($.X, $.Y)`); `value` is the resolved target name string (`Y`). Valid only at `WrapperPhase` = `'evaluate' | 'link'` (`types/rule.ts`, near the `PhaseName`/`WrapperPhase` definitions) — wrapper-deletion strips `ALIAS` nodes by `'normalize'`/`'simplify'`.
- `PhaseName = 'evaluate' | 'link' | 'normalize' | 'simplify'` (`types/rule.ts`).
- `dsl/primitives/alias.ts`'s `alias(rule, value?)` (the DSL primitive authors/enrich call) delegates to a native `alias()` injected at runtime, producing the `AliasRule` shape above — confirms the field mapping (first positional arg → `content`, second → resolved `value` string).
- `dsl/enrich.ts`'s `enrich(base)` (L109-227) iterates every top-level rule name in `base.grammar.rules` (a `Record<string, Rule>`, aliased as `rulesBag`), calling `applyEnrichPasses(name, rule, kwRules, supertypeNames, rulesBag, clauseGroupRules, clauseDedupeMap, groupDedupeMap, visibleGroupHiddenNames, wordMatcher)` per rule, then merges all results back into `base.grammar.rules` before returning. `rulesBag` gives lookup access to every OTHER top-level rule's current body by name.
- `applyEnrichPasses` (`dsl/enrich.ts:250-311`) runs a fixed-point loop of `applySymbolToField`/`applyOptionalKeyword`, then (once converged) runs `applyClauseHoist` once. The new pass is added as a further step, after `applyClauseHoist`, in this same per-rule function.
- `diagnoseParseKindCollisions<T>(input: {ownerKind: string, slotName: string, values: {original: T, parseKind: string|undefined, storageKind: string|undefined, structuralSignature: string}[]})` (`compiler/diagnostics/parsekind-collisions.ts:35-98`) returns `{values: T[], diagnostics: ParseKindCollisionDiagnostic[]}`. Buckets `values` by `parseKind`; for buckets with 2+ distinct `storageKind`s, checks `distinct(structuralSignature)`: length 1 → silently picks a representative (merges); length >1 → emits a `ParseKindCollisionDiagnostic` (`code: 'parsekind-noninjective'`, `severity: 'error'`, `canProceed: true`, `shape: 'propose-distinct-alias'`, plus `ownerKind`/`slotName`/`parseKind`/`storageKinds`/`message`/`proposal`).
- `dsl/list-patterns.ts`'s `rulesEqual(a: RuntimeRule, b: RuntimeRule): boolean` (`RuntimeRule = { readonly type: string }`) recursively compares `string`/`pattern`/`symbol`/`enum`/`seq`/`choice`/`optional`/`repeat`/`repeat1`/`field` shapes (lowercased `.type` comparison) by structure, with a runtime `typeof`-branch specifically handling the evaluate-vs-link separator shape difference. Falls through to `default: return false` for any other type (including `alias` — irrelevant here since the pass resolves through `content` before comparing, never comparing an ALIAS node to another ALIAS node directly). No generic/phase-parameter issues: any `Rule<Phase>` trivially satisfies `RuntimeRule`'s single `{type: string}` requirement.
- The 7 live `parsekind-noninjective` instances (as of 2026-07-14, `packages/{rust,typescript}/.sittir/grammar-diagnostics.json`) to expect resolved after this plan: rust `scoped_type_identifier.path` (`[generic_type_with_turbofish, generic_type]` → `generic_type`); typescript `_arrow_function_parameter.parameter`, `_index_signature_colon.name`, `augmented_assignment_expression.left` (all `[_reserved_identifier, identifier]`/`[identifier, _reserved_identifier]` → `identifier`), `_jsx_string.content` (`[unescaped_double_jsx_string_fragment, unescaped_single_jsx_string_fragment]` → `string_fragment`), `string.contents` (`[unescaped_double_string_fragment, unescaped_single_string_fragment]` → `string_fragment`), `type_predicate.name` (`[identifier, predefined_type]` → `identifier`).

---

## Task 1: Implement the new enrich un-aliasing pass

**Files:**
- Modify: `packages/codegen/src/dsl/enrich.ts` (add the new pass function + wire it into `applyEnrichPasses`)
- Test: `packages/codegen/src/dsl/__tests__/enrich-unalias.test.ts` (new file, following the naming convention of the existing `enrich-clause-hoist.test.ts` in the same directory)

**Interfaces:**
- Consumes: `rulesEqual` from `dsl/list-patterns.ts` (already exists, phase-agnostic — see Revision note above), `diagnoseParseKindCollisions` (`compiler/diagnostics/parsekind-collisions.ts`), `ALIAS`/`CHOICE`/`SEQ`/`SYMBOL` type guards already imported in `enrich.ts` (`isChoiceType`/`isSeqType` from `types/runtime-shapes.ts`, matching `applyClauseHoist`'s existing import pattern).
- Produces: a new internal function `applyUnaliasDistinct(ruleName: string, rule: Rule, rulesBag: Record<string, Rule>): { rule: Rule; diagnostics: ParseKindCollisionDiagnostic[] }`, called from `applyEnrichPasses` after the existing `applyClauseHoist` call; a module-level diagnostic accumulator with exported `resetUnaliasDiagnostics(): void` / `drainUnaliasDiagnostics(): ParseKindCollisionDiagnostic[]` (test-facing, matching this file's existing export convention) and internal `recordUnaliasDiagnostic(d: ParseKindCollisionDiagnostic): void`; a test-facing exported `clusterSignatures(values: readonly RuntimeRule[]): string[]` helper.

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

describe('clusterSignatures', () => {
	// rulesEqual itself is pre-existing and already used/tested elsewhere
	// (dsl/list-patterns.ts) — this only tests the new clustering wrapper
	// applyUnaliasDistinct actually relies on: 3+ values, some equal to
	// each other and some not, must land in the correct number of distinct
	// clusters using rulesEqual's own equality, not any other proxy.
	it('groups structurally-equal values into the same cluster id, distinct ones apart', () => {
		const a = { type: 'STRING', value: 'x' } as unknown as RuntimeRule;
		const b = { type: 'STRING', value: 'x' } as unknown as RuntimeRule;
		const c = { type: 'STRING', value: 'y' } as unknown as RuntimeRule;
		const signatures = clusterSignatures([a, b, c]);
		expect(signatures[0]).toBe(signatures[1]); // a, b structurally equal
		expect(signatures[0]).not.toBe(signatures[2]); // c distinct
	});
});
```

This requires importing `clusterSignatures` and `RuntimeRule` — `clusterSignatures` needs a test-only export from `enrich.ts` (mark `/** @internal — exported for testing only */`, matching this file's existing convention).

Adjust the exact literal `Rule` shapes above (field names like `name` on `SYMBOL`, `value` on `STRING`/`ALIAS`) against the REAL current `types/rule.ts` definitions if anything doesn't match — the shapes above are drawn from this session's direct reading of `AliasRule` and the `alias()` DSL primitive, but confirm against the file before trusting the test compiles.

- [ ] **Step 3: Run the test to confirm it fails**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/enrich-unalias.test.ts`
Expected: FAIL — `drainUnaliasDiagnostics`/`resetUnaliasDiagnostics` are not exported from `enrich.ts` yet (module resolution / import error). If the file's TypeScript still compiles somehow (e.g. via a loose `any`-typed import), the first test's assertions on `scoped.members` should fail instead, since nothing currently strips the alias.

- [ ] **Step 4: Implement `applyUnaliasDistinct`**

In `packages/codegen/src/dsl/enrich.ts`, add:

```typescript
/**
 * Assign a stable cluster-id string to each value in `values`, where two
 * values get the SAME id iff `rulesEqual` (dsl/list-patterns.ts) says they're
 * structurally equal. Used as `diagnoseParseKindCollisions`'s
 * `structuralSignature` input — that function only needs values sharing a
 * signature to be groupable via `distinct()`, not a globally-canonical hash,
 * so an arbitrary-but-consistent per-call cluster index is sufficient and
 * avoids hand-rolling a serializer (DRY: reuses the existing, already
 * separator-shape-aware `rulesEqual` instead).
 */
function clusterSignatures(values: readonly RuntimeRule[]): string[] {
	const clusterOf: string[] = [];
	const representatives: RuntimeRule[] = [];
	for (const value of values) {
		const existingIdx = representatives.findIndex((rep) => rulesEqual(rep, value));
		if (existingIdx === -1) {
			representatives.push(value);
			clusterOf.push(String(representatives.length - 1));
		} else {
			clusterOf.push(String(existingIdx));
		}
	}
	return clusterOf;
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
		const resolvedBodies = group.map((site) =>
			site.aliasRule.content.type === SYMBOL
				? (rulesBag[(site.aliasRule.content as { name: string }).name] ?? site.aliasRule.content)
				: site.aliasRule.content
		);
		const signatures = clusterSignatures(resolvedBodies);
		const values = group.map((site, i) => ({
			original: site,
			parseKind: targetName,
			storageKind: site.aliasRule.content.type === SYMBOL ? (site.aliasRule.content as { name: string }).name : undefined,
			structuralSignature: signatures[i]!
		}));
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

Import `diagnoseParseKindCollisions` and `ParseKindCollisionDiagnostic` from `../compiler/diagnostics/parsekind-collisions.ts`; `rulesEqual` and the `RuntimeRule` type from `./list-patterns.ts` / `../types/runtime-shapes.ts` (same `dsl/` layer — no layering violation, see Revision note); and `SYMBOL`/`ALIAS` from `../types/rule-types.ts` (add to the existing type-guard imports already present in `enrich.ts` — check the current import block first, since `isSeqType`/`isChoiceType`/`isRepeatType`/`isPrecWrapper`/`isFieldType` are already imported per `applyClauseHoist`'s existing usage).

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

- [ ] **Step 7: Run the full dsl test suite, confirming zero new failures**

Run: `git stash` (stashing this task's uncommitted work), then `pnpm exec vitest run packages/codegen/src/dsl` to record the pre-existing failure count, then `git stash pop` to restore the work.
Run: `pnpm exec vitest run packages/codegen/src/dsl` again with the work restored.
Expected: same failure count both times (zero new failures introduced by this task) — per this project's established A/B discipline, don't assume a pre-existing baseline of zero.

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

## Task 2: Full 3-grammar regen + verification

**Files:**
- Regenerate: `packages/{rust,typescript,python}/src/*`, `.sittir/*`, `tests/nodes.test.ts` (via the `gen` CLI command, never hand-edited)

**Interfaces:**
- Consumes: Task 1's `applyUnaliasDistinct`, wired live.
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
Expected: rust's blocking-severity `parsekind-noninjective` list is empty (the one instance is gone or downgraded); typescript's is empty too (all 6 gone/downgraded). If Task 1 Step 6's diagnostic-emission wiring routes the downgraded diagnostics into a DIFFERENT file/field than `grammar-diagnostics.json`'s existing `parsekind-noninjective` bucket, check there instead — confirm the actual output location against what Task 1 Step 6 implemented, don't assume it matches this exact command.

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

## Task 3: Full validate:native + cargo check gate

**Files:** none (verification-only task)

- [ ] **Step 1: Run cargo check**

Run: `cd rust && cargo check --workspace --features napi-bindings`
Expected: clean, no errors

- [ ] **Step 2: Run the full validate:native sweep**

Run: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native`
Expected: `readRenderParseAstMatchPass` for rust/typescript/python — compare against the Task 1 baseline (reconfirmed fresh at that task's start). Movement in the 7 touched kinds specifically is expected and already verified via Task 2 Step 3's `probe-kind` checks; movement ANYWHERE ELSE is stop-and-investigate, not something to explain away.

- [ ] **Step 3: If validator output changed, commit it separately**

```bash
git add packages/tools/validation-history.jsonl packages/tools/validation-report.json
git commit -m "chore(validator): record validation run (rust/native, typescript/native, python/native)"
```

- [ ] **Step 4: Final summary**

No code changes in this step — just confirm and report: baseline before vs. after, the 7 kinds' individual `probe-kind` results, and that this plan's work is complete and ready for the dependent PR-L plan to build on.
