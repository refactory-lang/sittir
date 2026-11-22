# Generated Portable Builders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** each grammar's portable layer is generated code: typed per-path build functions over the low-level loose builders, and a per-kind projection. The emitter writes them through the pinned `@sittir/typescript` builders. The run-time interpreters, `PortableRuntime` and the shipped tables go.

**Spec:** `docs/superpowers/specs/2026-11-13-portable-generated-builders-design.md`. Read it first. This plan argues from it and doesn't restate it. Decisions 1, 2, 3, 6 and 7, "a parse returns the projection" and the export rows are approved, and 4 and 5 are emitter-internal.

**Prototype:** `probe/portable-generated` (`packages/tools/src/portable/prototype/`). Task 4 moves its emitter into codegen.

**Executor:** sittir-design, by the user's ruling of 2026-11-14. **Reviewer:** sittir-brainstorm, at the end of every task. Each task lands as its own PR.

## Global Constraints

- **Worktree:** `scratchpad/wt-vocab-rulings`, a branch from `origin/master`. No new worktrees. Pathspec commits. No force, stash, amend, rebase, revert or abort. Push by literal sha.
- **Generated outputs are never hand-edited.** Fix the emitter and regenerate.
- **No run-time mapping.** Generated code may call shared value helpers (text and number spelling), never a table walker.
- **No string fallback in the emitter.** A construct the pinned builders can't express is `portable-emit-pinned-gap`.
- **One source per fact:**
  - a slot's path set comes from the read routes;
  - a path's placement from the build table;
  - a path's node types from `PortableIds`;
  - a path's flags from its arms and facts.
- **No tolerance between sittir paths.** Until the interpreter is removed, the generated build and the interpreter agree on every corpus structure, or the difference is a listed row the user has ruled on.
- **Three-way verification** before every commit that can change what the pipeline reads, renders, parses or validates: targeted probes, `pnpm run validate:history` compared with numbers, and the full suite with any new failure isolated. Type-only commits also run `pnpm run type-check:tests` and the workspace `pnpm run type-check`.
- **Type-check time** is measured against the baseline and reported. It never gates.
- **Ratchets only tighten.** The emit diagnostics start at the counts Task 4 measures and only fall.
- **Hand-written source in `packages/{codegen,common,tools,types}/src` carries no explanatory comments.** Docs carry no PR or task numbers.

### Task 1: The pin loads only pinned

**Status:** the `pinned-build-unpinned` guard (Steps 1–3, first half) comes from sittir-implement. The child's emit mode (`portableBuild`) is built on `feat/portable-build-emitter`, with Task 4.

**Files:**
- Modify: `packages/codegen/src/bootstrap/pinned.ts`
- Modify: `packages/codegen/src/bindings/read.ts`, `pinned-reader.child.ts` (the emit mode's request type)
- Test: `packages/codegen/src/bootstrap/__tests__/pinned.test.ts`

- [ ] **Step 1: The failing test.** Under the workspace tsconfig, an in-process `loadPinnedBuild()` throws `pinned-build-unpinned`, naming the path the pinned `@sittir/common` resolved to. Under `tsconfig.pinned.json` it loads, and an arena engine from it parses.
- [ ] **Step 2: Run it.** It fails today with the late arena error.
- [ ] **Step 3: Implement** the resolution check in `loadPinnedBuild`, and add the child's emit mode (request: grammar and the emitter's inputs; reply: module text and diagnostics).
- [ ] **Step 4: Run** the test and the bindings tests. Commit.

### Task 2: The emitter type-checks against the pinned declarations

**Status:** done.

**Files:**
- Modify: `packages/codegen/src/bootstrap/bootstrap.ts` (writes `scratchpad/pinned-types/tsconfig.json` into the checkout on every bootstrap); create `bootstrap/pinned-types.ts` and `packages/codegen/scripts/check-pinned-types.ts` (the boundary)
- Create: `packages/codegen/tsconfig.pinned-types.json`, extending it; `packages/codegen/src/emitters/overlays/portable/emit/` (the emitter's directory: `engine.ts` and the type fixture)
- Modify: the root `type-check` script (`type-check:pinned-types`); the emitter's directory leaves codegen's own and build tsconfigs

- [x] **Step 1: The failing case.** A fixture emitter call `t.switchCase({ value, body: [] })` type-checks today, though `body` isn't a key the pinned builder takes: the prototype typed its builders as `Record<string, any>`.
- [x] **Step 2: Implement.** `sittir bootstrap` writes a tsconfig mapping every `@sittir/*` export of the pinned build to the declaration file its `types` condition names, when the pin built it. It extends codegen's tsconfig, so only `paths` change. The emitter's directory type-checks under it.
  - `paths` only redirects: an unmapped subpath or an unbuilt declaration falls through to the live checkout. So `type-check:pinned-types` first lists the emitter program's files (`tsc --explainFiles`) and fails on any `@sittir/*` import, the pinned declarations' own included, that resolves outside the pin (`pinned-types-escape`).
  - One workspace file is admitted, by a relative import: `packages/types/src/portable-build.ts`, the build-table declarations. The emitter reads workspace data, gen's build table, so its input is typed by the workspace's declarations, while the builders it writes through stay pinned. The file imports nothing, and the guard fails once it gains an import, so the allowance can't widen by an edit to that file.
- [x] **Step 3: Run it.** The fixture is an error (TS2345, "an unknown key: body"), held by `@ts-expect-error`; a correct call under the directive is TS2578. The loose config types refuse unknown keys.
- [x] **Step 4: Commit.**

### Task 3: The grammar map carries what the generated signatures need

**Status:** done.
- The tests are `packages/{python,rust,typescript}/tests/build-input.portable.test-d.ts`, in the lane that already holds the map-backed portable tests.
- The node arm types reads as well as inputs, since a read is an input.
- Every routed slot's exact set comes from its read routes, narrowed by its claim's tests. The typed module writes no slot the map types `never`.
- The user widened `declaration.constant.value` and `expression.yield(.delegate).expression` to what python reads, and allowed python's raw-arm ceilings 145 and 2332 for this change.
- Python's getter `parameters` moved to Task 4.
- A map path's `nodes` are the kinds that read as it. `PortableIds` stays family-wide for the guards.
- A slot's exact set is what its read routes return: its own routes, the slots a container contributes, a route slot's fixed texts, a claimed text path, and a varying text as `string`. Derivation arms add nothing (a follow-up PR; python's per-value raw arms 2337 by the user's exception, conformance python 6).
- A path built from text alone declares `$value: string` (decision 8). The bare-text arm keys on the map's `inputs`. `packages/tools/tests/portable/text-values.test.ts` derives the set from the build tables, where an arm that takes a text `$value` is a text arm or a content arm (rust's metavariable).

**Files:**
- Modify: `packages/types/src/vocabulary/{map,input,utils}.ts` (`BuildInput`, `nodes`, the flag sets), `packages/codegen/src/emitters/overlays/portable/grammar-map.ts`
- Modify: the getter vocabulary (`accessors/declaration.ts`, `accessor-signatures/declaration.ts`): a getter takes no `parameters`; setters keep them
- Modify: the vocabulary interfaces of the paths built from text (spec decision 8), `packages/codegen/src/bindings/vocabulary.ts` (a slot's text type), `packages/codegen/src/emitters/overlays/portable/typed.ts` (a view's text `$value` comes from the vocabulary)
- Test: `packages/tools/tests/portable/text-values.test.ts` (the text-value set, derived from the build tables)
- Test: `packages/types/tests/build-input.test-d.ts`

- [x] **Step 1: The failing tests:**
  - python `BuildInput<PythonMap, 'declaration.property.getter'>['$flags']` admits `'async'` (decision 3);
  - a `T.Block.Bound` is assignable to the getter's `body`, and a typescript node isn't (decision 2);
  - typescript `{ $path: 'literal.number', $value: 1 }` is assignable to an array element (decision 1);
  - the getter's input has no `parameters`;
  - python `{ $path: 'identifier' }` is refused, `{ $path: 'identifier', $value: 'x' }` and `'x'` are accepted, and a constant's `name` reads as `'X'` (decision 8).
- [x] **Step 2: Run** `pnpm run type-check:tests`. It fails.
- [x] **Step 3: Implement.**
  - Emit `nodes` per path, from the kinds whose read entries read as that path (`readPathsOf`, the read arms' derivation). `PortableIds` stays family-wide for the guards. Emit the flag sets from the arms and facts.
  - Give each path built from text alone `readonly $value: string` (decision 8). `Read`, `InputOf` and the slot default add its bare text, and the typed views take their `$value` from the vocabulary.
  - Emit the `inputs` additions from the build rows with `builds`.
  - Add `BuildInput`.
  - Make the getter vocabulary edits, and run `tool bindings-inventory --write` for each grammar and `tool vocabulary-features --write`.
- [x] **Step 4: Three-way verification,** then commit.

### Task 3b: No slot is named `content`

**Status:** merged as #1259 (d67a0609516a891a234c3cf988e206754d6fbcf6), 2026-11-16.

The bindings spec's §6 (Names, rule 6; Kinds, rule 2) and §9, and decision 8 here, hold the rulings.
- (a) and (b) are bindings and vocabulary only: container patterns and captures, with no compiler change and no new bindings directive.
- (c)'s widened text rule changes the build table and `takesTextValue`.

**Files:**
- Modify: `packages/{python,rust,typescript}/bindings.scm`:
  - container patterns for `decorator`, rust's `attribute_item` and `inner_attribute_item` (`"!" @inner`), and python's `type`;
  - one capture per renamed slot.
- Modify: the vocabulary interfaces that declare `content`:
  - `Attribute`, `Attribute.Decorator` and `Type` go;
  - `Statement.Import.From` and `.Future`, `Clause.Import.Names`, `Expression.Yield`, `Element.Spread.Parenthesized`, `Statement.Expression`, `Declaration.Ambient`, `Element.TypeArgument` and `Type.Literal` take the spec's names;
  - the comment kinds, `Literal.String.Escape` and the raw strings declare `$value: string`;
  - `decorators` and `attributes` admit what the wrappers hold, and rust's attribute gains the `inner` flag.
- Modify: `packages/common/src/portable/facts.ts` (`takesTextValue`) and `packages/codegen/src/emitters/overlays/portable/build.ts`. The content arm covers a node whose one slot holds a text-built kind, and the arm names the child kind it makes.
- Modify: the interpreter's content arm in `packages/common/src/portable/build.ts`, which makes the child from the text.
- Test: `packages/{python,rust,typescript}/tests/build-input.portable.test-d.ts`, `packages/tools/tests/portable/text-values.test.ts`, and read and build tests per shape.

- [x] **Step 1: The failing tests, one per shape:**
  - a decorator reads as its expression in `decorators`;
  - rust's `#![a]` reads as the attribute with `inner`, and builds back;
  - python's `x: int` reads `type: 'int'`;
  - each renamed slot reads under its new name, and `content` is refused in the types;
  - python's `# x` (a lexed token) and rust's `//x` and `r"a"` (a node whose one slot holds a text-built kind) read `{ $path, $value }`, and each builds back from `$value` and from bare text.
- [x] **Step 2: Run them.** They fail.
- [x] **Step 3: Implement.** Bindings and vocabulary for (a) and (b). For (c), widen the content arm in the build table and keep `takesTextValue` the one predicate. The build table is what Task 4's emitter reads, so the widened arm survives the interpreter's removal in Task 6. The interpreter's content arm makes the child from the text until then.
- [x] **Step 4: Regenerate.** Run the type tests, the text-values guard, `validate:native` (the rows must hold), validate history and the suite.
- [x] **Step 5: Bring the open rows to brainstorm before pushing,** each with before and after:
  - whether python's `literal.string.escape` joins the text paths, as the guard decides (if it does, amend decision 8's list);
  - whether the reader and the interpreter keep rust's container-set `inner` (if either drops it, report before fixing);
  - the `attribute.content` path segment rename;
  - the API rows for the whole task.

### Task 4: The build emitter

**Status:** in progress on `feat/portable-build-emitter`; the bodies held on their holders are built on `feat/portable-body-contents` (stacked on it). There, the member and type declarations nest under the namespaces `declaration.member` and `declaration.type`, and the operator and collection groups are namespaces: a bound name leaves a namespace's segment out (9ca10eff4), and the paths, the portable trees' namespace nodes and their guards move with it (f306683bb). A namespace is left out only when every name beneath it is unique within its parent, so the shift family keeps `shift` (963df888a), and `ofType` takes a namespace as the guards do (037105fbe). A namespace's `Any` holds its aliases, stamped per grammar and read by the guards and `ofType`, and rust's modifier blocks lie beneath `statement.block` (5341f2abc). Slots name their kind-set, with the nine `AnyWith…` types for the unions they share (1760978db).
- Built on the body branch:
  - a slot read through a list container takes the hoist's route, and a list the grammar requires non-empty is non-empty;
  - a switch holds `cases` and a match `arms`; enum, interface, trait, extension, conformance and `expression.class` hold `members`; typescript's static block, function expression and switch case hold `statements` (the case at both levels);
  - a slot's raw arms count the items it reads through a container, and the admission ratchet counts each claimed kind once;
  - the generated build places an arm by the flags its container sets, compiles a `through` container, and seats refined kinds;
  - the generated build picks an arm by the kinds a slot builds (a generated kind function per slot), and a path a holder's kinds test excludes is not an unplaced arm there;
  - a slot picks a number path's arm by its `$value`'s scalar, as the root does, and a path the vocabulary declares a text kind gets no structure case. Go's generated module goes from 432 type errors to 19 at the rule library's b4288e89e; the 3 left in its build are table rows;
  - a kind leaves a family path's reads when no arm of the path builds it and one refinement holds each of its cases: typescript's `declaration.variable` leaves the 18 statement slots that held it (unplaced-path 20 → 9), and rust's slots take only the refined ranges;
  - the module holds `statements` (rust's inline and foreign modules, typescript's namespace and module), and a list read through a container that may be left out, where the list may be empty, keeps an empty container apart from a missing one (`emptyContainer`): `namespace M {}` and `declare module "m";` build back as themselves, and `new Foo()` no longer builds `new Foo`;
  - in a path whose arms no test tells apart, the one arm more than one seat takes is the root build (python's bare tuple, typescript's `f<T>` and string text gain one, `*x` keeps none), and the generated module calls builders that take options (their preference defaults) and passes an arm's own list delimiter flag: unfit-slot python 66 → 64 and typescript 122 → 108, ungenerated python 667 → 494 and typescript 887 → 685;
  - rust's value blocks (`unsafe`, `async`, `const`, `try`, `gen`) hold `statements` and `trailingExpression`, and the generated build fills a container that several slots' routes share once, as the interpreter's frames do: rust's validation numbers are unchanged;
  - rust's structs and enum variants hold `fields` (a unit variant reads none), and the variant base generates: rust unfit-slot 169 → 168, ungenerated 795 → 788;
  - rust's struct literal holds `fields`, and captures of one slot at one path join into one route, so a capture of alternatives reads its items in order; a nested capture whose route has no path is refused rather than dropped. Validation numbers are unchanged. The base stays `fields`' last item, `element.struct.base`, which is the spec's end state; that it comes last becomes a type in Task 8;
  - a slot reads through each form its grammar slot holds and builds through the form that holds its list: a form holding one node is read only (`PortableBuildArm.readOnly`), forms that each hold a list build by what the items fit, and only a route of the same slot takes a form out of the slot's own route, through a supertype too, opening only the supertypes that hold the form. A form holds a list only when the slot's declared arity is a list; where every structure a list form takes the grammar slot's default subtype also takes, the other form is read only, so a tie goes to the default (python's inline suite builds as the indented block). A bare capture beside a nested route through the same field leaves the field its name. A step that enters one form of its grammar slot's kinds holds that form's kinds (`PortableSlotStep.kinds`), and the read refuses a node of another kind there. Python's `with_item` value gives up `as_pattern`, and validation numbers are unchanged.
  - the loops hold `statements` (and rust's `trailingExpression`) through each form their body takes: typescript's bare statement reads and builds braced, python's suites build indented; rust's ungenerated count falls 788 → 782.
  - `if` holds `statements` beside `condition` and `alternative`, `else` and python's `elif` hold `statements`, and rust's `if` and `else` take the block's `trailingExpression`. An `else` whose statements are one `if` builds bare in rust and typescript: where a slot's form holding one node sits beside a form holding the list and its capture names kinds, the route splits into a built route of those kinds, seating only them, and a read-only route of the slot's other kinds; a slot whose only item is one of those kinds builds through the built route in both builds (`buildsOnlyItem`), and two routes of one slot may land on one grammar slot when their kinds don't overlap (`landsTwice`). Every validation number and emit diagnostic count equals the base's; ungenerated rust 782 → 779, typescript 685 → 684.
  - generation refuses a list step that leaves items no route reads (`unreadListItems`). Each kind's `SubKindOf` heritage names every member it restates, written by `vocabulary-features` from the members it declares that a kind above it also declares, and each binding grammar's `tests/vocabulary-restated.test-d.ts` checks those members against the parent's at the grammar's map, the known unfit ones (`unfit-restated.json`) as expected failures. The tools type-check goes from 103.16M instantiations and 20.3 s to 92.56M and 4.67 s; emitted declarations differ only in the restated argument.
  - a function, method, constructor and accessor hold `statements` in all three grammars, and rust's function and method take the block's `trailingExpression`. A list slot every arm of a path routes, each route a list with no empty container, reads `[]` when absent, and both builds build an absent one as `[]` (`readsEmptyWhenAbsent`, in the arm pick and the placement alike); where an arm lacks the route, absence picks that arm (rust's `mod m;`). A route that builds its empty container and cannot be left out refuses an absent slot in both builds: typescript's `new Foo` needs its `arguments`. Validation numbers are unchanged; ungenerated rust 779 → 771, typescript 684 → 681.
  - a step names the form of its grammar slot that holds nothing (`PortableSlotStep.empty`), and an empty list, or an absent one that reads as empty, builds it in both builds: every python `_suite` holder builds `suite_empty` for no statements and `suite_block` only around at least one. `PortableBuildArm.empty` is gone; nothing read it. The empty form is the one kind the step admits that holds no slot and writes no text, and whether a kind writes text is one fact of the model (`writesText`).
  - a context's copy of a variant-bearing choice keeps its default, and a copied supertype finds its variants through its copy base: python's class suite defaults to the class block, as its source defaults to the block. Python's grammar changes only by that default; the parser is unchanged.
  - a class holds `members`: python's items of an indented class block and of an inline class suite, typescript's members of a class body and of an abstract class body. The generated build builds them through the indented block and keeps the inline suite read only. Python's map does not fit the vocabulary at `declaration.class.members` (TS2344): python's class body reads expression statements, literals, identifiers and `pattern.rest`, which the slot's type does not admit. The user ruled to leave it: a python class body running statements is a feature, `executable-class-bodies`, which adds statements and expressions to what `members` admits and retires the error. Until then it is the workspace's one type error, python's portable conformance count is 5 (one error outside the module) against its ceiling of 4, and python's conformance ratchet and build-module type check fail on it.
  - a placed claim steps through a name the grammar shows a hidden rule as, read through the rule it shows, as a claimed kind is; and a copy path that enters a group lift edits a copy of the lift, hidden, named for the copy's holder and shown as the lift, so an edit through a class copy into a lifted list is no longer lost. These were the two faults that held python's class fields; every generated output is unchanged.
  - a test pins `divergeSharedLifts` as a live guard: a layer patch outside a copy that edits through a group lift edits the lift in place, and a context copy of its holder keeps the body it was made from, under a lift name of its own.
  - two claim routes of one owner that pass through one copy print the edit inside it once: a later route is printed only as far as the copy, with an edit that leaves it unchanged, so it still copies and repoints each holder on the way. The python field claim reaches its statement copy through the block form and the inline suite; it no longer stops on a site the first route replaced. Outputs unchanged.
  - a bare reference to a copy is no second display: a hidden copy shown under a new name at one reference stays bare at another, as its source's reference is there, and only two new names for one copy conflict. A copy aliased back to its visible source still takes no second name, as a hidden rule takes one display. The copy keeps the new name whichever reference an entry reaches last. Outputs unchanged.
- Left on the body branch: lambdas; the suite and braces options; the holders the spec moves that still hold `body` (try, catch, finally, python's `case`, `with`); python's class fields, which take the `Fields` feature and a claim through class copies of the statement path; class members the generated build does not build: a method whose flag spells into its name's text (`privateName`), a method whose name a template spells (`declaration.method.special`), and a setter, whose `@x.setter` needs `expression.member`, which is not generated; rust's `const default fn` as `declaration.method`; feature-gated slots no arm routes; python's docstring, which reads as a statement and never as its function's or class's `doc`, against the bindings spec's `doc` capture (the routes exist and are covered, so the read never takes them); a deep capture reaching only its owner, not the owner's copies, which is why python's `constructor_declaration` and typescript's constructor carry written-out lines; python's `declaration.constructor` has two arms no test tells apart, the `__init__` copy and the method its name claims: no read produces the claimed method (every `__init__` in the corpus and the probes, decorated or not, parses as `constructor_declaration`), so the claim goes and the path keeps one arm. Until then the generated dispatcher's presence test sends an absent `parameters`, which the type refuses, to the other arm than the interpreter takes.
- The generated builders call the strict API (ruled 2026-11-17). The module is a table of functions that take no engine; it imports the strict table (`ir-strict.ts`), and a caller scopes it with `scopeBuilders(engine, portableBuild)`. The strict list arguments of the six hole-taking kinds take `null`.
- Built:
  - the emitter in the pinned child;
  - gen writing `portable/table.ts` and `portable/build.ts`;
  - the corpus test (Step 1), green in all three grammars and both storages, the interpreter and the generated module on one strict engine.
- Built of Step 2:
  - decisions 1, 2 and 4;
  - the header comment;
  - paths that pick their arm by the `$value`'s type, and number arms that take the scalar whole or in their last numeric slot;
  - text-built arms from their text, where the path reads its `$value` as text;
  - containers whose builder takes an elements or spread input, holding a single value;
  - decision 7's optional `$path`: the map's `decided` names each slot's one structure-built path, and a path function's input is `PathInput<Map, P>`;
  - slots that take one value or a list, built by whether the value is a list;
  - number spelling in decimal parts (exponent forms included) through `decimalSpelling`, with a part the builder takes as an option passed in the call's options;
  - strict calls for what the loose builders coerced: a token's kind id in its seat's containers, a text through the one path that takes it as its only required slot (else `untexted`), an integer passed to a direct builder once per scalar type;
  - the module's own `isNode` guard, typed by the grammar's node union;
  - token-only slots typed as their token texts, read and build (python 16, rust 5, typescript 9), the generated slot function taking its text type from the map;
  - a generated arm refuses a slot its path admits that the arm has no route for, as the interpreter does (`<path> has no slot <x>`);
  - a path no build takes leaves the exact sets, and read types narrow with it: codegen stamps, per kind that reads as such a family path, whether its refinements cover every case (all 13 are covered, across 16 kinds), and refuses an uncovered one (`portable-family-uncovered`);
  - arms with several forms, each form tried under the test that the slots outside it are absent, and slots reached in several steps, each step's builder a container of the slot's seats;
  - each container fact's spelling with no holes carries its text, derived from the render bodies in the same run;
  - containers that hold slots of their own, filled from the structure they wrap, with an arm's container facts among that slot's items at the index and in the spelling `$at` records; a seat is chosen by the slots the structure states and the facts it sets, and a root path with facts builds their container. Python's `file` builds (unfit 96 to 95).
- Emit diagnostics count only functions the module keeps. The corpus test's not-generated ceilings are python 809, rust 1297, typescript 1315.
- A path the emitter can't compile whole is left out with `portable-emit-unfit-slot` and counted by the corpus test's not-generated ceiling. That covers holders, mounts, options, and an arm whose forms build one slot through different routes.
- The generated module stays out of `dist` beside the map, which `dist` already leaves out; only the corpus test loads it, from source.
- The emit diagnostics' ceilings are recorded at their counts (`diagnostic-ceilings.json`).
- A number path is its path, its `$value` and its other slots. Two kinds of slot leave it: the slots its value is written from (`valueSource` on the model), and its options, the slots a preference binds (the model's `registered`). The low-level builder writes an option from its preference default. Python loses 32 fields, rust 4 and typescript 24. Two kinds one path claims stay apart when their options differ.
- The portable code says "slot" where it said "member": a path holds slots, options (a slot a preference binds) and flags. The bindings' collections that hold slots and flags together are named slots too, since a bindings flag is read from a grammar slot, by its presence or its kind. Each symbol was renamed through the TypeScript language service: the `@sittir/types` build table (`PortableSlotRoute`, an arm's and a container's `slots`, a fact's, template's, pick test's and sole delimiter's `slot`), the module emitter's input and its diagnostic `portable-emit-unfit-slot`, the build interpreter, the bindings (`Vocabulary.slots`, `SlotFact`, `SlotRoute`, `DeclaredSlot`), the build table emitter, the portable tools (`AdmissionSlot`, `holdsSlot`, `UNHELD_SLOTS`, the conformance causes `extra slot` and `missing slot`), the inventory's `--slots`, the tests and the spec. A refused key says whether it is a flag of the path (state it in `$flags`) or an option of the kind (the build writes it from its preference default, and `$with` changes it), from `PortableBuildPath.flags` and `PortableBuildArm.options`.
- Decision 7's bare numbers, by the outermost taker (ruled 2026-11-17). Each slot route carries `takers`: per scalar type, the path a bare number builds through there, the one inside none of the slot's other candidates. No slot has two, so none is undecided. Slots with takers: python 179 and 2 container slots, rust 178, typescript 200. In such a slot a number is a number, built by the interpreter and the generated module as `{ $path: taker, $value }`; a type the slot has no taker for is refused (`unnumbered`). The map's `inputs` admit each number path's scalars. The type can't refuse a fixed word's bare kind id there, since a numeric enum member and `number` are assignable both ways; the build reads it as a number, never a kind id.
- Remaining:
  - decision 5;
  - python's getter: its facts build, but its body's block arms pick by the render options' variant (`_suite`), which the emitter refuses, as it does for 15 python paths;
  - decision 9's tails;
  - the `pinned-gap`, `type` and `tail-is-path` diagnostics;
  - decision 7's bare booleans, once the emitter builds literal arms (`literal.boolean.*` arms are literal arms, unfit today), since a bare `true` has no generated path to go to until then;
  - Step 3 (generated-module type errors: 0 in all three grammars) and Step 4.

**Files:**
- Create: `packages/codegen/src/emitters/overlays/portable/emit/build.ts` (from the prototype, its builders typed by `emit/engine.ts`), run in the pinned child
- Generated: `packages/<lang>/src/portable/build.ts` becomes `portableBuild`, a table a caller scopes with `scopeBuilders(engine, portableBuild)`
- Test: `packages/tools/src/__tests__/portable-generated-build.test.ts`

- [x] **Step 1: The failing test.** For every corpus file in all three grammars, in both storages, project each node with today's reader. Then build the projection with the generated function and with the interpreter. The two renders are identical.
  - The known differences are rows: python's root getter and static method, which the interpreter refuses. Every other difference stops the task for review.
- [ ] **Step 2: Implement** the emitter over every path:
  - decisions 1, 4, 5 and 7;
  - python's getter takes no `parameters`, and its generated build writes `self`. The vocabulary edit to `accessors/declaration.ts` comes from Task 3. It lands here because the interpreted build table takes that slot's list arity from the vocabulary. The type tests gain "the getter's input has no `parameters`" for python and typescript;
  - decision 9's tails. Each slot's tails are computed beside its exact set, written as `$path` spellings on the map's input side and as `case` labels in the slot function, and checked by `portable-emit-tail-is-path`. The type and build tests gain:
    - rust `declaration.function.name` accepts `{ $path: 'metavariable', $value: 'y' }`, and the generated build gives `$y`;
    - rust `statement.return.expression` accepts `'arithmetic.add'` and refuses `'add'` and `'binary.arithmetic.add'`;
    - python `statement.return.expression` accepts `'add'`;
    - a root build refuses a tail;
  - the five emit diagnostics;
  - the header comment through `$trivia.leading`;
  - number spelling (exponent forms included) through one shared value helper.
- [ ] **Step 3: Regenerate.** The generated modules type-check with 0 errors, or each error is a `portable-emit-type` row. Record the per-grammar counts of every emit diagnostic as the ceilings.
- [ ] **Step 4: Run** the corpus test, validate history and the suite. Report type-check times against the baseline. Commit.

### Task 4b: No kind id on the portable surface

The spec's "A kind id has no meaning on the portable surface", as approved: a literal union for paths, no nominal brand, and the kind-id gap closed. No code before Task 4 is in a PR.

**Files:**
- Modify: `packages/types/src/vocabulary/map.ts` (`NodeOf`), `packages/types/src/portable-build.ts` (`PortableStructure`'s JSDoc)
- Modify: `packages/common/src/portable/build.ts`, `packages/codegen/src/emitters/overlays/portable/emit/build.ts`
- Test: `packages/{python,rust,typescript}/tests/build-input.portable.test-d.ts`, `packages/tools/tests/portable/bare-numbers.test.ts`, `packages/codegen/src/bindings/__tests__/pinned-emit.test.ts`

What the census checked, so the task needs no new probe:
- A bare kind id reaches the portable types only through a map's `nodes` block, where `NodeOf` falls back to the id of a kind with no bound node type: the fixed words (python 9 paths, rust 16 with 33 ids, typescript 23 with 25 ids). Each is already a vocabulary path.
- A structure path's fixed word reads as its structure (`{ $path: 'literal.null' }`, a boolean with its `$value`). A text path's reads as its text (python `'pass'`, `'*'`, `'_'`; rust `'usize'`, `'()'`, `'..'`, `'self'`; typescript `'unique symbol'`, `'import.meta'`, `'super'`).
- No table data reaches the kind-id branch of the interpreter's `element()`: a spelled fact's items are structures, and no item slot holds a number (python's 8 facts and 12 spellings; rust and typescript have none). Presets write their kind ids into the builder config directly.
- Before this task, the generated slot functions that place a bare number as a kind id: python 52, rust 63, typescript 34.

- [ ] **Step 1: The failing tests.**
  - Types: a fixed word's bare kind id is refused where a slot holds its path and admits no number (a slot that admits `number` admits every numeric enum member, so a number slot is pinned at run time instead); its structure is admitted (`{ $path: 'literal.null' }`); a text path admits its text (rust `type.primitive.integral.size` as `'usize'`).
  - Run time: a bare number in a slot with no number taker is refused, by the interpreter and the generated slot function alike, with the same refusal.
  - Emit: a slot with no takers writes the refusal for a number, never `seated(value, …)`.
- [ ] **Step 2: Implement.**
  - `NodeOf`'s fallback is `never`.
  - The interpreter's `element()` refuses a number instead of placing it as a kind id.
  - The emitter's no-taker number branch calls `unnumbered`, and `placedByKind` keeps only nodes.
  - `PortableStructure`'s JSDoc drops "a kind id".
- [ ] **Step 3: Regenerate,** run the three-way verification, and commit.

### Task 5: The projection emitter

**Files:**
- Create: `packages/codegen/src/emitters/overlays/portable/emit-project.ts`
- Generated: `packages/<lang>/src/portable/project.ts`
- Test: `packages/tools/src/__tests__/portable-generated-project.test.ts`

- [ ] **Step 1: Prototype first,** on the spec's eight paths, and bring brainstorm the generated getter case and its size beside today's read. The claim test `(#eq? @_self "self")` compiles to code.
- [ ] **Step 2: The failing test.** For every corpus node in all three grammars, in both storages, the generated projection equals today's read, except for listed rows:
  - the python getter has no `parameters`;
  - typescript `identifier.qualified`'s honest slots, moved here from the portable-grammar-map plan.
- [ ] **Step 3: Implement,** regenerate, and run the test, validate history and the suite. Commit.
- [ ] **Step 4: Measure** parse against parse-with-projection over the corpus, per grammar and storage, and put the ratios in the PR body. They don't gate.

### Task 6: The portable engine and the removals

**Files:**
- Modify: `packages/common/src/create-engine.ts` (`api: 'portable'`), the generated descriptor's portable entry
- Delete: `packages/common/src/portable/{build,read}.ts` and the run-time table registry; `PortableRuntime` and the rest of the spec's export rows
- Modify: `@sittir/types` `PortableEngine`, `PortableSurface`; move the table types into codegen
- Test: `packages/types/tests/engine-portable.test-d.ts`, and the surface test

- [ ] **Step 1: The failing tests.**
  - `createEngine(python, { api: 'portable' })` has `build.declaration.property.getter`, typed by `BuildInput`.
  - `parse(source)` returns `File<G>`, projected whole in the call; `project(node, carried?)` reports kept nodes through `PortableCarried` from `@sittir/types`.
  - Nothing named in the spec's removed rows is exported.
- [ ] **Step 2: Implement.** Delete the interpreters and move every caller (tools, tests, conformance) to the engine. Remove the Task 4 interpreter comparison, with its rows recorded in the commit.
- [ ] **Step 3: Three-way verification,** plus the workspace type-check. Commit.

### Task 7: Gates and ratchets

- [ ] **Step 1: Retire the conformance mirror** (`tool portable-conformance` and its ceilings). The generated modules' type-check replaces it.
- [ ] **Step 2: Add the emit-diagnostic ratchet,** per grammar, at Task 4's counts. An MVP path with any diagnostic fails generation once the user names the sets.
- [ ] **Step 3: Run every gate:** the ratchets, validate history against base, the suite, the workspace type-check, and the times against the baseline.
- [ ] **Step 4: Open the PR** with `Owner: sittir-design` on the first line, the API rows (every public export added, changed or removed, before → after), the counts and the times. Brainstorm reviews, and the merge needs the user's word.

## Follow-ups

- **Aliasing a lift that an `options:` key addresses fails enrich.** When the grammar bindings alias an enrich lift and the grammar's `options:` block addresses that lift by name, evaluating the layer throws `resolveLiftNames: '<lift>' carries a variant name but is not a rule enrich minted`. No grammar hits this today, because the bindings keep the two kinds apart. The case: python's `integer_legacy_octal_long` has `{ 'marker:': preference('L') }`. Derive python's bindings with `sameShapeAs` not counting options, and the bindings alias it into `octal_big_integer_number_literal` (`integer_legacy_octal: { "-2": alias(…), "-1": alias(…) }`). `bindings-inventory --write` then fails evaluating the layer it wrote. The fix belongs in the enrich/wire layer: an alias at a lift should carry the lift's options with it, or refuse with the options key named.
