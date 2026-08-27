# Handoff — recognizers catalog → phase-typed builders

Paste this as the opening prompt of the next session.

---

Continue the rule-builder / recognizers work on `engine-tree-identity`.
Read `docs/superpowers/specs/2026-08-27-wrapper-deletion-as-rule-builder.md`
and `docs/superpowers/specs/2026-08-27-rule-pattern-recognizers.md` first —
they carry every ruling. Session memory: call `get_latest_session`.

## Where the tree is

- **Landed and pushed** (verified byte-identical, validator exact):
  `5b4013759` builder refactor → `c555a705c` wrapper id wins → `0b8c879d0`
  assemble FieldRule-id walk deleted → `65717ff25` `optional` one-level
  `slotShaped` gate → `666e895e0` `spliceRawSeq` gone, `seq` splices every
  level → `717d13f19` singleton collapse → `aeae91d3a` recognizers catalog
  step 1 → `a65279942` step 1b (enrich's private recognizers into
  `dsl/rule-patterns.ts`).
- **Step 2 landed — `0aa11ab23`, re-scoped by the user:** link's scope is
  closed to attributes, reference resolution and sidecars; it does NOT
  restructure the tree. A `token()` / `token.immediate()` wrapper survives
  link (renderAs stamping and synthetic externals build with
  `structuralBuilder`); normalize's wrapper-deletion consumes it via
  `attributeBuilder.token/tokenImmediate`, stamping `tokenized`/`immediate`
  on the leaf; assemble's pattern/keyword/token leaves construct off the
  wrapper-free `renderRule`, `AssembledLeaf`'s getters and
  `collectFixedLiteral` read the stamps. `collectAnonymousNodes` still
  walks `linkRules` but treats a bare-literal token as its literal and
  walks through composite token bodies — this reproduces the flattened
  baseline exactly. The only non-neutral artifact is
  `.sittir/grammar-diagnostics.json`: "literal(s) resolved no parser
  kindId" shrinks (rust 3→1, python 14→5, ts 18→3) because composite-token
  internals are no longer asked for a symbol id.
- **Census facts** (scratch probe over the three overridden grammars):
  no TOKEN/ALIAS/PREC node ever survived link before this step; every
  TOKEN wrapper carries an id distinct from its content's (output-inert);
  `tokenized` has no consumer beyond a dedupe key; `immediate` is read via
  `AssembledLeaf.immediate` on a kind's top-level rule only.
- **Gate recipe for every step:** regen all three grammars separately,
  `git diff --stat packages/*/src` EMPTY, `validate history` exact (rust
  146/146·208/208·134/137·1519/1519, ts 142/143·194/194·112/114·1202/1202,
  py 122/122·142/142·115/116·1385/1390), `pnpm test` green except the two
  `examples/01` WIP cases, tsc (= tsgo) at the codegen baseline of 4.
  Commit by `--pathspec-from-file` (zsh does not split `$VAR`); the
  pre-commit runs the Principle #14 ratchet (a new non-`(target, ctx)`
  helper in a pipeline module fails it — inline instead) and the manifest
  check (regen AFTER the last source edit). If any gate moved, it is a
  finding — do not adapt.
- **User WIP, never commit:** `TODO.md`, `examples/01-construct-nodes.ts`,
  `examples/18-dogfood-typescript-strict.ts`, `tsconfig.json`,
  `packages/tools/validation-report.json`.

## User rulings from the step-2 session (the next steps, in order)

1. **Phase-typed builders.** `RuleBuilder` becomes phase-generic:
   structural builders take and return wrapper-phase rules
   (`Rule<'evaluate' | 'link'>`), attribute builders take and return
   `Rule<'normalize'>` — each strategy is closed over its own shape
   (attribute builders receive already-attribute-built children,
   bottom-up). Recognizers / resolvers in `rule-patterns.ts` become
   phase-aware, not `AnyRule`. `TokenRule` becomes wrapper-phase-only in
   the `Rule<Phase>` union and `tokenized`/`immediate` normalize-phase-only
   on `RuleBase`; the type errors that produces ARE the cleanup list
   (normalize.ts's attr carries at the fan-out/factor sites, node-map's
   `deriveValuesForRule` TOKEN case, link's post-resolve TOKEN reads).
2. **Phases never import each other.** Relocate `attributeBuilder` (+
   `buildSeq` / `buildOptional` / `buildRepeatLike` /
   `isSlotPromotedLiteral`, all dsl-side deps) from `compiler/simplify.ts`
   to `dsl/rule-transforms.ts` beside `structuralBuilder`; that also ends
   the `wrapper-deletion ↔ simplify` cycle.
3. **Assemble never sees a wrapper.** Move the remaining `linkRules`
   consumers in assemble (branch/group construction via `inlinedRule`,
   `collectAnonymousNodes`, variant derivation, `optionalBodyKinds`) onto
   the normalized tree. Evidence that this is a behaviour step, gated with
   review rather than byte-identity: walking `normalizedRules` lost
   python's `and`/`or`/`amp`/`caret`/`lt_lt`/`percent`/`plus`/`slash_slash`
   (the enum-shaped-choice guard in `walkForStrings`) and gained rust's
   real keyword `default`. Root: anonymous-node minting should be
   catalog-driven (`kindEntries`) — rust's parser has 111 anonymous
   symbols, the node map 96.
4. **Link owns inlining** — `inlineSingleUseHidden` /
   `materializeInlinedBody` move up from normalize.
5. **Open findings:** `attributeBuilder.alias` stamps `aliasedFrom` =
   alias TARGET on the content while link's `SYMBOL` convention is
   `aliasedFrom` = SOURCE — same attribute, opposite meaning; the builder
   form is never produced in production. PREC never reaches link
   (`stripPrecedenceWrappers` in evaluate) — the wrapper-deletion spec's
   "link keeps consuming PREC" is inaccurate.
6. Then step 3 of the recognizers spec: separator possession into `seq`.

## Tooling that works here

- LSP edits: `node /Users/pmouli/GitHub.nosync/active/ts/lspeasy/apps/cli/dist/cli.js
  --no-proxy --server "/usr/local/bin/tsgo --lsp --stdio" --root <sittir>
  --wait 60000 [--dry-run] textDocument rename <ABS file> <line:col> <new>` and
  `workspace willRenameFiles --params '{"files":[{"oldUri":"file://…","newUri":"file://…"}]}'`
  (then `git mv`). `typescript-language-server` cannot run: the repo's
  TypeScript is 7.0.2 (no tsserver.js). `npx @lspeasy/cli` is broken. `tsc`
  IS tsgo here.
- `SITTIR_TRACE=<kind,…> … gen …` dumps a rule after every phase.
- Scratch probes need a `.mts` extension (the scratchpad has no
  package.json, so `.ts` is treated as CJS and top-level await fails).
- Code search: infigraph `search` / `search_code` (`pattern`, regex; brace
  globs in `file_pattern` do not expand), never python scripts for search.
  Python only to parse tool output.
- The validator run auto-commits `packages/tools/validation-history.jsonl`
  ("chore(validator): record validation run"); a following `git push`
  ships it.

## Standing rulings (in the specs, repeated for emphasis)

Builders are `{...input, attr}` one level down; a builder never defers to
its parent; recognizers are TRANSFORMERS over a builder's children; `seq =
collapse ∘ transformers ∘ splice`; a literal is never a slot by itself;
byte-identical output is the ONLY invariant for a compiler refactor —
internal tests are updated, never preserved; a consumer-side fallback going
green is the moment to ask what the producer lost.

## Follow-ups on record

~265 unresolved `slotByRuleId` lookups (rust 96 / ts 110 / py 59) resolving
by name fallback; remove simplify's `collapseSingleMemberSeq`/`withAttrsFrom`
once proven no-ops and unify precedence (survivor-wins vs spec's outer-wins);
side-by-side construction examples (python has 0 non-dogfood); PRs
#236/#237/#238 await the merge word.
