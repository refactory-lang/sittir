# Renderable Native Views Design

## Problem

ADR-0015 fixed **where native render-slot truth comes from**: the Rust Askama
surface is model-driven through a walker-owned render contract, not through
template-body scans or an exploded `foo + foo_list + foo_*_sep` bundle.

The next design question is the **value boundary**:

1. the current JS→Rust boundary still behaves like an erased runtime shape
2. the current native view layer is still fundamentally string-backed

That leaves two costs in place:

- Rust pays for a generic object shape even though the JS side already knows the
  exact per-kind type it is sending.
- join/filter composition happens after values have already been flattened to
  text.

The design goal is to make the end-state native path:

- typed at the JS→Rust boundary
- renderable at the view/filter boundary
- still governed by ADR-0015 for slot truth and struct shape

## Scope

This design finalizes the **end-state architecture** for:

- plain JS objects over N-API as the transport medium
- transport objects mirroring the generated per-kind TypeScript interfaces in
  **data-only** form
- matching generated Rust transport structs/enums
- renderable-native `FieldView` / `ListView`
- streaming join/filter wrappers on Askama's public extension surface

## Non-goals

- no custom binary codec in this design
- no JSON text serialization
- no change to ADR-0015's walker/model ownership of slot truth
- no commitment to trait-object-everywhere renderables

## Recommended Architecture

### 1. Typed JS → Rust transport

The transport medium is **plain JS objects over N-API**.

The transport shape mirrors the **current generated per-kind TypeScript
interfaces**, but strips methods/helpers so the transport is data-only.

That means:

- no generic runtime envelope like `{$type, $fields, ...}` on the wire
- child fields keep their existing generated union structure
- the JS side does not serialize to JSON text first

Example:

```ts
type CallExpressionTransport = {
  $type: 'call_expression';
  function: ExpressionTransport;
  arguments?: readonly ExpressionTransport[];
};
```

### 2. Matching generated Rust transport types

Rust receives those plain objects directly through N-API and decodes them into
matching generated per-kind transport structs/enums.

Example:

```rust
pub struct CallExpressionTransport {
    pub function: ExpressionTransport,
    pub arguments: Option<Vec<ExpressionTransport>>,
}
```

Typed projection therefore happens **before** the view/render layer, not after
an erased `NodeData` decode.

### 3. Generated bridge: `from_transport(...)`

Each generated Askama template struct gets a generated bridge from the transport
type to the view type.

The bridge is responsible for:

- mapping typed transport fields to `FieldView` / `ListView`
- deciding whether a slot stays structured or short-circuits to final text
- preserving ADR-0015's slot contract (`children`, `variant`, `text`,
  optionality, scalar/list/field shape)

Example:

```rust
impl<'a> CallExpressionTemplate<'a> {
    pub fn from_transport(node: &'a CallExpressionTransport) -> Result<Self, askama::Error> {
        Ok(Self {
            function: FieldView::One(Renderable::Expr(ExpressionRef::new(&node.function))),
            arguments: ListView::from_exprs(node.arguments.as_deref().unwrap_or(&[]), ", "),
        })
    }
}
```

### 4. Closed renderable family

The Askama-facing value model is a **small closed renderable family**, not open
trait objects at the public boundary.

Initial shape:

```rust
pub enum Renderable<'a> {
    Text(&'a str),
    Expr(ExpressionRef<'a>),
    Item(ItemRef<'a>),
    Joined(Joined<'a>),
}
```

The exact wrappers may differ by grammar grouping, but the design rule is:

- keep the family **closed and explicit**
- add new variants only for real composition cases
- do not use trait objects as the default boundary shape

### 5. `FieldView` / `ListView`

`FieldView` and `ListView` now carry renderables rather than only strings.

```rust
pub enum FieldView<'a> {
    Missing,
    One(Renderable<'a>),
    Many(ListView<'a>),
}

pub struct ListView<'a> {
    pub items: &'a [Renderable<'a>],
    pub separator: &'a str,
    pub leading: bool,
    pub trailing: bool,
}
```

This preserves ADR-0015's scalar/list/field distinction while moving value
composition to the renderable side of the boundary.

### 6. Render-ready text short-circuit

Any slot may short-circuit to `Renderable::Text(...)` when it is already
**final render-ready text**.

This is not limited to leaves. It includes:

- literal/parser-owned text that should pass through unchanged
- plain textual fields that never need subtemplate dispatch
- pre-rendered fragments produced earlier in the pipeline

So the rule is:

> If a slot is already semantically final text, keep it as text. Only wrap when
> the slot still needs structured rendering.

### 7. Streaming filters

Join-style filters stop returning `String` and return renderable wrappers that
Askama can write directly through its public surface.

Target public surface only:

- `FastWritable`
- `Display`
- `Safe<T>` / `MaybeSafe<T>`

Avoid:

- `WriteWritable`
- `AutoEscape`
- any other Askama-internal extension point

Conceptual shape:

```rust
#[askama::filter_fn]
pub fn joinby<'a>(
    xs: &'a ListView<'a>,
    _values: &dyn askama::Values,
    sep: &str,
    leading: bool,
    trailing: bool,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    Ok(askama::filters::Safe(Joined::new(xs, sep, leading, trailing)))
}
```

## End-to-end Example

Canonical template:

```jinja
{{ function }}({{ arguments | joinby(", ", false, false) }})
```

Transport:

```ts
type CallExpressionTransport = {
  $type: 'call_expression';
  function: ExpressionTransport;
  arguments?: readonly ExpressionTransport[];
};
```

Rust decode target:

```rust
pub struct CallExpressionTransport {
    pub function: ExpressionTransport,
    pub arguments: Option<Vec<ExpressionTransport>>,
}
```

Generated bridge:

```rust
impl<'a> CallExpressionTemplate<'a> {
    pub fn from_transport(node: &'a CallExpressionTransport) -> Result<Self, askama::Error> {
        Ok(Self {
            function: FieldView::One(Renderable::Expr(ExpressionRef::new(&node.function))),
            arguments: ListView::from_exprs(node.arguments.as_deref().unwrap_or(&[]), ", "),
        })
    }
}
```

Render:

```rust
pub fn render_call_expression(node: &CallExpressionTransport) -> Result<String, askama::Error> {
    let template = CallExpressionTemplate::from_transport(node)?;
    template.render()
}
```

## Invariants

1. **Typed projection happens before JS → Rust**
   - transport mirrors generated per-kind TS data interfaces
   - Rust decodes directly into matching generated transport types

2. **Slot truth stays with ADR-0015**
   - walker/model decides which slots exist and how they are shaped
   - this design does not move slot discovery into templates or filters

3. **Value rendering is separate from slot discovery**
   - the transport bridge decides whether a slot becomes final text or remains
     structurally renderable

4. **Public Askama surface only**
   - no design dependency on unstable Askama internals

## Error Handling

- If a slot that should remain structurally renderable is collapsed too early to
  text, composition is lost and bugs can be hidden.
- If a slot that is already final text is wrapped unnecessarily, correctness is
  preserved but complexity/overhead increases.

So the bridge rule should bias toward:

> preserve structure until the slot is known to be final render-ready text

Bridges should return explicit errors when a required typed field is missing or
when a transport variant cannot be converted into the expected renderable family.

## Testing and Verification

The design is correct if all of the following can be demonstrated:

1. JS transport objects match the existing generated per-kind TS data
   interfaces.
2. Rust decodes them without a generic `NodeData` /
   `HashMap<String, FieldValue>` layer.
3. Generated `from_transport(...)` builds Askama templates and `FieldView` /
   `ListView` directly.
4. `joinby` returns a streaming wrapper rather than `String`.
5. Mixed slots/lists can contain both final render-ready text and structured
   renderables.
6. Corpus output remains byte-identical across JS and native renderers.

## Open Questions Deliberately Left Out

These are implementation choices, not architecture decisions for this design:

- exact Rust naming for transport/view helper types
- whether specific renderable variants are grouped by grammar supertype or by a
  smaller shared wrapper family
- whether the first implementation uses borrowed slices, small vectors, or other
  internal storage refinements

Those belong in the implementation plan, not in the architectural design.
