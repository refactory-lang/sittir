# The authoring DSL: layers, the `edits` section and the verbs

A grammar package states its grammar in layers. Every layer is the same expression, `grammar(enrich(base), wire(config))`: tree-sitter's own `grammar`, given the layer below and the layer's config. Inside a layer, one declarative section, `edits`, holds the per-site edits as data, keyed kind → path → entry. The same verbs can be called inside `rules:` bodies.

This spec defines:
- the layer shape, and where its two halves meet;
- the `edits` section;
- every verb, both existing and new;
- the copy primitive, `narrow` and the `lead` helper.

It replaces three things: the `bindings({ hash, patches, renames, leads, splits })` record, `bindGrammar`, and `sittirGrammar`.

The rewrite is staged in `docs/superpowers/plans/2026-10-15-authoring-dsl-rewrite.md`. Its first stage reshapes every layer and must be byte-identical to the 2b head, except that three provenance keys leave `grammar.json`.

Status: ruled. The maintainer answered the open questions on 2026-10-15. §12 lists the mechanisms this design chose within those rulings.

## Rulings

Maintainer, 2026-10-15:
- **Layers.** Every layer is `grammar(enrich(base), wire(config))`, with tree-sitter's stock `grammar`, in the same shape at every layer. No sittir function shadows `grammar`. grammar.bindings.ts extends grammar.sittir.ts: `grammar(enrich(sittir), wire({ … }))`.
- **Two levels.**
  - One declarative section per layer, keyed kind → path → entry. It replaces `patches:` and the bindings record's patches, leads and splits.
  - The verbs sit underneath, and the section lowers to the same verb applications.
- **Inline verbs.** Verbs may be called inside `rules:` bodies. This reverses the 2026-09-02 ruling that kept `transform()` out of rules.
  - An inline call stamps the same effects as its declarative form.
  - A declarative entry and an inline call that target the same site are a diagnostic.
- **Generated layers write the section as data,** so the staleness hash and the existence checks carry over. The section is named `edits`.
- **Replace.** Declaratively, a bare rule or `($, member) => rule` at a path replaces the member. Inline, `replace(previous, path, rule)`.
- **Copy.** `copy(source, path?)` returns a reference to a new hidden rule, aliased back to its source, with the copy effect and the form-of fact.
  - Naming is `alias(copy(…), $.name)`, and editing is `replace(copy(…), path, rule)`.
  - Copy takes no name and no edits.
- **Lead** is a helper composed of general verbs. Its facts derive from the copy effects, and its refusals are the verbs' refusals.
- **Rename** is a real verb the parser sees. It is built now and kept available with no user.
- **The derived kind renames** stay out of the grammar tree-sitter sees. The generated layer carries them as data, a named export beside `hash`, not as `edits` entries.
- **Provenance keys.** `splitFrom`, `leadFrom` and `bindingEffects` leave `grammar.json` in the first stage.
- **Enrich over created rules.** Created rules are built with enrich's primitives, and completion checks the enrich fixpoint.
- **Approved as proposed:**
  - `edit(rule, sets)`;
  - paths that enter rules, with `(kind as name)`;
  - `variant(name, rule, options?)`;
  - `refine(forms)` as an entry;
  - `export const hash`;
  - `injects:` and the record form of `groups:` go.
- **Order of work.** The first stage is gated byte-identical against the 2b head, 946114382, once wire's visible-externals rewrite is idempotent (§10). 2b waits for the rewrite.

Carried forward unchanged:
- One copy primitive serves splits, contextual aliases, literal splits and the receiver lead.
- A visible copy that options address needs a name of its own. Aliased back, it gives its kind a second site, and the render options refuse an address that names two sites.
- A shared visible kind is narrowed in place rather than copied when every site may change.
- A literal split's literal must lex as a keyword at its position.
- Kinds sittir synthesizes from structure are minted by enrich, and `variant()` supplies their names.
- Registered variant families survive field authoring.
- The enrich fixpoint check is strict and carries enrich's three sidecars.
- Pipeline functions take `(target, ctx)`.

## 1. Layers

### 1.1 The chain

| layer | file | form |
| --- | --- | --- |
| 0, upstream | `node_modules/tree-sitter-<lang>/grammar.js` | re-exported by `packages/<lang>/base.ts` |
| 1, authored | `packages/<lang>/grammar.sittir.ts` | `export default grammar(enrich(base), wire({ … }))` |
| 2, generated | `packages/<lang>/grammar.bindings.ts` | `export default grammar(enrich(sittir), wire({ edits }))` |
| entry | `packages/<lang>/.sittir/grammar.js` | `export { default } from '../grammar.bindings.ts'` |

- **`grammar` is the runtime's own function.** That is tree-sitter's under the CLI and sittir's `grammarFn` under `evaluate()`; each runtime installs it as a global, and layer files call the global.
  - `authoring-globals.d.ts` declares its type, generic over the base.
  - TypeScript infers `wire`'s base type from the call's contextual return type, so `wire(config)` is checked against the base's rule names. A reduced type probe confirmed it: an `edits` key and a `$.name` that the base lacks are both type errors.
- **`enrich(base)` is the base half, and `wire(config)` is the options half.** Neither sees the other when it is called; §1.2 says where they meet.
- **`name`** defaults to the base's. `wire` sets `options.name` when it completes the layer, before the runtime reads it.
- **Imports run upward.** Each layer imports the one below it, so grammar.sittir.ts no longer imports grammar.bindings.ts.
- **`.sittir/grammar.js` re-exports the top layer.** That is grammar.bindings.ts where the package has one, and grammar.sittir.ts otherwise.
  - One function, `topLayerPath`, names the top layer.
  - Both the transpiler that writes this file and every consumer that evaluates the full grammar use it.
- **Every layer file uses erasable syntax only,** and so does every module it imports, because Node strips the types when tree-sitter's CLI loads them. A generated layer holds imports, the `hash` and `renames` constants, and data.

### 1.2 Where the halves meet

The runtime's `grammar(base, options)` reads in this order (tree-sitter 0.26.9's `dsl.js`):
1. the base's `name`;
2. the base's `externals`, which it passes to `options.externals`;
3. the keys of `options.rules` and of the base's rules, from which it builds `$`. The externals come first because `$` must know their names;
4. each rule callback, given the base's rule of that name;
5. `reserved`, `extras`, `word`, `conflicts`, `inline`, `supertypes` and `precedences`, each given the base's list.

Sittir's `grammarFn` must read in the same order. Today it reads the base's rules before it calls the externals callback; that changes.

The externals callback is therefore the one point where a layer sees its base before the runtime fixes the rule names, and a rule the layer creates must be a key of `options.rules` by then. The layer uses that point:
- **`enrich(base)` returns a pending base.**
  - Its `name` and `externals` are set. The `externals` array carries a non-enumerable handle to the pending layer.
  - Its rules and other lists are filled when the layer completes it. Reading them earlier throws, so a runtime that reads out of order fails at once.
  - Its `reserved` is a fresh object. Tree-sitter writes a layer's reserved word sets into the base's `reserved`, and that write must never reach the layer below.
- **`wire(config)` returns options whose `externals` callback is the layer's entry.** The callback is always present. It takes the handle from the base externals it is given, then:
  1. completes the base (intake, §1.3);
  2. runs the layer pass (§1.3);
  3. fills `options.rules` with one callback per rule the layer defines or changes, plus one for its start rule (§1.6), in the order §1.3 gives, and sets `options.name` when the config gives none;
  4. returns the layer's externals.
- **Every other callback returns what the pass computed,** and evaluates nothing.

The two halves share only that handle. No state is ambient: two layers evaluated in one process, or one layer evaluated twice, never share a pending base.

**Guards.** The hook rests on the order in which tree-sitter's `dsl.js` calls the callbacks. That order is internal to tree-sitter, so a change to it must fail loudly, never skip the pass:
- `options.rules` throws if it is read before the pass has run. The message names the tree-sitter version the order was verified against (0.26.9).
- The handle is consumed once. The externals callback refuses a handle it has already consumed, so the pass cannot run twice.
- `enrich(base)` refuses a base that carries a handle no pass consumed.
- A test runs the pinned CLI over a fixture chain and asserts the pass ran once, before `$` was built. Bumping tree-sitter's version fails that test until the order is verified again.

### 1.3 One layer

The layer pass runs five steps. They are the same at every depth and in both runtimes.

1. **Intake.**
   - Over an upstream base, which carries no layer record, enrich runs with the config's enrich inputs: `groups:` bodies, authored extras, and the field sites that `edits` names. This is today's sittir layer.
   - Over a completed layer, the layer takes the enrichment that its base's completion checked (step 5) and does not enrich again.
   - Over a completed layer, the config's enrich inputs reach no enrich. A rule that one of them would have changed is reported by this layer's own check.
2. **Lowering.** Each `edits` entry becomes a verb application on its kind's rule.
   - Kind K's callback is its own `rules:` callback if it has one, followed by `edit(result, edits[K])`. This is today's patched-parent composition.
   - An entry whose effect reaches other rules is queued for the whole-grammar phase: a path that enters a rule (§4.2), `lead` (§5.2) and `rename` (§3.3).
3. **Evaluation.**
   - Every callback of the config is evaluated once.
   - Its `$` knows the base's rules, the config's rule names, the externals and every name the entries declare. As in tree-sitter, an unknown name gives the undefined-symbol value: `alias()` accepts it as a new name, and every other use reports it.
   - Inline verb calls run here, and their whole-grammar parts are queued. A rule that an inline call creates is reached through the call's result (§4.1), not through `$`.
4. **The whole-grammar phase,** in this order:
   1. lift-name resolution;
   2. pattern injection (`groups:` and authored hidden rules);
   3. edits along paths that enter rules (§4.2);
   4. leads (§5.2);
   5. renames (§3.3).

   Every verb records its effects in the layer's effect log (§1.7).
5. **Completion.** Nothing runs after the runtime's `grammar()` returns, so completion is part of the pass, and what it changes reaches the runtime through the callbacks. In order:
   1. automatic variants are stamped on the rules this layer created or changed;
   2. enrich mints that nothing reaches are blanked: their callbacks return `blank()`, and the `inline` and `supertypes` callbacks leave them out;
   3. the layer's conflict sets are computed for the `conflicts` callback (§6);
   4. **the fixpoint check:**
      - enrich runs once over the layer's result, with its sidecars;
      - any rule it would add, remove or change is `layer-not-enrich-fixpoint`, naming the layer and the rules;
      - the checked enrichment goes into the record, for the layer above;
   5. text tokens are recorded;
   6. inherited records are rewritten through the effect log (§1.7);
   7. the layer record is attached (§1.6).

   A layer cannot know whether another layer will extend it, so every layer checks its own result. The top layer is therefore checked, and no layer checks its base again.

**Rule order.**
- The runtime appends the rules a layer creates in the order of `options.rules`' keys.
- The layer lists them in the order wire and `bindGrammar` add them today: wire's placeholder rules first, then the whole-grammar phase's, in phase order. At 946114382, rust's four lead rules follow `_kw_raw` as its last rules.
- Rule order fixes symbol ids, so it is part of every byte-identical gate.

### 1.4 Both runtimes see every edit

Tree-sitter's CLI serializes the default export of `.sittir/grammar.js` into `grammar.json`, and that file is the ground truth for what the parser sees. Sittir's `evaluate()` reads the same object.

**The rule.** Every step that changes a rule runs in the layer pass, inside wire's externals callback, and reaches the runtime only through the callbacks. The runtime's `grammar()` only interprets: tree-sitter normalizes and records, and sittir's `grammarFn` records.

Today the rule is broken in four places:
- **`sittirGrammar` completes each layer after `grammar()` returns.**
  - It writes the conflict sets, blanks dead mints and stamps variants on the runtime's result object, which tree-sitter then serializes.
  - The stock shape has no step after `grammar()`, so these steps move into the pass.
- **`bindGrammar` runs after `grammar()`.**
  - Its splits and leads do reach `grammar.json`, because `sittirGrammar` returns the rewritten object. But they skip tree-sitter's normalization and the checks `grammar()` makes of the rule lists.
  - It also writes `splitFrom`, `leadFrom` and `bindingEffects` as enumerable keys, which tree-sitter serializes.
  - The pass moves the edits before the runtime, and the records move into the layer record, out of `grammar.json`.
- **`evaluate()` keeps its own copies of four wire passes:**
  - synthetic-rule injection;
  - `groups:` body evaluation, with a swallowed `catch`;
  - pattern replacement;
  - the visible-externals rewrite.

  `desugarDivergences` exists only to report where these copies and wire disagree, and a production invariant asserts that it stays empty. The pass runs each step once, for both runtimes, so the copies, the divergence record and its diagnostic all go.
- **Wire's rule hook evaluates every callback lazily,** on the runtime's first call. The pass evaluates eagerly, inside the externals callback.

Compile-time passes after `evaluate()`, from link onward, must not mint a kind the parser should have. A kind name with no parser-issued kind id is a phantom, and the existing phantom-kind ratchet counts it.

### 1.5 Evaluating up to a layer

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

### 1.6 The layer record: one home for what crosses layers

Today, facts cross from one layer to the next by five routes:
- enrich's three sidecars, re-attached by `withEnrichSidecarsOf`;
- non-enumerable keys that `completeLayer` copies from the previous grammar: dead mints, text tokens and derivation records;
- evaluate's inherit helpers (`inheritedRecord`, `inheritedMap`, `inheritedPatchSites`), which merge groups, refine forms, render-as, visible externals, options, rule causes, patch sites and the expectations;
- `sittirGrammar` merging the bindings layer's lift names into the sittir layer's wire context, so that derivation records see them;
- enumerable provenance keys: `bindGrammar` writes `splitFrom`, `leadFrom` and `bindingEffects`, and `renameGrammar` writes `renamedFrom`.

Instead, a completed layer's result carries one non-enumerable **layer record**. Its schema, `LayerRecord`, is the single list of what crosses layers.

**Where it rides.**
- The runtime's result is a fresh object, and nothing runs after the runtime builds it.
- Both runtimes keep a rule callback's return value by identity: tree-sitter's `normalize` and sittir's `coerceToRule` return a rule object unchanged.
- So the layer's callback for its start rule, the grammar's first rule, returns a fresh copy of that rule's body that carries the record under a symbol key. `layerRecordOf(result)` reads it there.
- JSON serialization skips symbol keys, so `grammar.json` never sees the record. An upstream grammar has none.
- **The pass owns the start rule's callback.**
  - When `rules:` overrides the start rule, or an entry edits it, the pass evaluates both as it does for any rule. It then attaches the record to the final body.
  - The pass returns every body already normalized. A bare string or pattern becomes its `STRING` or `PATTERN` object first, so the runtime keeps the object it is given.
  - `rename` refuses the start rule (§3.3), so the first rule is always the start rule.

| field | contents | across layers |
| --- | --- | --- |
| `depth` | 1 for grammar.sittir.ts, one more per layer above | — |
| `upstream` | the layer-0 grammar | kept from layer 1; derivation records stay keyed to it |
| `enrichment` | enrich's checked run over this layer's result (§1.3, step 5), with its three sidecars: rule origins, whitespace and automatic variants | the layer above takes it as its base |
| `resolutions` | the conflict resolutions file | from layer 1; each layer applies its own section (§6) |
| `deadMints`, `textTokens` | as today | union |
| `liftNames` | every lift rename | union; derivation records read the union |
| `effects` | the effect log (§1.7) | appended |
| `records` | options and `_labels`, groups, render-as, visible externals, reparse hosts, refine forms, rule causes and undeclared rules, patch sites, external roles, the expectations, contexts, stages, protected rule names, whitespace collisions, body-pattern zero matches | inherited entries are rewritten (§1.7), then a layer's own entry wins |

- `splitFrom`, `leadFrom`, `renamedFrom` and `bindingEffects` become projections of `effects` (§1.7). The evaluated grammar still exposes them under those names, so their readers do not change. `grammar.json` no longer carries them.
- Sittir's `grammarFn` becomes the exact counterpart of `dsl.js`'s `grammar()`, over evaluate's rule types. It stops draining the wire context and merging inherited metadata. `importAndExtractGrammar` reads the record.

### 1.7 Effects: edits follow into inherited records

Each verb application records its effects:
- `field`: a field-segment rename (owner, old segment, new segment), as `recordFieldEffect` records today;
- `alias`: an alias (from, to), where `from` is the member's displayed name;
- `rename`: a kind rename (from, to);
- `copy`: the copy, its source, the part copied, its context, its displayed name, and its **origin**, which names the entry or call that made it. A copy that a helper makes names the helper's entry as its origin.

**Which records are rewritten.**
- At completion, a layer rewrites the records it **inherited** through its effects, in the order the effects were recorded.
- The records a layer authors itself are written against its own result, so they are not rewritten.
- Layer 1 inherits no records, so its effects rewrite nothing. That is why only the bindings layer's patch sets record effects today, under the `BINDING_SET` mark. The mark goes, and every layer records.

One table states what each effect rewrites. It replaces `renameGrammar`'s three field lists, `carryHiddenFacts` and `rewriteBindingOptions`:

| record | field segment | alias | kind rename | copy |
| --- | --- | --- | --- | --- |
| option paths | the segment, on that owner | `(from)` segments | heads and `(kind)` segments | by origin, below |
| `_labels` addresses | the segment | `(from)` segments | heads | by origin, below |
| reparse hosts | — | — | keys, priority, gated | — |
| render-as, visible externals, groups | — | — | keys | — |
| supertypes, inline, factory-inline | — | — | names | a whole copy joins every list its source is in |
| rule bodies, `word`, conflicts, precedences, reserved | — | — | names | — |

How a copy is treated depends on its origin:
- **A path that enters a rule, or `copy()`.** The copy inherits its source's options and `_labels` entries, layout included, as split copies do today (`inheritSplitOptions`).
- **`narrow`, or a `lead`.** The copy has a new shape and inherits nothing, as the lead's forms do today.

**Projections.**
- Only a layer that inherits a record projects. It appends its own effects' projections to the inherited ones, under today's presence rules: `splitFrom` and `bindingEffects` on every such layer, `leadFrom` only when a lead made a copy, and `renamedFrom` only when a rename exists. Layer 1 records its effects but projects nothing.
- `splitFrom` maps each copy whose origin is a path or `copy()` to its source.
- `leadFrom` maps each copy whose origin is a `lead` to its source.
- `renamedFrom` maps each rename's target to its source. It is absent when the layer renames nothing.
- `bindingEffects` is the segment and alias effects in recording order, then one entry per lead:
  - its list, item, field and admits come from the lead entry;
  - its receiver and head forms come from the displayed names of its copies;
  - its group and rest field come from the receiver form's body.

  This reproduces what `bindGrammar` writes today.

## 2. The `edits` section

### 2.1 Shape

```ts
edits: {
	[kind: string]: EditSet | readonly EditSet[];   // EditSet = { readonly [path: string]: Entry }
}
```

- It has the same shape in every layer. It replaces `patches:` in layer 1, and the record's `patches`, `leads` and `splits` in layer 2.
- A list of sets applies in order, each set to the result of the one before, as patch sets do today.
- **An entry** is one of:
  - a verb call without its target (§3), for example `field('name')`, `alias('name')`, `variant('name')`, `narrow(…)`, `lead(…)` or `rename('to')`. Such entries are placeholders, which is why a generated layer can be plain data;
  - a rule, or `($, member) => rule`, which replaces the member (§3.2).
- **Keys are type-checked** against the base's kinds at every layer, through the base type that `wire` infers (§1.1). `EditsCheck` is today's `PatchesCheck`, renamed. A key that names no rule when the layer evaluates is `edit-site-missing`.
- **A key names a rule** of the layer's base or of its own `rules:`. A copy takes its edits where it is made: `replace(copy(…), path, rule)` or `edit(copy(…), sets)` (§4.1).

### 2.2 Addressing

There is one path model, transform's (`transform-path.ts`). Every verb shares it, and so do `edit()` and `replace()`.
- **Segments:**
  - `.` addresses the rule itself;
  - `N` or `-N` addresses a member by index;
  - `_` addresses every member;
  - `"text"` addresses the member whose fixed text is `text`;
  - `(kind)` addresses every reference to `kind` in the subtree, skipping references that are already fielded;
  - `name:` addresses the field `name`.
- **Lifts.** A path sees through its rule's own enrich lifts (group lifts and content aliases), because a lift is part of its owner.
- **Entering a rule.**
  - A `(kind)` segment followed by more segments continues inside the referenced rule's body.
  - Hidden rules between visible kinds are entered implicitly, so a path is written in tree terms, the way a query sees the tree.
  - Each rule a path enters is copied for the context that the key names (§4.2), so the edit is context-specific.
  - `(kind as name)` stands for `alias(copy(kind), $.name)` at that reference: it names the copy.
  - A path that ends at `(kind)` still addresses the reference itself, as it does today.
- **Missing sites.** A path that matches nothing is `edit-site-missing`, a diagnostic naming the kind and path. Today this case is the bindings wire's "patch applies nowhere" refusal or transform's `ApplyPathSkip`.

### 2.3 Inline: `edit` and `replace`

Inside a `rules:` callback or a replacing function:
- `edit(previous, { [path]: entry })` applies entries to a rule the callback holds. It takes the same entries and the same path model as the section. It replaces `transform()`, whose one grammar user today is python's `tuple_pattern`.
- `replace(previous, path, rule)` replaces the member at `path` with `rule`, which is a rule or `($, member) => rule`. It is the inline spelling of a replacing entry.
- Both apply to a copy's body when `previous` is a reference that `copy()` returned (§4.1).
- **Direct forms.** Three verbs also have forms that build rules:
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
import { enrich, field, lead, match, wire } from '../codegen/src/dsl/dsl-authoring.ts';

export const hash = '…';

export const renames = { source_file: 'file', function_item: 'function_declaration' /* … */ };

export default grammar(
	enrich(sittir),
	wire({
		edits: {
			attribute_item: { '2': field('content') },
			parameters_elements: {
				'.': lead('attributed_parameter', 'receiver', match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] }, 'receiver_parameter_declaration')]))
			}
		}
	})
);
```

- **The staleness hash** is the named export `hash`. `assertBindingsFresh` reads it from there, never from the grammar config.
  - `compile` checks freshness before it evaluates the top layer. A stale layer then reports the regenerate command, not a missing site.
  - The hash covers bindings.scm and the vocabulary, not grammar.sittir.ts. A layer-1 change that moves a site is caught when the layer evaluates (`edit-site-missing`, and the alias check in §3.2) and by the regeneration drift check.
- **The derived kind renames** are the named export `renames`, a map from each base kind to its bound name.
  - They are data. No layer applies them, and they are not written as `rename` entries (§3.3).
  - The inventory derives and reports them, as it does today.
- **Paths are derived against layer 1's result.** The inventory derives every path there, and the existence and alias checks run when the layer evaluates, as today.
- **The printer prints entries, never a record.**
- **Splits stay off until the wiring plan's contextual-alias stage turns them on.** Until then the generator computes and reports split entries but does not print them. Today this switch is grammar.sittir.ts passing `splits: []`.
- **One implementation of the field edit.** The deriver finds each field edit's site directly and writes the entry. `fieldRenameGrammar` and `fieldWrapGrammar` go: they apply the same edit a second way only so that the deriver can diff the two grammars.

## 3. The verbs

### 3.1 Every verb

The "parser" column says whether tree-sitter sees the edit, or only the model does, through an annotation or the layer record. Every verb can be used in every layer, and every entry can also be applied inline through `edit()`.

| verb | `edits` entry | inline form | parser | decision |
| --- | --- | --- | --- | --- |
| `field` | `field(name)` | `field(name, rule)` | yes | stays |
| `alias` | `alias(name)` | `alias(rule, name)` | yes | stays; one entry form (§3.2) |
| `variant` | `variant(name, { default?, absent? })` | `variant(name, rule, options?)` | yes where it mints, else a label | stays; gains the direct form |
| `rule` | `rule(name, body)` | write the rule in `rules:` | yes | stays |
| replace | a rule, or `($, member) => rule` | `replace(rule, path, rule)` | yes | stays as today's literal entry; gains the function form and the inline form |
| `copy` | used inside a replacement | `copy(source, path?)` | yes | new; the copy primitive (§4) |
| `narrow` | `narrow(...admits)`, `narrow.except(...admits)` | through `edit()` | yes | new (§5.1) |
| `lead` | `lead(item, field, ...admits)` at a list's `.` | — | yes | moves from the bindings record; a helper over `copy`, `narrow`, `replace` and `alias` (§5.2) |
| `match` | the admit builder of `narrow` and `lead` | — | — | stays (§5.3) |
| `rename` | `rename(to)` at `.` | — | yes | moves from the bindings record; a real verb with no user yet (§3.3) |
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
  - structure is registered as `_name` and aliased (`resolveAliasPlaceholder`);
  - a reference that `copy()` returned keeps its copy and takes the new name in place of the alias back to its source.

  The effect `(from, to)` is recorded for every form; today only the literal `alias(sym(a), sym(b))` value records it. That literal form goes, and the generator writes `alias(name)`.

  **The alias check.** In a layer above the first, `alias` refuses a target the base already has, and an alias that flips hiddenness (`alias-target-invalid`).
  - The check reads the member's displayed name, so naming a copy of a visible kind with another visible name flips nothing.
  - Over a completed grammar, such an alias is a merge or a hiddenness change.
  - A merge the layer declares is a display family, not an overload. Enrich splits a display that a grammar overloads by accident; its detector (`unaliasOverloadedDisplays`) never matches a display family a layer declared. This narrows what the detector matches; it is not a skip set or a decline.
  - The declared families, read from the layer's alias effects, are an input to enrich and to the completion check (§1.3), so a declared merge passes the fixpoint check.
  - Layer 1 is exempt, because it writes tree-sitter's own aliases.
  - Today this is `checkBindingPatches`, run on the bindings layer only.
- **`variant`.**
  - The entry form is unchanged. A variant at a hoisted site only names enrich's mint; elsewhere, transform mints it as an aliased variant.
  - The direct form `variant(name, rule, options?)` returns `rule` labelled as the arm `name`. The layer mints it exactly as the entry form would at that arm, and it is valid where the entry form is valid.
  - The acceptance plan's re-authored arms are written in this form: the kind-gap arms for the builder contexts.
- **`rule(name, body)`.** Unchanged. A name the grammar already has is `rule-name-taken` (today the check in `injectPlaceholderHiddenRules`).
- **Replace.**
  - A rule as an entry replaces the member, as today's literal patch value does, including the case that aliases the member's own symbol and keeps the member's metadata.
  - `($, member) => rule` receives the member, so the replacement can keep it.
  - `replace(previous, path, rule)` is the inline spelling.
- **`refine`.** The entry `refine(forms)` at `.` records the same forms as today's inline `refine(original, forms)`. The forms are still validated at codegen.
- **`regex`, `group`, `flatten`, `arm.default`.** Unchanged.

### 3.3 `rename`

`kind: { '.': rename(to) }` renames the rule. The runtime's `grammar()` can append a rule but never remove one, so a rename:
- appends a rule `to` with the kind's body;
- rewrites every reference to the kind, in every rule and in `word`, `extras`, `externals`, `inline`, `supertypes`, `conflicts`, `precedences` and `reserved`;
- leaves the old name as an unreachable blank rule, as a dead enrich mint is left;
- records the rename effect. The effect rewrites every inherited record that a kind name keys (§1.7) and gives `renamedFrom`.

It is refused with `rename-invalid` when:
- the source is not a rule or an external;
- the source is the start rule, which must stay first;
- the rename flips hiddenness;
- the grammar already has the target name. That makes it a merge, which an `alias` to the existing display declares (§3.2).

No layer uses it yet. The derived kind renames stay data (§2.4), and the generator never writes a `rename` entry. Where `rename` is unused, which today is everywhere, it adds no rule, and `parser.c`'s symbol table is unchanged.

### 3.4 Declarations that are not edits

- **`reauthored` and `vocabulary`.** `reauthored(cause, body)`, `reauthored(cause, witnesses, body)` and `vocabulary(body)` declare why a `rules:` entry replaces or adds a rule.
  - They tag the callback and change nothing in it. Rule causes are judged against the enriched stage.
  - The acceptance plan's first stage changes the witnessed overloads to witness arrays and adds `accepts-invalid-syntax`.
  - They are layer-1 only, since a generated layer has no `rules:`.
- **`role(symbol, 'indent' | 'dedent' | 'newline')`,** in the `externals` callback, is unchanged. The pass calls that callback, so it records the roles in the layer record.
- **`preference(arm)`,** in `options:`, is unchanged. `options:` stays its own key:
  - its paths address render sites (separators, delimiters, token flanks, and `_` for every kind), not rule members;
  - nothing in it reaches the parser.
- **`contexts`.** `contexts: ($) => ({ [term]: { requiredBy, providedAt, boundedAt } })`, with `slot(kind, name)`, is builder-only, as the builder contexts spec defines.
  - `wire` puts it in the layer record and leaves it out of the options it returns.
  - Its kinds and slots resolve after link.

### 3.5 Config keys

| key | decision |
| --- | --- |
| `name` | stays; defaults to the base's |
| `rules` | stays; callbacks may call verbs inline |
| `edits` | new; replaces `patches` |
| `patches` | goes, to `edits` |
| `bindings` | goes: grammar.bindings.ts is a layer |
| `resolutions` | stays on layer 1, which passes the file; the record carries it, and each layer applies its own section (§6) |
| `supertypes`, `inline`, `extras`, `externals`, `word`, `conflicts`, `precedences`, `reserved` | stay: tree-sitter's own callbacks, which the pass calls with the base's lists |
| `groups` | stays in its function form; the record form goes, since no grammar uses it |
| `injects` | goes: no grammar uses it, and `groups:` and authored hidden rules cover injection |
| `options`, `renderAs`, `visibleExternals`, `reparseHosts`, `factoryInline` | stay |
| `expectDiagnostics`, `expectTestFailures` | stay |
| `contexts` | new, from the builder contexts spec |

## 4. The copy primitive

### 4.1 `copy(source, path?)`

A copy is a rule made from a source rule for one context. Every rule a verb makes from another one is a copy: the copies that paths entering rules make, `copy()` itself, `narrow`'s copies, and the lead's forms.

- **Arguments.**
  - `source` names a rule: `'name'` or `$.name`.
  - `path` selects the part copied. It is omitted, or `.`, for the whole rule; `'2'` copies the third member, one arm of a choice. A part is reached by index and field segments only.
- **Context.** The kind whose `edits` entry or `rules:` callback makes the copy. A helper sets its own: the lead copies in the context of its field or its item (§5.2).
- **Body.** The source's body, or the selected part.
- **Name.** A copy is always hidden.
  - A whole copy is `_<source>_<context>`, with the source's own leading underscore dropped. So `_declaration_statement` copied in `impl_item_body` gives `_declaration_statement_impl_item_body`, as split clones and lead mints are named today.
  - A part copy puts the part's segments between the two: `_<source>_<part>_<context>`, so arm 2 of `_declaration` in `impl_item_body` gives `_declaration_2_impl_item_body`.
  - A name that some other rule already has is `rule-name-taken`.
- **The reference.** `copy()` returns `alias($._<copy>, $.<source>)` when the source is visible, so the tree shows the source's kind. A copy of a hidden rule returns `$._<copy>`.
- **Naming.** `alias(copy(…), $.name)` shows the copy as `name`. The alias replaces the alias back to the source, and the alias effect records `(source, name)`.
- **Editing.** `replace(copy(…), path, rule)` and `edit(copy(…), sets)` edit the copy's body, and return the same reference.
- **When copy runs.** Only during the layer pass: in a `rules:` callback, in a replacing function `($, member) => …`, or in a helper. A call anywhere else is `edit-entry-invalid`.
- **Second sites.** An unnamed copy of a visible rule gives its kind a second site.
  - Where an option addresses that kind, the options refuse the address ("names 2 sites"), so the copy must be named.
  - Where every site of a shared visible kind may change, the kind is narrowed in place instead, as the lead's rest side narrows `parameter`.
- **Form-of fact.** A copy is a form of its source, and the copy effect records this. Today it is `splitFrom` or `leadFrom`.
- **Lists.** A whole copy joins every supertype and inline list its source is in. A copy of a supertype keeps its members' `variantOf` stamps, and they are never narrowed.
- **One copy per source, part and context.** A second call through the same context returns the same reference, and its edits apply to the same copy. Python's decorated class-body method reuses the class-body copies.
- **Options.** As §1.7 says: copies whose origin is a path or `copy()` inherit their source's options; `narrow`'s copies and the lead's do not.

### 4.2 Paths that enter rules

- When an entry's path enters rules, each entered rule is copied for the context the key names, and the entry applies inside the copies.
  - Hidden rules are copied unnamed.
  - `(kind as name)` names a visible rule's copy, as `alias(copy(kind), $.name)`.
  - Without `as`, a visible rule's copy aliases back, and its kind gets a second site (§4.1).
- This holds for every verb. The edit at the end of the path applies inside the last copy.

### 4.3 What the primitive serves

```ts
// today's rust split, as the bindings record states it: function_item becomes method_declaration in impl bodies
impl_item_body: {
	'body:/(declaration_list as extension_declaration_body)/(function_item)': ($) => alias(copy('function_item'), $.method_declaration)
},

// the ruled contextual alias: the ancestors are copied, and the target is aliased in place
impl_item_body: { 'body:/(declaration_list as extension_declaration_body)/(function_item)': alias('method_declaration') },
trait_item: { 'body:/(declaration_list as trait_interface_declaration_body)/(function_signature_item)': alias('signature_method_declaration') },

// typescript's literal split: a named copy beside its source, its name replaced by the literal
class_body: {
	'(method_definition)': ($, member) =>
		choice(member, alias(replace(copy('method_definition'), 'name:', alias('constructor', $.property_identifier)), $.constructor_declaration))
}
```

| work | how it uses the primitive |
| --- | --- |
| today's bindings `split` | a path through named visible ancestors and unnamed hidden ones, ending in `alias(copy(target), $.name)` |
| contextual aliases (2c, ruled) | the same path, ending in `alias(name)`: the target is not copied |
| literal splits (2c) | `replace(copy(…), path, literal)`, named with `alias`, beside the member |
| one split per site (2e) | one copy per source, part and context |
| clones are forms (2e) | the copy effect's form-of fact feeds `formsOf` |
| the receiver lead | `narrow`'s copies, and the receiver form: a copy of the list with its body replaced (§5.2) |

## 5. `narrow` and the `lead` helper

### 5.1 `narrow`

`K: { path: narrow(...admits) }` and `K: { path: narrow.except(...admits) }` narrow the choice at the site.
- The site is a choice of arms, directly or through hidden rules.
- An admit with `within` reaches into a kind's field, or its unfielded child (§5.3).

The two forms differ in what they may change:
- **`narrow(...)` makes the site a form** that holds only the admitted arms. It changes no rule that another site reaches:
  - each rule it changes on the way is copied for the context;
  - a visible kind narrowed within an admit is copied and shown as the admit's `as`, or as `<kind>_<context>`.
- **`narrow.except(...)` restricts the site** so that it cannot hold the admitted arms:
  - a hidden rule that only this site reaches is narrowed in place;
  - a hidden rule that other rules also reach is copied for the context;
  - a visible kind narrowed within an admit is narrowed in place. The restriction then holds everywhere the kind appears, so every site of the kind may change.

Copies are named as `copy` names them (§4.1). Their effects give as origin the narrow, or the helper entry that applied it.

**Refusals.** Each is `narrow-invalid`, naming the site and the reason:
- an admit names a kind twice;
- the narrowing leaves the site, or a field it reaches into, no arm;
- a `within` names no position in its kind, several positions, or one under a repeat;
- an admitted kind sits where the narrowing cannot divide it;
- a kind admitted `within` has no rule;
- a visible kind narrowed in place sits at several positions of the site.

A narrowing that changes, in place, a rule that an earlier narrowing reached, or changes one rule two ways, is `edit-site-conflict`.

### 5.2 `lead`, a helper

`L: { '.': lead(item, field, ...admits) }` applies to `L`, a separated list of field `item`: `seq(field(item, X), repeat(seq(sep, field(item, X))))` with at most an optional trailing separator, as `fieldedHeadListOf` recognizes it.

The helper records no effect of its own and has no refusal of its own. In the whole-grammar phase, after the paths that enter rules, it applies:
1. **The head.** `narrow(...admits)` of `X`, in the context `field`. Its copies are `_<rule>_<field>`. Its visible forms are each admit's `as`, or `<kind>_<field>`.
2. **The rest.** `narrow.except(...admits)` at `L`'s items, in the context `item`, so that no item can be an admitted head.
3. **The receiver form.** `alias(replace(copy(L), '.', seq(field(field, head), optional(group))), $.<L>_<field>)`.
   - The copy is in the context `field`, so it is `_<L>_<field>`.
   - The group is `seq(sep, field(<owner field>, L))`, with the field optional when the list allows a trailing separator.
   - Enrich's automatic-group primitive mints the group as `<L>_<field>_group`, so the layer's output keeps enrich's shape and a lone separator survives a round trip.
4. **The owners.** In every other rule, the one field that holds `L` is replaced through `($, member) => choice(member, receiver form)`.

Names in a lead entry are the base's. The helper resolves them through the layer's own field effects, as `boundFieldNameOf` does today.

**Facts.** `bindings/lead-facts.ts` projects claims from the copy effects whose origin is the lead entry:
- the receiver is the displayed name of the list's copy;
- each head form is the displayed name of its kind's copy;
- the entry gives the admits;
- the receiver form's body gives the group and the rest field.

The `leadFrom` and `bindingEffects` projections read the same effects (§1.7). `LeadEffect` goes.

**Refusals.** Today's `LeadRefusal`s become the verbs' refusals, and `lead-refused` goes:

| today's refusal | now |
| --- | --- |
| the list is no rule of the grammar | `edit-site-missing` |
| the list is not a separated list of field `item`; it takes a leading separator, or a mandatory trailing one | `edit-entry-invalid`: `lead` applies only to such a list |
| the list sits in no field of another rule, in several fields, or other than as a field's content | `edit-entry-invalid`: the owners' replacement needs one field |
| the receiver group cannot be named | `edit-entry-invalid` |
| it admits a kind twice; it admits no item; it leaves the list no item; a restriction names no position, several, or one under a repeat; an admitted kind sits where the split cannot divide it; a kind has no rule to narrow; a kind narrowed in place sits at several positions | `narrow-invalid` |
| a rule that another lead holds would be narrowed in place; one rule is narrowed two ways | `edit-site-conflict` |
| a name the grammar already has would be minted | `rule-name-taken` |

### 5.3 Admits

`match(kind, within?, as?)` admits a kind.
- `within` narrows it further: within one of its fields, as `{ field: [admits] }`, or within its unfielded child, as `[admits]`.
- `as` names the form's visible kind, for a claim's name such as `this_parameter`. Otherwise the form is `<kind>_<context>`.

## 6. Conflict resolutions per layer

- **Sections.** `resolutions.json` holds one section per layer: the top level for layer 1, and `bound` for layer 2.
  - Layer N applies sections 1 through N. Today that is `applyConflictResolutions` followed by `applyBoundConflictResolutions`.
  - The file's shape stays; a third layer would add a section.
- **Through the `conflicts` callback.** A layer's conflict sets reach the parser only through its `conflicts` callback.
  - Layer 1's callback returns its section's sets in place of the list it is given, as `applyConflictResolutions` sets them today.
  - Each layer above returns the list it is given followed by its own section's sets, as `applyBoundConflictResolutions` appends them.
  - At 946114382 the result is the layer-1 sets followed by the bound sets, as today.
- **Derivation.** The conflict driver derives each section on that layer's evaluation, selected by module (§1.5). Each section is keyed by the hash of that evaluation.
- **What is hashed.** Today the hash covers the whole evaluated grammar, provenance records included. Any record change invalidates a section, even when the parser input has not changed.
  - **In the first stage,** the evaluated grammar's content stays equal, through the projections in §1.7. Both sections are reused, and `resolutions.json` is byte-identical.
  - **In a later stage,** the hash narrows to what the derivation reads: the parser input, the derivation records (source edges, base names, upstream conflicts) and the tree-sitter version. That stage changes every hash once. Its gate is identical resolution arrays, and a second regeneration that reuses every section.

## 7. Shape predicates and pipeline functions

- **One set of shape predicates.** Verbs read rule shapes only through the shared predicates in `rule-patterns.ts`: `unwrapPrec`, `flattenChoiceMembers`, `hiddenChoiceClass`, `optionalContentOf`, `fieldedHeadListOf`, `rulesEqual` and `isParserHiddenName`. `bind.ts`'s private copies (`unprecedenced`, `refRule`, `refKind` and its record walkers) fold into them.
- **Precedence wrappers.** Verbs see DSL rules, where a lifted arm keeps its `prec.left`. Link sees resolved rules, where that wrapper is gone. A predicate that classifies by shape therefore reads through precedence wrappers, so that both sides classify a rule alike.
- **Pipeline functions.** Each verb's application is a pipeline function `apply<Verb>(target, ctx: LayerCtx)`, with one phase context for the layer pass, under the `(target, ctx)` ratchet.
- **Where the code lives.**
  - The pending base and the layer pass are in `dsl/layer.ts`, and the record in `dsl/layer-record.ts`. `enrich()` returns its pending base through `layer.ts`, and wire's externals callback runs the pass.
  - `copy`, `narrow`, the `lead` helper and `rename` are in `dsl/verbs/`.
  - The placeholders stay in `dsl/primitives/`.
  - The existing verbs, replace among them, keep their application in `transform.ts`.

## 8. Coordinate's twelve points

| # | point | where answered |
| --- | --- | --- |
| 1 | Dual execution: a verb after `grammar()`, and `grammar.json` as ground truth | §1.2 to §1.4: every rule change runs in the layer pass, inside wire's externals callback, before the runtime builds `$`. Completion reaches the runtime through the callbacks. Today's `bindGrammar` edits do reach `grammar.json`, but skip normalization and leak records; evaluate's four duplicate passes go. |
| 2 | Three sidecars across layers | §1.3 intake and completion; §1.6 `enrichment` |
| 3 | Non-enumerable layer metadata | §1.6: one `LayerRecord` replaces the five routes, and rides on the start rule's body |
| 4 | Option paths follow edits | §1.7: one effect table; effects rewrite inherited records only |
| 5 | Lead facts are stamped | §5.2 facts: the copy effects, with the lead entry as their origin; `leadFrom` is a projection |
| 6 | Split facts and carried options | §4.1 and §1.7: the form-of fact, options by origin, lists, `variantOf` |
| 7 | Bound resolutions keyed by hash | §6: per-layer sections through the `conflicts` callback; the first stage keeps the hash input equal, and a later stage narrows it |
| 8 | Evaluate up to layer N | §1.5: select the layer's module; `SITTIR_UNBOUND` goes |
| 9 | Generated-layer provenance | §2.4: `edits` data, `export const hash`, paths derived against layer 1, existence and alias checks at evaluation |
| 10 | Wire context across layers | §1.6: the `liftNames` union; §1.3: completion stamps each layer's own automatic variants |
| 11 | Shape predicates; `PREC_LEFT` on lifted arms | §7 |
| 12 | Registered variant families; the `(target, ctx)` ratchet | §3.2 `field`; §7 |

## 9. What later plans build on

| plan | builds on |
| --- | --- |
| wiring plan, 2b | The rewrite's first stage **is** 2b's activation in the new form: the patches and receiver leads apply, and splits stay off. 2b's open boundary, the claims that follow split kinds, continues on top of it. |
| wiring plan, 2c with 2e | These build on the rewrite stage for paths that enter rules. Contextual aliases are `alias(name)` at the end of such a path. Literal splits are `replace(copy(…))`, named with `alias`. One split per site comes from one copy per source, part and context. "Clones are forms" reads the copy effect into `formsOf`, and the copy's origin says whether a form is a lead's. |
| acceptance authoring | Its first stage, witness arrays and the new cause, has no DSL dependency and can land at any time. The kind-gap stage writes its re-authored arms with `variant(name, rule)`, from the rewrite stage for inline verbs. |
| builder contexts | `contexts:` and `slot()` go into the layer record, from the rewrite stage that moves evaluate onto the record. |
| runtime bindings generator, vocabulary synonyms | No verb. |

## 10. The reshape gate (first stage)

- **The baseline.**
  - The rewrite branches from master, with the 2b head merged in.
  - Master has since changed 22 generated files, all downstream of the grammar: the packages' `api.ts`, `portable.ts`, `types.ts`, `utils.ts` and `node-model-portable.json5`, and the crates' `lib.rs`.
  - So the baseline is recorded after that merge. Before it is recorded, the merge's grammar-level outputs are checked against 946114382's blobs: `grammar.json`, `parser.c`, `node-types.json`, `parser.wasm`, `resolutions.json` and the generated layers.
  - It is recorded once wire's visible-externals rewrite is idempotent. At 946114382 the bindings layer wraps layer 1's aliases a second time, `alias(alias($._newline, newline), newline)`, which enrich cannot run over again. The idempotent rewrite collapses those aliases in `grammar.json` (python 10, rust 8, typescript 8), restores the whitespace factory entries the nesting had dropped, and moves only the grammar hashes in `resolutions.json`. `parser.c`, `node-types.json` and `parser.wasm` do not move.
- **Generated files.** Every file in the baseline manifest matches its blob, except:
  - grammar.bindings.ts, which is rewritten as a layer;
  - `.sittir/grammar.js` for rust, typescript and python, which re-exports the top layer;
  - `grammar.json` for rust, typescript and python, which drops `splitFrom`, `leadFrom` and `bindingEffects`. The rest of `grammar.json`, and `parser.c`, `node-types.json` and `parser.wasm`, stay byte-identical.
- **Validation rows.** `validate:native` rows equal the baseline's rows. Those are `reshape-gate-rows-946114382.txt`, unless the merge moved a row, and any moved row is reported before the baseline is accepted.
- **Evaluated grammars.** Each layer's evaluated grammar, including the record's projections, deep-equals the baseline's. A snapshot is taken at the baseline. Equality keeps both conflict sections reused.
- **The standing gates:**
  - the full unit suite;
  - workspace type-check and lint;
  - the cargo workspace;
  - `bindings-inventory --check`;
  - the Codex adversarial review before the PR.

## 11. What goes

| goes | replaced by |
| --- | --- |
| `bindings()`, the `Bindings` record, the printer's record and `loadBindingsModule`'s default-export read | the layer form, and the `hash` and `renames` exports |
| `bindGrammar`; `splitGrammar`, `leadGrammar` and `rewriteBindingOptions` as whole-grammar passes; `LeadEffect` and `LeadRefusal` | `copy`, `narrow`, the `lead` helper and the effect table: their logic moves, and the passes go |
| `renameGrammar` | the `rename` verb |
| `checkBindingPatches` | `alias` in a layer above the first |
| `BINDING_SET`, `markBindingSet`, `isBindingSet` and the effect gating in `wireWithBindingEffects` | every layer records effects |
| `sittirGrammar`, `completeLayer`, and `assertEnrichFixpoint` as a `sittirGrammar` step | the stock `grammar(enrich(base), wire(config))`, the pending base, and the completion check |
| `wireBindings` | the same lowering at every depth |
| the lift-name merge into the sittir wire context | the record's `liftNames` |
| `UNBOUND_ENV`, `SITTIR_UNBOUND`, `importUnbound` | module selection |
| evaluate's synthetic injection, `groups:` body evaluation, pattern replacement and visible-externals rewrite; `desugarDivergences` and its diagnostic | the layer pass |
| evaluate's inherit helpers and wire-context draining | the record |
| wire's lazy `wrapRuleHook` | the eager pass in the externals callback |
| `transform` as an authoring export | `edit` |
| the literal `alias(sym(a), sym(b))` entry | `alias(name)` |
| `fieldRenameGrammar`, `fieldWrapGrammar` | the deriver writes `field` entries at sites it finds |
| `injects:`, and the record form of `groups:` | nothing: no grammar uses them |
| `bind.ts`'s private shape helpers | the shared predicates |
| the generated layer's `rename(…)`, `lead(…)` and `split(…)` lists | the `renames` export, `lead` entries and, from 2c, path entries |

## 12. Mechanisms chosen within the rulings

The rulings left these to the design. Each is stated in its section; this list is for review.

1. **How `wire` reaches its base** (§1.2). `enrich(base)` returns a pending base, and wire's externals callback completes it and runs the pass. That callback is the only one the runtime calls before it fixes the rule names.
2. **How completion reaches the parser** (§1.3, §6). Completion runs inside the pass, and its results return through the callbacks: rule bodies, the list callbacks, and the `conflicts` callback for the conflict sets.
3. **Where the record rides** (§1.6). On the start rule's body, the only value both runtimes keep by identity in their result.
4. **Where the fixpoint check runs** (§1.3). In every layer's completion, since a layer cannot know whether it is the top. The layer above reuses the checked enrichment instead of checking its base again.
5. **`narrow` rather than copies of the kept arms** (§5.1). Copies of arms would mint one rule per arm, and could not restrict a visible kind in place. The lead's rest side needs that restriction to stay byte-identical.
6. **Part copies carry their path in their name** (§4.1), so that a whole copy and a part copy of one source in one context never collide.
7. **`rename` leaves the old rule blank and unreachable** (§3.3), because the runtime's `grammar()` cannot remove a base rule. The start rule cannot be renamed.
8. **A copy's origin decides** whether it inherits options and which lead it belongs to (§1.7).
