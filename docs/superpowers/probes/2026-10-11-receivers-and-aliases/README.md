# Receivers and aliases: probes

Two censuses of the vocabulary behind two rulings:

- **A receiver is no parameter, and it is declared wherever a function can declare one.** The `explicit-receivers` feature owns `receiver` and `declaration.parameter.self`, apart from `methods`. Written up in the bindings spec (`docs/superpowers/specs/2026-09-13-bindings-and-vocabulary-design.md`): §9, "A receiver is no parameter", and the feature table's `explicit-receivers` row.
- **The portable namespaces name a kind only by its full path.** There are no short aliases. Written up in the binding generator plan (`docs/superpowers/plans/2026-10-06-binding-generator.md`), stage 3.

## Tools

| file | what it measures | promote |
| --- | --- | --- |
| `alias-census.mts` | The short aliases a namespace would derive: a path's last segment under an ancestor, where no other path under the ancestor ends in it and no child of the ancestor is named by it. It counts them and lists those whose segment is also a flag the ancestor or a kind under it declares, so the alias would read as that flag's guard. | no: it measures a naming scheme the ruling removed |
| `receiver-kinds.mts` | The function-like kinds (functions, methods, lambdas, signatures, parameters, extensions), each with the module or feature declaring it, its parent and its own members. It also lists the member stubs features add to `Declaration.Parameter.Self`, `Declaration.Extension` and `Declaration.Extension.Conformance`, and every declaration of `receiver`. | no: `bindings-inventory --check` and the vocabulary tests hold the facts it reads |

Each takes the checkout to measure as its argument and reads that checkout's vocabulary through the checkout's own reader (`packages/tools/src/inventory/vocabulary.ts`, `packages/tools/src/vocabulary/read.ts`), so one copy serves every worktree. The checkout needs its dependencies installed.

## Commands

From the root of a checkout:

```bash
P=docs/superpowers/probes/2026-10-11-receivers-and-aliases
pnpm exec tsx $P/alias-census.mts <checkout>
pnpm exec tsx $P/receiver-kinds.mts <checkout>
```

## Results

Measured at two commits:

- `8a80d34a3`: `feat/bindings` with the vocabulary features merged, before both rulings.
- `ac7d206a3`: `feat/placed-scope`, which adds three commits:
  - `a64709c45` drops `declaration.method.static` for the `static` flag;
  - `88124970f` adds rust's placed `@scope` lines;
  - `ac7d206a3` is the receiver and body vocabulary.

### Aliases

| commit | aliases | sharing a flag's name |
| --- | --- | --- |
| `8a80d34a3` | 492 | 13 |
| `ac7d206a3` | 491 | 14 |

At `ac7d206a3` (each flag's kinds include those inheriting it):

```
(root).mutable -> pattern.mutable; a flag of declaration.parameter, declaration.parameter.default, declaration.parameter.typed +17
(root).async -> expression.block.async; a flag of declaration.function, declaration.function.signature, expression.function +53
(root).const -> expression.block.const; a flag of declaration.function, declaration.function.signature, declaration.enum +56
(root).generator -> expression.comprehension.generator; a flag of declaration.function, declaration.function.signature, expression.function +49
(root).raw -> literal.string.raw; a flag of expression.reference
(root).readonly -> type.readonly; a flag of declaration.field, declaration.parameter, declaration.parameter.default +59
(root).unsafe -> expression.block.unsafe; a flag of declaration.function, declaration.function.signature, declaration.interface.trait +57
declaration.default -> declaration.parameter.default; a flag of declaration.function, declaration.function.signature, declaration.method +48
declaration.static -> declaration.variable.static; a flag of declaration.field, declaration.field.signature, declaration.method +48
declaration.abstract -> declaration.method.signature.abstract; a flag of declaration.field, declaration.field.signature, declaration.class +9
expression.async -> expression.block.async; a flag of expression.function, expression.lambda
expression.generator -> expression.comprehension.generator; a flag of expression.function
expression.exclusive -> expression.range.exclusive; a flag of expression.reference
pattern.exclusive -> pattern.range.exclusive; a flag of pattern.reference.value
```

- **What dropping `declaration.method.static` changed.** `static` becomes unique under `declaration`. So `is.declaration.static` would name the static variable, while it reads as the `static` flag of a method or a field. That case raised the question.
- **What the other 13 show.** The collision is general: `is.async` would hold for an async block and not for an async function.
- **Aliases also move as the vocabulary grows.** A new path ending in a segment takes the alias away from the old one.

So the ruling removed aliases altogether rather than dropping this one.

### Receivers

The difference between the two commits, as `receiver-kinds.mts` prints it:

| | `8a80d34a3` | `ac7d206a3` |
| --- | --- | --- |
| `receiver` declared by | `open-type-extension` on `Declaration.Extension`, `open-type-extension/typeclasses` on `.Conformance` | `explicit-receivers` on `Declaration.Function`, `Declaration.Method`, `Declaration.Signature.Call`, `Expression.Function` and `Type.Function` |
| `declaration.parameter.self` declared by | `methods` | `explicit-receivers` |
| `declaration.extension`, `.conformance` members | `implements`, `receiver`, `traitClause`, `type` | `body`, `implements`, `traitClause`, `type` |
| `declaration.method.static` and its 4 visibility levels | present | gone (the `static` flag) |

- **Before:** the vocabulary declared `receiver` only on the impl block. That agreed with rust's route, which captured a method's `self` deep inside a placed claim, and such a capture lands on the claim's top kind, the impl block, not on the method.
- **After:** the member sits on every kind that can declare a receiver. Their sub-kinds inherit it as they inherit the kinds' other members: the visibility levels, the signatures, the accessors and `type.function.constructor`. A context without `explicit-receivers`, such as python's, has no `receiver` on any of them.
- **Constructors and arrow functions are left out.** Typescript allows a `this` parameter on neither, so `declaration.constructor` and `expression.lambda` declare none.
- **Accessors keep the member.** Typescript's compiler rejects a `this` parameter on an accessor, but its grammar parses one: `get x(this: A)` is a `method_definition` whose first parameter's pattern is `this`. A getter is a sub-kind of the method, so it inherits `receiver` as it inherits `async`.
