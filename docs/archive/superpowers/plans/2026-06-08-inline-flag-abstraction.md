# Inline-Flag Abstraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scattered, re-derived "should this ref inline?" decision with ONE explicit per-ref `inline: boolean` flag on `SymbolRule`, semantics **`inline = hidden && !aliased`**, stamped at construction and flipped to `false` by the `alias()` wrapper during wrapper push-down — then read by every consumer instead of re-deriving from `name.startsWith('_')` / `source==='group-lift'`.

**Architecture:** `inline` is a property of REFERENCES. Default `inline = hidden` (`name.startsWith('_')`) stamped where the symbol is constructed (`evaluate.ts`). The ONE wrapper that flips it false is `alias`: an `alias($._x, $.name)` confers a real visible CST kind, so the inner ref must materialize, not flatten. The flip rides the SAME push-down channel that already carries `aliasedFrom` onto the leaf (`wrapper-deletion.ts` ALIAS case). Consumers read `inline` via a shared accessor `isInlineRef(rule) = rule.inline ?? isHiddenKind(rule.name)` — the `??` fallback derives the default for any link-synthesized symbol that bypassed the construction stamp, so propagation is robust without auditing every reconstruction site. The three link reconstruction sites also stamp the flag explicitly (faithful "propagate").

**Tech Stack:** TypeScript ESM (`.ts` imports), tree-sitter codegen. **The gate is the test:** `SITTIR_NATIVE_DEBUG=0 pnpm validate:native` — metric `read-render-parsePass` (deep AST). **Floor: rust 120 / ts 71 / py 74.** Tasks 1–3 must be **byte-identical** (only `.sittir/generated.manifest.json` source-hash churns); Tasks 4–5 are the behavior swaps that must HOLD the floor. Use `model: sonnet` for any implementation subagent.

**Key fact (research-confirmed):** alias targets reach consumers via two `aliasedFrom` conventions — Link path renames the ref to the visible target (`name:'ln', aliasedFrom:'_ln'`); wrapper-deletion path keeps `name='_x'` and stamps `aliasedFrom`=visible. The explicit `inline:false` flip (Task 2) is load-bearing for the wrapper-deletion form (where `name` is still `_x`), and the Link-renamed form is already `inline:false` because `isHiddenKind('ln')` is false. The `??` fallback must therefore NEVER override an explicit `inline:false` — `false ?? x === false`. ✓

---

## File Structure

- `packages/codegen/src/compiler/rule.ts` — add `readonly inline?: boolean` to `RuleBase` (push-down stamps leaves generically; lives next to `aliasedFrom`).
- `packages/codegen/src/compiler/evaluate.ts` — stamp `inline` at `symbol()` (:301) + `createProxy` (:320); add shared `isInlineRef()` accessor next to `isHiddenKind` (:339).
- `packages/codegen/src/compiler/wrapper-deletion.ts` — add `inline` to `WrapperAttrs`; ALIAS case (:205) sets `inline:false`; `stampAttrs` (:238) threads it.
- `packages/codegen/src/compiler/link.ts` — 3 reconstruction sites (:392, :1562, :1654) stamp `inline`.
- `packages/codegen/src/emitters/templates.ts` — `:1439` (`source==='group-lift'`) and `:1464`/`:1504` (`name.startsWith('_')`) read `isInlineRef`.
- `packages/codegen/src/compiler/simplify.ts` — `inlineRefs` (:935) reads `isInlineRef`.
- `packages/codegen/src/compiler/normalize.ts` — `spliceFoldableRefs` (:211) gates on `isInlineRef`.

**DRY note:** `isInlineRef` is the single oracle. No consumer re-spells `name.startsWith('_')` or `source==='group-lift'` for the inline decision after this plan.

---

### Task 1: Add the `inline` field, construction stamp, and shared accessor

**Why first:** establishes the flag + the one read-path helper. Nothing consumes it yet → output must be byte-identical.

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts` (`RuleBase`, ~:88 next to `aliasedFrom`)
- Modify: `packages/codegen/src/compiler/evaluate.ts` (`symbol()` :301, `createProxy` :320, new `isInlineRef` near :339)

- [ ] **Step 1: Add the field to `RuleBase`.** In `rule.ts`, inside `interface RuleBase`, after the `aliasNamed` line, add:

```typescript
	/**
	 * Per-ref inline decision: `inline = hidden && !aliased`. Default
	 * `hidden` (`name.startsWith('_')`) stamped at construction
	 * (`evaluate.ts symbol`/`createProxy`); flipped `false` by the `alias`
	 * wrapper during push-down (`wrapper-deletion.ts` ALIAS case) because an
	 * alias confers a real visible CST kind that must materialize, not
	 * flatten. Read via `isInlineRef()` (with an `isHiddenKind` fallback for
	 * link-synthesized symbols). Replaces the scattered re-derivations of the
	 * inline decision (`name.startsWith('_')`, `source==='group-lift'`).
	 */
	readonly inline?: boolean;
```

- [ ] **Step 2: Stamp at `symbol()`.** In `evaluate.ts:301`, change:

```typescript
	return { type: SYMBOL, name, hidden: name.startsWith('_') };
```
to:
```typescript
	return { type: SYMBOL, name, hidden: name.startsWith('_'), inline: name.startsWith('_') };
```

- [ ] **Step 3: Stamp at `createProxy`.** In `evaluate.ts` `createProxy` getter (the returned object, ~:316-322), add `inline` next to `hidden`:

```typescript
			return {
				type: SYMBOL,
				name,
				hidden: name.startsWith('_'),
				inline: name.startsWith('_'),
				_ref: ref
			};
```

- [ ] **Step 4: Add the `isInlineRef` accessor.** In `evaluate.ts`, immediately after the `isHiddenKind` function (ends ~:345), add:

```typescript
/**
 * Single read-path for the per-ref inline decision. Prefers the explicit
 * `inline` flag (stamped at construction, flipped false by alias push-down).
 * Falls back to `isHiddenKind(name)` for link-synthesized symbols whose
 * reconstruction bypassed the construction stamp — deriving the SAME default
 * (`hidden`) the stamp would have set. A `false ?? …` short-circuits to
 * `false`, so an explicit alias flip is never overridden by the fallback.
 */
export function isInlineRef(rule: { inline?: boolean; name: string }, inlineList?: readonly string[]): boolean {
	return rule.inline ?? isHiddenKind(rule.name, inlineList);
}
```

- [ ] **Step 5: Gate (byte-identical).** Run:
```bash
SITTIR_NATIVE_DEBUG=0 pnpm validate:native 2>&1 | rg "read-render-parsePass=" | rg -v shallow
git status --porcelain packages/{rust,typescript,python}/src packages/{rust,typescript,python}/templates
```
Expected: floor `rust …=120  ts …=71  py …=74`. The `git status` should show ONLY `.sittir/generated.manifest.json` churn (source-hash) under the three `src` trees — NO `.jinja` / `src/*.ts` content diffs. If any template/src content changed, a stamp leaked into emitted output — investigate before commit.

- [ ] **Step 6: Commit** (explicit pathspecs — tree has unrelated dirty files):
```bash
git commit -- packages/codegen/src/compiler/rule.ts packages/codegen/src/compiler/evaluate.ts packages/{rust,typescript,python}/src packages/{rust,typescript,python}/.sittir rust/crates -m "feat(inline): add SymbolRule.inline flag + construction stamp + isInlineRef accessor"
```

---

### Task 2: Flip `inline=false` on alias push-down

**Why:** the one wrapper that makes a hidden ref NON-inline. Rides the existing `aliasedFrom` push-down channel. Still byte-identical — no consumer reads `inline` yet.

**Files:**
- Modify: `packages/codegen/src/compiler/wrapper-deletion.ts` (`WrapperAttrs` type, ALIAS case :213, `stampAttrs` :238-256)

- [ ] **Step 1: Add `inline` to `WrapperAttrs`.** Find the `WrapperAttrs` interface (near the top of `wrapper-deletion.ts`) and add `inline?: boolean;` alongside `aliasedFrom?` / `aliasNamed?`.

- [ ] **Step 2: Set the flip in the ALIAS case.** In `wrapper-deletion.ts:213`, extend the `next` attrs object:

```typescript
				const next: WrapperAttrs = {
					...attrs,
					aliasedFrom: attrs.aliasedFrom ?? rule.value,
					aliasNamed: attrs.aliasNamed ?? rule.named,
					// An alias confers a real visible CST kind on its content, so the
					// inner ref must materialize, not flatten — flip inline off. Outer
					// alias wins (??), mirroring aliasedFrom.
					inline: attrs.inline ?? false,
					nonterminal: attrs.nonterminal ?? (rule.named || undefined),
				};
```

- [ ] **Step 3: Thread `inline` through `stampAttrs`.** In `stampAttrs` (:238), add `inline` to BOTH the early-out guard and the patch:

```typescript
	if (
		attrs.fieldName === undefined &&
		attrs.multiplicity === undefined &&
		attrs.separator === undefined &&
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
	if (attrs.aliasedFrom !== undefined) patch['aliasedFrom'] = attrs.aliasedFrom;
	if (attrs.aliasNamed !== undefined) patch['aliasNamed'] = attrs.aliasNamed;
	if (attrs.inline !== undefined) patch['inline'] = attrs.inline;
	if (attrs.nonterminal !== undefined) patch['nonterminal'] = attrs.nonterminal;
	return { ...rule, ...patch } as RenderRule;
```

- [ ] **Step 4: Gate (byte-identical).** Same command as Task 1 Step 5. Floor 120/71/74; only manifest churn.

- [ ] **Step 5: Commit:**
```bash
git commit -- packages/codegen/src/compiler/wrapper-deletion.ts packages/{rust,typescript,python}/src packages/{rust,typescript,python}/.sittir rust/crates -m "feat(inline): flip inline=false on alias push-down"
```

---

### Task 3: Stamp `inline` at the 3 link reconstruction sites

**Why:** link builds bare `SymbolRule`s that drop construction-stamped fields (this is why `hidden` is unreliable). Stamp `inline` explicitly so consumers see the right value without leaning solely on the accessor fallback. Byte-identical.

**Files:**
- Modify: `packages/codegen/src/compiler/link.ts` (:392 literal→symbol, :1562 enrich group alias, :1654 `resolveNamedAliasWithProvenance`)
- Reference: `isHiddenKind` (`evaluate.ts`) — already imported in link.ts

- [ ] **Step 1: literal→symbol (`link.ts:392`).** This is a `source:'link'` synthesized ref for an anonymous-token kind name. Add `inline: isHiddenKind(entry.kind)`:

```typescript
			return {
				type: SYMBOL,
				name: entry.kind,
				source: 'link',
				literal: rule.value,
				inline: isHiddenKind(entry.kind)
			};
```

- [ ] **Step 2: enrich group alias (`link.ts:1562`).** `rule.value` is the minted VISIBLE kind. Visible → not inline:

```typescript
				return { type: 'symbol', name: rule.value, inline: false } as Rule;
```

- [ ] **Step 3: named-alias provenance (`link.ts:1654`).** Both branches produce the VISIBLE `targetName` (alias target) → never inline:

```typescript
	const sym: SymbolRule = aliasedFrom
		? { type: 'symbol', name: targetName, aliasedFrom, inline: false }
		: { type: 'symbol', name: targetName, inline: false };
```

- [ ] **Step 4: Gate (byte-identical).** Same command. Floor 120/71/74; only manifest churn. (If `isHiddenKind` is not in scope at :392, import it from `./evaluate.ts` — it is already used elsewhere in link.ts, so it should be.)

- [ ] **Step 5: Commit:**
```bash
git commit -- packages/codegen/src/compiler/link.ts packages/{rust,typescript,python}/src packages/{rust,typescript,python}/.sittir rust/crates -m "feat(inline): propagate inline at link reconstruction sites"
```

---

### Task 4 (REVISED): Route the templates inline decision through `inline === true`, with seq-level multiplicity in the inline path

**Revision rationale (settled with the user after the first attempt came back BLOCKED):**
- The naive `:1439` swap from `source==='group-lift'` to a hidden-ness test (`name.startsWith('_')` / an `isInlineRef` accessor) emptied 16+ templates (`block.jinja` → empty, 28 cargo `E0392`). Root cause was NOT "arrays can't inline" — it was the inline path **dropping the array join**: `:1480` returns raw `helperBody` for array multiplicity and never emits `| join(sep)`.
- `_statement` (python `repeat(choice(...))`) and `_simple_statements` (`seq` joined by `;`) are NOT supertypes and NOT group-lift — they are genuine hidden grammar rules that parse-time-flatten (`inline=true`) yet must render as a **single slot** with a join. So the fix is to make the inline path reproduce the slot-level join, NOT to exclude arrays.
- **No `isInlineRef` accessor.** The user rejected the opaque `?? isHiddenKind` fallback. Consumers read `rule.inline === true` directly; the flag is authoritative (stamped at construction + alias-flip + the three link sites). REMOVE the `isInlineRef` function added in `a36b6bbf` (nothing consumes it yet).
- **Multiplicity stops at the SEQ unit — never the leaves.** Pushing onto leaves distributes `optional` onto bare literals → the render walker drops them (the "64 templates lost tokens" failure). The inlined body is a seq with ONE internal slot; apply the ref's multiplicity at that seq by rendering the single slot:
  - `optional`/single → gate the inlined body: `{% if k %}body{% endif %}` (current — keep).
  - `array`/`nonEmptyArray` → render the single slot with a seq-level join: `{{ k | join(sep) }}` (NEW — via `emitListSlot`, reusing the in-scope `slot` so output reproduces the slot path exactly).
  - multi-slot inlined group → inline anyway; `warnMultiSlotMultiplicityGroup` (:1542) surfaces it (diagnostic, not a block).

**Files:**
- Modify: `packages/codegen/src/compiler/evaluate.ts` (remove `isInlineRef`)
- Modify: `packages/codegen/src/emitters/templates.ts` (:1439, :1464 block incl. the `:1480` multiplicity branch, :1504)

- [ ] **Step 1: Remove the `isInlineRef` accessor** from `evaluate.ts` (the function added after `isHiddenKind`). No consumer references it.

- [ ] **Step 2: `:1439` skip-slot gate** → `rule.inline === true`:
```typescript
	const slot = lookupSlot(rule, ctx);
	if (slot && !(slot.isUnnamed && rule.type === SYMBOL && rule.inline === true)) {
		return emitSlotReference(rule, slot);
	}
```

- [ ] **Step 3: `:1464` renderRule-inline gate** → `rule.inline === true`:
```typescript
	if (rule.type === SYMBOL && rule.inline === true) {
```

- [ ] **Step 4: Seq-level multiplicity in the `:1464` block.** Replace the `:1480` multiplicity branch (currently computes `condKey` for optional/array but only wraps optional, then `return helperBody`) with an array branch that emits the seq-level join and an optional branch that gates the body. The array branch reuses the in-scope `slot` (from :1438) so it reproduces `emitSlotReference`'s `emitListSlot` output:
```typescript
				const multiplicity = rule.multiplicity;
				if (multiplicity === 'array' || multiplicity === 'nonEmptyArray') {
					// Seq-level array join: render the single repeated slot with
					// `| join(sep)`. The list's delimiter literals are absorbed into
					// the separator (emitListSlot), so we do NOT emit the raw
					// helperBody (which would inline them). Reuse the in-scope slot so
					// the name/separator reproduce the slot-path output exactly.
					const listName = slot
						? (slot.storageName.replace(/^_+/, '') || 'children').toLowerCase()
						: (pickConditionalKey(helperRenderRule, ctx)
							?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase());
					return emitListSlot(listName, rule, slot);
				}
				if (multiplicity === 'optional' && helperBody) {
					const condKey = pickConditionalKey(helperRenderRule, ctx)
						?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
					return `{% if ${condKey} | isPresent %}${helperBody}{% endif %}`;
				}
				return helperBody;
```
(`emitListSlot` and `pickConditionalKey` are already defined in this file; `slot` is in scope from :1438.)

- [ ] **Step 5: `:1504` raw-rule fallback gate** → `rule.inline === true`, and mirror the same array/optional split in that block's multiplicity handling (it currently only wraps optional). Use the in-scope `slot` likewise.

- [ ] **Step 6: Gate (MUST hold floor).** Run:
```bash
SITTIR_NATIVE_DEBUG=0 pnpm validate:native 2>&1 | rg "read-render-parsePass=" | rg -v shallow
```
Expected: `rust …=120  ts …=71  py …=74`. Canonical checks: `block.jinja` must render `{{ statement | join("\n") }}` (NOT empty); `_simple_statements` must keep its `joinWithTrailing(";")`; rust `let_chain` must still materialize+box (NOT inline). If a grammar drops, probe the kind: `pnpm exec tsx packages/cli/src/cli.ts tool probe-kind --grammar <g> --kind <k>` and diff the template vs HEAD.

- [ ] **Step 7: Commit:**
```bash
git commit -- packages/codegen/src/compiler/evaluate.ts packages/codegen/src/emitters/templates.ts packages/{rust,typescript,python}/src packages/{rust,typescript,python}/templates packages/{rust,typescript,python}/.sittir rust/crates -m "refactor(templates): route inline via inline flag; seq-level array join in inline path"
```

---

### Task 5: Read `inline` at the simplify + normalize fold gates

**Why:** completes the consumer migration. Both currently re-derive via `isHiddenKind(name)` / `name.startsWith('_')`; route through the shared oracle so the alias-flip excludes alias targets uniformly.

**Files:**
- Modify: `packages/codegen/src/compiler/simplify.ts` (:935)
- Modify: `packages/codegen/src/compiler/normalize.ts` (`spliceFoldableRefs` :211)

- [ ] **Step 1: simplify `inlineRefs` (:935).** Import `isInlineRef` (extend the existing `from './evaluate.ts'` import that already pulls `isHiddenKind`). Change:
```typescript
			if (!isHiddenKind(rule.name)) return rule;
```
to:
```typescript
			if (!isInlineRef(rule)) return rule;
```

- [ ] **Step 2: normalize `spliceFoldableRefs` (:211).** This gates the per-ref splice. Add an inline guard so an alias-flipped ref (`inline:false`) is never spliced even if its name is in `foldable`. Change:
```typescript
		case SYMBOL: {
			if (!foldable.has(rule.name)) return rule;
```
to:
```typescript
		case SYMBOL: {
			if (!foldable.has(rule.name)) return rule;
			if (!isInlineRef(rule)) return rule;
```
Import `isInlineRef` from `./evaluate.ts` at the top of `normalize.ts`. (The `foldable` SET keying on the kind DEFINITION name stays `name.startsWith('_')` at :171 — that is the kind's own hiddenness, not a ref decision, and is correct as-is. Only the per-ref splice consults `isInlineRef`.)

- [ ] **Step 3: Gate (MUST hold floor).** Same command as Task 4 Step 5. Floor 120/71/74. If a grammar drops, inspect with `tool probe-kind`.

- [ ] **Step 4: Commit:**
```bash
git commit -- packages/codegen/src/compiler/simplify.ts packages/codegen/src/compiler/normalize.ts packages/{rust,typescript,python}/src packages/{rust,typescript,python}/templates packages/{rust,typescript,python}/.sittir rust/crates -m "refactor(simplify,normalize): route fold gates through isInlineRef"
```

---

## Deferred (out of scope — separate follow-up)

- **`templates.ts:1727`** (`slot.source === 'group-lift'`/`'link'`) — this reads the SLOT's provenance, not a `SymbolRule`. Routing it through `inline` requires the flag to reach the slot model (`deriveSlotsRaw`), a larger change. Leave as-is.
- **`normalize.ts:173`** `_import_list` hardcode + the `keepRef` recursion guard — orthogonal to the inline flag (the memory marks the fold-unification plan obsolete). No change here.

## Self-Review

- **Spec coverage:** construction stamp (T1) ✓, alias flip on push-down (T1 type / T2 logic) ✓, propagation at link sites (T3) ✓, consumer swaps simplify+normalize+templates (T4, T5) ✓. The memory's three named consumers (simplify inlineRefs, templates :1439, normalize inlineHiddenSeqRefs) are all covered.
- **Type consistency:** accessor named `isInlineRef` everywhere; field `inline` everywhere; `WrapperAttrs.inline` matches `RuleBase.inline`.
- **Risk gates:** T1–T3 byte-identical; T4 is the known-risk swap with the explicit `probe-kind` fallback and the `_let_chain` recursion check.
