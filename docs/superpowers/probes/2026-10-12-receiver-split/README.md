# Receiver split: a leading-element list edit

**Question.** A claim that anchors a parameter list's first element as `@receiver` derives a
grammar edit, `lead`. What does the edit cost rust's `parameters` and typescript's
`formal_parameters`: parse states, `parser.c`, conflicts and validation rows? How does
`grammar.bindings.ts` spell it, which `bindGrammar` verb applies it, and does the module stay
erasable in both executions of the grammar? What does `@receiver` capture: the list item, or the
`self_parameter` inside it?

The edit was first measured splitting the list's first position (the container form). sittir's
model refused that list, so the maintainer asked for two rules instead: a receiver form, in which
the receiver leads the rest of the list, and the plain list. Which shape of the two rules does the
model accept as is? What does the edit name, and how do `()`, `(&self)`, `(&self,)`, `(&self, a)`
and `(a, b)` render and round-trip? The receiver slot is named, so can the bindings generate the
split by themselves, with no group from enrich?

**Answer.**
- Two rules work in one shape, the plain shape. The receiver form holds the plain list after its
  separator, and every field that held the list holds a choice of the plain list and the
  receiver form:
  `seq(field('receiver', LEAD), optional(seq(',', optional(field('elements', <list>)))))`.
  - enrich lifts the receiver form's `,` and the list after it into a group, `<receiver
    form>_group`, which holds the list. The edit runs after enrich, so enrich runs again, whole,
    over every rule the edit creates (question 22). With the group, sittir's model accepts the
    shape in both grammars as is, and every validation row passes.
  - Every case round-trips byte for byte, `(&self,)` included, except that typescript's `this: T`
    renders `this : T`. Without the group, a lone comma after the receiver is dropped.
  - Rust costs 18 parse states (+0.51%), 30 KB of `parser.c` (+0.43%) and no conflict.
    Typescript costs 46 states (+0.64%), 137 KB (+1.23%) and the container form's four conflict
    sets.
- The other shapes fail:
  - the literal reading, a receiver followed by items that each carry a leading `,`, is refused
    in both grammars (`dropped-token`). enrich does not break it: its run can match nothing, and
    enrich never lifts such a run into a kind of its own;
  - with its run made non-empty and left unbroken, it is refused too
    (`field-optional-delimiter`). enrich breaks that run into a list with a leading separator,
    which the model accepts, but the receiver form's template then keeps only the lone `,` beside
    the list and drops the list. Lifting the run by hand fails the same way.
- Two arms in place of the group fail too: a receiver alone with an optional `,`, beside a
  receiver, a `,` and the plain list. They give the plain shape's parser, and codegen accepts
  them without a diagnostic, but the template prints the `,` as text, so `(&self)` renders
  `(&self,)` (rust: read-render-parse 141/148 and built-render-parse 1840/1876 by AST match).
  The named `receiver` slot does not tell the arms apart, since both hold it (finding 17).
- The container form has no rows, because the model refuses it.
- `@receiver` captures the list item, because the split narrows the item: the `receiver` field
  sits where an item would. Rust's item is the `attributed_parameter` wrapper, whose element is
  the `self_parameter`, so no route addresses a position.
- The bindings generate the split already: the derivation reads the anchored `@receiver` claim
  into the lead. The group is not theirs to decide. It is what the model needs to record a lone
  `,`, and enrich's synthesis decides it, so a group minted by the bindings restates enrich.
- Every question is ruled. The lead stays in `bindGrammar`, and the whole of enrich runs again
  over every rule a grammar-bindings edit newly creates; a renamed rule does not pass again
  (question 22). That second pass gives the plain shape the group's rows, but enrich is not yet
  a fixpoint, so it waits until enrich is one (finding 19).

## The edit

`lead(list, item, field, ...admits)` edits one separated list rule,
`seq(field(item, X), repeat(seq(SEP, field(item, X))), optional(SEP))`, with or without the
trailing separator. `LEAD` is the item narrowed to what `admits` admits, and `REST` the item
narrowed to everything else. The edit emits two rules:
- the plain list: the list rule itself, every item narrowed to `REST`;
- the receiver form, `seq(field(field, LEAD), optional(seq(SEP, optional(field(F, <list>)))))`,
  minted as `_<list>_<field>` and aliased `<list>_<field>`, where `F` is the field that holds the
  list in its owners. enrich, run again over the rules the edit creates, lifts its optional into
  a group,
  `<list>_<field>_group` = `seq(SEP, optional(field(F, <list>)))`, so the receiver form is
  `seq(field(field, LEAD), optional(<list>_<field>_group))` (question 22).

Every field that held the list then holds a choice of the plain list and the receiver form. So
the parser accepts the receiver only first, and the plain list never holds it.

The container form, measured first, edits the list in place instead: its first element becomes a
choice of `field(field, LEAD)` and `field(item, REST)`, and every later element holds `REST`.
Setup lists every form the probe measured.

`match(kind, within?, as?)` admits one kind of the item:
- `within` restricts it further, to an unfielded child (an array of matches) or to one field (a
  one-key record of matches), and nests;
- `as` names the lead's variant, a parser alias. Without it a visible variant is named
  `<kind>_<field>`, and a hidden one keeps its kind's name (question 20); the prototype keeps the
  kind's name in both cases.

A match tree is its claim's pattern: `(required_parameter pattern: (this))` is
`match('required_parameter', { pattern: [match('this')] })`.

In `grammar.bindings.ts`, beside the renames and splits:

```ts
// rust
leads: [lead('parameters_elements', 'item', 'receiver', match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] }, 'typed_self_parameter')], 'attributed_parameter_receiver'))],
// typescript
leads: [lead('formal_parameters_elements', 'item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter'))],
```

**Variants.** Each side narrows the rules between the item and the matched kind.
- On the rest's side, a rule reached only through the list is narrowed in place. A visible kind
  that is reached from elsewhere too is narrowed in place under `INPLACE` (finding 11). Without
  it the prototype clones that kind, which gives the kind a second site.
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
- rust `lead-typed-named`: `lead-typed` with its visible variants named. It mints
  `_attributed_parameter_receiver`, aliased `attributed_parameter_receiver`, and
  `_parameter_receiver`, aliased `typed_self_parameter`. Under `INPLACE` the rest narrows
  `parameter` in place, so `_parameter_item` is not minted.
- typescript: `_required_parameter_receiver`, aliased `this_parameter`. Also
  `_parameter_name_receiver` and `_parameter_name_item`, clones of the hidden rule that holds
  `pattern`, which `optional_parameter` shares. The rest narrows `required_parameter` in place.
- The two rules add the receiver form: `_parameters_elements_receiver`, aliased
  `parameters_elements_receiver`, in rust; `_formal_parameters_elements_receiver`, aliased
  `formal_parameters_elements_receiver`, in typescript. The plain list keeps its name. The plain
  shape's group is `parameters_elements_receiver_group` and
  `formal_parameters_elements_receiver_group`. The tail shape also mints `_<list>_receiver_tail`,
  aliased `<list>_receiver_tail`, and the items shape `<list>_receiver_items`.

**The verb.** `bindGrammar` applies `leadGrammar(grammar, leads)` after the renames and before
the splits. Entries name the grammar's own kinds, which the renames map, as a split's do. The
prototype maps only the list's name; the probe's grammars carry no renames.

**Both executions.** `grammar.bindings.ts` holds only calls of the DSL's functions on literals,
and the prototype adds only interfaces and functions to `bind.ts`, so Node's type stripping runs
both unchanged. Every lead run below exercises both executions: tree-sitter generated the edited
grammar through Node, and sittir's codegen evaluated it.
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
  by kind. In the container form's bound list, `receiver` and `item` both admit
  `attributed_parameter`, so a kind selector anchored first would fall back to the optional-slot
  tests: a position route.
- A capture that descends through a slot replaces that slot's member. So `@receiver` alone would
  drop the owner's `parameters`, and every owner captures the rest as the list's items. In the
  bound tree `item` holds only the rest, so `receiver` and `parameters` are sibling slots.
- Under the two rules the bound tree holds the receiver in the receiver form, and the rest in its
  group:
  `(parameters elements: (parameters_elements_receiver receiver: … (parameters_elements_receiver_group elements: (parameters_elements …))))`.
  The receiver claim still anchors the grammar's own list, which the derivation reads into the
  lead, and the stamped route reaches `receiver` through the receiver form's arm of
  `parameters.elements`. The rest sits at two paths: `parameters.elements`, and
  `parameters.elements` then the group's `elements` (question 19).

## Setup

- A worktree of `feat/bindings` at `8a80d34a3`, with `prototype.patch` applied and
  `pnpm install`. The same change is committed as source on `proto/receiver-split` at
  `cefef884d`, with the grammars in base mode.
  - The committed grammars pass no grammar bindings at that commit, so a lead mode's bindings
    hold its lead alone.
  - The validator commits its records to the worktree's branch after each run.
- `prototype.patch`:
  - adds `lead`, `match` and `leadGrammar` to `packages/codegen/src/dsl/bind.ts`;
  - applies `leadGrammar` in `bindGrammar`;
  - exports the two builders from `dsl-authoring.ts`;
  - has six measurement hooks, each an environment variable:
    - `SITTIR_SCRATCH_LEAD_FORM` picks the form: `container` (the default), `two-rules-repeat`,
      `two-rules`, `two-rules-tail`, `two-rules-plain`, `two-rules-plain-group`,
      `two-rules-items` or `two-arms`;
    - `SITTIR_SCRATCH_LEAD_REST_IN_PLACE` narrows the rest's shared visible kinds in place;
    - `SITTIR_SCRATCH_LEAD_CONFLICTS` names a JSON list of conflict sets, which `leadGrammar`
      appends to the grammar's conflicts;
    - `SITTIR_SCRATCH_PINS` names a JSON list of transports, which replaces the grammar's boxed
      payloads (`render-module.ts`);
    - `SITTIR_SCRATCH_PAYLOADS` names a file, where the payload ceiling check writes the pinned
      and payload transports; the check then drops the pins no choice holds;
    - `SITTIR_SCRATCH_LENIENT_READ_TESTS` turns a portable read test's refusal into a
      `[scratch]` warning (`read-tests.ts`).
- `WT=<worktree> [FORM=<form>] [INPLACE=1] [ALLOW=<code>] [CONFLICTS=] run.sh <grammar> <mode> [out]`
  sets the mode (`configure.py`), regenerates the grammar (`gen --all`) and records:
  - the parser's defines and the fields of the parameter kinds (`stats.py`);
  - each sample's parameter list as the generated parser reads it (`samples.mts`). It needs only
    the parser, so it runs when codegen refuses;
  - from the gen log, which the repository ignores (`*.log`), codegen's blocking diagnostics with
    the error the run stopped on and the hooks' warnings, and the conflict lines
    (`extract.py gen`);
  - when codegen accepts, the generated sizes, and the `validate counts` rows with the first
    failures each lists (`extract.py validate`).
- `run.sh` declares the mode's conflict sets (`<grammar>-<mode>-conflicts.json`) through the
  hook, unless `CONFLICTS` is empty. `ALLOW` passes one blocking diagnostic to
  `gen --allow-diagnostic`. `FORM` sets the form; a form's run also pins the transports
  `<grammar>-<mode>-pins.json` lists and makes the read tests lenient. `INPLACE` narrows the rest
  in place.
- `conflicts.py` found typescript's four sets. It runs `tree-sitter generate`, adding the set each
  conflict report suggests, until the grammar generates. Every form needs the same four: with
  them each generates, and tree-sitter reports none of them unnecessary.
- `roundtrip.py <worktree> <grammar>` reads each case's parameter list with the worktree's
  `probe-kind` and renders it. It then splices the render into the source and parses that again.
  It compares named nodes, fields and leaf text, so it does not see a dropped anonymous token.
- `enrich-shapes.mts` runs the worktree's `enrich()` on a toy grammar holding each form's
  receiver form, and prints the rules it rewrites and mints (`results/enrich-shapes.txt`). The edit
  runs after enrich, so this is the only run that passes a receiver form through enrich.
- `results/` holds each run's output as `<grammar>-<what>-<label>`. The label is the mode, then
  the form, then `-inplace`, `-floored` or `-undeclared`.

Modes:
- `base`: the committed grammar.
- `lead`: rust's receiver is an `attributed_parameter` holding a `self_parameter`. Typescript's is
  a `required_parameter` whose `pattern` is `this`, named `this_parameter`.
- `lead-typed` (rust): the receiver may also hold a `parameter` whose `name` is `self`
  (`self: Box<Self>`).
- `lead-typed-named` (rust): `lead-typed` with the receiver's visible variants named,
  `attributed_parameter_receiver` and `typed_self_parameter`.
- `-floored`: a lead mode again, with `ALLOW=field-optional-delimiter`. It generates the same
  parser as the lead mode.
- `-undeclared` (typescript): the lead mode without its conflict sets.

Forms (`FORM`). In each, every field that held the list holds a choice of the plain list and
the receiver form. The receiver form is:
- `two-rules-repeat`: `seq(field(receiver, LEAD), repeat(seq(SEP, field(item, REST))), optional(SEP))`,
  the receiver followed by items that each carry a leading separator;
- `two-rules`: `seq(field(receiver, LEAD), optional(choice(SEP, seq(repeat1(seq(SEP, field(item, REST))), optional(SEP)))))`,
  the same run folded into one optional. The run alone is the leading-run list that python's
  `expression_list` ends with;
- `two-rules-tail`: the same, with the run lifted into a kind of its own,
  `field(F, <list>_receiver_tail)`;
- `two-rules-plain`: `seq(field(receiver, LEAD), optional(seq(SEP, optional(field(F, <list>)))))`,
  the plain list itself after the separator;
- `two-rules-plain-group`: the plain shape as enrich leaves it. The receiver form is
  `seq(field(receiver, LEAD), optional(<form>_group))`, and `<form>_group` is
  `seq(SEP, optional(field(F, <list>)))`, stamped `hoisted` and referenced as a group lift;
- `two-rules-items`: the `two-rules` shape as enrich leaves it. The run is a list kind of its own,
  `<form>_items` = `seq(repeat1(seq(SEP, field(item, REST))), optional(SEP))`, held in a field
  `items` beside the lone `SEP`, and both arms are marked as forms of the receiver form.

- `two-arms`: `choice(seq(field(receiver, LEAD), optional(SEP)), seq(field(receiver, LEAD), SEP, field(F, <list>)))`,
  a receiver alone beside a receiver followed by the plain list, each arm marked as a form of the
  receiver form.

`two-rules-plain-group` and `two-rules-items` emit what `enrich-shapes.mts` shows enrich minting
for their shapes. enrich keeps `two-arms` as written: it marks the arms, and leaves the
`optional(SEP)` bare, with no slot and no group.

Rust's two-rules runs use `lead-typed-named` with `INPLACE`. The repeat form was also run first as
`lead-typed`, without either (`*-lead-typed-two-rules-repeat.*`).

## Results

Deltas are against `base`.

### Container form: rust

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

### Container form: typescript

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

### Two rules: rust

| | base | repeat | `two-rules` | tail | items | plain | plain + group | two arms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `STATE_COUNT` | 3531 | +18 (+0.51%) | +18 (+0.51%) | +19 (+0.54%) | +19 (+0.54%) | +17 (+0.48%) | +18 (+0.51%) | +17 (+0.48%) |
| `LARGE_STATE_COUNT` | 1040 | +6 | +6 | +6 | +6 | +5 | +5 | +5 |
| `SYMBOL_COUNT` / `ALIAS_COUNT` | 465 / 4 | +3 / 0 | +3 / 0 | +4 / 0 | +4 / 0 | +3 / 0 | +4 / 0 | +3 / 0 |
| `FIELD_COUNT` | 80 | +1 | +1 | +1 | +2 | +1 | +1 | +1 |
| `PRODUCTION_ID_COUNT` | 417 | +5 | +5 | +6 | +6 | +5 | +4 | +5 |
| rules | 318 | +3 | +3 | +4 | +4 | +3 | +4 | +3 |
| named kinds | 287 | +3 | +3 | +4 | +4 | +3 | +4 | +3 |
| `parser.c` bytes | 7,061,448 | +35,168 (+0.50%) | +35,168 (+0.50%) | +36,134 (+0.51%) | +36,136 (+0.51%) | +29,435 (+0.42%) | +30,064 (+0.43%) | +29,435 (+0.42%) |
| conflicts | 7 resolutions | the same 7 | the same 7 | the same 7 | the same 7 | the same 7 | the same 7 | the same 7 |
| codegen | accepts | refuses: `dropped-token` | refuses: `field-optional-delimiter` | accepts | accepts | accepts | accepts | accepts |
| native binding bytes | 7,490,336 | | | +98,816 (+1.32%) | +98,816 (+1.32%) | +49,472 (+0.66%) | +65,920 (+0.88%) | +49,472 (+0.66%) |
| generated source bytes | 7,307,125 | | | +41,349 (+0.57%) | +43,496 (+0.60%) | +9,023 (+0.12%) | +26,573 (+0.36%) | +8,970 (+0.12%) |

The first `repeat` run, unnamed and cloning the rest (`lead-typed`), costs +24 states and
+38,397 bytes, and stops earlier, in `options.rs` (finding 10).

### Two rules: typescript

| | base | repeat | `two-rules` | tail | items | plain | plain + group |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `STATE_COUNT` | 7244 | +46 (+0.64%) | +46 (+0.64%) | +47 (+0.65%) | +47 (+0.65%) | +45 (+0.62%) | +46 (+0.64%) |
| `LARGE_STATE_COUNT` | 1192 | +17 | +17 | +17 | +17 | +16 | +16 |
| `SYMBOL_COUNT` / `ALIAS_COUNT` | 460 / 8 | +4 / 0 | +4 / 0 | +5 / 0 | +5 / 0 | +4 / 0 | +5 / 0 |
| `FIELD_COUNT` | 78 | +1 | +1 | +1 | +2 | +1 | +1 |
| `PRODUCTION_ID_COUNT` | 1561 | +3 | +3 | +4 | +4 | +3 | +2 |
| rules | 316 | +4 | +4 | +5 | +5 | +4 | +5 |
| named kinds | 270 | +2 | +2 | +3 | +3 | +2 | +3 |
| `parser.c` bytes | 11,121,244 | +142,679 (+1.28%) | +142,679 (+1.28%) | +143,558 (+1.29%) | +143,558 (+1.29%) | +136,156 (+1.22%) | +136,992 (+1.23%) |
| conflicts | 60 resolutions | the 60 and the four sets | the same | the same | the same | the same | the same |
| codegen | accepts | refuses: `dropped-token` | refuses: `field-optional-delimiter` | accepts | accepts | accepts | accepts |
| native binding bytes | 8,212,272 | | | +98,928 (+1.20%) | +98,928 (+1.20%) | +82,400 (+1.00%) | +98,848 (+1.20%) |
| generated source bytes | 7,275,206 | | | +71,973 (+0.99%) | +74,290 (+1.02%) | +45,497 (+0.63%) | +62,339 (+0.86%) |

Every form needs the container form's four sets, and with them tree-sitter warns about the same
three unnecessary ones (`typescript-conflicts-lead-two-rules*.txt`).

### Two rules: rows

Rust:

| row | base | plain | plain + group | tail | items | two arms |
| --- | --- | --- | --- | --- | --- | --- |
| from | 244 | 247 | 248 | 248 | 248 | 247 |
| cov | 207/207 | 210/210 | 211/211 | 210/211 | 210/211 | 210/210 |
| read-render-parse (AST match) | 148/148 | 148/148 | 148/148 | 140/148 | 140/148 | 141/148 |
| read-render-parse shallow | 148/148 | 148/148 | 148/148 | 148/148 | 148/148 | 148/148 |
| factory-storage | 1670 | 1678 | 1681 | 1679 | 1679 | 1678 |
| ir-storage | 1375 | 1379 | 1379 | 1380 | 1380 | 1379 |
| built-render-parse (AST match) | 1878/1878 | 1876/1876 | 1876/1876 | 1826/1876 | 1826/1876 | 1840/1876 |
| S-class ratchet | holds | holds | holds | S5: 1 entry | S5: 1 entry | holds |

Typescript:

| row | base | plain | plain + group | tail | items |
| --- | --- | --- | --- | --- | --- |
| from | 186 | 188 | 189 | 189 | 189 |
| cov | 202/202 | 204/204 | 205/205 | 204/205 | 204/205 |
| read-render-parse (AST match) | 113/116 | 113/116 | 113/116 | 113/116 | 113/116 |
| read-render-parse shallow | 113/116 | 113/116 | 113/116 | 113/116 | 113/116 |
| factory-storage | 1303 | 1307 | 1308 | 1308 | 1308 |
| ir-storage | 1153 | 1157 | 1157 | 1158 | 1158 |
| built-render-parse (AST match) | 1798/1798 | 1798/1798 | 1798/1798 | 1798/1798 | 1798/1798 |
| S-class ratchet | holds | holds | holds | S5: 1 entry | S5: 1 entry |

Every row of both plain shapes passes. The tail's and the items' failures are in
`*-rows-*-two-rules-tail*.txt` and `*-rows-*-two-rules-items*.txt`; the two arms' are in
`rust-rows-lead-typed-named-two-arms-inplace.txt`, each a receiver form that gained a `,`. The
two arms were not run on typescript. The template follows from the shape, so typescript is
expected to fail the same way.

### Two rules: round-trips

`*-roundtrip-*-two-rules-plain*.txt`. "Same tree" means the same named nodes, fields and leaf text,
and every case below reparses to the same tree.

| source list | plain | plain + group | two arms |
| --- | --- | --- | --- |
| `fn f()` | `()` | `()` | `()` |
| `fn f(&self)` | `(&self)` | `(&self)` | `(&self,)`, changed |
| `fn f(&self,)` | `(&self)`, changed | `(&self,)` | `(&self,)` |
| `fn f(&self, a: u8)` | `(&self, a: u8)` | `(&self, a: u8)` | `(&self, a: u8)` |
| `fn f(&self, a: u8,)` | `(&self, a: u8,)` | `(&self, a: u8,)` | `(&self, a: u8,)` |
| `fn f(a: u8, b: u16)` | `(a: u8, b: u16)` | `(a: u8, b: u16)` | `(a: u8, b: u16)` |
| `fn f(self: Box<Self>, a: u8)` | `(self: Box<Self>, a: u8)` | `(self: Box<Self>, a: u8)` | `(self: Box<Self>, a: u8)` |
| `fn f(#[cfg(x)] self)` | `(#[cfg(x)] self)` | `(#[cfg(x)] self)` | `(#[cfg(x)] self,)`, changed |
| `function f()` | `()` | `()` | not run |
| `function f(this: T)` | `(this : T)`, changed | `(this : T)`, changed | not run |
| `function f(this: T,)` | `(this : T)`, changed | `(this : T,)`, changed | not run |
| `function f(this: T, a)` | `(this : T, a)`, changed | `(this : T, a)`, changed | not run |
| `function f(this: T, a,)` | `(this : T, a,)`, changed | `(this : T, a,)`, changed | not run |
| `function f(a, b)` | `(a, b)` | `(a, b)` | not run |
| `function f(this?: T)` | `(this?: T)` | `(this?: T)` | not run |

With the group, rust's text is unchanged in every case, and typescript's changes only by the space
before `:` (finding 13). The two arms change every receiver without a rest by adding a `,`
(`rust-roundtrip-lead-typed-named-two-arms-inplace.txt`).

Rust's tail shape (`rust-roundtrip-lead-typed-named-two-rules-tail-inplace.txt`) renders
`(&self)`, `(&self,)`, `(&self, a: u8)` and `(&self, a: u8,)` all as `(&self,)`, and
`(self: Box<Self>, a: u8)` as `(self: Box<Self>,)`. The cases with a rest reparse to a different
tree. The items shape renders the same in both grammars
(`*-roundtrip-*-two-rules-items*.txt`).

### Samples

Rust (`rust-samples-*.txt`):
- `lead`: `&self`, `&'a mut self`, `mut self`, `self,` and `#[cfg(x)] self` are the list's
  `receiver`, in a function and in a trait's signature. `self: Box<Self>` stays an `item`, as do
  `a: u8` and a function type's `u8`.
- `lead-typed`: `self: Box<Self>` is the `receiver` too.
- The two rules (`lead-typed-named-two-rules-plain-inplace`): a list with a receiver is a
  `parameters_elements_receiver`. Its `receiver` holds an `attributed_parameter_receiver`, around
  a `self_parameter` or a `typed_self_parameter`, and its `elements` hold the plain
  `parameters_elements`. A list without one is the plain list, as in `fn f(a: u8)` and a function
  type's `fn(u8, u16)`.
- With the group (`lead-typed-named-two-rules-plain-group-inplace`), the `,` and the plain list
  sit in a `parameters_elements_receiver_group` after the receiver, and `fn f(self,)` keeps an
  empty group, which holds the `,`.
- The two arms (`lead-typed-named-two-arms-inplace`) parse every sample as the plain shape does.
- Every lead mode and form: `fn f(a: u8, self)` no longer parses.

Typescript (`typescript-samples-*.txt`):
- `this: Window` is the `receiver`, as `this_parameter`, in each owner sampled:
  - a function declaration and a function expression;
  - a class method and a getter;
  - a function type;
  - an interface's call signature and method signature;
  - an arrow function.
- Under the two rules the receiver sits in a `formal_parameters_elements_receiver`, and the rest
  in its `elements`, the plain `formal_parameters_elements`.
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
   elements: the head and the repeated element must be one field of one shape. The container
   form's head is a choice of two fields, so the list is modeled as a compound of two slots
   instead.
   - Codegen refuses it (`field-optional-delimiter`): every `item` after the first carries the
     `,` as an optional leading delimiter, which only a list can model.
   - Allowing that refusal (`-floored`) stops at the next one:
     - in typescript, `dropped-token`: the compound's template has no place for `,`, so a parsed
       list renders without its commas;
     - in rust, `options.rs` throws: the address `attributed_parameter/after` names two sites, the
       receiver's and the item's (`rust-diagnostics-lead-floored.txt`).
   - The prototype first split at the owner, `parameters`. Codegen refused that as
     `unclassifiable-shape`: a choice with structured arms. That run is not kept.

   So the container form has no validation row. The two rules avoid the shape (finding 9).
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
9. **Of the two rules' shapes, only the plain one passes.** Each shape is a receiver form beside
   the plain list. They differ in what follows the receiver. The edit runs after enrich, so each
   shape reaches the model as the edit writes it; finding 16 is what enrich makes of each.
   - `two-rules-repeat` is refused in both grammars with `dropped-token` on the receiver form:
     its `,` "is neither template text nor a slot". A repeated separator and item read as a list
     only behind a head of the same field.
   - `two-rules` is refused in both with `field-optional-delimiter` on the receiver form's `item`.
     The receiver form is a compound, not a list, so its `item` carries the optional trailing
     `,`, which only a list kind models.
   - The two describe one language and give one parser: the same counts in each grammar.
   - `two-rules-tail` is accepted, but the receiver form's template is `$receiver ","`. It keeps
     the bare separator and has no slot for the tail, which the S-class ratchet reports as new
     S5 debt (`coverage-missing-field`). So `(&self, a: u8)` renders `(&self,)`, a different
     tree (rust: read-render-parse 140/148, built-render-parse 1826/1876).
   - `two-rules-plain` is accepted, and every row passes. The rest is the plain list itself, so
     the list keeps its own separator and trailing separator. The receiver form adds one `,` of
     its own: `$receiver if(elements: "," $elements)`.
   - `two-rules-items`, the `two-rules` shape as enrich breaks it, is accepted but fails as the
     tail does: its template keeps only the lone `,` arm.
   - `two-rules-plain-group`, the plain shape as enrich groups it, is accepted, every row passes,
     and every case round-trips byte for byte in rust.
10. **A visible variant needs a name of its own.** A variant aliased back to its kind's name
    gives that kind a second site, and the render options refuse an address that names two sites.
    - Unnamed, rust's repeat form stopped in `options.rs`: "address 'attributed_parameter/after'
      names '(attributed_parameter)/after', which is 2 sites"
      (`rust-diagnostics-lead-typed-two-rules-repeat.txt`). The container form's floored run
      stopped there too.
    - Named `attributed_parameter_receiver` and `typed_self_parameter`, with the rest narrowed in
      place (finding 11), the same form reaches the template check.
    - Typescript's visible variant has a name from the start, `this_parameter`. A hidden variant,
      such as `_parameter_name_receiver`, has no site and needs no name.
11. **The rest narrows a shared visible kind in place.** Rust's `parameter` is reached from
    closures (`_closure_parameters_optional1`) as well as from the list.
    - A clone for the rest aliased `parameter` would be a second site (finding 10).
    - A clone with a new name would rename every parameter but the receiver.
    - So the rest narrows `parameter` itself (`INPLACE`). Its `name` loses `self`, and
      `|self: u8|` stops parsing, which rustc rejects anyway.
    - Typescript's shared rule, `_parameter_name`, is hidden, so the rest clones it.
12. **Without enrich's group, a lone comma after the receiver is dropped.** The edit runs after
    enrich, so in the plain shape the model meets the receiver form's
    `optional(seq(',', optional(field('elements', <list>))))` as the edit wrote it.
    - Its template prints `,` only with `elements`: `if(elements: "," if(elements: $elements))`.
      The optional that holds the `,` has no slot but the optional `elements`, so nothing records
      a `,` without the rest, and `(&self,)` renders `(&self)`, the same named tree without the
      `,` token.
    - enrich lifts every optional of that shape into a group (finding 16), so no base rule of
      rust, typescript or python reaches the model in it. Codegen accepts the unlifted shape
      without a diagnostic.
    - With the group (`two-rules-plain-group`) the `,` survives. The receiver form tests the group,
      `$receiver if(<group>: $<group>)`, and the group prints its `,` unconditionally,
      `"," if(elements: $elements)`, so `(&self,)` renders `(&self,)`.
    - No corpus sample has the case, so the rows do not see the difference. A sample would fail
      read-render-parse without the group, since it compares tokens too.
13. **A narrowed keyword slot renders a space after it.** `this_parameter`'s `pattern` admits only
    `this`, so its template writes `this` as text between two seams
    (`~pattern_before 'this' ~pattern_after`). `required_parameter` has the slot `$pattern` and no
    seam.
    - The after-seam's default is a space, and the type annotation after it starts with `:`, so
      `this: T` renders `this : T`. The reparse is the same tree.
    - Rust's `typed_self_parameter` writes `self` the same way, but its `:` is its own text with a
      `colon_before` seam, so `self: Box<Self>` renders unchanged.
14. **The rows count the new kinds, but no fixture builds them.**
    - The plain shape adds rust's three new kinds and typescript's two to from, cov,
      factory-storage and ir-storage. Rust gains 3, 3, 8 and 4; typescript 2, 2, 4 and 4.
    - Built-render-parse has no fixture of a new kind.
    - Rust's row has two `parameter` fixtures fewer, render and round-trip (37 to 36 each),
      because `parameter` no longer admits `self` as its name.
15. **The bound grammars move transports under the payload ceiling.** The native build requires
    every pinned boxed payload to be over the 256-byte ceiling. Under the plain and tail shapes,
    these fall under it:
    - rust: `AttributeInputTransport`, `AttributeItemTransport`, `AttributeTransport` and
      `InnerAttributeItemTransport`;
    - typescript: `AsExpressionTransport`, `CallSignatureTransport`, `CatchClauseGroupTransport`,
      `CatchClauseTransport`, `ConstructSignatureTransport`, `OptionalTupleParameterTransport`,
      `ParenthesizedExpressionTypedTransport`, `SatisfiesExpressionTransport` and
      `VariableDeclaratorDefiniteTransport`.

    `<grammar>-<mode>-pins.json` is each grammar's `BOXED_PAYLOADS` without them, and the group
    and items shapes build with the same pins. The edit's implementation unpins them in
    `boxed-payloads.ts`.
16. **What enrich makes of each receiver form** (`enrich-shapes.mts`, `results/enrich-shapes.txt`).
    No grammar run passes a receiver form through enrich, so this runs enrich on each directly.
    - The plain shape: the optional after the receiver is inline-unsafe, since its one slot is
      itself optional. So enrich mints a visible group, `<form>_group` =
      `seq(',', optional(field('elements', <list>)))`, stamped `hoisted`, and the receiver form
      becomes `seq(field('receiver', LEAD), optional(<form>_group))`. The group seats on the
      receiver form as an optional slot of its own, which the model gives the `forwarded` seat,
      and the list stays inside it as `elements`.
    - The literal shape (`two-rules-repeat`) comes out unchanged. Its run, `repeat(seq(',', item))`
      then `optional(',')`, matches the empty string, and enrich never lifts an empty-matching body
      into a kind, since tree-sitter refuses a named rule that matches nothing. A separator and
      one item make a single slot, so enrich mints no group of a comma and an item either. The
      model then meets the `,` inside a bare repeat: `dropped-token`.
    - With its run made non-empty (`two-rules`), enrich lifts the run into a list with a leading
      separator, `<form>_items` = `seq(repeat1(seq(',', field('item', REST))), optional(','))`. The
      list sits in a field `items` beside the lone `,`, and both arms are marked as forms of the
      receiver form. Measured as `two-rules-items`, codegen accepts it, but the receiver form's
      template keeps only the `,` arm, as the tail's does: `(&self, a: u8)` renders `(&self,)`.
    - So with enrich's break, the literal shape still needs a choice between a lone `,` and the
      list of comma-led items, which the template cannot hold. The plain shape has no such choice:
      its `,` is the group's text, and the group holds the plain list.
17. **Two arms keep no more than the plain shape.** The receiver form as two arms, a receiver
    with an optional `,` beside a receiver, a `,` and the plain list, says what the plain shape
    says.
    - Tree-sitter builds the same parser from it: +17 states and +29,435 bytes, as the plain
      shape costs. The generated sources differ from the plain shape's only in `transport.rs`, by
      53 bytes.
    - enrich keeps it as written (finding 16's probe): it marks each arm a form of the receiver
      form, and leaves the first arm's `optional(',')` bare, with no slot and no group.
    - The model folds the two arms into one template, `$receiver "," if(elements: $elements)`.
      The `,` is text, printed whether the source had it or not, so `(&self)` renders
      `(&self,)`. Every receiver without a rest fails the rows, and codegen gives no diagnostic.
    - One fact is at stake: whether a `,` follows a receiver that has no rest. The plain shape
      loses `(&self,)` (finding 12), and the two arms lose `(&self)`. The group records it by its
      presence. Three arms, each a kind of its own, would record it too, at a kind per arm; the
      probe did not measure them.
    - The named `receiver` slot tells nothing here: both arms hold it, and they differ only by the
      `,` and the list.
18. **Where a lead can run.** The lead needs enrich's list and the patches' field names, and its
    output needs enrich's group.
    - enrich mints the list (`parameters_elements`) and the groups in one per-rule pass, the
      clause hoist (`applyClauseHoist`). No point inside enrich falls between the two. A lead in
      enrich runs after the hoist, and the hoist then runs again over the rules the lead mints and
      rewrites. enrich's later passes reach those rules as they reach any rule.
    - Before wire, a rule has its upstream field names. Rust's typed-self match tests
      `parameter`'s `name`, which the authored patch `'1': field('name')` makes of upstream's
      `pattern`. enrich already reads each patch's field site, its path and name (`fieldSites`),
      so a lead in enrich resolves `name` to index 1 from that fact.
    - Wire applies a rule's patches by the rule's name, so a clone minted before wire lacks them.
      Typescript's `_parameter_name` carries `'2/0': field('override')`, and its lead clones
      narrow only `pattern`, at index 4. The patch's path holds in each clone, so wire can apply
      an origin's patches to its clones through `leadFrom`.
    - A lead in enrich is in the grammar the conflict driver derives on, so the driver derives the
      lead's sets as it derives any rule's (finding 4).
19. **A second enrich pass gives the group's rows, but enrich is not a fixpoint.** Implement
    measured question 22's ruling on `proto/receiver-split`'s prototype (branch
    `proto/q22-reenrich`): the plain shape, with the whole of enrich run again over the rules the
    lead creates, as its `leadFrom` stamp names them.
    - The rows equal `two-rules-plain-group`'s in rust and typescript.
    - The second pass needs no field sites before wire: it runs after the patches, so the clones
      already hold the fields the patches give their origins.
    - enrich is not a fixpoint over its own output. A second pass over its pre-wire output throws
      in rust, mints arms again in typescript and a group again in python. Wire's patches also
      add content the first pass never saw.
    - So the second pass waits until enrich is a fixpoint (question 22).

## Proposal

1. The edit is `lead`, as above and in `prototype.patch`: entries in `Bindings.leads`, applied
   by `bindGrammar` between the renames and the splits, with variants named by the variant
   convention and recorded in `leadFrom`. It emits the plain shape: the plain list narrowed to
   the rest, and the receiver form `<list>_<field>`, which holds the receiver and then the plain
   list. Every field that held the list holds a choice of the two (question 16). Every rule it
   creates passes through the whole of enrich again, which lifts the receiver form's `,` and the
   list after it into the group `<list>_<field>_group` (question 22).
2. A visible variant is never aliased to its kind's own name. It takes `as`, which its
   classifying claim gives (question 18), or else `<kind>_<field>` (question 20). The rest
   narrows a shared visible kind in place, and clones a shared hidden rule.
3. Each receiver claim anchors the list's first element and captures the item as `@receiver`,
   and every owner captures the rest as `@parameters` (question 19). The derivation emits one
   `lead` per list from the anchored pattern, and the fact it records carries the lead's field.
4. No model work: the model accepts the plain shape and its group as is, and the group keeps a
   lone comma (finding 12).
5. The conflict driver derives the bound grammar's sets (question 14).
6. The edit's implementation unpins the transports the bound grammar moves under the payload
   ceiling (finding 15).

## Questions

13. **Where the edit runs.** Ruled: in `bindGrammar`, after the patches (finding 5).
14. **The split's conflicts.** Ruled: the driver also derives on the bound grammar, keyed by the
    bound grammar's own hash (finding 4).
15. **Rust's typed `self`.** Ruled: the receiver also admits `self: Box<Self>`, as a variant of
    its own.
16. **The shape of the two rules.** Ruled: the plain shape, through enrich's group synthesis.
    The receiver form holds the receiver, then an optional group holding the `,` and the plain
    list.
17. **The edit's names.** Ruled: `lead` for the edit and `leads` for its entries, and `match` for
    the restriction.
18. **Where `bindings.scm` names a variant.** Ruled: once, on the claim that classifies the
    narrowed pattern, joined to the lead's match tree by structural equality.
19. **How an owner keeps the rest of its list as `parameters`.** Ruled: every owner captures the
    rest as now, against the grammar's own list,
    `(parameters (parameters_elements item: (_) @parameters))`, and the derivation maps that
    capture to both paths the rest takes, as it maps the receiver claim to the lead. `receiver`
    and `parameters` stay sibling slots. With the group, the second path runs through it:
    `parameters.elements`, then the group, then its `elements`. The probe runs the interim
    claims, so it measures neither route.
20. **The names the edit mints when no claim names them.** Ruled: the variant convention. The
    receiver form is `<list>_<field>` (`parameters_elements_receiver`,
    `formal_parameters_elements_receiver`), a visible variant is `<kind>_<field>`
    (`attributed_parameter_receiver`), and a claim's name overrides it (`this_parameter`,
    `typed_self_parameter`). A visible variant never keeps its kind's name (finding 10). The group
    takes enrich's name for it, `<list>_<field>_group`.
21. **Typescript's type-only export** (`export type {A} from`, `export type * from`). Ruled: a
    refinement, `statement.export.type`, mirroring `statement.import.type`. The vocabulary pass
    may rename the segment.
22. **How the edit's output meets enrich's group synthesis.** Ruled by the maintainer: enrich
    runs again, whole, over every rule a grammar-bindings edit newly creates, "pretty much splits
    and merges, but may include others". A renamed rule does not pass again. The lead stays in
    `bindGrammar`, after the patches (question 13 holds). The probe's `two-rules-plain-group`
    writes the group by hand; under the ruling, enrich's second pass mints it.
    - Measured (finding 19): the second pass gives the plain shape `two-rules-plain-group`'s
      rows in rust and typescript, and needs no field sites before wire. enrich is not a
      fixpoint over its own output.
    - Status: the maintainer ruled that enrich becomes a fixpoint first, in its own change to
      master, which implement plans. The second pass over a bindings edit's rules comes after it,
      in stage 2, with no narrower pass in the meantime.
    - Left for stage 2, after the fixpoint: which current and planned edits create rules, by the
      stamp each puts on what it mints (`splitFrom`, `leadFrom`), never a comparison of rule
      names; and the plain shape's `(&self)` and `(&self,)` round-trips and parser and size
      deltas against `two-rules-plain-group`.
