# ADR-0012 Implementation Plan — Boolean keywords + bitflag modifier sets

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace node-constructing factory shapes for keyword-presence positions with language-intent shapes:

- `optional(string)` → **boolean keyword** field (`mut?: boolean`).
- `repeat(choice-of-strings)` / `repeat1(…)` → **bitflag** field (`modifiers?: number`, sibling `FunctionMod` const in `consts.ts`).

**Architecture:** Classification is a **derived** property of `AssembledField` computed from `values` + per-value multiplicity (ADR-0011 / ADR-0010 shared patterns). No new Rule variants, no new `AssembledField` fields — a shared helper in `emitters/shared.ts` returns `'boolean' | 'bitflag' | null` from the existing slot data. Emitters consume the classification; NodeData output shape is unchanged so readNode round-trips are byte-identical.

**Tech Stack:** TypeScript, vitest, pnpm workspaces. Modifies `emitters/{shared,types,factories,from,consts}.ts`. No compiler-tier changes.

---

## Guiding principles (recap from ADR-0010 / ADR-0011)

1. **Every fact has one source.** Classification derives from `AssembledField.values` (terminals / NodeRef-to-`_kw_*` entries) + multiplicity. No new Rule variants, no new field properties. Drift-free by construction.

2. **Shared helpers in `emitters/shared.ts`**, consumed uniformly by every emitter — mirrors `resolveEffectiveLiteral` (single-literal detection, ADR-0010 phase 1), `resolveHiddenKeywordLiteral` (`_kw_*` → literal, ADR-0010 phase 1+), `resolveHoistedForm` (polymorph hoist).

3. **NodeData is the grammar's shape. Config is the language's intent.** Factory output unchanged → readNode round-trip byte-identical.

4. **Discriminated-union exhaustiveness** — every switch on `Rule.type` / `AssembledNode.modelType` already ends in `assertNever`. No new variants = no exhaustiveness churn.

---

## Prerequisites (already landed)

- ADR-0010 phase 1 (auto-stamp single-literal fields) — provides `resolveEffectiveLiteral` + `isAutoStampField` + the factory-narrowing mental model.
- ADR-0011 data-model DRY — `AssembledField extends AssembledChild`, `values: readonly NodeOrTerminal[]` with per-value multiplicity.
- EnumRule ChoiceRule-shape reshape (commit `cc73341`) — `EnumRule.members: readonly StringRule[]`. `AssembledEnum.values` getter preserves `string[]` projection; direct readers of enum arms go through `.members`.
- Hidden `_kw_*` inlining (`fa20252` / `f501856` / `1695246`) — `resolveHiddenKeywordLiteral` flattens hidden `_kw_*` SYMBOL refs to their literal.

The bitflag detector reads the post-Link `AssembledField.values`, which already normalizes all the relevant shapes.

---

## File Structure

**No compiler-tier changes.** All work lives in the emitter layer.

- Modified: `packages/codegen/src/emitters/shared.ts` — add `keywordPresenceKind(field, nodeMap)` + `keywordPresenceLiterals(field, nodeMap)` helpers. Mirror the existing `resolveEffectiveLiteral` / `resolveHiddenKeywordLiteral` / `resolveHoistedForm` patterns.
- Modified: `packages/codegen/src/emitters/consts.ts` — emit `FunctionMod`-style const blocks for every bitflag-classified field.
- Modified: `packages/codegen/src/emitters/types.ts` — boolean-keyword fields → `boolean`; bitflag fields → `number` (optionally `typeof Const[keyof typeof Const]`).
- Modified: `packages/codegen/src/emitters/factories.ts` — per-field emission branches on classification; boolean construct/omit; bitflag per-bit spread.
- Modified: `packages/codegen/src/emitters/from.ts` — new `_resolveBooleanKeyword` / `_resolveBitflag` polymorphic resolvers.
- Optional: `packages/codegen/src/emitters/factories.ts` + `from.ts` + `types.ts` — skip emission for modifier-only container kinds (keep only SyntaxKind / KindMap entries for readNode dispatch).

**Tests:**

- Created: `packages/codegen/src/__tests__/keyword-presence.test.ts` — unit coverage for `keywordPresenceKind` classifier across the shape matrix.
- Created: `packages/codegen/src/__tests__/bitflag-emit.test.ts` — snapshot: `ir.functionItem({ modifiers: FunctionMod.Async | FunctionMod.Unsafe })` renders `async unsafe fn …`.

**Generated outputs** (regenerate + commit):

- `packages/rust/src/{consts,types,factories,from}.ts`
- `packages/typescript/src/{consts,types,factories,from}.ts`
- `packages/python/src/{consts,types,factories,from}.ts`
- Respective `node-model.json5` updates.

---

## Task 1: Classifier helper in `shared.ts`

**Files:**

- Modify: `packages/codegen/src/emitters/shared.ts`.
- Create: `packages/codegen/src/__tests__/keyword-presence.test.ts`.

**Steps:**

- [ ] **Step 1.1: Add `keywordPresenceKind(field, nodeMap)`.**

```ts
/**
 * Classify a field's keyword-presence intent from its slot `values`
 * + per-value multiplicity. Returns `'boolean'` for `optional(single-
 * literal)`, `'bitflag'` for `repeat(…choice-of-literals…)`, and `null`
 * when the field isn't a keyword-presence pattern.
 *
 * Shape criteria:
 *   'boolean' — values.length === 1
 *             AND the sole entry resolves to a single string (either
 *               a TerminalValue with one string, OR a NodeRef to a
 *               hidden `_kw_*` kind that resolveHiddenKeywordLiteral
 *               maps to a single literal)
 *             AND multiplicity of that entry is 'optional'.
 *
 *   'bitflag' — every entry resolves to a single string literal (same
 *               criteria as above, per-entry), AND every entry's
 *               multiplicity is 'array' or 'nonEmptyArray', AND the
 *               set of distinct literal values has size >= 2.
 *
 *   Degenerate 'repeat(single-literal)' — exactly one distinct literal
 *   with array multiplicity — classifies as 'boolean' (the language
 *   can't say the keyword more than once; multiple repeats are invalid
 *   by invariant).
 *
 *   All other shapes → null.
 */
export function keywordPresenceKind(
	field: AssembledChild,
	nodeMap: NodeMap
): 'boolean' | 'bitflag' | null {
	/* ... */
}
```

Companion accessors:

```ts
/** The single literal for a boolean-keyword field. Undefined otherwise. */
export function keywordPresenceValue(
	field: AssembledChild,
	nodeMap: NodeMap
): string | undefined;

/** The ordered-unique literal set for a bitflag field. Empty otherwise. */
export function keywordPresenceValues(
	field: AssembledChild,
	nodeMap: NodeMap
): readonly string[];
```

**Resolving each slot entry to "a single literal"** reuses the existing machinery:

- `TerminalValue` → its `value` directly.
- `NodeRef` → look up in `nodeMap.nodes`; if the resolved node is an `AssembledKeyword` / `AssembledToken` with a single-literal body, `resolveHiddenKeywordLiteral` already returns the literal. If it's an `AssembledEnum` with `members.length === 1` (single-value enum), its `members[0].value` counts.

- [ ] **Step 1.2: Unit tests — per-shape matrix.**

| Shape                                                 | Expected    |
| ----------------------------------------------------- | ----------- |
| `optional(STRING('mut'))`                             | `'boolean'` |
| `optional(SYMBOL(_kw_mut))` where `_kw_mut` = `'mut'` | `'boolean'` |
| `optional(enum-of-1('mut'))`                          | `'boolean'` |
| `repeat1(STRING('async'))` (degenerate one-literal)   | `'boolean'` |
| `repeat1(choice('a','b'))`                            | `'bitflag'` |
| `repeat(enum('a','b','c'))`                           | `'bitflag'` |
| `repeat1(SYMBOL(_kw_a) \| SYMBOL(_kw_b))`             | `'bitflag'` |
| `optional(enum-of-2('pub','priv'))`                   | `null`      |
| `repeat(choice(STRING, SYMBOL($.kind)))`              | `null`      |
| `optional($.kind)`                                    | `null`      |

- [ ] **Step 1.3: Commit.**

```bash
git commit -m "shared: keywordPresenceKind classifier for boolean / bitflag fields

Derives from AssembledField.values + per-value multiplicity, no new
Rule variants or cached AssembledField properties. Uses the existing
resolveHiddenKeywordLiteral helper to flatten NodeRef-to-_kw_* entries
into their literal strings."
```

---

## Task 2: Consts emitter — bitflag const tables

**Files:**

- Modify: `packages/codegen/src/emitters/consts.ts`.

**Steps:**

- [ ] **Step 2.1: Walk `AssembledField`s classified as `'bitflag'` and emit `const enum` declarations.**

```ts
// For each distinct bitflag field (dedup by constName):
export const enum FunctionMod {
	Async = 1 << 0,
	Unsafe = 1 << 1,
	Const = 1 << 2,
	Extern = 1 << 3,
	Default = 1 << 4
}
```

**Why `const enum`, not an `as const` object.** TypeScript widens
`Mod.Async | Mod.Unsafe` to `number` under regular `enum` and fails to
type the result as `Mod` under `as const` object + literal-union
(`1 | 2 | 4 | …` doesn't contain `3`). `const enum` is the one
representation where `Mod.Async | Mod.Unsafe` stays typed as `Mod`
— TypeScript special-cases OR over `const enum` members. Sittir already
emits `const enum SyntaxKind` elsewhere, so the downstream tsconfig
permits this.

**Zero-flag member.** Each enum includes `None = 0` when the field's
multiplicity allows zero flags (i.e. `repeat` — not `repeat1`). For
`repeat1`-backed bitflags the field is required (at least one flag
must be set), and `None` would be a type-system lie.

**Naming:** `constName = PascalCase(kindName) + PascalCase(fieldName)` when the field name alone would collide across grammars (e.g., typescript `class_declaration.modifiers` vs `method_definition.modifiers` could both be `Modifiers`). When unique, fall back to the shorter `PascalCase(fieldName)`. Decide during emission by building the candidate-name map first, then disambiguating collisions.

**Member naming:** `PascalCase(keywordValue)`. For values with non-identifier characters (`'pub(crate)'` → `PubCrate`), strip non-word chars and PascalCase the segments.

**Member order:** follows `keywordPresenceValues(field, nodeMap)` — the ordered-unique literal set as it appears in the grammar. This is the canonical render order; the factory's bit→keyword unpack uses the same index-aligned order.

- [ ] **Step 2.2: Sort emitted blocks** alphabetically by `constName` for deterministic diffs.

- [ ] **Step 2.3: Test + commit.**

Snapshot a const table emission for a fabricated bitflag field.

---

## Task 3: Types emitter — boolean + bitflag field types

**Files:**

- Modify: `packages/codegen/src/emitters/types.ts` — inject classification check ahead of `fieldTypeComponents`.

**Steps:**

- [ ] **Step 3.1: Short-circuit `fieldTypeExpr` on classified fields.**

```ts
function fieldTypeExpr(field, nodeMap, lookupUnion): string {
	const kw = keywordPresenceKind(field, nodeMap);
	if (kw === 'boolean') return 'boolean';
	if (kw === 'bitflag') return constNameFor(field, nodeMap); // e.g. 'FunctionMod' — const enum
	// ... existing fieldTypeComponents path for everything else
}
```

The bitflag type is the emitted `const enum` name directly — `FunctionMod`
rather than `number`. `Mod.Async | Mod.Unsafe` stays typed as `Mod`
through TypeScript's OR-special-casing for `const enum` members, so
callers can pass aggregate flags without casts.

- [ ] **Step 3.2: Narrow the Config Omit list.**

Auto-stamp already omits single-literal fields from Config. Boolean-keyword fields are optional (must remain in Config as `mut?: boolean`). Bitflag fields are optional (`modifiers?: ${ConstName}`). Neither is auto-stamp-eligible (their presence is caller-controlled), so no Omit change — just the type expression.

- [ ] **Step 3.3: Skip Terminal / Tree alias emission for modifier-only container kinds** (extension of the existing hidden-keyword suppression). If a kind's top-level rule classifies as bitflag (the entire rule body is the keyword set — a standalone modifier container like rust's `function_modifiers`), skip factory-facing type emission. Keep the SyntaxKind enum + KindMap entries for readNode dispatch.

- [ ] **Step 3.4: Tests + commit.**

Snapshot: `SelfParameter.$fields.mut: boolean`; `FunctionItem.$fields.functionModifiers: FunctionMod`.

---

## Task 4: Factory emitter — boolean construct/omit, bitflag per-bit spread

**Files:**

- Modify: `packages/codegen/src/emitters/factories.ts`.

**Steps:**

- [ ] **Step 4.1: Per-field emission branches.**

Extend the existing field-emission dispatch (after `isAutoStampField` check, before the default fluent path):

```ts
const kw = keywordPresenceKind(f, nodeMap);
if (kw === 'boolean') {
	// fields.mutable_specifier = config.mut ? { $type: 'mutable_specifier', $text: 'mut', ... } : undefined
	const fieldName = f.name;
	const value = keywordPresenceValue(f, nodeMap)!;
	const propertyName = f.propertyName; // camelCase
	lines.push(
		`    ${fieldName}: config.${propertyName} === true ? { $type: '${fieldName}', $text: ${JSON.stringify(value)}, $named: true, $source: 'factory' as const } : undefined,`
	);
	continue;
}
if (kw === 'bitflag') {
	const constName = constNameFor(f, nodeMap);
	const values = keywordPresenceValues(f, nodeMap);
	const fieldName = f.name;
	const propertyName = f.propertyName;
	// emit: fields.function_modifiers = config.modifiers !== undefined ? (function_modifiers with spread kids) : undefined
	lines.push(
		`    ${fieldName}: config.${propertyName} !== undefined ? ${fieldName}(`
	);
	values.forEach((v, i) => {
		const member = pascalCase(v);
		lines.push(
			`      ...(config.${propertyName} & ${constName}.${member} ? [{ $type: '_kw_${v}', $text: ${JSON.stringify(v)}, $named: false, $source: 'factory' as const }] : []),`
		);
	});
	lines.push('    ) : undefined,');
	continue;
}
```

Inner NodeData shape for each keyword: use the existing `_kw_<value>` hidden kind when present (that's what readNode produces for parsed keywords), or an anonymous token shape (`$type: value, $named: false`) if the hidden kind was inlined away. The generated code should match whatever readNode outputs for the same parse.

- [ ] **Step 4.2: Fluent setter methods.**

`mut(value?: boolean)` — `value === undefined` returns the current value, `value === true` rebuilds with mut set, `value === false` rebuilds without. Same closure pattern as existing `_fs` helpers.

`modifiers(value?: number)` — same pattern, numeric input.

- [ ] **Step 4.3: Tests + commit.**

---

## Task 5: From emitter — polymorphic resolvers

**Files:**

- Modify: `packages/codegen/src/emitters/from.ts`.

**Steps:**

- [ ] **Step 5.1: Emit `_resolveBooleanKeyword`** as a helper at module top:

```ts
function _resolveBooleanKeyword(
	v: unknown,
	keyword: string,
	factory: () => unknown
): unknown {
	if (v === true) return factory();
	if (v === false || v === undefined || v === null) return undefined;
	if (typeof v === 'string' && v === keyword) return factory();
	if (isNodeData(v)) return v;
	return undefined;
}
```

- [ ] **Step 5.2: Emit `_resolveBitflag`** similarly. Input may be an
      aggregate `FunctionMod` (number from `const enum` OR), a single string
      keyword, a `readonly string[]` keyword list, or a NodeData container
      from readNode. Output is typed `number` at the helper surface — the
      consuming factory slot is declared `FunctionMod`, so the generated
      assignment site narrows automatically via the factory's parameter
      signature.

```ts
function _resolveBitflag(
	v: unknown,
	constMap: Record<string, number>
): number | undefined {
	if (v === undefined || v === null) return undefined;
	if (typeof v === 'number') return v;
	if (typeof v === 'string') return constMap[v] ?? 0;
	if (Array.isArray(v)) {
		let f = 0;
		for (const item of v) {
			if (typeof item === 'string') f |= constMap[item] ?? 0;
			else if (typeof item === 'number') f |= item;
		}
		return f;
	}
	// NodeData with a container's children[] carrying keyword nodes:
	// walk children, map each to its bit via constMap, OR them together.
	if (isNodeData(v) && Array.isArray((v as any).$children)) {
		let f = 0;
		for (const child of (v as any).$children) {
			if (child?.$text && typeof child.$text === 'string') {
				f |= constMap[child.$text] ?? 0;
			}
		}
		return f;
	}
	return 0;
}
```

- [ ] **Step 5.3: Wire into field resolution.**

When the from-body emits a field that classifies as keyword-presence, route through the new resolver. All other paths unchanged.

- [ ] **Step 5.4: Tests + commit.**

---

## Task 6: Verify template render order

**Files:**

- Inspect only: `packages/codegen/src/emitters/templates.ts`, `packages/{rust,typescript,python}/templates.yaml`.

**Steps:**

- [ ] **Step 6.1: Hand-trace render for `functionItem({ functionModifiers: FunctionMod.Async | FunctionMod.Unsafe })`.**

Expected emitted source: `async unsafe fn …` (or whatever the grammar convention is). The factory emits keyword children in enum-declaration order (Task 4 step 1 ordering); the template's `$$$FUNCTION_MODIFIERS` (or equivalent) joins them with space. No template change needed.

- [ ] **Step 6.2: If ordering is wrong** for a specific grammar, document the exception and add an ordering override knob on the field — but defer actual knob implementation until a real mis-order is observed. Most modifier orders are conventional, not syntactic.

---

## Task 7: Regenerate + verify roundtrip

- [ ] **Step 7.1: Regenerate all three grammars.**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

- [ ] **Step 7.2: Verify roundtrip baseline holds.**

Expected (baseline at plan-write time):

- rust rt 123/0 + factory-rt 483/1; recursive 474/11
- typescript rt 81/27 + factory-rt 421/60; recursive 340/184
- python rt 98/16 + factory-rt 197/30; recursive 204/36

Regression most likely cause: bitflag child order differs from the grammar's expected order. Fix the enum-declaration order (the detector reads it from the grammar's choice members, so this is the canonical source).

- [ ] **Step 7.3: 402/402 codegen tests pass.**

- [ ] **Step 7.4: Commit the regenerated outputs.**

---

## Task 8: Cleanup — drop unused modifier-container factories

**Files:**

- Modify: `packages/codegen/src/emitters/factories.ts`, `types.ts`, `from.ts` — skip emission for kinds whose top-level rule is a bitflag body.

**Steps:**

- [ ] **Step 8.1: Detect modifier-only container kinds.**

A kind whose `AssembledNode` has ONLY one child/field and that slot classifies as bitflag. (Rust's `function_modifiers`, typescript's class/member modifier containers.)

- [ ] **Step 8.2: Skip factory, from-function, and interface emission** for those kinds. Keep the SyntaxKind enum entry + KindMap entry — readNode still needs to dispatch on the parse-produced kind.

- [ ] **Step 8.3: Tests + regenerate + commit.**

Confirm nothing else in the generated code references the dropped types (the parent kind's factory now constructs the container directly from the bitflag, not via `functionModifiers()`).

---

## Open questions (not blockers — revisit when concrete data appears)

1. **Bitflag ordering.** Rust / TypeScript modifier order is conventional. If a grammar enforces a fixed order, enum-declaration order is the canonical source. If we hit a counter-example, introduce an override knob — don't preemptively design for it.

2. **Extern modifier with arguments.** Rust's `extern "C"` is a container (symbol ref with string child) — correctly excluded by the classifier (non-literal NodeRef disqualifies). Stays a regular field.

3. **Standalone bitflag kinds.** If a grammar has a kind whose entire rule body is a bitflag with no enclosing field, the classifier applies at kind level. Task 8 covers the "skip modifier-container factory" case; the detection would need a slight extension for standalone-kind input. Defer unless a real case appears.

4. **Readback ergonomics.** `readNode` output still has `function_modifiers` as a container with keyword children. A `bitflagOf(node, ConstMap)` sugar helper for inspection could live in `@sittir/core` — separate feature.

---

## Verification

- 402/402 codegen tests pass after each commit.
- Roundtrip corpus matches baseline (Task 7 numbers).
- Hand-snapshot: `pub async unsafe fn foo() {}` — parse → readNode → `ir.functionItem({ visibilityModifier: 'pub', functionModifiers: FunctionMod.Async | FunctionMod.Unsafe, name: 'foo', parameters: [], body: [] })` → render → byte-identical source.

## Handoff

After all tasks complete:

- Update `CLAUDE.md` "Architecture" section — mention keyword-presence types alongside the auto-stamp + refine infrastructure.
- Update `MEMORY.md` with any surprise learnings (e.g., "bitflag child order follows enum-declaration; knob added for grammar X" — only if a grammar needs it).

Plan complete — saved to `docs/superpowers/plans/2026-04-21-adr-0012-keyword-presence-types.md`.
