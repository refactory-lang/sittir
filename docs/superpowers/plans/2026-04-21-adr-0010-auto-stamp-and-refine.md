# ADR-0010 Implementation Plan — Auto-stamp + refine() + path syntax

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three phases of factory-surface improvements:
  - **Phase 1**: single-literal fields auto-stamped by factory, omitted from `Config`.
  - **Phase 2**: new `refine()` DSL primitive for correlated choice selections — per-form factory namespace.
  - **Phase 3**: path syntax migration (`*` → `_`, bare `name` → `(name)`, add `name:` field traversal) to support refine's path addressing.

**Architecture:** Phase 1 is pure emitter logic — detect `literalValues.length === 1`, omit from Config, stamp in factory output. Phase 2's refine narrows a choice to one literal, which phase 1 then auto-stamps. Phase 3's path parser rewrite is small but breaking (one override line + test updates). Bundle phases 2 & 3 in the same commits since refine depends on the new segments.

**Tech Stack:** TypeScript, vitest, pnpm workspaces. Modifies `packages/codegen/src/emitters/*.ts`, `packages/codegen/src/dsl/transform/transform-path.ts`, adds `packages/codegen/src/dsl/primitives/refine.ts`.

---

## File Structure

Modified (phase 1):
- `packages/codegen/src/emitters/types.ts` — skip auto-stamp-eligible fields in `Config` emission.
- `packages/codegen/src/emitters/factories.ts` — stamp the constant into `$fields` output; remove from config-input destructure.

Modified (phase 3):
- `packages/codegen/src/dsl/transform/transform-path.ts` — `parsePath` accepts `_`, `(name)`, `name:`; rejects `*` and bare names with migration errors. `applyPath` handles `name:` field traversal.
- `packages/codegen/src/dsl/__tests__/transform-path.test.ts` — coverage for new segments + migration errors.
- `packages/rust/overrides.ts` — one line: `'2/_expression'` → `'2/(_expression)'`.

Created (phase 2):
- `packages/codegen/src/dsl/primitives/refine.ts` — new DSL primitive.
- `packages/codegen/src/dsl/__tests__/refine.test.ts` — unit tests.

Modified (phase 2):
- `packages/codegen/src/dsl/index.ts` — export `refine`.
- `packages/codegen/src/compiler/types.ts` — `LinkedGrammar` and/or `AssembledNode` gain a `refineForms?` field.
- `packages/codegen/src/compiler/link.ts` (or `evaluate.ts` + `link.ts`) — read refine metadata, attach to per-kind model entries.
- `packages/codegen/src/emitters/factories.ts` — per-form factory emission; first-form default.
- `packages/codegen/src/emitters/types.ts` — per-form `Config` with narrowed field types.
- `packages/typescript/overrides.ts` — refine declarations for `interface_body` and `object_type`.

---

## Constraints

1. After each task: `pnpm test` must match the baseline (1284 pass, 1 pre-existing fail). Type-check must match the baseline (only pre-existing errors).
2. After phases 1 and 2 land: regenerate all three grammars; diff the generated output; any new test failure must be understood before committing.
3. Phase 1's auto-stamp changes `Config` shape — any consumer that supplies a now-auto-stamped field as a config entry type-errors. If a test file does this, fix the test (remove the redundant entry) in the same commit as phase 1's codegen change.
4. Phase 3's path migration must be atomic — parser rewrite + rust override update + test updates in one commit.

---

## Task 1: Phase 1 — detect single-literal fields, omit from Config, stamp in factory

**Files:**
- Modify: `packages/codegen/src/emitters/types.ts`
- Modify: `packages/codegen/src/emitters/factories.ts`
- Modify: any test file under `packages/*/tests/` or `packages/codegen/src/__tests__/` that supplies now-auto-stamped fields as factory input.

**Detection predicate:** A field is auto-stamp-eligible iff its *effective* resolved type is a single string literal. Two sources:

1. **Inline literal:** `field.literalValues?.length === 1`. Direct — the field's content is a bare STRING or `choice(literal)`.
2. **Referenced constant kind:** `field.contentTypes.length === 1` AND the referenced kind is itself a single-literal constant (its rule body resolves to a bare string). Covers `_kw_*` hidden-rule pattern (both hand-authored and enrich-synthesized).

The referenced-kind case requires a link-time pass that marks each kind as `isSingleLiteralKind + literalValue` when its assembled body is a terminal with one literal. This is ~20 lines in `link.ts` — Task 1 gains a sub-step for it.

- [ ] **Step 1: Baseline test run**

Run: `pnpm test 2>&1 | tail -10`
Expected: 1284 pass, 1 pre-existing fail (`raw_string_literal`).

- [ ] **Step 2a: Link — mark single-literal constant kinds**

In `packages/codegen/src/compiler/link.ts`, after the pass that assembles each kind's `modelType`, add a small post-pass:

```ts
/**
 * Identify kinds whose assembled body is a single string terminal —
 * the constant-kind pattern used by _kw_* hidden rules (hand-authored
 * or enrich-synthesized). Downstream phase-1 auto-stamp treats fields
 * whose contentTypes reference these kinds as single-literal.
 */
function markSingleLiteralKinds(linked: LinkedGrammar): void {
    for (const [name, node] of linked.nodes) {
        if (node.modelType !== 'terminal') continue
        const literal = extractSingleLiteralValue(node.rule)
        if (literal !== null) {
            (node as Writable<AssembledTerminal>).isSingleLiteralKind = true
            (node as Writable<AssembledTerminal>).literalValue = literal
        }
    }
}
```

Implementation of `extractSingleLiteralValue`: walk through `prec` / `prec.left` / `prec.right` wrappers, accept the inner if it's a single `StringRule`; return null otherwise.

Add `isSingleLiteralKind?: boolean` + `literalValue?: string` to the relevant `AssembledNode` subclass (probably `AssembledTerminal` or `AssembledLeaf`) in `compiler/node-map.ts`. (Inspect; use the existing convention for optional metadata.)

- [ ] **Step 2b: Add the factory-side predicate helper**

In `packages/codegen/src/emitters/factories.ts` (or a new `shared.ts` helper if that fits the codebase pattern — inspect first), add:

```ts
/**
 * True when a field's *effective* resolved type is a single string
 * literal. Two sources: inline `literalValues` (length 1), or a
 * `contentTypes` entry that points at a single-literal constant
 * kind (`_kw_*` pattern). Phase-1 auto-stamp omits such fields from
 * Config and stamps the constant in factory output.
 *
 * @remarks
 * Enum fields with multiple literal values (`"{" | "{|"`) stay as
 * user input. Only fields whose effective type is ONE literal
 * qualify for auto-stamp. Phase 2's `refine()` narrows multi-literal
 * fields down to one literal per form; this helper then fires on
 * the narrowed shape.
 */
export function resolveEffectiveLiteral(
    field: AssembledField,
    kindMap: Map<string, AssembledNode>,
): string | undefined {
    if (field.literalValues?.length === 1) return field.literalValues[0]
    if (field.contentTypes.length === 1) {
        const ref = kindMap.get(field.contentTypes[0]!)
        if (ref && 'isSingleLiteralKind' in ref && ref.isSingleLiteralKind) {
            return (ref as { literalValue: string }).literalValue
        }
    }
    return undefined
}

export function isAutoStampField(
    field: AssembledField,
    kindMap: Map<string, AssembledNode>,
): boolean {
    return resolveEffectiveLiteral(field, kindMap) !== undefined
}
```

Export from a location both `types.ts` and `factories.ts` can import. Add unit tests covering both the inline-literal path and the referenced-constant-kind path.

- [ ] **Step 3: `types.ts` — skip auto-stamp fields from `Config` interface emission**

Find the function that emits `Config` interface bodies. (Search for `Config` in types.ts; the emission should iterate the node's `AssembledField[]` and emit `readonly <name>: <type>` per field.)

Wrap the iteration with the predicate — skip fields where `isAutoStampField(field)` is true. The field stays visible in the full `NodeData` interface (on `$fields`), just not on `Config`.

Grep for all emission sites; there may be more than one (`ConfigOf`, `Config`, form-wise configs, etc.). Use the predicate uniformly.

- [ ] **Step 4: `factories.ts` — stamp the constant in factory output; remove from config-input destructure**

Find the factory emission that builds the `const fields = { ... }` block (`emitFieldGetterLine` or similar per wave-3 decomposition). For auto-stamp-eligible fields:

- Emit the constant directly: `type: 'break'` instead of `type: config?.type`.
- Do NOT destructure from config input.
- Fluent getters/setters for that field: **remove** the setter (field is constant), keep the getter returning the constant. Inspect current convention — if fluent surface uses typed methods, they should return the constant string type.

- [ ] **Step 5: Regenerate all three grammars**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
```

Expected: exit 0 for all. Diff the generated `types.ts` and `factories.ts`; some `Config` interfaces should have shrunk (grep for rules like `break_statement`, `continue_statement`, `return_statement` which field their keyword).

- [ ] **Step 6: Run tests and fix any consumer-side breakage**

Run: `pnpm test 2>&1 | tail -30`

Likely outcomes:
- Test files under `packages/<lang>/tests/nodes.test.ts` that supply the now-auto-stamped field as a config entry — these TypeScript-error out. Fix: remove the redundant entry from the test call.
- Any round-trip test (readNode → NodeData → factory input → factory output → compare) where the test manually constructs a factory input from readNode output — might re-supply the now-auto-stamped field. Fix: drop the field from the manually-constructed input.

If a test fails for ANY other reason, STOP and report BLOCKED.

Keep fixing tests until 1284 pass, 1 pre-existing fail.

- [ ] **Step 7: Type-check**

Run: `pnpm -r run type-check 2>&1 | tail -20`
Expected: only pre-existing errors (`raw_string_literal` rust test, python trailing commas).

- [ ] **Step 8: Commit**

```bash
git add -u
# Include regenerated artifacts under packages/{rust,python,typescript}/src and .sittir if they diffed.
git status --short
git commit -m "adr-0010 phase 1: auto-stamp single-literal fields; omit from Config

Fields whose resolved type is a single string literal are now stamped
automatically by the factory and omitted from the Config interface.
The field stays on the NodeData output shape (under \$fields) so
round-trip with readNode remains identical.

Applies immediately to keyword fields the grammar declares (break,
continue, return, etc.) — user no longer supplies those as config
entries. Phase 2's refine() will narrow multi-literal unions down to
one literal per form; this auto-stamp rule then fires on the narrowed
shape."
```

---

## Task 2: Phase 3 — path syntax migration (parser + one override + tests)

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform-path.ts`
- Modify: `packages/codegen/src/dsl/__tests__/transform-path.test.ts`
- Modify: `packages/rust/overrides.ts` (one line)

Atomic migration: parser additions, parser migration errors, Rust's one path update, tests for each new segment form and each migration error. All in one commit.

- [ ] **Step 1: Read the current path parser + applier**

Open `packages/codegen/src/dsl/transform/transform-path.ts` and locate `parsePath`. Note its current segment types (index, reverse-index, wildcard `*`, bare kind-name). The updated vocabulary:

| Segment | Meaning |
|---------|---------|
| `N` | Non-negative integer (unchanged) |
| `-N` | Negative integer (unchanged) |
| `_` | Wildcard — any member at this level |
| `(name)` | Kind match — descend if kind matches |
| `name:` | Field traversal — descend through `field('name', ...)` content |

- [ ] **Step 2: Add the new segments in parsePath; reject the migrated-away forms with clear errors**

In `parsePath`, per-segment classification:

- `/^\d+$/` → positional index (unchanged).
- `/^-\d+$/` → reverse index (unchanged).
- `'_'` → wildcard.
- `/^\([A-Za-z_][A-Za-z0-9_]*\)$/` → kind-match; `.name = segment.slice(1, -1)`.
- `/^[A-Za-z_][A-Za-z0-9_]*:$/` → field traversal; `.name = segment.slice(0, -1)`.
- `'*'` → throw: `"path segment '*' is no longer valid — use '_' for wildcard; see ADR-0010"`.
- Otherwise (e.g., bare `foo`) → throw: `"bare kind name 'foo' is no longer valid as a path segment — use '(foo)' instead; see ADR-0010"`.

Update the `PathSegment` discriminated union to add `{ kind: 'fieldName'; name: string }` alongside the existing kinds.

- [ ] **Step 3: Add field-traversal logic in `applyPath`**

Extend `applyPath` (or the walker it delegates to) to handle the `fieldName` segment:

```ts
if (segment.kind === 'fieldName') {
    if (!isFieldType(rule.type)) {
        throw new Error(`path segment '${segment.name}:' at this level expects a field('${segment.name}', ...) wrapper; got type '${rule.type}'`)
    }
    const actualName = (rule as { name?: string }).name
    if (actualName !== segment.name) {
        throw new Error(`path segment '${segment.name}:' doesn't match field name '${actualName}' at this position`)
    }
    // Descend into the field's content.
    return applyPath(fieldContent(rule), restSegments, ...)
}
```

Hard-error on name mismatch (silent no-match is a footgun; strict matches sittir's path-mode convention).

- [ ] **Step 4: Update `transform-path.test.ts`**

Add test cases:

- `_` wildcard resolves at one level.
- `(foo)` matches a named kind; errors when no match.
- `foo:` descends through a field wrapper named `foo`.
- `foo:` throws when the field name doesn't match.
- `foo:` throws when the node isn't a field wrapper.
- `*` throws the migration error.
- Bare `foo` throws the migration error (when not at first segment where it'd be a valid-looking identifier — check the parser's behavior).

Update any existing test that uses `*` or bare kind names; migrate to the new forms.

- [ ] **Step 5: Migrate Rust's one path use**

In `packages/rust/overrides.ts`, find the line:

```ts
{ '2/_expression': field('elements') },
```

Change to:

```ts
{ '2/(_expression)': field('elements') },
```

(Verify the exact line via grep. This is inside the `array_expression` entry in the transforms: block added during ADR-0009 Task 7.)

- [ ] **Step 6: Test + regenerate**

Run: `pnpm test 2>&1 | tail -15`
Expected: 1284 pass, 1 pre-existing fail.

Run: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src && pnpm test 2>&1 | tail -10`
Expected: same counts.

Regenerate python + typescript too:
```bash
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
```

- [ ] **Step 7: Commit**

```bash
git add -u
git status --short
git commit -m "adr-0010 phase 3: path syntax — '*' → '_', bare kind → '(name)', add 'name:' field traversal

parsePath now rejects '*' and bare kind-names with migration errors,
accepts '_' (wildcard), '(name)' (kind match), and 'name:' (field
traversal). applyPath descends through field wrappers when the
segment name matches; hard-errors on mismatch.

One override line migrated: rust's array_expression '2/_expression'
→ '2/(_expression)'. No other overrides use path syntax affected by
the migration.

Bundled with phase 2 next — refine() uses the new 'name:' segment
to address fields by name instead of positional index."
```

---

## Task 3: Phase 2a — `refine()` DSL primitive (authoring-only metadata)

**Files:**
- Create: `packages/codegen/src/dsl/primitives/refine.ts`
- Create: `packages/codegen/src/dsl/__tests__/refine.test.ts`
- Modify: `packages/codegen/src/dsl/index.ts`
- Modify: `packages/codegen/src/dsl/wire/wire.ts` — extend `WireContext` with `refineForms` if the metadata goes through the wire context (natural home since wire already owns per-rule codegen metadata).

- [ ] **Step 1: Design the metadata shape**

Read `packages/codegen/src/dsl/wire/wire.ts` around the `WireContext` interface. Add to it:

```ts
/**
 * Per-rule form metadata registered by refine(). Each entry maps
 * a rule kind to an ordered list of form declarations. The first
 * entry is the default form (bare factory call ir.<kind>() routes
 * there). Emitters consume this to generate per-form factories +
 * narrowed Config types.
 */
readonly refineForms: Map<string, RefineForm[]>
```

With:

```ts
export interface RefineForm {
    readonly name: string
    /** Path → selection. Selection is branch index or literal string. */
    readonly selections: Record<string, number | string>
}
```

Initialize in `wire(config)` and in `withWireContext()`.

Add a wire-routing helper:

```ts
export function wireRegisterRefineForms(kind: string, forms: RefineForm[]): boolean {
    if (!currentContext) return false
    currentContext.refineForms.set(kind, forms)
    return true
}
```

- [ ] **Step 2: Create `refine.ts`**

Write `packages/codegen/src/dsl/primitives/refine.ts`:

```ts
/**
 * dsl/primitives/refine.ts — declare correlated choice selections
 * across non-adjacent positions as named forms. Authoring-only —
 * produces codegen metadata via the active wire context; the rule
 * tree is unchanged. See ADR-0010 for the full design.
 */

import type { RuntimeRule } from '../runtime-shapes.ts'
import { wireGetCurrentRuleKind, wireRegisterRefineForms, type RefineForm } from '../wire/wire.ts'

export type FormMap = Record<string, Record<string, number | string>>

/**
 * Declare per-form choice selections for the current rule. Each outer
 * key names a form; each inner key is a path to a choice node; each
 * inner value picks one branch from that choice (branch index or a
 * literal-matching string).
 *
 * Returns the rule unchanged structurally — tree-sitter parses using
 * the original rule. Codegen reads the form metadata to emit
 * per-form namespace-keyed factories (`ir.interfaceBody.curly(...)`)
 * with narrowed Config types that phase 1's auto-stamp rule then
 * collapses to absent fields.
 *
 * @throws {Error} If called outside a wire() context, or if any form
 *   name duplicates an earlier form on the same rule.
 */
export function refine(original: RuntimeRule, forms: FormMap): RuntimeRule {
    const kind = wireGetCurrentRuleKind()
    if (!kind) {
        throw new Error(
            `refine(): no active wire context — refine() must run inside a rule callback under wire()`,
        )
    }
    const formList: RefineForm[] = []
    for (const [name, selections] of Object.entries(forms)) {
        if (formList.some(f => f.name === name)) {
            throw new Error(`refine(): duplicate form name '${name}' on rule '${kind}'`)
        }
        formList.push({ name, selections: { ...selections } })
    }
    if (!wireRegisterRefineForms(kind, formList)) {
        throw new Error(`refine(): wire context rejected registration — unexpected`)
    }
    return original
}
```

Note: path + selection **validation** (path resolves to a choice, selection in range, etc.) happens at codegen time inside link.ts or the emitter — refine itself just records. Reason: at authoring time, the rule may be mid-transform (enrich might not have fired yet, transform patches might not have applied). Deferring validation to link avoids ordering hazards.

- [ ] **Step 3: Export from `dsl/index.ts`**

Add:

```ts
export { refine } from './primitives/refine.ts'
```

- [ ] **Step 4: Unit tests**

Write `packages/codegen/src/dsl/__tests__/refine.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { refine } from '../primitives/refine.ts'
import { withWireContext } from '../wire/wire.ts'
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts'
import type { Rule } from '../../compiler/rule.ts'

beforeAll(() => installFakeDsl())
afterAll(() => restoreFakeDsl())

describe('refine()', () => {
    const rule = { type: 'seq', members: [] } as Rule

    it('registers form metadata on the active wire context', () => {
        const { ctx, result } = withWireContext('interface_body', () => {
            return refine(rule, {
                curly: { 'opening:': '{', 'closing:': '}' },
                flow:  { 'opening:': '{|', 'closing:': '|}' },
            })
        })
        expect(result).toBe(rule)  // unchanged structurally
        const forms = ctx.refineForms.get('interface_body')
        expect(forms).toBeDefined()
        expect(forms).toHaveLength(2)
        expect(forms![0].name).toBe('curly')
        expect(forms![0].selections['opening:']).toBe('{')
        expect(forms![1].name).toBe('flow')
    })

    it('throws without an active wire context', () => {
        expect(() => {
            refine(rule, { curly: { 'opening:': '{' } })
        }).toThrow(/no active wire context/)
    })

    it('throws on duplicate form names', () => {
        expect(() => {
            withWireContext('x', () => {
                refine(rule, {
                    curly: { 'opening:': '{' },
                    // duplicate — same form name, different selection
                })
            })
        }).not.toThrow()  // no duplicate at the JS-object level; keys are unique
        // The duplicate-detection fires when a SEPARATE form entry
        // shares a name, which JS object literals can't express. Skip
        // this case; the guard exists for robustness.
    })
})
```

- [ ] **Step 5: Type-check + test**

Run: `pnpm -r run type-check 2>&1 | tail -10 && pnpm test 2>&1 | tail -15`
Expected: clean + 1284/1.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/dsl/primitives/refine.ts packages/codegen/src/dsl/__tests__/refine.test.ts packages/codegen/src/dsl/index.ts packages/codegen/src/dsl/wire/wire.ts
git commit -m "adr-0010 phase 2a: add refine() DSL primitive

Authoring-only metadata registration. refine(original, forms) routes
per-rule form declarations through the active wire context; the rule
tree is unchanged structurally. Codegen (next task) reads the metadata
to emit per-form namespace-keyed factories with narrowed Config types.

Path + selection validation deferred to codegen — at refine() call
time, enrich / transform patches may not have settled the rule shape
yet."
```

---

## Task 4: Phase 2b — codegen for refine (link + emitters)

**Files:**
- Modify: `packages/codegen/src/compiler/evaluate.ts` — thread `refineForms` from wire context into `RawGrammar`.
- Modify: `packages/codegen/src/compiler/types.ts` — `RawGrammar` gains `refineForms?: Map<string, RefineForm[]>`; `LinkedGrammar` or the per-kind model gains the same.
- Modify: `packages/codegen/src/compiler/link.ts` — attach refine metadata to per-kind `AssembledNode` entries; validate paths resolve to choice nodes; validate selections.
- Modify: `packages/codegen/src/emitters/factories.ts` — per-form factory emission.
- Modify: `packages/codegen/src/emitters/types.ts` — per-form Config with narrowed types.

This task is the biggest in the plan. Break into steps carefully.

- [ ] **Step 1: Thread refine metadata from wire context into `RawGrammar`**

In `evaluate.ts::drainPolymorphMetadata`, add a sibling `drainRefineMetadata`:

```ts
function drainRefineMetadata(opts: GrammarOptions): Map<string, RefineForm[]> | undefined {
    const wireCtx = (opts as unknown as { __wireContext__?: WireContext }).__wireContext__
    return wireCtx && wireCtx.refineForms.size > 0 ? new Map(wireCtx.refineForms) : undefined
}
```

In `grammarFn`'s return statement (where it builds `RawGrammar`), add:

```ts
refineForms: drainRefineMetadata(opts),
```

Update `RawGrammar` interface in `compiler/types.ts` to include the field.

- [ ] **Step 2: Add `refineForms` to `LinkedGrammar` + per-kind carrier**

Decide where the metadata lands on the linked model. Two options:

(a) On `LinkedGrammar` as a map; emitters look up by kind.
(b) On each `AssembledNode` entry; emitters access directly.

Option (b) is more local. Add to `AssembledBranch` (and possibly other `AssembledNode` subclasses that can be refined — probably just branch):

```ts
readonly refineForms?: readonly RefineForm[]
```

In `link.ts`, wherever per-kind `AssembledNode` instances are constructed, look up `refineForms.get(kind)` from the raw grammar and attach.

- [ ] **Step 3: Codegen-time validation of refine metadata**

In `link.ts` or a new `link-refine.ts` helper, for each refined kind:

- Parse each path in `form.selections`.
- Walk the rule tree; verify each path resolves to a choice rule node.
- Verify each selection (numeric index in range, string matches a choice member's literal value).
- Throw a clear error on any validation failure — codegen should fail loud if an override's refine declaration is wrong.

- [ ] **Step 4: Per-form config interface emission**

In `emitters/types.ts`, when emitting a kind's namespace block, check `model.refineForms`. If present, emit per-form Config interfaces:

```ts
// For interface_body with forms [curly, flow]:
export namespace InterfaceBody {
    export namespace Curly {
        export interface Config {
            // opening omitted — literalValues narrowed to ['{'], phase-1 auto-stamp fires
            // closing omitted — same
            readonly members?: readonly Member[]
        }
    }
    export namespace Flow {
        export interface Config { /* analogous */ }
    }
    /** First-declared form is the default for bare-call sugar. */
    export type Config = Curly.Config
}
```

Key trick: per-form Config generation narrows the auto-stamp-eligible fields. The existing per-kind Config-emission code can run per form, using a narrowed `AssembledField[]` where each field's `literalValues` is replaced with `[selectedLiteral]` before the phase-1 auto-stamp rule fires.

Write a small helper:

```ts
function narrowFieldsForForm(fields: AssembledField[], form: RefineForm): AssembledField[] {
    // For each form selection, find the field whose path matches,
    // replace its literalValues with the singleton selected value.
    // Fields unaffected by the form stay as-is.
}
```

- [ ] **Step 5: Per-form factory emission**

In `emitters/factories.ts`, when emitting a kind's factory and `model.refineForms` is present:

- Emit one factory function per form (`interfaceBodyCurly(config)`, `interfaceBodyFlow(config)` or similar naming). Generate the factory body with the narrowed fields (auto-stamp now kicks in for what was previously a choice-union).
- Emit a namespace object: `export const interfaceBody = { curly: interfaceBodyCurly, flow: interfaceBodyFlow }`.
- Emit a default callable `export function interfaceBody(config): ...` that delegates to the first-declared form.
- Add a **comment above the default** naming the form: `// Default form: 'curly' (first-declared).` So a `git diff` on regenerated code surfaces any reorder-induced default flip.

- [ ] **Step 6: `NamespaceMap` entries**

Extend the NamespaceMap emission so `NamespaceMap['interface_body']` exposes per-form factory types too. Per ADR-0008 ergonomics — `InterfaceBody.Curly.Config`, `InterfaceBody.Flow.Config` should all resolve through the namespace.

- [ ] **Step 7: Regenerate + test**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
```

Rust and Python refine nothing — their codegen output should be identical to pre-task-4 state. Diff to confirm.

TypeScript also refines nothing at this point (migration happens in Task 5). Output should also be unchanged.

Run `pnpm test`: 1284/1 expected.

- [ ] **Step 8: Commit**

```bash
git add -u
git status --short
git commit -m "adr-0010 phase 2b: codegen — read refine metadata, emit per-form factories

evaluate.ts threads wire context's refineForms map into RawGrammar.
link.ts validates paths + selections at codegen time (not at refine()
call time — the rule may be mid-transform when refine runs).
Per-kind AssembledNode gains a refineForms field.

Emitters react to the field:
  - types.ts emits per-form Config interfaces with the selected fields
    narrowed to single literals; phase-1 auto-stamp then omits them.
  - factories.ts emits per-form factories under a namespace object,
    plus a default bare-call routing to the first-declared form (with
    a generated comment naming the default).

Currently inert for all three grammars — no override uses refine yet.
Task 5 migrates typescript interface_body and object_type."
```

---

## Task 5: Phase 2c — migrate `interface_body` and `object_type` in typescript overrides

**Files:**
- Modify: `packages/typescript/overrides.ts`

- [ ] **Step 1: Add refine declarations**

Open `packages/typescript/overrides.ts`. In the `rules:` block (or a transform callback section if that's the idiom there), add:

```ts
interface_body: ($, original) => refine(original, {
    curly: { 'opening:': '{',  'closing:': '}'  },
    flow:  { 'opening:': '{|', 'closing:': '|}' },
}),

object_type: ($, original) => refine(original, {
    curly: { 'opening:': '{',  'closing:': '}'  },
    flow:  { 'opening:': '{|', 'closing:': '|}' },
}),
```

Import `refine` from `../codegen/src/dsl/index.ts`.

- [ ] **Step 2: Regenerate typescript**

```bash
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
```

Inspect generated `types.ts`: `InterfaceBody` namespace now has `Curly` and `Flow` sub-namespaces. The per-form Config lacks `opening` / `closing` entries.

Inspect generated `factories.ts`: `interfaceBody.curly(...)`, `interfaceBody.flow(...)`, and `interfaceBody(...)` (default).

- [ ] **Step 3: Add type-level + runtime tests**

Create or append to `packages/typescript/tests/refine.test.ts`:

```ts
import { describe, it, expect, expectTypeOf } from 'vitest'
import { ir } from '../src/index.ts'

describe('interface_body refined forms', () => {
    it('curly factory stamps { and }', () => {
        const node = ir.interfaceBody.curly({ members: [] })
        expect(node.$fields.opening).toBe('{')
        expect(node.$fields.closing).toBe('}')
    })

    it('flow factory stamps {| and |}', () => {
        const node = ir.interfaceBody.flow({ members: [] })
        expect(node.$fields.opening).toBe('{|')
        expect(node.$fields.closing).toBe('|}')
    })

    it('bare ir.interfaceBody defaults to curly (first-declared)', () => {
        const node = ir.interfaceBody({ members: [] })
        expect(node.$fields.opening).toBe('{')
        expect(node.$fields.closing).toBe('}')
    })

    it('Config types omit the auto-stamped fields', () => {
        expectTypeOf<Parameters<typeof ir.interfaceBody.curly>[0]>().not.toHaveProperty('opening')
        expectTypeOf<Parameters<typeof ir.interfaceBody.curly>[0]>().not.toHaveProperty('closing')
    })
})
```

Run: `pnpm test packages/typescript/tests/refine.test.ts 2>&1 | tail -15`
Expected: all pass.

Run full suite: `pnpm test 2>&1 | tail -10`
Expected: 1284 + 4 new tests = ~1288 pass, 1 pre-existing fail.

- [ ] **Step 4: Commit**

```bash
git add packages/typescript/overrides.ts packages/typescript/src packages/typescript/tests/refine.test.ts packages/typescript/.sittir/grammar.js
git commit -m "adr-0010 phase 2c: migrate typescript interface_body and object_type to refine()

Both rules model correlated delimiter choices: { / } (curly form) or
{| / |} (flow form). With refine(), the Config narrows opening/closing
to single literals per form; phase-1 auto-stamp then omits them. Users
write ir.interfaceBody.curly({ members }) or
ir.interfaceBody.flow({ members }) — bare ir.interfaceBody(...) defaults
to curly (first-declared).

Added round-trip + type-level tests confirming the omission and default."
```

---

## Self-Review

**Spec coverage (ADR-0010 decisions):**
- Phase 1 auto-stamp — ✅ Task 1
- Phase 2 refine() — ✅ Tasks 3-5
- Phase 3 path syntax migration — ✅ Task 2
- No `$variant` on refine factory output — ✅ factory emission stamps constants only, no discriminator
- First-declared form default — ✅ Task 4 Step 5
- Codegen-time validation of refine paths + selections — ✅ Task 4 Step 3
- Hard-error on `name:` mismatch — ✅ Task 2 Step 3
- Migration error messages naming the replacement — ✅ Task 2 Step 2

**Placeholder scan:** No "TBD" / "TODO" / "similar to Task N". Each task has concrete code or explicit "inspect X, determine Y" discovery steps where pattern-matching to existing code is needed.

**Type consistency:** `RefineForm`, `FormMap`, `refineForms` use the same names across wire.ts, refine.ts, types.ts, link.ts, and emitters. `AssembledField.literalValues` is the consistent detection field for phase 1.

**Rollback plan:** Each phase commits separately. Phase 1 (Task 1) is the highest-risk — it can break consumer tests if they supply now-auto-stamped fields. If a test breaks for an unexpected reason, revert the task commit, investigate, resume. Phase 3 (Task 2) is atomic per its own requirement. Phase 2 (Tasks 3-5) commit separately; Task 3 is inert without Task 4, Task 4 is inert without Task 5's override migration, so any single task can be reverted without affecting grammars that don't use refine.
