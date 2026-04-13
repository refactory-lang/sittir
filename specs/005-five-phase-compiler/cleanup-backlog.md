# Cleanup backlog — post-implementation

Tracked alongside `tasks.md`. These are simplifications and debt pay-downs
to tackle **after** the main v1→v2 parity milestone is complete. They do
not block functionality; they pay down complexity that accumulated while
the pipeline was being landed incrementally.

The overarching theme is **lean on the AssembledNode class hierarchy**.
Since Phase 4 produces real class instances with derived properties (not
plain data shapes), emitters should consume those classes directly.
Helper functions that recompute information already available as class
getters or methods are dead weight.

---

## C1. Collapse free-function naming helpers into AssembledNode

**What's there now.** `packages/codegen/src/naming.ts` still exports
`toTypeName`, `toFactoryName`, `toRawFactoryName`, `toFieldName`,
`toBuilderClassName`, `toShortName`, `toGrammarTypeName`, `snakeToPascal`,
`snakeToCamel`, `stripSuffix`, plus a `SHORT_NAME_ALIASES` table and
`JS_RESERVED` set. Half of these are duplicates of what `nameNode` and
the class hierarchy already compute; the other half are v1-era helpers
still wired through the legacy `generate()` path.

**What to do.** Move every identity-level piece of data onto the class:

- `AssembledNode.typeName` — already a readonly field.
- `AssembledNode.factoryName` — already a readonly field (undefined for hidden).
- `AssembledNode.irKey` — already a readonly field; populate it in
  `assemble.ts` from `buildIrKeyMap` instead of computing in two places.
- `AssembledNode.rawFactoryName` / `safeFactoryName` — getter that returns
  `factoryName + '_'` when the bare name collides with a JS reserved word.
- `AssembledNode.treeTypeName` — getter returning `${typeName}Tree`.
- `AssembledNode.configTypeName`, `fromInputTypeName` — same pattern.

Emitters should then pull names from `node.X` and never compute them.
`naming.ts` drops to a handful of pure string transforms (`snakeToCamel`,
`snakeToPascal`, `stripSuffix`) that are shared across the class
constructors, or moves entirely into `rule.ts`.

Files that should stop importing from `naming.ts` once this is done:
`wrap.ts`, `types-v2.ts`, `factories-v2.ts`, `from-v2.ts`, `ir-v2.ts`,
`test-v2.ts`, `type-test-v2.ts`, `index-file-v2.ts`, `consts-v2.ts`,
`client-utils-v2.ts`.

---

## C2. Unify ir-key resolution into the class

`buildIrKeyMap` lives in `packages/codegen/src/emitters/ir-keys.ts` and
is passed as a side-channel parameter through `generate.ts` into
`ir-v2.ts` and `test-v2.ts`. After C1 it should become
`AssembledNode.irKey` (populated by `assemble.ts` using the same
collision-resolution pass) and the emitters just read `node.irKey`.
Delete `ir-keys.ts`.

---

## C3. Collapse per-emitter `toTypeName`, `toRawFactoryName`,
`toShortName` copies

Every v2 emitter has either redeclared these helpers locally or
re-imported them from `naming.ts`. Once the class carries all name
surfaces (C1), delete the in-emitter copies. Specific offenders:

- `ir-v2.ts` → private `toRawFactoryName`
- `factories-v2.ts` → private `rawName`, `esc`, `JS_RESERVED`
- `from-v2.ts` → private `rawName`, `JS_RESERVED`
- `test-v2.ts` → private `irKey` (already deleted but the import trail
  still points at `nameNode`)
- `type-test-v2.ts` → private `toPascal`

---

## C4. Delete v1 grammar-loading / model files absorbed into v2

Task IDs **T045a-d** and **T046** already list these. Once type-check
and tests are green across all packages, delete:

- `packages/codegen/src/grammar-reader.ts`, `grammar.ts`,
  `overrides.ts`, `grammar-model.ts`
- `packages/codegen/src/enriched-grammar.ts`, `classify.ts`,
  `semantic-aliases.ts`, `node-types.ts`
- `packages/codegen/src/node-model.ts`, `build-model.ts`,
  `hydration.ts`, `naming.ts` (after C1),
  `optimization.ts`, `kind-projections.ts`
- `packages/codegen/src/factoring.ts`, `token-attachment.ts`,
  `token-names.ts`
- `packages/codegen/src/emitters/rules.ts` (replaced by `templates-v2.ts`)

Keep `packages/codegen/src/validate-templates.ts` — still a useful post-
generation check even if the template emission changed.

---

## C5. Delete the NodeMap → HydratedNodeModel adapter

`packages/codegen/src/compiler/adapter.ts` exists only so the legacy
`wrap.ts` emitter can consume v2's NodeMap. Rewrite `wrap.ts` to take
`NodeMap` directly (dispatching on `AssembledNode.modelType` via the
class hierarchy, same pattern as the other v2 emitters) and delete
`adapter.ts`. This is **T040** from `tasks.md`.

---

## C6. Delete the legacy `generate()` path

`packages/codegen/src/index.ts`'s `generate()` still exists for the
v1 integration suite. After the v2 pipeline owns everything, delete
`generate()` and migrate `packages/codegen/tests/integration/
validate-all.test.ts` to call `generateV2` directly. The v2 corpus
validation test already hits the same surface area; the integration
suite can be slimmed down to just that.

### Apples-to-apples comparison (recorded 2026-04-12)

Ran both pipelines on every grammar via
`packages/codegen/scripts/compare-v1-v2.ts` and diffed the emitted
files. Counts below are **after** the enum-factoryName fix in
`assemble.ts` (see Findings → Enum factoryName drop).

**Byte-identical output (safe to delete v1 emitter for):**
- `grammar.ts` — identical for all three grammars
- `index.ts` — identical for all three grammars

**v2 strictly leaner (v2 smaller, same or more coverage):**
- `from.ts` — v1 4528/4738/2926 lines → v2 1555/1877/1203 (v2
  inlines resolution, v1 had per-grammar stamped helpers)
- `factories.ts` — v1 slightly larger due to trailing-underscore
  naming convention (`abstract_type_(…)` vs `abstractType(…)`).
  Same semantic coverage after the enum fix.
- `utils.ts` — v1 78 → v2 50 (shared helper consolidation)

**v2 strictly broader (more coverage, more emitted types):**
- `types.ts` — v2 +145 rust / +179 ts / +97 python interfaces. v2
  emits stub interfaces for every kind a field union references;
  v1 dropped many of them.
- `templates.yaml` — v2 +67 rust / +197 ts / +82 python entries.
  v2's pure-switch classifier catches rules v1's heuristic path
  dropped (especially typescript).
- `wrap.ts`, `consts.ts`, `type-tests.ts`, `tests.test.ts` — all
  larger in v2, matching the broader node coverage.
- `from.ts` functions — v1=163/167/**1** vs v2=174/217/138. Python
  v1 effectively only emitted one from() binding — a clear v1 bug
  the v2 path avoids.

**Naming convention change (not a gap):**
- v1 exports factories as `abstract_type_` (snake_case + trailing
  `_`). v2 exports them as `abstractType` (camelCase, trailing `_`
  only on JS-reserved collisions).
- Disk outputs (`packages/{rust,typescript,python}/src/factories.ts`)
  already match v2's camelCase convention — v1's form only ever
  existed in the integration test harness.

**Findings worth acting on:**

1. **Enum factoryName drop (fixed).** `assemble.ts` case `'enum'`
   constructed `AssembledEnum` without passing `factoryName` /
   `irKey`, so visible enums (e.g. rust `boolean_literal`,
   `primitive_type`, `fragment_specifier`) emitted an interface
   and a `const enum SyntaxKind` entry but **no factory**. Users
   had no way to construct these kinds through the ir namespace.
   One-line fix on the `new AssembledEnum(...)` call; rust gained
   4 factories, typescript gained 1, python unchanged. All 507
   tests still pass.

2. **`doc_comment` elimination (needs investigation).** v1 had a
   standalone `doc_comment` kind in rust. v2 only emits the
   `_line_doc_comment_marker` / `_block_doc_comment_marker` pair.
   Not clear whether v2's classification is correct (they may be
   the actual tree-sitter kinds and `doc_comment` a v1 invention)
   or whether Link is eagerly inlining something it shouldn't.

3. **Python from() coverage.** v1 emitted a single `from` function
   for all of python. This is a v1 regex/detection bug, not a v2
   gap — noted here for the record.

**Conclusion for C6.** v2 can replace v1 as the canonical generator
for every file. The integration test's `RT_CEILINGS` table is the
only thing still semantically tied to v1 (ceilings were calibrated
against v1-generated templates on disk), and the authoritative guard
is already `corpus-validation.test.ts`. C6 is **unblocked**: delete
`generate()`, migrate `validate-all.test.ts` to `generateV2`, and
drop `RT_CEILINGS` once the suite runs clean against v2 output.
After that, C4 (delete v1 source files) and C16 (delete ceilings
file) can follow in sequence.

---

## C7. Classifier: add `terminal` and `polymorph` to the spec

The Phase-2 Rule taxonomy in
`specs/sittir-grammar-compiler-spec.md:97–192` still lists the old
variant set. `TerminalRule` (emitted by Link's `promoteTerminals`
pass) and `PolymorphRule` (emitted by Optimize's `promotePolymorph`)
are now first-class, and `classifyNode` is a pure `switch` on
`rule.type`. Update the spec table in
`"Rule variant presence by phase"` to reflect the new types and
their phase-of-introduction.

---

## C8. Classifier: move derivation logic into the class constructors

`hasAnyField` / `hasAnyChild` currently live in `rule.ts` as free
functions called by `classifyNode` and `promotePolymorph`. Once the
class constructors eagerly compute `fields`/`children` (or we ditch
the lazy memoization since the walks are cheap), the predicates
collapse to `node.fields.length > 0` / `node.children.length > 0`
and the free functions go away.

---

## C9. Templates walker: hoist into a class method

`walkRule` in `templates-v2.ts` is a 100-line free function matching
on `rule.type`. Since every structural node class already memoizes
its derived fields/children, the walker should become
`AssembledNode.renderTemplate(): { template: string; clauses: Record<string, string> }`.
Each subclass overrides it; the emitter just calls `node.renderTemplate()`
and writes the result.

This drags `renderRule`, `joinParts`, `needsSpace`, and
`findRepeatSeparator` onto the class. The emitter file shrinks from
~300 lines to ~50 (preamble + per-node `render*(node)` dispatch +
YAML serialisation).

---

## C10. Factory emitter: hoist per-model emission into class methods

Same argument as C9. Each of `emitBranchFactory`, `emitContainerFactory`,
`emitPolymorphFactory`, `emitFormFactory`, `emitLeafFactory`,
`emitKeywordFactory`, `emitEnumFactory` in `factories-v2.ts` is a pure
function of the node. They become `AssembledNode.emitFactory(): string`
with a subclass override per modelType.

---

## C11. from-v2: collapse per-model `emitXxxFrom` into the class

Exactly the same refactor as C10, for `from-v2.ts`. Shared resolver
dedup (tasks T042i–k in `tasks.md`) falls out naturally when the
emission lives on the class — you can hash the signature before
emitting.

---

## C12. Validate-templates and validate-renderable share a rule-lookup

Both scanners walk the generated YAML and resolve kinds back to the
source rule. Once NodeMap is the canonical source, pass it directly
to both validators instead of re-parsing the YAML. The checks become
stricter (they can use `node.rule`, `node.fields`, etc.) and the
YAML round-trip becomes an output check only.

---

## C13. Re-run `convert-overrides` into a one-shot migration

The script still exists at
`packages/codegen/src/compiler/convert-overrides.ts` but points at
`overrides.json` (the v1 seed). Move it to
`packages/codegen/scripts/` with a README noting it was used exactly
once to translate structural positions → raw positions, and should
never run again. Or delete it after confirming `overrides.ts` is
genuinely hand-curated.

---

## C14. Spec doc: refresh the "Design principles" section

`specs/sittir-grammar-compiler-spec.md` still describes the pipeline
in terms of `generate()` phases that no longer match the v2
implementation. Update:

- The `Phase 3 Optimize` section to mention `promotePolymorph`.
- The `Phase 2 Link` section to mention `promoteTerminals` and the
  structural-whitespace symbol conversion (`_indent`/`_dedent`/
  `_newline`).
- The `Phase 4 Assemble` section to describe the class hierarchy
  and the fact that classification is pure rule-type dispatch.
- The `Named pattern taxonomy` table to include `terminal` and
  `polymorph`.

---

## C15. Test infrastructure: consolidate the three round-trip validators

`validate-roundtrip.ts`, `validate-factory-roundtrip.ts`, and
`validate-from.ts` share ~60% of their code (tree-sitter adapter,
corpus loading, wrap-for-reparse logic). Extract the shared bits
into `packages/codegen/src/validators/common.ts` and have each
validator just supply its own per-kind check.

---

## C16. Integration tests: delete the v1 ceilings file

`packages/codegen/tests/integration/validate-all.test.ts`'s
`RT_CEILINGS` constant was calibrated against the v1 factories on
disk. After C6 lands (v1 `generate()` is gone) the file either
migrates to `generateV2` or gets deleted entirely in favor of the
`corpus-validation.test.ts` floor test, which is the authoritative
v2 regression guard.

---

## C17. Audit node-types.json usage

Link now converts `_indent`/`_dedent`/`_newline` symbol refs via
name matching. Tree-sitter grammars that use differently-named
externals for the same concept (there are a few) won't get picked
up. Audit the three grammar node-types.json files for external
tokens, document which roles map where, and make the detection
either explicit (`externalRoles` config) or name-agnostic
(detect from the grammar's `externals` list position).

---

## C18. Emitters: remove `any` casts around fields access

The factory and from emitters write `(config as any)?.${propertyName}`
everywhere because the config type was unclear. Now that
`ConfigOf<T>` is fully defined by the types package the `as any`
casts can go. The fluent getters/setters similarly return `any` when
they should return the concrete field type.

---

## C19. Type-check across all packages

**T052** from `tasks.md`. Currently the generated python/rust/typescript
packages have residual `tsgo --noEmit` errors from:

- Stale supertype Tree names (`HiddenCompoundStatementTree` vs
  `CompoundStatementTree`)
- Missing leaf interfaces for external tokens (`string_end`,
  `escape_interpolation`)
- Kinds referenced in field type unions without emitted interfaces
  (`HiddenFExpression`, `HiddenNotEscapeSequence`)

These require finishing the types-v2 emitter to generate stub
interfaces for every kind the field type expressions reference.

---

## Priority ordering

If you can only do a few: **C1 → C3 → C9 → C10 → C11** is the single
most impactful chain. Every downstream emitter becomes smaller,
duplication disappears, and the class hierarchy finally pays for
itself. Everything else (deletions, spec updates, validator
consolidation) is bookkeeping.
