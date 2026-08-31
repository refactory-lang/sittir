# Known Issues

Running list of known, non-blocking gaps discovered during feature work — documented here rather than silently forgotten, but not urgent enough to have blocked the work that found them. When one gets fixed, delete its entry rather than marking it done.

Every entry heading starts with a stable backticked `ki-*` id — refer to an entry by that id (in conversation, commits, or across sessions); ids never renumber when neighbors are deleted, and a fixed entry's id simply disappears with it. Pick unused ids for new entries.

Suggested attack order (by payoff ÷ effort; remove a line when its entry is deleted):

1. `ki-sclass-residuals` — the corpus clusters, biggest first (python deep-AST mismatches, rust rrp residuals)
2. `ki-from-string-composition` — blocked on a quote-style design decision
5. `ki-exercise-span-transport` — exercise renders natively now; chip its honest failure inventory ($span class + set_comprehension padding)
8. `ki-dict-pattern-comma` — python inter-entry comma vanishes; not yet root-caused
11. `ki-emitsymbol-fielded-seq` — proactive flag only; act when a grammar exercises the shape

## `ki-emitsymbol-fielded-seq` — `emitSymbol`'s generalized hidden-helper inlining doesn't yet handle a fielded sequence inside the inlined target

**Found during:** indent-aware rendering for python (`rrp-ast-match-sweep`), generalizing `emitSymbol` (`packages/codegen/src/emitters/templates.ts`) so a NAMED field wrapping a hidden `inline: true` target (e.g. `function_definition.body` → `_suite`) inlines the target's `renderRule` the same way an unnamed group-lift helper already does, instead of always emitting an opaque `{{ body }}` slot reference. Confirmed via a full-grammar scan: 46 total "named field → hidden inline:true target" occurrences across the 3 grammars (python 11, all → `_suite`; rust 12 and typescript 23, all → 0-slot `pattern`/`enum` leaf wrappers like `_type_identifier`/`_semicolon`) — the fix was applied generically to all 46 since the non-`_suite` targets have no internal structure to be affected by inlining.

The generalization was verified safe for every CURRENT occurrence (`_suite`'s own 3 choice arms declare no fields of their own; the 35 pattern/enum targets have zero slots), but the inlining logic itself does not yet handle the case where the inlined target's content is a `seq` whose members are ALL themselves field-wrapped (as opposed to `_suite`'s arm-2 shape, `seq($._indent, $.block)`, where only the `$.block` member is field-addressable and `$._indent` is a bare terminal). If a future grammar or override introduces a hidden `inline: true` helper referenced from a named field where every seq member carries its own `fieldName`, the current inlining path's conditional-gating logic (keyed on a single `condKey`, preferring the outer field's own name) has not been exercised against that shape and may need additional handling — e.g. surfacing each inner field independently rather than gating the whole inlined body on one presence check.

**Status: not yet encountered, flagged proactively during design review — not blocking the current fix.**

**Fix, if/when prioritized:** when a future case exercises this shape, extend `emitSymbol`'s inlining block (`packages/codegen/src/emitters/templates.ts`, the `if (rule.type === SYMBOL && rule.inline === true)` branch) to detect "target's own top-level rule is a SEQ whose members are all field-wrapped" and route each inner field through its own presence/emission logic instead of a single shared conditional — likely mirroring render-module.ts's existing "group-lift inner field hoisting" pattern (hoisting a helper's inner named fields onto the parent struct) for the template side too.

## `ki-sclass-residuals` — Round-trip-fidelity residual inventory — the corpus failures behind the committed S-class ceilings

**Found during:** the floor-ratchet + S-class-gate work that closed out the round-trip-fidelity restoration program's final phase. The live SSOT for these counts is `packages/tools/sclass-ceilings.json` (per-grammar ceilings the `validate counts` run enforces) + `packages/tools/validation-report.json` (the classified entries themselves) + `packages/tools/baselines/native.json` (exact pass floors and per-validator `failingKinds`). This entry names the failure *clusters* so each can be chipped at as its own work item — chip one, lower its ceiling in the same commit.

- **S1 — alias-identity: closed.** The wire `$type` is the grammar symbol (the native read stamps `node.grammar_id()`), so alias display collapses are injective on the wire by construction and the runtime restamp machinery (drillAs pairs, `_aliasTargetToSource`) is deleted. The `parsekind-noninjective` records that remain in the report are severity-`info` audit trails of enrich's own unalias rewrites ("automatically resolved") — provenance, excluded from ceiling counting. The unresolved-coords refusal ("native coords unresolved for alias target") stays as a guard for kinds whose only corpus occurrence has no native node (e.g. swallowed into a verbatim-text carrier like a macro token tree) — the sound response there is a corpus entry exposing the kind in a materializable position, which is how the last open row (rust `block_comment`) was closed.
- **S4 — `union-slot-mixed-row` grammar diagnostics** (typescript `binary_expression`/`_jsx_opening_element_content`): static modeling warnings, order-lossy or singular mixed rows.
- **python `_content: value "0"/"3"/"3j" ≠ undefined`** (×5, all `_simple_pattern_negative`): the factory output is missing `_content` because `nodeToConfig` drops the slot — polymorph FORM kinds are excluded from factory metadata (`buildFactoryMap`'s `polymorphFormKinds` gate for `factoryShapes`/`factorySlots`), and this form is additionally absent from `factoryFields` because `collectAliasSourceKinds` walks only direct slot values while `_simple_pattern_negative` is reachable solely through the `_simple_pattern` supertype expansion. NOT the render-side `-` defect (that row is fixed); closing this needs a decision on how polymorph forms surface factory metadata.

**Status: documented exclusions — every count above is pinned by the committed ceilings; a fix must lower the matching ceiling in the same commit (the gate prints a reminder when a class drops below its ceiling).**

## `ki-let-destructuring-parse-divergence` — the typescript override parser never parses `let [...] = ...` as a declaration

**Found during:** closing the `rest_pattern` reparse rows — their wrapper (`let [${r}] = [];`) never reparsed because of this, not because of wrapper selection.

The override parser resolves `let [`'s declaration-vs-subscript ambiguity to the EXPRESSION fork: `let [c] = [];` parses as `expression_statement > assignment_expression > subscript_expression(object: reserved_identifier, ERROR, …)` — even the simplest array-destructuring `let` fails, while `const [c] = [];` (unambiguous keyword) parses correctly, and upstream tree-sitter-typescript parses the `let` form as a `lexical_declaration`. A GLR tie-break in the override grammar diverges from upstream's here (`let` doubles as a reserved identifier, so `let [` genuinely forks). No corpus entry currently exercises statement-level `let`-destructuring, so no validator row pins this — but it corrupts any real-world source using the construct. Fix belongs at the grammar level (a dynamic-precedence tie-break restoring upstream's resolution, the `primary_expression`/`list_splat_pattern` treatment in python's grammar being the in-repo precedent), not in consumers.

## `ki-from-string-composition` — Rust `from.string` / `from.comment` canonical factories are not emitted — composition needs a design decision

**Found during:** re-pinning `packages/codegen/src/scm/__tests__/scm-roles.test.ts`. Rust's `string_literal` factory takes a config with an explicit `stringOpen` slot (the open-quote token variant: `"`, `b"`, …) plus an `elements` array, so `emitFromString` has no single-positional-child surface to compose and deliberately skips rather than inventing a default quote style (`line_comment`'s content-node shape skips `from.comment` the same way). The test now pins the absence.

**Fix, if/when prioritized:** a composition rule needs an explicit decision on the default open-quote (probably plain `"` with sub-entries like `from.string.raw(...)` for other variants) — an overrides-level declaration, not an emitter heuristic. Flip the scm-roles pin when it lands.


## `ki-exercise-span-transport` — exercise factory round-trips fail on `Missing field start on …Transport.$span`

**Found during:** porting the exercise tool's render step off `@sittir/legacy-core` onto the native boundary (`loadBoundaryRender`) — the port replaced the old seam-less-garbage renders with honest native-transport errors, exposing the real per-case failures the legacy renderer had been masking. Post-port inventory: rust 2 pass / 0 fail; python 1 pass / 9 fail (4× the `$span` class via `comparison_operator`/comprehension clauses, plus `set_comprehension` rendering `{ a for a in b }` with brace padding for input `{a for a in b}`); typescript 0 pass / 2 fail (both the `$span` class via `type_parameters` / `type_arguments`).

The dominant class: the native transport deserializer demands a complete `$span` on nested transport structs (e.g. `ComparisonOperatorComparatorTransport.$span`) that the exercise path's factory-built (span-less) nodes cannot supply — while the factory-render-parse validator renders factory output for the same grammars at 1385/1390+, so the gap is specific to how the exercise tool materializes its node inputs (wrapped/read stubs mixed into factory configs), not to factory rendering per se.

**Fix, if/when prioritized:** root-cause why exercise-built nodes reach the transport with partial `$span`s (likely a read-stub surviving `nodeToConfig` into the rebuilt node) and either materialize the stub fully or strip `$span` so the transport takes the factory-shaped (span-less) path; the `set_comprehension` padding row is a separate template-spacing defect.

## `ki-dict-pattern-comma` — python `dict_pattern` drops the inter-entry comma on render

**Found during:** the flank-capture census (Task 3 of the separator work). `case {1: a, 2: b}:` renders without the comma between entries; shares a root with the (since-fixed) `print_statement` class — the mandatory-flank handling hardcoded where a headless-group shape needs a capture — but this kind was not closed by that fix and has not been re-root-caused since.

**Fix, if/when prioritized:** re-probe under the current separator-as-slot model (`probe-kind -g python -k dict_pattern --reparse`); the fix likely belongs with the kind's separated-list flank capture, not the template.

