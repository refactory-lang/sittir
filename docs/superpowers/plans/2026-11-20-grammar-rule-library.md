# Grammar Rule Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (the sittir-engine-api peer executes inline; no subagents in this repo). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A shared library of grammar rules, organized by construct and written in the names the bindings converge on, which sittir grammars adopt as written in place of their own reauthorings.

**Architecture:** First every claimed kind takes its converged name in the parser (the generated grammar bindings write `rename` entries). Then a seed report over seven grammars proposes the constructs grammars spell alike. Then a library package holds hand-written rules; a grammar adopts one by naming it, and the generated bindings layer applies it last, in bound names, with its path as that kind's claim.

**Tech Stack:** the tree-sitter grammar DSL and sittir's authoring DSL (`packages/codegen/src/dsl`), the bindings generator (`packages/codegen/src/bindings`), the inventory (`packages/tools/src/inventory`), vitest, the native validators.

**Spec:** [docs/superpowers/specs/2026-11-20-grammar-rule-library-design.md](../specs/2026-11-20-grammar-rule-library-design.md). Read it before this plan; it is the authority.

**Status:** Task 1 done (04ae9ea4f); Task 1b Steps 1, 2, 4 and 5 done (71a074905), Step 6 has the body branch merged at cc0b808ea with the moved captures renamed, leaving one held map-fit type error each in Java and Go, Steps 3 and 7 in progress. Parked as layer authoring: the `.body` routes of Go (9), Java (22) and C (5), which warn. Java reads `{ body: { statements } }` and rebuilds with the body intact; Go's function read carries its node, so its shape isn't checked beyond that. C#'s `real_literal_arm1` is parked until C# generates. Branch `feat/rule-library`, worktree `scratchpad/wt-rule-library`.

## Global Constraints

- A library rule is used as written: no translation, no edit, no per-language variant.
- The goal is correct lexing and parsing per the language's grammar productions, lexical and syntactic; early errors stay out of the parser. Parsing as upstream does is not a measure.
- A library rule's correctness is evidenced by witnesses citing the language's productions and by the language's compiler as judge (`tsc`, `rustc`, CPython `compile()`; the grammar-over-acceptance census's `judges.mts`).
- Moving one of our reauthorings into the library unchanged leaves every generated output byte-identical.
- Kind renames reach the parser; a rename onto an existing kind is a merge and is refused.
- `boundKindName` is the naming contract; the vocabulary is the one source of a path's slots and flags.
- The grammar runs twice: everything a grammar imports, the library included, is erasable TypeScript in plain tree-sitter syntax.
- No scanner patches, no fork pins. Every authored rule declares its cause, with witnesses where the cause takes them.
- Generated outputs are never hand-edited. Ratchets only tighten. No new terms; "library rule" is the word.
- Three-way verification before every commit that can change what the pipeline reads, renders, parses or validates: targeted probes, `sittir validate history` across every grammar with numbers compared, the full suite plus the cargo workspace (`cargo test --workspace --no-default-features --features sittir-parity-tests/arena` as well).
- Every API change runs by the user through brainstorm, except a binding-driven rename, which is listed with the PR's public changes. No merges without the user's word.

## Review Focus

1. **Two kinds bound to one path.** typescript's statement `lexical_declaration` and its `for` header's `for_initializer_let_const_kind` both read as `declaration.variable`; one bound name can't hold both. Expected: the header kind's missing terminator option tells it apart, so it is not merged: it keeps its base name, the derivation lists it among the claimed kinds not merged, and both read as the path (portable spec, "A path is defined by its slots and flags"). The `for` header kinds' branch pins this, stacked on the body PR; this branch merges it before Task 2, and Task 2 keeps its test passing once kind renames reach the parser.
2. **The start rule.** Each grammar's start rule binds to `file` (`program`, `source_file`, `module`), and `applyRename` refuses to rename a start rule. Expected: never skipped silently; Task 2 stops for a ruling.
3. **A library rule that names a part a grammar lacks** (a hidden helper such as `_expressions`). Expected: adoption refused, naming the kind. Pinned in Task 5.
4. **A `bindings.scm` claim or member capture on an adopted kind.** Expected: refused, naming the capture. Pinned in Task 5.
5. **Corpus expectations in upstream names.** Upstream corpus files name upstream kinds; once kinds are renamed in the parser, a validator that compares a parse with a corpus tree must read it through `baseNamesOf`. Expected: no validation row moves from the rename alone. Pinned in Task 3.

---

### Task 1: The branch and the four merged grammars

**Files:**
- Modify: `packages/{c,csharp,go,java}/` (regenerated outputs only, plus their `grammar.sittir.ts` where a layer fix is needed)
- Modify: whatever registers a grammar with the tools on master (`packages/tools/src/languages.ts` on the 11-06 branch; find its successor with Infigraph)

- [x] **Step 1:** Brainstorm creates the worktree (`git worktree add scratchpad/wt-rule-library feat/rule-library`). Push the branch by literal sha: `git push origin "4e7dede2e…:refs/heads/feat/rule-library"` (full sha from `git rev-parse`). `pnpm install`.
- [x] **Step 2:** Regenerate each of the four: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`. Where a grammar fails, use the sittir-new-grammar skill to tell a layer fix (make it) from a generator defect (don't fix here; list it).
- [x] **Step 3:** Verify: typescript, rust and python generated outputs are byte-identical to e77b09679 except `grammar.bindings.ts`'s hash; `sittir validate history` moves 0 rows for them; workspace type-check is 0 or every error is in a listed blocked grammar.
- [x] **Step 4:** Commit the regenerated grammars (pathspec). Send brainstorm: which generate, each failure, the four grammars' validation counts.

Result (8f68332cb, 04ae9ea4f): typescript, rust and python byte-identical but for the hash; `validate history` 954 rows, +0 −0. Layer fixes made: the probe features' bare names, the four layers drop `name:`, C, Go and C# accept their collect-slots shape diagnostics in `expectDiagnostics` (accepted: an authored field would change the shapes the seed report compares), Go's radix claims name the lifted radix kinds. Java's increment/decrement claims were dropped to avoid `layer-not-enrich-fixpoint`; that defect is fixed in Task 1b and the claims come back. None of the four generates a native addon; the generator defects are Task 1b.

### Task 1b: The four grammars generate

The seed report needs every grammar's node model and binding facts, so the generator defects the four grammars found are fixed here, at the root, each as its own commit with a unit test on the smallest grammar that reproduces it. Each fix leaves typescript, rust and python byte-identical (but for the hash) and `validate history` at +0 −0.

- [x] **Step 1: C.** render-options names an edge arm site's kind `alignof___keyword`, which has no kind id, and throws raw. The arm's kind comes from its stamped kind id; a missing one is a diagnostic naming the site, never a raw throw.
- [x] **Step 2: Java.** The interior guard writes `[^bfnrts'\"\\]` into a `u`-flag RegExp, where `\"` is invalid. The guard escapes a character class for the flags it is compiled with.
- [ ] **Step 3: C#.** The join-seams `solvePrev` queue exceeds the maximum array length. It has a visited set; the queue is long because every scope in a cycle of through-edges holds its own copy of the same pairs (C#: 261k scopes, 236 cycles), and with the cycles condensed per component, as `solveLex` does, C# still runs out of heap because each scope materialises the union of its callees. The fix is a representation change, with no limit raised: first find whether the consumers (`concrete`, `sightingsOf`, `solvePrevCosts`) need every scope's end-prev or only those under a seam; then a component holds its own pairs and references to the components it depends on, and only a consumer materialises a union. The condensation lands with that change, not alone, since alone it slows typescript's generation from 32.6 s to 40.4 s. Typescript's `join-seams.json` stays byte-identical and its generation no slower than today's; pin it with a test. Progress: the per-scope sharing landed (c5fb8a701; only callees under a seam need a full end-prev; typescript 30 s → 23 s, 4.14 → 3.20 GB). Compact step tables bring typescript to 18 s and 2.87 GB, but C# still exceeds the default heap. A heap snapshot finds no retainer outside the closure and its seams (the 5 GB that seemed to stay live was the probe's): the peak is their own data during derive, mostly Map and Set tables, a sighting's witness closures and a lead's slot closures. The compact tables land, measured as live data at the peak plus external memory (about 6.2 GB against 7.0 GB at HEAD; the raw peak is the probe's 20 GB heap letting garbage gather). Then a sighting's witness becomes data and a lead resolves through the table without a closure, each its own commit and measured the same way; walk entries become typed arrays only if C# still exceeds the default heap after both.
- [x] **Step 4: Go's addon.** `\0` is written as `"\u0000"` in Rust strings, and token-interior structuring names a flag `_`. Rust string literals escape through one function; a flag's name comes from its slot. Go's dropped-token stops are not the template defect implement's template-placement branch fixes: merged into this branch, it cleared none of them. They are sorted with Java's under Step 7.
- [x] **Step 5: Java's fixpoint.** Restore the increment/decrement claims and fix the `layer-not-enrich-fixpoint` they hit.
- [ ] **Step 6: Go's generated portable `build.ts`.** Its 434 type errors are in design's emitter. Send design the error classes, one minimal example each; design fixes them on the body branch, and this branch merges it. First, Java, Go and C stop binding `expression_statement` to `statement.expression`, a path the vocabulary doesn't have, and unwrap it to its expression as typescript, rust and python do (brainstorm's call, 2026-11-23). What stays red after that one line per grammar is what design gets: done as `ec7c7f812`, leaving Java 5 and Go 433. Merging the body branch clears 429 of Go's and needs this branch's Java, Go and C bindings renamed to the moved paths (23, 14 and 6 captures); `gen`'s refusal proves none is left. Three emitter defects follow on the body branch. A number arm whose numeric parts have no names (Go's float, `content` and `content2`) takes no `$value`, and its read carries the parsed node instead of a number it can't rebuild (brainstorm's call, 2026-11-23): `1.5` read as `$value: 1` and rebuilt as `.1`. A read may normalize a number's spelling, never its value. The map-fit errors (Go 18, Java 67) wait on vocabulary or binding rulings.
  - A read may normalize spelling, never value, on any literal (brainstorm's call, 2026-11-23). Go's `'\n'` read as `content: "n"` and rebuilt as `'n'` changed the value, so an escape arm whose slot can't tell it from a plain rune carries its node: the emitter stamps any arm whose slot admits a value an earlier arm of the path also takes, spelled with different fixed text. Java's hex floats (`0x1p3`) are parked: `literal.number.float` has no number arm, so the build refuses them and changes no value, and the repair is layer authoring.
- [ ] **Step 7: Layer authoring where generation can't go on.** The `untagged-slot-ambiguous` stops are raised at emit, so no `expectDiagnostics` entry can carry them; where a grammar can't generate otherwise, its layer authors the fields, named as typescript, rust and python name the same slots (this narrows Task 1's "floor, don't author" to diagnostics that don't stop generation). Java's `scoped_type_identifier` takes `qualifier` and `name`; Java's `method_reference` takes `name` for the member it names, and if that doesn't clear both of its diagnostics, stop and report. C's `concatenated_string` fields every position of its three arms and the repeat `strings`, provided sittir reads them as one list; if not, stop and report. Go's seven separator-choosing lists declare `separator: preference(<newline kind>)`, gofmt's form. Go's `\n` and `\0` kind names (`source_file_text`, `null`) follow the existing naming (`<first holder>_text`; tree-sitter's own `NULL`), so they stay.
  - Java's fields are in (80fe7396c): `method_reference`'s one `name` clears both of its diagnostics. Java's next stop, `boundary-arm-unemittable` on `enum_body_declarations`' after-edge, is a generator defect of this task, fixed at the root with a test.
  - C's `concatenated_string`: with `strings` on every position, enrich still lifts arm 0 into its own kind (its leading symbol is the only one no sibling shares), and generation stops at `union-slot-mixed-row`. A seq whose positions all carry one field adds items to one list slot; it is not a structure with several slots, so it is not minted. The mint's structured test counts distinct slots, not positions. If enrich sees the arms before the layer's fields reach them, report that ordering rather than working around it. Then check that the fixed prefix and the repeat read as one `strings` list; if not, stop and report. Result: enrich's clause hoist runs over upstream's body before the layer's field patches apply, so fielding the arms can't stop arm 0's mint. C keeps its floor and carries `concatenated_string` without the fields. The ordering is a known limit, taken up when a library rule or a stable grammar needs fields to merge arms.
  - Go's separators: upstream's newline terminator is the pattern `/\n/`, and a pattern has no fixed text to render. A pattern whose language is exactly one string is that fixed text, read from the existing token-interior analysis of a pattern, not a new regex check. Census first: how many patterns in the five stable grammars match exactly one string, and which generated outputs change; any change to typescript, rust or python comes to brainstorm with the census before it is committed. Done (9c28ab1a1): 3 single-string patterns in eight grammars, no stable output change, Go generates with newline separators. The two readings of a pattern's fixed text (`collectFixedLiteral` and the catalog's) become one.
  - The `dropped-token` stops in Java and Go, sorted by probe. Two are generator defects of this task, fixed at the root with a test each, after a census of the stable grammars for each shape (any stable output that moves comes to brainstorm, each shown to be a fix):
    - A choice whose arms put different text before the same slot drops that text: the kind-gated literals gate the text after a slot on the arm's kinds, not the text before it. It reaches Go's `var_spec` (`=`), Java's `wildcard_bounds` (`extends`) and `assert_statement` (`assert`, `;`). The text before a slot is gated as the text after it is, wherever no kind is admitted by two arms with different text.
    - A choice between an optional slot and fixed text drops the text: the literal fallback refuses an arm that comes back already gated on its slot. It reaches Java's `method_declaration` (a body, or `;` when it has none). The fallback takes such an arm's inner body.
  - The other four are names (the maintainer, 2026-11-20):
    - Java's `string_literal` splits into variants `line`, the default, and `text_block`, the JLS's term for `"""…"""`, each admitting its own fragments (a "Two variants" answer).
    - Go's `type_conversion_expression` and `special_argument_list_group` take a `trailing_comma` slot bound to the preference blank, as python's `for_in_clause` and rust's `last_match_arm` do ("Per-kind slot, both now"). If a list-level trailing-separator option is ruled later, the list kind moves onto it.
    - Go's embedded field reads its `*T` as the pointer type it is ("Pointer type", replacing the same day's "Flag `pointer`"): the layer reads the starred form as `pointer_type`, keeping the embedded field's limit to a type name, so `struct{ *T }` reads `{ type: type.pointer { type: T } }` as `var p *T` does, and `struct{ *[]int }` stays refused. No flag and no new name; the parser sees a `pointer_type` node there too. The DSL needs no change (the maintainer, 2026-11-21: "We don't need to change the dsl - it works as is", withdrawing the same day's "Copy may merge"; then "There is an enrich pass"). Both failed attempts were the enrich pass working as designed: its overload check (`unaliasOverloadedDisplays`) splits off any storage shown under a display that is a rule of its own, so a copy of the field's arm aliased to `pointer_type` was renamed to its own display, and an inline `seq` there needs a rule of its own. A merge the check leaves alone is a declared display family, and a copy shown as its own source declares one (`displayFamiliesOf`). So the starred form is a copy of `pointer_type` whose `type` is replaced by the field's own type choice (taken from the arm, not restated); the copy shows as `pointer_type` by default, and the family is `pointer_type` with its copy. The copy keeps its own low-level builder and type, `pointerTypeFieldDeclarationArm`, which is how an embedded `*T` is built, and the field's slot refuses `pointerType(…)` at compile time (the maintainer, 2026-11-21: "Keep the builder"). With one slot left, `field_declaration_arm` is a single-slot wrapper: it gains a top-level `fieldDeclarationArm(type)` builder, and `fieldDeclaration`'s `fieldDeclarationArm()` accessor returns the arm's `type` (the maintainer, 2026-11-21: "Accept"). The row's pins include the type error: the embedded field's `type` refuses a `pointer_type` built over `[]int` at compile time (the maintainer, 2026-11-21); whether today's types already give the slot the copy's shape is checked first; if they don't, the mechanism is proposed before it is built, with a census of the other slots that hold a copy shown as a kind it narrows.
- [ ] **Step 8:** Register `@sittir/java` and `@sittir/csharp` wherever `languages.ts`'s successor lists grammars, regenerate C (its `src` is from 11-06), build `dist`, and verify: all seven grammars generate, workspace type-check 0, the full suite and the cargo workspace green, `validate history` for typescript, rust and python +0 −0, and each of the four's counts recorded. Commit; send brainstorm the numbers.
  - Java's node tests (`packages/java/tests/nodes.test.ts`) fail 32 render tests once Java's native image exists: `render produces non-empty string` for `array_creation_expression`, `catch_clause`, `for_statement`, `if_statement`, `try_statement` with catches, `while_statement` and others, and three `sub-factories … builds the parent` (the `for_statement` arm, `method_reference`'s `arrayCreation`, `switch_rule`'s block). The image is git-ignored, so a fresh tree skips the whole file and shows none of them; the library branch built it while gating its variant work. They are part of this step's bar.
  - A built Go special call drops the `,` after its type: `make([]int, 1)` built through `callExpression`'s arm and `specialArgumentList` renders `make ( [ ] int 1 )`, while `1 , 2` keeps its separator (red pin `pins/go-r7-side.mts`, at 370e4a4f5). The group is `seq(_type, repeat(seq(',', _expression)), …)`, and its render body writes `type` then the `expression` list with nothing between them, so the `,` that leads each repeated item is written only between items. A parse round-trips. The fix is at the render body's derivation, not Go's layer: first a census across the nine grammars of a slot followed by a `repeat(seq(<token>, X))` of another slot, then the fix with those sites as pins. The template literal placement check is the guard for this class; once it reaches this branch it must report the shape, or the gap in the check is reported too.

### Task 2: Kind renames reach the parser

**Files:**
- Modify: `packages/codegen/src/bindings/module.ts` (`printBindingsModule`, `editEntries`; delete `renamesData` and the `renames` export)
- Modify: `packages/codegen/src/bindings/grammar-bindings.ts` (`deriveGrammarBindings`: report refused renames)
- Modify: `packages/tools/src/inventory/index.ts` (`bindingsModule`: check captures against the derivation's result)
- Modify: `docs/glossary/bindings.md`, `docs/glossary/packages-tools-src-inventory.md` (the entries for every symbol changed)
- Test: `packages/codegen/src/bindings/__tests__/grammar-bindings.test.ts`, `packages/codegen/src/bindings/__tests__/round-trip.test.ts`

**Interfaces:**
- Produces: the generated layer's `edits` carry `{ [baseKind]: { '.': rename(boundName) } }` for every accepted rename. `GrammarBindings.renames` stays the derivation's output. `GrammarBindings.refusedRenames: readonly { kind: string; to: string; reason: 'merge' | 'start-rule' | 'factory-inline' | 'hiddenness' }[]`, printed by the inventory report.

- [ ] **Step 1: Failing tests.** In `grammar-bindings.test.ts`: `it('a derived kind rename is a rename entry in the generated layer')`, asserting the printed module holds `rename('variable_declaration')` under `lexical_declaration` and no `export const renames`; `it('a rename onto a kind another rename already gives is refused as a merge')`, on two naming claims of one path, asserting the second appears in `refusedRenames` with `reason: 'merge'` and keeps its base name. typescript's header kinds are placed claims, pinned by the `for` header branch's test, which keeps passing.
- [ ] **Step 2:** Run them; they fail.
- [ ] **Step 3:** Implement. `printBindingsModule` writes each accepted rename as a `rename` entry beside the patch sets; `deriveGrammarBindings` checks each rename against `applyRename`'s refusals before printing it and records the refused ones.
- [ ] **Step 4: The start rule.** If every grammar's start rule lands in `refusedRenames` (`reason: 'start-rule'`), stop and send brainstorm the three cases and what keeping or renaming the start rule needs; the maintainer rules before Task 3. Don't work around the refusal.
- [ ] **Step 5: Inventory in one pass.** Failing test: a capture that renames a field passes `bindings-inventory --check` without a prior regen. Make the inventory check captures against `deriveGrammarBindings`'s result, not the last generated grammar's fields. Run; it passes.
- [ ] **Step 6:** Tests pass; `missing_docs` and `stale_docs` clean for the changed symbols; commit (pathspec).

### Task 3: Every grammar regenerated with renamed kinds

**Files:**
- Modify: the generated outputs of all seven grammars; tests that name a kind by its base name; validators that compare a parse with a corpus tree
- Test: `packages/tools/tests/` (the corpus comparison for a renamed kind)

- [ ] **Step 1: Failing test.** A corpus entry whose expected tree names `lexical_declaration` matches a parse in which the kind is `variable_declaration`, through `baseNamesOf`.
- [ ] **Step 2:** Make the validators' corpus comparison read kind names through `baseNamesOf`; the test passes.
- [ ] **Step 3:** `pnpm run validate:native`, then `regen:all`. Fix tests that name a kind by its base name by naming it as the parser now does (never by loosening an assertion).
- [ ] **Step 4:** Verify: `sittir validate history` counts unchanged in every grammar (rows may be renamed, not moved); storage parity 0 apart; the full suite and the cargo workspace green.
- [ ] **Step 5:** Write the public-change list: per grammar, every low-level kind name that changed, and every refused rename with its reason. Commit; send brainstorm the list and the numbers.

### Task 4: The seed report

**Files:**
- Create: `docs/superpowers/probes/<date the probe starts>-rule-library-seed/` (`seed.mts`, `README.md`, `results/`)

- [ ] **Step 1:** `seed.mts` reads, for each of the seven grammars, its `grammar.json` (bound names, after Task 3) and its binding facts. For each path two or more grammars bind, it writes the grammars' rules side by side, the shape they share with each grammar's difference, the kinds a shared shape references that some grammar lacks under that name, and which of today's reauthorings or edits in typescript, rust and python the path covers.
- [ ] **Step 2:** `README.md` states the question, the run command, and the measure of "the same shape" chosen (Step 1's comparison, symbols set aside), and lists the candidates: construct, path, grammars, differences, the reauthoring it would replace.
- [ ] **Step 3:** Commit the probe. Send brainstorm the candidate list. **Stop here** until the maintainer rules which library rules move, and how a part no path names is named if most candidates reference one.

### Task 5: The library package, its check and adoption

**Files:**
- Create: `packages/rules/` (`package.json` named `@sittir/rules`, `src/index.ts`, one module per library rule under `src/<construct>.ts`)
- Create: `packages/rules/tests/library-check.test.ts`
- Modify: `packages/codegen/src/bindings/grammar-bindings.ts` (skip adopted kinds; refuse facts that target one), `packages/codegen/src/bindings/module.ts` (apply adopted rules last), `packages/tools/src/inventory/index.ts` (merge an adopted rule's claim; refuse captures on adopted kinds)
- Create: `packages/<lang>/library.ts` in a grammar that adopts (the list of adopted library rules)

**Interfaces:**
- Produces: `export interface LibraryRule { readonly path?: string; readonly rules: Readonly<Record<string, RuleBuilder>>; readonly witnesses?: Witnesses<InvalidSyntaxWitness | OtherKindWitness>; readonly conflicts?: readonly (readonly string[])[] }` in `packages/rules/src/index.ts`, with `RuleBuilder` the tree-sitter rule callback type the DSL already uses. A grammar's `library.ts` default-exports `readonly LibraryRule[]`.
- Produces: `checkLibraryRule(rule: LibraryRule, vocabulary): readonly LibraryRuleIssue[]`, refusing a kind name that isn't `boundKindName(path)` and a path whose slots and flags the rule's fields don't produce.

- [ ] **Step 1: Failing tests.** `library-check.test.ts`: `checkLibraryRule` refuses a rule whose kind name isn't `boundKindName` of its path, and one missing a slot its path declares. `grammar-bindings.test.ts`: `it('an adopted kind gets no patch, rename, wrap or split')`, `it('a bindings.scm capture on an adopted kind is refused')`, `it('an adopted rule naming a kind the grammar lacks is refused, naming it')` (Review Focus 3, 4), and `it('an adoption that replaces an upstream rule records renamedFrom')`.
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3:** Implement `LibraryRule` and `checkLibraryRule`; the derivation reads a grammar's `library.ts`, skips adopted kinds and takes each rule's path as that kind's claim; `printBindingsModule` applies adopted rules as `rules:` entries after the renames.
- [ ] **Step 4:** Tests pass; the package type-checks under tsrs; commit with glossary entries for every new export.

### Task 6 onward: one library rule per commit

For each library rule the maintainer approved in Task 4, one task and one commit:

- [ ] **Step 1:** Write `packages/rules/src/<construct>.ts` from the seed report's shared shape, to the language's grammar. Its witnesses: the forms it accepts and refuses, each citing its production, and the valid neighbours that must still parse.
- [ ] **Step 2:** Witness test: each witness through the grammar and through the language's compiler (`judges.mts`); they agree.
- [ ] **Step 3:** Adopt it in each of typescript, rust and python that spell the construct this way: add it to `library.ts`, delete the reauthoring or edits it replaces.
- [ ] **Step 4:** Verify: where the library rule equals the replaced reauthoring, every generated output is byte-identical. Otherwise, each validation row it moves is named with its reason, and a corpus case that now reads differently because upstream was wrong is replaced by a corrected local entry.
- [ ] **Step 5:** Three-way verification; commit; tick the task here and update Status.
