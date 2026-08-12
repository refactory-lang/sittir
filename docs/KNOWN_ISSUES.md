# Known Issues

Running list of known, non-blocking gaps discovered during feature work — documented here rather than silently forgotten, but not urgent enough to have blocked the work that found them. When one gets fixed, delete its entry rather than marking it done.

Every entry heading starts with a stable backticked `ki-*` id — refer to an entry by that id (in conversation, commits, or across sessions); ids never renumber when neighbors are deleted, and a fixed entry's id simply disappears with it. Pick unused ids for new entries.

Suggested attack order (by payoff ÷ effort; remove a line when its entry is deleted):

1. `ki-class-static-block` — probably shares a root with the `_static_marker` rows in `ki-sclass-residuals`
2. `ki-decorated-def-newline` — factory-side stamp for the spacing model's newline slot
3. `ki-enrich-choice-recursion`, `ki-separator-diag-drift`, `ki-zero-visible-rules` — singleton triages, each a one-sitting fix-or-repin
4. `ki-stale-expectdiagnostics` — one regen to confirm, then delete a line of config
5. `ki-sclass-residuals` — the corpus clusters, biggest first (S1 native-coords, python S8 tuple_pattern)
6. `ki-from-string-composition` — blocked on a quote-style design decision
7. `ki-token-adjacency` — highest blast radius (shared walker), needs full three-grammar verification
8. `ki-emitsymbol-fielded-seq` — proactive flag only; act when a grammar exercises the shape

## `ki-token-adjacency` — Rust `generic_type_with_turbofish`'s render template injects illegal whitespace around the `::<` turbofish token — accepted regression, not a TODO

**Found during:** [enrich base-grammar un-aliasing](superpowers/specs/2026-07-14-enrich-base-grammar-unaliasing-design.md) implementation, Task 1 rework (`packages/codegen/src/dsl/enrich.ts`'s `applyUnaliasDistinct`, single-site drop branch — unchanged, already-landed behavior for rust's one un-aliasing site, `scoped_type_identifier.path`).

Dropping the alias at `scoped_type_identifier.path` (visible storage kind → drop, per the existing hidden/visible branch) makes `generic_type_with_turbofish` an ordinary, independently-addressable top-level model kind for the first time. Previously it was reachable ONLY through a special context-aware reparse wrapper (see `packages/rust/grammar.sittir.ts`'s comment right below its own `generic_type_with_turbofish: { 1: field('turbofish') }` override — ADR-0006's `drillAs` mechanism), never as a bare root kind exercised by the generic per-kind read-render-parse fixture generator. Now that it is, a pre-existing gap in the shared template-rendering walker surfaces: the generated `rust/crates/sittir-rust/templates/generic_type_with_turbofish.jinja` (source of truth: `packages/codegen/src/emitters/templates.ts` → `compiler/model/node-map.ts`'s `renderTemplate()`) renders

```
{{ type_ }} {{ turbofish }} {{ type_arguments }}
```

— a literal space around the `turbofish` field (wrapping the anonymous `::` token declared via the override above). Rust's `::<...>` turbofish syntax requires exact token adjacency to disambiguate from other uses of `::`/`<`; reproduced directly: `probe-kind --grammar rust --kind scoped_type_identifier --source 'fn f(x: a::B::<T>::C) {}'` renders `"a::B :: <T>::C"` instead of `"a::B::<T>::C"`, and reparsing the spaced form yields a DIFFERENT root kind (`generic_type` instead of `generic_type_with_turbofish`) rather than round-tripping. Confirmed via corpus: rust's `read-render-parseAstMatchPass` sits at 123/136 (down from the pre-plan baseline of 125), the 2 new mismatches being exactly `generic_type_with_turbofish` (`Scoped functions`, `Struct patterns`).

This is a general "scanner-delimited / token-adjacent slot" rendering gap in the shared template-emission walker (no per-slot notion of "this field must render with zero surrounding whitespace" exists today) — not something introduced by, or fixable within, the un-aliasing pass itself.

**Status: knowingly accepted, not deferred-as-a-TODO.** The user explicitly decided to accept this rather than block the un-aliasing plan on it. (Floor bookkeeping has since moved on: the committed `packages/tools/baselines/native.json` is the shallow floor authority and rust AST-match now sits at 128 — the turbofish corpus entries themselves no longer appear in the failing-mismatch list, but a direct probe still renders `a::B:: <T> ::C` with illegal spacing, so the underlying token-adjacency gap in the walker is alive; today it surfaces in the corpus as the `delim_token_tree` child-count and dropped-`$` mismatches instead.) `compiler/model/node-map.ts`'s `renderTemplate()` is a shared chokepoint across all rules in all 3 grammars, already flagged fragile in project memory ("Walker hotspot — `walkRuleForTemplate` has 3 edge fixes, no unit tests"), and a general fix carries real risk of regressing AST-match elsewhere if rushed — explicitly judged out of scope for the un-aliasing plan.

**Fix, if/when prioritized:** give the template-emission walker a way to mark a FIELD slot (or the anonymous token it wraps) as requiring token-adjacent rendering — likely keyed off `token.immediate` or a similar existing marker already tracked for other scanner-delimited cases (see project memory "Preserve token wrappers" and "Template walker adjacency — scanner-delimited kinds need adjacent rendering"). Verify against all 3 grammars' deep-AST counts before landing, given the walker's blast radius.

**More confirmed instances (2026-07-20, PR #169):** fixing typescript's `string` rule (an unrelated bug with an unrelated fix) let previously-parse-blocked corpus fixtures reach far enough to exercise `break_statement`, `continue_statement`, and `debugger_statement` for the first time; all three render their trailing `;` with a leading space (`"break ;"`, `"continue ;"`, `"debugger ;"` instead of `"break;"`/`"continue;"`/`"debugger;"`), and rust's `_delim_token_tree_paren.jinja` has the same shape (`"hi" , x` instead of `"hi", x`). Same root cause, same deferred status — not re-litigated here, just logged as more evidence for whoever picks up the general walker fix. `regression-checker-native`'s `format-deferred-rise` verdict flagged this as typescript's `roundtrip` failingKinds growing 7→10 on PR #169 — accepted per the same reasoning as the turbofish case above (net `roundtrip` pass count went 82→109 on the same PR; the 3 new failures are pre-existing-but-newly-reachable, not caused by the string fix itself).

## `ki-stale-expectdiagnostics` — Typescript `_export_statement_group2` `expectDiagnostics` allow-list entry may now be removable

**Found during:** typescript's nested/cascaded `polymorphs:` work. The root issue — assemble-time diagnostics firing on enrich-minted rules left orphaned (unreachable from any top-level kind) by superseding polymorph splits — was FIXED at the root: `compiler/evaluate.ts`'s `buildRuleCatalog` computes `computeReachableRuleNames` (BFS from all visible top-level rule names) and omits hidden+unreachable rules from its `.rules` map, so diagnostics never see the orphans.

What remains is bookkeeping: the per-instance workaround from before the fix — the `_export_statement_group2`/`storagename-collision` `expectDiagnostics` allow-list entry in `packages/typescript/grammar.sittir.ts` — was never removed. If the orphan is now filtered before diagnostics run, the allow-list entry is dead and should go (a stale `expectDiagnostics` row can mask a FUTURE real collision under the same key). Removing it needs a typescript regen + `validate counts` to confirm nothing fires.

**Caveat:** the reachability BFS seeds from *visible* top-level rules — see the zero-visible-rules entry below for the edge case that seeding choice broke.

## `ki-emitsymbol-fielded-seq` — `emitSymbol`'s generalized hidden-helper inlining doesn't yet handle a fielded sequence inside the inlined target

**Found during:** indent-aware rendering for python (`rrp-ast-match-sweep`), generalizing `emitSymbol` (`packages/codegen/src/emitters/templates.ts`) so a NAMED field wrapping a hidden `inline: true` target (e.g. `function_definition.body` → `_suite`) inlines the target's `renderRule` the same way an unnamed group-lift helper already does, instead of always emitting an opaque `{{ body }}` slot reference. Confirmed via a full-grammar scan: 46 total "named field → hidden inline:true target" occurrences across the 3 grammars (python 11, all → `_suite`; rust 12 and typescript 23, all → 0-slot `pattern`/`enum` leaf wrappers like `_type_identifier`/`_semicolon`) — the fix was applied generically to all 46 since the non-`_suite` targets have no internal structure to be affected by inlining.

The generalization was verified safe for every CURRENT occurrence (`_suite`'s own 3 choice arms declare no fields of their own; the 35 pattern/enum targets have zero slots), but the inlining logic itself does not yet handle the case where the inlined target's content is a `seq` whose members are ALL themselves field-wrapped (as opposed to `_suite`'s arm-2 shape, `seq($._indent, $.block)`, where only the `$.block` member is field-addressable and `$._indent` is a bare terminal). If a future grammar or override introduces a hidden `inline: true` helper referenced from a named field where every seq member carries its own `fieldName`, the current inlining path's conditional-gating logic (keyed on a single `condKey`, preferring the outer field's own name) has not been exercised against that shape and may need additional handling — e.g. surfacing each inner field independently rather than gating the whole inlined body on one presence check.

**Status: not yet encountered, flagged proactively during design review — not blocking the current fix.**

**Fix, if/when prioritized:** when a future case exercises this shape, extend `emitSymbol`'s inlining block (`packages/codegen/src/emitters/templates.ts`, the `if (rule.type === SYMBOL && rule.inline === true)` branch) to detect "target's own top-level rule is a SEQ whose members are all field-wrapped" and route each inner field through its own presence/emission logic instead of a single shared conditional — likely mirroring render-module.ts's existing "group-lift inner field hoisting" pattern (hoisting a helper's inner named fields onto the parent struct) for the template side too.

## `ki-sclass-residuals` — Round-trip-fidelity residual inventory — the corpus failures behind the committed S-class ceilings

**Found during:** the floor-ratchet + S-class-gate work that closed out the round-trip-fidelity restoration program's final phase. The live SSOT for these counts is `packages/tools/sclass-ceilings.json` (per-grammar ceilings the `validate counts` run enforces) + `packages/tools/validation-report.json` (the classified entries themselves) + `packages/tools/baselines/native.json` (exact pass floors and per-validator `failingKinds`). This entry names the failure *clusters* so each can be chipped at as its own work item — chip one, lower its ceiling in the same commit.

- **S1 — `from()` "native coords unresolved for alias target"** (~11 python / ~13 rust / ~12 typescript kinds: `identifier`, literal/string fragments, `true`/`null`/`self`/`crate`, …). The from() validator refuses to compare a kind whose native coords can't be resolved for its alias target. Largest single classified cluster; the alias-identity fix sites were previously audited (raw context id vs canonical catalog id — four sites).
- **S1 — typescript rrp transport alias-unwrap** (2 corpus entries × shallow+deep): "Accessibility modifiers as pair keywords" — `render: alias-wrapper kind id 443 in ObjectPropertiesTransportSlot: no kind-keyed child slot to unwrap`; "Enum declarations" — `render: unknown kind id 441 in EnumBodyGroup1ContentTransportSlot`. Known visible-alias unwrap gap in the shared transport machinery.
- **S8 — python `tuple_pattern` "kind not found at rendered offset 16"** (3 corpus entries × shallow+deep: "lambdas", "Default Tuple Arguments", "List comprehensions"). The typescript instance of this locator class was fixed via `WRAPPER_PRIORITY` in `packages/tools/src/validate/common.ts`; python's `tuple_pattern` wrapping context still mislocates.
- **python `dict_pattern` reparse comma drop** (2 corpus entries × shallow+deep: "Dict mappings", "Builtin classes" — `re-parse error [ERROR in dict_pattern_group1 at "message"color":"]`). Inter-entry comma vanishes on render; pre-existing, not yet root-caused.
- **python deep AST mismatches** (5): `string` drops `string_content` ("Strings", "Raw strings"), `for_in_clause` drops its trailing comma ("Generator expression"), `simple_pattern_negative` drops the `-` ("Literals"), `exec_statement` drops the `"in" expression` tail ("Exec statements" — same outer-field class as the fixed `infer_type` constraint override).
- **typescript `rest_pattern` reparse** (2 corpus entries × shallow+deep: "Tuple types", "Extends" — `re-parse error [ERROR in subscript_expression at "..."]`). The reparse wrapper embeds the rendered `...` in a subscript context where it can't parse — likely a wrapper-selection artifact rather than a render defect.
- **rust rrp residuals**: `use_declaration` "Derive macro helper attributes" — `render: Missing field \`_content\`` (S6, comment-content class); "Raw string literals" reparse error; deep AST mismatches on `delim_token_tree_paren` child counts and a dropped `$` in "Macro invocation - arbitrary tokens" (token-adjacency/walker class — see the turbofish entry above); "Macro definition" reparses `token_tree_paren` where `delim_token_tree_paren` was rendered.
- **S4 — `union-slot-mixed-row` grammar diagnostics** (python `future_import_statement`/`import_from_statement`, typescript `binary_expression`/`_jsx_opening_element_content`): static modeling warnings, order-lossy or singular mixed rows.
- **Factory trailing-separator capture gap** (~11 rows across all three grammars: `_*_trailing_sep: value true ≠ false` — python `case_pattern`/`element`/`simple_statement`, rust `elements`/`macro_rule`, typescript `content`/`type_parameter`/`type`): a read captures per-field trailing-separator presence; the factory path has no way to stamp it (the accepted factory-render-parse shortfall from the flank-capture work — needs FactoryShape support to close).
- **typescript `_separator_kind: unexpected extra field on factory output`** (×9): the factory stamps a `_separator_kind` the read reference doesn't carry (or normalizes differently) — inverse-direction sibling of the trailing-sep gap.
- **typescript `_static_marker: value 107 ≠ 356`** (×3): marker stamped with the wrong kind id — plausibly the same root as the `class_static_block` factory mis-dispatch entry below.
- **python `_content: value "0"/"3"/"3j" ≠ {}`** (×5): scalar text content where the read reference materializes a node.

**Status: documented exclusions — every count above is pinned by the committed ceilings; a fix must lower the matching ceiling in the same commit (the gate prints a reminder when a class drops below its ceiling).**

## `ki-enrich-choice-recursion` — `enrich()` optional keyword-prefix promotion (pass 2) no longer recurses into choice members — unit pin broken

**Found during:** the same hygiene pass. `packages/codegen/src/dsl/__tests__/enrich.test.ts` ("recurses into choice members") dies at `branch0.members[0]` — the choice branch it inspects no longer has `members`, i.e. either the promotion stopped recursing into CHOICE arms (behavior regression) or a later enrich/normalize change legitimately reshapes the branch before the assertion (stale pin). Not yet triaged to either side — the failure is a TypeError in the test's own navigation, not a clean assertion diff.

**Fix, if/when prioritized:** dump the actual rule shape the test receives; if the promotion still happens under a different structure, re-pin; if `optional('<kw>')` inside a choice arm genuinely no longer promotes to `field('<kw>_marker', …)`, that's a real regression in the auto-promotion pass and corpus kinds with keyword-prefixed choice arms would show marker drops.

## `ki-separator-diag-drift` — `generate()` non-literal-separator diagnostic count drifted (typescript surfaces 1 of the expected 2)

**Found during:** the same hygiene pass. `packages/codegen/src/compiler/__tests__/generate.test.ts` pins that a typescript `generate()` run surfaces exactly 2 `non-literal-separator` warnings; the run now surfaces 1. One of the two separator sites either got fixed, consolidated, or its diagnostic suppressed — needs a one-line triage (which site disappeared and why) before deciding whether to re-pin to 1 or restore the lost diagnostic.

## `ki-zero-visible-rules` — Evaluate with zero visible rules returns an empty rule catalog — hidden-only grammars lost their rules

**Found during:** the same hygiene pass. `packages/codegen/src/compiler/__tests__/evaluate.test.ts` ("grammar with zero visible rules evaluates successfully") expects `_expr` in the catalog and gets `[]`. Plausibly a casualty of the reachability filter described in the orphaned-rules entry above: `buildRuleCatalog`'s BFS seeds from *visible* top-level rule names, so a grammar with only hidden rules has an empty seed set and every rule is "unreachable". Real grammars always have visible roots, so this is an edge-case contract question: either hidden-only grammars should seed the walk from all top-level rules, or the test's contract is obsolete.

## `ki-class-static-block` — TypeScript `class_static_block` factory builds the wrong kind and loses the method surface

**Found during:** the same hygiene pass. `packages/typescript/tests/nodes.test.ts`: `ir.classStaticBlock(...)` returns a node whose `$type` is `statement_block`'s id rather than `class_static_block`'s, and the returned object has no `$render` method — the factory (or its `ir` alias) is resolving/collapsing to the wrong target kind entirely, then skipping `withMethods`. Distinct symptom from the polymorph-misselection cluster above (this is factory dispatch, not `nodeToConfig` inference).

## `ki-decorated-def-newline` — Python `decorated_definition` render requires a `_newline` the read never populates

**Found during:** the same hygiene pass. `packages/python/tests/nodes.test.ts`: rendering a factory-built `decorated_definition` throws `Missing field \`_newline\` on DecoratedDefinitionTransport._decorator` — the decorator transport declares a mandatory newline slot (statement-terminating-newline modeling) that the factory path never stamps. Factory-side counterpart of the spacing-model change; the corpus rrp path passes because a real read carries the newline.

## `ki-from-string-composition` — Rust `from.string` / `from.comment` canonical factories are not emitted — composition needs a design decision

**Found during:** re-pinning `packages/codegen/src/scm/__tests__/scm-roles.test.ts`. Rust's `string_literal` factory takes a config with an explicit `stringOpen` slot (the open-quote token variant: `"`, `b"`, …) plus an `elements` array, so `emitFromString` has no single-positional-child surface to compose and deliberately skips rather than inventing a default quote style (`line_comment`'s content-node shape skips `from.comment` the same way). The test now pins the absence.

**Fix, if/when prioritized:** a composition rule needs an explicit decision on the default open-quote (probably plain `"` with sub-entries like `from.string.raw(...)` for other variants) — an overrides-level declaration, not an emitter heuristic. Flip the scm-roles pin when it lands.

