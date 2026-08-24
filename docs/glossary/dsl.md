# `packages/codegen/src/dsl` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `getEnrichClauseGroups` (`packages/codegen/src/dsl/enrich.ts:314`)

```text
/**
 * Extract the set of enrich-hoisted clause-group names from an enriched grammar
 * result. Returns an empty set when the grammar was not enriched or no clause
 * groups were synthesized.
 */
```

### `getEnrichClauseGroupOwners` (`packages/codegen/src/dsl/enrich.ts:337`)

```text
/**
 * Extract the synthesized-name → owning-parent-kind map from an enriched
 * grammar result. Returns an empty map when the grammar was not enriched or
 * no clause groups were synthesized.
 */
```

### `getEnrichVisibleGroupSources` (`packages/codegen/src/dsl/enrich.ts:356`)

```text
/**
 * Extract the hidden source names behind visible-group mints from an
 * enriched grammar result. Wire filters these OUT of the grammar's final
 * `inline:` list before it reaches tree-sitter: an inlined source rule is
 * erased during tree-sitter's inline processing, which vaporizes the alias
 * (and the minted kind's parser identity) while sittir's IR still models
 * the kind — the phantom-kind divergence. Un-inlining the source keeps the
 * mint real on both sides.
 */
```

### `extractSupertypeNames` (`packages/codegen/src/dsl/enrich.ts:447`)

```text
/**
 * @internal — pull the declared-supertype name set out of the base
 * grammar. Handles both the `{ grammar: { supertypes: $ => [...] } }`
 * wrapped form and the bare `{ supertypes: $ => [...] }` form. Returns
 * names WITH their leading underscore so callers can test
 * `supertypeNames.has('_expression')` and still strip the prefix when
 * composing the field name.
 */
```

### `extractWordName` (`packages/codegen/src/dsl/enrich.ts:492`)

```text
/**
 * Resolve the grammar's `word` declaration to a rule NAME across both
 * runtimes. Under sittir's grammarFn it is already a string; in the emitted
 * `.sittir/grammar.js` (which runs enrich BEFORE tree-sitter's native
 * `grammar()`) it is still the raw `$ => $.identifier` callback — invoke it
 * with the same symbol-shaped proxy `extractSupertypeNames` uses and take
 * the returned symbol's name. Returns null when absent/unresolvable (the
 * word matcher then falls back via matchesWordShape).
 */
```

### `harvestSupertypeNames` (`packages/codegen/src/dsl/enrich.ts:522`)

```text
/**
 * @internal — extract supertype names from a result array. Accepts both
 * `[{name:'_expr'}, ...]` (SYMBOL-shaped) and `['_expr', ...]` (plain
 * strings). Returns names WITH the leading underscore so callers can
 * test membership and still strip the prefix when composing the field
 * name.
 */
```

### `nativeRuleFn` (`packages/codegen/src/dsl/enrich.ts:547`)

```text
/** Fetch a runtime-injected DSL rule constructor from `globalThis`, or throw.
 *  enrich runs inside `grammar(enrich(base), …)`, which executes under an
 *  injected DSL runtime — sittir's lowercase constructors during evaluate.ts,
 *  tree-sitter's uppercase ones during CLI generation. Calling the injected fn
 *  directly produces a rule in the active runtime's case with no hand-rolled
 *  detection, and inherits the runtime's construction semantics (content
 *  normalization, `_ref.fieldName` stamping). A missing global means enrich
 *  was called outside any runtime — a unit test that forgot `installFakeDsl()`.
 *
 *  Accepts alternate names because the two runtimes don't agree on every
 *  constructor's name: the symbol constructor is `symbol` under sittir but
 *  `sym` under tree-sitter's CLI. The first name found wins.
 *
 *  Exported so other DSL-phase modules (e.g. `dsl/transform/transform.ts`'s
 *  polymorph alias-node mint sites) can route construction through the same
 *  runtime-injected constructors instead of hand-rolling rule literals — see
 *  `makeGroupLiftSymbol`/`makeVisibleGroupAlias` below for the canonical
 *  call pattern. */
```

### `makeField` (`packages/codegen/src/dsl/enrich.ts:576`)

```text
/** Wrap `content` in a FIELD via the injected `field()` constructor. The
 *  runtime fn normalizes the content and stamps `fieldName` on inner symbol
 *  refs (subsuming the former hand-rolled `propagateFieldName`); we add
 *  enrich's `fieldSource` marker (opaque `metadata` bag — debt PR-P1) so
 *  downstream passes recognize the promotion as enrich-originated rather
 *  than author-written. */
```

### `registerKwRule` (`packages/codegen/src/dsl/enrich.ts:594`)

```text
/**
 * Register a `_kw_<fieldName>` hidden rule whose body is
 * `prec.left(1, stringLiteral)`. Idempotent — multiple positions that
 * promote the same keyword register the same body once.
 *
 * Returns a SYMBOL reference (in the active runtime's case, via the injected
 * `symbol()` constructor) that the caller embeds inside the new FIELD wrapper.
 */
```

### `collectFieldNamesRuntime` (`packages/codegen/src/dsl/enrich.ts:626`)

```text
/** Collect field names that already exist on the top-level seq. */
```

### `peelOptional` (`packages/codegen/src/dsl/enrich.ts:648`)

```text
/**
 * Detect `optional(content)` across both runtimes:
 * - sittir:      `{ type: 'OPTIONAL', content }`
 * - tree-sitter: `{ type: 'CHOICE', members: [content, {BLANK}] }`
 */
```

### `isBareShapeTarget` (`packages/codegen/src/dsl/enrich.ts:695`)

```text
/**
 * @internal — true when `target` corresponds to Shape 1 (bare SYMBOL
 * at the seq position). Distinguishable by `target.symbolRule` being
 * `===` to the original `member`: bare-shape's wrap is identity, so the
 * detected symbol IS the seq-position rule itself. Used by the
 * supertype-prefixed guard in `applySymbolToField` —
 * see that function for the rationale.
 */
```

### `detectSymbolTarget` (`packages/codegen/src/dsl/enrich.ts:707`)

```text
/** @internal — detect which of the three shapes (bare / optional /
 *  optional-seq) the seq member is, and return a SymbolTarget that
 *  knows how to rebuild it once the inner SYMBOL is FIELD-wrapped.
 *  Returns null for any other shape (including multi-symbol seqs,
 *  optional(seq) with non-anon members, or non-symbol leaves). */
```

### `countSymbolsInRepeat` (`packages/codegen/src/dsl/enrich.ts:763`)

```text
/**
 * @internal Count symbols inside repeat/repeat1 wrappers. Used to
 * disqualify bare symbols whose kind also appears under a repeat.
 * Stops at field/alias boundaries.
 */
```

### `promoteInsideRepeatMembers` (`packages/codegen/src/dsl/enrich.ts:908`)

```text
/**
 * @internal — iterate outer-seq members and descend into any that are
 * `repeat(seq(...))` / `repeat1(seq(...))` (possibly prec-wrapped).
 * Applies the same field-promotion logic to bare symbols in the inner
 * seq. Returns the original array unchanged when no promotions fire.
 *
 * @param ruleName       - the parent rule name (for diagnostics)
 * @param members        - the outer seq's (possibly already-enriched) members
 * @param supertypeNames - declared supertype names for `_prefix` handling
 * @param existing       - mutable set of field names already claimed on
 *                         the parent seq (checked to prevent collisions)
 * @returns the same `members` array if nothing changed, or a new array
 *   with rebuilt repeat members
 */
```

### `tryPromoteInRepeatMember` (`packages/codegen/src/dsl/enrich.ts:940`)

```text
/**
 * @internal — given a single outer-seq member, check whether it is a
 * `repeat`/`repeat1` (possibly prec-wrapped) whose content is a `seq`.
 * If so, apply field-promotion to the inner seq's bare symbols.
 *
 * @returns the rebuilt member if any promotions fired, or `null` if
 *   the member was left unchanged.
 */
```

### `tryPromoteInRepeatSeq` (`packages/codegen/src/dsl/enrich.ts:1043`)

```text
/**
 * @internal — handle `repeat(seq(...))` / `repeat1(seq(...))` patterns
 * (possibly prec-wrapped) when the top-level rule is NOT itself a seq.
 *
 * Descends into the repeat's content, peeling any prec wrappers on
 * the inner rule. If the inner content is a seq, applies the same
 * per-member field-promotion logic as the top-level seq path:
 * `detectSymbolTarget` + uniqueness via `kindCounts` + claimed-name
 * via `collectFieldNamesRuntime` + `countSymbolsInRepeat` for further
 * nested repeats.
 *
 * @returns The rebuilt rule if any promotions fired; the original rule
 *   unchanged otherwise.
 */
```

### `peelPrec` (`packages/codegen/src/dsl/enrich.ts:1168`)

```text
/** @internal — strip any number of prec/prec.left/prec.right/prec.dynamic
 *  wrappers and return the innermost rule. Returns the input unchanged
 *  when no prec wrapper is present. */
```

### `canonicalStringifyClause` (`packages/codegen/src/dsl/enrich.ts:1328`)

```text
/**
 * @internal — canonical JSON stringify with sorted object keys. Ensures
 * that two structurally-equal rule bodies stringify identically even
 * when property insertion order differs between rule construction paths.
 * Mirrors the helper in auto-groups.ts (kept in sync, not shared yet —
 * DRY extraction is scheduled for Task 2.1).
 */
```

### `peelOptionalSeq` (`packages/codegen/src/dsl/enrich.ts:1370`)

```text
/**
 * @internal — peel an optional wrapper from a rule node. Returns the inner
 * seq content if the rule is `optional(seq)` (sittir form) or
 * `CHOICE[seq, BLANK]` (tree-sitter normalized form). Returns null if the
 * rule is not an optional-wrapping-a-seq pattern.
 *
 * Also returns the seq member and the index of the seq in the members array
 * (for CHOICE form) so callers can rebuild the CHOICE with a different member.
 */
```

### `listSeparatorOfOptionalSeq` (`packages/codegen/src/dsl/enrich.ts:1402`)

```text
/**
 * @internal — extract the list separator string from an `optional(seq(...))`
 * (or `CHOICE[seq,BLANK]`) whose seq body carries a separated-list repeat.
 * Returns the separator literal (e.g. `","`) or null when the member is not an
 * optional-seq containing a repeat.
 *
 * Handles both the raw tree-sitter form `repeat(seq(STRING sep, x))` (separator
 * not yet lifted — enrich runs pre-evaluate) and an already-lifted
 * `repeat(x, separator)`.
 */
```

### `optionalStringLiteral` (`packages/codegen/src/dsl/enrich.ts:1445`)

```text
/**
 * @internal — if `rule` is `optional(STRING)` / `CHOICE[STRING,BLANK]`, return
 * the string literal; else null. Recognizes a stranded trailing separator
 * member. Returns null for `optional(seq(...))` (inner is not a bare string),
 * so it never matches the list member itself.
 */
```

### `appendTrailingMemberToOptionalSeq` (`packages/codegen/src/dsl/enrich.ts:1459`)

```text
/**
 * @internal — fold a stranded trailing `optional(sep)` into the preceding
 * `optional(seq(...))`'s body. Appends `trailingOptional` as the last seq
 * member and rebuilds the optional wrapper (both `optional` and
 * `CHOICE[seq,BLANK]` forms, via rebuildOptional).
 */
```

### `absorbTrailingListSeparators` (`packages/codegen/src/dsl/enrich.ts:1473`)

```text
/**
 * @internal — pre-fold a seq's member list, pulling each separated-list's
 * stranded trailing `optional(sep)` INTO the preceding `optional(seq(...
 * repeat(sep) ...))`. Returns the rewritten member array, or null when nothing
 * folds (reference-preserving when no fold applies).
 *
 * Trigger: adjacent `[ optional(seq containing repeat(sep S)) , optional(S) ]`
 * where the trailing literal `S` equals the list's own separator. The
 * separator-match guard prevents swallowing an unrelated trailing optional
 * (e.g. `optional(';')` after a comma-separated list).
 *
 * Why here: tree-sitter authors write the canonical separated-list-with-trailing
 * either as `optional(seq(list, optional(sep)))` (already one unit — handled) or
 * as `seq(optional(list), optional(sep))` (python `argument_list`). This pass
 * canonicalizes the second form into the first BEFORE the group-lift below, so
 * the whole list (head + repeat + trailing) is captured as one group. Without
 * it the trailing separator strands as a standalone member → wrapper-deletion
 * makes it a phantom `nonterminal:true` slot, and for visible (inline-unsafe)
 * groups it is permanently split from its list across the AssembledGroup
 * boundary. evaluate's `liftCommaSep` then absorbs the folded `optional(sep)`
 * into the group's `repeat1` as `trailing: true`.
 */
```

### `applyClauseHoist` (`packages/codegen/src/dsl/enrich.ts:1513`)

```text
/**
 * @internal — walk `rule` and hoist any `optional(seq(STRING,FIELD…))` /
 * `CHOICE[seq(STRING,FIELD…),BLANK]` positions into hidden group rules.
 * Returns a (possibly rewritten) rule; never mutates the input.
 *
 * COUNTER DISCIPLINE: the `counter.opt` increments for EVERY `optional(seq)`
 * shape encountered in traversal order — both clause-seqs (which this pass
 * hoists) and non-clause-seqs (which applyAutoGroups hoists later). This
 * keeps the numbering in sync so the two passes never assign the same number
 * to different bodies within the same parent. applyAutoGroups resets its
 * own counter per-parent to 0 and counts from 1; after enrich, any position
 * where enrich hoisted is now `optional(SYMBOL)` — applyAutoGroups skips
 * those (not a seq) so its counter only increments for the non-clause
 * positions, which are the ones enrich skipped and left with their counter
 * slots intact.
 */
```

### `clusterSignatures` (`packages/codegen/src/dsl/enrich.ts:1879`)

```text
/**
 * Assign a stable cluster-id string to each value in `values`, where two
 * values get the SAME id iff `rulesEqual` (dsl/list-patterns.ts) says they're
 * structurally equal. Used as `diagnoseParseKindCollisions`'s
 * `structuralSignature` input — that function only needs values sharing a
 * signature to be groupable via `distinct()`, not a globally-canonical hash,
 * so an arbitrary-but-consistent per-call cluster index is sufficient and
 * avoids hand-rolling a serializer (DRY: reuses the existing, already
 * separator-shape-aware `rulesEqual` instead).
 *
 * @internal — exported for testing only.
 */
```

### `getEnrichUnaliasDiagnostics` (`packages/codegen/src/dsl/enrich.ts:1948`)

```text
/**
 * Extract the un-aliasing diagnostics `enrich()` attached to an enriched
 * grammar result (or a grammar object that inherited them, e.g. via
 * `grammarFn`). Returns an empty array when none were attached.
 */
```

### `collectUnaliasCandidates` (`packages/codegen/src/dsl/enrich.ts:1987`)

```text
/**
 * @internal — walk `node` collecting every ALIAS site and bare SYMBOL leaf,
 * resolving each to its referenced rule body via `rulesBag` for structural
 * comparison. Descent runs through `RuleWalker.childEdgesOf` — the ONE
 * canonical child-edge relation (`dsl/rule-walker.ts`) — so every edge the
 * project's walker knows about is covered automatically: SEQ/CHOICE members,
 * FIELD/OPTIONAL/REPEAT/REPEAT1/PREC/TOKEN content, AND a repeat's
 * `separator.value`. (The former hand-rolled descent here silently omitted
 * the separator and token-wrapper edges, so an alias in one of those
 * positions was invisible — a coverage gap and a second, incomplete rule-tree
 * edge relation alongside the canonical one.)
 *
 * Two node kinds get special handling BEFORE the generic descent:
 *   - ALIAS: recorded as a candidate; NOT descended into (its resolved body
 *     is looked up directly via `rulesBag` instead) — mirrors
 *     `applyClauseHoist`'s treatment of its own synthesized wrappers as
 *     opaque once classified.
 *   - SYMBOL: recorded as a candidate leaf (its own storage kind IS its parse
 *     kind); leaves have no edges so descent is a no-op regardless.
 *
 * FIELD additionally rebinds `slotKey` to the field's name for its subtree, so
 * a field-wrapped alias buckets under its enclosing field rather than merging
 * with a same-target alias in a sibling field.
 *
 * The bare `OPTIONAL` edge (absent from `applyClauseHoist`'s
 * `optional(seq(...))`-specific descent) is covered too: sittir's own evaluate
 * runtime produces bare `OPTIONAL` nodes (not always the tree-sitter-CLI-lowered
 * `CHOICE[x,BLANK]` form) before tree-sitter's `grammar()` runs, so a
 * base-grammar alias can sit directly under `optional(...)` at this phase —
 * and `childEdgesOf` descends its `content` edge.
 */
```

### `rewriteUnaliasAt` (`packages/codegen/src/dsl/enrich.ts:2059`)

```text
/**
 * @internal — replace the node at `path` (as recorded by
 * `collectUnaliasCandidates`, mirroring `RuleWalker.childEdgesOf`'s segments)
 * with `replacement`. Segments are `'members', <index>` (SEQ/CHOICE),
 * `'content'` (FIELD/OPTIONAL/REPEAT/REPEAT1/PREC/TOKEN), or
 * `'separator', 'value'` (a repeat's separator inner rule). The generic
 * single-property branch handles `content`/`separator`/`value` uniformly (an
 * object spread of the separator wrapper preserves its `trailing`/`leading`).
 */
```

### `applyUnaliasDistinct` (`packages/codegen/src/dsl/enrich.ts:2082`)

```text
/**
 * @internal — resolve `alias($.X, $.Y)` sites where `X`'s rule body is
 * structurally distinct from the other value(s) sharing parse kind `Y`
 * (a `parsekind-noninjective` collision), so each storage kind surfaces under
 * its own name at read time instead of being coerced onto a shared kind.
 *
 * Reuses `diagnoseParseKindCollisions` (the same decision function the
 * later, assemble-time check calls) fed by locally-computed storage/parse
 * kind facts — its comparison logic is phase-agnostic, so it is not
 * reimplemented here. Structurally-identical collisions (the common,
 * intentional case, e.g. multiple hidden rules aliased to one shared display
 * name) merge with no diagnostic, unchanged from `diagnoseParseKindCollisions`'s
 * existing behavior. Only genuinely-distinct collisions trigger a rewrite.
 * This is usually safe (a distinct-storage-kind collision makes read-time
 * dispatch non-injective regardless of author intent), but "distinct" here
 * is judged by `rulesEqual` over RAW, pre-simplify rule shapes — a shallower
 * notion than the assemble-time check's post-simplify/catalog-resolved
 * `structuralSignatureOfValue`/`canonicalRuleSignature` comparison, and the
 * two CAN disagree in principle. No rule name is special-cased here anymore
 * (the former `GRANULARITY_MISMATCH_EXCLUSIONS` python `_suite` carve-out was
 * removed in `cb44e218b` — both `_simple_statements`/`_newline` retargeted
 * cleanly with no live issue remaining, and python's baseline actually
 * improved 107→108).
 * The diagnostic is downgraded to non-blocking severity and kept only as an
 * audit trail of the auto-fix, not a build-blocking error.
 *
 * Per firing candidate, the fix branches on whether `X`'s OWN top-level rule
 * (`rulesBag[X]`) is hidden (leading `_`, tree-sitter/sittir convention) or
 * visible:
 *   - visible → DROP the alias at this site (`alias($.X, $.Y)` → bare `$.X`),
 *     unchanged from this pass's original behavior — `X` already produces an
 *     independent named CST node once un-aliased.
 *   - hidden → RETARGET the alias at this site, from `alias($.X, $.Y)` to
 *     `alias($.X, $.<X-without-leading-underscore>)`. A hidden rule produces
 *     no CST node of its own if merely un-aliased (tree-sitter inlines its
 *     raw content wherever referenced) — aliasing IS the standard mechanism
 *     for giving a hidden rule independent visibility, so retargeting to a
 *     non-colliding name keeps it visible instead of dropping visibility
 *     altogether. Guarded: if the stripped name already exists as a rule
 *     (`rulesBag`/`kwRules`/`clauseGroupRules`), do NOT retarget — leave this
 *     specific candidate's alias untouched and do not downgrade its
 *     diagnostic (stays at original `error` severity, still-blocking, same as
 *     if this pass declined to act).
 *
 * Strictly single-site: only the rule passed in is inspected/rewritten — no
 * cross-rule sweep. Other occurrences of the same `alias($.X, $.Y)` pair in
 * sibling top-level rules are untouched by this call (each such rule gets its
 * own independent call from `applyEnrichPasses`, and is fixed only if ITS OWN
 * local bucket independently diagnoses a collision).
 */
```

### `clauseHoistSynthName` (`packages/codegen/src/dsl/enrich.ts:2283`)

```text
/**
 * @internal — get or create the synthesized hidden-rule name for a given
 * clause-seq body. Increments the per-parent counter and injects the seq
 * into `clauseGroupRules` on first encounter; dedupes across parents via
 * `dedupeMap`.
 *
 * Returns `null` when the synthesized name would collide with an existing
 * rule in `rulesBag` (already-authored rule with the same name). A stderr
 * notice is emitted in that case. The counter is incremented BEFORE the
 * collision check so the ordinal-position invariant with applyAutoGroups
 * is maintained even when a collision prevents hoisting.
 */
```

### `visibleGroupSynthName` (`packages/codegen/src/dsl/enrich.ts:2329`)

```text
/**
 * @internal — mint the hidden-rule + visible-alias name pair for an inline-UNSAFE
 * seq body that enrich surfaces as a VISIBLE CST kind.
 *
 * Unlike the prior content-alias approach (which aliased the multi-member seq
 * DIRECTLY — `alias(SEQ(...), $.name)`, which tree-sitter DISTRIBUTES across the
 * seq's members, scattering empty leaves), this registers a HIDDEN rule whose
 * body is the seq, exactly like the inline-safe clause-hoist path
 * (`clauseHoistSynthName`). The caller then references that hidden rule via a
 * symbol and wraps the symbol in `alias($._<name>, $.<name>)` so tree-sitter has
 * a single symbol-node to rename into ONE clean CST node.
 *
 * Naming:
 *   - hidden rule  = `_<parent>_group<N>` (registered in `clauseGroupRules`)
 *   - visible alias = `<parent>_group<N>` (the same name without the `_`)
 * Per-parent 1-indexed `grp` counter; cross-parent dedupe via
 * `canonicalStringifyClause`. Returns `null` on a name collision with an existing
 * rule in `rulesBag` (caller leaves the body inline).
 *
 * The visible name must NOT carry a leading `_` (tree-sitter would classify it
 * HIDDEN → the minted kind's slot is dropped at wrap/read), so `parentKind`'s
 * own leading `_` is stripped before composing the base name.
 */
```

### `promoteExistingHiddenRuleName` (`packages/codegen/src/dsl/enrich.ts:2393`)

```text
/**
 * PR 3 (2026-07-21 union-slot design): promote an EXISTING hidden rule to a
 * visible group alias without duplicating its body ("mint = promote, not
 * synthesize" — the arm is already a bare `symbol(existingHiddenName)` ref;
 * the hidden rule just needs a friendly visible name). Dedupe key is the
 * hidden name itself (the rule IS the identity here, unlike
 * `visibleGroupSynthName`'s anonymous-body dedupe by content stringify).
 * Shares the SAME per-parent `grp` counter as `visibleGroupSynthName`, so
 * every choice-arm mint for a given parent gets a unique `_<parent>_group<N>`
 * name in traversal order, regardless of which of the two mint paths minted
 * it.
 */
```

### `armLeadingSymbolName` (`packages/codegen/src/dsl/enrich.ts:2454`)

```text
/**
 * PR 3 (2026-07-21 union-slot design) — narrowing guard: true when `arm`'s
 * LEFTMOST reachable position (descending through SEQ's first member,
 * every CHOICE member, and single-content wrappers — the same shape a
 * parser's FIRST-set walk would follow) references one of `siblingNames`.
 * Guards against minting a choice arm that is structurally a RECURSIVE
 * extension of a SIBLING arm in the same choice rather than an
 * independent alternative — e.g. python's `expression_statement`:
 * arm 0 is the bare `$.expression`; arm 1 is `seq(commaSep1($.expression),
 * optional(','))`, which itself STARTS with `$.expression`. Minting arm 1
 * into its own hidden rule creates a second grammar production sharing
 * arm 0's leading symbol — an unresolvable tree-sitter LR conflict, not a
 * cosmetic one (confirmed: no `conflicts:` declaration or rename
 * resolves it, since it's a genuine shared-prefix ambiguity between two
 * live productions). Skipping the mint here leaves the arm exactly as
 * enrich found it — whatever OTHER mechanism (variant()/polymorphs in
 * this grammar's own grammar.sittir.ts, same as before PR 3) already handles
 * it keeps doing so, unimpeded.
 */
```

### `armStartsWithSymbol` (`packages/codegen/src/dsl/enrich.ts:2512`)

```text
/**
 * PR 3 (2026-07-21 union-slot design) — narrowing guard: true when `arm`'s
 * leading symbol (armLeadingSymbolName) is shared by another arm in the
 * same choice (per `collidingLeadingNames`, precomputed once per choice —
 * see the CHOICE branch of applyClauseHoist). Guards against minting a
 * choice arm that structurally shares its PREFIX with a sibling arm —
 * two exemplars, both python: `expression_statement`'s bare `$.expression`
 * arm vs. its `seq(commaSep1($.expression), optional(','))` arm (both
 * lead with `expression`); `except_clause`'s "as" vs. "list" arms (both
 * lead with `field('value', expr)`'s `expression` reference). Minting
 * either half of such a pair creates a second grammar production sharing
 * the other's leading symbol — an unresolvable tree-sitter LR conflict
 * (confirmed: no `conflicts:` declaration or rename resolves it, since
 * it's a genuine shared-prefix ambiguity between two live productions).
 * Skipping the mint leaves BOTH arms exactly as enrich found them —
 * whatever OTHER mechanism (variant()/polymorphs in this grammar's own
 * grammar.sittir.ts, same as before PR 3) already handles them keeps doing
 * so, unimpeded.
 */
```

### `makeGroupLiftSymbol` (`packages/codegen/src/dsl/enrich.ts:2634`)

```text
/**
 * @internal — build a SYMBOL reference for a synthesized enrich group-lift
 * (clause hoist today; all `optional(seq)`/`repeat(seq)` once the hoist
 * generalizes). Built via the active runtime's injected symbol constructor
 * (see `nativeRuleFn`) rather than any hand-rolled shape — `referenceRule`
 * is unused by construction (both runtimes agree on the `SYMBOL`
 * discriminant; the shape distinction lives in WHICH constructor is
 * injected, not in the wrapper rule's own case) but kept in the signature
 * for call-site symmetry with the other `make*` helpers.
 *
 * Provenance markers (both now live inside the opaque `metadata` bag — debt
 * PR-P1; the former top-level `SymbolRule.source` field is deleted):
 *   - `metadata.author: 'enrich'` — the canonical marker (debt: source-
 *     homonym resolution, decision 6 — was `metadata.source: 'enrich'`).
 *     Path-descent (transform-path.ts) reads this to recognize an
 *     enrich-synthesized group-lift symbol and travel THROUGH it into the
 *     hoisted body, so authored `transform()`/`groups:` path patches that
 *     address into a now-hoisted seq still resolve.
 *   - `metadata.symbolSource: 'group-lift'` — relocated legacy marker (was
 *     the top-level `SymbolRule.source`). Diagnostics only.
 */
```

### `makeVisibleGroupAlias` (`packages/codegen/src/dsl/enrich.ts:2686`)

```text
/**
 * @internal — wrap a SYMBOL ref to an inline-UNSAFE group's HIDDEN rule in a
 * TAGGED visible alias so the group surfaces as a single clean CST kind.
 *
 * Shape (confirmed against generated grammar.json ALIAS nodes):
 *   `{ type: 'ALIAS', content: symbol($._<name>), named: true,
 *      value: '<name>', metadata: { author: 'enrich' } }`
 *
 * - The aliased thing is a SYMBOL ref to the hidden `_<name>` rule (NOT the raw
 *   multi-member seq). tree-sitter renames that ONE symbol-node into ONE visible
 *   CST node for `<name>` (a real kindId in parser.c). Aliasing the raw seq
 *   instead made tree-sitter DISTRIBUTE the alias name across the seq members.
 * - `metadata.author === 'enrich'` (debt: source-homonym resolution, decision
 *   6 — was `metadata.source === 'enrich'`) is REQUIRED for transform-path: it
 *   travels THROUGH this tag for authored path-patches
 *   (`dsl/transform/transform-path.ts`'s `isEnrichContentAlias` /
 *   `descendThroughEnrichContentAlias` — the sanctioned dsl-side reader,
 *   doctrine decision 3). (Debt PR-0c: `compiler/link.ts`'s
 *   `mintContentAliasKinds` no longer reads this tag — it identifies the
 *   same population structurally via `isClauseHoistVisibleGroupAlias`,
 *   keying on the alias's `optional`/`CHOICE[x,BLANK]` parent shape, the
 *   target name's absence from `rules`, and the hidden content symbol not
 *   being in the grammar's `inline:` list. The write here stays load-bearing
 *   for transform-path only.)
 * - Case is the active runtime's: built via the injected `alias()`/`symbol()`
 *   constructors, so sittir evaluate yields lowercase, tree-sitter CLI uppercase.
 */
```

### `ruleMatchesEmpty` (`packages/codegen/src/dsl/group-classify.ts:43`)

```text
/**
 * Conservative empty-matching predicate. Returns true iff the rule can produce
 * the empty string:
 *   - `optional` / `repeat` / `blank`                      → always matches empty
 *   - `repeat1`                                             → iff content matches empty
 *   - `seq`                                                 → iff ALL members match empty
 *   - `choice`                                              → iff ANY member matches empty
 *   - `field` / prec-wrapper                               → iff content matches empty
 *   - `string` / `symbol` / `token` / `pattern`            → false (non-empty)
 */
```

### `isPlainRepeatType` (`packages/codegen/src/dsl/group-classify.ts:92`)

```text
/** plain repeat (not repeat1). Duplicates `isPlainRepeatType` in
 *  runtime-shapes but keeps this module self-contained. */
```

### `collectSlots` (`packages/codegen/src/dsl/group-classify.ts:102`)

```text
/**
 * Collects the "slot" members of a seq body after dropping pure
 * literals/punctuation and `blank`. Descends transparently through `prec`
 * wrappers and `field` wrappers to find the underlying slot type.
 *
 * A "slot" is a member that contributes structured content — `field`,
 * `symbol`, `choice`, `repeat`, `repeat1`, `seq` (nested), or any non-literal
 * non-blank rule. Pure literals (`string`, `token`) and `blank` are dropped.
 */
```

### `unwrapPrec` (`packages/codegen/src/dsl/group-classify.ts:142`)

```text
/**
 * Unwrap `prec` wrappers to reach the underlying slot type. Descends through
 * a chain of prec layers only. Returns the innermost rule that is not a prec
 * wrapper.
 *
 * NOTE: we do NOT descend through `field` here because a `field` slot is
 * itself the thing we are classifying (it is field-typed → inline-safe). If
 * we descended through it we would see its content (e.g. a bare `choice`),
 * which would incorrectly mark the slot as unsafe.
 */
```

### `flattenSeqMembers` (`packages/codegen/src/dsl/group-classify.ts:169`)

```text
/**
 * Recursively inline the members of nested `seq` children into one flat list,
 * descending transparently through `prec` wrappers and nested `seq`s only. Does
 * NOT descend into `choice`/`field`/`optional`/`repeat` content — those are
 * opaque slots whose internals must not be flattened into the parent member list.
 */
```

### `seqHasTopLevelRepeat` (`packages/codegen/src/dsl/group-classify.ts:192`)

```text
/**
 * True iff the seq members contain a `repeat`/`repeat1` slot once nested seqs
 * are flattened (the hallmark of a list). `prec` wrappers are transparent.
 */
```

### `isNonterminalSeparatorType` (`packages/codegen/src/dsl/group-classify.ts:210`)

```text
/**
 * True iff a detected repeat separator itself varies per-instance: a
 * non-literal (`choice`/`symbol`/`pattern`) separator rule rather than a bare
 * `string` literal. A choice-of-separators (e.g. tree-sitter-typescript's
 * `sepBy1(choice(',', $._semicolon), X)`) or a symbol/pattern separator
 * (external-scanner-driven) means the concrete separator text can differ
 * per instance, so the list can't render from one fixed separator string —
 * the same signal `detectRepeatSeparator`'s existing callers
 * (`enrich.ts`'s `listSeparatorOfOptionalSeq`) already act on.
 */
```

### `repeatHasNonterminalSeparator` (`packages/codegen/src/dsl/group-classify.ts:224`)

```text
/**
 * True iff `repeatRule`'s own separator (per `detectRepeatSeparator` run on
 * its `content`) is non-literal — see `isNonterminalSeparatorType`.
 */
```

### `isOptionalSeparatorFlank` (`packages/codegen/src/dsl/group-classify.ts:236`)

```text
/**
 * True iff `member` is an `optional(STRING sep)` or `choice(STRING sep,
 * blank)` flank whose literal value equals `sepValue` — mirrors the shape
 * `absorbTrailingListSeparators`/`peelOptionalSeq` (enrich.ts) already
 * recognize for a stranded leading/trailing separator flank sibling to a
 * list's repeat (e.g. `commaSep1(E)`'s desugared
 * `seq(E, repeat(seq(SEP, E)), optional(SEP))`).
 */
```

### `repeatMemberHasGenuineSeparatorVariability` (`packages/codegen/src/dsl/group-classify.ts:277`)

```text
/**
 * True iff `repeatRule` (a top-level repeat member found among `siblings`,
 * the flattened seq member list it lives in) has genuine per-instance
 * separator variability: either its own separator is non-literal
 * (`repeatHasNonterminalSeparator`), or a SIBLING member in the same
 * flattened seq is an optional/choice-of-blank flank of that same separator
 * literal (a stranded leading/trailing comma). Either shape means the list
 * can't be rendered from one fixed separator string — it needs its own
 * visible `AssembledSeparatedList` template, not the hidden inline-flat
 * path.
 */
```

### `repeatHasGenuineSeparatorVariability` (`packages/codegen/src/dsl/group-classify.ts:301`)

```text
/**
 * True iff a BARE repeat/repeat1 body (not embedded in an enclosing seq) has
 * genuine separator variability. No sibling flank check applies here — a
 * bare repeat has no enclosing seq member list to hold a stranded flank —
 * so this reduces to the non-literal-separator check only.
 */
```

### `seqHasGenuineSeparatorVariability` (`packages/codegen/src/dsl/group-classify.ts:311`)

```text
/**
 * True iff `members` (post-flattening) contains EXACTLY ONE separator-
 * carrying top-level repeat/repeat1 member AND that one repeat has genuine
 * separator variability — see `repeatMemberHasGenuineSeparatorVariability`.
 *
 * Scoped to the single-SEPARATOR-CARRYING-repeat case deliberately: a seq
 * body representing a genuine separated list (`commaSep1(E)` and its
 * Task-1-confirmed real-world shape) has exactly ONE top-level repeat
 * carrying the list's separator. The census here only counts repeats whose
 * content itself has a `detectRepeatSeparator`-detectable separator shape —
 * a repeat with NO separator shape at all can neither BE the separated
 * list (it has nothing to flag as separator-variable) nor be the
 * unrelated-repeat this guard exists to protect against (there's no
 * separator to mis-match a sibling flank against). This matters for real
 * grammar shapes like rust's `enum_variant_list`/`field_declaration_list`/
 * `ordered_field_declaration_list`/`arguments`, whose per-element unit is
 * `seq(repeat($.attribute_item), X)` — a per-element MODIFIER repeat with no
 * separator of its own, which `flattenSeqMembers` surfaces as a second
 * top-level repeat alongside the real list's separator-carrying repeat. A
 * naive "exactly one repeat, of ANY shape" census (the original guard) saw
 * 2 repeats there and bailed, leaving these kinds un-promoted; scoping the
 * census to separator-carrying repeats only fixes that without reopening
 * the original decoy-repeat false positive (the decoy CHOICE-with-no-
 * string-arm test case still detects as separator-carrying via
 * `detectRepeatSeparator`, so it's still correctly counted and the guard
 * still declines to flag multi-separator-repeat compound seqs). A seq with
 * MULTIPLE separator-carrying top-level repeats remains a different,
 * compound shape outside this qualification's design intent — declining to
 * flag it reverts to the existing inline-flat floor behavior (safe by
 * construction, per this file's existing "cannot regress below floor"
 * convention) rather than risking a false-positive match.
 */
```

### `isInlineSafe` (`packages/codegen/src/dsl/group-classify.ts:360`)

```text
/**
 * Returns true iff the seq body is "inline-safe":
 *   - After dropping pure literals (`string`, `token`) and `blank` from the
 *     seq's direct members, exactly ONE slot remains.
 *   - That slot (after descending through `prec`/`field` transparently) is a
 *     `field` or `symbol` — NOT a bare `choice`, `repeat`, `repeat1`, `seq`,
 *     or any other multi-valued / compound type.
 *
 * Multi-slot or bare-choice bodies are "inline-unsafe" and require a visible
 * AssembledGroup template for correct rendering.
 *
 * @param seqBody — the rule to classify. Typically the body of an
 *   `optional(seq)` position, but may also be called with non-seq bodies
 *   (returns false for them).
 */
```

### `isSupertypeLike` (`packages/codegen/src/dsl/group-classify.ts:455`)

```text
/**
 * STRUCTURAL supertype test: true iff the rule body is a dispatch union —
 * a bare `choice` whose every arm reduces (through prec wrappers only) to a
 * plain symbol ref. Such a rule contributes no structure of its own: at
 * parse time exactly one arm's node materializes and the hidden rule
 * splices away, so wrapping it in a mint alias inserts a CST node level
 * into every position the union appears in AND severs the wrap layer's
 * concrete-kind expansion (keyed on `modelType === 'supertype'`) — the
 * failure class that took python to 0/115 when `_compound_statement` was
 * wrapped.
 *
 * Deliberately SHAPE-ONLY (string type tags via runtime-shapes, no
 * constructor stamps, no name conventions, no provenance registries): the
 * result must be identical under sittir's runtime and tree-sitter's CLI
 * runtime, or the two sides mint divergently (the
 * `_expression_statement_block_ending` phantom: sittir's transparent
 * `prec()` exposed a bare SYMBOL arm that minted, while the CLI saw
 * `PREC(SYMBOL)` and never minted — the IR then modeled a kind the parser
 * never produces).
 *
 * Distinct from the DECLARED-supertype gate (`counter.supertypeNames`),
 * which stays: declaration is authoritative where present; this predicate
 * covers the undeclared unions (`_expression_ending_with_block`,
 * `_expression_except_range`, …) that are supertypes in every structural
 * sense except the grammar's `supertypes:` array.
 */
```


### `isPermutationChoice` (`packages/codegen/src/dsl/group-classify.ts`)

A choice whose arms are permutations of one modifier-slot set — every arm is
a seq of singular atoms (optional-or-required keyword literals, marker
fields, or symbol refs), and all arms carry the SAME atom set, differing only
in ordering/optionality. Splitting such arms into kinds would mint identity
for pure modifier ceremony (the permutable-modifiers row of the
split-justification taxonomy: structural delta ⇒ kind, literal-only delta ⇒
enum slot, permutable modifiers ⇒ marker slots). Callers (`applyClauseHoist`'s
CHOICE branch and `mintStructuredChoiceArm`) decline the arm mint and let the
parent's own slots absorb the markers; `promotePermutationArmKeywords`
(enrich) then normalizes required raw keyword steps to the shared
`field('<kw>_marker', $._kw_*)` spelling so the arms' slots merge.

Atom identity: a generated `<literal>_marker` field collapses to its literal
(the keyword-promotion spelling of the same fact), while any OTHER authored
field name is slot identity and stays in the key — reordered same-named
fields are a permutation, differing field sets are alternatives. The
`kwRules` bag resolves `_kw_*` refs so a promoted keyword in one arm keys
equal to its raw spelling in a sibling. `public_field_definition`'s modifier
positions are the exemplar; the byte-identity of the other two grammars under
the decline is the conservatism gate.

### `permutationArmSlotKeys` / `permutationAtomKey` / `resolveRuleLiteral` (`packages/codegen/src/dsl/group-classify.ts`)

Support for `isPermutationChoice`: per-arm atom-key sets (null = arm
ineligible — non-seq arm, <2 members, repeat/nested steps, duplicate keys,
non-word literals), the per-step identity key described above, and the
literal text of a keyword-shaped rule body (STRING, TOKEN- or prec-wrapped).

### `separatorFactsEqual` (`packages/codegen/src/dsl/list-patterns.ts:43`)

```text
/**
 * Structural equality for the nested separator fact
 * (`{value, trailing?, leading?}`, PR-S). The wrapper object itself has no
 * `.type` discriminant, so `rulesEqual` can't be called on it directly —
 * compare `trailing`/`leading` primitively and `value` (the inner Rule) via
 * `rulesEqual`.
 *
 * SSOT for this comparison: both `rulesEqual` below (repeat/repeat1 case) and
 * `normalize.ts`'s own `rulesEqual` (REPEAT case) delegate here instead of
 * `===`, which — post-PR-S — would compare object identity on a freshly
 * allocated wrapper per lift call rather than the separator's actual value.
 *
 * `rulesEqual(a.value, b.value)` runs on the separator's inner Rule, which is
 * always a terminal/simple rule (a literal string or a small choice/seq of
 * literals) even when this helper is reached post-wrapper-deletion (e.g. from
 * `rule-attrs.ts`'s `sharedArmAttrs`) — so it's safe despite `rulesEqual`'s own
 * "do NOT call after wrapper-deletion" doc note, which is about the STRUCTURAL
 * rule being compared, not this always-simple nested value.
 */
```

### `rulesEqual` (`packages/codegen/src/dsl/list-patterns.ts:67`)

```text
/**
 * Structural equality for rule trees. Limited to the rule shapes that exist
 * pre-link (no polymorph/supertype/terminal — those appear only after
 * Link). Used by the commaSep1 lift to verify a seq's standalone element
 * matches the repeat's content. Lowers both sides' `type` before comparing
 * so this stays correct regardless of case (both runtimes agree on
 * UPPERCASE today, but the lower-both-sides comparison needs no update if
 * that ever changes).
 */
```

### `firstStringOfChoice` (`packages/codegen/src/dsl/list-patterns.ts:153`)

```text
/**
 * Extract the first string literal from a choice rule, if any.
 *
 * Handles the choice-of-separators pattern (e.g. tree-sitter-typescript's
 * `sepBy1(choice(',', $._semicolon), X)`): the separator position is a choice
 * of a literal and an external symbol. The first string member is the
 * canonical render-side separator; parse still accepts either form.
 */
```

### `detectRepeatSeparator` (`packages/codegen/src/dsl/list-patterns.ts:168`)

```text
/**
 * Detect the `seq(SEP, X)` / `seq(X, SEP)` separated-list shape inside a
 * repeat/repeat1 content body, where `SEP` is a string literal or a choice
 * whose arms may include non-literal (symbol/external-scanner) members —
 * not just a choice-of-literals. Returns the non-separator content, the FULL
 * detected separator rule (a `StringRule` for the literal case, the whole
 * `ChoiceRule` for a choice-shaped one — no longer narrowed to its first arm,
 * PR-S, and no longer required to contain a string arm at all), and whether
 * the separator was trailing (`seq(X, SEP)`); or `null` when no separator
 * shape is present.
 *
 * Callers that need a literal string out of a returned CHOICE separator
 * (e.g. `enrich.ts`'s `listSeparatorOfOptionalSeq`) must handle the
 * no-string-arm case themselves — `firstStringOfChoice` returns `null` for
 * an all-symbol choice, which is not the same as "no separator shape here".
 *
 * Pure: reports the shape; the caller decides whether to lift it onto a
 * `repeat` (link) or read it for group creation (enrich).
 */
```

### `withAttrsFrom` (`packages/codegen/src/dsl/rule-attrs.ts:16`)

```text
/**
 * Transfer slot-identity attributes from a discarded wrapper node onto the
 * survivor. Only absent attributes are transferred (`hasOwnProperty` guard
 * means the survivor's own values always win). This ensures:
 *   - `fieldName` / `multiplicity` / `separator` — slot-classification attrs
 *   - `id` — rule identity, so `slotByRuleId` resolves against the wrapper's
 *     pre-simplification id rather than degrading to fragile name fallbacks.
 *
 * Non-overriding: a passed-through inner node keeps its own id; only a
 * freshly-rebuilt structural node (`{ type:'CHOICE', members }`) gets the
 * source id stamped.
 */
```

### `armsOf` (`packages/codegen/src/dsl/rule-attrs.ts:91`)

```text
/** The arms of a choice (`members`); `[]` otherwise. */
```

### `makeRuleMetadata` (`packages/codegen/src/dsl/rule-metadata.ts:102`)

```text
/** Construct opaque rule metadata from the real shape — the single write seam. */
```

### `readRuleMetadata` (`packages/codegen/src/dsl/rule-metadata.ts:107`)

```text
/**
 * Read opaque rule metadata back as the real shape. Sanctioned callers only
 * (see module header) — never call from compiler logic or an emitter's
 * branching path.
 *
 * Accepts `unknown` (not just `RuleMetadata`) as input: hand-constructed test
 * fixtures and some dsl-layer boundary shapes (`FieldLike`/`RuntimeRule`,
 * types/runtime-shapes.ts) carry `metadata` typed loosely — the read seam
 * itself is still the single sanctioned place the real shape is exposed, so
 * widening the input type here doesn't loosen the opacity contract on
 * `RuleBase.metadata` (which stays `RuleMetadata`, unreadable without this
 * function regardless of caller layer).
 */
```

### `normalizeEnumMembers` (`packages/codegen/src/dsl/rule-metadata.ts:124`)

```text
/**
 * Normalize a closed literal set to the canonical rule shape.
 *
 * (Relocated from `types/rule.ts` — debt PR-P1: it constructs the
 * `metadata` bag via `makeRuleMetadata`, which `types/` cannot import.)
 *
 * Multi-member sets remain a ChoiceRule (enum-shaped). A single literal
 * collapses to that StringRule so downstream phases classify it as the
 * corresponding keyword/token instead of carrying a degenerate enum shape.
 *
 * (debt: source-homonym resolution, decision 6) Callers pass EITHER
 * `author` (evaluate's grammar-authored-literal-set callers) OR
 * `classifiedBy` (link's enum-promotion classifier) — never both; they are
 * different facts (who wrote the text vs. whether the ENUM classification
 * was declared or inferred), so they are separate optional fields rather
 * than one overloaded `source` value.
 */
```

### `combineMultiplicity` (`packages/codegen/src/dsl/rule-transforms.ts:83`)

```text
/**
 * Combine an OUTER multiplicity (pushed down from an enclosing wrapper) with
 * a leaf's own INNER multiplicity into the effective slot multiplicity.
 *
 * `undefined` means "single / exactly one". The lattice:
 *   - nothing pushed (`outer === undefined`) → keep `inner`.
 *   - either side is a collection (array / nonEmptyArray) → the result is a
 *     collection. It is `nonEmptyArray` only when BOTH sides guarantee ≥1
 *     element (a side guarantees ≥1 iff it is single (`undefined`) or
 *     `nonEmptyArray`); otherwise `array` (allows empty).
 *   - neither is a collection → `optional` if either is optional, else single.
 *
 * Examples (the cases this fixes):
 *   combine('nonEmptyArray', undefined)  → 'nonEmptyArray'  (type_arguments union: ≥1)
 *   combine('nonEmptyArray', 'optional') → 'array'          (trait_bounds: 0-or-more)
 *   combine('array', 'optional')         → 'array'
 *   combine('optional', 'optional')      → 'optional'
 *
 * This replaces the prior "outer wins unless inner is already an array" rule,
 * which clobbered an inner `optional` with the outer `nonEmptyArray` and
 * produced `NonEmptyArray<T>` where the runtime slot is 0-or-more.
 *
 * Moved from rule-attrs.ts (origin: rule-attrs.ts:70).
 */
```

### `extractRepeatShape` (`packages/codegen/src/dsl/rule-transforms.ts:162`)

```text
/**
 * Unwrap structural wrappers around a repeat / repeat1 so the caller
 * can detect `optional(repeat(...))`, `group(repeat1(...))`, etc.
 * Returns `null` for anything that isn't ultimately a repeat shape.
 *
 * Moved from simplify.ts (origin: simplify.ts:1164).
 */
```

### `pushAttrsToLeaves` (`packages/codegen/src/dsl/rule-transforms.ts:185`)

```text
/**
 * Stamp `multiplicity` / `separator` / `fieldName` onto the slot-bearing
 * leaves of a (wrapper-free) rule body. Structural nodes are descended;
 * leaves are stamped. An existing array / nonEmptyArray multiplicity on a
 * leaf is preserved (it is already at least as multi as the pushed value).
 * `fieldName` is only applied to a leaf that has no field name yet.
 *
 * Moved from simplify.ts (origin: simplify.ts:1101). Was file-local; now exported.
 */
```

### `inlineRefs` (`packages/codegen/src/dsl/rule-transforms.ts:264`)

```text
/**
 * Inline hidden symbol references by substituting their content. Two inlining
 * paths are applied in priority order:
 *
 *  1. GROUP / MULTI path (existing): hidden group rules (seq-with-fields) and
 *     hidden multi helpers (repeat / repeat1 wrappers) are always inlined so
 *     the referrer's field walker sees the fields / multi-slot directly.
 *
 *  2. grammar.inline path (new): hidden symbol refs whose target appears in the
 *     grammar's `inline:` array are inlined unconditionally — these are
 *     helpers tree-sitter itself expands at parse time (e.g., auto-synthesized
 *     `_type_arguments_repeat1` from applyAutoGroups). Sittir's derivation
 *     view must match what tree-sitter produces: if the parser inlines a helper,
 *     the simplified rule must too. References with `source === 'group-lift'` are
 *     still inlined when `inlineKinds` contains the target — the group-lift guard
 *     only applies to the group/multi path (where the assemble-side AssembledGroup
 *     should materialise as its own node rather than being collapsed away).
 *
 * Cycle-safe via visited set.
 */
```

### `resolveGroupOrMultiInlineTarget` (`packages/codegen/src/dsl/rule-transforms.ts:393`)

```text
/**
 * Return the rule to inline for a hidden symbol target, or `null` if the
 * target should not be inlined. Two target shapes are inlined:
 *  - Hidden GROUP rules (`target.type === 'GROUP'`): inline the group's
 *    `content` (the seq-with-fields) so the referrer's field walker
 *    sees the fields directly.
 *  - Hidden MULTI helpers (body unwraps to a `repeat` / `repeat1`):
 *    inline the whole target rule so the wrapper survives and the
 *    walker marks the child slot as multi-valued.
 * All other hidden rules stay as-is — they are distinct structural
 * nodes or dispatch points.
 */
```

### `reapplyInlinedLeafAttrs` (`packages/codegen/src/dsl/rule-transforms.ts:412`)

```text
/**
 * Re-apply a referring symbol's pushed-down leaf attributes onto the body
 * that replaced it during inlining.
 *
 * wrapper-deletion collapses modifier wrappers onto the innermost leaf
 * (e.g. `repeat1(SYMBOL(_x_repeat1))` → `SYMBOL{multiplicity:'nonEmptyArray',
 * separator}`). When `inlineRefs` substitutes that symbol with its target
 * body, the attributes on the symbol would be lost — collapsing a
 * multi-valued slot to singular and dropping the separator. We reconstruct
 * the equivalent modifier wrapper around the inlined body and re-run the
 * idempotent `deleteWrapper`, which re-pushes the attributes onto the
 * inlined body's leaves using the same "outer wins" rule wrapper-deletion
 * applied originally.
 *
 * The attributes are pushed onto the inlined body's *leaves* (symbols /
 * fields / terminals), not onto an enclosing seq node. A seq-level
 * multiplicity would be lost when `canonicalizeSeqOfLeaves` flattens the
 * inlined seq into its parent; leaf-level multiplicity survives flattening
 * and is what `deriveSlots` reads. Stamping descends through structural
 * nodes (seq / choice / group / variant / clause / token / alias) and stops
 * at leaves, where it sets the multiplicity (a leaf that is already
 * multi-valued keeps its stronger array/nonEmptyArray) and separator.
 *
 * No-op when the referring symbol carries no non-default leaf attributes.
 */
```

### `sameSlotShape` (`packages/codegen/src/dsl/rule-transforms.ts:467`)

```text
/**
 * Structural identity of two slot-bearing rules ignoring leaf attributes
 * (multiplicity / separator / fieldName / aliasedFrom). Used to decide that a
 * head element and a repeat element are "the same list element".
 */
```

### `tryFusePair` (`packages/codegen/src/dsl/rule-transforms.ts:493`)

```text
/**
 * If `head` + `next` form a head+repeat list pair, return the fused multi
 * element; otherwise `null`.
 */
```

### `childEdgesOf` (`packages/codegen/src/dsl/rule-walker.ts:27`)

```text
/**
	 * THE canonical child-edge relation WITH the property path to reach each
	 * child — single source of truth for both "what are this rule's children"
	 * and "how do I address one for a targeted rewrite". Edges: `members`
	 * (seq/choice) at `['members', i]`, `content` (wrappers/variant/group/
	 * token/alias) at `['content']`, and the stamped separator rule (the
	 * nested `separator.value` — a single `Rule`, PR-S) at
	 * `['separator', 'value']` (`trailing`/`leading` live alongside it on the
	 * wrapper object but aren't rule-tree edges). Leaves return [].
	 * `childrenOf` derives from this so there is exactly ONE edge relation;
	 * path-aware callers (e.g. enrich's un-aliasing rewrite) walk the edges
	 * directly to record a rewrite path without maintaining a second,
	 * possibly-incomplete descent of their own.
	 */
```

### `childrenOf` (`packages/codegen/src/dsl/rule-walker.ts:54`)

```text
/**
	 * THE canonical child-edge relation — single source of truth for "what
	 * are this rule's children" (see `childEdgesOf` for the edge/path detail).
	 * map, fold, find, foldDeep, and findDeep all use this relation
	 * identically — no narrower traversal exists.
	 */
```

### `map` (`packages/codegen/src/dsl/rule-walker.ts:64`)

```text
/**
	 * Bottom-up rebuild. Applies `visit` to each child's mapped result, then
	 * rebuilds this node ONLY if a child changed. Returns the SAME reference
	 * when nothing changed — load-bearing for fixpoint loops that compare
	 * `r === before` (enrich). Each edge (`members`, `content`, separator)
	 * tracks its own change independently, so an untouched sibling edge keeps
	 * its exact input reference even when another edge on the same node is
	 * rebuilt. Rebuilds via the SAME `childrenOf` edge relation `fold`/`find`
	 * use.
	 */
```

### `fold` (`packages/codegen/src/dsl/rule-walker.ts:108`)

```text
/** Pre-order accumulate: visits `rule` itself, then descends childrenOf. */
```

### `find` (`packages/codegen/src/dsl/rule-walker.ts:115`)

```text
/** Pre-order search: tests `rule` itself, short-circuits on first match. */
```

### `deref` (`packages/codegen/src/dsl/rule-walker.ts:125`)

```text
/** One-step SYMBOL resolve through the bound rules map. */
```

### `foldDeep` (`packages/codegen/src/dsl/rule-walker.ts:134`)

```text
/**
	 * fold that additionally descends THROUGH symbol refs (cycle-safe). Each
	 * reachable rule node is visited at most once per invocation (seen-set
	 * keyed on node identity); symbol refs are followed through the bound
	 * rules map.
	 */
```

### `findDeep` (`packages/codegen/src/dsl/rule-walker.ts:156`)

```text
/**
	 * find that additionally descends THROUGH symbol refs (cycle-safe). Each
	 * reachable rule node is visited at most once per invocation (seen-set
	 * keyed on node identity); symbol refs are followed through the bound
	 * rules map.
	 */
```

### `AuthoringField` (`packages/codegen/src/dsl/dsl-authoring.ts:35`)

```text
/** 1-arg → transform placeholder; 2-arg → a grammar-shapes `FieldRule` (rule body). */
```

### `AuthoringAlias` (`packages/codegen/src/dsl/dsl-authoring.ts:42`)

```text
/** 1-arg string → transform placeholder; 1/2-arg rule → a grammar-shapes `AliasRule`. */
```

### `EnrichedGrammar` (`packages/codegen/src/dsl/enrich.ts:101`)

```text
/**
 * Type-level mirror of what `enrich()` does to the rules at runtime: each rule
 * is replaced by its post-enrich shape (`EnrichRule`). Applied to a flat
 * grammar-shape schema (`{ rules: {…} }`); other inputs (e.g. the internal
 * `GrammarResult` wrapper) pass through unchanged.
 */
```

### `name` (`packages/codegen/src/dsl/enrich.ts:606`)

```text
/** Raw symbol name (preserves any leading underscore for supertype detection). */
```

### `symbolRule` (`packages/codegen/src/dsl/enrich.ts:608`)

```text
/** The SYMBOL rule itself, used as the FIELD's content. */
```

### `wrap` (`packages/codegen/src/dsl/enrich.ts:610`)

```text
/** Rebuild the original seq-member rule around a freshly-built FIELD node. */
```

### `UnaliasDiagnosticSink` (`packages/codegen/src/dsl/enrich.ts:1707`)

```text
/** A per-`enrich()`-call sink for un-aliasing diagnostics — array + dedupe-by-key
 *  Set, mirroring the assemble-time check's shape but WITHOUT the module-global
 *  lifetime. Created fresh per invocation and attached to that call's result. */
```

### `UnaliasCandidate` (`packages/codegen/src/dsl/enrich.ts:1728`)

```text
/**
 * @internal — a single value contributing to a target-name bucket: either an
 * ALIAS site (`aliasSite` set, eligible to be dropped) or a bare SYMBOL
 * reference sharing the same target name (its own storage kind IS its parse
 * kind — never dropped, but must be counted so `diagnoseParseKindCollisions`
 * sees the full set of colliding storage kinds, matching the real base-grammar
 * shape `choice($.generic_type, alias($.generic_type_with_turbofish,
 * $.generic_type))` where the bare `$.generic_type` branch is what makes the
 * collision detectable at all).
 */
```

### `slotKey` (`packages/codegen/src/dsl/enrich.ts:1740`)

```text
/**
	 * Enclosing FIELD name, when this value sits (directly or transitively)
	 * inside a `field(name, …)` wrapper — otherwise `undefined` (positional).
	 * Two aliases sharing a `targetName` but living in DIFFERENT fields are
	 * genuinely distinguishable (the field name disambiguates the read-time
	 * slot), so the collision bucketing keys on `(slotKey ?? targetName,
	 * targetName)` rather than `targetName` alone. When `undefined` the
	 * effective key falls back to `targetName`, preserving the pre-slotKey
	 * behavior for positional (non-field-wrapped) collisions.
	 */
```

### `armLeadingSymbolName` (`packages/codegen/src/dsl/enrich.ts:2058`)

```text
/**
 * PR 3 (2026-07-21 union-slot design): classify a bare choice-arm position
 * (unnamed — no field wrapper) and, if it is STRUCTURED (multi-slot, or a
 * symbol ref to a hidden rule whose own body is multi-slot), mint it a kind
 * identity so it can join the union-slot routing (`collect-slots.ts`'s
 * `partitionChoiceArms`) as a distinguishable member. Returns `null` when no
 * mint is needed (the arm is already a fine union member as-is — a plain
 * reference, or a single-slot body that collapses cleanly) or when minting
 * collided with an existing rule name (caller keeps the arm unchanged,
 * matching every other collision-guard in this file — no partial synthesis).
 *
 * Two cases, per the design's "mint = promote, not synthesize" distinction:
 *   - The arm is a bare `symbol(name)` ref to an EXISTING hidden rule whose
 *     body is structured — promote that rule directly (no body copy):
 *     `alias($.<existingHiddenName>, $.<freshVisibleName>)`. Exemplar:
 *     python's `dict_pattern` — the comma-separated list's REPEATED-TAIL
 *     occurrence of `choice($._key_value_pattern, $.splat_pattern)` still
 *     references the hidden `_key_value_pattern` unpromoted (the author's
 *     `dict_pattern: {'1/0/0/0': 'kv'}` override only reached the HEAD
 *     occurrence of the same choice).
 *   - The arm is itself an anonymous structured `seq`/`choice` (no separate
 *     rule name) — synthesize a fresh hidden rule from the arm's own body,
 *     same as the inline-unsafe `optional(seq)` path (`visibleGroupSynthName`).
 *
 * Deliberately NOT handled here (gate (c), a separate follow-up): a
 * FIELD-NAMED arm sitting alongside union arms in the same choice (a mixed
 * row) — this pass only mints for unnamed arms.
 */
```

### `SeparatorFact` (`packages/codegen/src/dsl/list-patterns.ts:29`)

```text
/**
 * The nested separator fact's shape (`{value, trailing?, leading?}`, PR-S),
 * phrased structurally over `RuntimeRule` (rather than a specific
 * `RuleBase<Phase>['separator']`) so `separatorFactsEqual` accepts the fact
 * at ANY phase view (`RuleBase<'normalize'>.separator`,
 * `RepeatRule<'link'>.separator`, …) without a phase-widening cast at the
 * call site — they all share this identical structural shape post-PR-S.
 */
```

### `SharedArmAttrs` (`packages/codegen/src/dsl/rule-attrs.ts:42`)

```text
/**
 * Attributes shared across the arms of a choice / polymorph. ONE derivation
 * consumed by both phases (was previously implemented twice, inconsistently —
 * simplify's `liftSharedArmAttrs` was choice-only + unanimous-multiplicity;
 * collect-slots' `sharedArmFieldName` + `strongestArmMultiplicity` were
 * choice+polymorph + strongest-multiplicity):
 *  - simplify's `liftSharedArmAttrs` hoists the UNANIMOUS attrs onto the choice.
 *  - collect-slots reads the unanimous `fieldName` (slot naming) and the
 *    `strongestMultiplicity` (to lift an array multiplicity a single arm carries,
 *    e.g. `choice(commaSep1(X), X)`).
 *
 * `fieldName` / `multiplicity` / `nonterminal` / `separator` are UNANIMOUS —
 * present and equal on EVERY arm, else `undefined`. `strongestMultiplicity` is
 * the most-multi multiplicity ANY single arm carries (`nonEmptyArray > array >
 * optional`; `single` / absent ignored), regardless of unanimity.
 */
```

### `StampedAttrs` (`packages/codegen/src/dsl/rule-attrs.ts:68`)

```text
/**
 * Structural-read shape for the stamped leaf attributes. These only exist
 * on `RuleBase<'normalize' | 'simplify'>` per the type, but `sharedArmAttrs`
 * is called from `collect-slots.ts` with `AnyRule` values that are, at
 * runtime, always post-wrapper-deletion (normalize-phase) rules — the
 * wrapper-bearing 'evaluate'/'link' views just don't carry these fields.
 * Matches the established structural-read-cast pattern (see
 * `findRepeatFlag` in dsl/rule-transforms.ts).
 */
```

### `RuleMetadataShape` (`packages/codegen/src/dsl/rule-metadata.ts:44`)

```text
/**
 * The real provenance shape. Absorbs:
 *   - the former `RuleBase.metadata` bag (`source` / `inlinedFrom`)
 *   - the former top-level `FieldRule.source` (`'grammar' | 'override' |
 *     'enriched' | 'inferred'`) — relocated here as `fieldSource` (debt PR-P1
 *     item 2; the 'inferred' arm is dropped per the confirmed-dead-writer
 *     probe, lingering-debt-inventory-research.md §2.6)
 *   - the former top-level `SymbolRule.source` (`'grammar' | 'link' |
 *     'group-lift'`) — relocated here as `symbolSource` (debt PR-P1 item 2)
 *
 * Deliberately kept as separate per-fact keys rather than one unified
 * `source` — the three vocabularies are genuinely different value sets (see
 * lingering-debt-inventory-research.md §5.4's "source homonyms" note);
 * collapsing them is a separate design discussion, not in scope here.
 *
 * (debt: source-homonym resolution, decision 6, 2026-07-04) The former
 * `source?: 'grammar' | 'promoted' | 'override' | 'enrich' | 'group-lift'`
 * field wore TWO different facts under one name:
 *   - WHO ORIGINALLY WROTE the rule's text — grammar authoring, an
 *     grammar.sittir.ts patch, dsl-side enrich synthesis, or evaluate synthesis.
 *     This is `author` below. `'group-lift'` never actually appeared as a
 *     `source` value in practice (only as `symbolSource`) and is dropped.
 *   - WHETHER a classification was DECLARED (grammar-authored, e.g.
 *     `grammar.supertypes`) or INFERRED by link's structural classifier
 *     (the former `'promoted'` value). This is `classifiedBy` below — it is
 *     NOT an authorship fact (the rule's text is still grammar-authored
 *     either way; only the ENUM/SUPERTYPE classification decision was
 *     inferred rather than declared).
 */
```

### `author` (`packages/codegen/src/dsl/rule-metadata.ts:74`)

```text
/**
	 * WHO wrote this rule's text. `'grammar'` — authored directly in the
	 * grammar. `'override'` — authored or replaced by an grammar.sittir.ts patch.
	 * `'enrich'` — dsl-side enrich synthesized this position (path-descent in
	 * transform-path.ts and link's enrich↔link handoff key on this to travel
	 * through / resolve the synthesized position). `'evaluate'` — evaluate
	 * synthesized this rule (mirrors `RuleProvenance`'s
	 * `'evaluate-synthesized'`, decision 6).
	 */
```

### `classifiedBy` (`packages/codegen/src/dsl/rule-metadata.ts:84`)

```text
/**
	 * WHETHER a rule's ENUM/SUPERTYPE classification was declared in the
	 * grammar (`'grammar'`, e.g. present in `grammar.supertypes`) or inferred
	 * by link's structural classifier (`'link'`, the former `source:
	 * 'promoted'` value). Diagnostics-only (the `promotedRules` derivation
	 * log / suggested.ts's override-candidate surfacing) — never an
	 * authorship fact.
	 */
```

### `inlinedFrom` (`packages/codegen/src/dsl/rule-metadata.ts:93`)

```text
/** Diagnostics-only: the hidden kind whose body was spliced in by the
	 *  normalize inline hoist (§D-2a). */
```

### `fieldSource` (`packages/codegen/src/dsl/rule-metadata.ts:96`)

```text
/** Relocated `FieldRule.source` (debt PR-P1 item 2). */
```

### `symbolSource` (`packages/codegen/src/dsl/rule-metadata.ts:98`)

```text
/** Relocated `SymbolRule.source` (debt PR-P1 item 2). */
```

### `RuleBuilder` (`packages/codegen/src/dsl/rule-transforms.ts:35`)

```text
/**
 * Strategy interface for constructing wrapper/structural rules. Injected via
 * `TransformCtx.builder` so each call-site delegates node-vs-attribute
 * decisions to the phase rather than hard-coding them. Two implementations:
 *
 *  - `structuralBuilder` (defined here, dsl-side): builds plain node literals
 *    exactly as construction sites did before — byte-identical results. Used
 *    as the no-ctx default (`ctx.builder ?? structuralBuilder`).
 *
 *  - `attributeBuilder` (defined in compiler/simplify.ts): overrides the
 *    wrapper constructors to push attributes instead of building nodes — so
 *    simplify stays field/optional/repeat/repeat1-node-free by construction.
 */
```

### `InlineRefsCtx` (`packages/codegen/src/dsl/rule-transforms.ts:212`)

```text
/**
 * Ctx for the shared `inlineRefs` op (R3 / PR-O M1 closure). Self-contained
 * so non-phase callers (assemble's alias-body path) can construct it without
 * a full TransformCtx.
 */
```

### `transform` (`packages/codegen/src/dsl/dsl-authoring.ts:47`)

```text
/** Patches preserve the rule's shape → return the original's (recursive) type. */
```

### `ENRICH_CLAUSE_GROUPS_KEY` (`packages/codegen/src/dsl/enrich.ts:299`)

```text
/**
 * Well-known non-enumerable key attached by `enrich()` to the grammar result
 * when clause-hoist synthesized any hidden group rules. Wire.ts reads this to
 * register the hoisted names in `WireContext.syntheticInline` so they end up
 * in the grammar's `inline:` list (required to prevent tree-sitter LR
 * conflicts from the newly-injected hidden rules).
 */
```

### `ENRICH_CLAUSE_GROUP_OWNERS_KEY` (`packages/codegen/src/dsl/enrich.ts:315`)

```text
/**
 * Well-known non-enumerable key attached by `enrich()` to the grammar result:
 * synthesized clause-hoist name → the parent kind whose (pre-override) body
 * it was hoisted from. Covers BOTH categories `ENRICH_CLAUSE_GROUPS_KEY`
 * covers (inline-safe) AND the visible-aliased hidden names it deliberately
 * excludes (`_<parent>_group<N>`) — wire() needs both, since an override
 * redeclaring the recorded owner orphans the synthesized rule regardless of
 * which category it's in.
 */
```

### `ENRICH_VISIBLE_GROUP_SOURCES_KEY` (`packages/codegen/src/dsl/enrich.ts:333`)

```text
/**
 * Well-known non-enumerable key attached by `enrich()`: the hidden SOURCE
 * rule names behind every visible-group mint (`alias($._src, $.visible)`) —
 * both the promote-existing-hidden-rule and synthesize-new-body categories.
 */
```

### `ENRICH_UNALIAS_DIAGNOSTICS_KEY` (`packages/codegen/src/dsl/enrich.ts:1671`)

```text
/**
 * Well-known non-enumerable key under which `enrich()` attaches the
 * (downgraded, non-blocking) `parsekind-noninjective` diagnostics its
 * un-aliasing pass produced for a given grammar evaluation. Read via
 * `getEnrichUnaliasDiagnostics`.
 *
 * Attached to the SAME evaluation's own return object rather than a
 * module-level accumulator (the former design): a module-global array only
 * populated on the FIRST import of a grammar's entry path — Node caches the
 * module, so a second `evaluate()` of the same grammar in one process would
 * observe an empty drain even though the diagnostics conceptually still apply;
 * concurrent evaluations of different grammars would also interleave into one
 * shared array. Travelling with the result object avoids both: the diagnostics
 * stay on the (cached) grammar object, correct on every read, per-grammar.
 */
```

### `structuralBuilder` (`packages/codegen/src/dsl/rule-transforms.ts:44`)

```text
/**
 * Structural builder: each method builds the plain node literal exactly as
 * the construction sites previously did. Byte-identical to hand-written
 * literals; used as the safe default when no ctx.builder is present.
 */
```

### `flagWalker` (`packages/codegen/src/dsl/rule-transforms.ts:91`)

```text
/**
 * Does `rule` contain a repeat/repeat1 that declares the given flag?
 *
 * `trailing: true` marks `sepBy` shapes where the final separator is
 * optional (e.g. rust's `{ a, b, }`). `leading: true` marks the
 * mirror shape `sep, x, (sep x)*` (rust's or_pattern `| a | b`, if
 * written as a single repeat). Evaluate's `liftCommaSep` captures
 * both from their canonical seq patterns. Render reads each flag via
 * the `joinByTrailing` / `joinByLeading` template hints to know
 * whether to probe for a flanking anon-separator token when emitting
 * `$$$CHILDREN`.
 *
 * Walks the same transparent-wrapper set as `findNestedSeparator`
 * (seq / choice / optional / variant / clause / group / field).
 *
 * Moved from template-walker.ts (origin: template-walker.ts:65).
 */
```

### `fuseHeadRepeatListsWalker` (`packages/codegen/src/dsl/rule-transforms.ts:434`)

```text
/**
 * Fuse head+repeat separated-list pairs into a single multi slot, recursively.
 * Behaviour-preserving everywhere else — non-seq rules and seqs without the
 * head+repeat shape pass through unchanged (reference-identical when no fusion
 * applies).
 *
 * Recursion is delegated to a bare `RuleWalker<AnyRule>` (R12 traversal
 * engine), replacing the former `recurseChildren`-based self-recursive
 * visitor. `RuleWalker.map` is NOT a drop-in replacement: `map` already
 * recurses the whole subtree internally and applies `visit` to every
 * already-mapped node, so `visit` here (`fuseAtNode`) does ONLY the
 * single-level fusion — it must NOT call `fuseHeadRepeatLists` on itself
 * (that would recurse twice). `fuseHeadRepeatLists` additionally applies
 * `fuseAtNode` to `map`'s own return value, since `map` rebuilds a node's
 * children bottom-up but does not apply `visit` to the top node itself —
 * matching `recurseChildren(rule, fuseHeadRepeatLists)` followed by the
 * seq-fusion check that used to sit inline in this function.
 */
```

### `dsl-authoring.ts` — module purpose (`packages/codegen/src/dsl/dsl-authoring.ts`)

An authoring-typed facade over the DSL primitives, imported by `grammar.sittir.ts`.
Same runtime implementations as `./index.ts`, but with grammar-shapes return
types that are accurate in the tree-sitter authoring context, where these
primitives produce tree-sitter-shaped rules. The loose dual-runtime
`FieldLike` / `RuntimeRule` types stay codegen-internal — `grammar.sittir.ts` never
sees them. One boundary cast per primitive asserts the authoring-context
contract; runtime behaviour is unchanged.

### `prec` / `token` (`packages/codegen/src/dsl/dsl-authoring.ts`)

Both are runtime-injected by `saveAndInjectDslGlobals` (see
`compiler/evaluate.ts`) before an `grammar.sittir.ts` module graph is evaluated —
the same mechanism as `field` / `alias`'s underlying primitives. Unlike those
two there is no sittir-owned `primitives/prec.ts` / `primitives/token.ts`
runtime, because tree-sitter's own `prec` / `token` need no override-specific
placeholder behaviour. So this module re-types the SAME injected global rather
than re-implementing it.

`grammar.sittir.ts` imports these and thereby shadows the ambient `prec` / `token`
declared in `authoring-globals.d.ts`, via ordinary lexical scoping. That
sidesteps the fact that `const`-declared ambient globals don't merge as
overloads across files the way `declare function` does. `seq` / `choice` /
`field` / `alias` / `optional` / `repeat` / `repeat1` / `sym` / `string` /
`blank` merge fine and need no such treatment.

### `grammar` (`packages/codegen/src/dsl/dsl-authoring.ts`)

Runtime-injected the same way — this is `evaluate.ts`'s own `grammarFn`, NOT
tree-sitter's ambient `grammar()`. Its real two-arg (extension) contract is
`(base: <flat enriched grammar shape>, options: WiredOpts) => GrammarResult`:
`enrich(base)` returns `EnrichedGrammar<B>`, the SAME flat `{ name, rules, … }`
shape as `B` (sittir's readonly-tupled grammar-shape rules, each enriched) and
not a `{ grammar: { … } }` wrapper, while `wire()` returns `WiredOpts`.
`grammarFn`'s own return value IS `{ grammar: { … } }`-shaped
(`GrammarResult`), which is what a base-extension call receives.

Tree-sitter's ambient overloads instead expect a flat but MUTABLE
`GrammarSchema` base. Typing this re-export against the real contract is what
lets `grammar.sittir.ts` call `grammar(enrichedBase, wire(…))` without a
suppression.

### `mergeUnanimousAttrs` — separator comparison (`packages/codegen/src/dsl/rule-attrs.ts`)

`separator` is the nested `{ value, trailing?, leading? }` fact, and the
wrapper object carries no `.type` discriminant, so it is compared via
`separatorFactsEqual` rather than the generic rule comparison.

`separatorFactsEqual` narrows to whatever `rulesEqual`'s switch explicitly
handles and returns `false` silently for a `.value` shape `rulesEqual` doesn't
recognise. That is harmless today — a post-wrapper-deletion separator's
`.value` is always a STRING literal at this point — but it is the thing to
revisit if separators ever grow richer rule-shaped values.

### `collapseSingletonMintOrdinals` (enrich.ts)

Drops the ordinal from arm/group mint names whose parent minted exactly one
of that flavor — the ordinal only disambiguates siblings, so a lone
`<parent>_group1` / `<parent>_arm2` becomes `<parent>_group` / `<parent>_arm`.
Runs once over the merged rule bag right after the clause-group mints merge,
before the later passes and wire's override callbacks read names. Renames
the hidden rule key (in the merged bag AND the minted-rule bag, whose keys
later derive the `inline:` list), the visible alias value, every symbol
reference, and the wire-facing tracking structures (`visibleGroupHiddenNames`,
`clauseGroupOwners`). A name collision with any existing rule keeps the
ordinal. Only the clause-group mint namespace is surveyed; a sibling that was
registered but later unused still counts as a sibling.
