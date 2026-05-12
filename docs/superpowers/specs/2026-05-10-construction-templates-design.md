# Construction Templates — Architectural Design

**Status:** Draft, 2026-05-10
**Companion to:** `docs/adr/0022-construction-templates.md`
**Related:** ADR-0001 (overrides), ADR-0005 (transpile), ADR-0018 (NodeData surface), ADR-0023 (typed query API), ADR-0024 (codegen dogfooding)

ADR-0022 captured the architectural decision: compile a template-mode parser per grammar through the existing override pipeline, surface `snippets.*` and `template('...')` for construction-from-source-with-slots. This design fills in what the ADR deferred — components, data flows, slot type derivation, caching, error reporting, the parity contract between the two fill backends, and the test strategy. A reader should leave with enough to implement the feature without re-litigating any of the ADR's decisions and without inventing new ones.

## 1. Scope

In scope:

- Template-mode parser (per-grammar override + transpile chain extension).
- Slot extraction (codegen-time for `snippets/*.template`; runtime for inline `template('...')`).
- Both fill backends — Rust (sittir-core) and TS-side (`@sittir/core`) — and the parity contract that holds them behaviorally identical.
- User-facing API: `snippets.greetFunction.fill({...})`, `template('...').fill({...})`, plus `.from(...)` looseness on snippets.
- Resolutions for ADR-0022's three follow-ups (caching, supertype scope, error reporting).

Out of scope (explicit non-goals):

- Pattern *matching* — templates are construction-only. Matching lives in ADR-0023's typed query API.
- Build-time codegen for inline templates (a future option; the current design uses loose-default + optional type parameter).
- Slot kind narrowing inside template strings (no `$NAME<Identifier>` syntax — would break the "templates look like the target language" property).
- Construction validity *beyond* what TypeScript types catch — this design adopts "strong types only, trust TypeScript"; runtime fill does not validate slot value `$type` against position.

## 2. Architecture

The subsystem has four logical layers and two interchangeable fill implementations behind a common contract:

```
Template authoring                     Snippets file (.template)        Inline template('...') call
                                                  │                                  │
                                                  ▼                                  ▼
Template-mode parser                   ┌──────────────────────────────────────────────────────────┐
(per grammar; built by                 │  template-mode parser  (sittir grammar with metavar      │
 override + transpile)                 │  rule injected; bundled per @sittir/<grammar>)           │
                                       └──────────────────────────────────────────────────────────┘
                                                  │                                  │
                                                  ▼                                  ▼
Slot extraction              ┌──────────────────────────────┐    ┌────────────────────────────────┐
                             │  codegen extractor            │   │  runtime extractor              │
                             │  (slot map → typed snippet)   │   │  (slot map → loose FillHandle)  │
                             └──────────────────────────────┘    └────────────────────────────────┘
                                                  │                                  │
                                                  ▼                                  ▼
                             ┌────────────────────────────────────────────────────────────────────┐
                             │  FillHandle  (lazy capture: template + slots; @sittir/core)         │
                             └────────────────────────────────────────────────────────────────────┘
                                                                │
                                          terminal .read() / .render()
                                                                │
                            ┌───────────────────────────────────┴───────────────────────────────┐
Fill backends               ▼                                                                   ▼
                  ┌──────────────────────┐                                       ┌──────────────────────┐
                  │  Rust fill            │   parity contract  (test-enforced)   │  TS-side fill         │
                  │  CompiledTemplate +   │ ◀──────────────────────────────────▶ │  parses via tree-sitter│
                  │  TemplateBuilder       │     same NodeData for same input    │  JS binding; splices  │
                  │  (sittir-core)         │                                      │  slots                │
                  └──────────────────────┘                                       └──────────────────────┘
                                                                │
                                                                ▼
                                                  NodeData → existing render /
                                                  edit / wrap surfaces unchanged
```

The two fills are independently written. Parity is enforced by a corpus-based test harness (§7), not by sharing implementation. This keeps each backend native to its language (Rust idioms in sittir-core, TS idioms in `@sittir/core`) and makes the parity test the single failure signal.

## 3. Components

| Layer                         | Module / file                                                     |  ~LoC | Owner               |
| ----------------------------- | ----------------------------------------------------------------- | ----: | ------------------- |
| Template-mode override        | `packages/<lang>/overrides.ts` (new `templateMode` export)        |   4–8 | per-grammar         |
| Transpile chain extension     | `@sittir/codegen/transpile/transpile-overrides.ts`                |    40 | `@sittir/codegen`   |
| Slot extractor                | `@sittir/codegen/templates/extract-slots.ts`                      |   150 | `@sittir/codegen`   |
| Snippets emitter              | `@sittir/codegen/emitters/snippets.ts`                            |   100 | `@sittir/codegen`   |
| `FillHandle`                  | `@sittir/core/template/fill-handle.ts`                            |    30 | `@sittir/core`      |
| `template()` wrapper          | `packages/<lang>/template.ts` (generated thin wrapper per grammar)|    30 | per-grammar         |
| TS-side fill                  | `@sittir/core/template/ts-fill.ts`                                |   120 | `@sittir/core`      |
| Rust `CompiledTemplate`       | `rust/crates/sittir-core/src/template/compiled.rs`                |   100 | `sittir-core`       |
| Rust `TemplateBuilder`        | `rust/crates/sittir-core/src/template/builder.rs`                 |   100 | `sittir-core`       |
| `template_read` / `template_render` napi | `rust/crates/sittir-<grammar>/src/template_napi.rs`    |    50 | per-grammar (Rust)  |
| Parity test harness           | `packages/codegen/__tests__/template-parity/`                     |   100 | `@sittir/codegen`   |

Total: ~830 lines + per-grammar overrides (4–8 lines per grammar).

### 3.1 Template-mode override (per grammar)

Each grammar's `overrides.ts` exports a `templateMode` block alongside the existing `transform()` / `role()` / `variant()` overrides. The block declares which rules to inject `_sittir_metavar` into:

```ts
// packages/rust/overrides.ts
export const templateMode = {
  // Always include the metavariable rule itself.
  _sittir_metavar: $ => token(prec(10, /\$(\.\.\.)?[A-Z][A-Z0-9_]*/)),

  // Per-grammar choice of supertypes / nominal rules. identifier covers
  // alias-of-identifier kinds (type_identifier, field_identifier, ...)
  // for free via tree-sitter's alias mechanism.
  identifier:  ($, original) => choice(prec(10, $._sittir_metavar), original),
  _expression: ($, original) => choice(prec(10, $._sittir_metavar), original),
  _statement:  ($, original) => choice(prec(10, $._sittir_metavar), original),
};
```

Default minimum useful set: `identifier`, `_expression`, `_statement`. Per grammar, `_type` and `_pattern` are added when template-authoring use cases demand them. The list is always **explicit** in `overrides.ts` — no auto-magic injection — because per-grammar choice of injection points is an authoring decision (P-002, mechanical only).

### 3.2 Transpile chain extension

The current chain (`overrides.ts → transpile → .sittir/grammar.js → tree-sitter generate → parser.wasm`) is extended to produce **two** parser artifacts per grammar:

```
overrides.ts ──┬──▶ transpile (production) ──▶ .sittir/grammar.js          ──▶ tree-sitter generate ──▶ parser.wasm
               └──▶ transpile (template)   ──▶ .sittir/grammar.template.js ──▶ tree-sitter generate ──▶ template-parser.wasm
```

Both transpile branches share the base + per-rule overrides (`transform()`, `role()`, `variant()`); only the template branch additionally folds in the `templateMode` block. Production parser is untouched by the addition.

### 3.3 Slot extractor

Pure function: `(templateSource: string, language: TemplateLanguage) → SlotMap`.

```ts
type SlotMap = {
  name: string;              // 'NAME', 'PARAMS', etc.
  multi: boolean;            // true for $...PARAMS
  parentKind: string;        // grammar kind containing the metavar position
  fieldName: string | null;  // null for unnamed-slot positions ($child / $children)
  positionPath: number[];    // path from parentKind to the metavar position (for fill splicing)
}[];
```

Algorithm: parse the template with the template-mode parser, walk the parse tree, for each `_sittir_metavar` node record its name (text after `$` or `$...`), enclosing parent kind, the field it occupies (if any), and a positional path back to its parent so the fill backend can splice.

Used at codegen time (snippets) to derive types, and at runtime (inline templates) to inform the fill backend where to splice.

### 3.4 Snippets emitter

Walks `packages/<lang>/snippets/*.template` files, calls the slot extractor, derives TS slot types from `parentInterface[_fieldName]` (or `$child` / `$children` for unnamed slots), emits `snippets.ts`:

```ts
// generated
const GREET_FUNCTION = `pub fn $NAME($...PARAMS) -> $RET {\n    $BODY\n}`;

export const snippets = {
  greetFunction: {
    fill(slots: {
      NAME: FunctionItem['_name'];
      PARAMS: NonNullable<Parameters['$children']>[number][];
      RET:  NonNullable<FunctionItem['_return_type']>;
      BODY: FunctionItem['_body'];
    }): FillHandle {
      return new FillHandle(GREET_FUNCTION, slots);
    },

    from(slots: {
      NAME: string | FunctionItem['_name'];
      PARAMS: (string | NonNullable<Parameters['$children']>[number])[];
      RET:  string | NonNullable<FunctionItem['_return_type']>;
      BODY: FunctionItem['_body'];
    }): FillHandle {
      return new FillHandle(GREET_FUNCTION, resolveSlots(slots));
    },
  },
} as const;
```

`fill()` is the strict typed entry; `from()` is the loose entry that passes slots through `resolveSlots` (the same `.from()`-coercion path leaf factories use). Both produce a `FillHandle`.

### 3.5 `FillHandle` (lazy capture)

Pure JS, in `@sittir/core`. Captures `(templateSource, slotMap)` at construction; does no work until `.read()` / `.render()` is called.

```ts
class FillHandle<Slots = Record<string, NodeData | string | number>> {
  constructor(public readonly source: string, public readonly slots: Slots) {}
  read(): NodeData     { return getActiveBackend().fillRead(this.source, this.slots); }
  render(): string     { return getActiveBackend().fillRender(this.source, this.slots); }
  $read(): NodeData    { return this.read(); }       // for $-prefix consistency
  $render(): string    { return this.render(); }
}
```

The crossing happens at `.read()` / `.render()`. The active backend (native vs JS-side, resolved at engine init) decides where the fill runs.

### 3.6 `template()` wrapper (per-grammar)

Inline-template entry. Per-grammar wrapper because the slot type parameter narrows to that grammar's union types when the user supplies one:

```ts
// packages/rust/template.ts (generated)
export function template<
  Slots extends Record<string, AnyNodeData | string | number> =
    Record<string, AnyNodeData | string | number>
>(source: string): { fill(slots: Slots): FillHandle<Slots> } {
  return {
    fill(slots: Slots): FillHandle<Slots> {
      return new FillHandle(source, slots);
    },
  };
}
```

Slot names extracted at the type level via TypeScript template literal types (see §4.2) so missing/extra keys are caught even in loose mode. Optional explicit type parameter narrows slot values:

```ts
// loose:
template('let $X = $Y;').fill({ X: ir.identifier('a'), Y: ir.integerLiteral('1') });

// strict (caller-supplied):
template<{ X: Identifier; Y: Expression }>('let $X = $Y;').fill({ X, Y });
```

### 3.7 Rust fill — `CompiledTemplate` + `TemplateBuilder`

`CompiledTemplate` holds the parsed template tree (sittir's `NodeData` shape with `_sittir_metavar` placeholders preserved) plus the `SlotMap`. Constructed once per template source via `compile(source, &template_language)`; cached by source hash (see §5).

```rust
pub struct CompiledTemplate {
    pub source_hash: u64,
    pub parsed: NodeData,           // sittir representation; metavars as Stub leaves
    pub slots: SlotMap,             // name → (parentKind, field, position)
}

impl CompiledTemplate {
    pub fn compile(source: &str, lang: &TemplateLanguage) -> Result<Self, CompileError> { ... }
    pub fn fill(&self, env: napi::Env, slots: &napi::JsObject) -> napi::Result<NodeData> {
        TemplateBuilder::new(&self.parsed, &self.slots).build(env, slots)
    }
}
```

`TemplateBuilder` walks `CompiledTemplate.parsed`, replaces each `_sittir_metavar` placeholder with the corresponding slot value (read from the napi object via the existing `FromNapiValue` impl on `NodeData`), and returns the assembled `NodeData`. No serialization; napi-direct on both ingress (slots in) and egress (NodeData out via `to_napi_object`).

### 3.8 TS-side fill

Mirror of the Rust fill in TypeScript, using tree-sitter's JS binding (already a dev dependency for codegen).

```ts
// @sittir/core/template/ts-fill.ts
class TsCompiledTemplate {
  constructor(
    public readonly sourceHash: number,
    public readonly parsed: AnyNodeData,
    public readonly slots: SlotMap,
  ) {}

  static compile(source: string, lang: TemplateLanguage): TsCompiledTemplate { ... }
  fill(slots: Record<string, AnyNodeData | string | number>): AnyNodeData { ... }
}
```

Same algorithm as Rust: parse via the bundled template-parser.wasm, walk for `_sittir_metavar`, splice slot values, return `NodeData`. Behavioral parity is the design contract (§6).

### 3.9 `template_read` / `template_render` napi

Per-grammar napi entry points exposed on `SittirEngine`:

```rust
#[napi]
impl SittirEngine {
    pub fn template_read(
        &mut self,
        env: napi::Env,
        source: String,
        slots: napi::JsObject,
    ) -> napi::Result<napi::JsObject> {
        let compiled = self.template_cache.get_or_compile(&source, &self.template_language)?;
        let node_data = compiled.fill(env, &slots)?;
        node_data.to_napi_object(env)
    }

    pub fn template_render(
        &mut self,
        env: napi::Env,
        source: String,
        slots: napi::JsObject,
    ) -> napi::Result<String> {
        let compiled = self.template_cache.get_or_compile(&source, &self.template_language)?;
        let node_data = compiled.fill(env, &slots)?;
        Ok(self.render_node_data(&node_data))
    }
}
```

Identical contract to `Engine::read` and `Engine::render` — single boundary crossing per call, napi-direct in and out, no JSON serialization.

### 3.10 Parity test harness

`packages/codegen/__tests__/template-parity/` holds versioned fixtures (see §6) and a runner that exercises both backends and asserts byte-equivalent `NodeData` serialization.

## 4. Data flows

### 4.1 Snippet path (typed, codegen-extracted)

```
1. Author:    packages/<lang>/snippets/greet.<lang>.template
                  ↓
2. Codegen:   slot extractor → SlotMap → snippets emitter → packages/<lang>/src/snippets.ts
                  ↓
3. Use:       import { snippets } from '@sittir/<lang>';
              const handle = snippets.greetFunction.fill({ NAME, PARAMS, RET, BODY });
                  ↓
4. Terminal:  handle.render() → string         (or handle.read() → NodeData)
                  ↓
5. Backend:   active fill (Rust or TS-side) → cache lookup → fill → result
```

Step 3 is fully typed: missing slot keys are TS errors; extra keys are TS errors; per-slot kinds are checked against `parentInterface[_fieldName]`.

### 4.2 Inline path (loose-default, optional type parameter)

```
1. Author:    template('let $X = $Y;')
                  ↓
2. Type:      slot names extracted at the TS type level via template literal types
              type SlotsOf<S> = ... // 'X' | 'Y' for the above
              FillHandle<{ X: ...; Y: ... }>
                  ↓
3. Use:       template('let $X = $Y;').fill({ X, Y })
                  // missing X or Y → TS error
                  // extra Z → TS error
                  // value types: loose by default; strict if explicit <{ X, Y }>
                  ↓
4. Terminal:  .render() → string
                  ↓
5. Backend:   active fill → cache lookup (LRU; compile if miss) → fill → result
```

Slot-name extraction at the type level — a sketch:

```ts
type SlotNames<S extends string> =
  S extends `${string}$${infer Name}${infer Rest}`
    ? Name extends `${infer Body} ${string}` ? Body | SlotNames<Rest> : Name | SlotNames<Rest>
    : never;
```

(Real implementation needs to handle `$...NAME`, terminal punctuation, and TS recursion limits. The principle is: the slot name set comes from the string literal at compile time, not from runtime parsing.)

## 5. Slot type derivation rules

For each `_sittir_metavar` extracted from a snippet template, the codegen derives the TS slot type from the metavar's grammar position:

| Position                                                | Derived slot type                                            |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| Field with single concrete kind (`field('name', $.identifier)`) | `ParentInterface['_name']`                          |
| Field with supertype (`field('expr', $._expression)`)           | `ParentInterface['_expr']` (already a union per the supertype) |
| Optional field (`optional(field('return_type', $.type))`)       | `NonNullable<ParentInterface['_return_type']>` (omit `undefined` — slot is the *value*, not the absence) |
| Repeat / repeat1 in field position                              | `NonNullable<ParentInterface['_<field>']>[number]` for single-slot variant; `NonNullable<ParentInterface['_<field>']>` for multi-slot (`$...NAME`) |
| Polymorph form position                                         | The polymorph union type (each form's NodeData) |
| Unnamed `$child` slot                                           | `ParentInterface['$child']` |
| Unnamed `$children` slot                                        | `NonNullable<ParentInterface['$children']>[number]` for single-slot; `NonNullable<ParentInterface['$children']>` for multi-slot |
| Inside a `choice(...)` branch (no field)                        | The union of the choice's reachable kinds at that position |

Two principles control the derivation:

- **Single-slot (`$NAME`)** = "one node at this position." The slot type is the **element** type of the position, regardless of whether the position is itself a list — putting one `Parameter` into a `repeat($.parameter)` position is valid.
- **Multi-slot (`$...PARAMS`)** = "the entire list of children at this position." The slot type is the **array** type. Multi-slot is only valid where the position is a `repeat` / `repeat1` / `$children`.

The codegen rejects multi-slot in non-list positions at codegen time with a clear message.

## 6. TS / Rust parity contract

### 6.1 Contract

Same template + same slot values → byte-equivalent `NodeData` from either backend. "Byte-equivalent" is defined by the project's existing `NodeData` serialization (the canonical JSON form used in validator round-trip tests).

### 6.2 Fixtures

A versioned corpus under `packages/codegen/__tests__/template-parity/fixtures/`:

```
fixtures/
  001-trivial-let-binding/
    template.rs.template
    slots.json
    expected.nodedata.json
  002-supertype-slot/
    ...
  003-repeat-multi-slot/
  004-polymorph-form-slot/
  005-nested-fill-composition/
  006-loose-coercion/
  007-leaf-text-coercion/
  008-optional-field-omit/
  009-unicode-slot-text/
  010-deeply-nested-template/
```

Each fixture contains the template source, the slot map (NodeData encoded as JSON), and the expected output `NodeData`. Categories chosen to cover every entry in the §5 derivation table plus edge cases (Unicode in slots, deeply nested templates, snippets composed of fills).

### 6.3 Harness

```
for fixture in fixtures/*:
    rust_out = sittir-core::compile(fixture.template).fill(fixture.slots)
    ts_out   = TsCompiledTemplate.compile(fixture.template).fill(fixture.slots)
    assert rust_out == fixture.expected
    assert ts_out  == fixture.expected
    assert rust_out == ts_out
```

Failure dumps both `NodeData`s side-by-side via the existing diff tooling (the same one used for round-trip regressions).

CI gate: parity suite green on every PR touching `@sittir/core/template/`, `sittir-core/template/`, or any `template-parity/fixtures/` change.

## 7. Caching

LRU per engine, capacity 256, keyed by `(language, sha256(template_source))`.

- **Snippets**: pre-compiled at codegen time, bundled into the package as part of `snippets.ts`. The `CompiledTemplate` for each snippet is loaded eagerly on first access; not subject to LRU eviction (their lifetime is the package's lifetime).
- **Inline templates**: compiled lazily on first `.fill()` of a given source; subject to LRU eviction. Compile cost is a single template-mode parse (~1ms for the templates we expect) — cheap to recompute on miss.

Engine-scoped cache (rather than process-global) bounds memory naturally: an engine instance corresponds to one consumer's working set.

Memory accounting per cache entry: parsed template tree + slot map. Estimated ~1–5 KB per entry. At capacity 256 → ~1 MB upper bound per engine. Acceptable.

No timer-based eviction; LRU only.

## 8. Per-grammar supertype scope

Default per-grammar set: `identifier`, `_expression`, `_statement`. Each grammar's `overrides.ts` `templateMode` block adds others as needed:

| Grammar    | Default set                                    | Likely additions      |
| ---------- | ---------------------------------------------- | --------------------- |
| Rust       | `identifier`, `_expression`, `_statement`      | `_type`, `_pattern`   |
| TypeScript | `identifier`, `_expression`, `_statement`      | `_type`               |
| Python     | `identifier`, `_expression`, `_statement`      | (none initially)      |

`identifier` covers all alias-of-identifier kinds (`type_identifier`, `field_identifier`, `scoped_type_identifier`, etc.) for free via tree-sitter's alias mechanism — overriding `identifier` makes the metavar valid at every position those aliases reach.

The supertype list is explicit per grammar, not auto-injected, because the choice of which positions admit metavars is an authoring decision that affects the parser's lookahead and (rarely) precedence. Hiding it in an automatic pass would surprise grammar maintainers when a metavar suddenly conflicts with a precedence rule (P-002, P-005).

## 9. Error reporting

### 9.1 Template parse errors

Template-mode parser produces `ERROR` nodes when the template source is malformed at the grammar level. Caught at template **compile** time:

- **Snippets**: codegen step fails with `Snippet '<name>' has parse errors at <line>:<col>: <fragment>`. Codegen exits non-zero; build fails. Includes the offending fragment with template-relative line/column.
- **Inline templates**: `template('...')` constructor throws `TemplateParseError` with template-relative span. Throws at the `template()` call, not at `.fill()` — so the failure is at definition time, not use time.

`ERROR` nodes that persist into the parsed template tree (any tree containing them) cause `compile()` to return `Err(CompileError::HasErrorNodes)` with the span of the first error. The build/runtime layer reformats this into the consumer-facing message.

### 9.2 Missing slots (template has `$X`, fill omits `X`)

Caught at TypeScript compile time via the slot-name extraction (template literal types for inline; codegen-emitted types for snippets). At runtime, both fills additionally validate: `Err(MissingSlot { name })` with the slot name. Missing slot is always an error — there is no "default value" semantics.

### 9.3 Extra slots (fill provides `$Y`, template has no `$Y`)

Caught at TypeScript compile time the same way. At runtime, both fills **silently ignore** extras (no error) — this is symmetric with how `Object.assign` handles unrecognized keys, and the TS layer is the one that's expected to catch this.

### 9.4 Slot type mismatches

Per the prior decision: not validated at fill time. TS catches what it can (snippet slots fully typed; inline slots typed when the user supplies `template<{...}>(...)`). Bad slot values surface at render time as malformed `NodeData` — the same failure mode any other invalid `NodeData` produces. Render-side malformed-tree handling lives in the existing render layer; this design adds no new render-time validation.

This intentionally keeps both fill backends simple. Slot-shape validation is a follow-up if real-world misuse warrants it.

### 9.5 Fill backend errors

Both backends propagate `compile()` and `fill()` failures with structured error types:

```ts
// @sittir/core/template/errors.ts
export class TemplateParseError  extends Error { template: string; line: number; column: number; fragment: string; }
export class MissingSlotError    extends Error { template: string; slotName: string; }
export class TemplateBackendError extends Error { backend: 'native' | 'js'; cause: unknown; }
```

Same shapes from both backends — the parity contract covers errors as well as success.

## 10. Composition with `.from()` and the rest of the surface

A `FillHandle.read()` produces a `NodeData`. That `NodeData` flows into every other surface unchanged:

- **As a slot for another fill / snippet**:
  ```ts
  snippets.implBlock.fill({
    TYPE: ir.typeIdentifier('Cache'),
    METHODS: snippets.pubMethod.fill({ NAME: ..., RET: ..., BODY: ... }).read(),
  }).render();
  ```
- **As a value for `.from()`**: `ir.functionItem.from({ body: template('...').fill({...}).read() })` works because the slot value is just `NodeData`.
- **As a target for `$with`**: `template('...').fill({...}).read().$with.name(ir.identifier('foo'))` works because the `NodeData` is frozen-by-construction.
- **As a target for `wrapNode` / typed query** (ADR-0023): a constructed-via-template `NodeData` accepts the cursor surface like any other `NodeData`.

`from()` looseness on snippets is just `fill()` with a `resolveSlots` pass that runs each slot value through the `.from()`-coercion path used by leaf factories. No new resolution machinery.

## 11. Testing strategy

| Test layer                | What                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Codegen unit tests        | Slot extractor: each row of the §5 table → expected `SlotMap` + expected slot type |
| Snippets emitter tests    | Generated `snippets.ts` shape: signatures, types, `from()` looseness               |
| Per-fill unit tests       | Parse errors, missing slots, cache hit/miss, LRU eviction                          |
| Parity suite              | Per §6: every fixture, both backends, byte-equivalent output                       |
| Per-grammar end-to-end    | One snippet per grammar: render byte-identical; round-trip parse → render         |
| Type-level tests          | Inline template literal-type slot extraction (`expectType<...>` via tsd / vitest type assertions) |

No render-time validation tests in this layer. Render correctness is the render layer's concern; this design's job is to produce a `NodeData` the render layer can handle.

## 12. Phased delivery

Each phase is independently shippable and adds verifiable behavior. Bracketed days are estimates including tests.

1. **Template-mode override + transpile chain extension** for one grammar (Rust). Verify: one template parses cleanly, no `ERROR` nodes, no production-parser regressions. [2 days]
2. **Slot extractor + snippets emitter**. Verify: `snippets.ts` generated for one snippet; types match expected. [2 days]
3. **Rust fill end-to-end**. Verify: one snippet → render byte-identical. [3 days]
4. **`FillHandle` + `template_read` / `template_render` napi wiring**. Verify: end-to-end from JS through napi. [1 day]
5. **TS-side fill + parity suite**. Verify: parity for the §6 fixture corpus. [3 days]
6. **Inline `template('...')` + LRU cache**. Verify: type-level slot-name extraction; LRU hit/miss behavior. [2 days]
7. **Roll out to TypeScript and Python grammars**. Per-grammar overrides + snippets + parity. [2 days each]

Total: ~17 days for full landing across three grammars.

A reduced MVP (Rust only, snippets only, no inline) is ~11 days and exercises every architectural seam — sufficient to validate the design before scaling out.

## 13. Open questions resolved

| Question (from ADR-0022 §Follow-ups)                                                | Resolution                                                                                              |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Whether `_sittir_metavar` should also be allowed inside `_pattern` / `_literal`     | Per-grammar choice in `overrides.ts`. Default minimum set is `identifier`/`_expression`/`_statement`; additions are explicit per grammar. |
| Caching strategy for inline `template('...')` calls                                 | LRU per engine, capacity 256, keyed by `(language, sha256(source))`. Snippets pre-compiled at codegen, eager-loaded.                       |
| Error reporting for slot value `$type` incompatible with parent rule at metavar     | Not validated at fill (per "strong types only, trust TypeScript"). TS catches what it can; bad slot values surface as render-time malformed tree. |

Two additional resolutions:

| Question                                                                | Resolution                                                                                                                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| TS-side fill: in scope for this design or deferred to ADR-0024?         | In scope. Both backends specified together; parity contract enforced by fixture corpus from day one.                         |
| Inline template typing: loose-default vs build-time vs always-loose?     | Loose default + optional type parameter. Slot names extracted at the TS type level; slot values typed by user override only. |

## 14. Non-goals (explicit)

- Pattern matching over source. Templates construct; queries (ADR-0023) match. The two compose via `cursor.$read()` → `fill({slot: cursor.$read()})`.
- Build-time codegen for inline templates. The loose-default + opt-in type parameter is the API; a build-time pass is a future option, not part of this design.
- In-template slot kind narrowing (`$NAME<Identifier>`). Would break "templates look like the target language" and adds a sittir-specific mini-syntax.
- Fill-time slot value validation. TS is the validation layer; runtime malformed-tree tolerance is the render layer's concern.
- Render-pipeline changes. `FillHandle.render()` calls the existing render path on the assembled `NodeData`; no new render code.
- Multi-grammar templates (a template containing slots that resolve to nodes from different grammars). Each template lives in one grammar's namespace; cross-grammar work is a higher-level pipeline concern (e.g., `docs/use-cases-and-examples.md` §12).

## 15. Risks and mitigations

| Risk                                                                        | Mitigation                                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Template-mode parser conflicts with production parser's precedence/lookahead | High `prec(10)` on `_sittir_metavar`; per-grammar verification step in CI parses a canary corpus in both modes |
| Slot type derivation misses an edge case in §5 not in the fixture corpus    | Add fixture; the parity suite is the canary. Type-level tests catch derivation regressions in `snippets.ts`. |
| Two fills drift in subtle ways (e.g., whitespace handling)                  | Parity fixture corpus runs on every PR touching either backend                                          |
| LRU cache thrashing on workloads with many unique inline templates          | Capacity tunable per engine; metric for cache hit rate exposed via `getActiveBackend()`                 |
| Bootstrap fragility once ADR-0024 (codegen dogfooding) lands                | Keep prior-generation packages pinned during cycle; landed templates and TS fill are bundled, not regenerated mid-cycle |

## 16. Open follow-ups (tracked, not blocking)

- Build-time inline-template extraction as an opt-in toolchain (would tighten inline typing further; orthogonal to this design).
- Slot-shape runtime validation if real-world misuse warrants it (additive; doesn't change the fill contract).
- Multi-language template corpus shared across grammars for benchmarking parity-suite size.
- Decide whether `template('...')` should accept a backend hint (`{ backend: 'js' }`) for testing, or stay engine-default.

---

## Appendix — Public API shapes

```ts
// @sittir/core/template/fill-handle.ts
export class FillHandle<Slots = Record<string, AnyNodeData | string | number>> {
  constructor(public readonly source: string, public readonly slots: Slots);
  read(): AnyNodeData;
  render(): string;
  $read(): AnyNodeData;
  $render(): string;
}

// per-grammar generated:
export interface SnippetEntry<StrictSlots, LooseSlots> {
  fill(slots: StrictSlots): FillHandle<StrictSlots>;
  from(slots: LooseSlots):  FillHandle<StrictSlots>;
}

export const snippets: {
  greetFunction: SnippetEntry<GreetFunctionStrict, GreetFunctionLoose>;
  // ... one per .template file
};

export function template<
  Slots extends Record<string, AnyNodeData | string | number> =
    Record<string, AnyNodeData | string | number>
>(source: string): { fill(slots: Slots): FillHandle<Slots> };

// errors
export class TemplateParseError   extends Error { template: string; line: number; column: number; fragment: string; }
export class MissingSlotError     extends Error { template: string; slotName: string; }
export class TemplateBackendError extends Error { backend: 'native' | 'js'; cause: unknown; }
```
