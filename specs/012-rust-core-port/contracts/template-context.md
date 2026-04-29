# Contract — TemplateContext

**Shared between engines.** Both the Rust render engine (`sittir-core::prepare`) and the TypeScript render engine (`packages/core/src/render.ts`) build values of this shape. On the Rust side, `TemplateContext` is the input to a dispatcher that constructs the appropriate per-kind askama struct and calls its `.render()` method. On the TS side it is fed directly to Nunjucks. The shape is identical on both sides — any drift breaks render parity (FR-002a).

---

## Shape

```ts
interface TemplateContext {
	/** Pre-rendered string value for each field, keyed by raw (snake_case) field name. */
	fields: Record<string, string>;

	/** Pre-rendered children, joined with per-node separator. Convenience for `{{ children }}`. */
	children: string;

	/** Per-child rendered strings. Used for `{% for c in children_list %}` loops. */
	children_list: string[];

	/** Variant label (empty string if not a variant-branching kind). */
	variant: string;

	/** Leaf text (empty string for branch nodes). */
	text: string;

	/** Trailing separator flag for list positions — per spec 011 joinBy semantics. */
	trailing_sep: boolean;

	/** Leading separator flag. */
	leading_sep: boolean;
}
```

### Rust representation

```rust
pub struct TemplateContext {
    pub fields: HashMap<String, String>,
    pub children: String,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}
```

### askama adaptation

Askama compiles each `.jinja` file into a typed `Display` impl at `cargo build` time. Each template is backed by a codegen-emitted `#[derive(Template)]` struct whose fields match the template's referenced variables. Codegen emits **one struct per kind** in `packages/{lang}/rust-render/src/templates.rs`, with typed fields for that kind's raw grammar field names plus the shared positional fields (`children`, `children_list`, `variant`, `text`, `trailing_sep`, `leading_sep`). A top-level `render_dispatch(kind: &str, ctx: &TemplateContext) -> Result<String, askama::Error>` matches on the kind and constructs the appropriate per-kind struct from `TemplateContext`. See plan.md Complexity Tracking for why per-kind structs are justified here (FR-008 build-time validation mandate).

---

## Construction

`TemplateContext` is built by the render pipeline — **templates never construct it** and **consumers never construct it directly**. The construction paths:

1. `render(nodeData)` — the engine walks `nodeData`, recursively renders each field and child (producing their own `TemplateContext` and dispatching to the child kind's template), concatenates results into the parent's `fields` / `children` / `children_list`.
2. `variant` is populated when the parent kind is one of the three variant-branching exception rules (per FR-011), determined from `nodeData.$variant` (TS-enriched input) or, for Rust-internal factory construction, from the kind-specific dispatch logic. Empty string otherwise.
3. `text` is populated for leaf kinds from `nodeData.$text`. Empty for branch nodes.
4. `trailing_sep` / `leading_sep` are driven by the `joinby` filter and per-kind separator metadata emitted by codegen.

---

## Invariants

1. **All values are strings or booleans on the wire to the template** — never raw NodeData objects. The engine pre-renders nested values first, then populates `TemplateContext`.
2. **`fields` keys are raw (snake_case)** — matching the wire-format contract. Templates use the same casing.
3. **`children_list.join(separator)` does NOT always equal `children`**, because `children` may incorporate per-position separators (from the `joinby` filter / spec-011 semantics) that a naive join would miss. Templates that need structural access use `children_list`; templates that just want the rendered block use `children`.
4. **`variant == ""` is the default**, not `null` or missing. Templates can write `{% if variant == "pub_crate" %}` without null-handling.
5. **Rust and TS constructions must produce the same TemplateContext** for the same input NodeData. This is the load-bearing parity invariant for FR-002a; the parity fixture suite exercises it.

---

## Filters

Both engines expose the same named filters. Aliases are defined where the engines' built-ins differ.

| Filter             | Purpose                                                        | askama (Rust)                                                                            | Nunjucks (TS)                              |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| `upper`            | Uppercase                                                      | custom filter function (alias for askama's `uppercase`) in `sittir_core::filters::upper` | built-in                                   |
| `lower`            | Lowercase                                                      | custom filter function (alias for askama's `lowercase`) in `sittir_core::filters::lower` | built-in                                   |
| `join(sep)`        | Join list with separator                                       | built-in                                                                                 | built-in                                   |
| `length`           | List/string length                                             | built-in (`length`)                                                                      | built-in                                   |
| `default(v)`       | Default value when falsy                                       | built-in                                                                                 | built-in                                   |
| `trim`             | Whitespace strip                                               | built-in                                                                                 | built-in                                   |
| `joinby(sep, ...)` | Spec-011 separator semantics (leading/trailing/position-aware) | custom filter — hand-written in `sittir-core::filters`                                   | custom filter — existing in `@sittir/core` |

The `joinby` filter is load-bearing for sittir's rendering of list positions and must be behaviorally identical between engines. Its Rust implementation is a port of the TS implementation's logic (not the template engine's built-in), tested against fixture inputs in the shared parity suite.

**Askama filter registration is compile-time, not runtime.** Custom filters are declared as functions in a module (`sittir_core::filters`) that each `#[derive(Template)]` struct can reference via `#[template(escape = "none")]` conventions. No per-engine init — the filters are part of the type system. Filter implementations are hand-written in `sittir-core::filters` (shared across grammars) — they are not grammar-specific.

---

## Non-goals

- No template inheritance (`{% extends %}`) in MVP. All templates are standalone.
- No macros (`{% macro %}`) in MVP. If shared snippets emerge, they go in filters or helper functions, not macro definitions.
- No includes (`{% include %}`) in MVP. Templates are one-file-per-kind; dispatch into child templates happens in the engine's render loop, not in the template language.

These restrictions keep the intersection-of-Nunjucks-and-askama surface area small and make parity testing tractable.
