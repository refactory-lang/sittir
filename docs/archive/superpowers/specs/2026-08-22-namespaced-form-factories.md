# Namespaced Form Factories — Hiding Form Kinds in the Factory API

**Status:** Realized (design settled 2026-08-22; landed ahead of the
determined-slots spec — see "Realization notes")

## Problem

Form extraction gives a construct like `for_header` several kinds
(`_for_header_var_kind`, `_for_header_let_const_kind`) and `binary_expression`
an extracted arm (`_binary_expression_arm` for `in`). Those kinds are
correct in **storage** — each carries a structurally distinct slot set — but
they are ceremony on the **factory surface**: a caller must know the form's
name and build it before handing it to the parent
(`buildForHeader(buildForHeaderVarKind({ left, ... }))`). The form kinds are a
compiler artifact; the user-facing construct is the parent.

## Design

**A namespaced constructor is a parent constructor.** For a kind whose sole
top-level slot is a choice of concrete kinds (today: registered polymorph
variants; expanded to any kind of that shape), the parent factory carries
one constructor per form, named by the form's variant name, taking the
form's own parameters and **returning the parent node** with its choice slot
filled by the built form:

```ts
forHeader.var(left, init?)        // builds _for_header_var_kind, returns for_header
withClause.bare(...items)         // form is a separated list: spread surface
structItem.brace(...)             // per-form parameters, parent returned
```

Storage is unchanged: parent node → form node → the form's slots. Only the
parameter surface flattens. The form's own factory remains (storage, `from()`,
and the generic `buildForHeader(formNode)` path all stay).

**Enum-member constructors.** A kind whose discriminating slot is a kind-enum
exposes one constructor per member, fixing that slot by method name; the
remaining slots become its parameters in slot order:

```ts
binaryExpression.plus(left, right)   // operator fixed to '+'
binaryExpression.in(left, right)     // the extracted `in` arm — a form, same surface
```

Form constructors and enum-member constructors are one mechanism seen from
two cardinalities: a form fixes a *kind* in the choice slot; an enum member
fixes a *value* in an enum slot. (A determined slot — cardinality 1 — is the
degenerate case and needs no constructor at all: see the determined-slots
spec.)

**Sub-constructors flatten upward.** When a form's own discriminator is an
enum (the let/const form's `kind`), its member constructors are hoisted into
the parent's namespace beside the sibling forms, so the caller never sees
the intermediate kind:

```ts
forHeader.var(...)      // from the var form
forHeader.let(...)      // from the let/const form's `kind` enum
forHeader.const(...)    // from the let/const form's `kind` enum
// forHeaderLetConstKind.let(...) / .const(...) still exist on the form's factory
```

Flattening is recursive (a sub-form's sub-form constructors surface on the
top parent) and stops at the first ambiguity: if two paths would claim the
same constructor name on the parent, neither is hoisted and the diagnostic
names both — never a silent first-wins.

**Interplay with hoisting.** The constructor's parameters are the form's
factory parameters under the factory-shape rules: a spread-shaped form gives
`parent.form(...elements)`, a direct-shaped form gives `parent.form(value)`,
a config-shaped form gives `parent.form(config)`. Parameters of the parent
= parameters of the chosen child; the parent build invokes the child build
and stores the node.

**Naming.** Constructor names are the variant / enum-member names as
authored (`var`, `let`, `const`, `in`, `bare`, `brace`). Property access
tolerates reserved words (`forHeader.const(...)` is valid), so no mangling;
a name that is not a valid identifier (an operator member such as `+`)
takes the member's declared display name (`plus`) — the same naming the
enum's own member vocabulary already uses.

**Scope of "the shape".** Eligible parents are kinds whose sole top-level
user slot is a choice whose values are all concrete kinds. Registered
polymorph variants are the initial population; the rule is structural, so
any kind of that shape qualifies without registration. Supertypes are not
parents here (they are dispatch unions with no node of their own).

## Consequences

- The generated factory object for an eligible parent is a function with
  properties (`buildForHeader` callable as before; `buildForHeader.var`
  etc. attached); the fluent `ir` map exposes the same namespace
  (`ir.forHeader.var(...)`).
- `from()`, wrap, transport, render, and the validator are untouched —
  no wire change. Factory-render-parse gains fixtures through the
  namespaced constructors so the flattened surface is exercised.
- Form kinds stop being something a caller must name; together with the
  three-way split-justification test (structural delta ⇒ kind; literal-only
  delta ⇒ enum slot; permutable modifiers ⇒ bitflag slot) this is where
  ceremony promotions such as the `public_field_definition_*` quintet are
  either retracted or hidden.

## Gates

No wire change: floors and baseline byte-identical; suite green; the
generated api-surface snapshots change by addition only (new properties on
existing factories); a namespaced-constructor round-trip probe per eligible
parent in each grammar (render → reparse → AST match) alongside the
direct-construction path.

## Realization notes

- The derivation is one module (`namespacedConstructors`, emitters); the
  factory, `ir`, node-model (`namespacedConstructors` per node) and
  generated-test emitters consume it. A parent's factory is exported as
  `export const buildX = attachProps(buildX$impl, {...})`; `ir.x.<name>`
  carries the same entries.
- Eligibility is structural: the sole user slot holding ≥2 concrete kinds
  with factories, **or** a slot holding only the parent's own arms
  (registered polymorph forms, or kinds minted under the parent's name)
  beside siblings that are all optional — the arm is a complete
  alternative, so the parent builds from it alone.
- A form constructor declares its child's own calling convention
  (`constructorSurface`, the factory signature derivation), following a
  forwarding factory through to its target: a list-backed form is
  `parent.form(...elements)`.
- Minted arms are named by their suffix (`exportStatement.typeExport`,
  `binaryExpression.arm`); a registered form by its variant name. The
  `binaryExpression.in` spelling arrives with determined slots, which fold
  a literal-only arm into the parent's enum.
- A member constructor's parameters follow slot order; once a parameter is
  optional every later one must be too, so a required slot after an
  optional one is typed `| undefined` instead. A kind-enum member is passed
  as its kind discriminant (the strict Config surface).
- Realized population: rust 15 parents / 59 constructors, typescript 22 /
  75, python 10 / 40. No ambiguity diagnostics fired.
- `expectTestFailures:` accepts `<kind>.<constructor>` keys to pin one
  constructor's generated test (python's
  `parenthesized_list_splat.parenthesizedListSplat` — a dummy-builder gap).
