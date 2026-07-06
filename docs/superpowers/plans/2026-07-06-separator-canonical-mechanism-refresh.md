# Separator-Canonical (PR-S) Mechanism Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse `RuleBase.separator`'s 3-way union to a single canonical `Rule` at both phases it exists in (`RepeatRule<'link'>`/`Repeat1Rule<'link'>`'s pre-wrapper-deletion form, and `RuleBase<NormalizedPhase>`'s post-wrapper-deletion leaf-attribute form), stop discarding non-first choice arms during the link-phase separator lift, and make every downstream compiler pass and consumer honest about the wider type — as pure, byte-neutral plumbing (Stage 1), followed by a small additive warning diagnostic for the not-yet-renderable non-literal case (Stage 2).

**Architecture:** Two-stage, five-task sequence. Tasks 1-4 are Stage 1 (its own gated PR): widen the shared `RuleWalker.map` traversal contract; widen the separator type end-to-end while keeping runtime output byte-identical; flip the lift site to stop narrowing; wire the two hand-rolled compiler passes (`simplify.ts`, `wrapper-deletion.ts`) to actually process a separator that can now be a real sub-tree. Task 5 is Stage 2 (a separate, small follow-on PR): emit + surface a warning diagnostic for the (currently zero, forward-looking) non-literal case.

**Tech Stack:** TypeScript (`packages/codegen/src`), `pnpm`, `vitest`, `lsproxy-cli` for reference verification, this project's `validate:native` round-trip validator (rust/typescript/python native backends).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-06-separator-canonical-mechanism-refresh-design.md` — read it before starting; this plan implements it task-by-task.
- Branch `separator-canonical-mechanism-refresh` already exists (based on `master`, one commit — the spec doc). Work on it; do not create a new branch.
- **Mechanical changes go through `lsproxy-cli`, not hand text-edits.** In particular: before Task 2 touches `RuleBase.separator`'s declared type, run `lsproxy textDocument references` on the `separator` field declarations to confirm the consumer-site inventory below is complete. Use `--dry-run` first on anything unfamiliar.
- **Reconfirm the decisive gate baseline fresh before relying on it**: run `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native 2>&1 | rg "readRenderParseAstMatchPass"` from the repo root and record the three numbers (expected: rust=117, typescript=75, python=102) — every task's gate compares against THIS freshly-measured baseline, not a remembered one.
- **Never hand-edit generated files.** Regenerate via `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <rust|typescript|python> --all --output packages/<lang>/src --no-build-native`, one grammar at a time, after any task touching `packages/codegen/src/**`.
- **Gate every task**: (1) `cd packages/codegen && npx tsgo --noEmit -p .` — 0 new errors; (2) `cd packages/codegen && npx vitest run` — compare Test Files/Tests summary line against the pre-task baseline, must match exactly (this project's byte-neutral discipline); (3) regen all 3 grammars, confirm `grammar.json`/`parser.c`/`node-model.json5` byte-identical; (4) `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native 2>&1 | rg AstMatchPass` — `readRenderParseAstMatchPass` must equal the recorded baseline exactly for all 3 grammars; (5) `pnpm exec tsx packages/cli/src/cli.ts tool propose-14` — ratchet must stay `OK`.
- Post-regen/post-validate noise (`rust/crates/sittir-*/test-fixtures.json`, `rust/crates/sittir-typescript/index.d.ts`, `packages/python/.sittir/grammar.js`'s nondeterministic reorder) gets discarded via `git checkout --` before each commit unless the task's own diff legitimately touches it.
- Commit after every task with an explicit pathspec (never `git add -A`/`git add .`).
- No `--no-verify` on any commit.

---

### Task 1: Widen `RuleWalker.map` to use the same `childrenOf` relation as `fold`/`find`

**Files:**
- Modify: `packages/codegen/src/dsl/rule-walker.ts:40-77`
- Test: `packages/codegen/src/dsl/__tests__/rule-walker.test.ts`

**Interfaces:**
- Consumes: nothing new — this is the standalone widening of an existing class.
- Produces: `RuleWalker.map(rule, visit)` now rebuilds through the SAME edges `childrenOf`/`fold`/`find` already traverse (structural `members`/`content` AND separator-array/`{rules}`-object edges), instead of only `members`/`content`. Later tasks (2 and 4) depend on this: Task 2 widens `childrenOf`'s separator branch to the new single-`Rule` shape; Task 4's `simplify.ts` migration relies on `map` visiting separator sub-rules.

This task is independent of every later task and safe to land first: confirmed 2026-07-06 that `RuleWalker.map` has **zero production call sites** today (only `.find()`/`.fold()` are used, both already separator-aware via `childrenOf`) — so widening `map`'s contract cannot change any existing behavior.

- [ ] **Step 1: Write the failing test proving `map` currently skips separator edges**

Add to `packages/codegen/src/dsl/__tests__/rule-walker.test.ts` (this file already imports `RuleWalker`, `AnyRule`, `sym`, `SYMBOL` — check the top of the file and reuse its existing imports rather than re-declaring):

```ts
describe('map rebuilds through separator edges', () => {
	it('rebuilds a separator-array edge when a child changes', () => {
		const w = new RuleWalker();
		const tree = {
			type: 'REPEAT',
			content: sym('item'),
			separator: [sym('old')]
		} as unknown as AnyRule;
		const out = w.map(tree, (r) => (r.type === SYMBOL && (r as { name: string }).name === 'old' ? sym('new') : r));
		expect((out as unknown as { separator: AnyRule[] }).separator[0]).toEqual(sym('new'));
	});

	it('rebuilds a separator {rules} edge when a child changes', () => {
		const w = new RuleWalker();
		const tree = {
			type: 'REPEAT',
			content: sym('item'),
			separator: { rules: [sym('old')], trailing: true }
		} as unknown as AnyRule;
		const out = w.map(tree, (r) => (r.type === SYMBOL && (r as { name: string }).name === 'old' ? sym('new') : r));
		expect((out as unknown as { separator: { rules: AnyRule[] } }).separator.rules[0]).toEqual(sym('new'));
	});

	it('returns the same reference when nothing changes, including inside separator edges', () => {
		const w = new RuleWalker();
		const tree = {
			type: 'REPEAT',
			content: sym('item'),
			separator: [sym('comma')]
		} as unknown as AnyRule;
		expect(w.map(tree, (r) => r)).toBe(tree);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/codegen && npx vitest run dsl/__tests__/rule-walker.test.ts -t "rebuilds through separator edges"`
Expected: the first two cases FAIL (separator's `old` symbol is not replaced — `map` today doesn't descend into `separator`), the third PASSES (nothing changes, so identity is trivially preserved either way).

- [ ] **Step 3: Widen `map`'s implementation**

Replace `packages/codegen/src/dsl/rule-walker.ts`'s `map` method (lines 61-77) with a version built on `childrenOf`:

```ts
	/**
	 * Bottom-up rebuild. Applies `visit` to each child's mapped result, then
	 * rebuilds this node ONLY if a child changed. Returns the SAME reference
	 * when nothing changed — load-bearing for fixpoint loops that compare
	 * `r === before` (enrich). Rebuilds via the SAME `childrenOf` edge
	 * relation `fold`/`find` use — `members`/`content` AND separator-array/
	 * object-form edges. (Widened 2026-07 as part of PR-S: separator can now
	 * hold a real sub-`Rule` that needs the same transforms as any other
	 * rule position; `fold`/`find` were already separator-aware via
	 * `childrenOf`, `map` was the one exception — no longer.)
	 */
	map(rule: R, visit: (r: R) => R): R {
		const bag = rule as { members?: readonly R[]; content?: R; separator?: StampedSeparator };
		if (Array.isArray(bag.members)) {
			let changed = false;
			const next = bag.members.map((m) => {
				const out = visit(this.map(m, visit));
				if (out !== m) changed = true;
				return out;
			});
			return changed ? ({ ...(rule as object), members: next } as unknown as R) : rule;
		}
		if (bag.content && typeof bag.content === 'object') {
			const out = visit(this.map(bag.content, visit));
			return out === bag.content ? rule : ({ ...(rule as object), content: out } as unknown as R);
		}
		const sep = bag.separator;
		if (Array.isArray(sep)) {
			let changed = false;
			const next = (sep as readonly R[]).map((m) => {
				const out = visit(this.map(m, visit));
				if (out !== m) changed = true;
				return out;
			});
			return changed ? ({ ...(rule as object), separator: next } as unknown as R) : rule;
		}
		if (typeof sep === 'object' && sep !== null && 'rules' in sep) {
			let changed = false;
			const next = (sep.rules as readonly R[]).map((m) => {
				const out = visit(this.map(m, visit));
				if (out !== m) changed = true;
				return out;
			});
			return changed ? ({ ...(rule as object), separator: { ...sep, rules: next } } as unknown as R) : rule;
		}
		return rule;
	}
```

Also update `childrenOf`'s doc comment (lines 29-39) and `map`'s new doc (above) to remove the now-false claim that `map` "deliberately" excludes separator edges — both comments currently say this; the corrected doc text is already folded into the replacement above for `map`. Update `childrenOf`'s comment too: change `"NOTE: map deliberately uses a narrower structural-edge traversal (members/content) than this relation — see its doc; fold/find/foldDeep/findDeep use childrenOf in full."` to `"map, fold, find, foldDeep, and findDeep all use this relation identically — no narrower traversal exists."`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd packages/codegen && npx vitest run dsl/__tests__/rule-walker.test.ts`
Expected: all pass, including the 3 new ones and the pre-existing suite.

- [ ] **Step 5: Full task gate**

Run the Global Constraints gate (type-check, full vitest, regen ×3 byte-identical, `validate:native` exact match, `propose-14` OK). This task touches only `dsl/rule-walker.ts` (no production callers of `.map()` exist), so regen must be byte-identical trivially — if it is NOT, something unexpected calls `.map()`; stop and investigate rather than forcing the gate.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/dsl/rule-walker.ts packages/codegen/src/dsl/__tests__/rule-walker.test.ts
git commit -m "feat(codegen): widen RuleWalker.map to rebuild through separator edges (PR-S task 1)"
```

---

### Task 2: Widen the separator type end-to-end (byte-neutral — behavior unchanged, only the type and every consumer's branch)

**Files:**
- Modify: `packages/codegen/src/types/rule.ts` (`RepeatRule`, `Repeat1Rule`, `RuleBase<NormalizedPhase>`'s separator branch)
- Modify: `packages/codegen/src/dsl/rule-walker.ts` (`childrenOf`'s separator branch — new shape)
- Modify: `packages/codegen/src/compiler/wrapper-deletion.ts` (`WrapperAttrs`, REPEAT/REPEAT1/SEQ cases, `stampAttrs`)
- Modify: `packages/codegen/src/emitters/templates.ts` (`separatorToString`, `selectJoinFilter`)
- Modify: `packages/codegen/src/compiler/model/node-map.ts` (`extractSeparatorString`)
- Modify: `packages/codegen/src/compiler/collect-slots.ts` (`findNestedSeparator`, the sibling-flags branch in `buildSlot`; delete dead `findRepeatSeparator`)
- Modify: `packages/codegen/src/dsl/rule-transforms.ts` (the `{rules, trailing}` producer near `fuseHeadRepeatLists`)
- Modify: `packages/codegen/src/dsl/rule-attrs.ts` (`sharedArmAttrs`)
- Test: `packages/codegen/src/compiler/__tests__/rule-attributes.test.ts:30` (object-form fixture — migrate to single-`Rule` form)
- Test: `packages/codegen/src/emitters/__tests__/templates-emitter-emitRule.test.ts:415` (object-form fixture — migrate)

**Interfaces:**
- Consumes: Task 1's widened `RuleWalker.map`/`childrenOf` relation (this task updates `childrenOf`'s separator branch to match the new shape).
- Produces: `RepeatRule<'link'>.separator: Rule<'link'> | undefined` (was `string`), `RuleBase<NormalizedPhase>.separator: Rule<Phase> | undefined` (was the 3-way union) with `trailing?`/`leading?` promoted to top-level `RuleBase<NormalizedPhase>` siblings (previously only nested inside the object-form separator). `RepeatRule<'evaluate'>.separator` stays `string` — unchanged. Every later task (3, 4, 5) builds on this shape.

**Runtime behavior does NOT change in this task** — `detectRepeatSeparator` (Task 3) still narrows every separator to a plain string today, so the only value that ever flows through the widened type is still a `StringRule`. This task is purely "does the type-checker agree the pipeline can carry a `Rule`", proven by every existing test staying green with an unchanged pass/fail count.

- [ ] **Step 1: Verify the consumer-site inventory via lsproxy before touching the type**

```bash
lsproxy textDocument references packages/codegen/src/types/rule.ts <line>:<col>
```
Point it at `separator` in `RuleBase<NormalizedPhase>`'s branch (`types/rule.ts` — currently around line 199, the `readonly separator?:` line inside the `Phase extends NormalizedPhase` conditional) and at `RepeatRule`'s `separator` field (currently around line 333). Cross-check the returned reference list against the 8 files enumerated above (7 production consumers + this file's own `childrenOf`/`WrapperAttrs` etc.) — if lsproxy surfaces a site not in this list, stop and add a step for it before proceeding; do not silently skip it.

- [ ] **Step 2: Write the failing test for the widened type shape**

Add to `packages/codegen/src/compiler/__tests__/wrapper-deletion.test.ts` (create the describe block if a suitable one doesn't already exist near the file's other REPEAT-separator tests):

```ts
describe('separator as a single Rule (not the legacy object form)', () => {
	it('stamps a StringRule separator directly on the leaf, not wrapped in {rules}', () => {
		const rule = {
			type: REPEAT,
			content: sym('item'),
			separator: { type: 'STRING', value: ',' } as Rule<'link'>,
			trailing: true
		} as unknown as Rule<'link'>;
		const out = deleteWrapperWith(rule, {});
		expect((out as unknown as { separator: unknown }).separator).toEqual({ type: 'STRING', value: ',' });
		expect((out as unknown as { trailing?: boolean }).trailing).toBe(true);
	});
});
```

(Adjust the import list at the top of the test file to include `deleteWrapperWith` if it isn't already exported/imported for testing — check the file's existing imports first; `deleteWrapperWith` may need a test-only export added to `wrapper-deletion.ts` if it's currently unexported. If so, add `export` to its declaration at `wrapper-deletion.ts:38` as part of this step, not as a separate task — exporting an internal for testability is part of this task's deliverable.)

- [ ] **Step 2b: Run the test to verify it fails**

Run: `cd packages/codegen && npx vitest run compiler/__tests__/wrapper-deletion.test.ts -t "separator as a single Rule"`
Expected: FAIL — `wrapper-deletion.ts`'s current REPEAT case wraps a lifted string separator with `trailing`/`leading` into `{ rules: [...], trailing, leading }`, and doesn't yet accept a `Rule`-typed `rule.separator` at all (type error surfaces here first if `types/rule.ts` hasn't widened yet — do Step 3 before re-running this).

- [ ] **Step 3: Widen `types/rule.ts`**

Replace `RepeatRule`/`Repeat1Rule` (lines 328-347) with:

```ts
export type RepeatRule<T extends PhaseName = 'link'> = T extends WrapperPhase
	? RuleBase<T> & {
			readonly type: typeof REPEAT;
			readonly content: Rule<T>;
			/** Link-lifted separator, as a single Rule (widened from `string`,
			 *  PR-S) — `applyWrapperDeletion` turns it into the leaf single-Rule
			 *  form. Evaluate-phase separators stay `string`: the choice-shaped
			 *  ambiguity only becomes representable after link's
			 *  `factorChoiceBranches` restructuring. */
			readonly separator?: T extends 'link' ? Rule<T> : string;
			readonly trailing?: boolean;
			readonly leading?: boolean;
	  }
	: never;

export type Repeat1Rule<T extends PhaseName = 'link'> = T extends WrapperPhase
	? RuleBase<T> & {
			readonly type: typeof REPEAT1;
			readonly content: Rule<T>;
			readonly separator?: T extends 'link' ? Rule<T> : string;
			readonly trailing?: boolean;
			readonly leading?: boolean;
	  }
	: never;
```

Replace `RuleBase<Phase>`'s `NormalizedPhase` conditional branch (the `separator?:` union at lines ~199-205, inside `& (Phase extends NormalizedPhase ? {...} : {})`) — remove the 3-way union, promote `trailing?`/`leading?` to top-level siblings alongside it:

```ts
			readonly fieldName?: string;
			readonly multiplicity?: Multiplicity;
			readonly nonterminal?: boolean;

			/** Single canonical Rule (widened from the former 3-way
			 *  `string | Rule[] | {rules, trailing?, leading?}` union, PR-S).
			 *  A `StringRule` for the common literal case; `ChoiceRule`/`SeqRule`
			 *  for a rule-shaped separator. `trailing?`/`leading?` are separate
			 *  sibling booleans below — no longer nested inside an object form. */
			readonly separator?: Rule<Phase>;
			readonly trailing?: boolean;
			readonly leading?: boolean;
```

Also update the doc comment 3 lines above this branch (currently: `"the structured separator object included: wrapper-deletion converts the repeat node's own link-lifted separator?: string into this leaf object form as it deletes the repeat wrapper"`) — correct it to describe the new single-`Rule` shape, not the retired object form.

- [ ] **Step 4: Update `childrenOf`'s separator branch (`dsl/rule-walker.ts`)**

The array/`{rules}`-object branches Task 1 added to `childrenOf`/`map` matched the OLD union shape. Since `RuleBase<NormalizedPhase>.separator` is now always a single `Rule` (never an array, never `{rules}`), simplify `childrenOf` (lines 40-49) to:

```ts
	childrenOf(rule: R): readonly R[] {
		const out: R[] = [];
		const bag = rule as { members?: readonly R[]; content?: R; separator?: R };
		if (Array.isArray(bag.members)) out.push(...bag.members);
		else if (bag.content && typeof bag.content === 'object') out.push(bag.content);
		if (bag.separator && typeof bag.separator === 'object' && 'type' in bag.separator) out.push(bag.separator);
		return out;
	}
```

And simplify `map` (from Task 1's version) the same way — replace the `Array.isArray(sep)`/`'rules' in sep` branches with a single `Rule`-shaped branch:

```ts
		const sep = bag.separator;
		if (sep && typeof sep === 'object' && 'type' in sep) {
			const out = visit(this.map(sep as R, visit));
			return out === sep ? rule : ({ ...(rule as object), separator: out } as unknown as R);
		}
		return rule;
```

Update `StampedSeparator`'s type alias (line 15: `type StampedSeparator = RuleBase<'normalize'>['separator'];`) — no change needed, it already derives from `RuleBase`, so it picks up the new single-`Rule` type automatically. Update the doc comments on both methods referencing "array/object form" separator edges to say "a single-`Rule` separator edge" instead.

- [ ] **Step 5: Migrate `wrapper-deletion.ts`**

Add `trailing?: boolean; leading?: boolean;` to the `WrapperAttrs` interface (lines 19-27):

```ts
interface WrapperAttrs {
	fieldName?: string;
	multiplicity?: 'optional' | 'array' | 'nonEmptyArray';
	separator?: RuleBase<'normalize'>['separator'];
	trailing?: boolean;
	leading?: boolean;
	aliasedFrom?: string;
	aliasNamed?: boolean;
	inline?: boolean;
	nonterminal?: boolean;
}
```

Replace the REPEAT case's separator-stamping block (currently lines 82-96 — the `if (sep === undefined && rule.separator !== undefined) { if (rule.trailing !== undefined || rule.leading !== undefined) { sep = {rules:[...], trailing, leading} } else { sep = rule.separator } }`) with:

```ts
			let sep = attrs.separator;
			if (sep === undefined && rule.separator !== undefined) sep = rule.separator;
			const trailing = attrs.trailing ?? rule.trailing;
			const leading = attrs.leading ?? rule.leading;
			// repeat forces an array slot (Table 2), incl. terminal content.
			const next: WrapperAttrs = { ...attrs, multiplicity: mult, separator: sep, trailing, leading, nonterminal: true };
			return deleteWrapperWith(rule.content, next);
		}
```

Apply the identical change to the REPEAT1 case (the near-duplicate block a few lines below).

Update the SEQ case's `seqAttrs` construction (currently: `{ fieldName: attrs.fieldName, separator: attrs.separator, aliasedFrom: ..., aliasNamed: ..., nonterminal: ..., multiplicity: ... }`) to also carry the siblings:

```ts
			const seqAttrs: WrapperAttrs = {
				fieldName: attrs.fieldName,
				separator: attrs.separator,
				trailing: attrs.trailing,
				leading: attrs.leading,
				aliasedFrom: attrs.aliasedFrom,
				aliasNamed: attrs.aliasNamed,
				nonterminal: attrs.nonterminal,
				multiplicity: hasBareLiteral ? multToPush : undefined
			};
```

Update `stampAttrs` (currently checks `fieldName`/`multiplicity`/`separator`/`aliasedFrom`/`aliasNamed`/`inline`/`nonterminal` for the early-return "nothing to stamp" guard, and the `patch` object below it) to also check and stamp `trailing`/`leading`:

```ts
function stampAttrs(rule: Rule<'link'>, attrs: WrapperAttrs): RenderRule {
	if (
		attrs.fieldName === undefined &&
		attrs.multiplicity === undefined &&
		attrs.separator === undefined &&
		attrs.trailing === undefined &&
		attrs.leading === undefined &&
		attrs.aliasedFrom === undefined &&
		attrs.aliasNamed === undefined &&
		attrs.inline === undefined &&
		attrs.nonterminal === undefined
	) {
		return rule as RenderRule;
	}
	const patch: Record<string, unknown> = {};
	if (attrs.fieldName !== undefined) patch['fieldName'] = attrs.fieldName;
	if (attrs.multiplicity !== undefined) patch['multiplicity'] = attrs.multiplicity;
	if (attrs.separator !== undefined) patch['separator'] = attrs.separator;
	if (attrs.trailing !== undefined) patch['trailing'] = attrs.trailing;
	if (attrs.leading !== undefined) patch['leading'] = attrs.leading;
	if (attrs.aliasedFrom !== undefined) patch['aliasedFrom'] = attrs.aliasedFrom;
	if (attrs.aliasNamed !== undefined) patch['aliasNamed'] = attrs.aliasNamed;
	if (attrs.inline !== undefined) patch['inline'] = attrs.inline;
	if (attrs.nonterminal !== undefined) patch['nonterminal'] = attrs.nonterminal;
	return { ...rule, ...patch } as RenderRule;
}
```

- [ ] **Step 6: Migrate `emitters/templates.ts`**

Replace `separatorToString` (the union-branching function just above `selectJoinFilter`):

```ts
/**
 * Project a rule's separator onto a primitive `string`. `RuleBase.separator`
 * is a single `Rule` (StringRule for the literal case; a rule-shaped
 * separator — choice/seq — stringifies each leaf and concatenates, same as
 * before the PR-S collapse, just reading a Rule directly instead of an
 * object-form wrapper).
 */
function separatorToString(rule: RenderRule): string | undefined {
	const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
	if (sep === undefined) return undefined;
	if (isStringType(sep.type)) return (sep as { value: string }).value;
	return stringifyRule(sep);
}
```

(Check `isStringType` is already imported in this file from `types/runtime-shapes.ts` or `types/rule.ts` — it's used elsewhere in the glossary's documented helpers; add the import if missing. `stringifyRule` already exists in this file per the old code's `.map(stringifyRule)` calls — confirm its signature accepts a single `Rule` directly, which it must, since it was already being mapped over individual rule members.)

Update `selectJoinFilter`'s trailing comment ("Also honour the structured-separator object form when carrying...") and whatever code follows it that reads the old object form — replace the object-form check with a direct read of the rule's own `trailing`/`leading` fields (which now exist as top-level siblings per Task 2 Step 3, so the EXISTING `repeatLike.trailing`/`repeatLike.leading` reads at the top of this function already work unchanged — the "Also honour..." fallback block below was compensating for the old nested-object case specifically, and can be deleted once `trailing`/`leading` are always top-level). Read the function's current full body (it continues past what's shown in this plan's research) before deleting anything — confirm the fallback block only exists to handle the old object-form and isn't ALSO covering a legitimately-different case (e.g. per-value slot fallback) before removing it; if it does double duty, keep the non-object-form part and delete only the object-form branch.

- [ ] **Step 7: Migrate `compiler/model/node-map.ts`**

Replace `extractSeparatorString`:

```ts
/**
 * Extract a separator string from a `RuleBase<'normalize'>['separator']`
 * value (the stamped leaf form `applyWrapperDeletion` produces — a single
 * Rule, StringRule for the literal case). Returns undefined when the
 * separator is absent, empty, or not a plain literal (a rule-shaped
 * separator has no single string projection — callers needing the literal
 * text specifically get undefined, same as an absent separator).
 */
export function extractSeparatorString(sep: RuleBase<'normalize'>['separator']): string | undefined {
	if (sep === undefined) return undefined;
	if (isStringType(sep.type)) {
		const v = (sep as { value: string }).value;
		return v || undefined;
	}
	return undefined;
}
```

Update the doc comment above the old implementation (currently claims "Handles string, Rule[], and the object form" — no longer true) to match.

- [ ] **Step 8: Migrate `compiler/collect-slots.ts`**

Replace `findNestedSeparator`'s no-op passthrough (it already just returns `sep` unchanged if found — the function's recursive SEARCH logic doesn't need to change, only its return type annotation, which already derives from `RuleBase<'normalize'>['separator']` and updates automatically). Re-run its test suite to confirm no behavioral assumption broke.

Replace the sibling-flags branch inside `buildSlot` (currently: `const sepIsObject = typeof sep === 'object' && !Array.isArray(sep) && sep !== null; const hasTrailing = isMultiSlot && (sepIsObject ? (sep as {trailing?}).trailing === true : findRepeatFlag(rule, 'trailing')); ...`) with a direct read off the rule's own sibling fields (now always top-level, never nested in `sep`):

```ts
	const hasTrailing = isMultiSlot && ((rule as { trailing?: boolean }).trailing === true || findRepeatFlag(rule, 'trailing'));
	const hasLeading = isMultiSlot && ((rule as { leading?: boolean }).leading === true || findRepeatFlag(rule, 'leading'));
```

**Delete `findRepeatSeparator`** (lines 523-544) — confirmed 2026-07-06 via `rg` that it has zero non-recursive callers in production code (only recursive self-calls). Before deleting, run `lsproxy textDocument references packages/codegen/src/compiler/collect-slots.ts <line>:<col>` pointed at its declaration to independently confirm zero external references (the LSP-driven check is the correctness backstop per this project's convention — don't rely on `rg` alone for a deletion). If lsproxy finds a caller `rg` missed, keep the function and instead update it to extract the literal string from a `Rule`-typed `rule.separator` (mirroring `extractSeparatorString`'s pattern above) rather than assuming `string`.

- [ ] **Step 9: Migrate `dsl/rule-transforms.ts`**

Replace the `{rules: [...], trailing: true}` producer (the fallback branch inside the function near `fuseHeadRepeatLists` that builds `separator: { rules: [{ type: STRING, value: sepStr }], trailing: true }`):

```ts
			// Fall back to the choice's separator-string arm, marking trailing.
			const sepStr = (sepArm as { value: string; }).value;
			return {
				...repArm,
				separator: { type: STRING, value: sepStr } as Rule,
				trailing: true
			} as AnyRule;
```

(`trailing` moves from nested-in-`separator` to a top-level sibling on the returned rule, matching the new `RuleBase<NormalizedPhase>` shape from Step 3.)

- [ ] **Step 10: Migrate `dsl/rule-attrs.ts`**

Replace `sharedArmAttrs`'s `JSON.stringify` workaround:

```ts
	// separator is now always a single Rule (StringRule for the common case) —
	// compare structurally via list-patterns.ts's rulesEqual (dsl-side, so this
	// stays inside the dsl→types←compiler layering — no compiler/ import).
	const sep0 = a0.separator;
	const separator =
		sep0 !== undefined && arms.every((m) => {
			const s = stamped(m).separator;
			return s !== undefined && rulesEqual(s as RuntimeRule, sep0 as RuntimeRule);
		})
			? sep0
			: undefined;
```

Add `import { rulesEqual } from './list-patterns.ts';` and `import type { RuntimeRule } from '../types/runtime-shapes.ts';` to this file's import list (check they aren't already imported under different names first).

- [ ] **Step 11: Migrate the two object-form test fixtures**

`packages/codegen/src/compiler/__tests__/rule-attributes.test.ts:30` and `packages/codegen/src/emitters/__tests__/templates-emitter-emitRule.test.ts:415` both encode a separator in the old `{ rules: [...], trailing: true }` object form. Read each fixture's surrounding test, update the encoded separator to `{ type: 'STRING', value: '<the same literal>' }` with `trailing: true` promoted to a sibling key on the rule object (not nested), and confirm the test's assertions still make sense against the new shape (the assertion may itself reference the old nested form and need the same update).

- [ ] **Step 12: Run the full test suite**

Run: `cd packages/codegen && npx vitest run`
Expected: identical Test Files/Tests summary to the pre-task baseline (this task changes shapes, not behavior — every existing assertion about rendered/derived output must still hold).

- [ ] **Step 13: Full task gate**

Run the Global Constraints gate in full (type-check, vitest, regen ×3 byte-identical — this is the load-bearing proof that widening the type changed nothing observable yet — `validate:native` exact match, `propose-14` OK).

- [ ] **Step 14: Commit**

```bash
git add packages/codegen/src/types/rule.ts packages/codegen/src/dsl/rule-walker.ts \
  packages/codegen/src/compiler/wrapper-deletion.ts packages/codegen/src/emitters/templates.ts \
  packages/codegen/src/compiler/model/node-map.ts packages/codegen/src/compiler/collect-slots.ts \
  packages/codegen/src/dsl/rule-transforms.ts packages/codegen/src/dsl/rule-attrs.ts \
  packages/codegen/src/compiler/__tests__/wrapper-deletion.test.ts \
  packages/codegen/src/compiler/__tests__/rule-attributes.test.ts \
  packages/codegen/src/emitters/__tests__/templates-emitter-emitRule.test.ts \
  packages/*/.sittir/generated.manifest.json
git commit -m "refactor(codegen): widen separator to a single canonical Rule, type-only (PR-S task 2)"
```

---

### Task 3: Flip the lift site — stop discarding non-first choice arms

**Files:**
- Modify: `packages/codegen/src/dsl/list-patterns.ts` (`detectRepeatSeparator`)
- Modify: `packages/codegen/src/dsl/enrich.ts` (`listSeparatorOfOptionalSeq`)
- Test: `packages/codegen/src/dsl/__tests__/list-patterns.test.ts` (create if it doesn't exist — check first)

**Interfaces:**
- Consumes: Task 2's widened `Rule<'link'>.separator` type (this is the first task where a value OTHER than a `StringRule` can actually flow into it).
- Produces: `detectRepeatSeparator`'s return shape changes from `{content: R, separator: string, trailing?}` to `{content: R, separator: R, trailing?}` — Task 4's synthetic tests (wrapper-deletion/simplify separator-recursion) depend on this actually producing a non-`StringRule` `separator` for a synthetic choice-shaped grammar rule.

This is the one task in Stage 1 where real behavior (what data CAN flow) changes — everything downstream already knows how to handle it from Task 2, so this is a small, contained, high-value flip.

- [ ] **Step 1: Write the failing test**

Create/add to `packages/codegen/src/dsl/__tests__/list-patterns.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { detectRepeatSeparator } from '../list-patterns.ts';

describe('detectRepeatSeparator preserves a choice-shaped separator', () => {
	it('returns the full CHOICE rule, not just its first string arm', () => {
		const seq = {
			type: 'SEQ',
			members: [
				{ type: 'CHOICE', members: [{ type: 'STRING', value: ',' }, { type: 'STRING', value: ';' }] },
				{ type: 'SYMBOL', name: 'item' }
			]
		};
		const result = detectRepeatSeparator(seq);
		expect(result).not.toBeNull();
		expect(result!.separator).toEqual({
			type: 'CHOICE',
			members: [{ type: 'STRING', value: ',' }, { type: 'STRING', value: ';' }]
		});
	});

	it('still returns a bare STRING separator for the plain-literal case (unchanged)', () => {
		const seq = { type: 'SEQ', members: [{ type: 'STRING', value: ',' }, { type: 'SYMBOL', name: 'item' }] };
		const result = detectRepeatSeparator(seq);
		expect(result!.separator).toEqual({ type: 'STRING', value: ',' });
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/codegen && npx vitest run dsl/__tests__/list-patterns.test.ts`
Expected: the first test FAILS (`result!.separator` is currently `','` — the string extracted by `firstStringOfChoice` — not the full CHOICE object). The second PASSES already (plain-literal path is unaffected).

- [ ] **Step 3: Rewrite `detectRepeatSeparator`**

Replace the function (`dsl/list-patterns.ts:96-118`):

```ts
/**
 * Detect the `seq(SEP, X)` / `seq(X, SEP)` separated-list shape inside a
 * repeat/repeat1 content body, where `SEP` is a string literal or a
 * choice-of-literals. Returns the non-separator content, the FULL detected
 * separator rule (a `StringRule` for the literal case, the whole `ChoiceRule`
 * for a choice-shaped one — no longer narrowed to its first arm, PR-S), and
 * whether the separator was trailing (`seq(X, SEP)`); or `null` when no
 * separator shape is present.
 *
 * Pure: reports the shape; the caller decides whether to lift it onto a
 * `repeat` (link) or read it for group creation (enrich).
 */
export function detectRepeatSeparator<R extends RuntimeRule>(
	resolved: R
): { content: R; separator: R; trailing?: boolean } | null {
	if (!typeEq(resolved.type, 'SEQ')) return null;
	const members = (resolved as { members?: R[] }).members;
	if (!members || members.length !== 2) return null;
	const [first, second] = members as [R, R];

	const firstIsStr = typeEq(first.type, 'STRING');
	const secondIsStr = typeEq(second.type, 'STRING');

	// Canonical: `seq(SEP, X)` (leading) or `seq(X, SEP)` (trailing).
	if (firstIsStr && !secondIsStr) return { content: second, separator: first };
	if (secondIsStr && !firstIsStr) return { content: first, separator: second, trailing: true };

	// Choice-of-separators in the separator position — preserve the FULL
	// choice; the caller (and everything downstream, per PR-S) now knows how
	// to handle a non-literal separator rule.
	const firstIsChoice = typeEq(first.type, 'CHOICE');
	const secondIsChoice = typeEq(second.type, 'CHOICE');
	if (firstIsChoice && !secondIsStr) return { content: second, separator: first };
	if (secondIsChoice && !firstIsStr) return { content: first, separator: second, trailing: true };

	return null;
}
```

`firstStringOfChoice` (lines 79-84) stays exported and unchanged — it's still a real, useful primitive, just no longer called from inside `detectRepeatSeparator`. Its own doc comment's cross-reference (`"see {@link firstStringOfChoice}"` in `detectRepeatSeparator`'s old doc) is already removed by the replacement above; leave `firstStringOfChoice`'s own doc as-is.

- [ ] **Step 4: Adjust `enrich.ts`'s `listSeparatorOfOptionalSeq` to keep its exact prior behavior**

This function (`dsl/enrich.ts:1217-1236`) needs the full detected rule narrowed back down to a string for ITS purpose (matching a stranded trailing literal against the list's separator — a narrower, still-literal-only concern, unrelated to render support). Replace its `detectRepeatSeparator` consumption:

```ts
			const content = (m as { content?: RuntimeRule }).content;
			if (content) {
				const detected = detectRepeatSeparator(content);
				if (detected) {
					const sep = detected.separator;
					if (typeEq(sep.type, 'STRING')) return (sep as { value?: unknown }).value as string;
					if (typeEq(sep.type, 'CHOICE')) return firstStringOfChoice(sep);
				}
			}
```

Add `firstStringOfChoice` to this file's existing `import { detectRepeatSeparator } from './list-patterns.ts';` (line 78) — change to `import { detectRepeatSeparator, firstStringOfChoice } from './list-patterns.ts';`. Confirm `typeEq` is already imported in this file (it's used extensively elsewhere per the file's DSL-runtime-agnostic conventions); add it if missing.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd packages/codegen && npx vitest run dsl/__tests__/list-patterns.test.ts dsl/__tests__/enrich.test.ts dsl/__tests__/enrich-clause-hoist.test.ts`
Expected: all pass, including the 2 new `list-patterns.test.ts` cases — enrich's existing trailing-separator-absorption tests must be completely unaffected (same behavior, just routed through one extra narrowing step).

- [ ] **Step 6: Full task gate**

Run the Global Constraints gate. `validate:native` must still hold exactly — 0 real grammars have a choice-shaped separator today, so this flip changes nothing observable in the 3 shipped grammars; the proof that the flip itself works is the synthetic unit tests above, not a live corpus case.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/dsl/list-patterns.ts packages/codegen/src/dsl/enrich.ts \
  packages/codegen/src/dsl/__tests__/list-patterns.test.ts \
  packages/*/.sittir/generated.manifest.json
git commit -m "fix(codegen): stop discarding non-first choice arms in the separator lift (PR-S task 3)"
```

---

### Task 4: Wire up separator-recursion in the two hand-rolled compiler passes + fix now-unsafe identity comparators

**Files:**
- Modify: `packages/codegen/src/compiler/wrapper-deletion.ts` (explicit `deleteWrapperWith(rule.separator, {})` call)
- Modify: `packages/codegen/src/compiler/simplify.ts` (`simplifyRule`'s family migrates its recursion onto `ctx.walker.map`)
- Modify: `packages/codegen/src/compiler/normalize.ts` (`rulesEqual`'s REPEAT case — structural, not identity, comparison)
- Modify: `packages/codegen/src/dsl/list-patterns.ts` (its own `rulesEqual`'s repeat/repeat1 case — same fix)
- Test: `packages/codegen/src/compiler/__tests__/wrapper-deletion.test.ts`, `packages/codegen/src/compiler/__tests__/simplify.test.ts` (or whatever the existing simplify test file is named — check first), `packages/codegen/src/compiler/__tests__/normalize.test.ts`

**Interfaces:**
- Consumes: Task 3's now-real non-literal separators; Task 1's widened `RuleWalker.map`.
- Produces: a separator sub-rule containing wrapper nodes (however unlikely in the 3 shipped grammars) now gets the SAME wrapper-deletion push-down and simplify canonicalization as any other rule position. This closes out Stage 1 — the next task is the separately-gated Stage 2 diagnostic.

- [ ] **Step 1: Write the failing test for wrapper-deletion's separator recursion**

Add to `packages/codegen/src/compiler/__tests__/wrapper-deletion.test.ts`:

```ts
describe('separator sub-rules get the same push-down as ordinary content', () => {
	it('pushes a FIELD wrapper inside a choice-shaped separator down to a leaf attribute', () => {
		const rule = {
			type: REPEAT,
			content: sym('item'),
			separator: {
				type: 'CHOICE',
				members: [
					{ type: 'FIELD', name: 'sep_kind', content: { type: 'STRING', value: ',' } },
					{ type: 'STRING', value: ';' }
				]
			}
		} as unknown as Rule<'link'>;
		const out = deleteWrapperWith(rule, {}) as unknown as { separator: { members: { fieldName?: string; type: string }[] } };
		expect(out.separator.members[0]!.fieldName).toBe('sep_kind');
		expect(out.separator.members[0]!.type).toBe('STRING');
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/codegen && npx vitest run compiler/__tests__/wrapper-deletion.test.ts -t "separator sub-rules get the same push-down"`
Expected: FAIL — the FIELD wrapper inside the synthetic separator survives untouched today (wrapper-deletion's REPEAT case treats `rule.separator` as an opaque already-resolved value and never recurses into it).

- [ ] **Step 3: Add the explicit recursive call in `wrapper-deletion.ts`**

In the REPEAT case (the block Task 2 Step 5 already touched), change:

```ts
			let sep = attrs.separator;
			if (sep === undefined && rule.separator !== undefined) sep = rule.separator;
```

to:

```ts
			let sep = attrs.separator;
			if (sep === undefined && rule.separator !== undefined) {
				// The separator is a sibling structure, not nested under this
				// wrapper's own accumulator stack — process it with a FRESH,
				// empty WrapperAttrs, reusing this same top-down push-down
				// function (deleteWrapperWith doesn't fit RuleWalker.map's
				// bottom-up, no-accumulator contract, so it recurses on itself
				// explicitly here rather than delegating to ctx.walker.map).
				sep = deleteWrapperWith(rule.separator, {});
			}
```

Apply the identical change to REPEAT1's separator-stamping block.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/codegen && npx vitest run compiler/__tests__/wrapper-deletion.test.ts`
Expected: all pass, including the new one, with zero change to any pre-existing case (the recursive call is a no-op whenever `rule.separator` is a bare leaf, which is every real grammar today).

- [ ] **Step 5: Write the failing test for simplify's separator canonicalization**

Add to the simplify test suite (check the exact filename first — likely `packages/codegen/src/compiler/__tests__/simplify.test.ts`):

```ts
describe('separator sub-rules go through the same simplification as ordinary content', () => {
	it('collapses a single-member choice inside a separator down to that member', () => {
		const rule = {
			type: SEQ,
			members: [
				{
					type: REPEAT,
					content: { type: 'SYMBOL', name: 'item' },
					separator: { type: 'CHOICE', members: [{ type: 'STRING', value: ',' }] }
				}
			]
		} as unknown as RenderRule;
		const out = simplifyRule(rule) as unknown as { members: { separator: { type: string; value?: string } }[] };
		expect(out.members[0]!.separator).toEqual({ type: 'STRING', value: ',' });
	});
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `cd packages/codegen && npx vitest run compiler/__tests__/simplify.test.ts -t "separator sub-rules go through the same simplification"`
Expected: FAIL — today `simplifyRule`'s REPEAT dispatch (falls to its `default` case, which throws for wrapper types still present, OR if REPEAT is somehow reached as a leaf-passthrough, doesn't touch `.separator` at all) never touches the separator's own single-member choice.

(Note: confirm during this step whether `simplifyRule`'s switch has an explicit REPEAT case or relies on REPEAT already being wrapper-deleted away by this phase — per the glossary, Simplify's wrapper-node-free invariant means REPEAT nodes shouldn't reach `simplifyRule` at all; `.separator` as a leaf ATTRIBUTE on a SEQ/CHOICE/leaf node is what actually needs recursion, not a REPEAT node itself. Adjust the synthetic test's shape if needed so it exercises a rule TYPE that legitimately reaches `simplifyRule` post-wrapper-deletion — e.g. stamp `separator` directly on the outer SEQ or on a leaf SYMBOL, matching how `RuleBase<NormalizedPhase>.separator` actually appears in practice, rather than on a bare REPEAT node.)

- [ ] **Step 7: Migrate `simplifyRule`'s recursion onto `ctx.walker.map`**

This is the one place in this task requiring a look at `simplify.ts`'s actual current recursive structure across `simplifySeqRule`/`simplifyChoiceRule`/`simplifyGroupRule`/`simplifyVariantRule` before writing the exact replacement — each currently recurses into its own children via direct calls to `simplifyRule`. Replace `simplifyRule`'s top-level dispatch (lines 666-704) to route its recursion through `ctx.walker.map` first, THEN apply the per-type dispatch to the (now children-and-separator-already-simplified) result:

```ts
export function simplifyRule(rule: RenderRule, ctx: SimplifyCtx = makeDefaultCtx()): RenderRule {
	const recursed = ctx.walker.map(rule, (r) => simplifyRule(r as RenderRule, ctx)) as RenderRule;
	switch (recursed.type) {
		case SEQ:
			return simplifySeqRule(recursed, ctx) as RenderRule;
		case CHOICE:
			return simplifyChoiceRule(recursed, ctx) as RenderRule;
		case GROUP:
			return simplifyGroupRule(recursed, ctx) as RenderRule;
		case VARIANT:
			return simplifyVariantRule(recursed, ctx) as RenderRule;
		case SYMBOL:
		case STRING:
		case PATTERN:
		case SUPERTYPE:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return recursed;
		default:
			throw new Error(
				`simplifyRule: unexpected rule type '${(recursed as RenderRule).type}' — ` +
					`field/optional/repeat/repeat1 nodes must be converted to attributes ` +
					`by applyWrapperDeletion before reaching simplify`
			);
	}
}
```

Since `ctx.walker.map` already recurses into `members`/`content`/`separator` bottom-up and calls `simplifyRule` on each child (via the `visit` callback), `simplifySeqRule`/`simplifyChoiceRule`/`simplifyGroupRule`/`simplifyVariantRule` must STOP recursing into their own children themselves (they'd otherwise double-simplify). Read each of these 4 functions' current bodies in full before editing (this plan's research read `simplifyChoiceRule`/`simplifyGroupRule`/`simplifyVariantRule` partially — re-read them fresh at implementation time since Task 2/3 may have shifted line numbers) and remove their internal `rule.members.map((m) => simplifyRule(m, ctx))` / `simplifyRule(rule.content, ctx)` recursive calls, operating on the ALREADY-recursed `rule` (now named `recursed` at the call site above) instead — e.g. `simplifyChoiceRule`'s `const members = rule.members.map((m) => simplifyRule(m, ctx));` becomes `const members = rule.members;` (already simplified by `ctx.walker.map` before this function is called). This is the actual "migrate onto `ctx.walker.map`" step the spec calls for — do it carefully, function by function, running the full simplify test suite after each one to catch a missed double-recursion or an accidentally-skipped recursion immediately, rather than changing all 4 and debugging failures across all of them at once.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `cd packages/codegen && npx vitest run compiler/__tests__/simplify.test.ts`
Expected: all pass, including the new separator-recursion case, with the exact same pass count as the pre-task baseline for every other case (this migration must be a pure recursion-mechanism swap, not a behavior change).

- [ ] **Step 9: Fix the two `rulesEqual`'s REPEAT comparator**

In `compiler/normalize.ts`'s `rulesEqual` (line ~1036-1037), replace:

```ts
		case REPEAT:
			return rulesEqual(a.content, (b as typeof a).content) && a.separator === (b as typeof a).separator;
```

with:

```ts
		case REPEAT:
			return (
				rulesEqual(a.content, (b as typeof a).content) &&
				separatorsEqual(a.separator, (b as typeof a).separator)
			);
```

Add a small local helper just above `rulesEqual` (or as its last statement, per this file's existing style — check whether other small comparison helpers in this file are declared before or after their main function and match that convention):

```ts
function separatorsEqual(a: Rule<'link'> | undefined, b: Rule<'link'> | undefined): boolean {
	if (a === undefined || b === undefined) return a === b;
	return rulesEqual(a, b);
}
```

In `dsl/list-patterns.ts`'s OWN `rulesEqual` (line 61-63), apply the equivalent fix — this one operates on `RuntimeRule`, recursively:

```ts
		case 'repeat':
		case 'repeat1':
			return separatorsEqualRt(A.separator as RuntimeRule | undefined, B.separator as RuntimeRule | undefined) && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
```

with a matching local helper in this file:

```ts
function separatorsEqualRt(a: RuntimeRule | undefined, b: RuntimeRule | undefined): boolean {
	if (a === undefined || b === undefined) return a === b;
	return rulesEqual(a, b);
}
```

Confirm during implementation whether `evaluate.ts:2163`/`2167` (`patternRulesEqual`) and any other identity-comparison site touches post-lift data: grep `separator ===` across `packages/codegen/src` after this step and confirm every remaining hit operates on `RepeatRule<'evaluate'>` (still `string`-typed, safe) — if any hit operates on `Rule<'link'>` or later, apply the same `separatorsEqual`-style fix there too, in this same task, not deferred.

- [ ] **Step 10: Run the normalize test suite**

Run: `cd packages/codegen && npx vitest run compiler/__tests__/normalize.test.ts dsl/__tests__/list-patterns.test.ts`
Expected: all pass, unchanged pass count (both fixes are behavior-preserving for the literal-string case, which is 100% of real grammars today — they only change behavior for the synthetic non-literal case the new tests exercise).

- [ ] **Step 11: Full task gate — this closes out Stage 1**

Run the Global Constraints gate in full. This is the last task before Stage 1's PR opens — `validate:native` must hold exactly, regen byte-identical across all 3 grammars, full suite green, `propose-14` OK. This is the strongest proof point in the whole plan: everything built in Tasks 1-4 together, and the 3 real grammars still produce byte-identical output.

- [ ] **Step 12: Commit**

```bash
git add packages/codegen/src/compiler/wrapper-deletion.ts packages/codegen/src/compiler/simplify.ts \
  packages/codegen/src/compiler/normalize.ts packages/codegen/src/dsl/list-patterns.ts \
  packages/codegen/src/compiler/__tests__/wrapper-deletion.test.ts \
  packages/codegen/src/compiler/__tests__/simplify.test.ts \
  packages/codegen/src/compiler/__tests__/normalize.test.ts \
  packages/*/.sittir/generated.manifest.json
git commit -m "feat(codegen): recurse into separator sub-rules in wrapper-deletion + simplify; fix now-unsafe separator identity comparisons (PR-S task 4)"
```

- [ ] **Step 13: Open the Stage 1 PR**

```bash
GITHUB_TOKEN= gh pr create --base master --title "refactor(codegen): separator-canonical (PR-S) — widen separator to a single Rule, byte-neutral" --body "$(cat <<'EOF'
## Summary
Implements Stage 1 of docs/superpowers/specs/2026-07-06-separator-canonical-mechanism-refresh-design.md — collapses RuleBase.separator's 3-way union to a single canonical Rule at both the pre-wrapper-deletion (RepeatRule<'link'>) and post-wrapper-deletion (RuleBase<NormalizedPhase>) phases, stops discarding non-first choice arms at the link-phase lift, widens RuleWalker.map to reach separator sub-rules, and wires wrapper-deletion.ts + simplify.ts to actually process them. Byte-neutral: 0 real grammars exercise a non-literal separator today; every consumer already knew how to handle one before the lift-site flip (Task 3) ever produces one.

## Verification
- validate:native holds exactly (rust/ts/py) at every task boundary.
- Regen byte-identical across all 3 grammars at every task boundary.
- Full test suite green, matching pre-task baselines exactly.
- propose-14 ratchet OK throughout.

Stage 2 (a small, separate follow-on PR) adds the warning diagnostic for the non-literal case.
EOF
)"
```

---

### Task 5 (Stage 2): Warning diagnostic for non-literal separators

**Files:**
- Modify: `packages/codegen/src/compiler/link.ts` (`liftSeparators`'s REPEAT/REPEAT1 case — emit the diagnostic)
- Modify: `packages/codegen/src/compiler/generate.ts` (print the sink's non-`fail` diagnostics after `assertEmittable`)
- Modify: `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts` OR a new small formatter module (check whether `formatGrammarDiagnostics` can be generalized to the shared `Diagnostic` base, or needs a sibling function — both `GrammarDiagnostic` and `CompilerDiagnostic` share `code`/`severity`/`message`/`details`)
- Test: a new synthetic test exercising the diagnostic, plus an assertion that all 3 real grammars print zero diagnostics

**Interfaces:**
- Consumes: Task 3's `detectRepeatSeparator`, which can now return a non-`StringRule` separator; `ctx.diagnostics` (`DiagnosticSink`), already threaded through `LinkCtx`/every phase ctx per R12.
- Produces: nothing further downstream depends on this — it's the terminal, additive deliverable of the whole initiative (until PR-T, which is a separate, already-existing design).

**Note:** open this as its own PR, branched from Stage 1's merged tip (or stacked on the Stage 1 PR branch if it hasn't merged yet — check with the user before opening a stacked PR, per this project's established stacked-PR handling).

- [ ] **Step 1: Write the failing test for the diagnostic emission**

Add to `packages/codegen/src/compiler/__tests__/link.test.ts`:

```ts
describe('liftSeparators emits a warning for a non-literal separator', () => {
	it('records a compiler warning diagnostic when the detected separator is not a StringRule', () => {
		const diagnostics = new DiagnosticSink();
		const ctx = new LinkCtx({ /* construct with whatever minimal fields this file's other LinkCtx tests already use — check an existing test in this file for the right constructor shape */ diagnostics });
		const rule = {
			type: REPEAT,
			content: {
				type: SEQ,
				members: [
					{ type: 'CHOICE', members: [{ type: 'STRING', value: ',' }, { type: 'STRING', value: ';' }] },
					{ type: 'SYMBOL', name: 'item' }
				]
			}
		} as unknown as Rule<'link'>;
		liftSeparators(rule, ctx);
		const warnings = diagnostics.all().filter((d) => d.severity === 'warning');
		expect(warnings).toHaveLength(1);
		expect(warnings[0]!.code).toBe('non-literal-separator');
	});
});
```

(Check `liftSeparators`'s current signature — this plan's research read it as `liftSeparators(rule: Rule<'link'>): Rule<'link'>` with NO ctx parameter. This step requires threading `ctx` through it, which is itself part of the implementation below, not just the test — write the test against the NEW signature you're about to build.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/codegen && npx vitest run compiler/__tests__/link.test.ts -t "emits a warning for a non-literal separator"`
Expected: FAIL — `liftSeparators` doesn't accept a `ctx` parameter yet and emits nothing.

- [ ] **Step 3: Thread `ctx` through `liftSeparators` and emit the diagnostic**

`liftSeparators` is called from 3 sites in `link.ts` (currently around lines 266, 335, 858 per this plan's research — re-confirm exact lines at implementation time, Tasks 1-4 may shift them). Add a `ctx: LinkCtx` parameter to `liftSeparators` and thread it through its own recursive self-calls, then update all 3 call sites to pass their local `ctx` (each of those 3 call sites already has a `ctx: LinkCtx` in scope, since `link.ts`'s functions are all ctx-threaded per R12 — confirm this at each site before assuming it).

In the REPEAT/REPEAT1 case:

```ts
		case REPEAT:
		case REPEAT1: {
			const content = liftSeparators(rule.content, ctx);
			const sep = detectRepeatSeparator(content);
			if (sep) {
				if (!isStringType(sep.separator.type)) {
					ctx.diagnostics.warn({
						code: 'non-literal-separator',
						message: `Rule '${rule.type === REPEAT ? 'repeat' : 'repeat1'}' has a non-literal separator (${sep.separator.type}); rendering this shape is not yet supported (tracked: PR-T, docs/superpowers/specs/2026-05-26-non-slot-separator-rules-design.md).`,
						canProceed: true,
						scope: 'compiler',
						phase: 'link'
					});
				}
				return { ...rule, content: sep.content, separator: sep.separator, trailing: sep.trailing };
			}
			return { ...rule, content };
		}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/codegen && npx vitest run compiler/__tests__/link.test.ts`
Expected: all pass, including the new one, unchanged pass count for everything else.

- [ ] **Step 5: Write the failing test for print-surfacing**

Add a test confirming `generate.ts`'s pipeline actually prints a non-`fail` diagnostic after a run that produces one, and — separately — a live-grammar test confirming zero diagnostics print for all 3 real grammars today (this is the empirical proof of the "0 witnesses" claim, not just an assertion). Check `packages/codegen/src/compiler/__tests__/generate.test.ts` (or wherever `generate()`'s existing tests live) for the right harness pattern before writing new test scaffolding from scratch.

- [ ] **Step 6: Run to verify it fails**

Expected: FAIL — nothing currently prints non-`fail` sink contents.

- [ ] **Step 7: Extend `generate.ts`'s printing**

Immediately after the `assertEmittable(nodeMap, diagnostics)` call (`compiler/generate.ts`, currently ~line 249), add:

```ts
	const nonFail = diagnostics.all().filter((d) => d.severity !== 'fail');
	if (nonFail.length > 0) {
		process.stderr.write(formatCompilerDiagnostics(nonFail) + '\n');
	}
```

Add `formatCompilerDiagnostics` — either as a new small function alongside `formatGrammarDiagnostics` (in `compiler/diagnostics/grammar-diagnostics.ts`) if that file's formatter can be generalized cleanly to the shared `Diagnostic` base (read its current implementation first — both `GrammarDiagnostic` and `CompilerDiagnostic` share `code`/`severity`/`message`/`details`, so a version keyed only on those fields should work for both), or as a new small standalone function in `generate.ts` itself if generalizing the existing one would touch unrelated grammar-diagnostic-specific formatting. Prefer generalizing/reusing over duplicating — this is exactly the kind of DRY call this project's #1 rule is about; only duplicate if the existing formatter has grammar-specific fields (e.g. `ownerKind`/`slotName`) baked into its output format that a compiler diagnostic genuinely shouldn't display.

- [ ] **Step 8: Run the tests to verify they pass**

Run the full generate/link test suites; expected: all pass, including the new print-surfacing test and the "zero diagnostics on real grammars" empirical check.

- [ ] **Step 9: Full task gate**

Run the Global Constraints gate. `validate:native` holds exactly (this diagnostic is silent for all 3 real grammars, confirmed by Step 5-8's own test). Full suite green.

- [ ] **Step 10: Commit**

```bash
git add packages/codegen/src/compiler/link.ts packages/codegen/src/compiler/generate.ts \
  packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts \
  packages/codegen/src/compiler/__tests__/link.test.ts \
  packages/codegen/src/compiler/__tests__/generate.test.ts
git commit -m "feat(codegen): warn on non-literal separators at the link-phase lift, surfaced via generate.ts (PR-S task 5, Stage 2)"
```

- [ ] **Step 11: Open the Stage 2 PR**

```bash
GITHUB_TOKEN= gh pr create --base master --title "feat(codegen): warn on non-literal separators (PR-S Stage 2)" --body "$(cat <<'EOF'
## Summary
Small, additive follow-on to the separator-canonical Stage 1 PR. Emits a non-blocking warning diagnostic when link's separator lift detects a non-literal (choice/seq) separator, and extends generate.ts to actually print the compile pipeline's DiagnosticSink contents (previously only checked for blocking 'fail' entries, never printed). 0 real grammars trigger this today — verified empirically, not just asserted.

## Verification
- validate:native holds exactly (rust/ts/py).
- New synthetic test exercises the diagnostic; a separate test confirms zero diagnostics print on all 3 real grammars.
- Full test suite green.
EOF
)"
```

---

## Self-Review

**Spec coverage:** Every section of `2026-07-06-separator-canonical-mechanism-refresh-design.md` maps to a task — Type widening (Task 2), lift-site rewrite (Task 3), `RuleWalker.map` widening (Task 1), `simplify.ts`/`wrapper-deletion.ts` separator-recursion (Task 4), comparator fixes (Task 4), consumer migration (Task 2), Stage 2 diagnostic + `generate.ts` surfacing (Task 5). No gaps found.

**Placeholder scan:** No TBD/TODO. Two spots intentionally defer an exact detail to implementation time rather than guessing wrong: Task 4 Step 7 (simplify's 4 helper functions' exact current bodies, since Tasks 1-3 may shift their line numbers before Task 4 starts) and Task 5 Step 7 (whether to generalize `formatGrammarDiagnostics` or add a sibling formatter, gated on reading its actual current implementation). Both are marked as "read the current file before writing the replacement," not "figure out how this works" — the surrounding code and constraints are fully specified either way.

**Type consistency:** `Rule<'link'>` is used consistently for the pre-wrapper-deletion form across Tasks 2-4; `RuleBase<NormalizedPhase>`'s single-`Rule` `separator` (no phase parameter needed beyond `Phase`) is used consistently in Task 2's consumer migrations. `WrapperAttrs.trailing`/`.leading` (Task 2) match `RuleBase<NormalizedPhase>.trailing`/`.leading` (also Task 2) — same names, same meaning, no drift between the accumulator shape and the final stamped shape. `deleteWrapperWith` (exported for testing in Task 2 Step 2) is the same function reused explicitly in Task 4 Step 3 — no renamed sibling.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-06-separator-canonical-mechanism-refresh.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
