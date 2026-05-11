# ADR 0022 — Construction Templates

**Status**: Proposed
**Date**: 2026-05-10
**Related**: ADR-0001 (tree-sitter-compatible overrides), ADR-0005 (transpile overrides to grammar.js), ADR-0018 (de-hoisted NodeData surface), `docs/use-cases-and-examples.md` §4–§6 §11

## Context

Today's construction surface has two entry points:

- **Per-kind factories** — `ir.functionItem.from({ name: 'main', ... })`. Composable, typed, but verbose for anything more than a few fields. Building a multi-statement function body via factories alone is a wall of nested calls.
- **Render-only result** — `node.$render()` returns source text. There is no path from "I want to construct *this* shape and it's easier to write the shape in the target language than as nested factory calls" back to a typed `NodeData`.

`docs/use-cases-and-examples.md` documents the missing surface in §4–§6 and §11 as a pending API: `template('let $NAME: $TYPE = $VALUE;')`, `snippets.implDisplay.fill({ TYPE, EXPR })`, plus composition where one template's `.read()` output feeds another's `fill()`. Stub example files (`examples/04-precompiled-templates.ts`, `examples/05-inline-templates.ts`) exist but are unimplemented. Render templates (`.jinja`) cover `NodeData → source`; *construction templates* are the missing direction: source-with-slots → `NodeData` (or rendered source).

The surface is well-precedented — semgrep, ast-grep, and Comby all use `$NAME` / `$...REST` metavariables for source patterns — and `.from()` already does the structural-validity work for individual fields. What's missing is the parsing strategy that takes a templated string and produces a clean parse tree without `ERROR` nodes or text preprocessing.

## Forcing Constraint

_TBD_

## Alternatives Considered

- **Preprocess template source before parsing.** Substitute placeholder text (e.g., `__SLOT_NAME__`) for `$NAME`, parse with the production parser, then walk the tree replacing the placeholders with their slot values. *Rejected:* the placeholder must be valid in every context the slot can appear in (identifier, expression, statement, type) — there is no single string that is. Picks up `ERROR` nodes wherever the choice is wrong. Defeats the structural-validity claim because the parser is being lied to.
- **Separate template DSL parser.** Author templates in a sittir-specific syntax with its own grammar (slot-aware), then translate to NodeData. *Rejected:* doubles the surface area users must learn, breaks the "templates look like the target language" affordance, and re-implements parsing logic that tree-sitter already provides.
- **String concatenation / `printf`-style.** `format(\`pub fn ${name}() { ${body} }\`)` returning a string. *Rejected:* loses both layers of validity. Structural shape isn't enforced; the template's slot positions aren't checked against the grammar; no `NodeData` for downstream composition.
- **Reuse the production parser with `ERROR` recovery.** Parse `pub fn $NAME()` and accept the `ERROR` node where `$NAME` lands, then patch. *Rejected:* `ERROR` recovery in tree-sitter is intentionally lossy — node spans, surrounding context, and downstream parse states aren't reliable. Doesn't compose.

## Decision

Compile a **template-mode parser per grammar** through the existing override pipeline. The override injects a metavariable rule and joins it into the language's nominal-position rules; the same `transpile → tree-sitter generate → compile-parser` chain that produces the production parser produces the template-mode parser as a sibling artifact.

### Syntax

Semgrep-compatible:

| Syntax        | Meaning                          | Example                |
| ------------- | -------------------------------- | ---------------------- |
| `$NAME`       | Single slot — one node           | `fn $NAME()`           |
| `$...PARAMS`  | Multi slot — sequence of nodes   | `fn foo($...PARAMS)`   |

Templates can be authored inline (`template('...')`) or as files (`snippets/<name>.<lang>.template`).

### Grammar patch

```ts
// One rule for the metavariable token itself.
_sittir_metavar: $ => token(prec(10, /\$(\.\.\.)?[A-Z][A-Z0-9_]*/)),

// One override per supertype-or-nominal-rule the metavar should be valid in.
// `identifier` covers all alias-of-identifier kinds (type_identifier,
// field_identifier, etc.) automatically — tree-sitter's alias mechanism
// re-uses identifier's parser at every alias call site, so the metavar
// reaches them for free without per-alias overrides.
identifier:   ($, original) => choice(prec(10, $._sittir_metavar), original),
_expression:  ($, original) => choice(prec(10, $._sittir_metavar), original),
_statement:   ($, original) => choice(prec(10, $._sittir_metavar), original),
_type:        ($, original) => choice(prec(10, $._sittir_metavar), original),
```

The number of supertype overrides scales with how many positions the
template surface should support. A minimum useful set is identifier +
expression + statement; type-position metavars and any per-grammar nominal
rules that aren't aliases of identifier (e.g., `scoped_identifier` in
Rust) are added as needed. Realistic per-grammar size: 4–8 lines for
Rust/TypeScript, 2–3 lines for Python (where `identifier` is the dominant
nominal rule).

### Runtime API

```ts
const node = snippets.greetFunction
    .fill({ NAME: identifierNode, BODY: blockNode })
    .read();    // → NodeData (one boundary crossing)

const source = snippets.greetFunction
    .fill({ NAME: identifierNode, BODY: blockNode })
    .render();  // → string (one boundary crossing)
```

`fill()` is lazy — it captures `(template source, slot map)` and returns a
`FillHandle`. The boundary crossing happens at terminal `.read()` /
`.render()`. Slot inputs accept either a `NodeData` directly (`fill()`)
or a coercible value resolving via `.from()` (`from()`). Slot types are
generated; see *Slot type derivation* below.

### Codegen

For each `snippets/*.<lang>.template` file (and at runtime for inline
`template('...')` calls):

1. Parse the template with the grammar's template-mode parser.
2. Walk the parse tree; for each `_sittir_metavar`:
   - `name` = text after `$` (or `$...`)
   - `parentKind` = enclosing node's kind
   - `fieldName` = the field the metavar occupies (if any)
   - `multi` = `true` when the text contains `...`
3. Derive each slot's TS type from the parent kind's storage:
   `ParentInterface['_fieldName']` (or the unnamed-slot `$child` /
   `$children` storage when no field name applies). This is the same
   storage type the factory's `Config` accepts — slot validity matches
   factory validity by construction.

Generated `snippets.ts` per grammar:

```ts
const GREET_FUNCTION = `pub fn $NAME($...PARAMS) -> $RET {\n    $BODY\n}`;

export const snippets = {
  greetFunction: {
    fill(slots: {
      NAME: FunctionItem['_name'],
      PARAMS: NonNullable<Parameters['$children']>[number][],
      RET: NonNullable<FunctionItem['_return_type']>,
      BODY: FunctionItem['_body'],
    }): FillHandle {
      return new FillHandle(GREET_FUNCTION, slots);
    },

    from(slots: {
      NAME: string | FunctionItem['_name'],
      PARAMS: (string | NonNullable<Parameters['$children']>[number])[],
      RET: string | NonNullable<FunctionItem['_return_type']>,
      BODY: FunctionItem['_body'],
    }): FillHandle {
      return new FillHandle(GREET_FUNCTION, resolveSlots(slots));
    },
  },
} as const;
```

### Rust side

```rust
impl<G: EngineGrammar> Engine<G> {
    pub fn template_read(
        &mut self,
        env: napi::Env,
        source: String,
        slots: napi::JsObject,
    ) -> napi::Result<napi::JsObject> {
        let compiled = self.template_cache
            .entry(hash(&source))
            .or_insert_with(|| CompiledTemplate::compile(&source, &self.template_language));
        let node_data = compiled.fill(env, &slots)?;
        // Return a structured NodeData object via napi direct — same
        // boundary contract as Engine::read. No serde_json round-trip.
        node_data.to_napi_object(env)
    }

    pub fn template_render(
        &mut self,
        env: napi::Env,
        source: String,
        slots: napi::JsObject,
    ) -> napi::Result<String> {
        let compiled = self.template_cache
            .entry(hash(&source))
            .or_insert_with(|| CompiledTemplate::compile(&source, &self.template_language));
        let node_data = compiled.fill(env, &slots)?;
        Ok(self.render_node_data(&node_data))
    }
}
```

`CompiledTemplate` is the template-mode parse plus the captured slot
positions; reused on cache hit. `template_read` matches `read`'s napi
contract exactly — slots cross the boundary as structured objects, the
result returns as a structured object. No JSON serialization on either
direction.

### Effort

| Component                              | Lines | Where                       |
| -------------------------------------- | ----: | --------------------------- |
| Template-mode grammar overrides        |   4–8 | per `packages/<lang>/overrides.ts` |
| Slot extractor + `snippets.ts` emitter |  ~250 | `@sittir/codegen`           |
| `FillHandle` class                     |   ~20 | `@sittir/core`              |
| `CompiledTemplate` + `TemplateBuilder` |  ~200 | `sittir-core` (Rust)        |
| `template_read` + `template_render`    |   ~40 | `sittir-{lang}` (Rust)      |
| `template()` TS wrapper                |   ~20 | `@sittir/{lang}`            |

Total: ~530 lines + 4–8 lines of grammar overrides per language (one
identifier override propagates to alias kinds for free; supertype
overrides scale with the positions templates should support).

## Principles Applied

- **P-001 — External contract first.** Tree-sitter's grammar is the
  parser; templates are made parseable by extending the grammar via the
  same DSL the production parser already uses, not by preprocessing
  source or building a sidecar parser.
- **P-003 — Reuse existing structure.** The template-mode parser is
  produced by the existing `transpile → tree-sitter generate →
  compile-parser` chain. Slot types reuse the existing `_fieldName`
  storage types from the generated `types.ts`. Generated `NodeData` from
  `fill()` is the same shape factories produce, so it composes with
  every other surface (`$with`, `$render`, `wrapNode`, edits) without
  new code paths.
- **P-005 — Single source of truth.** Slot types come from the storage
  type the factory already exposes; there is no template-side schema to
  drift against the grammar.
- **P-008 — Composition over configuration.** Templates are ordinary
  function calls (`fill`, `from`, `read`, `render`); no template
  preprocessor, no flag matrix, no separate DSL.

## Consequences

- **Enables**:
  - Authoring replacement source in the target language with typed slot
    holes — closes the §4–§6 §11 gap in the use-cases doc.
  - Composition with the rest of the surface: `fill().read()` returns a
    `NodeData` that flows into `$with`, factories, edits, other
    templates' slots.
  - One-crossing terminal operations (`.read()` / `.render()`) on the
    napi boundary, matching `read`'s contract.
  - Identifier-aliased nominal rules (`type_identifier`,
    `field_identifier`, `scoped_type_identifier`, …) inherit metavar
    support from a single `identifier` override via tree-sitter's alias
    mechanism — no per-alias maintenance.
- **Costs**:
  - Each grammar package now ships a second compiled parser (template
    mode). Bundle size grows by roughly the size of one `parser.wasm`.
  - The override pipeline now produces two grammar artifacts instead of
    one; `transpile-overrides` and the codegen CLI both grow a
    template-mode branch.
  - Per-grammar overrides need to be authored thoughtfully — supertype
    injection is where the per-language work lives, and choosing which
    positions to expose is a grammar-level design decision.
- **Follow-ups**:
  - Decide whether `_sittir_metavar` should also be allowed inside
    `_pattern` / `_literal` supertypes for grammars that have them
    (Rust pattern matching, TypeScript literal types).
  - Decide caching strategy for inline `template('...')` calls — same
    `CompiledTemplate` LRU as snippets, or per-call?
  - Specify error reporting when a slot value's `$type` is incompatible
    with the parent rule at the metavar's position (caught at fill, not
    render).

## Verification

If the per-grammar override count balloons past ~15 lines, or if
template-mode parsing produces `ERROR` nodes for templates that "look
right" in the target language, the alias-propagation assumption is
wrong and we need a transparent injection mechanism (e.g., enrich-time
pass that adds `_sittir_metavar` to every relevant rule's choice
automatically). Signal: a per-grammar `overrides.ts` whose template-mode
section is comparable in size to the rest of the file.

If `template_read`'s napi contract drifts from `read`'s — a separate
serialization path, a separate object shape, separate error semantics —
we have re-introduced a boundary inconsistency that ADR-0018's
napi-direct contract was meant to eliminate. Signal: differing helper
functions or differing object schemas on the TS side for "got a NodeData
back" depending on whether it came from `read` or `template_read`.
