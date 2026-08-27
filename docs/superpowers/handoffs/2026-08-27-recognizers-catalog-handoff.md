# Handoff — recognizers catalog (step 1b in flight) → link resolveRule via builders

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
  level → `717d13f19` singleton collapse → `aeae91d3a` **recognizers catalog
  step 1**: `dsl/rule-patterns.ts` (list-patterns renamed into it;
  group-classify.ts and compiler/rule-catalog.ts folded in and deleted;
  `isEnumChoiceRule`/`isSpliceableBareSeq` out of types/rule.ts;
  `selfReferentialFoldOf` out of wrapper-deletion).
- **Also landed and pushed — step 1b `a65279942`:** enrich's private
  recognizers moved into the catalog (`exclusiveFieldChoiceBranches`,
  `normalizeMember`, `peelOptional`, `peelOptionalSeq`,
  `listSeparatorOfOptionalSeq`, `optionalStringLiteral`,
  `separatedListElementName`, `peelOptionalEitherSpelling`,
  `SeparatedListBodyInfo`, `separatedListBodyInfo`, `armLeadingSymbolName`,
  `armStartsWithSymbol`, `isLiteralChoiceContent`,
  `armsDifferOnlyByLiteralChoice`). Gated: src diff empty ×3, validator
  exact, suite green except the two `examples/01` WIP cases, tsc baseline.
  Step 1 of the recognizers spec is complete; only the two constructing
  enrich passes (`distributeExclusiveFieldChoices`,
  `appendTrailingMemberToOptionalSeq`) remain in enrich, deliberately.
- **Gate recipe for every step from here:** regen all three grammars
  separately, `git diff --stat packages/*/src` must be EMPTY, `validate
  history` exact (rust 146/146·208/208·134/137·1519/1519, ts
  142/143·194/194·112/114·1202/1202, py 122/122·142/142·115/116·1385/1390),
  `pnpm test` green except the two `examples/01` WIP cases, `pnpm run
  type-check` = 49 + the user's 6 WIP. Commit by pathspec
  (`--pathspec-from-file`; zsh does not split `$VAR`) and push. If any gate
  moved, it is a finding — do not adapt.
- **User WIP, never commit:** `TODO.md`, `examples/01-construct-nodes.ts`,
  `examples/18-dogfood-typescript-strict.ts`, `tsconfig.json`,
  `packages/tools/validation-report.json`. They were found STAGED once —
  `git restore --staged` them before any commit.

## Then: step 2 — link's `resolveRule` through the builders

Spec section "Sequencing" in the recognizers spec. Link's TOKEN / ALIAS /
PREC cases push facts down (`tokenized`/`immediate`, `aliasedFrom`, prec);
`stampStaticRenderAs` replaces nodes and loses `tokenized`. Route them
through `attributeBuilder.token/tokenImmediate/alias/prec` so the fact is
a constructor parameter. Wire wrapper-deletion's TOKEN case (left
structural because `collect-slots`' `AssembledToken` reads `.immediate`
off the wrapper node) at the same time. Byte-identical gate. Then step 3:
separator lift into `seq`.

## Tooling that works here

- LSP edits: `node /Users/pmouli/GitHub.nosync/active/ts/lspeasy/apps/cli/dist/cli.js
  --no-proxy --server "/usr/local/bin/tsgo --lsp --stdio" --root <sittir>
  --wait 60000 [--dry-run] textDocument rename <ABS file> <line:col> <new>` and
  `workspace willRenameFiles --params '{"files":[{"oldUri":"file://…","newUri":"file://…"}]}'`
  (then `git mv`). `typescript-language-server` cannot run: the repo's
  TypeScript is 7.0.2 (no tsserver.js). `npx @lspeasy/cli` is broken. `tsc`
  IS tsgo here.
- `SITTIR_TRACE=<kind,…> … gen …` dumps a rule after every phase.
- Code search: infigraph `search` / `search_code` (`pattern`, regex), never
  python scripts for search. Python only to parse tool output.
- Pre-commit hooks read the WORKING TREE; a docs-only commit while codegen
  edits are in flight needs `--no-verify`.

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
