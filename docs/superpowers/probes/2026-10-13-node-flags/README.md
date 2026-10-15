# Flag captures: census

Which shapes a vocabulary flag takes per grammar kind, so the flag table knows what to lower. A flag is declared two ways in `bindings.scm`: a capture named for the flag (`"async" @async`), which becomes a member route, and a claim whose path ends in the flag (`@declaration.method.static`), which `resolveFlags` reads as the parent path plus the flag.

- `census.py` covers member flags. It reads the generated `node-model-portable.json5` (member routes) and `node-model.json5` (slots); `census.txt` is its output on feat/bindings at 6204172a0.
- `claims.ts` covers claim flags, read from `bindings.scm` through `resolveFlags`; `claims.txt` is its output.

## Result

121 flag members over 69 kinds (rust 37, typescript 76, python 8).

- **Route:** a direct slot (72), a keyword reached through wrappers (`presence`, 29), or a captured node kind (`kind` 19, `nested` 1).
- **Depth:** 0 to 3 steps. Rust `function_type`'s `unsafe` is three deep; rust `function_item`'s `async`/`const`/`default`/`unsafe` and typescript `import_clause`'s `default` are two deep.
- **No anchors:** no flag path carries `first`, `last` or `only`.
- **One alternative each,** except typescript `method_definition`'s `optional`. Its two routes reach the same slot and lower to the same plan.
- **Leaf:** `present` where the last slot holds only the keyword (58), `eq` where it holds one keyword among others (35), and a kind test where the flag captures a node (20).
- **No path (8):** rust `reference_expression_raw_const` and `_raw_mut` (`raw`); typescript `abstract_class_declaration` (`abstract`), `call_expression_member` (`optionalChain`), `generator_function` and `generator_function_declaration` (`generator`), `optional_parameter` (`optional`), `variable_declarator_definite` (`definite`). The kind itself carries the flag: its token is spelled inside the kind's own form, so for that kind the flag always holds.

## Claim flags

Two, and both depend on the node's context:

- **rust `function_item` `static`:** placed in an impl body's `declaration_list`, and no parameter is a `self_parameter` (a child test, `up 0`).
- **python `function_definition` `static`:** placed in a `decorated_definition`, whose decorator is `staticmethod` (an `eq` on the parent, `up 1`).

Nothing downstream of `resolveFlags` reads `claim.flag` today. Neither flag reaches the read entries or the members, so the portable surface does not answer them either.

## What the plan did not expect

1. **Kind tests.** The native `Routes` admit a fielded child by its field alone. So "the child at field `name` is a `computed_property_name`" has no native form today, and neither has the portable `is` leaf (a JavaScript-only subject test).
2. **Constant flags.** A no-path flag holds for every node of its kind.

3. **Context flags.** No member flag needs `up > 0` or a text comparison of the node's own text. Both claim flags need the node's context (its placement, and for python a test on the parent), which a node-local plan cannot express.
