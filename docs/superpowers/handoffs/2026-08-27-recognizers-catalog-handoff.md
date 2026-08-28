# Handoff — recognizers catalog → phase-typed builders → assemble off the normalized tree

Paste this as the opening prompt of the next session.

---

Continue the rule-builder / recognizers work on `phase-typed-builders`
(branch off `master` at `5c4ef590f`; ruling 1 landed as `0932eb641`, PR #241
against `master`; `evaluate-through-builder` is stacked on it). Everything before it is merged: the
engine/dogfood/tree-identity stack, the rule-builders series, the comment
relocation (`packages/codegen/src` carries no explanatory comments; a
declaration's rationale is its `### \`<file>::<qualified name>\`` entry in
`docs/glossary/<dir>.md`, see `docs/glossary/README.md`; read it before
editing, write there, never a source comment). Read
`docs/superpowers/specs/2026-08-27-wrapper-deletion-as-rule-builder.md`
and `docs/superpowers/specs/2026-08-27-rule-pattern-recognizers.md` first —
they carry every ruling. Session memory: call `get_latest_session`.

## Where the tree is

- **Ruling 1 landed — `0932eb641` (byte-identical, validator exact, tsc at
  the 4-error baseline, suite 2/2839 = the `examples/01` WIP cases).**
  `RuleBuilder<P>` is generic over the phase it constructs for and its
  signatures are the grammar DSL's own, differing only in types:
  `seq(...x)`, `choice(...x)`, `optional(x)`, `repeat(x)` (no separator
  parameter), `field(name, x)`, `alias(x, target: string | symbol)`,
  `token(x)` / `token.immediate(x)`, `prec(n, x)` / `prec.left` /
  `prec.right` / `prec.dynamic`, `variant`, `group`, the leaves.
  `structuralBuilder: RuleBuilder<'evaluate'>` ("structural builders are
  what evaluate uses" — evaluate's DSL does not route through it yet);
  `attributeBuilder: RuleBuilder<'normalize'>`. No `id` parameters:
  `compiler/flatten.ts` (was `wrapper-deletion.ts`; `flatten` /
  `flattenRules`, explicit bottom-up recursion, no `RuleWalker`) applies
  identity once per rebuilt node (`id: node.id ?? built.id`) and stamps
  link's lifted REPEAT separator onto the content `repeat` receives.
  `tokenized`/`immediate` are normalize-only on `RuleBase`;
  `RuleBase.aliasedFrom` is gone (only `SymbolRule` carries it — assemble's
  alias-of-non-symbol fallback deleted); one `RuleSeparator<V>`
  (parameterized by the rule, not the phase — a phase parameter broke TS's
  alias-variance shortcut, 60+ `RenderRule → SimplifiedRule` errors).
  simplify is typed per helper (`RenderRule` / `Rule<'link'>` for the
  link-tree helpers assemble calls); its FIELD-node merge paths were
  production-dead and are gone with their tests. `SimplifyCtx` owns
  `builder` (`BaseCtx` no longer carries one). Link mints its own
  `Rule<'link'>` literals (`withId` from `dsl/builders.ts`). Assembled
  leaves (`AssembledPattern/Keyword/Token`) are typed on the normalize view.
- **Standing rules from the ruling-1 session (in memory too):** no `as X`
  anywhere until `tsc` has been run and the need analyzed (inbound cannot
  be narrowed, no guard available); a phase is nominal, so the fix is
  typing the producer for the phase it serves. The Principle #14 ratchet
  rejects any new non-`(target, ctx)` helper in a pipeline module — inline
  (or put it in `dsl/`); baselines in
  `packages/codegen/.principle14-baseline.json` only go down.
- **Remaining pre-existing casts noted, not touched:**
  `node-map.ts::_deriveSlotsInternal` (`flatten(rule) as Rule<'link'>` —
  step-3 territory), simplify's default-arm `(rule as { type: string })`
  on a `never`. Recognizers in `rule-patterns.ts` that run on the
  RuntimeRule layer keep their structural reads.
- **Gate recipe for every step:** regen all three grammars separately,
  `git diff --stat packages/*/src` EMPTY, `validate history` exact (rust
  146/146·208/208·134/137·1519/1519, ts 142/143·194/194·112/114·1202/1202,
  py 122/122·142/142·115/116·1385/1390), `pnpm test` (from the repo root)
  green except the two `examples/01` WIP cases, tsc (= tsgo) at the codegen
  baseline of 4. Regen AFTER the last source edit (manifest check). Commit
  by `--pathspec-from-file` (zsh does not split `$VAR`); `oxfmt` over a
  directory reformats untouched files — revert that churn before
  committing. If any gate moved, it is a finding — do not adapt.
- **User WIP, never commit:** `TODO.md`, `examples/01-construct-nodes.ts`,
  `examples/18-dogfood-typescript-strict.ts`, `tsconfig.json`,
  `packages/tools/validation-report.json`.

## Ruling 3 is written

`docs/superpowers/specs/2026-08-28-assemble-off-the-simplified-tree.md` —
read it before touching assemble. Two views per kind (simplified = what is a
slot; normalized = what is rendered); node types are the simplified rule
types (`AssembledSymbol` / `AssembledBranch<SeqRule>` / `AssembledPolymorph`
/ `AssembledEnum` / leaf / list) with `hidden` / `transparent` / `word` as
facts; VARIANT and GROUP leave the rule vocabulary (they are not in the
tree-sitter DSL); override-layer facts (variant arm names, role, refine,
factoryInline) live in `AssembledNode.enrichment` — enrich itself is base
(parser-visible) — and enriching emitters produce overlay modules
(`variants.ts`) that extend the core emitters' output; `classifyNode`
default → `unclassifiable-shape` diagnostic ratchet; simplify folds
literal-only seqs to a `STRING` via the fixed-literal join; static spacing
in normalize only where the seam census is static. Steps 3a → 3c → 3d → 3e
→ 3f, 3b parked. Census numbers are in the spec; the probe is
`ushape-census.mts` (scratch) until promoted to `sittir tool
universal-shape-census`.

## Next steps, in order

3. **Assemble never sees a wrapper.** Move the remaining `linkRules`
   consumers in assemble (branch/group construction via `inlinedRule`,
   `collectAnonymousNodes`, variant derivation, `optionalBodyKinds`,
   `_deriveSlotsInternal`'s `flatten(rule) as Rule<'link'>`) onto the
   normalized tree. Evidence that this is a behaviour step, gated with
   review rather than byte-identity: walking `normalizedRules` lost
   python's `and`/`or`/`amp`/`caret`/`lt_lt`/`percent`/`plus`/`slash_slash`
   (the enum-shaped-choice guard in `walkForStrings`) and gained rust's
   real keyword `default`. Root: anonymous-node minting should be
   catalog-driven (`kindEntries`) — rust's parser has 111 anonymous
   symbols, the node map 96.
4. **Link owns inlining** — `inlineSingleUseHidden` /
   `materializeInlinedBody` move up from normalize.
5. **Open finding:** PREC never reaches link (`stripPrecedenceWrappers`
   in evaluate) — the wrapper-deletion spec's "link keeps consuming PREC"
   is inaccurate; `attributeBuilder.prec` is vocabulary only.
6. Then step 3 of the recognizers spec: separator possession into `seq`
   (the lift functions relocate into recognizers, `fuseHeadRepeatLists`
   goes with them; `withSeparator` in flatten disappears with it).
7. DONE (`28b3174a4`, branch `evaluate-through-builder` stacked on
   `phase-typed-builders`): evaluate's DSL constructors ARE
   `structuralBuilder` (the one-level recognitions live there; `token.immediate`
   builds `IMMEDIATE_TOKEN` on the evaluate view because enrich must see
   tree-sitter's tag in both pipelines); `evaluate.ts` exports only
   `evaluate`; `compiler/rule-catalog.ts` holds `buildRuleCatalog` /
   `attachReferenceRuleIds`; `isHiddenKind` / `deriveComplexAliasTargetHidden`
   live in `dsl/rule-patterns.ts`. `StructuralBuilder` / `AttributeBuilder`
   narrow each strategy's exact return types (`RuleBuilder<P>.choice` is
   `Rule<P>`). Enrich keeps calling the globals — under tree-sitter's bundle
   they are tree-sitter's DSL.
8. DONE (`77f742750`, branch `typed-builder-outputs` stacked on
   `evaluate-through-builder`, PR #243): each strategy states the node it
   returns — `StructuralBuilder` exact nodes / honest unions,
   `AttributeBuilder` identity-preserving `<R>(…): R` with input-type
   overloads for the recognitions; never conditional return types (they
   force casts back into the builders). Stack: master ← #241 ← #242 ← #243.

## Tooling that works here

- LSP edits: `node /Users/pmouli/GitHub.nosync/active/ts/lspeasy/apps/cli/dist/cli.js
  --no-proxy --server "/usr/local/bin/tsgo --lsp --stdio" --root <sittir>
  --wait 60000 [--dry-run] textDocument rename <ABS file> <line:col> <new>` and
  `workspace willRenameFiles --params '{"files":[{"oldUri":"file://…","newUri":"file://…"}]}'`
  (then `git mv`). `typescript-language-server` cannot run: the repo's
  TypeScript is 7.0.2 (no tsserver.js). `npx @lspeasy/cli` is broken. `tsc`
  IS tsgo here. A module rename with few importers is also fine as a
  text replace verified by `tsc`.
- `SITTIR_TRACE=<kind,…> … gen …` dumps a rule after every phase.
- Scratch probes need a `.mts` extension (the scratchpad has no
  package.json, so `.ts` is treated as CJS and top-level await fails).
- Code search: infigraph `search` / `search_code` (`pattern`, regex; brace
  globs in `file_pattern` do not expand), never python scripts for search.
  Python only to parse tool output. zsh: `echo ====` fails (`=` is a
  command lookup) — quote separators.
- The validator and test runs auto-commit `validation-history.jsonl` /
  the test record; a following `git push` ships them.

## Standing rulings (in the specs, repeated for emphasis)

Builders are `{...input, attr}` one level down; a builder never defers to
its parent; recognizers are TRANSFORMERS over a builder's children; `seq =
collapse ∘ transformers ∘ splice`; a literal is never a slot by itself;
byte-identical output is the ONLY invariant for a compiler refactor —
internal tests are updated, never preserved; a consumer-side fallback going
green is the moment to ask what the producer lost; builder signatures are
the DSL's, types excepted.

## Follow-ups on record

~265 unresolved `slotByRuleId` lookups (rust 96 / ts 110 / py 59) resolving
by name fallback; remove simplify's `collapseSingleMemberSeq`/`withAttrsFrom`
once proven no-ops and unify precedence (survivor-wins vs spec's outer-wins);
side-by-side construction examples (python has 0 non-dogfood).
