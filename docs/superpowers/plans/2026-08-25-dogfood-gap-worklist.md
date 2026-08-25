# Dogfood GAP work list

Deduplicated from the `// GAP` markers in `examples/17-dogfood-rust.ts`,
`17-dogfood-rust-strict.ts`, `18-dogfood-typescript.ts`,
`18-dogfood-typescript-strict.ts`, `19-dogfood-python.ts` and
`19-dogfood-python-strict.ts`.

Each sample was rebuilt twice — once through the coercion surface
(`ir.<kind>({…})`) and once through the factory surface (`.strict`) — so every
entry names the layer that actually fails:

- **exposure** — the factory builds the shape correctly, but no public
  constructor reaches it (no `ir` entry; the package exports no `build*`).
- **coercion** — the factory accepts the shape; the coercer will not resolve
  the loose input into it.
- **factory** — the builder itself cannot produce the shape.

Verified by direct probe unless marked otherwise.

## Headline

The rust factories are in far better shape than the public surface suggests.
Called directly they render `/// doc`, `//! doc`,
`#[derive(Debug, Clone, PartialEq, Eq)]`, `x,` (comma-terminated match arm),
`x;` (semicolon expression statement) and `write!(f, …)` correctly. None of
those kinds has an `ir` entry, and `packages/rust/src/index.ts` re-exports
**zero** `build*` functions, so no public path constructs them.

**Corrected after measuring against the live model.** An earlier draft of this
list treated class A as one exposure fix routed through `factoryInline`. That
was wrong on two counts, and both corrections matter for how the class is
worked:

- **`factoryInline` cannot expose anything — it only removes an `ir` entry.**
  Every class-A kind is hidden (`_`-prefixed) and the `ir` emitter skips hidden
  kinds outright, so none has an entry to remove. Declaring them is a no-op.
- **The six need four different mechanisms, not one.** Four are blocked by
  `namespacedConstructors` eligibility predicates (which is the root the spec
  itself names); three multi-slot parents need `from()` nested config on the
  slot, i.e. class B; and one row was simply stale.

The reachable spelling is the namespaced form — `ir.lineComment.doc(…)`, not
`ir.lineCommentDoc(…)` — which is also what section-E argues for: an artefact
kind should not become a top-level builder. Fixing the eligibility predicates
reaches them with **zero** new `ir` entries, so the shrink-only ratchet holds.

## Class A — unreachable kind (exposure)

Root: the `ir` namespace emitter / `namespacedConstructors` eligibility
(`namespaceOf` in `packages/codegen/src/emitters/factories.ts`).

| kind | needed for | evidence |
| --- | --- | --- |
| `_line_comment_doc` | `///` and `//!` doc comments (rust) | `buildLineCommentDoc` renders `/// hi` and `//! hi`; no `ir` entry |
| `_attribute_arm` | `#[derive(…)]` arguments (rust) | `buildAttributeArm` renders `#[derive(Debug)]`; no `ir` entry. (`_delim_token_tree_paren` is NOT a gap — `ir.delimTokenTree.paren(…)` already ships) |
| `_match_arm_with_comma` | `pattern => expr,` (rust) | `buildMatchArmWithComma` renders `x,`; no `ir` entry |
| `_expression_statement_with_semi` | `call();` (rust) | `buildExpressionStatementWithSemi` renders `x;`; no `ir` entry |
| `_impl_item_positive_clause` | `impl Trait for Type` (rust) | `buildImplItemPositiveClause` exists; no `ir` entry |
| `_impl_item_body` | any `impl` body (rust) | factory exists; no `ir` entry |
| `_import_list` element | `import argparse` (python) | coercer cannot resolve; element wrapper has no public constructor |
| `_import_statement_arm` | any `import` (typescript) | coercer cannot resolve; no public constructor |
| `_variable_declarator_arm1/2` | `let x = y` (typescript) | coercer cannot resolve; no public constructor |
| `_call_expression_call` | any call (typescript) | coercer cannot resolve; no public constructor |
| `_export_statement_default` | any `export` (typescript) | coercer cannot resolve; no public constructor |

These are artefact kinds that should be constructed through their parent
rather than exposed as top-level builders — but `factoryInline` is not the
mechanism, since it only removes an entry a hidden kind never had. Measured
against the live model, the six rust kinds split three ways:

- **`namespacedConstructors` eligibility** (`_line_comment_doc`,
  `_expression_statement_with_semi`, `_match_arm_with_comma`, and the
  `visibility_modifier` chain): three predicates block them — a form arm must
  currently be a compound or keyword (excluding `pattern`/`enum` leaves), a
  supertype sibling arm vetoes the whole slot, and a single-kind "forwarded
  shape" slot yields no namespace to flatten upward. Fixing those reaches all
  four as `ir.<parent>.<form>(…)` with zero new `ir` entries.
- **Class B `from()` nested config** (`_impl_item_positive_clause`,
  `_impl_item_body`, `_attribute_arm`): multi-slot parents where forms do not
  apply, because form slots require every other user slot to be optional.
- **Already reachable** (`_delim_token_tree_paren`): no work.

## Class B — missing loose form (coercion)

Root: the `from` emitter's per-field resolver selection
(`packages/codegen/src/emitters/from.ts`).

| slot | rejected input | note |
| --- | --- | --- |
| `enum_variant.body`, `field_declaration_list` | array of field declarations | only the strict variadic list builder accepts it |
| `impl_item.trait_clause` | `'std::fmt::Display'` | **silent wrong output** — see Class D |
| `match_arm.pattern` | a bare pattern | the `match_pattern` wrapper must be spelled by hand |
| `match_block.body` | `{ matchArm, lastArm }` | the config its own arms rule requires; only `.strict` takes it |
| `parameter` | `mut name` | no loose form keeps `mut` beside the name |
| any `kind:` discriminant | `TSKindId.StructPattern` | accepts only raw grammar strings; the stamped kind enum the package exports is rejected because it is a number |
| `function_declaration.return_type` (ts) | a bare type | the `type_annotation` wrapper must be spelled; and `type_annotation.strict` then rejects the type node (factory) |

**The `Loose` types themselves.** The emitted `T.<Kind>.Loose` projections are
far narrower than the coercers they describe: they reject `{ kind: … }`
configs, string shorthands outside leaf slots, and arrays for list slots, and
they admit the interface's ACCESSOR signatures (`() => Identifier`) as if those
were config values. `examples/17-dogfood-rust.ts` runs correctly and produces
38 type errors, which is why it is excluded from `type-check:examples` rather
than cast into compiling. Fixing the projection is the prerequisite for putting
any dogfood example back under the typecheck gate.

## Class C — ergonomic mismatch

| site | problem |
| --- | --- |
| list builders (rust) | the `{ delimiter }` option is honored only as the FIRST argument; in last position — which the signature also admits — it is wrapped as an element and the transport rejects it |
| `return_statement.semicolon`, `member_expression.separator`, `object_type.opening` (ts) | grammatically fixed punctuation is a REQUIRED config slot. A determined slot is template text, not caller input |

## Class D — render / factory defect

| site | defect | layer |
| --- | --- | --- |
| `impl_item.trait_clause` (rust) | a bare string leaks UNRESOLVED into the two-arm hidden choice and renders verbatim, dropping the `for` the clause template writes: `impl std::fmt::Display SpliceError`. Wrong output, no error | coercion, surfacing as wrong render |
| `return_statement` (ts) | renders `return;` with its expression supplied — through `.strict` as well | factory |
| `type_annotation.type` (ts) | `.strict` rejects a type node in its own slot | factory |
| `variable_declarator.content` (ts) | `.strict` rejects the name/value its own rule names | factory |
| every suite-carrying slot (python) | `function_definition.body`, `if_statement.consequence` reject a `block` at BOTH layers — no function definition is constructible by any public path | factory |
| `module.statements` (python) | `StatementTransport` excludes `expression_statement` (kind 122) and comments — a call statement renders alone but cannot be placed in a module | factory |
| `module.strict.statements` (python) | rejects statement values the coercer accepts — the strict rebuild cannot assemble even what the loose one does | factory |
| `enum_variant` with a struct body inside a variant list (rust) | `AttributedEnumVariantTransport._enum_variant` reported missing `_name` when the list carried a trailing-delimiter option in last position; resolved by passing the option first, so it is the Class C bug surfacing as a transport error | coercion |
| closure body (rust) | `_closure_expression_block` rejects a bare block; the arm's own builder reports `Missing field _body` | factory |

## Totals

- Class A: 11 kinds, all exposure, 6 of them rust kinds whose factories are
  verified working.
- Class B: 7 slots plus the `Loose` type projection.
- Class C: 2 (one rust argument-position bug, one cross-cutting TypeScript
  determined-slot leak).
- Class D: 9 sites, 7 of them factory/transport.

## Suggested order

1. **Class A eligibility** — three bounded predicate changes in
   `namespacedConstructors`, each derivable from the model and testable in
   isolation. Retires four of the six rust kinds as `ir.<parent>.<form>(…)`
   with zero new `ir` entries, so the shrink-only ratchet holds. The three
   multi-slot residuals fall to class B below.
2. **Class D python** — a module that cannot hold a statement and a function
   that cannot hold a body are the most basic failures found; nothing about the
   Python surface is usable until they close.
3. **Class C determined slots (ts)** — required punctuation is a model
   question (determined slots are template text) and blocks every TypeScript
   statement shape.
4. **Class B `Loose` projection** — the prerequisite for putting the examples
   back under `type-check:examples`.
5. **Class D remainder and Class B slots** — individually smaller, and several
   will fall out of the fixes above.
