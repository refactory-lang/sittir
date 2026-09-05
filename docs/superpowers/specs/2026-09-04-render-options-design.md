# Render options — user defaults for real and virtual choices

**Status**: Approved design.
**Scope**: the three grammar packages, codegen, the native reader and renderer, the engine API.

## Problem

Every place output can legitimately vary is fixed today, in one of two ways.

- **Real choices** — alternatives the grammar itself distinguishes, such as a
  statement ending in `;` or an automatic semicolon, or a string delimited by
  double or single quotes — are forms. A caller either names the form or gets
  the arm the grammar config declares as default. There is no way to say "in
  this engine, bare statements get semicolons".
- **Virtual choices** — spellings the grammar cannot see because whitespace
  is an extra: `,` against `, `, statements on one line against one per line,
  the indentation unit — are literals baked into the emitted render code
  (`separator: ","`) and the templates (`join("")`).

Neither is addressable by a user. The engine's existing `format` record was
reserved for this (`slots`, `literals`) but never filled, and what it does
carry is applied as a post-process on the canonical string, which cannot
tell a separator comma from one inside a string literal.

## Decision

One mechanism, the **preference**: a label, the arms a user may pick, the arm
that applies when nothing is set, and the sites that reference it. Real
choices are preferences the grammar declares. Separator spacing is a
preference the compiler synthesizes as if the grammar had declared it. From
that one definition the `Options` type is generated with three tiers and no
knowledge of what any preference is for.

```ts
const engine = createEngine({
  options: {
    // top level — one key per preference label, real or synthesized
    statement_terminator: TSKindId.Semi,
    quote_style: TSKindId.StringDouble,
    comma_separator_space_after: TSKindId.Space,
    empty_separator_space: TSKindId.Newline,

    // kind × slot — the site key under the kind
    formal_parameters: {
      elements_separator_space_after: TSKindId.Newline,
      elements_delimiter: Delimiter.Trailing,
    },
    return_statement: { terminator_statement_terminator: TSKindId.AutomaticSemicolon },

    // supertype × slot — the same keys, applied to every member that has them
    statement: { terminator_statement_terminator: TSKindId.Semi },

    // layout
    indent: '\t',
  },
});

engine.ir.expressionStatement({ expression });          // builds the `semi` form
engine.render(node);                                    // stamps, else options
engine.render(node, { options, reformat: true });       // per-call override
```

### Preferences

1. **Every value is a kind id.** An option's type is the union of the
   `TSKindId` members of its arms: `statement_terminator?: TSKindId.Semi |
   TSKindId.AutomaticSemicolon`, a spacing preference `TSKindId.Tight |
   TSKindId.Space | TSKindId.Newline`. No per-label enum exists; the kind
   catalog already names every arm, and an id is what crosses napi. The one
   exception is the list flank, whose values are the existing `Delimiter`
   bitflag.
2. **Declared preferences.** A real choice is an option only where the
   grammar config declares one:

   ```ts
   patches: {
     _semicolon: preference('statement_terminator', ';'),   // shared hidden choice: every site
     string:     preference('quote_style', 'double'),       // a form split: the split kind itself
     return_statement: { 2: preference('return_terminator', ';') },  // one site only
   }
   ```

   `preference(label, default)` on a choice-shaped kind stamps every arm
   with the label and the matching arm as the preferred one; because arm
   annotations survive inlining, every slot that references the kind is a
   site. A path-level `preference` on a single slot declares a per-site
   label. A choice with a shared hidden kind reuses it (`_semicolon`); a
   choice without one is wrapped into one through `injects:` (below). A
   literal slot shared across sibling arms is never the vehicle: enrich's
   field-enum synthesis merges same-named literal fields into one rule and
   the arms stop distinguishing themselves, so a form split is labelled on
   the split kind. A slot may hold unlabelled arms beside the labelled ones;
   the preference selects among the labelled arms and the extras stay
   reachable only explicitly.
3. **Synthesized preferences: separator spacing.** For every eligible list
   or repeat slot the compiler writes a hidden choice of the whitespace
   kinds into the separator of the render rule: `seq(choice(_tight, _space,
   _newline), token, choice(...))` around a separator token, the choice alone
   for the gap of an unseparated repeat. The arms carry a preference label
   and a default exactly as a declared choice does, so the separator has
   arms and everything downstream is a read of the rule. There is one label
   per distinct separator token and side, `<token>_separator_space_before`
   and `<token>_separator_space_after` (`comma_…`, `semi_…`, `pipe_…`), and
   one for the gap of an unseparated repeat, `empty_separator_space`. The
   token is named by its catalog kind. Only separators are sites: no other
   token is ever wrapped in spacing, and lexically required spacing stays
   the writer's. The implicit default is `space`; a grammar declares its own
   defaults in `patches:` with the same `preference(label, default)` a
   declared choice uses. A key that is a spacing label sets the label's
   default and takes nothing else; a slot-named key under a kind or
   supertype sets that site's default:

   ```ts
   patches: {
     comma_separator_space_before: preference('comma_separator_space_before', 'tight'),
     empty_separator_space:        preference('empty_separator_space', 'newline'),
     _token_tree_paren:            { tokens: preference('empty_separator_space', 'tight') },   // token_tree_paren.tokens_separator_space
     token_repetition:             [{ 0: variant('star') }, { tokens: preference('empty_separator_space', 'tight') }],
   }
   ```

   Wire lifts these into the grammar's render defaults, an object in the
   shape of the `Options` type with arm names for values, before any patch
   composes onto a rule; no rule is created for a label key. A default
   naming no preference, no site or no whitespace arm is a build error
   naming the key.
4. **Eligibility.** A repeat whose rule, or anything beneath its content,
   is `immediate` or tokenized, or whose elements are external scanner
   tokens, admits no extras between them — string and template fragments —
   and its separator is left alone. These are stamped facts on the rule,
   not heuristics. A separator the grammar chooses per instance keeps its
   kind-id match and gets no spacing preference.
5. **Synthesized preferences: array flanks and indentation.** Every kind
   that holds exactly one unseparated array gets two more choices written
   around that array in its render rule, `start` and `end`, whose arms are
   the whitespace kinds plus `indent` for the start and `dedent` for the
   end. They are addressed at the kind level — `block_start`, `block_end` —
   in `patches:`, in `Options` and in the native site table; a supertype
   address applies to each member. The label defaults to the address and a
   grammar may name it freely, so two kinds can share one label:

   ```ts
   patches: {
     block_start:            preference('block_body_start', 'indent'),
     block_end:              preference('block_body_end', 'dedent'),
     declaration_list_start: preference('block_body_start', 'indent'),
   }
   ```

   The default arm is `tight`, and both flanks are written only when the
   array has items, so an empty block stays `{}`. `indent` is one level
   deeper then a newline; `dedent` is one level shallower then a newline; a
   plain newline keeps the depth. `_indent` and `_dedent` are never-scanned
   externals wherever the grammar has none of its own, declared through
   `visibleExternals` as `indent()` and `dedent()`; their render text is an
   in-band mark followed by the newline, and the writer strips the mark,
   moves its depth and writes depth × the `indent` option after every
   newline once the next text arrives — so a closing delimiter after a
   `dedent` lands at the outer depth and a blank line carries no trailing
   spaces. A kind holding several unseparated arrays is a build error
   naming them.
6. **Synthesized preferences: the list flank.** A list whose leading or trailing
   flank the grammar leaves optional gets the `delimiter` preference, typed
   by exactly the `Delimiter` members the factory's own `delimiter` option
   offers, from the same derivation. Where every flank is fixed there is no
   such key. It has no top-level key: a flank belongs to one list.
7. **Whitespace kinds are externals.** `_tight` (empty text), `_space`,
   `_newline`, `_indent` and `_dedent` are registered as external tokens the scanner never emits,
   with their render text declared through `visibleExternals`. They receive
   parser-issued symbol ids, satisfy the every-kind-has-a-kindId invariant,
   appear in no rule, and are therefore never valid in any parse state.
   Python reuses its real `_newline`. Nothing compounds a token with its
   whitespace: a gap is two independent kinds, the separator and the space.

### The generated `Options` type

- **Top level:** one key per preference label, for every declared and every
  spacing preference; one key per array-flank address (`block_start`,
  `statement_start` for a supertype); `indent`, the indentation unit. Every site of a label
  must agree on its arms and default, otherwise the build fails.
- **Kind × slot:** a key per kind that owns at least one site, holding one
  key per site: `<slot>_<label>` for a declared preference,
  `<slot>_separator_space`, `_before` or `_after` for separator spacing —
  the token is the slot's own and is not repeated — and `<slot>_delimiter`.
- **Supertype × slot:** a key per supertype whose members own a site,
  holding the union, key by key, of what its members declare; the
  membership is the node map's, the same table the wrap emitter uses.
- Kinds and supertypes are spelled by their visible names. Labels, kind
  names, supertype names and `indent` share one namespace; a collision is a
  codegen error.

### What is emitted

`options.ts` in each grammar package is the `Options` type and a type-only
import of the enums it names, nothing else. There is no runtime catalog:
the facts that resolve an options object are emitted into the code that
consumes them, once each. The spaced render rules are one pass, consumed by
the options emitter and the render emitters and by nothing else; the site
list is a read of those rules beside the model's declared choices.

## Where each tier takes effect

`arm.default` is the *semantic* default: what a bare construction means in
the absence of any value (a bare trait clause is the positive one). It is
consumed by the coercer and is not a formatting option; only a
`preference` declaration puts a real choice in `Options`. A closed choice
with neither is semantics, and gets no key.

### `injects:`

`groups:` generalises into `injects:`. A rule defined there is structurally
matched against the grammar and every match is replaced by a reference to
it, exactly as `groups:` does today; visibility follows the name, so a
`_`-prefixed inject is a hidden rule and an unprefixed one is a visible
kind under an alias. Wrapping a choice into a hidden kind so a preference
can be declared once is therefore a declaration, never a rule rewrite.

### Construction tier

The generated coercer module is a factory over the declared half of
`Options`. Every tie-break that today reads the `arm.default` annotation
reads the configured arm instead. Module-level `ir` is the factory applied
to the grammar's declared defaults, which remain the grammar's own statement
of preference; `engine.ir` is the factory applied to the engine's options
over them. Two engines with different options coexist; nothing is global.
Strict factories are untouched: a strict call names its form.

A parsed node carries its form as its kind and its enum slots as literal
kinds, so it is never re-formed by options, and `reformat` does not touch
this tier: changing a parsed statement's terminator is a transform, not
formatting.

### Read side

The native reader stamps, per occurrence, the whitespace kind on each side
of a separator token and in each empty gap, by classifying the bytes: no
bytes is `_tight`, spaces or tabs are `_space`, anything containing a line
break is `_newline`. Comments in the gap are trivia already and do not
affect the class. The stamps are the values of the injected choices; the
flank stamp is the list's existing `_delimiter`. Mixed spellings in one list
are kept as they are; the stamps are facts, not a consensus.

`extract_format` keeps producing `indent` by consensus over line starts.
Its reserved `slots` and `literals` members are removed; this design is
what they were reserved for.

### Render side

The injected choices live in the render rules only: one pass over the
normalized rules, owned by the emitter side, rewrites the separator of every
eligible multiplicity-bearing rule as described under Preferences, and only
the render and template emitters read the result. Assemble, the linked
rule, the factories, the types and the wrap layer never see the choice;
moving it into the linked rule, and the factory surface for composite
separators, come later. A site is wherever the multiplicity-bearing rule
lives, so a separated-list kind owns its own spacing and flank however
many owners share it, and an owner kind owns the sites of a repeat inlined
into its own rule. Each whitespace choice is one transport field on that
kind, `Option<u16>` named by the site key (`elements_separator_space_before`,
wire `_elements_separator_space_before`); the native fill writes the resolved option into every
unset field of every transport before dispatch, so a value the wire carried
wins and no owner fills another kind's fields. The emitted render function
builds the slot's list view from those fields alone — `before`, `token`,
`after` and the flanks — and `Joined` writes before + token + after between
items, token + after for a leading flank, before + token for a trailing
flank. Templates name the slot and nothing else; no template contains a
join filter, and the askama pipeline stays.

A `_newline` join writes the line break and then the current indentation
unit repeated to the nesting depth the writer tracks from the block kinds it
has entered.

### Precedence

For any slot the render tier owns:

```
per-call options with reformat  >  the occurrence's stamp  >  engine options  >  grammar default
```

and within one options object, for a given site:

```
kind × slot  >  supertype × slot  >  the label's top-level value  >  the preference's default
```

Without `reformat`, per-call options behave like engine options: they fill
unstamped slots only, which is what splicing a built node into a parsed file
needs. A tree handle offers `options()` returning the majority stamp per
key, so a caller who wants new nodes to follow the file passes that as the
per-call options.

This inverts one existing behaviour: the engine-level format record used to
outrank a tree's inferred format. Under this design the node's own stamps
outrank engine options, and only an explicit `reformat` overrides them.

## Engine and boundary API

- `EngineOptions.options?: Options` — the generated per-grammar interface,
  every key optional, every value a kind id or a `Delimiter` member.
- `EngineOptions.format` narrows to `boundary`.
- `engine.ir` — the coercer surface with the engine's declared defaults.
- `render(node, { options?, reformat? })` on engines and tree handles.
- `tree.options()` — majority stamps per key for a parsed tree.
- Native: `SittirEngine` takes the options object once at construction and
  resolves it to one kind id per site there, applying the precedence above
  and rejecting unknown keys; per-call options travel the same way. Per
  node, only ids ever cross napi.

## Verification

- **Whitespace round-trip inside lists and repeats**: read then render with
  no options and no `reformat` reproduces every separated-list and repeat
  region byte-for-byte. A validator metric beside the existing fifteen, with
  a per-grammar floor that only rises.
- **Scanner inertness**: parsing the corpus with the extended externals
  table yields byte-identical CSTs to the unextended parser.
- **Type shape**: per grammar, a snapshot of the emitted `options.ts`, and a
  type-level test assigning one valid and one invalid member per tier — a
  top-level label, a kind × slot key, a supertype × slot key, and
  `delimiter` present exactly where a flank is optional.
- **Synthesis**: a comma repeat's separator becomes the three-part seq
  whose choices carry the label and the default, an unseparated repeat gets
  the gap choice, a tokenized, immediate or external repeat is left alone,
  a default resolves kind × slot before supertype × slot before the label
  before `space`, and a default naming no preference, no site or no
  whitespace arm fails naming the key.
- **Behaviour**: a built node takes engine options; a parsed node keeps its
  stamps; `reformat` rewrites whitespace and never a parsed form;
  `engine.ir` picks the configured form while module `ir` picks the
  grammar's default; per-call options without `reformat` fill only unstamped
  slots.
- Every existing gate stays identical: validator history compared
  numerically, the codegen suite at its baseline, package suites green,
  examples rendering the same bytes.

## Out of scope

- Retiring askama in favour of emitted Rust render bodies. Separators are
  already built in emitted Rust, so this design does not depend on it; the
  static-spacing plan remains the reason to do it.
- Any change to lexically required spacing, or spacing around any token
  that is not a list separator.
- Transforming a parsed node's form. That is an edit, expressed through
  `$with` or a rebuild, not an option.
