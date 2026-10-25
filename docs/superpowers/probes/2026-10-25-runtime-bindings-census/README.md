# Runtime bindings census

The wiring plan's runtime bindings generator stage (`docs/superpowers/plans/2026-10-10-grammar-bindings-wiring.md`) starts with a census: per grammar, the build, `is` and `kinds` entries and the flags each guard tests, compared with the routes. This one also records what has shipped of the generator plan's (`2026-10-06-binding-generator.md`) namespaces, build and crossing stages and of its scalar follow-up, the questions the specs and rulings leave open, and the stage's source files.

Measured at `84097cd38` (master). `run.sh [checkout]` reruns it; `results/summary.txt` and `results/detail.txt` hold the output. It reads each grammar's generated rows (`packages/<g>/src/portable.ts`: `rows`, `queryFlags`, `querySlotFlags`), its routes (`node-model-portable.json5`), its low-level model (`node-model.json5`, for `variantOf`, model types and fixed text), the vocabulary through codegen's own reader (`readVocabulary`, `readVocabularySource`), `compositions.ts` and the shared path list.

## 1. What has shipped

| piece | state |
| --- | --- |
| namespaces, `kinds` and `is` | **Shipped**, through the portable surface plan (`2026-10-18-portable-surface.md`): the shared trees `portable.kinds` and `portable.is` (`packages/common/src/portable/`), each language's view (`<lang>.is.portable`), the per-grammar rows in the generated `portable.ts`, and `createEngine(lang, { api: 'portable' })` exposing `kinds` and `is`. The per-level counts are recorded in each `node-model-portable.json5` (`namespaces.levels`). |
| flag guards in `is` | **Not shipped.** `is` has no flag leaves and guards test no flag. A flag is read only through the query facet's per-kind plans (`queryFlags`, `querySlotFlags`). |
| placed read entries | **Rust 35**, at the placement ratchet's ceiling (`packages/tools/tests/portable-placement-ratchet.test.ts`). All 35 are the closure-parameter claim, `(closure_parameters (_) @declaration.parameter)`, one entry per concrete pattern kind. Node-only guards skip a placed entry, so a closure parameter reads as no parameter. The portable surface plan ruled it restated as an envelope at the `closure_parameters` site; that has not landed. |
| conformance to zero | **Not shipped.** There is no `portable-conformance` tool. The binding generator probe's `conformance.py` is the only classifier, and no count has been taken at master. |
| type maps | **Not shipped.** No `ViewForm`, `VocabViews`, `ViewByKind` or `Backward`. |
| read (portable `parse` and `render`) | **Not shipped.** |
| build | **Not shipped.** The routes carry what a build reads: each read entry's literal pins, each member's slot path. Two ratchets pin the gaps: members with no build path (python 3, rust 1, typescript 0; `unbuildable-routes.test.ts`) and wildcard-claimed kinds missing a required member's route (0; `wildcard-unrouted.test.ts`). |
| scalar contracts | **Vocabulary side shipped**: `Literal.Number` is `number \| bigint`, `.Float` `number`, the big-integer feature's kinds `bigint`; `Literal.Boolean` is `boolean`, `.True` and `.False` their literals. The runtime adaptation belongs to build and crossing and has not shipped. |
| crossing (`attach`) | **Not shipped.** |
| the `Flags` enum | **Shipped**: `packages/types/src/vocabulary/flags.ts`, 28 bits, written and checked by `bindings-inventory`. One type test reads it; no runtime code imports it, and `@sittir/types` exports no path to it. |
| exclusions | **Not shipped in either form**: no rule-derived pairs, and none of the builder exclusions spec's `exclusions:` block, stamps or `excludedBy`. Builder contexts are unshipped too. |

Against the wiring plan's items: `kinds` and `is` per path, keyed by `$type`, are shipped; `build`, the chain steps and their flag guards, `$exclusions`, the imported flags object and the runtime scalar contracts are not.

## 2. The census

| | rust | python | typescript |
| --- | --- | --- | --- |
| paths read, of 604 | 330 | 220 | 322 |
| exact / decided by the read entries | 155 / 175 | 140 / 80 | 210 / 112 |
| kind ids with read entries | 249 | 141 | 219 |
| read entries: all / conditional / placed | 479 / 169 / 35 | 213 / 72 / 0 | 360 / 115 / 0 |
| fixed-text kind ids | 150 | 107 | 172 |
| kind ids with a flag table; (kind, flag) pairs | 38; 53 | 8; 8 | 43; 101 |
| flags read, of 28 | 13 | 3 | 16 |
| slot-flag rows (kind, slot, flag) | 585 | 8 | 507 |
| features composed | 40 | 37 | 46 |
| flag guards on the paths read: all / read / unread | 142 / 93 / 49 | 49 / 9 / 40 | 422 / 301 / 121 |
| paths with a claim of their own: one kind / a pick | 253 / 47 | 184 / 8 | 265 / 28 |
| paths read only beneath (no builder of their own) | 30 | 28 | 29 |
| (kind, path) entries: plain / literal / child kind / text / template / placed | 276 / 36 / 131 / 2 / 0 / 35 | 144 / 43 / 5 / 23 / 1 / 0 | 247 / 57 / 57 / 1 / 0 / 0 |
| pick groups no member name tells apart: fixed-text leaves / varying leaves / with members | 9 / 2 / 8 | 0 / 0 / 3 | 4 / 3 / 4 |
| member routes: slot / nested / presence / kind | 337 / 57 / 16 / 8 | 221 / 11 / 0 / 0 | 378 / 70 / 19 / 29 |
| flag members | 47 | 8 | 101 |
| members with no build path | 1 | 3 | 0 |
| `literal.number` / `literal.boolean` paths read; kinds claimed there | 10; 8 | 13; 11 | 16; 16 |

How to read it:
- **Exact** paths decide by kind id alone; the rest run the classifier, since their kinds also read elsewhere.
- **Flag guards** are the pairs (path, flag) where the grammar's composition declares the flag on the path or a path above it (the base declarations plus the composed features'). A guard is **read** when a kind at or under the path has a plan for the flag. An unread guard answers false for every node, and its build step is refused at run time, since route gaps stay out of the types (bindings spec §4.4). By flag:
  - rust: `const` 18, `async` 11, `default` 10, `unsafe` 10;
  - python: `disposable` 15, `override` 6, `mutable` 5, `default`, `generator` and `static` 3 each, `debug` 2, `abstract`, `async` and `const` 1 each;
  - typescript: `definite` 38, `disposable` 16, `default` 14, `static` 13, `mutable` 10, `async` 8, `abstract`, `declare`, `optionalChain` and `readonly` 4 each, `typeOnly` 2, `debug`, `generator`, `group` and `optional` 1 each.

  Python's `static` is the decorator envelope's fact, which has not landed; its `generator` is marked by the body.
- **A path with a claim of its own** gets a builder. A **pick** chooses among several kinds or forms; hidden and supertype kinds are left out, and a form counts as its base unless the base is a supertype. `detail.txt` lists each pick. A path **read only beneath** (`declaration`, `expression.binary`) has guards but no builder.
- **Entries by refinement:** a literal entry presets a pinned literal (`build.expression.binary.arithmetic.add` fills `operator: '+'`); a child-kind entry narrows a slot to a node kind; a text entry runs a `#eq?` or `#match?` predicate as a guard at build; a template builds from its holes.
- **Pick groups no member name tells apart** have the same member names and no refinement test (`detail.txt`):
  - Fixed-text leaves are told apart by their const string, through the enum's text table (generator spec §2.4): `type.primitive` and its integral levels, `literal.boolean`, rust's macro fragment keywords, typescript's visibility keywords.
  - Varying leaves have nothing to tell them apart but their text, which a build never reads (generator plan, build stage): rust `comment.text` (block, doc, line) and `literal.string.text` (raw content, string content); typescript `literal.string.text` (three fragment kinds), `identifier.property` (private, plain) and `identifier.property.shorthand` (identifier, pattern).
  - Groups with members are told apart by a member's value kind (rust `declaration.struct` brace/tuple, `clause.match.arm`, `literal.character`), by a preference (rust token-tree and macro delimiters, python `with` parentheses, typescript string quotes), by the parent slot (python's class-body block) or by nothing (typescript `expression.update` prefix/postfix, which the generator plan already names as needing `.prefix` and `.postfix`).

## 3. Open questions

The specs and rulings settle the surface (bindings spec §3.3 and §9, generator spec §2.4 and §2.5). These five are left open.

**1. Stage order against the zero-rejection rule.** The generator plan: "A grammar's portable members ship only at zero rejected members"; until then "its typed views, read and build ... are not emitted into the package." The wiring plan puts `build` in this stage, gated by "the portable type-check ratchet (per-grammar error count) only falls". Conformance has no tool and no count at master.
- (a) The order as written: the conformance tool and rust's count to zero, then the type maps and read, then build.
- (b) This stage ships the runtime now: flag guards, the build tables and `build` keyed by path and `$type`, the pick, the scalar adaptation, and the portable round-trip lane, which checks the runtime over the corpus without types. The vocabulary-typed module is generated outside the package, its error count is the ratchet the wiring plan names, and it moves into the package at zero. Until then the portable `build`'s input is typed loosely.

Recommendation: (b). It is the only reading under which both plans hold, and the round-trip lane proves the build before the types exist.

**2. Where exclusions come from.** The bindings spec (§3.3, §10 item 19), the generator spec (§2.4), the generator plan's build stage and the wiring plan all derive exclusions from the grammar's rule: the facts it never spells together. The later builder exclusions spec, which records the user's rulings, makes them authored, builder-only data: an `exclusions:` block that "never reaches enrich, wire or the parser". It finds most exclusions accepted by the parser and refused only by the language's compiler, which a rule derivation cannot see. Its §8 says the portable builders build through the grammar's builders, so they check the same groups. Reading the later spec as governing:
- This stage ships its steps without exclusion narrowing. The narrowing and the structure check arrive with the exclusions primitive: the step types read its stamps (`exclusionGroups`), and the runtime check is the grammar builder's own `excludedBy`.
- The four earlier documents are restated to the exclusions spec, docs only, on master.

Recommendation: both, once confirmed.

**3. Where the `Flags` object lives.** The bindings spec (§3.4) puts the generated enum in the vocabulary's `flags.ts`, and the wiring plan has the runtime import it from there. The portable surface plan keeps `@sittir/types` type-only, which is why the path list was emitted into `@sittir/common/portable`. `Flags` is the only runtime declaration in `@sittir/types/src`, and nothing exports it.
- (a) Export it from `@sittir/types` (`./vocabulary/flags`), so the package is no longer type-only.
- (b) The inventory writes it to `packages/common/src/portable/flags.ts`, beside the path list, and §3.4 is restated. Its only type-level reader is one test.

Recommendation: (b), the path list's precedent.

**4. How a build picks among kinds and forms.** The generator spec (§2.4) has the build pick a polymorph's form or a supertype's subtype "by the routing the `ir` and loose builders already use (`buildFactoryNodeFromReference`)". That routing dispatches on a parsed node's own kind, which already names its form, and it lives in `packages/tools`, which the runtime cannot import. Nothing today picks a form from a structure's members. The census counts 47, 8 and 28 picks.
- Recommendation: codegen derives a pick table per path from the routes (which members are present, and their value kinds) and emits it into the rows. A pick the table cannot decide is a codegen diagnostic, so it fails at compile time, never as a runtime guess. The validator's dispatch stays as it is, since its input names its kind.
- A form told apart only by a preference (delimiters, quotes) follows the preference channel's ruling: the render options pick it, the grammar's default when none are given.
- The varying leaves and `expression.update` get vocabulary paths of their own, as the generator plan rules. They are vocabulary and bindings edits, like the renames.

Question: do they ride the renames stage, or open this one?

**5. The closure-parameter residue.** Rust's 35 placed entries are one claim, ruled to be restated as an envelope at the `closure_parameters` site. That edit is to the bindings and the grammar, not the runtime.

Recommendation: its own small PR before this stage's code, so that every guard this stage generates agrees with the routes' read tests, the wiring plan's gate.

## 4. Source files, and the overlap with engine-api

Under recommendations 1(b), 2, 3(b) and 4.

| item | hand-written sources | generated |
| --- | --- | --- |
| flag guards in `is` | `packages/codegen/src/bindings/vocabulary-paths.ts` (each path's flags); `packages/common/src/portable/{tree,index,classify}.ts` (flag leaves, the guard, the flag test through the rows' plans with `query-holds.ts`'s `holds`, unchanged); `packages/types/src/portable.ts` (`PortableRows` carries the flag plans); `packages/codegen/src/emitters/overlays/portable/{index,surface}.ts` | `packages/common/src/portable/vocabulary-paths.ts`; each bound grammar's `portable.ts` |
| the `Flags` object | `packages/codegen/src/bindings/{flags,flags-module}.ts`; `packages/tools/src/inventory/index.ts` (the writer and `--check`) | `packages/common/src/portable/flags.ts`, replacing `packages/types/src/vocabulary/flags.ts` |
| build tables and the pick | `packages/codegen/src/emitters/overlays/portable/build.ts` (new), `index.ts`, `surface.ts`; `packages/codegen/src/bindings/routes.ts` only if a build inverse the routes lack turns up | each bound grammar's `portable.ts`, `api.ts`, `descriptor.ts` |
| `build` at run time, with refinement builders, flag steps, envelopes and the scalar adaptation | `packages/common/src/portable/build.ts` (new), `index.ts`, `tree.ts`; `packages/common/src/create-engine.ts` (`assemblePortableEngine` builds through a low-level engine); `packages/types/src/engine-api.ts` (`PortableEngine.build`, `PortableSurface.build`); `packages/types/src/portable.ts` (the build table); `packages/codegen/src/emitters/{engine,index-file}.ts` (the descriptor's and API's `build`) | as above |
| the portable round-trip lane | `packages/tools/src/validate/` (a new lane) and its wiring in `validate:native` | its baseline row, recorded new |

Engine-api's next master PRs touch `packages/common/src/node-data.ts`, `snapshot.ts` and `utils.ts`. This stage edits none of them. `classify.ts` keeps reading `nodeText` and `spanOf` from `node-data.ts` without change. Two files it does edit may be on engine-api's path: `packages/common/src/create-engine.ts` and `packages/types/src/engine-api.ts`, both for the portable engine's `build`.
