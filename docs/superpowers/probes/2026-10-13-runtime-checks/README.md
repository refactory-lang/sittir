# Runtime checks: where each runs, and where it should

The question: how should runtime checks be gated? The principle under test is that **whoever writes the arena runs the check, once, native or on the client.**

This census lists every runtime check on master at 65c823510: where it runs, which path triggers it, who writes the data on that path today, and which checks run twice for the same text. A recommendation per check follows. No code changed.

## Who writes the data today

| path | writer | what native does |
|---|---|---|
| **read** (`parse`, a slot accessor) | native: tree-sitter parses, `ParsedTree` holds the tree and its tables | everything; the client only wraps coordinates |
| **build** (`ir.*` strict, `.coerce`, `.from()`) | the client: the builders write a plain JavaScript object graph (`$type`, `$text`, slots) | nothing until render, when the transport decode copies the object graph into typed transport structs, renders, and drops them |
| **edit** (`$with`, list edits, trivia writes) | the client: a draft object over coordinates, with replaced children and sides written in JavaScript | resolves the coordinates and renders at render time |
| **validator rebuild** (built-render-parse, factory/ir storage rows) | the client: it rebuilds through the same builders from read data | as for build |

There is no shared arena yet; the arena-tables plan moves built nodes into native tables. So today the client writes on every path except read, and native sees built data only as a per-render decode.

## The checks

| # | check | where it runs | triggered by | per grammar |
|---|---|---|---|---|
| 1 | **Leaf non-empty** (`text must be non-empty`), on a text leaf whose pattern rejects `""` | emitted builder (`raw.ts`, `buildLeafGuards`) | build, edit, rebuild | 10–12 builders in python/rust/typescript |
| 2 | **Leaf pattern** (`_leafRe_<factory>`, anchored `^(?:…)$`) | emitted builder | build, edit, rebuild | rust 28, regex 26, python 24, typescript 18 |
| 3 | **Token-interior slot pattern** (`_slotRe_<factory>_<slot>`) | emitted builder (a guard on the slot value); also probed by the coercer's `spelledInterior` to decide whether to strip the delimiters | build, edit, rebuild; the probe on coerce only | typescript 65, python 64, rust 44 |
| 4 | **Reserved word** (`_reservedWords_<factory>`, the `reserved.global` wordset; per slot, by stamped wordset id, as implement ships it) | emitted word builder; also a type (`_ReservedWord_`) that refuses a literal at compile time | build, edit, rebuild | python only today |
| 5 | **Keyword text at a slot** (`rejectKeywordText`: an identifier spelled as one of the slot's keyword arms) | emitted builder, after `rejectBareText`, via `@sittir/common` | build, edit, rebuild | typescript 20, rust 19, python 6 |
| 6 | **Bare text in a strict slot** (`rejectBareText`: a strict factory takes a built node, not a string) | emitted builder | build (strict), edit | typescript 444, rust 401, python 219 |
| 7 | **Admission** (`Admit<V>`: `$render`, or the tree token) | types at compile time. At run time, `assertHoldsTree` refuses a coordinate without its token; `engine-scope` refuses a node read through another language's engine | build, edit, render | all |
| 8 | **Coerce arm resolution** (`_resolveOne`, `_resolveBareText` over `_TEXT_KINDS_BY_RANK`, the `$type` tag checks, `kind-enum slot: … not a valid value`) | emitted coercer and `common/runtime.ts` | `.coerce`, `.from()` | all |
| 9 | **Coerce leaf pre-check** (`_buildGuardedText`: `values`, then `_leafRegistry[kind].pattern`) | emitted coercer | `.coerce`, `.from()` | all |
| 10 | **Required slot** | types at compile time (strict); `Missing required slot '…' on ….from()` (coercer); native decode at render (a required transport field is a bare `SlotValue`, so its absence fails the decode) | `.from()`; render | all |
| 11 | **Non-empty list** (repeat1) | `_assertNonEmpty`, mostly in the emitted builder (raw: rust 27, python 31, typescript 15; coercer: python 3, typescript 1); native decode at render (`NonEmptyVec`: `a repeat1 list holds no item`) | build, edit, rebuild; render | all |
| 12 | **Coordinate validity** (`treeId … names no tree`, `index … names no node`, `$span`/`$end` missing, a span outside the source) | native (`napi_engine`, `slot.rs`) | render, edit, query | all |
| 13 | **Kind id validity** (`kind {k} is not a kind id`) | native decode | render | all |
| 14 | **Verbatim text shape** | native decode | render | all |
| 15 | **Render option admission** (a value the site does not admit is refused with its path) | native (`options.rs`) | render with options | all |
| 16 | **Read shape** (`ReadError::Missing / Overfull / Interior`: a parsed node that does not fit the model, or a token whose text the interior regex cannot split) | native reader | read | all |
| 17 | **Trivia writes** (`trivia: … is not an extra`, inner-site and empty-node checks) | client (`common/utils.ts`) | edit | all |

Every guard in 1–6 runs unconditionally; none is behind a debug flag (the always-run ruling).

## Checks that run twice on the same text

1. **Leaf pattern on the coerce path, up to three times.**
   - `_resolveBareText` tests each ranked text kind's pattern to choose an arm.
   - `_buildGuardedText` tests the chosen kind's `_leafRegistry` pattern again.
   - The builder then tests `_leafRe_<factory>`.
   - The registry holds a **second copy of the same regex**: literal-identical to `_leafRe_buildIdentifier` in typescript, and for a token kind built separately with `new RegExp(TOKEN_INTERIORS[kind].regex)`. So one fact is emitted from two or three places.
2. **Token-interior slot on the coerce path, twice.** `spelledInterior` tests `_slotRe_…` to decide whether to strip the delimiters, then the builder tests it again as its guard.
3. **Non-empty list, twice at different times.** The builder refuses at build (`_assertNonEmpty`), and the native decode refuses again at render. **A required single slot** is refused at build only by `.from()`. A strict build is checked only by its type, then natively at render: late, far from the call that caused it.
4. **The validator rebuild re-checks text the parser already accepted.** The rebuild sends parsed leaf text back through the builders' guards (1–5), though tree-sitter's lexer already validated it on read. This is one check per write, so it fits the principle; it is listed because it is the same text checked twice.
5. **Reserved word and keyword-at-slot can both fire** on one identifier, when a reserved word is also one of the slot's keyword arms. The word builder fires first (check 4), so check 5 is unreachable for that text. These are two facts, the wordset and the slot's arms, not a duplicate; noted for the per-slot reserved-word design.
6. **Token interiors are compiled on both sides.**
   - The client compiles `_slotRe_` (JavaScript syntax) to guard a build.
   - The transport macro compiles the same interior as a Rust regex (`(?s)…`) to split parsed text into slots on read.
   - These are two uses of one pattern, not two checks of one text. They are two derivations of the literal, though, and the macro's compile check is the only proof that the Rust form is valid.

## Recommendation under the principle

Today the client writes every built and edited node. So the principle puts checks 1–6 in the builders, where they already are, and says the coercer must not repeat them. When the arena lands and the builders write native tables, checks 1–6 move native with the write.

| # | check | today | under the principle |
|---|---|---|---|
| 1, 2 | leaf non-empty and pattern | builder | **The builder now; native at the arena write later**, one compiled regex per leaf kind, emitted from the same `anchoredLeafRegex` source as the Rust literal. Feasible: tree-sitter patterns have no lookaround, and the macro already compiles every token interior as a Rust regex. Two syntax differences need care, not a new derivation: JavaScript `\u{…}` is Rust `\x{…}`, and the `u` flag has no Rust equivalent. |
| 3 | token-interior slot | builder guard plus a coerce probe | The same move as 1–2. The probe is a decision, not a check; it stays with whoever decides the spelling (the coercer today). The guard runs once, at the write. |
| 4 | reserved word | builder (python) | **Cannot be folded into the slot regex natively**, because Rust `regex` has no lookahead. Natively it is the pattern plus a static set per wordset id (a sorted slice or phf map), keyed by the stamped wordset id the per-slot design gives each slot. Keep the TypeScript literal-exclusion type: it is compile time, not runtime. |
| 5 | keyword text at a slot | builder | Native at the slot write later: the slot's keyword-arm set, by the same stamped ids. |
| 6 | bare text in a strict slot | builder | **Stays on the client.** It is about the form of the JavaScript argument (a string where a node is required), which exists only on the client. |
| 7 | admission | types, `assertHoldsTree` | **Split by fact.** The tree token is a JavaScript symbol, so the client checks that it is present. Native checks that the handle it names is live (check 12, already there). These are two facts, not a duplicate. |
| 8 | coerce arm resolution | coercer | **Stays on the client.** It interprets loose input; it does not validate a write. It should choose the arm without re-testing a pattern the write will test: see 9. |
| 9 | coerce leaf pre-check | coercer | **Remove.** It duplicates 2 with a second copy of the regex. `_resolveBareText`'s ranking can read the builder's `_leafRe_` constants (one emitted literal) until the patterns move native, and the build's own guard is the one check. |
| 10, 11 | required slot, non-empty list | required: `.from()` at build, native at render; non-empty: builder at build, native at render | **Once, at the write.** Under the arena, the native write refuses at build time and the client copies go. Before the arena, the client writes, so the builder is the one check: a strict builder should also refuse an absent required slot at the call (today it is only a type) rather than leave it to the render decode. The render decode's refusal then guards only data that bypassed the builders. |
| 12–15 | coordinate, kind id, verbatim text, render options | native | **Stay native.** Native consumes these, and they are refused once, where they are read. |
| 16 | read shape | native reader | **Stays native.** The parser writes; this is a model-drift diagnostic. |
| 17 | trivia writes | client | The client now; native when trivia writes go to the arena (the trivia-table plan). |

## Two things to decide

1. **Strict-build required slots before the arena.** Today an absent required slot on a strict build is refused only by the native decode at render. Should the builder refuse at the call now, which the principle says (the client writes, so the client checks), or should it wait for the arena?
2. **The coercer's text-kind ranking** (`_resolveBareText`) infers a kind from a bare string's text by pattern rank. The ruling "no kind inference from text" says a bare string is the content of the slot's sole or default leaf. Is the ranking in scope for that ruling? If so, check 9 and most of check 8's pattern probing go away with it.

## Plan: type-proved checks behind `verifyStructure`

The ruling: **a fact the generated types prove gets no runtime check by default, on the native side and on the client alike.** An engine option chooses: `verifyStructure: 'compileTimeOnly' | 'runtime'`, default `'compileTimeOnly'`, fixed at construction. The validator constructs with `'runtime'`. Checks the types cannot prove always run, whatever the option.

### Refinement: native decode is not a check

The native side has no check to switch off today. Every native refusal of built data happens while the transport decode turns a JavaScript value into a Rust type the renderer relies on:

- a `repeat1` list into `NonEmptyVec` (`a repeat1 list holds no item`);
- a required slot into a bare `SlotValue`, not an `Option`;
- `$type` into the matching transport struct;
- verbatim text into its string;
- render options into `Options`.

Skipping any of these means one of two things. Either the Rust types weaken (`Vec` for `NonEmptyVec`, `Option` for a required slot), and the renderer gains a branch for a case the types used to exclude. Or the decode trusts the input, and a JavaScript caller that bypasses the types reaches a panic, which aborts the process unless the binding catches unwinds. Neither is a saving. The decode already reads the length, the field and the kind, so the refusal costs nothing extra.

**So the native decode refuses in both modes. That refines the ruling: it is the type boundary, not a duplicate check.** The option reaches native when native gains a verification step beyond decode. That happens when the arena writer lands: native then writes built nodes, and the client checks below move with the write. Until then, `NativeEngineOptions` gets no new field, because there is nothing to gate. Today those refusals are napi's own conversion (`NonEmptyVec`'s `FromNapiValue`, the derived object codecs), not a sittir check. The question returns when the record/arena codec replaces napi's object decode: that codec is sittir's, and whatever it checks beyond building the Rust value is gated then.

### Census: proved by the types or not

| # | check | proved by the types? | in `'compileTimeOnly'` | in `'runtime'` |
|---|---|---|---|---|
| 1, 2 | leaf non-empty and pattern | no: the text is a `string` | runs | runs |
| 3 | token-interior slot pattern | no | runs | runs |
| 4 | reserved word | only for a literal argument (`_ReservedWord_`); a wide `string` is not | runs | runs |
| 5 | keyword text at a slot | no: dynamic strings | runs | runs |
| 6 | bare text in a strict slot (`rejectBareText`) | **yes**: a strict slot's type is a built node | off | verifier |
| 7 | admission: the tree token, and the engine's language | no: these are identity facts, and two languages' node types can coincide structurally | runs | runs |
| 8 | coerce arm resolution | not a check: it is how loose input is read, so its "matches none" refusal is the result | runs | runs |
| 9 | coerce leaf pre-check | removed by the one-literal change | — | — |
| 10 | required slot: strict builders, and `.from()`'s `_requireField` | **yes**: a positional argument, a `Config` key without `?`, or an empty default; see the invariants below | off on the client; native decode refuses at render | verifier, plus native decode |
| 11 | non-empty list (`_assertNonEmpty`) | **yes**: `repeat1` is typed `NonEmptyArray` | off on the client; native decode refuses at render | verifier, plus native decode |
| 12 | coordinate validity | no | runs | runs |
| 13 | kind id | decode (the `$type` dispatch and the query kind filter's `u16`) | native decode | native decode |
| 14, 15 | verbatim text, render options | decode | native decode | native decode |
| 16 | read shape | no: the parser writes | runs | runs |
| 17 | trivia writes | no: whether a node is empty, or has an inner site, is a run-time fact | runs | runs |

The reader's `Unrouted` diagnostic (a child left over after routing) is not an engine option today. It is the default-off cargo feature `read-debug-checks`, a compile-time switch. Question 2 below asks whether it should stay one.

### The invariants that make "proved" true

Each is a codegen diagnostic. A violation fails generation; it never becomes a runtime check.

1. A strict builder takes `Partial<Config>` only when every required slot of the kind has an empty default. Today those are typescript 9, rust 12, python 2, regex 4 and scm 1 builders, such as `buildTryStatement` with `body` defaulting to an empty block.
2. `.from()` emits `_requireField` for a slot only when the slot's `LooseConfig` key is required. An optional input never reaches a required slot without an empty default.
3. Every `repeat1` slot is `NonEmptyArray` on every surface that takes it: strict, loose and `$with`.

### The client mechanism

**One table.** The emitter writes a per-kind structure table into the language hooks: `hooks.structure[kindId] = { required, nonEmpty, nodeOnly }`, slot storage keys with their `Type.slot` names. It derives the table from the same model predicates that type the builders: `isRequired`, the `repeat1` fact behind `NonEmptyArray`, and the node-valued slot fact behind `rejectBareText`'s emission. The builders stop emitting `_assertNonEmpty`, `rejectBareText` and `_requireField`. A ratchet test holds the factories at zero of each.

**One verifier.** `verifyStructure(node, table, seen)` lives in `packages/common/src/verify-structure.ts`.
- It walks a built node depth-first.
- It skips coordinates, because a parsed node's shape is the reader's (check 16), and it skips nodes already in `seen` (a per-engine `WeakSet`).
- For each node it checks the row: required keys are present, `nonEmpty` arrays have an item, and `nodeOnly` slots hold no `string` or `bigint`. Then it adds the node to `seen`.
- Its refusal texts are today's (`Program.statements: a strict factory takes a built node, not a string; …`, `sequence_expression.children …`), so the messages do not move; only where they are raised does.

**Chosen at construction, so no per-call branch.**
- Every top-level build already passes through the engine's own proxy (`scopedBuild`'s `apply` in `create-engine.ts`). `assembleEngine` builds that `apply` once:
  - `'compileTimeOnly'`: `inEngine(handle, run)`, as today;
  - `'runtime'`: `inEngine(handle, () => settle(run()))`.
- The same choice goes on the engine handle as `settle`: the identity function, or the verifier bound to this engine's table and `seen`.
- `rebuilt` (`$with`, list edits), which does not pass through the proxy, ends with `handle.settle(result)`. That is one call to a function fixed at construction, with no test of the mode.
- A builder called without an engine has no handle and is not settled, as today.
- There is no environment variable and no module-level flag. Two engines in one process (a user's and the validator's) each keep their own mode.

**One check per write.** A coerce call builds its children through raw builders inside the same top-level call; the verifier sees the finished result once. Nested user calls (`build.a(build.b(…))`) are each top-level, and `seen` stops the outer one from walking the inner result again. So each built node is verified once per engine.

**Trade-off.** In `'runtime'` mode a refusal is raised when the outermost call returns, not inside the inner builder. The message names the kind and slot, so the location is still exact; the stack is shallower. In `'compileTimeOnly'` mode a JavaScript caller that bypasses the types gets the native decode's refusal at render. That is the ruling's intent.

### Public API

`CreateEngineOptions` gains `verifyStructure?: 'compileTimeOnly' | 'runtime'`. Its JSDoc on the `createEngine` surface:
- `'compileTimeOnly'` (the default) trusts the generated types for required slots, non-empty lists and strict-slot node values.
- `'runtime'` also checks them when a node is built or rebuilt, and throws naming the kind and slot.
- Text checks (leaf patterns, reserved and keyword words), coordinate checks and read checks run in both modes.

The rationale stays in the glossary entry for `verifyStructure`.

### Tasks

1. **Invariants first.** Add the three codegen diagnostics. Red test: a synthetic grammar with a `Partial` builder over a required slot that has no default fails generation. Regenerate; there is no diff.
2. **The table and the verifier.** Emit `hooks.structure`. Write `verify-structure.ts` with unit tests over a synthetic table: required, non-empty, node-only, coordinate skip, and the `seen` skip.
3. **The option.** Add the option, the construction-time `apply`, and `handle.settle` in `rebuilt`. Red tests per language: in `'runtime'`, an empty `sequenceExpression` and a strict string are refused at the build call, and so is a `$with` that empties a `repeat1`. In the default mode the same calls build, and render refuses them natively.
4. **Drop the emitted guards.** Remove `_assertNonEmpty`, `rejectBareText` and `_requireField`, add the zero-copies ratchet, and regenerate. The tests that pin today's build-time refusals (`bare-text-input`, the non-empty and required tests) construct their engine with `'runtime'`. Each is first reproduced red in the default mode, so it is changed because the ruling moved it, not on faith.
5. **The validator constructs with `'runtime'`.** Gates: validation history equal for all five grammars, the full suite, type-check, lint, and cargo plus clippy unchanged. Report build throughput in both modes as operation counts, not a gate.

### Questions

1. In `'runtime'` mode, is a refusal at the end of the outermost call acceptable, given that the message names the kind and slot?
2. Should the reader's `Unrouted` diagnostic stay the compile-time feature `read-debug-checks`, or join `'runtime'`? Joining means compiling it in always and reading the mode on each read.
3. Should native decode stay in both modes? This is the refinement above. If the answer is no, the plan needs weakened Rust types and a fallback in the renderer for every `repeat1` and required slot.
