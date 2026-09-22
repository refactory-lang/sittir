# Alias identity — storage is the grammar symbol, the alias target is display

**Status:** approved design, 2026-09-22 (supersedes the 2026-09-21 draft,
which assumed the native read stamps the alias target; it stamps the grammar
symbol). Implementation plan to follow.

**Goal:** close every open alias defect on the identity model the repo
already has: a parsed node carries two parser-issued identities, the grammar
symbol (`grammar_id()`, the rule that parsed it) and the display kind
(`kind_id()`, the alias target). The grammar symbol is the storage kind. The
display kind is a name over storage kinds. Nothing derives either from the
other by string manipulation, and nothing models an alias as a node the
parser never issues.

**Closes:** #314 (reduced: a hidden twin of a display union), #289
(`publicKindName` underscore strip), #291 (`alias()` cannot promote an
unnamed alias; leaf mints over-tagged `hoisted`), #290 (no primitive mints a
real rule with an authored body), #214 (validator compares display names).

## Global constraints

- DRY: one storage identity per node, stamped by the read from
  `grammar_id()`, consumed everywhere; one display identity, the alias
  target, read from the alias mapping.
- Generated outputs are never hand-edited; every codegen edit regenerates all
  three grammars and commits the manifests.
- Gate for every task: read-render-parse and AST-match rows equal the
  baselines in all three grammars; cargo green; api-surface snapshots change
  only where this spec says they change.
- Comments live in `docs/glossary/`, never in `packages/codegen/src/`.
- Settled facts this spec builds on:
  - The native read stamps `KindId(node.grammar_id())`
    (`read_node.rs::stamped_kind`). The wire `$type` is the storage kind and
    alias display collapses are injective on the wire by construction.
  - `aliasedFrom` names the alias source, `name` the target, in the
    canonical ref form; the older `aliasedTo` form is the same fact in
    transition.
  - tree-sitter applies an alias to every step of inline content: an alias
    over a choice reaches each arm, an alias over a sequence reaches each
    member. Only a symbol, a literal or a pattern is aliased as one node.

## 1. The model, stated once

| identity | source of truth | what keys on it |
| --- | --- | --- |
| storage kind | `grammar_id()`; the rule (or literal symbol) that parsed the node | `$type`, transport structs, factories, wrap dispatch, spacing sites, options addresses |
| display kind | `kind_id()`; the alias target at the site, else the storage kind | node-types, `bindings.scm` queries, the validator's `type`, the display union in the typed surface |

A display kind that is only ever an alias target (`property_identifier`,
`case_as_pattern`, `primitive_type`) is a **display union**: the set of
storage kinds that display under that name. It is a name, not a kind: no
struct, no factory, no wrap function, no supertype entry. The typed surface
exposes it as a union type (`PropertyIdentifier = Identifier |
ReservedIdentifier`) and `is.<display>()` narrows to that union.

A display kind that is also a rule of its own (`generic_type`, aliased from
`generic_type_with_turbofish`) is both: its own storage kind, and a display
union with one more member. The two never collide on the wire because their
grammar symbols differ.

So, at `alias(choice($.identifier, $._reserved_identifier),
$.property_identifier)`, the parser issues grammar ids `identifier`,
`anon_sym_type`, `anon_sym_public`, …, all displaying as
`property_identifier`. The site's storage type is `Identifier |
KindEnum<'type' | 'public' | …, TSKindId.TypeKeyword | …>`: exactly the ids
the parser issues. That typing is correct and stays.

## 2. What is wrong today, per item

### 2.1 A hidden twin of every inline-aliased display union (#314, residual)

`evaluate.ts::synthesizeInlineAliasSources` rewrites
`alias(<inline content>, $.t)` into `rules[_t] = <content>` plus
`alias($._t, $.t)`, so that the alias source has a name for the storage
linkage. tree-sitter never sees `_t` (the rewrite runs on sittir's pass
only), so `_t` is a phantom hidden supertype, and the typed surface carries
it twice: `PropertyIdentifier` and `_PropertyIdentifier`, both
`Identifier | ReservedIdentifier`; `is.propertyIdentifier` narrows to the
twin. Typescript lists `_property_identifier`, `_statement_identifier`,
`_shorthand_property_identifier`, `_shorthand_property_identifier_pattern`,
`_import_identifier`, `_identifier` and `_module_export_name` in its
supertypes this way; rust and python have the same family for
`primitive_type` and `identifier`.

The synthesis is also a misrepresentation for a sequence: tree-sitter aliases
each member, never the sequence as one node, so `_t = seq(…)` describes a
node that does not exist.

### 2.2 Display names by underscore strip (#289)

`publicKindName` is `kind.replace(/^_+/, '')`. It answers two different
questions with one guess: "what is this kind's display name" and "what is a
readable name for this kind's struct or site". `alias($._as_pattern,
$.case_as_pattern)` strips to `as_pattern`, the name of an unrelated rule,
and the two rules' spacing sites collapse. Seventy-one call sites.

### 2.3 Authoring gaps (#290, #291)

`alias()` and `variant()` only wrap content already at a path and always go
through `registerAliasedVariant`, which mints `_<name>` aliased to `<name>`.
There is no way to declare a real rule with an authored body at a path, to
promote an unnamed alias to a named one, or to mint a bare literal as a
supertype member without it being tagged `hoisted`.

### 2.4 The validator compares display names (#214)

`astStructuralDiff` compares `TSNode.type`, the display name, so a wrapper
reparse that does not reproduce the alias position shows `generic_type ≠
generic_type_with_turbofish` and is tolerated by a known pair. The grammar
type is on the node (`grammarType`, `grammarId` in web-tree-sitter) and is
the same in both parses.

### 2.5 Nothing stops an alias over a sequence or a repeat

`alias(seq(a, b), $.t)` and `alias(repeat(x), $.t)` distribute per step in
tree-sitter. The model would describe one node; the parser issues several.
This is the public-field-definition failure, found once, guarded nowhere.

## 3. Design

### 3.1 Inline alias content is distributed, not synthesized

`synthesizeInlineAliasSources` is replaced by distribution, the semantics
tree-sitter itself applies:

- `alias(choice(a, b, …), $.t)` becomes `choice(alias(a, $.t), alias(b, $.t),
  …)`, recursively through nested choices, and through a hidden rule whose
  body is a choice (`_reserved_identifier`) when the alias is the only use of
  it. Each arm then carries its own storage identity with `t` as display:
  a symbol arm is `SYMBOL(a, aliasedTo: t)`; a literal arm is the literal's
  own symbol with display `t`, the form `foldAliasLiteralsIntoEnumRules`
  already consumes.
- `alias(<symbol | literal | pattern>, $.t)` is unchanged.
- `alias(seq(…), $.t)` and `alias(repeat(…), $.t)` are the §3.5 diagnostic.

No `_t` rule is minted. The display union `t` is assembled in the node model
from every site that displays as `t`: `displayUnions: Map<displayName,
Set<storageKind>>`, built once in link from the aliased refs, replacing the
per-consumer walks (`collectAliasedHiddenKinds`, `aliasSourceKinds`,
`includeAliasMemberKinds`'s structural discovery). The typed surface emits one
union type per display union; the `_` twins, their supertype entries, their
`wrap_*` functions and factories disappear. `is.<display>()` narrows to the
union.

`innermostNamedAliasContent` keeps its job for chained aliases: the innermost
symbol is the storage identity, the outermost target the display.

### 3.2 Two name derivations, neither a strip

`publicKindName` is deleted. Its call sites are split by the question they
ask:

- **Display name of a kind at a site**: `displayNameOf(ref)` = the ref's
  alias target when it has one, else the storage kind's own name. Used by
  the options addresses and any surface that must match `bindings.scm` and
  node-types spelling.
- **Identifier for a storage kind**: the storage kind's own name, hidden
  prefix included, through the existing identifier casing
  (`_as_pattern` → `_AsPattern…`, as the transport already spells hidden
  structs). Used by struct names, spacing-site keys, wrap function names.

A spacing site is keyed by storage kind. `case_as_pattern` then works from
the declarative patch alone: `_as_pattern`'s sites are keyed `_as_pattern`,
`as_pattern`'s are keyed `as_pattern`, and the display name
`case_as_pattern` comes from the alias mapping where a display name is
needed. The audit of the seventy-one call sites is the implementation task;
each site records which of the two it uses.

### 3.3 `rule(name, body)`

A new `patches:` placeholder declares a real rule named `name` with the
authored `body` and replaces the content at the path with `SYMBOL(name)`:

```ts
patches: {
  list_comprehension: {
    1: rule('comprehension_clauses', ($) => repeat1(choice($.for_in_clause, $.if_clause)))
  }
}
```

The same name at several paths must carry `rulesEqual` bodies; a mismatch is
a compile-time error naming the paths. The rule is visible unless `name`
starts with `_`. Storage kind equals display kind: there is no alias. The
body callback receives the grammar's `$`, so the rule reaches both pipelines
through wire like every other patch. It carries no `hoisted` annotation.

### 3.4 `alias(name)` promotes; leaf mints are not hoisted

`resolveAliasPlaceholder`'s retarget branch sets `named: true` with
`value: name`; the original content is kept. `registerAliasedVariant` stamps
`hoisted` only on group and arm mints; a bare literal or pattern minted at a
supertype subtype position (`wildcard_pattern`) is a subtype, not a hoist,
and the hoisted census needs no change.

### 3.5 `alias-distributed` diagnostic

The grammar-diagnostics preflight gains one blocking diagnostic: an `ALIAS`
whose content, after looking through hidden single-use rules, is a `SEQ` of
two or more members or a `REPEAT`/`REPEAT1`. It names the rule, the target
and the shape. No grammar hits it today.

### 3.6 The validator compares grammar types

`astStructuralDiff` compares `grammarType` (and the root by `grammarId`)
instead of `type`. The root-alias tolerance, `leafAliasPairs` and the
`renderedKind`/`targetKind` pair at the call site are deleted. The wrapper
reparse stays.

## 4. Acceptance

- **Native**: read-render-parse and AST-match rows equal the baselines in
  rust, typescript and python at every task.
- **Surface**: api-surface snapshots lose the `_<display>` twin declarations
  and nothing else; `is.propertyIdentifier` narrows to `PropertyIdentifier`.
- **Model test**: for every `ALIAS` in each grammar's `grammar.json`, the
  node model has no kind named `_<target>` unless the grammar declares one,
  and `displayUnions.get(target)` equals the set of grammar symbols the
  alias content can produce.
- **Authoring**: the retirement spec's `case_as_pattern` (#289),
  `comprehension_clauses` (#290), `_wildcard_pattern` and
  `string_literal`/`_string_literal_open` (#291) overrides are retired
  through `rule()`, `alias()` and the patch already verified at the
  node-model level, each with byte-identical native output.
- **Diagnostics**: `alias-distributed` fires on an alias over a sequence and
  over a repeat in a unit fixture and is silent on all three grammars.
- **Validator**: the tolerances are gone and the three validation runs match
  the baselines.

## 5. Out of scope

- Splicing rendered text into the real source for reparse; §3.6 removes the
  need.
- Retiring the older `aliasedTo` ref form in favour of `aliasedFrom`; that
  flip is in progress on its own branch and this spec reads whichever form
  a ref carries through one accessor.
- Case spelling of prefixes and markers as render options.
