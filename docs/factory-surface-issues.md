# Construction contracts and diagnostics

The generated constructor signature is the contract for each grammar form. There is no universal config-object calling convention, and raw storage is not a public construction API.

## Strict and coercing construction

`engine.build.<path>(...)` resolves ergonomic inputs. Its `.strict` entry takes the explicit construction shape. Both preserve the selected grammar kind and forms; coercion is a typed resolution layer, not arbitrary source parsing or semantic inference.

A no-argument call is valid only when the signature admits it. Required fields and required nonempty lists are not implicit defaults. Fixed syntax can be represented by a kind-ID value rather than a callable builder.

## Lists, envelopes, and forms

A list may take variadic elements, an options bag plus elements, or an existing list node. An envelope can forward that list's calling convention rather than accepting an object whose key names the inner slot. Distinct grammar forms have their own construction paths when the generated API exposes them.

Use the signature and the [construction examples](../examples/01-construct-nodes.ts) instead of inferring a call from a parser node's raw field layout.

## Reading a failure

1. Confirm the actual generated signature for the selected path.
2. Keep the smallest construction and the corresponding source witness.
3. Distinguish coercion, factory storage, native transport, rendering, and reparsing.
4. Compare strict and coercing forms where both are admitted.
5. Fix the owning grammar/model/generator boundary, not a generated file or a test expectation that merely exposes it.

A TypeScript error and a runtime failure reached after bypassing the types are different findings. Do not add a cast or suppress the type error to make a usage example look valid.

## Tracking defects

Concrete open issues belong in [GitHub](https://github.com/refactory-lang/sittir/issues). Current measured exclusions belong in the [validation baselines](../DEVELOPMENT.md#validation). The [usage guide](use-cases-and-examples.md) describes the current engine API.
