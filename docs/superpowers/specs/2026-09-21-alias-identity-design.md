# Alias identity — one kind per alias site

**Status:** approved design, 2026-09-21. Implementation plan to follow.

**Goal:** every alias site in a grammar resolves to exactly one kind, the one
the parser issues there, and every layer downstream of link reads that one
identity. The alias source contributes a body or a text admission and nothing
else.

**Closes:** #314 (aliased choices leak their arms as kinds), #289
(`publicKindName` underscore strip collides under a non-matching alias), #291
(`alias()` cannot promote an unnamed alias; leaf mints over-tagged `hoisted`),
#290 (no primitive mints a real rule with an authored body), #214 (validator
tolerates alias display-name mismatches), the S1 alias-identity audit (native
read stamps the context id while factories stamp the canonical id) and the
ts/py follow-on of the nested-supertype alias materialization.

## Global constraints

- DRY: one identity per site, stamped once in link, consumed everywhere.
- Generated outputs are never hand-edited; every codegen edit regenerates all
  three grammars and commits the manifests.
- Gate for every task: read-render-parse and AST-match rows equal the
  baselines in all three grammars; cargo green; the api-surface snapshots
  change only where this spec says they change.
- Comments live in `docs/glossary/`, never in `packages/codegen/src/`.
- Settled facts this spec builds on and does not reopen:
  - `aliasedFrom` names the alias **source**; `name` names the target.
  - The enrich unaliasing pass drops a base alias whose source and target
    shapes differ, so the source surfaces under its own name.
  - An alias is never placed over a multi-member sequence directly:
    tree-sitter distributes the alias over the members.

## 1. The problem

tree-sitter's `alias(X, Y)` makes the parser issue kind `Y` for every match of
`X`. `X` decides the text and the children; `Y` is the only identity a parsed
node carries.

sittir models the site with two identities. After link a symbol ref is
`{ name: X, kindId: id(X), aliasedTo: Y, aliasedToId: id(Y) }`, and every
consumer derives the parse kind as `aliasedToId ?? kindId`. The split shows up
as a family of defects:

- **Arms typed as kinds** (#314). `alias(choice($.identifier,
  $._reserved_identifier), $.property_identifier)` types the site as
  `KindEnum<'declare' | … | 'let', TSKindId.DeclareKeyword | …> |
  _PropertyIdentifier | …`. The keyword ids exist in the parser but are never
  issued here; the parser issues `property_identifier`. Rust's
  `primitive_type` (`alias(choice('u8', …), $.primitive_type)`) shows the same
  `KindEnum<'u8' | …, TSKindId.U8Keyword | …>`.
- **The target modelled as a supertype over its arms, twice.**
  `PropertyIdentifier = Identifier | ReservedIdentifier` and
  `_PropertyIdentifier = Identifier | ReservedIdentifier`, both listed in the
  grammar's supertypes. A parsed `property_identifier` is a leaf and matches
  neither member; reads only work through a per-site alias map in wrap
  (`"member_expression.property": { "property_identifier": "identifier" }`)
  that stores the node as `Identifier` and loses the kind.
- **Names derived by stripping** (#289). `publicKindName` is
  `kind.replace(/^_+/, '')`. `alias($._as_pattern, $.case_as_pattern)` strips
  `_as_pattern` to `as_pattern`, the name of an unrelated rule, and the two
  rules' spacing sites collapse into one struct. Seventy-one call sites depend
  on "stripped name equals display name".
- **Stamps not consumed** (S1). Link stamps the pair, but wrap dispatches by
  kind name (lossy where two parser symbols share a display name), the
  transport's per-slot enum loses the stamp under supertype expansion, and the
  alias-unwrap arm assumes a kind-keyed child that a leaf-shaped alias value
  never has.
- **Authoring gaps** (#290, #291). `alias()` and `variant()` only wrap content
  that already sits at a path and always mint an alias-wrapped hidden rule, so
  the comprehension rewrite and the `case_as_pattern` split stay hand-written
  `rules:` overrides, and an unnamed alias cannot be promoted to a named one.
- **Validator tolerance** (#214). The structural diff tolerates a root whose
  display name differs from the original's by a known alias pair, because the
  synthetic reparse wrapper cannot reproduce the alias-triggering position.

Every item is the split, seen from a different layer.

## 2. Alias classes

At any alias site the parser issues one kind: the target. That leaves four
classes, each with one rule.

| class | site shape | rule |
| --- | --- | --- |
| 1 | a literal, or a choice of literals, aliased to a name | the target is a text leaf; the literals are its spelling set |
| 2 | a hidden rule aliased to a visible name, shapes compatible | the target is the kind; the source is its body |
| 3 | a rule aliased to a name whose own shape differs | enrich drops the alias; the source keeps its own name (existing pass, criterion tightened) |
| 4 | an alias over a repeat, or over a multi-step body that is inlined | compile-time diagnostic |

Census, from `grammar.json` (`ALIAS` whose content is a `CHOICE`), the class 1
sites:

| grammar | rule | target | arms |
| --- | --- | --- | --- |
| typescript | `_property_name` | `property_identifier` | `identifier`, `_reserved_identifier` |
| typescript | `labeled_statement` | `statement_identifier` | `identifier`, `_reserved_identifier` |
| typescript | `object` (×2) | `shorthand_property_identifier` | `identifier`, `_reserved_identifier` |
| typescript | `object_pattern` (×2), `object_assignment_pattern` | `shorthand_property_identifier_pattern` | `identifier`, `_reserved_identifier` |
| rust | `_type`, `where_predicate`, `_non_special_token` | `primitive_type` | 17 strings |
| rust | `_expression_except_range`, `_pattern`, `_path` | `identifier` | 17 strings |
| rust | `_reserved_identifier` | `identifier` | 3 strings |
| python | `keyword_identifier` (×2) | `identifier` | 4 and 2 strings |

The class 3 sites the unaliasing pass currently leaves in place, all rust:
`generic_type_with_turbofish → generic_type` (`scoped_identifier`,
`scoped_type_identifier_in_expression_position`, `tuple_struct_pattern`),
`delim_token_tree → token_tree` (`macro_invocation`, `_delim_tokens`,
`attribute_arm`, `attribute_input`), `scoped_type_identifier_in_expression_position
→ scoped_type_identifier` (`struct_expression`), `_let_chain → let_chain`
(`_condition`).

## 3. The identity model

### 3.1 One stamp

After link a symbol ref is:

```ts
{ type: SYMBOL, name: <kind the parser issues>, kindId: <its id>, aliasedFrom?: <source rule name> }
```

`aliasedTo` and `aliasedToId` are deleted from `SymbolRule` and from every
phase's rule type. `stampAliasTargetId` is deleted; `stampSymbolRefKindIds`
resolves `kindId` by `name`, which is now always the parser's name for the
site. The `aliasedToId ?? kindId` fallbacks in `deriveValuesForRule` and the
`subtypeRestampPairsOf` restamp machinery go with them: there is nothing to
restamp.

`aliasedFrom` is provenance. Its readers are transform's path descent
(`descendThroughAlias`, so an authored patch path written against the base
grammar still resolves) and the parse-kind collision diagnostics. No emitter
reads it. `dsl/builders.ts::attributeAlias` produces the same form.

### 3.2 Class 1: the target is a text leaf

`resolveRule` links `alias(<literal or choice of literals>, $.t)` to
`SYMBOL(t)` and registers `t` as a pattern-shaped leaf whose **admission** is
the set of spellings. The admission is a new leaf attribute,
`spellings: readonly string[]`, beside `textPattern`; a leaf may carry either
or both:

- `alias(choice('u8', 'i8', …), $.primitive_type)`: `primitive_type` has
  `spellings: ['u8', 'i8', …]` and no pattern.
- `alias(choice($.identifier, $._reserved_identifier), $.property_identifier)`:
  `property_identifier` has `textPattern` from `identifier` and `spellings`
  from `_reserved_identifier`.

When a target is aliased from several sites, their admissions merge. This
replaces `foldAliasLiteralsIntoEnumRules`, whose job was to append alias
spellings to an enum kind's member set: there is no enum kind at an alias site
any more.

Typing follows the admission. A leaf with spellings only is typed as the
string union of its spellings; a leaf with a pattern is typed `string`. The
loose surface admits a string; the builder guards the text against the
admission (spelling set, or the anchored pattern, or their union). No keyword
kind id is stored, admitted or emitted at the site. This is the same shape the
lexed-interior enum ruling produced for `integer_literal.suffix`.

`KindEnum` stays exactly where it is right today for unaliased choices of
literals: there the parser does issue the anon symbols.

### 3.3 Class 2: the target is the kind, the source is its body

`resolveRule` links `alias($._x, $.t)` to `SYMBOL(t)`. `t`'s body is `_x`'s
body. Three cases:

- `t` has no rule of its own (`case_as_pattern`, every enrich-minted visible
  group): `t` is registered with `_x`'s resolved body.
- `t` has its own rule and it is `rulesEqual` to `_x`'s: one kind, one body.
- `t` has its own rule and the bodies differ: the enrich unaliasing pass has
  already dropped this alias (class 3). A mismatch that reaches link is a
  compile-time error naming both rules; link never chooses.

A hidden rule whose every use is as an alias source is **not a kind**: no
node-map entry, no interface, no factory, no wrap function, no `_` twin. The
`_PropertyIdentifier` family, `aliasedHiddenKinds` on `LinkedGrammar`,
`NormalizedGrammar` and `NodeMap`, `collectAliasedHiddenKinds`,
`unhideAliasedTargets` and `assemble.ts::aliasSourceKinds` are deleted. A
hidden rule that is also referenced directly elsewhere stays a hidden helper
there, as today.

The kind's name is the parser's name, so `publicKindName` is the identity
function on kinds and is deleted with its underscore strip; its call sites read
`kind` directly. `case_as_pattern` needs no special handling: `_as_pattern`
never becomes a kind, so nothing collides with `as_pattern`.

### 3.4 Class 3: the unaliasing pass, criterion tightened

The pass keeps its shape. Its criterion becomes: drop the alias when the
source's resolved body is not `rulesEqual` to the target's, with literal
members compared by value. The nine rust sites listed in §2 fall under this
and are dropped; each source then surfaces under its own name, as
`generic_type_with_turbofish` already does in the node model. The
`parsekind-noninjective` diagnostic is then empty for all three grammars and
stays a ratchet at zero.

### 3.5 Class 4: a diagnostic

The grammar-diagnostics preflight gains one blocking diagnostic,
`alias-distributed`: an `ALIAS` whose content is a `REPEAT`/`REPEAT1`, or a
`SEQ` of two or more members whose rule is listed in `inline`. tree-sitter
splices the steps into the parent and applies the alias to each, so the model
would describe one node where the parser issues several. The diagnostic names
the rule, the alias target and the offending shape. No grammar hits it today;
it stops the next author from re-creating the public-field-definition
failure.

## 4. Authoring: `rule()` and a named `alias()`

### 4.1 `rule(name, body)`

A new `patches:` placeholder. At a path it declares a real rule named `name`
with the authored `body` and replaces the content at the path with
`SYMBOL(name)`:

```ts
patches: {
  list_comprehension: {
    1: rule('comprehension_clauses', ($) => repeat1(choice($.for_in_clause, $.if_clause)))
  }
}
```

The same name at several paths must carry `rulesEqual` bodies; a mismatch is a
compile-time error naming the paths. The rule is visible unless `name` starts
with `_`. It carries no `hoisted` annotation: `hoisted` is for group and arm
mints seated by a parent, and a `rule()` mint is seated by its own name. The
body callback receives the same `$` the grammar's rule callbacks receive, so
it participates in both pipelines through wire, like every other patch.

Storage kind equals parse kind by construction: there is no alias wrapper.

### 4.2 `alias(name)` on an unnamed alias

`resolveAliasPlaceholder`'s retarget branch sets `named: true` together with
`value: name`. Promoting an unnamed alias to a named one is a rename of the
face, not a mint, and the original content (the `[bc]?"` pattern of rust's
`string_literal`) is kept.

### 4.3 `hoisted` on leaf mints

`registerAliasedVariant` stamps `hoisted` only on group and arm mints. A bare
literal or pattern minted as a kind at a supertype subtype position
(`wildcard_pattern`) is not hoisted; it is a subtype. The hoisted census is
unchanged, since the over-tag is what put a leaf in front of it.

### 4.4 Acceptance cases

The rule re-authoring retirement's `case_as_pattern` (#289),
`comprehension_clauses` (#290), `_wildcard_pattern` and
`string_literal`/`_string_literal_open` (#291) entries are retired through
these primitives, each with byte-identical native output.

## 5. Consumers

With one identity the following are deleted or reduced. Each is a workaround
for the split; none has a job once the split is gone.

| layer | today | after |
| --- | --- | --- |
| wrap (`emitters/wrap.ts`) | dispatch by `KIND_NAMES` id→name; per-site alias maps (`"member_expression.property": {…}`) | dispatch by numeric kind id from the stamp; no alias maps |
| transport (`transport-common.ts`, `render-module.ts`) | `acceptedTransportKinds` resolves hidden-kind visible aliases through `aliasedHiddenKinds`; `emitAliasUnwrapRecurseArm`; per-slot enum arms keyed by storage kind while expanded arms are keyed by concrete kind | accepted ids are the stamped ids; no unwrap arm; one key |
| types (`emitters/types.ts`) | class 1 sites widen the input surface with a keyword `KindEnum`; `_` twins | leaf typed by its admission; no twins |
| `is.*` / narrowers | `is.propertyIdentifier` narrows to `_PropertyIdentifier` | narrows to `PropertyIdentifier`, a leaf |
| ir / factories | leaf factory per alias source | one leaf factory per target |
| supertypes | `property_identifier` and `_property_identifier` listed as supertypes over their arms | neither is a supertype |
| nested-supertype materialization | rust landed; ts/py follow-on open | covered: a nested-supertype member is an ordinary ref with one id |
| validator | root-alias tolerance and `leafAliasPairs` in `astStructuralDiff`; type compared by name | both tolerances deleted; compare stamped kind ids |

The native read is unchanged: it already stamps `node.kind_id()`, which is
the target's id. That stamp becomes correct by construction instead of
needing the restamp.

## 6. Gates and tests

- **Native**: read-render-parse and AST-match rows equal the baselines in
  rust, typescript and python at every task; `parsekind-noninjective` is
  empty and ratcheted at zero.
- **Surface**: the api-surface snapshots change only by losing the keyword
  `KindEnum` alternatives at the sixteen class 1 sites and the `_`-twin
  declarations; a snapshot diff outside those is a stop.
- **Census test**: a unit test walks each grammar's `grammar.json` for
  `ALIAS` sites, classifies them by §2, and asserts for classes 1 and 2 that
  the node model's kind at the site is the alias target and that no kind is
  registered under the source's name unless it is referenced directly
  elsewhere.
- **Link tests**: `SymbolRule` has no `aliasedTo`/`aliasedToId`; an alias
  over compatible bodies yields one kind; an alias over incompatible bodies
  that reaches link throws naming both rules; class 1 admissions merge across
  sites.
- **Authoring tests**: `rule()` at one path and at two paths with equal and
  unequal bodies; `alias()` on an unnamed alias yields `named: true`;
  `wildcard_pattern` carries no `hoisted`.
- **Diagnostics test**: `alias-distributed` fires on an alias over a repeat
  and on an inlined multi-step alias, and is silent on all three grammars.
- **Validator**: the tolerance branches are gone and the three validation
  runs match the baselines without them.

## 7. Out of scope

- Splicing rendered text into the real source for reparse (#214's proposed
  mechanism). Class 3 removes the mismatch the tolerance covered.
- Case spelling of prefixes and markers as render options; a separate spec.
- Retiring `aliasedFrom` provenance itself. Transform's path descent needs
  it while authored patch paths are written against the base grammar.
