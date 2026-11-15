# Refine forms: node arms, a declared default, kept routes

**Status:** approved, 2026-11-14: the user approved the design for the three sites and `object_type` declaring `default: 'curly'`. The user ruled "Post-parse: extend refine" on 2026-11-14 for typescript's `member_expression`, `using_declaration` and the for-header's `using`. The choice slot stays in the grammar, and the default and named forms come from `refine()`, not from parser variants.

## The end state

- A form can select an arm that is a fixed-text node (`'?.'`, `'await using'`), and its builder pins that kind.
- A `refine()` can declare one default form. The bare builder then builds the default when the form's fields are omitted, and still takes them when they're given.
- A kind's forms are added beside its value routes and seats instead of replacing them.
- Naming a minted kind in `edits:` leaves the grammar's rule order as it was.
- The parser doesn't change: no kinds, kind ids, precedence lists or conflicts. A reader sees every node as it does today.

## The three sites

```ts
const USING_FORMS = { plain: { 'kind:': 'using' }, await: { 'kind:': 'await using' } } as const;

edits: {
	member_expression: {
		1: field('operator'),
		'.': refine({ dot: { 'operator:': '.' }, optional: { 'operator:': '?.' } }, { default: 'dot' })
	},
	using_declaration: { '.': refine(USING_FORMS, { default: 'plain' }) },
	for_header_using_kind: { '.': refine(USING_FORMS, { default: 'plain' }) }
}
```

### `member_expression`

| call or read | today | after |
|---|---|---|
| `ir.memberExpression({ object, operator: '.', property })` | `a.b` | unchanged |
| `ir.memberExpression({ object, operator: '?.', property })` | `a?.b` | unchanged |
| `ir.memberExpression({ object, property })` | type error: `operator` is required | `a.b` |
| `ir.memberExpression.dot({ object, property })` | — | `a.b` |
| `ir.memberExpression.optional({ object, property })` | — | `a?.b` |
| `ir.memberExpression.optional({ object, operator: '.', property })` | — | type error: the form sets `operator` |
| read `a.b` | `MemberExpression`, `operator()` → `Dot` | unchanged |
| read `a?.b` | `MemberExpression`, `operator()` → `OptionalChain` | unchanged |

### `using_declaration`

| call or read | today | after |
|---|---|---|
| `ir.usingDeclaration({ kind: 'using', variableDeclarators })` | `using x = f;` | unchanged |
| `ir.usingDeclaration({ kind: 'await using', variableDeclarators })` | `await using x = f;` | unchanged |
| `ir.usingDeclaration({ variableDeclarators })` | type error: `kind` is required | `using x = f;` |
| `ir.usingDeclaration.plain({ variableDeclarators })` | — | `using x = f;` |
| `ir.usingDeclaration.await({ variableDeclarators })` | — | `await using x = f;` |
| `ir.usingDeclaration.semi({ kind, variableDeclarators })` | builds with `;` | unchanged, and `kind` may be omitted |
| `ir.ambientDeclaration.using.semi(…)` and the other seated `using` routes | present | unchanged |
| read `await using x = f;` | `UsingDeclaration`, `kind()` → `UsingDeclarationArm` | unchanged |

### The for-header's `using`

| call or read | today | after |
|---|---|---|
| `ir.forHeaderUsingKind({ kind: 'using', left, operator, right })` | `(using x of y)` | unchanged |
| `ir.forHeaderUsingKind({ left, operator, right })` | type error: `kind` is required | `(using x of y)` |
| `ir.forHeaderUsingKind.await({ left, operator, right })` | — | `(await using x of y)` |
| `ir.forHeader.usingKind.await({ left, operator, right })` | — | `(await using x of y)`: `ir.forHeader.usingKind` is the same route object as `ir.forHeaderUsingKind`, forms included (today it is the bare builder) |
| read `for (await using x of y) {}` | `ForHeaderUsingKind`, `kind()` → `UsingDeclarationArm` | unchanged |
| kind ids | — | unchanged (see "A minted kind keeps its place") |

### Types

```ts
export namespace MemberExpression {
	export namespace Dot { export type Config = Omit<ConfigFor<TSKindId.MemberExpression>, 'operator'>; … }
	export namespace Optional { export type Config = Omit<ConfigFor<TSKindId.MemberExpression>, 'operator'>; … }
	/** Default form: 'dot'. */
	export type Config = Omit<ConfigFor<TSKindId.MemberExpression>, 'operator'> | ConfigFor<TSKindId.MemberExpression>;
}
```

The bare builder takes `T.MemberExpression.Config`. Each form's builder returns `T.MemberExpression.Bound`, the same node type a read gives.

Every form's config, and the bare builder's, is built from the kind's emitted `Config` (`ConfigFor<…>`), never from the structural `ConfigOf<T.X>`. A preference slot such as `using_declaration`'s `automaticSemicolon` stays in `options`, so `coerceToUsingDeclaration` and the strict builder table's `BuildArgs` row still match the builder.

## A form selects a fixed-text node arm

**Today.** A selection is a string matched against the choice's string arms, or an arm index. A form fixes a field only when the arm it selects is a string.
- `'?.'` and `'await using'` are refused as `refine-config-invalid` ("does not match any string branch of the choice (available: '.')"). The arms are the nodes `optional_chain` and the `await using` lift.
- Selecting by index (`1`) is accepted, but the form doesn't fix the field: `.optional` and `.await` still take `operator` and `kind` from the caller.

**After.**
- A text selection matches a string arm by its literal, or a node arm by the kind's fixed text: `'?.'` matches `OptionalChain`, and `'await using'` matches `UsingDeclarationArm`. The text is the fact the loose coercer already maps to that kind; link reads it and doesn't derive text from the rule.
- An index that selects a fixed-text node arm pins it the same way.
- Either way, the form pins the arm's kind: its builder writes `_operator = TSKindId.OptionalChain`, and its config omits the field.
- A selection of a node arm with no fixed text (a structured node) is `refine-config-invalid`, naming the arm. Today such a selection is accepted and pins nothing.

## A declared default

**Syntax.** `refine(forms, { default: 'dot' })` as an edits entry, and `refine(rule, forms, { default: 'dot' })` inside a rule. The default isn't a key inside a form. A form is a map from paths to selections, so a `default` key there would read as a path. Link refuses a `default` that names no form, as `refine-config-invalid`.

**The bare builder.** Let F be the fields the default's selections pin.
- Its config is the full config with the fields in F omitted together or given together: `Omit<Full, F> | Full`. For one field, that's the full config with the field optional.
- When every field in F is omitted, the builder pins them as the default form does. When they're given, it uses them as given. A loose call that gives only part of F is refused, naming the form's fields.
- The loose (`build`) and strict (`ir`) surfaces behave the same way.

**`T.X.Config`.** Today it's `<first form>.Config` with the doc "Default form: '<name>' (first-declared)", while the bare builder actually takes the full config. After:
- With a declared default, `T.X.Config` is the bare builder's config, `Omit<Full, F> | Full`, and the doc names the default.
- Without one, it's the full config, and the doc says there's no default form.
- `object_type`'s refine (curly and flow) declares `default: 'curly'`, its first form, so `ir.objectType({ members })` builds `{ … }`. `T.ObjectType.Config` and `T.InterfaceBody.Config` become `Omit<Full, 'opening' | 'closing'> | Full`. `Curly.Config` stays assignable to them.

## Forms keep the kind's routes

**Today.** A kind with forms gets its form routes and nothing else. It loses its value routes, its flatten, elements and tuple seats, and its forwarding. The four sub-factory derivations in `compiler/model/sub-factories.ts` and `forwardedTargetKind` in `emitters/shared.ts` each return empty for any kind in `nodeMap.refineForms`. With `using_declaration`'s forms, 16 routes go: `.semi`, `.automaticSemicolon`, and the 14 seated routes that reach them.

**After.** Forms are added beside the kind's routes and seats. `ir.usingDeclaration` is the bare builder with `.plain`, `.await`, `.semi` and `.automaticSemicolon`, and every seated route stays. A form named like a route or a seat already on the kind fails generation, naming both.

## A minted kind keeps its place

The variant hoist of `_for_header` mints `for_header_using_kind`. Naming it in `edits:` today moves its rule ahead of the unedited mints in the rule order. That shifts 41 kind ids, though rule bodies, precedences and conflicts don't change. Wire assembles the evaluated bodies in callback order and appends unedited deposits after them, so an edited mint takes its callback's place.

**After.** An edited mint keeps its deposit position. This is fixed rather than avoided. Avoiding it would mean attaching the forms at the minting `variant()`, which is a second spelling of `refine` for minted kinds.

## Not in scope

- **A read guard per form** (`is.memberExpression.optional(n)`): nothing needs one.
  - The dogfooded emitter writes code through the builders and never reads a member expression's form.
  - The portable layer reads `a?.b` as `expression.member` with the `optionalChain` flag, from typescript's bindings capture of `optional_chain`, and builds it through that flag's presets on the `operator` slot, which stays.
- **Forms in the portable layer:** none of the three sites needs one. `using_declaration` and the for-header's `using` have no portable path, and `expression.member` is covered above.
- **The pinned emitter:** every change here is additive. A call that passes `operator` still type-checks after a pin bump, and the emitter may drop `operator: '.'` once the bump lands.

## Public surface

| export | before | after |
|---|---|---|
| `refine()` (DSL) | `refine(forms)`, `refine(rule, forms)` | takes an optional `{ default }` as its last argument |
| typescript `ir`/`build` | — | `memberExpression.dot`, `.optional`; `usingDeclaration.plain`, `.await`; `forHeaderUsingKind.plain`, `.await`, and the same under `forHeader.usingKind` |
| typescript bare builders | `operator` / `kind` required | optional on `memberExpression`, `usingDeclaration`, `forHeaderUsingKind`; `opening`/`closing` optional together on `objectType`, `interfaceBody` |
| `T.MemberExpression`, `T.UsingDeclaration`, `T.ForHeaderUsingKind` | — | gain `Dot`/`Optional` and `Plain`/`Await` namespaces; `Config` as above |
| `T.ObjectType.Config`, `T.InterfaceBody.Config` | `Curly.Config` | `Omit<Full, 'opening' \| 'closing'> \| Full` |

## Verification

- The route fix, node-arm selection, the declared default and the minted-kind order each land before any grammar uses them. Each regenerates all five grammars byte-identical, and each is proved by a synthetic grammar test that's red before it.
- The grammar change regenerates `grammar.json`, `parser.c` and `kind_ids.rs` unchanged. Its generated diff holds only the new builders, routes and types. The validation counts equal the base's.
- typescript's type-check passes with the three sites refined, `coerce.ts` and `strict-args-row-is-the-call.test-d.ts` included.
- The route fix goes first, since it's a defect today.
