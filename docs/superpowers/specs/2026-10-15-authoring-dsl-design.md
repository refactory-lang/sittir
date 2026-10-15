# The authoring DSL: layers, the `edits` section and the verbs

A grammar package states its grammar in layers. Each layer extends the one below it with a `grammar()` call. Inside a layer, one declarative section, `edits`, holds the per-site edits as data, keyed kind → path → verb entry. The same verbs can be called inside `rules:` bodies.

This spec defines:
- the layers;
- the `edits` section;
- every verb, both existing and queued;
- the one copy primitive.

It replaces three things: the `bindings({ hash, patches, renames, leads, splits })` record, `bindGrammar`, and `sittirGrammar`.

The rewrite is staged in `docs/superpowers/plans/2026-10-15-authoring-dsl-rewrite.md`. Its first stage reshapes the bindings layer and must be byte-identical to the 2b head.

Status: design. Coordinate implements it. The questions for the maintainer are in §12.

## Rulings

Maintainer, 2026-10-15:
- **Layers.** Every layer is a plain `grammar()` extension of the one below. grammar.bindings.ts extends grammar.sittir.ts: `grammar(sittir, { … })`.
- **Two levels.**
  - One declarative section per layer, keyed kind → path → verb entry. It replaces `patches:` and the bindings record's patches, renames, leads and splits.
  - The verbs sit underneath, and the section lowers to the same verb calls.
- **Inline verbs.** Verbs may be called inside `rules:` bodies. This reverses the 2026-09-02 ruling that kept `transform()` out of rules.
  - An inline call stamps the same effects as its declarative form.
  - A declarative entry and an inline call that target the same site are a diagnostic.
- **Generated layers write the section as data,** so the staleness hash and the existence checks carry over.
- **The section is named `edits`.**
- **Order of work.** The bindings-layer reshape is the rewrite's first stage, gated byte-identical against the 2b head, 946114382. 2b waits for the rewrite.

Carried forward unchanged:
- One copy primitive serves splits, contextual aliases, literal splits and the receiver lead. A copy aliases back to its source's name unless it is named.
- A visible copy needs a name of its own. Aliased back, it gives its kind a second site, and the render options refuse an address that names two sites.
- A shared visible kind is narrowed in place rather than copied when every site may change.
- A literal split's literal must lex as a keyword at its position.
- Kinds sittir synthesizes from structure are minted by enrich, and `variant()` supplies their names.
- Registered variant families survive field authoring.
- Kind renames stay out of the parser.
- The enrich gate over a completed layer is strict and carries enrich's three sidecars.
- Pipeline functions take `(target, ctx)`.

## 1. Layers

### 1.1 The chain

| layer | file | form |
| --- | --- | --- |
| 0, upstream | `node_modules/tree-sitter-<lang>/grammar.js` | re-exported by `packages/<lang>/base.ts` |
| 1, authored | `packages/<lang>/grammar.sittir.ts` | `export default grammar(base, { … })` |
| 2, generated | `packages/<lang>/grammar.bindings.ts` | `export default grammar(sittir, { edits })` |
| entry | `packages/<lang>/.sittir/grammar.js` | `export { default } from '../grammar.bindings.ts'` |

- **`grammar` is the DSL's layer function**, imported from `dsl-authoring.ts`. It takes tree-sitter's `(base, options)` and replaces `sittirGrammar`. Inside, it calls the runtime's own `grammar()`: tree-sitter's under the CLI, and sittir's `grammarFn` under `evaluate()`.
- **`name`** defaults to the base's name. Tree-sitter requires one on every call, and the layer function supplies it.
- **Imports run upward.** Each layer imports the one below it, so grammar.sittir.ts no longer imports grammar.bindings.ts.
- **`.sittir/grammar.js` re-exports the top layer.** That is grammar.bindings.ts where the package has one, and grammar.sittir.ts otherwise.
  - One function, `topLayerPath`, names the top layer.
  - Both the transpiler that writes this file and every consumer that evaluates the full grammar use it.
- **Every layer file uses erasable syntax only,** and so does every module it imports, because Node strips the types when tree-sitter's CLI loads them. A generated layer holds imports, one `hash` constant and data.

### 1.2 One layer

`grammar(base, config)` runs five steps. They are the same at every depth and in both runtimes, except that the intake depends on what the base is.

1. **Intake.**
   - Over an upstream base, which carries no layer record, enrich runs with the config's authored inputs: group bodies, extras, and the field sites that `edits` names. This is today's sittir layer.
   - Over a completed layer, the **enrich gate** runs:
     - it enriches the base once, with the three sidecars from the base's layer record (rule origins, whitespace, automatic variants);
     - it refuses any rule the pass adds, removes or changes, with `layer-base-not-enrich-fixpoint` naming the rules;
     - a layer whose `edits` is empty is gated too.
   - The sidecars are required. Without them, `_layout` and typescript's `index_signature_colon` and `_mapped_type_clause` re-match.
   - Over a completed layer, the config's enrich inputs reach no enrich, because the gate enriches the base alone. So authored enrich input belongs in layer 1.
2. **Lowering.** Each `edits` entry becomes a verb application on its kind's rule callback:
   - Kind K's callback is its own `rules:` callback if it has one, followed by `edit(result, edits[K])`. This is today's patched-parent composition.
   - An entry whose effect reaches other rules is queued for step 3's whole-grammar phase: a path that enters a rule (§2.2), `lead` and `rename`.
3. **The layer pass.**
   - Before calling the runtime's `grammar()`, the layer evaluates every rule callback once. Its `$` knows the base's rules, the config's rule names, the externals, and every name the `edits` entries declare. A rule that an inline call creates is referenced through that call's result, not through `$`.
   - Inline verb calls run here. Their whole-grammar parts are queued.
   - The whole-grammar phase then runs in this order:
     1. lift-name resolution;
     2. pattern injection (`groups:` and authored hidden rules);
     3. edits and substitutions along paths that enter rules (§4);
     4. leads (§5);
     5. kind renames (§3.3).
   - Every verb records its effects in the layer's effect log (§1.6).
4. **The runtime's `grammar()`.**
   - It receives one callback per final rule name, each returning the layer pass's body.
   - It receives list callbacks (supertypes, inline, extras, externals, word, precedences, reserved) that return the computed lists.
   - The runtime appends new rule names in the order the options list them. The layer therefore lists the rules it created in the order wire and `bindGrammar` add them today: wire's placeholder rules first, then the whole-grammar phase's in phase order. At 946114382, rust's four lead rules follow `_kw_raw` as its last rules.
   - Rule order fixes symbol ids, so it is part of every byte-identical gate.
5. **Completion.** In order:
   1. automatic variants are stamped on the rules this layer created or changed;
   2. enrich mints that nothing reaches are blanked;
   3. text tokens are attached;
   4. the layer's conflict sets are applied (§6);
   5. inherited records are rewritten through the effect log (§1.6);
   6. the layer record is attached to the result (§1.5).

### 1.3 Both runtimes see every edit

Tree-sitter's CLI serializes the default export of `.sittir/grammar.js` into `grammar.json`, and that file is the ground truth for what the parser sees. Sittir's `evaluate()` reads the same object.

**The rule.** Every step that changes a rule runs in the layer function, and both runtimes run the layer function.
- The runtime's `grammar()` only interprets. Tree-sitter normalizes and records; sittir's `grammarFn` records.
- After it returns, completion may only stamp labels and blank unreachable mints. Those steps run inside the layer function too.

Today the rule is broken in three places:

- **`bindGrammar` runs after `grammar()`.**
  - Its splits and leads do reach `grammar.json`, because `sittirGrammar` returns the rewritten object.
  - But they skip tree-sitter's normalization and the checks `grammar()` makes of the rule lists.
  - It also writes three sittir records as enumerable keys, which tree-sitter serializes: `splitFrom`, `leadFrom` and `bindingEffects` (question 1).
  - The layer pass moves the edits before `grammar()`, and the records move into the layer record.
- **`evaluate()` keeps its own copies of four wire passes:**
  - synthetic-rule injection;
  - `groups:` body evaluation, with a swallowed `catch`;
  - pattern replacement;
  - the visible-externals rewrite.

  Each duplicates a wire pass that tree-sitter's run uses. `desugarDivergences` exists only to report where the two disagree, and a production invariant asserts that it stays empty. The layer pass runs each pass once, for both runtimes, so the copies, the divergence record and its diagnostic all go.
- **Wire's rule hook evaluates every callback lazily,** on the runtime's first call.
  - Tree-sitter builds its `$` from the option rules' keys before calling any callback. A name an inline verb creates is unknown at that point.
  - The eager layer pass replaces the hook.

Compile-time passes after `evaluate()`, from link onward, must not mint a kind the parser should have. A kind name with no parser-issued kind id is a phantom, and the existing phantom-kind ratchet counts it.

### 1.4 Evaluating up to a layer

To evaluate up to layer N, load layer N's module.
- Sittir's `evaluate()` imports it.
- A tree-sitter CLI run that needs a lower layer gets a scratch `grammar.js` that re-exports that layer. The source parser already works this way.

The consumers that need a lower layer select its module:
- the conflict driver's run per layer;
- the bindings inventory, which derives against layer 1;
- the unbound source parser;
- `compile` with `unbound`.

`SITTIR_UNBOUND`, `UNBOUND_ENV` and evaluate's `?unbound` re-import go.

Both evaluations share layer 1's module instance, so **no layer mutates its base**. Verbs build new rule objects, and the layer record is copied, never edited in place.

### 1.5 The layer record: one home for what crosses layers

Today, facts cross from one layer to the next by five routes:
- enrich's three sidecars, re-attached by `withEnrichSidecarsOf`;
- non-enumerable keys that `completeLayer` copies from the previous grammar: dead mints, text tokens and derivation records;
- evaluate's inherit helpers (`inheritedRecord`, `inheritedMap`, `inheritedPatchSites`). They merge groups, refine forms, render-as, visible externals, options, rule causes, patch sites and the expectations;
- `sittirGrammar` merging the bindings layer's lift names into the sittir layer's wire context, so that derivation records see them;
- enumerable provenance keys: `bindGrammar` writes `splitFrom`, `leadFrom` and `bindingEffects`, and `renameGrammar` writes `renamedFrom`.

Instead, a completed layer's result carries one non-enumerable **layer record**. Its schema, `LayerRecord`, is the single list of what crosses layers:

| field | contents | across layers |
| --- | --- | --- |
| `depth` | 1 for grammar.sittir.ts, one more per layer above | — |
| `upstream` | the layer-0 grammar | kept from layer 1; derivation records stay keyed to it |
| `sidecars` | rule origins, whitespace, automatic variants | replaced by the gate's result |
| `resolutions` | the conflict resolutions file | from layer 1; each layer applies its section (§6) |
| `deadMints`, `textTokens` | as today | union |
| `liftNames` | every lift rename | union; derivation records read the union |
| `effects` | the effect log (§1.6) | appended |
| `records` | options and `_labels`, groups, render-as, visible externals, reparse hosts, refine forms, rule causes and undeclared rules, patch sites, external roles, the expectations, contexts | inherited entries are rewritten (§1.6), then a layer's own entry wins |

- `splitFrom`, `leadFrom`, `renamedFrom` and `bindingEffects` become projections of `effects`. The evaluated grammar still exposes them under those names, so their readers do not change.
- Whether copies and lead forms share one form-of stamp is for the wiring plan's clone-forms stage (§9).
- Sittir's `grammarFn` stops draining the wire context and stops merging inherited metadata. `importAndExtractGrammar` reads the record, as it already reads dead mints and derivation records.

### 1.6 Effects: edits follow into inherited records

Each verb application records its effects:
- `field`: a field-segment rename (owner, old segment, new segment), as `recordFieldEffect` records today;
- `alias`: an alias (from, to);
- `rename`: a kind rename;
- a copy: the copy, its base and its context;
- `lead`: one lead effect (§5).

**Which records are rewritten.**
- At completion, a layer rewrites the records it **inherited** through its effects, in the order the effects were recorded.
- The records a layer authors itself are written against its own result, so they are not rewritten.
- Layer 1 inherits no records, so its effects rewrite nothing. That is why only the bindings layer's patch sets record effects today, under the `BINDING_SET` mark. The mark goes, and every layer records.

One table states what each effect rewrites. It replaces `renameGrammar`'s three field lists, `carryHiddenFacts` and `rewriteBindingOptions`:

| record | field segment | alias | kind rename | copy |
| --- | --- | --- | --- | --- |
| option paths | the segment, on that owner | `(from)` segments | heads and `(kind)` segments | see below |
| `_labels` addresses | the segment | `(from)` segments | heads | see below |
| reparse hosts | — | — | keys, priority, gated | — |
| render-as, visible externals, groups | — | — | keys | — |
| supertypes, inline, factory-inline | — | — | names | the copy joins every list its base is in |
| rule bodies, `word`, conflicts, precedences, reserved | — | — | names | — |

How a copy is treated depends on the verb that made it:
- **Paths that enter a rule, and `substitute`.** The copy inherits its base's options and `_labels` entries, layout included, as split copies do today (`inheritSplitOptions`).
- **`lead`.** Its forms have new shapes and inherit nothing, as today.

## 2. The `edits` section

### 2.1 Shape

```ts
edits: {
	[kind: string]: EditSet | readonly EditSet[];   // EditSet = { readonly [path: string]: Entry }
}
```

- It has the same shape in every layer. It replaces `patches:` in layer 1 and the record's `patches`, `renames`, `leads` and `splits` in layer 2.
- A list of sets applies in order, each set to the result of the one before, as patch sets do today.
- An entry is a verb call without its target (§3), for example `field('name')`, `alias('name')`, `variant('name')`, `substitute(…)`, `lead(…)` or `rename('to')`. Entries are placeholders, which is why a generated layer can be plain data.
- Over an upstream base, keys are type-checked against the base's kinds, as `PatchesCheck` does today. Over a completed layer, a key that names no rule is `edit-site-missing` when the layer evaluates.
- A key names a rule of the layer's base or of its own `rules:`. A rule the layer creates takes its edits in the call that creates it: `copy(name, edits)`.

### 2.2 Addressing

There is one path model, transform's (`transform-path.ts`). Every verb shares it, and so does `edit()`.
- **Segments:**
  - `.` addresses the rule itself;
  - `N` or `-N` addresses a member by index;
  - `_` addresses every member;
  - `"text"` addresses the member whose fixed text is `text`;
  - `(kind)` addresses every reference to `kind` in the subtree, skipping references that are already fielded;
  - `name:` addresses the field `name`.
- **Lifts.** A path sees through its rule's own enrich lifts (group lifts and content aliases), because a lift is part of its owner.
- **Entering a rule (new).**
  - A `(kind)` segment followed by more segments continues inside the referenced rule's body.
  - Hidden rules between visible kinds are entered implicitly. So a path is written in tree terms, the way a query sees the tree.
  - Entering a rule makes the edit context-specific: the entered rule is copied for this context (§4).
  - `(kind as name)` names that copy. A visible rule needs this (§4.1).
  - A path that ends at `(kind)` still addresses the reference itself, as it does today.
- **Missing sites.** A path that matches nothing is `edit-site-missing`, a diagnostic naming the kind and path. Today this case is the bindings wire's "patch applies nowhere" refusal or transform's `ApplyPathSkip`.

### 2.3 Inline: `edit(rule, sets)`

Inside a `rules:` callback, `edit(previous, { [path]: entry })` applies entries to a rule the callback holds. It takes the same entries and the same path model as the section. It replaces `transform()`, whose one grammar user today is python's `tuple_pattern`.

- **Direct forms.** Three verbs also have two-argument forms, because they build rules:
  - `field(name, rule)` and `alias(rule, name)`, which are tree-sitter's;
  - `variant(name, rule)`, which is new (§3.2).
- An inline application records the same effects and patch sites as the matching entry.
- **The same-site check.** `edit-site-conflict` is blocking. It fires when an inline application and an `edits` entry resolve to the same member of the same kind. Members are compared by their resolved position in the callback's result, not by how the path is spelled, so `1` and `body:` naming one member conflict.
- **Order.** A kind's callback runs first, with its inline applications. Its `edits` entries then apply to the result, as patches apply after `rules:` today.

### 2.4 Generated layers

```ts
// Generated from bindings.scm and the vocabulary by `pnpm exec tsx packages/cli/src/cli.ts tool bindings-inventory --write`. Do not edit.
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import sittir from './grammar.sittir.ts';
import { field, grammar, lead, match } from '../codegen/src/dsl/dsl-authoring.ts';

export const hash = '…';

export default grammar(sittir, {
	edits: {
		attribute_item: { '2': field('content') },
		parameters_elements: {
			'.': lead('attributed_parameter', 'receiver', match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] }, 'receiver_parameter_declaration')]))
		}
	}
});
```

- **The staleness hash** is the named export `hash`. `assertBindingsFresh` reads it from there, never from the grammar config.
  - `compile` checks freshness before it evaluates the top layer. A stale layer then reports the regenerate command, not a missing site.
  - The hash covers bindings.scm and the vocabulary, not grammar.sittir.ts. A layer-1 change that moves a site is caught when the layer evaluates (`edit-site-missing`, and the alias check in §3.2) and by the regeneration drift check.
- **Paths are derived against layer 1's result.** The inventory derives every path there, and the existence and alias checks run when the layer evaluates, as today.
- **The printer prints entries, never a record.**
- **Splits stay off until the wiring plan's contextual-alias stage turns them on.** Until then the generator computes and reports split entries but does not print them. Today this switch is grammar.sittir.ts passing `splits: []`.
- **One implementation of the field edit.** The deriver finds each field edit's site directly and writes the entry. `fieldRenameGrammar` and `fieldWrapGrammar` go: they apply the same edit a second way only so the deriver can diff the two grammars.

## 3. The verbs

### 3.1 Every verb

The "parser" column says whether tree-sitter sees the edit, or only the model does through an annotation or the layer record. Every verb can be used in every layer, and every one also has the `edit()` inline form.

| verb | `edits` entry | direct inline form | parser | decision |
| --- | --- | --- | --- | --- |
| `field` | `field(name)` | `field(name, rule)` | yes | stays |
| `alias` | `alias(name)` | `alias(rule, name)` | yes | stays; one entry form (§3.2) |
| `variant` | `variant(name, { default?, absent? })` | `variant(name, rule, options?)` | yes where it mints, else a label | stays; gains the direct form |
| `rule` | `rule(name, body)` | write the rule in `rules:` | yes | stays |
| `substitute` | `substitute(rule \| ($, member) => rule)` | — | yes | new; replaces the bare-rule patch value (§4.2) |
| `copy` | `copy(name?, sets?)`, inside a substitution | — | yes | new; the copy primitive (§4) |
| `lead` | `lead(item, field, ...admits)` at a list's `.` | — | yes | moves from the bindings record (§5) |
| `match` | `match(kind, within?, as?)`, lead's admit builder | — | — | stays |
| `rename` | `rename(to)` at `.` | — | yes, if used | moves from the bindings record (§3.3) |
| `arm.default` | `arm.default` | — | no: an annotation | stays |
| `group` | `group()` | — | no: the `hoisted` annotation | stays |
| `flatten` | `flatten()` | — | no: the `flattened` annotation | stays |
| `regex` | `regex(re)` | — | yes: the pattern | stays |
| `refine` | `refine(forms)` at `.` | `refine(rule, forms)` | no: forms in the record | stays; gains the entry form |
| `transform` | — | becomes `edit(rule, sets)` | — | goes |

### 3.2 Notes

- **`field`.**
  - Effect: a field-segment rename when the member was already a field, a symbol or a token (`recordFieldEffect`).
  - Refusals: an element slot that is named differently (`assertElementSlotName`), and `edit-site-missing`.
  - Authoring a plain field may drop a parent's forwarding shortcuts. It never drops a registered variant family, such as `suite.inline/block/empty`.
- **`alias(name)`.** One entry form. What it does depends on the member:
  - a symbol member is aliased in place: `alias(member, $.name)`;
  - an alias member keeps its content and takes the new name as its face;
  - structure is registered as `_name` and aliased (`resolveAliasPlaceholder`).

  The effect `(from, to)` is recorded for every form; today only the literal `alias(sym(a), sym(b))` value records it. That literal form goes, and the generator writes `alias(name)`.

  **The alias check.** In a layer above the first, `alias` refuses a target the base already has, and an alias that flips hiddenness (`alias-target-invalid`):
  - Over a completed grammar, such an alias is a merge or a hiddenness change, which the stage-2 merge rules handle.
  - Layer 1 is exempt, because it writes tree-sitter's own aliases.
  - Today this is `checkBindingPatches`, run on the bindings layer only.
- **`variant`.**
  - The entry form is unchanged. A variant at a hoisted site only names enrich's mint; elsewhere, transform mints it as an aliased variant.
  - The direct form `variant(name, rule, options?)` returns `rule` labelled as the arm `name`. The layer mints it exactly as the entry form would at that arm. It is valid where the entry form is valid.
  - The acceptance plan's re-authored arms are written in this form: the kind-gap arms for the builder contexts.
- **`rule(name, body)`.** Unchanged. A name the grammar already has is `rule-name-taken` (today the check in `injectPlaceholderHiddenRules`).
- **`refine`.** The entry `refine(forms)` at `.` records the same forms as today's inline `refine(original, forms)`. The forms are still validated at codegen.
- **`regex`, `group`, `flatten`, `arm.default`.** Unchanged.

### 3.3 `rename`

`kind: { '.': rename(to) }` renames the rule and every reference to it. Its effect rewrites every inherited record that a kind name keys (§1.6).
- It is refused with `rename-invalid` when:
  - the source is not a rule or an external;
  - the rename flips hiddenness;
  - the grammar already has the target name. That makes it a merge, which the stage-2 merge rules handle.
- It records `renamedFrom`.
- Under the stage-2 ruling, kind renames stay out of the parser. So the generated layer emits none (question 2), and the verb has no user today. It is specified here so that its records are listed, and it is implemented with its first user.

### 3.4 Declarations that are not edits

- **`reauthored` and `vocabulary`.** `reauthored(cause, body)`, `reauthored(cause, witnesses, body)` and `vocabulary(body)` declare why a `rules:` entry replaces or adds a rule.
  - They tag the callback and change nothing in it. Rule causes are judged against the enriched stage.
  - The acceptance plan's first stage changes the witnessed overloads to witness arrays and adds `accepts-invalid-syntax`.
  - They are layer-1 only, since a generated layer has no `rules:`.
- **`role(symbol, 'indent' | 'dedent' | 'newline')`,** in the `externals` callback, is unchanged. It is recorded in the layer record.
- **`preference(arm)`,** in `options:`, is unchanged. `options:` stays its own key:
  - its paths address render sites (separators, delimiters, token flanks, and `_` for every kind), not rule members;
  - nothing in it reaches the parser.
- **`contexts`.** `contexts: ($) => ({ [term]: { requiredBy, providedAt, boundedAt } })`, with `slot(kind, name)`, is builder-only, as the builder contexts spec defines.
  - The layer function puts it in the layer record and never passes it to the runtime's `grammar()`.
  - Its kinds and slots resolve after link.

### 3.5 Config keys

| key | decision |
| --- | --- |
| `name` | stays; defaults to the base's |
| `rules` | stays; callbacks may call verbs inline |
| `edits` | new; replaces `patches` |
| `patches` | goes, to `edits` |
| `bindings` | goes: grammar.bindings.ts is a layer |
| `resolutions` | stays on layer 1, which passes the file; the record carries it and each layer applies its own section (§6) |
| `supertypes`, `inline`, `extras`, `externals`, `word`, `conflicts`, `precedences`, `reserved` | stay: tree-sitter's own callbacks |
| `groups` | stays in its function form; the record form goes, since no grammar uses it |
| `injects` | goes: no grammar uses it, and `groups:` and authored hidden rules cover injection |
| `options`, `renderAs`, `visibleExternals`, `reparseHosts`, `factoryInline` | stay |
| `expectDiagnostics`, `expectTestFailures` | stay |
| `contexts` | new, from the builder contexts spec |

## 4. The copy primitive

### 4.1 Definition

A copy is a rule made from a base rule for one context. Every rule a verb makes from another one is a copy: the copies that paths entering rules make, `copy()` in a substitution, and the lead's forms.

- **Body.** The base's body with edits applied. An edit may replace the body entirely, as the lead's receiver form does.
- **Name.**
  - A given name keeps the base's hiddenness and must be new. Otherwise it is `copy-name-invalid`.
  - Without a name, the copy is `_<base>_<context>`, with the base's own leading underscore dropped (`_declaration_statement` in `impl_item_body` gives `_declaration_statement_impl_item_body`), as split clones and lead mints are named today.
- **Display.** An unnamed copy of a visible rule aliases back: `alias($._base_ctx, $.base)`. The tree shows the base's kind, and only a named copy shows a kind of its own.
- **Second sites.** An unnamed copy of a visible rule gives its kind a second site.
  - Where an option addresses that kind, the options refuse the address ("names 2 sites"), so the copy must be named.
  - Where every site of a shared visible kind may change, the kind is narrowed in place instead, as the lead's rest side narrows `parameter`.
- **Form-of fact.** A copy is a form of its base. The copy effect records this; today it is `splitFrom` or `leadFrom`.
- **Lists.** A copy joins every supertype and inline list its base is in. A copy of a supertype keeps its members' `variantOf` stamps, and they are never narrowed.
- **One copy per base and context.** A second edit through the same context reuses the existing copies. Python's decorated class-body method reuses the class-body copies.
- **Options.** As in §1.6: copies made by entering a rule or by `substitute` inherit options, and lead forms do not.

### 4.2 `substitute`, and paths that enter rules

- `kind: { path: substitute(r) }` replaces the member at `path` with `r`.
  - `r` is either a rule, or `($, member) => rule`, which receives the member so the replacement can keep it.
  - This is today's literal patch value under a name. A bare rule as an entry is refused, so there is one spelling. The entry type rejects it at type-check, and evaluation reports `edit-entry-invalid`.
- When `path` enters rules, each entered rule is copied for the context that the key names.
  - Hidden rules are copied unnamed.
  - A visible rule needs `(kind as name)`.
  - This holds for every verb, not only `substitute`. The edit at the end of the path applies inside the copies.
- Inside a replacement, `copy(name?, sets?)` copies the rule the member references, applying `sets` to the copy.

### 4.3 What the primitive serves

```ts
// today's rust split, as the bindings record states it: function_item becomes method_declaration in impl bodies
impl_item_body: { 'body:/(declaration_list as extension_declaration_body)/(function_item)': substitute(copy('method_declaration')) },

// the ruled contextual alias: the ancestors are copied, the target is not
impl_item_body: { 'body:/(declaration_list as extension_declaration_body)/(function_item)': alias('method_declaration') },
trait_item: { 'body:/(declaration_list as trait_interface_declaration_body)/(function_signature_item)': alias('signature_method_declaration') },

// typescript's literal split: a named copy beside its source, its leaf replaced by the literal
class_body: {
	'(method_definition)': substitute(($, member) =>
		choice(member, copy('constructor_declaration', { 'name:': substitute(($) => alias('constructor', $.property_identifier)) }))
	)
}
```

| work | how it uses the primitive |
| --- | --- |
| today's bindings `split` | a named copy of the target, reached by a path through named visible ancestors and unnamed hidden ones |
| contextual aliases (2c, ruled) | the same path, with `alias(name)` at the end and no target copy |
| literal splits (2c) | `substitute` with a named copy beside the member, and the leaf replaced inside the copy |
| one split per site (2e) | one copy per base and context |
| clones are forms (2e) | the copy effect's form-of fact feeds `formsOf` |
| the receiver lead | narrowed copies of the item's rules, and the receiver form, a copy of the list with its body replaced (§5) |

## 5. `lead`: the repeat rewrite

`L: { '.': lead(item, field, ...admits) }` applies to `L`, a separated list of field `item`: `seq(field(item, X), repeat(seq(sep, field(item, X))))` with an optional trailing separator, as `fieldedHeadListOf` recognizes it. The rewrite has three parts.

1. **The rest.** `L`'s items are narrowed so that they cannot be an admitted head.
   - A visible kind is narrowed in place, whether or not other rules reach it.
   - A hidden rule that only the list reaches is narrowed in place too.
   - A hidden rule that other rules also reach is narrowed in a hidden copy, `_<rule>_<item>`.
2. **The receiver form.** A copy of `L`, `_<L>_<field>`, aliased `<L>_<field>`, whose body is replaced by `seq(field(field, head), optional(<L>_<field>_group))`.
   - `head` is `X` narrowed to the admits. The head side's narrowed rules are hidden copies `_<rule>_<field>`, aliased to the admit's `as` or to `<kind>_<field>`.
   - The group is `seq(sep, field(<owner field>, L))`, with the field optional when the list allows a trailing separator. Enrich's automatic-group primitive mints it, so the layer's output keeps enrich's shape and a lone separator survives a round trip.
3. **The owners.** Every field that holds `L` becomes `choice(L, receiver form)`.

**Admits.** `match(kind, within?, as?)` admits a kind, optionally narrowed within one of its fields or its unfielded child. `as` names the head's visible form, for a claim's name such as `this_parameter`; otherwise the form is `<kind>_<field>`.

**Effects.**
- One lead effect records the list, item, field, admits, receiver, group, rest field and variant names. `bindings/lead-facts.ts` projects claims onto the forms from it.
- Each form the lead creates gets a copy effect, which is `leadFrom` today.

**Order.** A lead changes its owners, so it runs in the whole-grammar phase after the edits along paths that enter rules, just as `bindGrammar` ran leads after splits. Names in a lead entry are the base's, and the lead resolves them through the layer's own field effects (`boundFieldNameOf` today).

**Refusals.** Each is `lead-refused`, naming the lead and the reason. The reasons are today's `LeadRefusal`s:
- the list is not a separated list of field `item`;
- the list takes a leading separator, or a mandatory trailing one;
- the lead admits a kind twice;
- it admits no item, or leaves the list no item;
- the list sits in no field of another rule, or in several fields;
- a restriction names no position, several positions, or a position under a repeat;
- an admitted kind sits where the split cannot divide it;
- a rule another lead holds would be narrowed in place;
- a name the grammar already has would be minted, or one rule narrowed two ways.

## 6. Conflict resolutions per layer

- **Sections.** `resolutions.json` holds one section per layer: the top level for layer 1, and `bound` for layer 2.
  - Layer N applies sections 1 through N. Today that is `applyConflictResolutions` followed by `applyBoundConflictResolutions`.
  - The file's shape stays; a third layer would add a section.
- **Derivation.** The conflict driver derives each section on that layer's evaluation (selected by module, §1.4). Each section is keyed by the hash of that evaluation.
- **What is hashed.** Today the hash covers the whole evaluated grammar, provenance records included. Any record change invalidates a section, even when the parser input has not changed.
  - **In stage 1:** the evaluated grammar's content stays equal, through the projections in §1.5. Both sections are reused, and `resolutions.json` is byte-identical.
  - **In a later stage:** the hash narrows to what the derivation reads: the parser input, the derivation records (source edges, base names, upstream conflicts) and the tree-sitter version. That stage changes every hash once. Its gate is identical resolution arrays, and a second regeneration that reuses every section.

## 7. Shape predicates and pipeline functions

- **One set of shape predicates.** Verbs read rule shapes only through the shared predicates in `rule-patterns.ts`: `unwrapPrec`, `flattenChoiceMembers`, `hiddenChoiceClass`, `optionalContentOf`, `fieldedHeadListOf`, `rulesEqual` and `isParserHiddenName`. `bind.ts`'s private copies (`unprecedenced`, `refRule`, `refKind` and its record walkers) fold into them.
- **Precedence wrappers.** Verbs see DSL rules, where a lifted arm keeps its `prec.left`. Link sees resolved rules, where that wrapper is gone. A predicate that classifies by shape therefore reads through precedence wrappers, so that both sides classify a rule alike.
- **Pipeline functions.** Each verb's application is a pipeline function `apply<Verb>(target, ctx: LayerCtx)`, with one phase context for the layer pass, under the `(target, ctx)` ratchet.
- **Where the code lives.**
  - The layer function is in `dsl/layer.ts`, and its record in `dsl/layer-record.ts`.
  - The copy primitive, `substitute`, `lead` and `rename` are in `dsl/verbs/`.
  - The placeholders stay in `dsl/primitives/`.
  - The existing verbs keep their application in `transform.ts`.

## 8. Coordinate's twelve points

| # | point | where answered |
| --- | --- | --- |
| 1 | Dual execution: a verb after `grammar()` and `grammar.json` as ground truth | §1.3: every rule change runs in the layer function before the runtime's `grammar()`. Today's `bindGrammar` edits do reach `grammar.json`, but skip normalization and leak records; evaluate's four duplicate passes go. |
| 2 | Three sidecars across layers | §1.2 intake and §1.5 `sidecars` |
| 3 | Non-enumerable layer metadata | §1.5: one `LayerRecord` replaces the five routes |
| 4 | Option paths follow edits | §1.6: one effect table; effects rewrite inherited records only |
| 5 | Lead facts are stamped | §5 effects: the lead effect and copy effects, with `leadFrom` as a projection |
| 6 | Split facts and carried options | §4.1: form-of fact, options, lists, `variantOf` |
| 7 | Bound resolutions keyed by hash | §6: per-layer sections; stage 1 keeps the hash input equal; a later stage narrows it |
| 8 | Evaluate up to layer N | §1.4: select the layer's module; `SITTIR_UNBOUND` goes |
| 9 | Generated-layer provenance | §2.4: `edits` data, `export const hash`, paths derived against layer 1, existence and alias checks at evaluation |
| 10 | Wire context across layers | §1.5: `liftNames` union; §1.2 completion stamps each layer's own automatic variants |
| 11 | Shape predicates; `PREC_LEFT` on lifted arms | §7 |
| 12 | Registered variant families; the `(target, ctx)` ratchet | §3.2 `field`; §7 |

## 9. What later plans build on

| plan | builds on |
| --- | --- |
| wiring plan, 2b | Stage 1 of the rewrite **is** 2b's activation in the new form: the patches and receiver leads apply, and splits stay off. 2b's open boundary (claims that follow split kinds) continues on top of it. |
| wiring plan, 2c with 2e | Contextual aliases are `alias(name)` at the end of a path that enters rules (rewrite stage 5). Literal splits are `substitute` with `copy` (stage 5). One split per site comes from one copy per base and context. "Clones are forms" reads the copy effect into `formsOf`, and decides whether lead forms join. |
| acceptance authoring | Its first stage, witness arrays and the new cause, has no DSL dependency and can land at any time. The kind-gap stage writes its re-authored arms with `variant(name, rule)` (rewrite stage 3). |
| builder contexts | `contexts:` and `slot()` go into the layer record (rewrite stage 2). |
| runtime bindings generator, vocabulary synonyms | No verb. |

## 10. The reshape gate (stage 1)

- **Generated files.** Every file in `scratchpad/handoffs/reshape-gate-manifest-946114382.txt` matches its blob, except:
  - grammar.bindings.ts, which is rewritten as a layer;
  - `.sittir/grammar.js` for rust, typescript and python, which re-exports the top layer;
  - `grammar.json`'s `splitFrom`, `leadFrom` and `bindingEffects` keys, if question 1 is answered (a). The rest of `grammar.json`, and `parser.c`, `node-types.json` and `parser.wasm`, stay byte-identical.
- **Validation rows.** `validate:native` rows equal `reshape-gate-rows-946114382.txt`.
- **Evaluated grammars.** Each layer's evaluated grammar, including the record's projections, deep-equals the 2b head's. A snapshot is taken at 946114382. Equality keeps both conflict sections reused.
- **The standing gates:**
  - the full unit suite;
  - workspace type-check and lint;
  - the cargo workspace;
  - `bindings-inventory --check`;
  - the Codex adversarial review before the PR.

## 11. What goes

| goes | replaced by |
| --- | --- |
| `bindings()`, the `Bindings` record, the printer's record and `loadBindingsModule`'s default-export read | the layer form and `export const hash` |
| `bindGrammar`, and `splitGrammar`, `leadGrammar`, `renameGrammar` and `rewriteBindingOptions` as whole-grammar passes | the copy primitive and `substitute`, `lead`, `rename`, and the effect table; their logic moves, the passes go |
| `checkBindingPatches` | `alias` in a layer above the first |
| `BINDING_SET`, `markBindingSet`, `isBindingSet` and the effect gating in `wireWithBindingEffects` | every layer records effects |
| `sittirGrammar`, `completeLayer`'s bindings branch, and `assertEnrichFixpoint` as a `sittirGrammar` step | `grammar` and its intake |
| `wireBindings` | the same lowering at every depth |
| the lift-name merge into the sittir wire context | the record's `liftNames` |
| `UNBOUND_ENV`, `SITTIR_UNBOUND`, `importUnbound` | module selection |
| evaluate's synthetic injection, `groups:` body evaluation, pattern replacement and visible-externals rewrite; `desugarDivergences` and its diagnostic | the layer pass |
| evaluate's inherit helpers and wire-context draining | the record |
| wire's lazy `wrapRuleHook` | the eager layer pass |
| `transform` as an authoring export | `edit` |
| the bare-rule patch value; the literal `alias(sym(a), sym(b))` | `substitute`; `alias(name)` |
| `fieldRenameGrammar`, `fieldWrapGrammar` | the deriver writes `field` entries at sites it finds |
| `injects:`, and the record form of `groups:` | nothing: no grammar uses them |
| `bind.ts`'s private shape helpers | the shared predicates |
| the generated layer's `renames` list | question 2 |

## 12. Questions for the maintainer

1. **`grammar.json`'s provenance keys.**
   - Today: the 2b head's bound `grammar.json` carries `splitFrom`, `leadFrom` and `bindingEffects`. `bindGrammar` writes them as enumerable keys, and tree-sitter serializes them but never reads them. The layer record makes them non-enumerable, so they leave `grammar.json`.
   - (a) Gate `grammar.json` with those three keys removed, and keep `parser.c`, `node-types.json` and `parser.wasm` byte-identical. Recommended: the keys are sittir records in tree-sitter's file.
   - (b) Keep writing them in stage 1, and drop them in a later stage under its own gate.
2. **The derived kind renames.**
   - Today: the generated layers list 109 (rust), 104 (typescript) and 91 (python) kind renames. Under the stage-2 ruling nothing applies them.
   - (a) The generated layer drops them. The portable layer keeps deriving its names from the claims, as it does now. `rename` is specified (§3.3) and implemented with its first user. Recommended: dropping them changes no output.
   - (b) Emit them as `rename` entries that apply. This reverses the stage-2 ruling.
3. **Enrich over the rules a layer creates.**
   - The conflict: the maintainer's 2026-10-12 ruling had enrich re-run over every rule a bindings edit creates. The 2b head instead builds those rules with enrich's own minting primitives (the receiver group) and runs no second enrich.
   - (a) Keep building created rules with enrich's primitives, and have the top layer's completion **check** the enrich fixpoint over the rules it created. This is a check, not a re-run, like the intake gate. Recommended, if stage 0's measurement at 946114382 finds the check passes; otherwise each change it finds is reported first.
   - (b) Re-run enrich over every created rule, as ruled before.
   - (c) Neither: only a layer above can check, and the top layer has none.
4. **API shapes.** Approve or amend each:
   1. `grammar(base, config)` replaces `sittirGrammar`, with the name defaulted from the base.
   2. `edit(rule, sets)` is the inline form, after `edits`.
   3. Paths enter rules with `(kind)` followed by more segments, and `(kind as name)` names a copy.
   4. `substitute(rule | ($, member) => rule)`, with the bare-rule entry refused.
   5. `copy(name?, sets?)`, valid inside a substitution.
   6. `lead(item, field, ...admits)` at the list's `.`.
   7. `rename(to)` at `.`.
   8. `variant(name, rule, options?)` as the direct form.
   9. `refine(forms)` as an entry.
   10. `export const hash` in the generated layer.
   11. `injects:` and the record form of `groups:` go.
