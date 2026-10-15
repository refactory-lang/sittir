# Builder contexts: context rules enforced by the builders, not the parser

## The rule

A language's context rules are enforced by declarative, builder-only data, never by the parser. Examples:
- `break` only inside a loop or a `switch`;
- `await` only in an async function;
- `self` only in an associated function.

These are the early errors the [over-acceptance census](../probes/2026-10-15-grammar-over-acceptance/README.md) left outside the grammar: the parser accepts them, and no rule is cloned per context.

The user's rulings:

- **C1, mechanism: types plus a runtime mirror.**
  - A built node's type carries `Needs<…>`, the contexts it still requires, and they flow up through child types at any depth.
  - A providing slot (a loop body) discharges its contexts. A bounding slot (a function body, a class body, the root) admits only children whose remaining needs it provides.
  - The same set is a bitmask stamped on every node, checked at bounding slots by whoever writes the data. For built nodes the check runs only under `verifyStructure: 'runtime'`, because the types prove it.
- **C2, declaration:** a `contexts:` block in `grammar.sittir.ts`, builder-only. It never reaches enrich, wire or the parser. The compiler stamps what requires, provides and bounds each context onto the model, and the emitters read the stamps.
- **C3, parsed input:** the reader stamps a parsed node's needs bottom-up from the same table. So a parsed `break` placed in a function body is refused like a built one.

Labels in scope are out of scope, because they depend on identifiers. Strict mode is a mode flag (question 4).

The type encoding is proven, and its cost measured, in [the contexts probe](../probes/2026-10-15-builder-contexts/README.md).

## 1. Declaration

`contexts` is a top-level key of `sittirGrammar`, beside `rules` and `options`. It is a function of `$`, like `rules` entries, and returns one entry per context:

```ts
contexts: ($) => {
	const loops = [slot($.for_statement, 'body'), slot($.for_in_statement, 'body'), slot($.while_statement, 'body'), slot($.do_statement, 'body')];
	const functions = [$.function_declaration, $.function_expression, $.generator_function_declaration, $.generator_function, $.method_definition, $.arrow_function];
	const bodies = functions.map((k) => slot(k, 'body'));
	const classBodies = [slot($.class_body, 'members'), slot($.class_static_block, 'body')];
	return {
		Break: {
			requiredBy: [when($.break_statement, { label: 'absent' })],
			providedAt: [...loops, slot($.switch_statement, 'body')],
			boundedAt: [...bodies, ...classBodies]
		},
		Continue: { requiredBy: [$.continue_statement], providedAt: loops, boundedAt: [...bodies, ...classBodies] },
		Return: { requiredBy: [$.return_statement], providedAt: bodies, boundedAt: classBodies },
		Await: {
			requiredBy: [$.await_expression, when($.for_in_statement, { await: 'present' })],
			providedAt: [...bodies.map((s) => when(s, { async: 'present' })), slot($.program, 'statements')],
			boundedAt: [...bodies, ...classBodies]
		},
		Yield: {
			requiredBy: [$.yield_expression],
			providedAt: [slot($.generator_function_declaration, 'body'), slot($.generator_function, 'body'), when(slot($.method_definition, 'body'), { generator: 'present' })],
			boundedAt: [...bodies, ...classBodies]
		},
		NewTarget: {
			requiredBy: [$.new_target],
			providedAt: bodies.filter((s) => s.kind !== $.arrow_function),
			boundedAt: classBodies
		}
	};
}
```

The slot and kind names above illustrate the shape. The rows that ship are written against the model's slot names, which the compiler checks.

- **`requiredBy`** lists kinds, each optionally conditioned. A node of that kind needs the context.
- **`providedAt`** lists slots. A child placed there has the context discharged.
- **`boundedAt`** lists slots. A child placed there with the context still needed is refused.
- A slot not listed for a context passes it through. An arrow function's body passes `NewTarget` through and bounds `Yield`, which is why the facts are kept per context.
- **The root bounds every context.** That makes the root kind's slots a bound without a listing. A context the root allows is listed in `providedAt`, as TypeScript's top-level `await` is.
- **`when(kindOrSlot, conditions)`** conditions a row on the owning node's own slots:
  - `'present'` or `'absent'` for an optional or keyword slot (`async`, `label`, `generator`);
  - a literal text for a leaf slot (`{ name: 'constructor' }`), used only by the rows in question 3.

  A condition reads the node itself, never its ancestors. Anything that needs an ancestor is a provider or a bound, which keeps the data local.
- `slot(kind, name)` and `when` are DSL helpers beside `field` and `alias`, with erasable syntax only. Under tree-sitter's CLI run, `sittirGrammar` drops `contexts`, so the parser never sees it.

**Validation.** Each of these is a blocking diagnostic when the grammar compiles:

| code | condition |
| --- | --- |
| `context-unknown-kind` | a `requiredBy` or `slot` kind that is not a visible kind with a parser-issued kind id. A hidden or inlined kind has no node to stamp, and a phantom kind no id for the reader. |
| `context-unknown-slot` | a `slot` name, or a `when` slot, that the kind does not have |
| `context-bad-condition` | `'present'` or `'absent'` on a required slot, or a text condition on a slot that is not a leaf |
| `context-provided-and-bounded` | the same slot both provides and bounds one context with overlapping conditions |
| `context-unrequired` | a context nothing requires |
| `context-too-many` | more contexts than mask bits (see §4) |

## 2. Model stamps

The compiler resolves the block once, after link, into stamps on the model:

- `node.contextRequires: readonly { mask: number; when?: Condition }[]`;
- `slot.contextProvides: readonly { mask: number; when?: Condition }[]`;
- `slot.contextBounds: number`.

Masks use the grammar's context numbering, and the emitters read only the stamps. Nothing downstream re-reads the block or matches names. Consistent with the stamped-facts rule, a missing or misspelled fact fails generation, never a build.

## 3. Types

Today's builders are not generic: `buildWhileStatement(config): T.WhileStatement.Bound`. With contexts, a builder becomes generic over each node-valued slot from which a requiring kind is reachable. The emitter computes that reachability from the model. Leaves and slots that can reach no requirement stay as they are.

```ts
declare const ContextSet: unique symbol;
export type Needs<N extends Context> = number & { readonly [ContextSet]?: N };
export type NeedsOf<X> = X extends { readonly $needs: Needs<infer N> } ? N : never;
type Bounded<B, A extends Context> =
	[Exclude<NeedsOf<B>, A | 'Unproven'>] extends [never] ? unknown : { readonly $needs: Needs<A | 'Unproven'> };

declare function buildWhileStatement<P extends Admit<T.ParenthesizedExpression>, B extends Admit<T.Statement>>(
	config: { condition: P; body: B }
): T.WhileStatement.Bound<NeedsOf<P> | Exclude<NeedsOf<B>, 'Break' | 'Continue'>>;

declare function buildFunctionDeclaration<B extends Admit<T.StatementBlock>, A extends boolean = false>(
	config: { name: …; async?: A; body: B & Bounded<B, 'Return' | (A extends true ? 'Await' : never)> }
): T.FunctionDeclaration.Bound<never>;
```

- **`$needs` is a runtime member.** It is the mask (§4), so the type describes a member that exists. The phantom key refines the number's type the way the generated `__booleanKeyword__` brands already refine keyword booleans. It is not an admission brand: admission still reads the tree token or `$render`.
- **Every `Bound` takes the parameter.** `X.Bound<N extends Context = Context>`. The default is every context, so a wide annotation (`const s: T.Statement = …`) holds any node. Placing such a node at a bound is refused, because its type no longer proves what it needs. That is sound, and the annotation is where the precision went.
- **Lists:** `C extends Admit<T.Statement>[]` with `NeedsOf<C[number]>`.
- **A providing slot** returns `Exclude<NeedsOf<B>, Provided>`.
- **A conditional provider** is generic over its condition, as `A` is for `async` above.
- **A bounding slot** intersects its parameter with `Bounded<B, Provided>`. The refusal reads as the unmet context at the end of the message: `'"Break"' is not assignable to '"Return" | "Unproven"'`.
- **`Unproven`** is the name for needs the types do not track: parsed nodes, loose-built nodes and wide annotations of them. A bound's type admits it, and the runtime check decides (§5).

**Cost** (tsc 7.0.2, the probe's workloads over the real TypeScript node types):

| | check time per builder call | instantiations per call |
| --- | --- | --- |
| today | 3–10 µs | — |
| added by contexts | 18–20 µs | 1.8–2.3 |

- Loading the types is unchanged at about 1.4 s.
- A file with 500 builder calls gains about 10 ms.
- The probe's largest file, about 151,000 calls, goes from 3.0 s to 5.7 s.

This is reported, not gated. The generated declarations' growth (a type parameter per reachable slot) is measured when the emitter exists.

## 4. The runtime mask

- `$needs` is a 32-bit mask.
- Bits 0–30 are the grammar's contexts, numbered in declaration order. Bit 31 is `Unproven`.
- A built node holds it as an own data property. A parsed node reads it from its arena row.

Every builder computes it at construction, in both modes. For each slot, `contribution` is the OR of the child masks with the slot's provided bits cleared. The node's own mask is:

```
needs(node) = requires(node)
            | OR over slots of contribution(slot) & ~bounds(slot)
            | OR over slots of contribution(slot) & bounds(slot)   // unmet: carried up, never dropped
```

- An unmet need is carried upward. So a node that violates a bound keeps the violation visible to every later bound and to the root. For a built node, the bound's check (§5) has already thrown.
- A parsed root whose mask is not zero is source that breaks a context rule. Reading it is not an error; the mask makes it a queryable fact.
- **One table.** The masks come from `hooks.structure[kindId].contexts`, the per-kind structure table the `verifyStructure` plan introduces: `{ requires, slots: { [key]: { provides, bounds } } }`.
- One helper, `needsOf(kindId, node, table)` in `packages/common`, computes the mask, and every builder calls it. The emitter writes no per-kind arithmetic.

## 5. Where it is checked, and `verifyStructure`

**A bounding slot checks its children:** `contribution & bounds === 0`. The emitter calls `checkBound(kindId, slotKey, contribution, table)` only for slots with a nonzero `bounds`, and the root's slots are among them. Whether the check runs:

| child's mask | `'compileTimeOnly'` (default) | `'runtime'` |
| --- | --- | --- |
| no `Unproven` bit (built and typed) | skipped: the types proved it | the verifier checks it |
| `Unproven` bit (parsed, loose-built) | checked at the bound | checked at the bound |

- This follows the runtime-checks ruling: a fact the types prove has no default check, and a fact they cannot prove always runs.
- The `Unproven` test is a test of data, not of the mode, and the mode choice stays fixed at engine construction.
- A bound that has checked an `Unproven` child clears the bit in its own contribution. So each subtree is checked once, at its nearest bound.
- **In `'runtime'` the verifier recomputes the masks** from the children rather than trusting the stamps, and checks every bound. That catches a JavaScript caller that bypasses the types, the same way the verifier catches a bare string.
- The `Unproven` bit is set by:
  - the reader, on every parsed node;
  - the loose and coerce builders (`.from()`, plain-structure input), whose input types do not carry needs;
  - `engine.attach` of a node from another engine.

  A typed builder clears nothing; it ORs.
- The refusal names the context, the bounding kind and slot, and the requiring kind's path:
  `FunctionDeclaration.body: 'Break' is not provided here (needed by BreakStatement at body.statements[0].consequence)`.

## 6. Composition

- **Several contexts** are bits, combined by OR and discharged per slot.
- **A provider inside a bound** (a loop in a function body) discharges first, and the bound sees what is left.
- **A bound inside a provider** (a function inside a loop) stops the outer provider from reaching in: `while (c) { function f() { break; } }` is refused at `f`'s body, as ECMAScript requires.
- **A context a slot passes through**, such as `NewTarget` through an arrow function's body, continues upward unchanged.
- **Inverted rules** use the same three facts: a construct allowed almost everywhere and forbidden in a few places. Rust's visibility on trait items is one:
  - `Visibility` is required by `visibility_modifier`;
  - it is provided at the root and at every block (an item inside a function body may be `pub`);
  - it is bounded at trait bodies, trait-impl bodies (`when(impl_item.body, { trait: 'present' })`) and enum variant lists.

## 7. Parsed nodes and rebuilding

- **The reader** stamps bottom-up in the same pass that writes the arena row, from the same table, emitted into the Rust crate's generated tables. Each parsed node's mask carries the `Unproven` bit. Reading never refuses: the parser accepted the source, and the mask records what it needs.
- **`$with` and list edits** rebuild through the builder (`rebuilt`), so the new node is stamped and checked like a fresh build. Ancestors are immutable and keep their masks until the caller rebuilds them, which stamps them again.
- **Edits on a parsed tree** (`$edit`, still open in the node query API) splice data keyed by tree and index. A splice recomputes the masks along the path from the splice point to the root, and checks at every bound it crosses. It always checks, because the spliced tree is parsed and its nodes are `Unproven`.
- **Native.** When the arena writer moves to native, the builders' stamping and the bound check move with the write, as the runtime-checks ruling places every writer check. The table is already native for the reader.

## 8. The portable surface

- **At run time** the portable builders build through the grammar's builders, so the masks and checks are the same.
- **For types** there are two options (question 1):
  - (a) Context names become vocabulary terms (`Break`, `Continue`, `Return`, `Await`, `Yield`, `NewTarget`, …), declared once beside the kinds. A grammar's `contexts:` uses only those names, or a feature adds one, as the vocabulary extends today. Portable types then carry `Needs` over shared names, and portable code generic over `G` gets the same compile-time proof.
  - (b) Context names stay per grammar. Portable types carry only `Unproven`, and every portable build is checked at run time.

## 9. Census: which early errors this covers

These are the early-error rows of the census re-sort.

| grammar | early-error rows | covered | covered rows | not covered |
| --- | --- | --- | --- | --- |
| typescript | 30 | 7, or 9 with text conditions | `await`, `yield`, `break` and `continue` outside their constructs, `return` at the top level, `new.target` at the top level, an abstract member outside an abstract class (`Abstract`: required by an abstract member, provided at an abstract class's body, bounded at class bodies); with a text condition on the constructor's name, a parameter property outside a constructor and an accessibility modifier on a function parameter | labels (2); members named `constructor` (5: these restrict one node's own combination, not a context); strict mode (6: `delete` of an identifier, `with`, `let let`, a labelled function, legacy octal literal and escape); regex flags (2, lexical); duplicate parameters (1); checker rules on newer syntax (5) |
| python | 7 | 5 | `return`, `await`, `yield` and `break` outside their constructs, `nonlocal` at module level | duplicate parameters (names); a bare starred expression (a position rule within one statement) |
| rust | 7 | 6 | `break` outside a loop, `self` in a free function (`Associated`: provided at impl and trait bodies, bounded at function bodies), `...` outside an extern block (`Variadic`), and visibility on enum variants, trait items and trait-impl items (`Visibility`, §6) | `const async` (one node's own combination) |

What remains outside is named in the census README's bound: labels, strict mode, duplicate names, single-node combinations, lexical rules and TypeScript checker rules on newer syntax.

## Questions

Rulings return through brainstorm.

1. **Portable context names** (§8): (a) vocabulary terms, which give a compile-time proof for portable code (recommended); (b) per grammar, so portable builds are checked at run time.
2. **The `Bound` default** (§3): (a) `Context`, every context: wide annotations hold anything, and a bound refuses what they no longer prove (recommended); (b) `never`: a wide annotation cannot hold a node that needs anything.
3. **Text conditions:** two TypeScript rows (the parameter-property rules) need `when(…, { name: 'constructor' })`, a fixed-text test on a leaf. (a) Allow text conditions on leaf slots (recommended); (b) only presence conditions, and those rows stay in the bound.
4. **Strict mode:** six TypeScript rows are strict-mode early errors. They fit this mechanism as a `Sloppy` context, required by `with`, `delete` of an identifier, legacy octals and the rest, and provided only by a script root under an engine `sourceType: 'script'` option. TypeScript modules are always strict. (a) Leave them in the bound for now (recommended: TypeScript code is modules); (b) a separate proposal now.
