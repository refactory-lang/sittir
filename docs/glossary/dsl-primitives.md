# `packages/codegen/src/dsl/primitives` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/primitives/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/dsl/primitives/field.ts::maybeKeywordSymbol`

Rewrites a field's content so a STRING it holds, directly or through an optional, becomes a reference to a hidden keyword rule (`synthesizeKwSymbol`), and returns any other content unchanged. Tree-sitter's normalizer strips a FIELD around a bare STRING, so the label survives only through a SYMBOL; wire inlines the rule, so the parser still sees the token at the site. The rule holds the token alone: a precedence around the site stays in the parent rule, and the inlined token takes it there. The one-arg `field()` placeholder (`transform/transform.ts::resolveFieldPlaceholder`) and the two-arg `field(name, 'text')` (`buildTwoArgFieldResult`) both use it.

#### body

```text
/* Tree-sitter's FIELD(OPTIONAL(SYMBOL)) survives; FIELD(OPTIONAL(STRING))
	   may not. */
```

An optional in either representation is read through `optionalContentOf`; the
rewritten content is rebuilt in the representation it had
(`withOptionalContent`).

### `packages/codegen/src/dsl/primitives/field.ts::synthesizeKwSymbol`

Mints the hidden keyword rule a field over a text points at (`wire/wire.ts::wireMintKeyword`) and returns a SYMBOL reference to it. Outside a wire() context it throws.

### `packages/codegen/src/dsl/primitives/field.ts::field`

```text
/**
 * Two-arg form delegates to the runtime's native field. One-arg form
 * returns a placeholder for transform patches.
 *
 * When the two-arg form is called with a bare STRING literal content
 * (e.g. `field('async', 'async')`), the content is substituted with a
 * synthesized SYMBOL reference to a hidden keyword rule (named by `wire/keyword-names.ts::resolveKeywordNames`). This
 * mirrors transform.ts's placeholder path — tree-sitter's grammar
 * normalizer strips FIELD wrappers around bare STRING, so we indirect
 * through a SYMBOL to preserve the field in the parse tree.
 *
 * Return type is a discriminated union: the one-arg placeholder has
 * a readable `__sittirPlaceholder` brand; the two-arg result matches
 * whatever shape the runtime-injected `field()` produces (`type: 'FIELD'`
 * in both the sittir and tree-sitter-CLI runtimes).
 */
```

### `packages/codegen/src/dsl/primitives/field.ts::buildTwoArgFieldResult`

```text
/**
 * Invoke the runtime-injected `field()` function, symbolize any bare STRING
 * content, and tag the result `metadata.fieldSource: 'override'`.
 *
 * @remarks
 * The native `field()` call normalizes `content` into a rule shape (plain
 * JS strings become STRING rules). If the normalized inner content is a bare
 * STRING, we swap it for a SYMBOL reference to a synthesized `_kw_<name>`
 * hidden rule so tree-sitter's grammar normalizer preserves the FIELD wrapper
 * around it (the normalizer strips FIELD wrappers around bare STRING nodes).
 * wire() later auto-inlines the helper back into the parse state machine so
 * the parser still sees the original bare token at the call site.
 * Tagging `metadata.fieldSource: 'override'` (in the opaque metadata bag)
 * records that a
 * user-authored `field()` call produced this rule, for diagnostics only.
 *
 * @param native - The runtime-injected `field(name, content)` function.
 * @param name - The field name to assign.
 * @param content - The raw content to place under the field.
 * @returns A FieldLike with `metadata.fieldSource: 'override'` stamped on it.
 */
```

### `packages/codegen/src/dsl/primitives/refine.ts::refine`

```text
/**
 * Declare per-form choice selections for the current rule.
 *
 * Returns the rule unchanged structurally — the codegen metadata is
 * deposited into the active wire context. Validation (path resolves
 * to a choice, selection picks a valid arm) runs at codegen time, not
 * here: authoring-time paths may address positions that enrich or
 * transform will still modify before codegen reads them.
 *
 * @throws {Error} If called outside a wire() context.
 * @throws {Error} If a form name is duplicated within the same call.
 */
```

With the forms alone, `refine(forms)` is the entry form: a `RefinePlaceholder` that applies at `.` and registers the same forms when the entry resolves over the rule.

### `packages/codegen/src/dsl/primitives/refine.ts::RefinePlaceholder`

The `refine(forms)` entry: the forms, registered for the kind when the entry resolves at `.`.

### `packages/codegen/src/dsl/primitives/refine.ts::isRefinePlaceholder`

Whether a patch value is the `refine(forms)` entry.

### `packages/codegen/src/dsl/primitives/role.ts::withRoleScope`

```text
/**
 * Run `fn` with a fresh role accumulator in scope. Returns the
 * accumulated bindings AND `fn`'s result. Save/restore guarantees
 * nested `grammar(...)` calls stay isolated even on exception paths.
 *
 * Called by the layer pass (`dsl/layer.ts::runLayerPass`) — not by
 * override authors.
 */
```

### `packages/codegen/src/dsl/primitives/field.ts::FieldPlaceholder`

```text
/** Marker emitted by `field('name')` — a placeholder for transform patches. */
```

### `packages/codegen/src/dsl/primitives/refine.ts::FormMap`

```text
/** `{ formName → { path → branchIndex | literal } }`. */
```

### `packages/codegen/src/dsl/primitives/role.ts::VALID_ROLE_NAMES`

```text
/**
 * Mark an external token symbol with a structural-whitespace role.
 * Returns the symbol unchanged so the call site can be a transparent
 * member of the externals array.
 *
 * **Tree-sitter compatibility**: when `role()` is called outside any
 * scope, the binding is dropped and only the symbol passthrough runs.
 * The layer pass opens a scope in either runtime
 * (`dsl/layer.ts::runLayerPass`), so the bindings reach its record;
 * tree-sitter never reads them, and link reads them from the evaluated
 * grammar's `externalRoles`. This keeps the same call site valid for
 * both consumers without runtime feature detection.
 */
```

### `packages/codegen/src/dsl/primitives/role.ts::currentRoles`

```text
/**
 * Module-local accumulator. Null when no scope is open; `role()` then
 * records nothing.
 */
```

### `packages/codegen/src/dsl/primitives/field.ts::module`

```text
/**
 * dsl/field.ts — sittir field shadow with one-arg placeholder form.
 *
 * Tree-sitter's baseline `field()` takes two args: `field(name, content)`.
 * Sittir's edit() patches need a one-arg form so authors can write:
 *
 *     edit(original, { 0: field('expression') })
 *
 * Two-arg calls delegate to whichever `field` is provided as a global
 * by the runtime — sittir's grammarFn-injected field (`{type:'FIELD'}`)
 * in sittir's pipeline, or tree-sitter's native field (same shape) when
 * the transpiled grammar.js is loaded by tree-sitter's CLI. This keeps
 * the same call site valid for both consumers.
 *
 * One-arg calls return a sittir-only placeholder marker that
 * `transform()`'s resolvePatch swaps out before the result reaches
 * the runtime's grammar() processing. The marker never escapes into
 * a final grammar tree.
 *
 * Import explicitly when you want the one-arg form:
 *
 *     import { field } from '@sittir/codegen/dsl'
 */
```

### `packages/codegen/src/dsl/primitives/rule.ts::rule`

`rule(name, body)` in a `edits:` entry declares a real grammar rule `name`
whose body is `body($)`, and replaces the patched path with a reference to
it. It is how a patch introduces a rule the base grammar lacks (python's
`comprehension_clauses`) without a hand-written `rules:` entry. The rule is
visible or hidden as named, carries no `hoisted` annotation, and is not
wrapped in the path's precedence; its body is built by the installed rule from
that rule's own `$` (`declaredRuleFn`). The same name
may be declared at several paths with an equal body; a name the grammar
already has is refused at wire time (`injectPlaceholderHiddenRules`).

### `packages/codegen/src/dsl/primitives/rule.ts::RulePlaceholder`

The inert value `rule()` returns: a name and a body callback taking the
grammar's `$`. Inside `transform()` it resolves to a reference
(`resolveRulePlaceholder`); at wire time it installs the rule (`declaredRuleFn`).

### `packages/codegen/src/dsl/primitives/rule.ts::isRulePlaceholder`

Whether a patch value is a `rule()` placeholder.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::reauthored`

`reauthored(cause, body)` declares a `rules:` entry that replaces the upstream
rule of the same name, and why: `'alias-shape'` (an alias or
hoist restructuring the patch forms cannot express) or `'ambiguity'` (a
precedence or ambiguity fix). It returns `body` itself, tagged; the rule-cause
diagnostics judge the declaration against the enriched stage.

The witnessed causes (`WITNESSED_CAUSES`) take their evidence before the body,
as a non-empty array of witnesses (`Witnesses`), because one rule can exclude or
add several forms. The gate judges each witness on its own and names the index
of the one that fails.

`reauthored('accepts-other-kind', witnesses, body)` is the third cause: the
upstream rule accepts a form that is never
this kind, because another rule accepts the same form and the parser always
picks that one. Python's `tuple` is the case: upstream's rule derives `(a)`,
which is a parenthesized expression and never a tuple; precedence hides the
overlap from the parser, so nothing reports it, and the model inherits a tuple
that needs no comma. The declaration states the claim so it can be checked
(`OtherKindWitness`).

`reauthored('rejects-valid-syntax', witnesses, body)` is the fourth cause: the
upstream parser rejects a form the language allows, and the body adds it. The
witness is the same `OtherKindWitness` shape read the other way round: `text`
is source upstream's parser reports an error for, `form` the token sequence the
body must derive, and `kind` the upstream rule that should derive it and does
not. The gate checks the form against that upstream rule (it must not derive it)
and a test checks the text against upstream's own parser (it must error).
TypeScript's `export type * from` is the case: upstream allows `type` only
before an export clause.

`reauthored('accepts-invalid-syntax', witnesses, body)` is the fifth cause, the
mirror of the fourth: the upstream parser accepts a form the language's grammar
productions exclude, and the body drops it (`InvalidSyntaxWitness`). Only
productions count. Early errors (context, labels, strict mode, duplicate names)
are not parser work, and a body that clones a rule per enclosing context to
enforce one is out of scope.

`reauthored('ruled-narrowing', witnesses, body)` is the sixth: the upstream
parser accepts a form the maintainer ruled out, where no production excludes it.
It is judged as the fifth is, with the ruling's constraint stated in words in
place of a production (`RuledNarrowingWitness`).

A rule with more than one cause declares them together:
`reauthored([[cause, witnesses], [cause, witnesses], ...], body)` takes two or
more cause pairs (`CausePair`), and the gate judges each cause on its own. The
one-cause forms record the same declaration with one cause (`DeclaredCause`).
TypeScript's `public_field_definition` declares `'rejects-valid-syntax'` for the
auto-accessor forms it adds and `'ruled-narrowing'` for the ones it drops.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::OtherKindWitness`

The evidence for `'accepts-other-kind'`: `text`, source the upstream parser
reads as the other kind; `form`, the same text as the sequence both rules
derive, each item a literal token or `{ symbol }` naming a rule; and `kind`,
the kind that text always is. The form is checked against upstream's rules when
the grammar compiles; the text is checked against upstream's own parser by a
test that covers every declared witness.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::InvalidSyntaxWitness`

The evidence for `'accepts-invalid-syntax'`, the `OtherKindWitness` shape read
the other way round from `'rejects-valid-syntax'`: `text` is source the language
rejects and upstream's parser accepts, `form` its token sequence, `kind` the
upstream rule that derives that form, and `production` the grammar production
that excludes it, cited from the language's own grammar (an ECMAScript or
TypeScript spec section, Python's PEG grammar, the Rust Reference). The gate
checks that upstream's `kind` derives the form and the authored `kind` does not.
A test checks the text against both parsers: upstream's accepts it, and
sittir's reports an error that stays within the witness's text when it is
parsed between two valid statements.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::Witnesses`

A non-empty, read-only array of witnesses. Every witnessed cause takes one, even
for a single witness, so no cause is a special case.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::WITNESSED_CAUSES`

The causes the gate verifies by witness rather than by a provoking diagnostic.
`WitnessedCause` is its element type, so the overloads of `reauthored` that take
witnesses and the gate's `isWitnessVerified` read the same list.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::vocabulary`

`vocabulary(body)` declares a `rules:` entry sittir adds and that replaces no
upstream rule: every helper rule a re-authoring introduces. It returns `body` itself, tagged.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::ruleCauseOf`

The declaration `reauthored` or `vocabulary` tagged onto a rule function, or
`undefined` for a bare body. The tag is a non-enumerable symbol-keyed
property, so a tagged function is still a plain `RuleFn` to `wire()` and to
tree-sitter's CLI.

### `packages/codegen/src/dsl/primitives/alias.ts::module`

```text
/**
 * dsl/alias.ts — sittir alias shadow with placeholder form.
 *
 * Two authoring modes:
 *
 *   1. **Two-arg** — `alias(rule, $.name)` or `alias(rule, 'name')`:
 *      delegates directly to the runtime's native `alias()`.
 *
 *   2. **One-arg placeholder** — `alias('assignment_eq')`:
 *      returns an `AliasPlaceholder` that `transform()`'s
 *      `resolvePatch` fills in with the original content at the
 *      patch target. Same pattern as `field('name')`.
 *
 *      In the override file:
 *        edit(original, { '1/0': alias('assignment_eq') })
 *
 *      resolvePatch produces:
 *        alias(original_content_at_1_0, { type: 'SYMBOL', name: 'assignment_eq' })
 *
 * Import explicitly when you want the placeholder form:
 *
 *     import { alias } from '@sittir/codegen/dsl'
 */
```

### `packages/codegen/src/dsl/primitives/alias.ts::alias`

`alias(name)` is the placeholder an entry fills at the member it reaches (`transform/transform.ts::resolveAliasPlaceholder`). `alias(rule, value)` is the runtime's own `alias`, except on a reference `copy()` or a path returned: there the copy is shown as `value` (`copy.ts::namedCopy`).

### `packages/codegen/src/dsl/primitives/copy.ts::symbol`

The runtime's `sym`.

### `packages/codegen/src/dsl/primitives/copy.ts::nativeAlias`

The runtime's `alias`.

### `packages/codegen/src/dsl/primitives/copy.ts::nameOf`

The kind a source names: a string, or a `$` value read the way the runtime's `alias` reads one, so a name the grammar has no rule for yet still reads.

### `packages/codegen/src/dsl/primitives/copy.ts::copyReference`

The reference to a whole copy. A copy of a visible rule aliases back to its source, `alias($._copy, $.source)`, so the tree shows the source's kind; a copy of a hidden rule, or of a supertype, which no tree shows, is the bare copy (`bareReference`). Shown as another name, the reference is `alias($._copy, $.shown)` and the alias `(source, shown)` is recorded (`transform/transform.ts::recordAlias`). The name the reference shows is stamped on the copy effect (`wire/wire.ts::wireNoteCopyDisplay`), so a copy that aliases back declares the display family of its source and itself. The reference is noted as the copy's (`wire/wire.ts::wireNoteCopyReference`).

### `packages/codegen/src/dsl/primitives/copy.ts::reachedCopyReference`

The reference a path leaves at a reference it reached that already stands for a copy. With `shown` naming a display the reference does not have, the reference is the copy's, shown as `shown` (`copyReference`). Otherwise it keeps its form: the same reference when it already names the copy, else re-pointed at it (`repointed`). A reference already shown under a name of its own (not its source's) that a path shows as another is `edit-site-conflict` (`refuseRedisplay`), which refuses the whole entry.

### `packages/codegen/src/dsl/primitives/copy.ts::displayOf`

The name a reference shows: an `ALIAS`'s value, or none for a bare symbol.

### `packages/codegen/src/dsl/primitives/copy.ts::referencedNameOf`

The rule a reference names: the symbol, or the symbol an `ALIAS` shows.

### `packages/codegen/src/dsl/primitives/copy.ts::repointed`

The same reference form naming another copy: an `ALIAS` keeps its value and namedness, and a bare symbol stays bare.

### `packages/codegen/src/dsl/primitives/copy.ts::refuseRedisplay`

Refuses to show a copy's reference as `shown` when the reference already has a display of its own. A reference with no display, or shown as its source, takes the new name. A display of its own is a `VerbRefusal` `edit-site-conflict` naming the copy and both displays, and it refuses the entry at the entry's boundary (`transform/transform.ts::appliedAtSite`).

### `packages/codegen/src/dsl/primitives/copy.ts::copy`

`copy(source, path?)`: the context's copy of `source`, or of the part `path` selects, made or reused (`wire/wire.ts::wireCopy`), and its reference. A whole copy takes `copyReference`; a part, which is not the source's kind, is the bare copy (`bareReference`). It runs only during the layer pass: in a `rules:` callback, a replacing function or a helper. Called anywhere else it throws `edit-entry-invalid`. A refused copy leaves the source's own reference.

### `packages/codegen/src/dsl/primitives/copy.ts::namedCopy`

`alias(reference, value)` on a copy's reference: the copy shown as `value`, replacing the alias back to its source. Any other rule, or an anonymous `value`, is `undefined`, and the runtime's `alias` applies.

### `packages/codegen/src/dsl/primitives/copy.ts::editedCopy`

`edit` and `replace` on a copy's reference: the edit applies to the copy's body and the same reference comes back. Any other rule is `undefined`.

### `packages/codegen/src/dsl/primitives/copy.ts::refuseSplitDisplays`

The check after an edits entry. Every copy the entry gave a display (`wire/wire.ts::wireEntryShown`) must show that display at every reference reachable from the entry's result (`referenceDisplays`). If any reference shows another, that is a `VerbRefusal` `edit-site-conflict` naming the copy and both displays. So an entry that shows one reference of a copy under a new name, and leaves another under the old one, is refused whole. A bare reference to a hidden copy shows no display and is named by the copy's own name. Returns the rule.

### `packages/codegen/src/dsl/primitives/copy.ts::referenceDisplays`

The displays each copy shows across a rule. Every reference to a copy (`copyReferencedBy`) adds its display, and each copy's body is walked once, so references held in a copy's deposit count too.

### `packages/codegen/src/dsl/primitives/copy.ts::copyReferencedBy`

The copy a node refers to, as a bare symbol or as an alias over one, when that name is a copy the layer made (`wire/wire.ts::wireCopyOf`).

### `packages/codegen/src/dsl/primitives/copy.ts::walker`

The rule walker the display check descends with (`referenceDisplays`).

### `packages/codegen/src/dsl/primitives/copy.ts::bareReference`

A copy referenced by its own name, `$._copy`, showing no display: the reference of a copy of a hidden rule or a supertype, and of every part copy. The copy effect is stamped with no display, and the reference is noted as the copy's.

### `packages/codegen/src/dsl/primitives/refine.ts::module`

```text
/**
 * dsl/primitives/refine.ts — declare correlated choice selections
 * across non-adjacent positions as named forms.
 *
 * Authoring-only primitive: produces codegen metadata via the active
 * wire context; the rule tree is unchanged. Tree-sitter parses using
 * the original shape.
 *
 * Use case: a rule whose choice positions are correlated — picking one
 * alternative in position A implies picking a specific alternative in
 * position B. TypeScript's `interface_body` is the motivating example:
 *
 *     interface_body: ($, original) => refine(original, {
 *         curly: { 'opening:': '{',  'closing:': '}'  },
 *         flow:  { 'opening:': '{|', 'closing:': '|}' },
 *     }),
 *
 * Read as: "`curly` form selects `{` at the `opening` field and `}` at
 * the `closing` field; `flow` form selects `{|` and `|}`." Each outer
 * key names a form; each inner key is a path to a choice node; each
 * inner value picks one branch (numeric index or literal-matching
 * string).
 *
 * Codegen emits per-form namespace-keyed factories — `ir.interfaceBody
 * .curly(config)`, `ir.interfaceBody.flow(config)` — with narrowed
 * Config types for the refined positions. The auto-stamp rule
 * then collapses the now-single-literal fields to absent Config keys,
 * so callers don't restate the literals that were implied by the form.
 *
 * The bare call `ir.interfaceBody(config)` routes to the
 * **first-declared** form. Authors order entries so the common case
 * comes first.
 *
 * Round-trip: the typed read's output and refine-factory output produce
 * identical UntypedNode shapes — no `$variant` tag, no discriminator.
 * Consumers that need "which form is this?" inspect
 * `$fields.opening` (or any refined position) directly.
 *
 * @see packages/codegen/src/dsl/wire/wire.ts — WireContext.refineForms
 */
```

### `packages/codegen/src/dsl/primitives/role.ts::module`

```text
/**
 * dsl/role.ts — structural-whitespace role primitive for override files.
 *
 * Sittir-specific DSL addition. Indent-sensitive grammars annotate
 * external tokens with their structural role (`indent` / `dedent` /
 * `newline`) inline in the externals callback:
 *
 *     externals: ($, prev) => [
 *         ...prev,
 *         role($._indent,  'indent'),
 *         role($._dedent,  'dedent'),
 *         role($._newline, 'newline'),
 *     ],
 *
 * `role()` returns the symbol reference UNCHANGED so the externals
 * array still receives a valid token reference. As a side effect it
 * pushes the binding onto the accumulator of the layer pass that
 * evaluates the callback, which records the bindings as its record's
 * `externalRoles`. Link reads them from `raw.externalRoles` to drive
 * its symbol-resolution behavior.
 *
 * The accumulator is scoped to one layer pass via a save/restore
 * pattern (see `withRoleScope`), so nested layer passes don't leak
 * roles between layers.
 *
 * Import explicitly:
 *
 *     import { role } from '@sittir/codegen/dsl'
 */
```

### `packages/codegen/src/dsl/primitives/role.ts::role`

#### body

```text
// Runtime validation — the TS type parameter doesn't flow through
// override files' @ts-nocheck imports, so a typo like 'indet' would
// otherwise silently store a wrong binding.
```

### `packages/codegen/src/dsl/primitives/arm.ts::arm`

The `arm` namespace exists so the placeholder can be spelled `default`, which
is a reserved word and therefore illegal as a function name but legal as a
property. `arm.default` is a value, not a call — it carries no per-site data.

Placed on a choice arm in `edits`, it stamps `annotations.default` on that
arm, and `resolvePatch` rejects a path whose parent is not a choice. The fact
then rides the slot's value bag beside `variant`/`variantOf`, which is what
carries it through an ALIAS collapse; the from emitter reads it as the
tie-break when several arms admit the same bare value.

    edits: { impl_item: { '3/0/0/0': arm.default } }

### `packages/codegen/src/dsl/primitives/group.ts::group`

`group()` is the `edits` declaration that a rule is a form of its parent:
`resolvePatch` lowers it to `annotations.hoisted` on the addressed rule, the
same stamp the variant lift and the `groups:` / clause-hoist mints make. The
path `'.'` addresses the rule itself, so an authored hidden rule a parent
only aliases can be declared a seat without restating its body:

    edits: { _except_clause_as: { '.': group() } }

It carries no data; it is a placeholder like `arm.default`, recognised by
`isGroupPlaceholder` (`__sittirPlaceholder: 'group'`).


### `packages/codegen/src/dsl/primitives/variant.ts::VariantPlaceholder`

```text
/**
 * dsl/variant.ts — nested-alias polymorph sugar.
 *
 * `variant('block')` inside a rule callback for `closure_expression` mints a
 * kind name for that anonymous choice arm — equivalent to an author writing
 * an explicit `alias('closure_expression_block')` — and registers the hidden
 * rule. It
 * carries NO classification metadata: the `WireContext` has no
 * `polymorphVariants`-style channel (deleted in the V2 wire-channel-deletion
 * work; see `dsl/wire/wire.ts`'s `WireContext`, which has only `deposits` /
 * `syntheticInline` / `refineForms` / `groups`), per
 * `docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md`
 * decision 7.
 *
 * Usage in grammar.sittir.ts:
 *
 *     closure_expression: ($, original) => edit(original,
 *         { 0: field('static'), 1: field('async'), 2: field('move') },
 *         { '4/0': variant('block'), '4/1': variant('expr') },
 *     ),
 */
```

#### `nestedUnder`

The enclosing variants' names, outermost first, when this one is minted
inside another variant's subtree. The minted rule composes through them
(`_except_clause_exception_as`); the arm keeps its own short name.

#### `variantMintName`

The name the minted rule takes: the enclosing variants' names then its own.

### `packages/codegen/src/dsl/primitives/variant.ts::VariantOptions`

`absent: true` marks the placeholder as the name of a variant choice's absent
case. It goes on the path of the `optional()` that wraps the choice (`'1'`
beside arm patches `'1/0/0'`, `'1/0/1'`), and names the variant minted from the
parent's scaffolding without the optional. Without it the absent case is
still minted, as `ABSENT_VARIANT_NAME`.

### `packages/codegen/src/dsl/primitives/variant.ts::ABSENT_VARIANT_NAME`

`bare`: the variant name of an optional variant choice's absent case when
the grammar does not name it.

### `packages/codegen/src/dsl/primitives/variant.ts::variant`

Builds the placeholder; `options.absent` and `options.default` are carried only when set. Given a rule as its second argument, it is the direct form `variant(name, rule, options?)`: it returns a copy of the rule carrying the placeholder under `DIRECT_VARIANT_KEY`, which the layer pass applies at that arm's position exactly as the entry would (`transform/transform.ts::withDirectVariants`). `default: true` names the arm the parent's own factory builds when given a bare value; it replaces any default the arms already carry (see `clearSiblingDefaults`).

### `packages/codegen/src/dsl/primitives/variant.ts::DIRECT_VARIANT_KEY`

The symbol key under which a direct `variant(name, rule)` carries its placeholder on the rule it labels. Not enumerable, so JSON never sees it, and a copy of the rule that the pass makes drops it.

### `packages/codegen/src/dsl/primitives/variant.ts::directVariantOf`

The placeholder a rule carries as a direct variant arm, or undefined.

### `packages/codegen/src/dsl/primitives/variant.ts::variantPlaceholder`

The placeholder both forms build, with `absent` and `default` only when set.

### `packages/codegen/src/dsl/primitives/variant.ts::isRuleShape`

Whether `variant`'s second argument is a rule (an object with a string `type`) rather than options.

### `packages/codegen/src/dsl/primitives/variant.ts::variantMintName`

The name suffix a variant mints under its patched rule: the names of the enclosing variants (`nestedUnder`) followed by its own, joined with `_`.

### `packages/codegen/src/dsl/primitives/variant.ts::variantOwnerKind`

The kind that owns a variant, stamped as its `variantOf`: the patched rule for a top-level variant, and for a variant nested under other variants the node the enclosing variants mint (`polymorphVisibleName` of the patched rule and the enclosing names). It reads the same `nestedUnder` as `variantMintName`, so a nested arm's name and its owner always agree.

### `packages/codegen/src/dsl/primitives/spacing.ts::LAYOUT_SUPERTYPE`

`_layout`, the hidden supertype enrich mints for every grammar
(`enrichWhitespace`) listing the layout kinds it renders: the members
its extras admit, each a never-scanned external with a kind id unless the
upstream grammar already scans one of that name, and `tight`, which renders
nothing, always. The model reads the arms of every spacing site from it
(`layout-kinds.ts`); nothing outside `dsl/whitespace.ts` lists layout
kinds by name. The supertype is protected from unreachable-rule pruning
like any other.

### `packages/codegen/src/dsl/primitives/spacing.ts::DEPTH_KINDS`

`indent` and `dedent`, the two layout kinds that move depth rather than
write a whitespace run: a separator gap admits only the whitespace kinds,
every member but these (`whitespaceKindsOf`), while an array flank, a kind
edge or a token seam of an indenting grammar admits every layout kind
(`layoutKindsOf`).

### `packages/codegen/src/dsl/primitives/spacing.ts::INDENT_TEXT`

The literal text of the `indent` whitespace kind: the core writer's INDENT
mark (U+FDD0) followed by a newline — "go one level deeper, then break".
`indent()` in a grammar's `visibleExternals` is `string(INDENT_TEXT)`, so
`_indent` is a fixed-text token like every other whitespace kind, and the
render crate's `spacing_text` table carries the mark itself rather than a
core constant.

### `packages/codegen/src/dsl/primitives/spacing.ts::DEDENT_TEXT`

The literal text of the `dedent` whitespace kind: the DEDENT mark (U+FDD1)
and a newline. `dedent()` is `string(DEDENT_TEXT)`.

### `packages/codegen/src/dsl/primitives/spacing.ts::isDepthText`

Whether a whitespace kind's text is a depth mark. A depth mark is written
to the render stream as it is; every other whitespace text is written
behind a SEAM mark so the writer can coalesce it with its neighbours.

### `packages/codegen/src/dsl/primitives/preference.ts::preference`

A preference's arm: the value chosen at the site an `options:` key addresses.
The key is the address, so the arm is all a preference carries.

A choice is addressable because it is a choice, not because anything labelled
it. What names a site for a reader is the `options:` key, and a binding maps
one address onto another key, so a name never has to be stamped onto the arms
themselves.

### `packages/codegen/src/dsl/primitives/preference-path.ts::parsePreferencePath`

A preference address's segments. It shares the path splitter and the segment
forms with `parsePath` but not its rules: a bare identifier is a segment here,
naming a side or a part of a label, where a rule path rejects one and demands
`(name)`. So `(kind)` stays a kind, `field:` a field, `"text"` a literal, and
everything bare is a name.

### `packages/codegen/src/dsl/primitives/preference-path.ts::comparePreferencePaths`

The canonical order over preference addresses: segment by segment, then by
length, so a prefix precedes its descendants and every descendant is
contiguous. Site indices are assigned in this order, which is what makes a
prefix-scoped declaration a range rather than a scan. Sides sort after any
sibling that is not one, and among themselves in render order — `before`,
`after`, `separator` — so a kind's own gaps do not interleave with its
children's.

### `packages/codegen/src/dsl/primitives/preference-path.ts::formatPreferencePath`

An address back in its written spelling, so a diagnostic names what an author
typed rather than a segment dump.


### `packages/codegen/src/dsl/primitives/preference-path.ts::Punctuated`

A segment text holding a character no bare name may: space, quote, either
paren, colon or slash.

### `packages/codegen/src/dsl/primitives/preference-path.ts::IsPreferenceSegment`

Type-level twin of `parseSegment`: a quoted literal, `_`, an index, a
`(kind)`, a `name:` or a bare name. Looser than the runtime on the
characters a name may hold — it refuses punctuation rather than requiring an
identifier — so it never rejects what `parsePreferencePath` accepts.

### `packages/codegen/src/dsl/primitives/preference-path.ts::AllSegments`

`true` when every split segment is a preference segment.

### `packages/codegen/src/dsl/primitives/preference-path.ts::IsPreferencePath`

`true` when `parsePreferencePath` would accept the path. Splits with
`Segments` (`grammar-shapes/path-type.ts`), the type-level `splitSegments`,
so a quoted literal may hold a slash. What `OptionsCheck` consults per key.

### `packages/codegen/src/dsl/primitives/spacing.ts::spacingLabelOf`

The label of a spacing site, spelled from its address (`SpacingAddress`):
`<token>_separator_space_<side>` for a separator token, `empty_separator_space`
for the single gap of an unseparated repeat, `<token>_<before|after>` for a
token seam, the token being its catalog kind name (`lparen_before`), and
`<kind>_<start|end>` for an array flank. A seam's label is also its field on
the owning node and its address under the kind; every label is a top-level key
of the grammar's `Options` type and of its `defaults`. It is the one
formatter: a site's label is spelled here, once, from the address it was
minted with.

### `packages/codegen/src/dsl/primitives/spacing.ts::parseSpacingAddress`

Reads a spacing label back into its address, `spacingLabelOf`'s inverse. The
separator pattern is tried first, because a separator label also spells a seam
on a token named `<token>_separator_space`; a separator label needs a side
unless its token is `empty`, and the empty gap takes none. Then the seam
pattern, then the flank pattern. Wire's `isRetiredAddressKey` is its one
caller, recognising an `edits:` key spelled like a site. Nothing in the
compiler reads an address back out of a label, since every site carries its
own.

### `packages/codegen/src/dsl/primitives/spacing.ts::DELIMITER_ARMS`

The `Delimiter` members a delimiter default may name; `isDelimiterArm`
tests one, `isDelimiterAddress` recognises a `<slot>_delimiter` site key.

### `packages/codegen/src/dsl/primitives/spacing.ts::SEPARATOR_LABEL`

The label of a list slot's declared separator token,
`preference('separator', <kind>)`: the twin of `delimiter`. Its site
address is `<slot>_separator` and its arm is a token kind name, checked
against the list's literal separator kinds where separator sites are
collected, not by the wire.

### `packages/codegen/src/dsl/primitives/spacing.ts::VARIANT_LABEL`

```text
The address segment and label of a supertype's variant-choice options site.
```

### `packages/codegen/src/dsl/primitives/spacing.ts::isSeparatorAddress`

Whether a site address is a list's separator default (`<slot>_separator`).

### `packages/codegen/src/dsl/primitives/spacing.ts::LABEL_TOKEN`

The token part every spacing, seam and flank label shares, one pattern for all
three: a letter of either case, then letters, digits and underscores. A label
names its token by the kind key, which keeps a keyword's case
(`MISSING_keyword_before`).

### `packages/codegen/src/dsl/primitives/spacing.ts::siteKey`

The kind × slot option key of a site, the same string on the Options type,
the grammar's defaults, the node field and the wire. For separator spacing the
token is the slot's own and is dropped: `<slot>_separator_space` for the empty
gap, `<slot>_separator_space_before` / `_after` for a token. Any other address
is its label under the slot, `<slot>_<label>`, which is how a seated site is
keyed (`<slot>_<child>_after`).

### `packages/codegen/src/dsl/primitives/flatten.ts::flatten`

Marks a position in a rule's patches as a visible wrapper flattened onto its parent: the wrapper stays a node of its own kind in the tree and on the surface, and the parent's config takes the wrapper's keys in its place. `splice()` is the only way a reference to a visible kind becomes a splice seat.

### `packages/codegen/src/dsl/primitives/regex.ts::regex`

```text
A patch placeholder carrying a replacement regex source for the pattern at the patched path.
```

### `packages/codegen/src/dsl/primitives/rule-cause.ts::SemanticGapWitness`

Evidence for `reauthored('semantic-gap', witnesses, body)`: the upstream parser's kind, accepted text and grammar form, plus the language meaning that differs from the modeled construction. The gate checks that the kind is unchanged, the upstream rule derives the form, and the meaning is stated. Upstream parser tests verify the text/kind; construction regressions verify the semantic correction. This cause covers the one-element tuple, where `(x)` and `(x,)` share an upstream tuple kind but mean different things in the language. It does not claim to prove language semantics from the grammar.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::RuledNarrowingWitness`

The evidence for `'ruled-narrowing'`: the `InvalidSyntaxWitness` shape with `ruling` in place of `production`. The ruling's constraint is stated in words, never as a PR, spec or task number, so the witness cannot rot into a dangling pointer. The gate checks that upstream's `kind` derives the form and the authored `kind` does not, and the witness test checks that upstream's parser accepts the text and sittir's rejects it within the text.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::CauseWitnesses`

The witness shape of each witnessed cause. `CauseWitness` reads it, so the `reauthored` overloads and the cause pairs take one table.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::CauseWitness`

A witnessed cause's witness shape, read from `CauseWitnesses`.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::CausePair`

One cause as the several-cause `reauthored` takes it: a witnessed cause with its non-empty witnesses, or an unwitnessed cause alone.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::DeclaredCause`

One cause of a `reauthored` declaration as recorded: the cause, and its witnesses when it has them.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::RuleCauseDeclaration`

What `reauthored` or `vocabulary` tags a rule function with (`ruleCauseOf`): a re-authoring with its causes (`DeclaredCause`), or a vocabulary rule. The cause list is typed as it can arrive: a grammar file's types do not gate it, so the list may be empty, and the rule-cause gate refuses an empty one (`rule-cause-missing`). `reauthored` records the list dense: a hole in the declared list declares nothing and is skipped, so a list of holes records as empty.

### `packages/codegen/src/dsl/primitives/rule-cause.ts::declaredCause`

The recorded form of a cause pair (`CausePair`).

### `packages/codegen/src/dsl/primitives/narrow.ts::NarrowPlaceholder`

A `narrow` entry: its direction and the admits.

### `packages/codegen/src/dsl/primitives/narrow.ts::isNarrowPlaceholder`

Whether an entry value is a `narrow` placeholder.

### `packages/codegen/src/dsl/primitives/narrow.ts::narrowing`

The placeholder builder for one direction.

### `packages/codegen/src/dsl/primitives/narrow.ts::narrow`

`narrow(...admits)` keeps only the admitted arms at its entry's site, and `narrow.except(...admits)` every other arm. The entry is queued with the layer's path edits and applies in its whole-grammar phase, before the leads, over the rules as the layer's own edits left them (`verbs/narrow.ts::applyNarrows`).

### `packages/codegen/src/dsl/primitives/narrow.ts::withinOf`

A `match` restriction from its authored form: an array is an unfielded child; a record restricts the one field it names, and a record of any other size is refused.

### `packages/codegen/src/dsl/primitives/narrow.ts::match`

Builds a `LeadMatch`: a kind, an optional restriction (`withinOf`) and an optional name for its form. `(required_parameter pattern: (this))` is `match('required_parameter', { pattern: [match('this')] })`.

### `packages/codegen/src/dsl/primitives/lead.ts::LeadPlaceholder`

A `lead` entry: the list's item field, the field the head takes, and the admits.

### `packages/codegen/src/dsl/primitives/lead.ts::isLeadPlaceholder`

Whether an entry value is a `lead` placeholder.

### `packages/codegen/src/dsl/primitives/lead.ts::lead`

`L: { '.': lead(item, field, ...admits) }` separates the head of the separated list `L` that the admits allow into a receiver form (`verbs/lead.ts::applyLead`). It is valid only at the list kind's `.`, where wire queues it for the layer's whole-grammar phase (`transform/transform.ts::queueLeadEntry`).

### `packages/codegen/src/dsl/primitives/rename.ts::RenamePlaceholder`

The `rename(to)` placeholder: the name the kind takes.

### `packages/codegen/src/dsl/primitives/rename.ts::isRenamePlaceholder`

Whether a value is a `rename` placeholder.

### `packages/codegen/src/dsl/primitives/rename.ts::rename`

A rename entry: `kind: { '.': rename(to) }` renames the kind to `to` in the layer it sits in (`verbs/rename.ts::applyRename`). It applies only at `.`, the kind itself.
