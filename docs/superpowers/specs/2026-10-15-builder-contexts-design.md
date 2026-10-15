# Builder contexts: context rules enforced by the builders, not the parser

## The rule

A language's context rules are enforced by declarative, builder-only data, never by the parser. Examples:
- `break` only inside a loop;
- `return` only inside a function;
- `self` only in an associated function.

These are the early errors the [over-acceptance census](../probes/2026-10-15-grammar-over-acceptance/README.md) left outside the grammar: the parser accepts them, and no rule is cloned per context.

The user's rulings:

- **Mechanism: types plus a runtime mirror.**
  - A built node's type carries `Needs<…>`, the contexts it still requires, and they flow up through child types at any depth.
  - A providing slot (a loop body) discharges its contexts. A bounding slot (a function body, a class body, the root) admits only children whose remaining needs it provides.
  - The same set is a bitmask stamped on every node, checked at bounding slots by whoever writes the data. For built nodes the check runs only under `verifyStructure: 'runtime'`, because the types prove it.
- **Declaration:** a `contexts:` block in `grammar.sittir.ts`, builder-only. It never reaches enrich, wire or the parser.
- **Parsed input:** the reader stamps a parsed node's needs bottom-up from the same table. So a parsed `break` placed in a function body is refused like a built one.
- **Kinds only, no conditions.**
  - Every `requiredBy`, `providedAt` and `boundedAt` entry is a stamped kind id, or a (kind id, slot) for a slot, and the runtime table is keyed by kind id alone.
  - A distinction that has no kind is a gap, to be filled with a real kind: a variant form enrich mints, or a bindings split or contextual alias. It is never a condition.
- **Names are vocabulary terms** (`Break`, `Return`, `Await`, …), so portable code gets the same compile-time proof.
- **`Bound` defaults to every context.**
- **Strict mode stays outside**, in the stated bound. TypeScript is always strict, and a sloppy-mode context is a future JavaScript-grammar item.

Labels in scope are out of scope, because they depend on identifiers.

The [contexts probe](../probes/2026-10-15-builder-contexts/README.md) proves the type encoding on the real TypeScript node types, measures its cost, and runs the kinds-only tables below over sittir's parse trees.

## 1. The terms

The context names are vocabulary terms, declared once, beside the kinds, in `packages/types/src/vocabulary/builder-contexts.ts`:
- an ordered tuple;
- `BuilderContext`, its element type. The name keeps it apart from `GrammarContext<G>`.

A term's position is its bit in every mask, in every grammar. A test holds the tuple at 31 terms or fewer, since bit 31 is `Unproven` (§6). A grammar's table names only these terms, and a grammar that needs a new one adds it to the vocabulary first, as a feature adds a kind.

| term | required by | permitted inside |
| --- | --- | --- |
| `Break` | `break` | a loop or a `switch` |
| `Continue` | `continue` | a loop |
| `Return` | `return` | a function body |
| `Await` | `await` | an async function, or a module root that allows top-level `await` |
| `Yield` | `yield` | a generator |
| `NewTarget` | `new.target` | a non-arrow function or a class body |
| `Abstract` | an abstract member | an abstract class's body |
| `Visibility` | a visibility or accessibility modifier | where the language permits one |
| `Receiver` | a receiver (`self`) parameter | an impl or trait body |
| `Variadic` | a C-variadic parameter (`...`) | a foreign block, or a function pointer type |
| `Nonlocal` | `nonlocal` | a function body |

## 2. Declaration

`contexts` is a top-level key of `sittirGrammar`, beside `rules` and `options`. It is a function of `$`, and returns one entry per term the grammar enforces. The TypeScript entries for five of its terms:

```ts
contexts: ($) => {
	const loops = [slot($.for_statement, 'body'), slot($.for_in_statement, 'body'), slot($.while_statement, 'body'), slot($.do_statement, 'body')];
	const functionBodies = [$.function_declaration, $.function_expression, $.generator_function_declaration, $.generator_function, $.method_definition].map((k) => slot(k, 'body'));
	const arrowBody = slot($.arrow_function, 'body');
	const classBodies = [slot($.class_body, 'members'), slot($.class_static_block, 'body')];
	return {
		Break: {
			requiredBy: [$.break_statement],
			providedAt: [...loops, slot($.switch_statement, 'body'), slot($.labeled_statement, 'body')],
			boundedAt: [...functionBodies, arrowBody, ...classBodies]
		},
		Continue: { requiredBy: [$.continue_statement], providedAt: loops, boundedAt: [...functionBodies, arrowBody, ...classBodies] },
		Return: { requiredBy: [$.return_statement], providedAt: [...functionBodies, arrowBody], boundedAt: classBodies },
		Yield: {
			requiredBy: [$.yield_expression],
			providedAt: [slot($.generator_function_declaration, 'body'), slot($.generator_function, 'body'), slot($.method_definition, 'body')],
			boundedAt: [slot($.function_declaration, 'body'), slot($.function_expression, 'body'), arrowBody, ...classBodies]
		},
		NewTarget: { requiredBy: [$.meta_property_new_target], providedAt: [...functionBodies, ...classBodies], boundedAt: [] }
	};
}
```

The full tables for typescript, python and rust are in the probe's `tables.mts`, which checks them against the grammar sittir generates.

- **`requiredBy`** lists kinds. A node of that kind needs the term.
- **`providedAt`** lists (kind, slot) pairs. A child placed there has the term discharged.
- **`boundedAt`** lists (kind, slot) pairs. A child placed there with the term still needed is refused.
- **Any slot not listed** for a term passes it through. An arrow function's body passes `NewTarget` through and bounds `Yield`, which is why the facts are kept per term.
- **The root bounds every term it does not provide**, so the root kind's slots need no listing as a bound. A term the root allows is listed in `providedAt`, as TypeScript's top-level `await` is (`slot($.program, 'statements')`).
- **A kind may be a variant form enrich mints.** `meta_property_new_target` is the hoisted `new.target` arm of `meta_property`, so `NewTarget` needs no new kind and `import.meta` stays unrequired.
- **`slot(kind, name)`** is a DSL helper beside `field` and `alias`, with erasable syntax only. Under tree-sitter's CLI run, `sittirGrammar` drops `contexts`, so the parser never sees it.

**Validation.** Each of these is a blocking diagnostic when the grammar compiles. `tables.mts` runs the kind, slot and overlap checks as a prototype:

| code | condition |
| --- | --- |
| `context-unknown-term` | a key the vocabulary's tuple does not declare |
| `context-unknown-kind` | a kind that is not a visible kind with a parser-issued kind id. A hidden or inlined kind has no node to stamp, and a phantom kind has no id for the reader. |
| `context-unknown-slot` | a slot the kind does not have |
| `context-provided-and-bounded` | the same (kind, slot) both provides and bounds one term |
| `context-unrequired` | a term with an empty `requiredBy` |

## 3. Soundness: a missing kind costs a refusal, never a false one

Where the kind that would decide a rule is missing, the table over-approximates:
- **a provider lists the shared kind.** No async function kind exists in TypeScript, so every function body provides `Await`;
- **a bound leaves the shared kind out.** Rust's impl bodies cannot tell a trait impl from an inherent one, so they pass `Visibility` through.

The rule is then not enforced for that distinction, and the gap is listed (§11). But nothing valid is refused.

**The gate.** The validator rebuilds every corpus tree in `verifyStructure: 'runtime'`, where every bound is checked. A context refusal there is either an invalid corpus entry or a table defect. Each refused entry must be rejected by the language's own compiler for the same reason, or the table is fixed.

The probe ran this check over each grammar's corpus with the tables below:
- 116 typescript entries refused 2;
- 115 python entries refused 6;
- 148 rust entries refused 8.

All 16 are fragments the compiler rejects for the context the table names: a `declare module` body holding `break` and `return`, module-level `return` and `await`, free functions with `self`, and a C-variadic definition outside an extern block.

## 4. Model stamps

The compiler resolves the block once, after link, into stamps on the model:
- `contextRequires: number` on a kind;
- `contextProvides: number` and `contextBounds: number` on each (kind, slot).

These are masks in the vocabulary's bit order. The emitters read only the stamps: nothing downstream re-reads the block or matches names. A missing or misspelled fact fails generation, never a build.

## 5. Types

Today's builders are not generic: `buildWhileStatement(config): T.WhileStatement.Bound`. With contexts, a builder becomes generic over each node-valued slot from which a requiring kind is reachable. The emitter computes that reachability from the model, and leaves and unreachable slots stay as they are.

```ts
declare const ContextSet: unique symbol;
export type Needs<N extends BuilderContext> = number & { readonly [ContextSet]?: N };
export type NeedsOf<X> = X extends { readonly $needs: Needs<infer N> } ? N : never;
type Bounded<B, A extends BuilderContext> =
	[Exclude<NeedsOf<B>, A | 'Unproven'>] extends [never] ? unknown : { readonly $needs: Needs<A | 'Unproven'> };

declare function buildWhileStatement<P extends Admit<T.ParenthesizedExpression>, B extends Admit<T.Statement>>(
	config: { condition: P; body: B }
): T.WhileStatement.Bound<NeedsOf<P> | Exclude<NeedsOf<B>, 'Break' | 'Continue'>>;

declare function buildFunctionDeclaration<B extends Admit<T.StatementBlock>>(
	config: { name: …; body: B & Bounded<B, 'Return' | 'Await' | 'NewTarget'> }
): T.FunctionDeclaration.Bound<never>;
```

- **`$needs` is a runtime member.** It is the mask (§6), so the type describes a member that exists. The phantom key refines the number's type, the way the generated `__booleanKeyword__` brands already refine keyword booleans. It is not an admission brand: admission still reads the tree token or `$render`.
- **`X.Bound<N extends BuilderContext = BuilderContext>`.** The default is every context, as ruled. A wide annotation (`const s: T.Statement = …`) holds any node, and placing it at a bound is refused, because its type no longer proves what it needs.
- **Lists:** `C extends Admit<T.Statement>[]` with `NeedsOf<C[number]>`.
- **A providing slot** returns `Exclude<NeedsOf<B>, Provided>`.
- **A bounding slot** intersects its parameter with `Bounded<B, Provided>`. Each kind's provided set is fixed, because every entry is a kind. The refusal reads as the unmet context at the end of the message: `'"Break"' is not assignable to '"Unproven" | FunctionBody'`.
- **`Unproven`** is the name for needs the types do not track: parsed nodes, loose-built nodes, and wide annotations of them. A bound's type admits it, and the runtime check decides (§7).

**Cost** (tsc 7.0.2, from the probe's workloads over the real TypeScript node types):
- Loading the types is unchanged, at about 1.4 s.
- Contexts add 18–20 µs of check time and about 2 instantiations per builder call, against 3–10 µs per call today.
- A file with 500 builder calls gains about 10 ms. The probe's largest file, about 151,000 calls, goes from 3.0 s to 5.7 s.

This is reported, not gated. The declarations' growth, a type parameter per reachable slot, is measured when the emitter exists.

## 6. The runtime mask

- `$needs` is a 32-bit mask: bits 0–30 are the vocabulary's terms in tuple order, and bit 31 is `Unproven`.
- A built node holds it as an own data property. A parsed node reads it from its arena row.

Every builder computes it at construction, in both modes. For each slot, `contribution` is the OR of the child masks with the slot's provided bits cleared. The node's own mask is:

```
needs(node) = contextRequires(kind)
            | OR over slots of contribution(slot) & ~contextBounds(slot)
            | OR over slots of contribution(slot) & contextBounds(slot)   // unmet: carried up, never dropped
```

- An unmet need is carried upward. So a node that violates a bound keeps the violation visible to every later bound and to the root. For a built node, the bound's check (§7) has already thrown.
- A parsed root whose mask is not zero is source that breaks a context rule. Reading it is not an error; the mask makes it a queryable fact.
- **One table.** The masks live in `hooks.structure[kindId].contexts`: `{ requires, slots: { [key]: { provides, bounds } } }`. That is the per-kind structure table the `verifyStructure` plan introduces, keyed by kind id alone.
- One helper, `needsOf(kindId, node, table)` in `packages/common`, computes the mask with bit operations only. Every builder calls it, and the emitter writes no per-kind arithmetic.

## 7. Where it is checked, and `verifyStructure`

**A bounding slot checks its children:** `contribution & bounds === 0`. The emitter calls `checkBound(kindId, slotKey, contribution, table)` only for slots with a nonzero `bounds`, and the root's slots are among them. Whether the check runs:

| child's mask | `'compileTimeOnly'` (default) | `'runtime'` |
| --- | --- | --- |
| no `Unproven` bit (built and typed) | skipped: the types proved it | the verifier checks it |
| `Unproven` bit (parsed, loose-built) | checked at the bound | checked at the bound |

- This follows the runtime-checks ruling: a fact the types prove has no default check, and a fact they cannot prove always runs.
- The `Unproven` test is a test of data, not of the mode, and the mode choice stays fixed at engine construction.
- A bound that has checked an `Unproven` child clears the bit in its own contribution. So each subtree is checked once, at its nearest bound.
- **In `'runtime'` the verifier recomputes the masks** from the children rather than trusting the stamps, and checks every bound. That catches a JavaScript caller that bypasses the types.
- The `Unproven` bit is set by:
  - the reader, on every parsed node;
  - the loose and coerce builders (`.from()`, plain-structure input), whose input types do not carry needs;
  - `engine.attach` of a node from another engine.
- The refusal names the term, the bounding kind and slot, and the requiring kind's path:
  `FunctionDeclaration.body: 'Break' is not provided here (needed by BreakStatement at body.statements[0].consequence)`.

## 8. Composition

- **Several terms** are bits, combined by OR and discharged per slot.
- **A provider inside a bound** (a loop in a function body) discharges first, and the bound sees what is left.
- **A bound inside a provider** (a function inside a loop) stops the outer provider from reaching in: `while (c) { function f() { break; } }` is refused at `f`'s body, as ECMAScript requires.
- **A term a slot passes through**, such as `NewTarget` through an arrow function's body, continues upward unchanged.
- **Inverted rules:** a construct allowed in many places and forbidden in a few uses the same three facts. `Visibility` is one in both grammars that have it:
  - **TypeScript:**
    - it is required by `accessibility_modifier`;
    - it is provided at each member kind's own `accessibility_modifier` slot, and at the constructor's parameters (§11, gaps);
    - the root bounds it, so a modifier on a function's parameter is refused.
  - **Rust:**
    - it is required by `visibility_modifier`;
    - it is provided at a block's `statements` and at the root;
    - it is bounded at a trait's body and an enum's variant list.

## 9. Parsed nodes and rebuilding

- **The reader** stamps bottom-up in the same pass that writes the arena row, from the same table, emitted into the Rust crate's generated tables. Each parsed node's mask carries the `Unproven` bit. Reading never refuses: the parser accepted the source, and the mask records what it needs.
- **`$with` and list edits** rebuild through the builder (`rebuilt`), so the new node is stamped and checked like a fresh build. Ancestors are immutable and keep their masks until the caller rebuilds them, which stamps them again.
- **Edits on a parsed tree** (`$edit`, still open in the node query API) splice data keyed by tree and index. A splice recomputes the masks along the path from the splice point to the root, and checks at every bound it crosses. It always checks, because the spliced tree is parsed and its nodes are `Unproven`.
- **Native.** When the arena writer moves to native, the builders' stamping and the bound check move with the write, as the runtime-checks ruling places every writer check. The table is already native for the reader.

## 10. The portable surface

- **At run time** the portable builders build through the grammar's builders, so the masks and checks are the same.
- **For types**, the terms are vocabulary terms with one bit order, so portable types carry `Needs` over the same names the grammar's builders use. Each language's portable builders are generated from the same table as its grammar builders, so code written against one language's portable surface gets the same proof.
- **Code generic over `G`** gets it wherever the builder's type is concrete at the call. Where the type stays deferred, a bound cannot be shown, which is the limit any other `G`-generic builder argument has.
- **One bit order** also means a mask keeps its meaning when a node crosses engines. `attach` rebuilds a built node, and re-wraps a parsed one with its row's mask.

## 11. Census: coverage, and the kinds the rest waits on

**Coverage.** These are the census's early-error rows, run through the probe's kinds-only tables (`coverage.tsv`):

| grammar | early-error rows | refused now | waiting on a kind | outside the bound's reach |
| --- | --- | --- | --- | --- |
| typescript | 30 | 8 | 2 | 20 |
| python | 7 | 5 | 0 | 2 |
| rust | 7 | 4 | 2 | 1 |

- **TypeScript, refused now:**
  - `break` and `continue` outside a loop;
  - `continue` in a labeled block that is not a loop. The witness has no enclosing loop, so `Continue` refuses it, while label scoping itself stays outside;
  - `yield` outside a generator;
  - `return` and `new.target` at the top level;
  - an abstract member outside an abstract class;
  - an accessibility modifier on a function's parameter.
- **TypeScript, waiting on a kind:**
  - `await` in a non-async function waits on async function forms;
  - a parameter property on a method that is not the constructor waits on the constructor kind.
- **TypeScript, outside:**
  - labels (1: `break` to an undefined label);
  - members named `constructor` (5: a node's own combination, not a context);
  - strict mode (6);
  - regex flags (2, lexical);
  - duplicate parameters (1);
  - checker rules on syntax newer than the 1.8 spec (5).
- **Python, refused now:** `return`, `await` and `yield` at module level, `nonlocal` at module level, and `break` outside a loop. **Outside:** duplicate parameters (names), and a bare starred expression (a position rule within one statement).
- **Rust, refused now:** `self` in a free function (`Receiver`), `...` outside an extern block (`Variadic`), and visibility on an enum variant or a trait item (`Visibility`). **Waiting on a kind:** `break` outside a loop, and visibility on a trait-impl item. **Outside:** `const async` (a node's own combination).

**Gaps: distinctions with no kind.** Each row says what the table does today (over-approximated, §3), what waits, the route to a real kind, and the stage that provides it.

| distinction | grammar | today | census rows waiting | route to a kind | stage |
| --- | --- | --- | --- | --- | --- |
| the constructor in a class body | typescript | `method_definition`'s parameters provide `Visibility`, so a member modifier on any method's parameter is accepted | parameter property outside a constructor | bindings.scm claims it by a predicate today (`#eq? @name "constructor"`); it becomes a kind authored at the class-body site | grammar-bindings wiring, 2c (planned there) |
| async functions | typescript (function declarations and expressions, generators, arrows, methods) | every function body provides `Await` | `await` outside an async function | the optional `async` authored as arms, which enrich mints as variant forms | none yet |
| generator methods | typescript | method bodies provide `Yield` | none | `method_definition`'s `*` as an arm; the acceptance plan's accessor task already splits `method_definition` into arms | none yet |
| `for await` | typescript | not required | none | an arm of `for_in_statement` | none yet |
| abstract fields | typescript | not required | none | an arm of `public_field_definition` | none yet |
| `async def`, `async for`, `async with` | python | every function body provides `Await`; the loops are not required | none | arms | none yet |
| an unlabeled `break` | rust | `Break` is not declared: a labeled block is the plain `block` kind, so a labeled `break` cannot be told from one that needs a loop | `break` outside a loop | `break_expression`'s label as arms. The unlabeled form requires `Break`; the labeled one requires nothing, since label scope is out of scope | none yet |
| a trait impl | rust | impl bodies pass `Visibility` through | visibility on a trait-impl item | `impl_item_body`'s `trait_clause` as arms | none yet |
| async functions and closures | rust | every function and closure body provides `Await` | none | arms | none yet |

## Questions

Rulings return through brainstorm.

1. **The gaps with no stage.** Each fills with authored arms that enrich mints as variant forms, so each adds kinds and builders.
   - (a) Plan them as a stage of the acceptance authoring plan, which already authors arms in the same rules (recommended). Its gate is that valid input parses to the same trees apart from the new kinds.
   - (b) Leave them listed until a feature needs one.
2. **The constructor kind**, planned in the wiring plan's 2c.
   - (a) Author it as its own rule at the class-body site, with the token `constructor` as its name, so `$type` decides it and object-literal methods keep `method_definition` (recommended).
   - (b) A general bindings mechanism that turns a `#eq?` predicate claim on a fixed text into a kind.
