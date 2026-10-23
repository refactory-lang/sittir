# Leaf render and node JSON Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** every parsed and built leaf renders itself (`$render()` and `toString()`). Every node serializes to a stable JSON form (`toJSON()`), and `JSON.parse(text, engine.reviver)` rebuilds it.

**Architecture:**
- **One member emitter.** Both features add members through `nodeMemberLines` (`packages/codegen/src/emitters/node-members.ts`). The builders and the wraps already share it, so record-backed wraps inherit both.
- **Leaves get a wrap.** Today a parsed leaf crosses as plain data, because `wrapNode` returns any kind that has no wrap entry unchanged. One shared `wrapLeaf` per grammar is emitted from the same member lines and registered for every text-leaf kind.
- **One slot table.** JSON writes and reads slots through the existing per-kind `querySlots` table. It rebuilds through the coercer's existing build-by-kind path (`_resolveByKind`), which `{ $type, … }` tags already use.

**Tech Stack:** TypeScript codegen emitters, generated `@sittir/<lang>` packages, the `@sittir/common` runtime, vitest.

**Owner:** sittir-coordinate (moved from sittir-implement, 2026-10-20), paired with sittir-test.

## Rulings (maintainer, 2026-10-16 and 2026-10-17)

- **Leaves stay nodes.** A leaf keeps `$type`, its tree token and its trivia, and is never flattened to a string. Admission is unchanged: a leaf is admitted by its tree token or by `$render`.
- **`toString()` on every node** returns its `$render()` text, as an AST node's string form is expected to be. Leaves are not a special case.
- **JSON keys:**
  - kind names, never ids;
  - accessor names for slots, which are the spelling the node API, `$with`, the build config and queries already share (`hashBangLine`).
- **JSON holds structure, leaf text and comments only.** Layout, source gaps, the tree token, coordinates, `$with` and storage keys are left out, so a revived node renders with the engine's formatting.
- **Comments are Babel-style.** `leadingComments`, `trailingComments` and `innerComments` are arrays of comment leaves, each omitted when empty. On revive they go back through `$trivia`.
- **Units and kind-enum values** are written as `{ "$type": "<name>" }` and revived to the kind id. A keyword presence is written as `true`, or omitted when false.
- **Parse errors:** `toJSON` writes an `ERROR` or missing node as `{ "$type": "ERROR", "$text": … }`, and the reviver refuses it by path.
- **The reviver is the only way back.** There is no `fromJSON`. The reviver builds through the internal build-by-kind path that the generic build entry will expose later, and that public entry stays its own decision. An unknown kind or slot throws, naming its JSON path.
- **The round-trip runs as a corpus vitest**, not as a validator row.
- Bare kind-id units get no `$render`, since they become records in the arena step.
- **Members are own enumerable properties.** `toString` and `toJSON` are members of the node literal that `nodeMemberLines` writes, like `$render`, `$trivia`, `$with` and the accessors. `nodedata-shape.test.ts` pins that `Object.keys` lists those. One rule covers every node member. `JSON.stringify` calls `toJSON` whether or not it is enumerable, so the rule doesn't affect serialization. Making the members non-enumerable is the separate `$with`-enumerability case, outside this plan.

## Order with the arena work

The arena plan (`2026-10-10-arena-tables.md`, on `feat/records`) changes how a leaf is stored, not the leaf's surface. One emitter path derives that surface.

- **This plan lands first.** `wrapLeaf`, the leaf `Parsed` types, and `toString`/`toJSON` in `nodeMemberLines` go to master, and `feat/records` takes them at its next master merge.
- **The arena work builds on it.** Task 9's record-backed wraps take their node members from `nodeMemberLines`, which that plan's Task 9 step 1 now states. A parsed leaf on the record wire is a tag-2 cell (kind, start, end, row) with no record. Its record-backed wrap hydrates the cell into the same `wrapLeaf` members, with `$text` decoded from the cell's byte span.
- **Arena Stage B touches no TypeScript emitter.** It changes the Rust core, the derive, codegen's Rust render emitter and the napi methods. The leaf types are not touched by either plan's arena tasks.

## Constraints

- Generated outputs are never hand-edited. Regen and `validate:native` go to sittir-exec.
- Explanations live in `docs/glossary/`. The public API (`NodeMethods`, `Engine.reviver`, `NodeJSON`) carries JSDoc.
- Tasks 0 and 1 landed on master (`c91509f99`, `e79be18a5`). Tasks 2–4 are on `feat/node-json` in `scratchpad/wt-node-json`.

## What landed differently

The census and the corpus round trip found these, each ruled and pinned:

- **Kind names resolve through the model.** A model kind the parser also issues under an alias display id (rust `_let_chain`, typescript `_lhs_expression`, python `_simple_statements` and `_simple_pattern`) writes its model name, and the reviver resolves names through the generated `kindIdFromName`, never a reverse of `KIND_NAMES` (`jsonFacts.kindId`).
- **Three more facts on `jsonFacts`:**
  - `spread`, the kinds whose builder takes `(options?, ...items)`, which is the model's factory shape;
  - `options`, each kind's registered option slots by accessor name;
  - `textEnvelopes`, the alias envelopes built from their content's text. They revive through the envelope's own text check, so a property name may be a word the content kind reserves.
- **One slot spelling.** Config keys are the accessor names, which landed on master first. The reviver passes accessor names straight to the builder.
- **List holes.** Only a list slot whose element admits a hole (`hasOptionalElements`) keeps `undefined` items; `null` there means a hole. Every other list drops absent items. `[a, , b]` renders `[a,, b]`.
- **Kind ids in mixed slots.** A loose slot that stores some kind ids keeps only its own; any other number goes to the slot's resolver.
- **C3.1 exception.** Nine rust corpus roots fail at a match arm's `pattern`, because the arm's whole guarded pattern and the pattern inside it share that key. The fix renames the arm's field `match` through grammar bindings, which no grammar applies yet. The corpus test names those roots, and a named root must still fail. Roots whose parse holds an `ERROR` are outside the contract.
- **Examples.** `structuralShape` is gone. The dogfood contract and the round-trip examples compare `JSON.stringify(node)`.

## Facts this plan rests on (master `37cea2c41`)

| fact | where | measured |
|---|---|---|
| Builders and wraps share `nodeMemberLines` for `$render`, `$trivia`, `$query`, `$snapshot` and `$engine` | `node-members.ts`; called from `factories.ts` (4 sites) and `wrap.ts` (2) | read |
| A parsed text leaf has no wrap entry, so `wrapNode` returns its data unchanged | `packages/<lang>/src/wrap.ts::wrapNode` | text-leaf kinds: python 12, regex 13, rust 16, scm 3, typescript 11; no other kind lacks a wrap |
| A leaf's `Parsed` type extends only `HoldsTree`, while its `Bound` type extends `NodeMethodsOf` | `packages/<lang>/src/types.ts` | rust: 16 `Parsed extends HoldsTree` |
| A built leaf has `$render`, `$trivia` and `$engine`, but no `toString` | `raw.ts::buildIdentifier` | read |
| `querySlots` lists every accessor of every wrapped kind by kind id, under its accessor name | `packages/<lang>/src/utils.ts` (type `QuerySlots`) | 0 accessors missing in all 5 grammars |
| The coercer builds any kind by name from a loose config (`_fromMap`, `_resolveByKind`), and a leaf tag takes `{ $type, text }` | `factories/coerce.ts` | read |
| `$trivia.leading()` with no items returns that side's entries | `common/src/utils.ts::triviaSide` | glossary |
| `triviaFacts.layout` is the set of layout kind ids, so any trivia entry outside it is a comment | `packages/<lang>/src/utils.ts` | read |
| The unit kind set (`unitKindIds`) is emitted only to Rust (`kind_ids.rs` `units`). No TypeScript table holds it, and the text-leaf set exists in TypeScript only as the coercer's `_leafRegistry` keys | `emitters/wrap.ts::unitKindIds`, `emitters/kind-id-rust.ts`, `factories/coerce.ts` | read |
| Arena Stage B files: `sittir-core` (cells, side record, built trivia table), `sittir-node-macros` (record writer, `…Record<'a>` views, `HasRecord`), `emitters/render-module.ts` (prepare generic over the fields trait), and the napi methods. Arena Task 9 files: `emitters/wrap.ts` (record-backed wraps beside today's), `common/src/engine.ts`, and `common/src/read.ts` | `2026-10-10-arena-tables.md`, Tasks 8 and 9 | read |
| No `sittir tool` reports per-slot value shapes or which read kinds the coercer can build. `walk` counts kinds only | `sittir tool --help` | read |

## Review Focus

1. **A leaf inside a template string.** `${leaf}` must give the leaf's text for a parsed leaf, a built leaf and a list item. Test: Task 1.
2. **A list slot in JSON.** An accessor returns a list view, not an array, so `toJSON` must write an array; otherwise `JSON.stringify` writes the view's own fields. Test: Task 2.
3. **A tree with parse errors.** `ERROR` has no builder, so it serializes and the reviver refuses it by path. Test: Task 3.
4. **Kind-enum and keyword-presence slots.** Each must round-trip as the same value, not as a node. Tests: Tasks 2 and 3.
5. **`verifyStructure: 'runtime'`.** A revived node goes through the engine's `settle`, so JSON missing a required slot is refused by the verifier under `'runtime'`, and by the native decode at render under the default. Test: Task 3.

---

### Task 0: Census (no code)

**Files:** no existing tool covers this census, so it is a new tool, `sittir tool node-json-census`, following the tool conventions in `.claude/project-workflow.md`:
- create `packages/tools/src/census/node-json-census.ts` (`export async function run(opts: NodeJsonCensusOptions)`);
- re-export it from `packages/tools/src/index.ts`;
- create `packages/cli/src/commands/tool/node-json-census.ts` and register it in `toolModules`.

Its output for the five grammars is committed as `docs/superpowers/probes/2026-10-17-leaf-json/census.txt`.

For each of the five grammars, the tool reports:
1. the text-leaf kinds with no wrap, by name;
2. the kinds a read of the corpus can produce that are not keys of `_fromMap` (kinds the reviver could not build);
3. the value shapes `querySlots` accessors return (node, list view, kind id, boolean, string, undefined), by kind and slot;
4. the comment kinds: the trivia kinds minus `triviaFacts.layout`.

**Done when:** the census is committed, and each non-empty row of item 2 is resolved in this plan or ruled out.

### Task 1: Every leaf renders itself

**Files:**
- Modify `packages/codegen/src/emitters/node-members.ts`: add `toString: () => node.$render(),` to `nodeMemberLines`.
- Modify `packages/codegen/src/emitters/wrap.ts`: emit one `wrapLeaf(data, tree)` per grammar from `nodeMemberLines({ accessors: [], parsed: true, inner })`, keeping `data.$type`. Add a `_wrapTable` entry for each text-leaf kind id. The text-leaf set is the model's one fact, `isPatternLeaf` (every pattern node with a kind id): `wrapLeaf` registration and the census both read it. `leafTextChecks` is a different fact, the kinds a bare string can build, which also holds lexed compounds and aliases of a pattern leaf (those have wraps) and leaves out a pattern with no text pattern of its own, so it stays as it is.
- Modify `packages/codegen/src/emitters/is.ts`: emit `is.<kind>` for every node kind, leaf kinds included (pattern, keyword, punctuation, enum).
- Modify the types emitter, so a leaf's `Parsed` extends `NodeMethodsOf` beside `HoldsTree`.
- Modify `packages/types/src/engine-api.ts`: add `toString(): string` to `NodeMethods`, with JSDoc.
- Examples: `07-read-source.ts:15`, `09-type-guards.ts:11`, `12-cross-language-migration.ts:22` (the `member.name()` call only), `14-format-preserving-transform.ts:14`, and `23-read-query-with.ts:94` if Task 0 shows the parameter is a leaf. These move from `engine.render(x)` to `x.$render()`, or to `${x}` inside template strings.
- Glossary: in `emitters.md`, `wrapLeaf`, `nodeMemberLines`, and the `is.ts` entries that say per-kind guards exist only for structural kinds (they now say every node kind has one); in `compiler-model.md`, `isPatternLeaf`; in `packages-types-src.md`, `NodeMethods`.

**Contracts (for sittir-test):**
- C1.1 A parsed leaf (rust `fn f() {}`, `name()`) has `$render()` equal to its text, `toString()` equal to `$render()`, and `` `${leaf}` `` equal to its text.
- C1.2 The same holds for a built leaf (`rs.build.identifier('x')`) and for a leaf that is a list item (typescript parameters).
- C1.3 A parsed leaf keeps `$type` (the kind id), its tree token and `$trivia`. It passes `rs.is.identifier`, and a strict slot still admits it (`$with.name(leaf)` renders).
- C1.3a Every node kind, leaf or structural, has `is.<kind>`: a pattern leaf (`is.identifier`), a keyword or punctuation unit read as its kind id, and an enum, each narrowing a node or a bare kind id the way a structural kind's guard does.
- C1.4 At the type level, `leaf.$render()` and `leaf.toString()` type-check on `T.Identifier.Parsed` (`expectTypeOf`).
- C1.5 A structural node's `toString()` equals its `$render()`.
- C1.6 Each changed example's output is unchanged (the examples' own tests).
- C1.7 In `nodedata-shape.test.ts`, the leaf and branch shape cases still pass. `Object.keys` now also lists `toString` and `toJSON`, as own enumerable members like `$render` (see Rulings), so that expectation gains both.

**Gates:**
- The regen diff is limited to `wrap.ts` (the leaf wrap and its table entries), `types.ts` (leaf `Parsed`), and the `toString` line in builders and wraps.
- `validate:history` is equal for all five grammars.
- The full suite, type-check and lint pass.

### Task 2: `toJSON` on every node

**Files:**
- Create `packages/common/src/node-json.ts` with `nodeJSON(node, facts): NodeJSON`.
- Modify `nodeMemberLines`: add `toJSON: () => nodeJSON(node, jsonFacts),`.
- Modify the utils emitter to emit `kindFacts = { leaves, units }`, each set from its one derivation:
  - `leaves` is the text-leaf kinds that `wrapLeaf` registers, from the same function;
  - `units` is `unitKindIds(nodeMap)`, which `kind_ids.rs` already emits.

  Also emit `export const jsonFacts = { slots: querySlots, names: KIND_NAMES, layout: triviaFacts.layout, kinds: kindFacts }`.
- Modify `packages/types/src/node-surface.ts`: add `NodeJSON` (with JSDoc), and add `toJSON(): NodeJSON` to `NodeMethods`.
- Glossary: in `packages-common-src.md`, `nodeJSON`.

**What `nodeJSON` writes:**
1. `$type` is `facts.names.get(node.$type)`, the kind name.
2. A leaf (a node with `$text`) also writes `$text`.
3. Each `[accessor]` of `facts.slots[node.$type]`, read through its accessor:
   - `undefined` is omitted;
   - a list view or array becomes an array;
   - a kind id becomes `{ $type: <name> }`;
   - `true` is written, `false` is omitted;
   - a string or a node is written as it is, and `JSON.stringify` calls the child's own `toJSON`.
4. `leadingComments`, `trailingComments` and `innerComments` hold each side's entries whose kind is not in `facts.layout`, and each is omitted when empty.

**Contracts:**
- C2.1 `JSON.parse(JSON.stringify(fnItem))` for rust `fn f(a: u8) {}` is `{ $type: 'function_item', name: { $type: 'identifier', $text: 'f' }, parameters: { $type: 'parameters', … }, body: { $type: 'block', … } }`. Its only keys are `$type`, `$text`, accessor names and the three comment keys.
- C2.2 The JSON holds no `$source`, `$_layout`, `_<storage>` keys, `$with`, tree token or coordinates. In `nodedata-shape.test.ts`:
  - the JSON serialization cases are rewritten to this shape;
  - the `it.fails` case "`$with` is not included in `JSON.stringify()`" becomes a plain `it`;
  - the freeze cases, and the `$with` enumerability and `Object.keys` cases, are outside this plan and stay as they are.
- C2.3 A list slot writes an array, an empty list writes `[]`, and an absent optional slot is omitted.
- C2.4 A rust `// x` line comment before an item appears as `leadingComments: [{ $type: 'line_comment', $text: '// x' }]`. Blank lines and indentation do not appear.
- C2.5 A kind-enum slot (python comparison operators, rust binary operators) writes `{ $type: <name> }`, and a keyword presence writes `true`.
- C2.6 A parsed node and a built node of the same source give equal JSON.
- C2.7 An `ERROR` node writes `{ $type: 'ERROR', $text }`.
- C2.8 A string slot (scm `escape_sequence.content`) writes its string as it is, and no kind is inferred from the text.

### Task 3: `engine.reviver`

**Files:**
- Modify the coerce emitter: export `buildByKind(name, config)`, the existing `_resolveByKind` with a leaf's `$text` mapped to `text`, and expose it on the language hooks.
- Modify `packages/common/src/create-engine.ts`: add `reviver(key, value)`, a function bound to its engine (an arrow function in the engine's closure), so `JSON.parse(text, rs.reviver)` works without `.bind`. For `key !== ''` it returns `value` unchanged. At the root it walks the parsed value inside the engine's handle, building each `{ $type }` object children first and tracking its JSON path, and returns the result through `settle`.
- Modify `packages/types/src/engine-api.ts`: add `Engine.reviver`, with JSDoc.
- Glossary: in `packages-common-src.md`, `reviveNode`.

**The walk:**
- A kind name resolves through `kinds`. An unknown name, or `ERROR`, throws with its path: `$.body.statements[2]: unknown kind 'foo'`.
- A key outside `$type`, `$text`, the three comment keys and the kind's `querySlots` accessors throws: `$.name: function_item has no slot 'nmae'`.
- What the kind is decides how it revives, from the stamped `kindFacts`, never from which keys the object has:
  - a kind in `units` revives to its kind id;
  - a kind in `leaves` builds through `buildByKind(name, $text)`;
  - every other kind is a compound and builds through `buildByKind(name, slots)`, even with no slot keys.
- Comments go back through `$trivia.leading(...)`, `.trailing(...)` and `.inner(...)`.

The walk runs once at the root, not in each reviver call. The order is the same, children first, and it is the only way to know the path, because JSON's reviver passes only the key.

**Contracts:**
- C3.1 Round-trip: `JSON.stringify(JSON.parse(JSON.stringify(n), rs.reviver))` equals `JSON.stringify(n)` for every corpus root of the five grammars without parse errors. This is a corpus vitest that loops over the corpus once per grammar.
- C3.2 A revived node renders under the engine's options. It is not byte-equal to the source where the source's layout differed; that is intended.
- C3.3 The unknown-kind and unknown-slot errors each name their path, at depth 0 and at depth 3.
- C3.4 A node embedded in a larger document (`{ "file": "a.rs", "ast": {…} }`) revives in place, and the fields that are not nodes are untouched.
- C3.5 Under `verifyStructure: 'runtime'`, JSON missing a required slot is refused at `JSON.parse`. Under the default it parses, and is refused at render.
- C3.6 The reviver refuses a tree containing an `ERROR` node, naming its path.
- C3.7 Comments revive: a rust item with a leading line comment round-trips, and its render includes the comment.
- C3.8 Kind facts, not JSON shape: `JSON.parse('{"$type":"block"}', rs.reviver)` is a built `block` with `statements()` equal to `[]`, not a kind id. A unit, such as rust `{ "$type": "mutable_specifier" }` or a python comparison operator, revives to its kind id.
- C3.9 The reviver is bound: `const { reviver } = rs; JSON.parse(text, reviver)` revives the same as `JSON.parse(text, rs.reviver)`.
- C3.10 A string slot (scm `escape_sequence.content`) revives through `buildByKind` as the same string, with no kind inferred from the text.
- C3.11 A list's empty element is `undefined` on both wires (its type is `X | undefined`). `JSON.stringify` writes it as `null`, and the reviver brings a `null` list item back as `undefined`: regex `a||b` and typescript `[a,,b]` round-trip with the empty element `undefined`.

### Task 4: Gates, review and PR

- Regen, `validate:native` and `validate:history` go to sittir-exec, and every row must be equal.
- The full suite (the corpus round-trip included), type-check, lint, and `scripts/comment-slop-check.sh --working` must pass. There is no Rust change, so no cargo gate.
- Run a Codex adversarial review with `--base master`, and put its dispositions in the PR body.
- Open a PR into master. Its body starts with the owner line and carries the validation rows.
