# Receiver split: a leading-element list edit

**Question.** A claim that anchors a parameter list's first element as `@receiver` derives a
grammar edit. The list's first position splits into a `receiver` field and the list's own item,
and every later position holds the rest. What does the edit cost rust's `parameters` and
typescript's `formal_parameters`: parse states, `parser.c`, conflicts and validation rows? What is
it called, how does `grammar.bindings.ts` spell it, which `bindGrammar` verb applies it, and does
the module stay erasable in both executions of the grammar? And what does `@receiver` capture:
the list item, or the `self_parameter` inside it?

**Answer.**
- The edit, `lead`, works in tree-sitter for both grammars.
  - Rust's receiver costs 9 parse states (+0.25%), 23 KB of `parser.c` (+0.33%) and no conflict.
  - Typescript's costs 40 states (+0.55%), 139 KB (+1.25%) and four conflict sets, which the
    conflict driver cannot derive today.
- `@receiver` captures the list item, because the split narrows the item: the `receiver` field
  sits where an item would. Rust's item is the `attributed_parameter` wrapper, whose element is
  the `self_parameter`, so no route addresses a position.
- No validation row could be measured. sittir's model has no list with a leading element of its
  own, and it refuses the split list. Allowing the refusal does not help: typescript's template
  then drops the list's commas, and rust's render options find two sites for one address.
- Seven choices are open (questions 13 to 19): where the edit runs, how its conflicts are
  derived, whether rust's typed `self` is a receiver, the model's list shape, two names, and how
  an owner keeps the rest of its list as `parameters`.

## The edit

`lead(list, item, field, ...admits)` edits one separated list rule,
`seq(field(item, X), repeat(seq(SEP, field(item, X))), optional(SEP))`, with or without the
trailing separator:
- its first element becomes a choice of `field(field, LEAD)` and `field(item, REST)`;
- every later element holds `REST`;
- `LEAD` is the item narrowed to what `admits` admits, and `REST` is the item narrowed to
  everything else.

`match(kind, within?, as?)` admits one kind of the item:
- `within` restricts it further, to an unfielded child (an array of matches) or to one field (a
  one-key record of matches), and nests;
- `as` names the lead's variant, a parser alias. Without it the variant keeps the kind's name.

A match tree is its claim's pattern: `(required_parameter pattern: (this))` is
`match('required_parameter', { pattern: [match('this')] })`.

In `grammar.bindings.ts`, beside the renames and splits:

```ts
// rust
leads: [lead('parameters_elements', 'item', 'receiver', match('attributed_parameter', [match('self_parameter')]))],
// typescript
leads: [lead('formal_parameters_elements', 'item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter'))],
```

**Variants.** Each side narrows the rules between the item and the matched kind.
- On the rest's side, a rule reached only through the list is narrowed in place.
- Any other rule is cloned: `_<rule>_<field>` on the lead's side, `_<rule>_<item>` on the
  rest's. That is the variant convention: a hidden rule, aliased at its site to the kind it
  narrows, or to `as`.
- The grammar's `leadFrom` records each clone's origin, as `splitFrom` and `renamedFrom` do.

What each mode mints:
- rust `lead`: `_attributed_parameter_receiver`, aliased `attributed_parameter`. The rest
  narrows `_attributed_parameter` in place, without its `self_parameter` arm.
- rust `lead-typed`: also `_parameter_receiver` (a `parameter` named `self`) and
  `_parameter_item` (any other `parameter`). Both are aliased `parameter`, which is reached from
  outside the list too.
- typescript: `_required_parameter_receiver`, aliased `this_parameter`. Also
  `_parameter_name_receiver` and `_parameter_name_item`, clones of the hidden rule that holds
  `pattern`, which `optional_parameter` shares. The rest narrows `required_parameter` in place.

**The verb.** `bindGrammar` applies `leadGrammar(grammar, leads)` after the renames and before
the splits. Entries name the grammar's own kinds, which the renames map, as a split's do. The
prototype maps only the list's name; the probe's grammars carry no renames.

**Both executions.** `grammar.bindings.ts` holds only calls of the DSL's functions on literals,
and the prototype adds only interfaces and functions to `bind.ts`, so Node's type stripping runs
both unchanged. Every lead run below exercises both executions: tree-sitter generated the edited
grammar through Node, and sittir's codegen evaluated it before refusing the list.
- Tree-sitter's CLI runs `grammar.sittir.ts` through `.sittir/grammar.js`, and sittir's
  `evaluate()` runs it with its own DSL.
- Each calls `sittirGrammar`, and so the same `bindGrammar` and `leadGrammar`. The parser and
  sittir's model see one edit, and `this_parameter` is a parser kind, not a phantom.
- The two DSLs spell an optional differently: `OPTIONAL` against `CHOICE[x, BLANK]`.
  `leadGrammar` reads a list's trailing separator in either spelling, and writes the choice it
  builds in the list's own.

**The claims.** The derivation (`bindings-inventory`) reads each receiver claim into a `lead`:

```scheme
; the receiver, in each of rust's three method claims
(parameters (parameters_elements . (attributed_parameter (self_parameter)) @receiver))
; the receiver, in each of typescript's ten function-like owners' claims
(formal_parameters (formal_parameters_elements . (required_parameter pattern: (this)) @receiver))
; the rest, in every owner's claim, function and method alike (question 19)
(parameters (parameters_elements item: (_) @parameters))
(formal_parameters (formal_parameters_elements item: (_) @parameters))
```

- A lead is derived only when the capture sits on the anchored item itself. A capture deeper in
  the item stays a position: python's `@doc` claims are anchored first, but capture the string
  inside the item, so they derive no lead.
- The claim's child tests under the capture give the match tree, a kind and a field per step.
  An alternation inside the anchored kind gives several matches, each named through its own
  classifying claim (question 18); an arm with none keeps its kind's name. The derivation
  refuses what `match` cannot say: a negated kind (`#not-kind-eq?`), a text test, a wildcard, a
  quantifier, or a second restricted field on one kind. The interim claim's `#kind-eq?` goes.
- The reader refuses an alternation as the anchored node itself (`. [(a) (b)] @receiver`: an
  anchor next to an alternation ties no one node). So a lead's several top-level admits, which
  `lead` takes, are out of reach of `bindings.scm` today; reaching them is a change to the
  reader, not to the derivation.
- The claims on one list derive one `lead`, keyed by the list. Their match trees must be
  structurally equal, and their one capture name is the lead's field. A disagreement is
  refused, naming both lines. The entries print with the renames and splits, `leads` sorted by
  list.
- The derived fact carries the lead's field, and routes resolve `receiver` to it directly, never
  by kind. In the bound list, `receiver` and `item` both admit `attributed_parameter`, so a kind
  selector anchored first would fall back to the optional-slot tests: a position route.
- A capture that descends through a slot replaces that slot's member. So `@receiver` alone would
  drop the owner's `parameters`, and every owner captures the rest as the list's items. In the
  bound tree `item` holds only the rest, so `receiver` and `parameters` are sibling slots.

## Setup

- A worktree of `feat/bindings` at `8a80d34a3`, with `prototype.patch` applied and
  `pnpm install`.
  - The committed grammars pass no grammar bindings at that commit, so a lead mode's bindings
    hold its lead alone.
  - The validator commits its records to the worktree's branch after each run.
- `prototype.patch`:
  - adds `lead`, `match` and `leadGrammar` to `packages/codegen/src/dsl/bind.ts`;
  - applies `leadGrammar` in `bindGrammar`;
  - exports the two builders from `dsl-authoring.ts`;
  - has one measurement hook, `SITTIR_SCRATCH_LEAD_CONFLICTS`: a JSON list of conflict sets
    that `leadGrammar` appends to the grammar's conflicts.
- `WT=<worktree> [ALLOW=<code>] [CONFLICTS=] run.sh <grammar> <mode> [out]` sets the mode
  (`configure.py`), regenerates the grammar (`gen --all`) and records:
  - the parser's defines and the fields of the parameter kinds (`stats.py`);
  - each sample's parameter list as the generated parser reads it (`samples.mts`). It needs only
    the parser, so it runs when codegen refuses;
  - from the gen log, which the repository ignores (`*.log`), codegen's blocking diagnostics with
    the error the run stopped on, and the conflict lines (`extract.py`);
  - when codegen accepts, the generated sizes and the `validate counts` rows.
- `run.sh` declares the mode's conflict sets (`<grammar>-<mode>-conflicts.json`) through the
  hook, unless `CONFLICTS` is empty. `ALLOW` passes one blocking diagnostic to
  `gen --allow-diagnostic`.
- `conflicts.py` found typescript's four sets. It runs `tree-sitter generate`, adding the set each
  conflict report suggests, until the grammar generates.
- `results/` holds each run's output as `<grammar>-<what>-<mode>`.

Modes:
- `base`: the committed grammar.
- `lead`: rust's receiver is an `attributed_parameter` holding a `self_parameter`. Typescript's is
  a `required_parameter` whose `pattern` is `this`, named `this_parameter`.
- `lead-typed` (rust): the receiver may also hold a `parameter` whose `name` is `self`
  (`self: Box<Self>`).
- `-floored`: a lead mode again, with `ALLOW=field-optional-delimiter`. It generates the same
  parser as the lead mode.
- `-undeclared` (typescript): the lead mode without its conflict sets.

## Results

Deltas are against `base`.

### Rust

| | base | lead | lead-typed |
| --- | --- | --- | --- |
| `STATE_COUNT` | 3531 | +9 (+0.25%) | +18 (+0.51%) |
| `LARGE_STATE_COUNT` | 1040 | +4 | +6 |
| `SYMBOL_COUNT` / `ALIAS_COUNT` | 465 / 4 | +1 / 0 | +3 / 0 |
| `FIELD_COUNT` | 80 | +1 | +1 |
| `PRODUCTION_ID_COUNT` | 417 | +2 | +4 |
| rules | 318 | +1 | +3 |
| `parser.c` bytes | 7,061,448 | +23,436 (+0.33%) | +33,427 (+0.47%) |
| conflicts | 7 resolutions | the same 7 | the same 7 |
| codegen | accepts | refuses: `field-optional-delimiter` on `parameters_elements.item` | the same |

`base` rows, each passing in full: from 244, cov 207, read-render-parse 148 (shallow 148),
factory-storage 1670, ir-storage 1375, built-render-parse 1878. The lead modes have no rows.

### Typescript

| | base | lead |
| --- | --- | --- |
| `STATE_COUNT` | 7244 | +40 (+0.55%) |
| `LARGE_STATE_COUNT` | 1192 | +17 |
| `SYMBOL_COUNT` / `ALIAS_COUNT` | 460 / 8 | +3 / 0 |
| `FIELD_COUNT` | 78 | +1 |
| `PRODUCTION_ID_COUNT` | 1561 | +2 |
| rules | 316 | +3 |
| named kinds | 270 | +1 (`this_parameter`) |
| `parser.c` bytes | 11,121,244 | +138,744 (+1.25%) |
| conflicts | 60 resolutions | the 60, and four sets through the hook |
| codegen | accepts | refuses: `field-optional-delimiter` on `formal_parameters_elements.item` |

`base` rows: from 186/186, cov 202/202, read-render-parse 113/116 (shallow 113/116),
factory-storage 1303/1303, ir-storage 1153/1153, built-render-parse 1798/1798. The lead mode has
no rows.

The four sets (`typescript-lead-conflicts.json`):
- `_parameter_name`, `_parameter_name_item`, `primary_expression`;
- `_parameter_name_receiver`, `primary_expression`;
- `_parameter_name_receiver`, `primary_type`;
- `_parameter_name_receiver`, `primary_expression`, `primary_type`.

With them, tree-sitter warns that three of the 60 resolutions' sets are unnecessary:
`_parameter_name` with `primary_expression`, with `primary_type`, and with both
(`typescript-conflicts-lead.txt`).

### Samples

Rust (`rust-samples-*.txt`):
- `lead`: `&self`, `&'a mut self`, `mut self`, `self,` and `#[cfg(x)] self` are the list's
  `receiver`, in a function and in a trait's signature. `self: Box<Self>` stays an `item`, as do
  `a: u8` and a function type's `u8`.
- `lead-typed`: `self: Box<Self>` is the `receiver` too.
- Both: `fn f(a: u8, self)` no longer parses.

Typescript (`typescript-samples-*.txt`):
- `this: Window` is the `receiver`, as `this_parameter`, in each owner sampled:
  - a function declaration and a function expression;
  - a class method and a getter;
  - a function type;
  - an interface's call signature and method signature;
  - an arrow function.
- `this?: Foo` is an `optional_parameter`, which the lead does not admit, so it stays an `item`.
- `function f(a, this: Foo)` no longer parses.
- `function f(readonly)` parses as before. Its `readonly` is a name, at the position where the
  new conflicts sit.

## Findings

1. **One edit covers both grammars.** `lead` is a leading-element split of a list rule with a
   kind restriction per side. Rust's restriction is an unfielded child, typescript's a field, and
   typescript's names its variant. Both generate in tree-sitter.
2. **`@receiver` captures the list item.**
   - The split narrows the list's item, so the field holds an item.
   - Rust's item is `attributed_parameter`, which `bindings.scm` claims as a wrapper whose
     `element` is the parameter inside: `(attributed_parameter (attribute_item)? @dropped (_) @element)`.
     So the portable receiver reaches the `self_parameter` through the wrapper.
   - Typescript's item is the parameter itself.
   - Capturing the `self_parameter` instead would put the field inside the item, where only a
     list position could reach it.
3. **sittir's model has no list with a leading element.** It models a list as one slot of like
   elements: the head and the repeated element must be one field of one shape. The split's head
   is a choice of two fields, so the list is modeled as a compound of two slots instead.
   - Codegen refuses it (`field-optional-delimiter`): every `item` after the first carries the
     `,` as an optional leading delimiter, which only a list can model.
   - Allowing that refusal (`-floored`) stops at the next one:
     - in typescript, `dropped-token`: the compound's template has no place for `,`, so a parsed
       list renders without its commas;
     - in rust, `options.rs` throws: the address `attributed_parameter/after` names two sites, the
       receiver's and the item's (`rust-diagnostics-lead-floored.txt`).
   - The prototype first split at the owner, `parameters`. Codegen refused that as
     `unclassifiable-shape`: a choice with structured arms. That run is not kept.

   So no validation row can be measured until the model has the shape (question 16).
4. **The conflict driver cannot derive the split's conflicts.** Without its four sets, typescript
   stops with `conflict-resolutions-stale` (`typescript-diagnostics-lead-undeclared.txt`): "the saved
   resolutions carry the current grammar hash but no longer generate cleanly; tree-sitter reports
   a conflict on '(' after '(' 'readonly'". Three facts give that:
   - the driver derives on the unbound grammar, and only checks the bound one;
   - resolutions are named in the unbound grammar and applied before `bindGrammar`, so none can
     name a clone;
   - the grammar hash is the unbound grammar's, so a binding never prompts a new derivation.

   A static carry would not do either. Copying each set that names a cloned rule to its clone
   gives the receiver's three sets. It misses `_parameter_name`, `_parameter_name_item`,
   `primary_expression`, which names a rule and its clone together. The contextual-alias probe hit
   the same limit with a binding patch, rust's attribute patch. Rust's split needs no set.
5. **The edit runs after the patches, so it belongs in `bindGrammar`.**
   - Typescript's `_parameter_name` carries an authored patch, `'2/0': field('override')`.
   - Enrich runs before the patches apply. A clone minted in enrich is a rule the patch does not
     address, so `this_parameter` and the rest would lose `override`.
   - Minted in `bindGrammar`, `this_parameter` keeps it: its fields are `required_parameter`'s.
   - The list is itself enrich's mint (`parameters_elements`, `formal_parameters_elements`), so a
     lead in enrich would also have to follow enrich's list extraction.
   - `bindGrammar` is in the DSL layer, so the edit still reaches the parser and the model, and it
     is where the renames and splits run.
6. **The parser accepts the receiver only first.** Both languages require that. The upstream
   grammars accept it anywhere, so with the split `fn f(a: u8, self)` and
   `function f(a, this: Foo)` become parse errors.
7. **The split reaches every owner of the list.** A typescript arrow function's
   `(this: Foo) => 1` gets a `receiver`. Typescript rejects that, but the grammar parses it, and
   no claim routes it: the arrow function is not among the ten owners. The inventory reports such
   a slot as dropped without a reason, so every owner of a split list with no receiver claim needs
   one: a claim, or a `@dropped` line whose `#set! reason` says why.
8. **The variant keeps the item's other slots.** `this_parameter` keeps `decorator`,
   `accessibility_modifier`, `override`, `readonly` and the default `value`, because the match
   narrows only `pattern`. The grammar admits them on `this`, as it admits `async` on a getter.

## Proposal

1. The edit is `lead`, as above and in `prototype.patch`: entries in `Bindings.leads`, applied
   by `bindGrammar` between the renames and the splits, with variants named by the variant
   convention and recorded in `leadFrom`.
2. Each receiver claim anchors the list's first element and captures the item as `@receiver`,
   and every owner captures the rest as `@parameters` (question 19). The derivation emits one
   `lead` per list from the anchored pattern, and the fact it records carries the lead's field.
3. The model work, before any row can move: a list kind with a lead slot (question 16).
4. The conflict driver derives the bound grammar's sets (question 14).

## Open questions

13. **Where the edit runs.** The ruling minted the variants in enrich.
    - (a) In `bindGrammar`, after the patches, as the prototype does. Recommended, by finding 5.
    - (b) In enrich, after its list extraction, with each patch carried to the clones of the rule
      it addresses.
14. **The split's conflicts.**
    - (a) The driver also derives on the bound grammar. Once the unbound grammar converges, it
      derives the sets the bound grammar adds, which `sittirGrammar` applies after
      `bindGrammar`. That derivation is keyed by the bound grammar's own hash, the grammar after
      `bindGrammar`, not by `grammar.bindings.ts`'s `hash`, which also covers the vocabulary: a
      vocabulary edit changes no conflict. Recommended, by finding 4.
    - (b) `bindGrammar` copies each set that names a cloned rule to its clones. Too little for
      typescript, by finding 4.
15. **Rust's typed `self`.**
    - (a) The receiver also admits `self: Box<Self>`, as a variant of its own, claimed as
      `declaration.parameter.self`. Recommended: otherwise a method taking `self: Box<Self>`
      reads as static, with its `self` among its parameters, as it does today. It costs 9 states
      more than (b) (`lead-typed`, measured without the variant's name). Its name is question 18.
      Its claim is an alternation, `(attributed_parameter [(self_parameter) (parameter name: (self))])`,
      which `match` says as two matches in one `within`.
    - (b) The receiver is `self_parameter` alone (`lead`).
16. **The model's list with a lead.**
    - (a) A list kind gains an optional lead slot: one named element before the items, joined to
      them by the list's own separator. `parameters_elements` becomes `{ receiver?, items }` and
      renders `receiver, item, …`. The list recognizer accepts a head that is a choice of the
      lead's field and the item's. Recommended: one slot each, no position in any route, and the
      list keeps its one separator site, so its spacing options keep their addresses.
    - (b) The split list stays a compound, and a patch gives the `,` a named wrapper, as
      `dropped-token` proposes. Then the separator is a slot every build must fill.
17. **The edit's names.**
    - (a) `lead` for the edit and `leads` for its entries, and `match` for the restriction.
      Recommended.
    - (b) `leading` / `leadings`, or `head` / `heads`, with the same `match`.
18. **Where `bindings.scm` names a variant** (typescript's `this_parameter`, and rust's typed
    `self` under 15a).
    - (a) Once, on the claim that classifies the narrowed pattern:
      `((required_parameter pattern: (this)) @declaration.parameter.self (#set! kind "this_parameter"))`.
      The derivation joins the lead's match tree to that claim's pattern by structural equality,
      and refuses a lead with no equal claim, or with two that name different kinds. The claim
      then reads the alias kind at the receiver position. Recommended: one fact, one place.
    - (b) On each receiver claim, `(#set! @receiver kind "this_parameter")`, which ten claims
      repeat and must agree on.
19. **How an owner keeps the rest of its list as `parameters`.** A capture that descends through
    a slot replaces that slot's member, so `@receiver` alone drops `parameters` from every owner
    it descends through.
    - (a) Every owner, function and method alike, captures the rest as the list's items,
      `(parameters (parameters_elements item: (_) @parameters))`. In the bound tree `item` holds
      only the rest, so `receiver` and `parameters` are sibling slots and the rule stands.
      Recommended.
    - (b) Relax the rule, so a slot that a deeper capture descends through keeps its member. That
      changes how routes resolve, which needs its own ruling.
