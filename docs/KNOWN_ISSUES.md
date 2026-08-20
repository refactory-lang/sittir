# Known Issues

Running list of known, non-blocking gaps discovered during feature work — documented here rather than silently forgotten, but not urgent enough to have blocked the work that found them. When one gets fixed, delete its entry rather than marking it done.

Every entry heading starts with a stable backticked `ki-*` id — refer to an entry by that id (in conversation, commits, or across sessions); ids never renumber when neighbors are deleted, and a fixed entry's id simply disappears with it. Pick unused ids for new entries.

Suggested attack order (by payoff ÷ effort; remove a line when its entry is deleted):

1. `ki-sclass-residuals` — the corpus clusters, biggest first (python deep-AST mismatches, rust rrp residuals)
2. `ki-from-string-composition` — blocked on a quote-style design decision
3. `ki-emitsymbol-fielded-seq` — proactive flag only; act when a grammar exercises the shape
4. `ki-perfield-flank-residual` — design-blocked (tuple separator-possession; print/expression-tuple override rewrites)

## `ki-emitsymbol-fielded-seq` — `emitSymbol`'s generalized hidden-helper inlining doesn't yet handle a fielded sequence inside the inlined target

**Found during:** indent-aware rendering for python (`rrp-ast-match-sweep`), generalizing `emitSymbol` (`packages/codegen/src/emitters/templates.ts`) so a NAMED field wrapping a hidden `inline: true` target (e.g. `function_definition.body` → `_suite`) inlines the target's `renderRule` the same way an unnamed group-lift helper already does, instead of always emitting an opaque `{{ body }}` slot reference. Confirmed via a full-grammar scan: 46 total "named field → hidden inline:true target" occurrences across the 3 grammars (python 11, all → `_suite`; rust 12 and typescript 23, all → 0-slot `pattern`/`enum` leaf wrappers like `_type_identifier`/`_semicolon`) — the fix was applied generically to all 46 since the non-`_suite` targets have no internal structure to be affected by inlining.

The generalization was verified safe for every CURRENT occurrence (`_suite`'s own 3 choice arms declare no fields of their own; the 35 pattern/enum targets have zero slots), but the inlining logic itself does not yet handle the case where the inlined target's content is a `seq` whose members are ALL themselves field-wrapped (as opposed to `_suite`'s arm-2 shape, `seq($._indent, $.block)`, where only the `$.block` member is field-addressable and `$._indent` is a bare terminal). If a future grammar or override introduces a hidden `inline: true` helper referenced from a named field where every seq member carries its own `fieldName`, the current inlining path's conditional-gating logic (keyed on a single `condKey`, preferring the outer field's own name) has not been exercised against that shape and may need additional handling — e.g. surfacing each inner field independently rather than gating the whole inlined body on one presence check.

**Status: not yet encountered, flagged proactively during design review — not blocking the current fix.**

**Fix, if/when prioritized:** when a future case exercises this shape, extend `emitSymbol`'s inlining block (`packages/codegen/src/emitters/templates.ts`, the `if (rule.type === SYMBOL && rule.inline === true)` branch) to detect "target's own top-level rule is a SEQ whose members are all field-wrapped" and route each inner field through its own presence/emission logic instead of a single shared conditional — likely mirroring render-module.ts's existing "group-lift inner field hoisting" pattern (hoisting a helper's inner named fields onto the parent struct) for the template side too.

## `ki-sclass-residuals` — Round-trip-fidelity residual inventory — the corpus failures behind the committed S-class ceilings

**Found during:** the floor-ratchet + S-class-gate work that closed out the round-trip-fidelity restoration program's final phase. The live SSOT for these counts is `packages/tools/sclass-ceilings.json` (per-grammar ceilings the `validate counts` run enforces) + `packages/tools/validation-report.json` (the classified entries themselves) + `packages/tools/baselines/native.json` (exact pass floors and per-validator `failingKinds`). This entry names the failure *clusters* so each can be chipped at as its own work item — chip one, lower its ceiling in the same commit.

- **S1 — remaining alias-identity rows.** The former "native coords unresolved for alias target" from() cluster (~34 rows) was a locator artifact for scalar-materialized text leaves and is FIXED — those kinds now compare via the string route (`from(text)` vs `factory(text)`); the refusal survives only for non-text kinds without native coords (rust `block_comment`). The transport alias-unwrap pair and the `_static_marker` rows are also FIXED (leaf-trial dispatch on alias-wrapper arms + the closure's `subtypeParseNames` feeding per-slot alias arms; `keywordRefWireIdentity` for the marker stamps). What remains under S1 is the parsekind-noninjective diagnostics only (3 rust / 3 python / 9 typescript) — static modeling warnings, no runtime failures.
- **typescript `rest_pattern` reparse** (2 corpus entries × shallow+deep: "Tuple types", "Extends" — `re-parse error [ERROR in subscript_expression at "..."]`). The reparse wrapper embeds the rendered `...` in a subscript context where it can't parse — likely a wrapper-selection artifact rather than a render defect.
- **rust rrp residuals**: "Raw string literals" reparse error; "Macro definition" reparses `token_tree_paren` where `delim_token_tree_paren` was rendered — reparse-wrapper alias artifact, same class as the typescript `rest_pattern` bullet above. (The former `$`-drop and mixed-array order-loss rows are FIXED: the token-tree repeats are now fielded so the read keys every element into one ordered array, and alias-of-terminal arms are first-class — `a!($())` round-trips byte-perfect. The former `use_declaration` "Derive macro helper attributes" `render: Missing field \`_content\`` rows are FIXED — the validator's leading-trivia offset helper now derives trivia width by differencing two engine renders instead of standalone-rendering raw embedded trivia entries, whose decode has no verbatim fallback outside `TriviaTransport`.)
- **S4 — `union-slot-mixed-row` grammar diagnostics** (typescript `binary_expression`/`_jsx_opening_element_content`): static modeling warnings, order-lossy or singular mixed rows.
- **typescript `_separator_kind: unexpected extra field on factory output`** (×9): the factory stamps a `_separator_kind` the read reference doesn't carry (or normalizes differently) — inverse-direction sibling of the trailing-sep gap.
- **python `_content: value "0"/"3"/"3j" ≠ undefined`** (×5, all `_simple_pattern_negative`): the factory output is missing `_content` because `nodeToConfig` drops the slot — polymorph FORM kinds are excluded from factory metadata (`buildFactoryMap`'s `polymorphFormKinds` gate for `factoryShapes`/`factorySlots`), and this form is additionally absent from `factoryFields` because `collectAliasSourceKinds` walks only direct slot values while `_simple_pattern_negative` is reachable solely through the `_simple_pattern` supertype expansion. NOT the render-side `-` defect (that row is fixed); closing this needs a decision on how polymorph forms surface factory metadata.

**Status: documented exclusions — every count above is pinned by the committed ceilings; a fix must lower the matching ceiling in the same commit (the gate prints a reminder when a class drops below its ceiling).**

## `ki-perfield-flank-residual` — five kinds keep per-field flank capture until their own designs land

**Found during:** the separated-list redesign (visible list kinds + kind-level `_trailing_sep`/`_leading_sep`/`_separator_kind` keys). Every enrich-owned flank-carrying list now classifies `separatedList` and carries the kind-level keys; per-field `_<field>_trailing_sep` capture survives on exactly five kinds whose list shape can't be a plain separated list yet:

- **rust `tuple_expression` / `tuple_type`** — the mandatory-first-separator family (`pair pair* elem?`): a single-element instance structurally REQUIRES the trailing separator (`(1,)` vs a parenthesized expression), so the shape is not language-equal to a classic separated list and the run hoist deliberately declines it. Needs the separator-possession design (the S3 family) to model "every element separator-terminated, last optionally bare".
- **python `print_statement_group1` / `print_statement_group2` / `_expression_statement_tuple`** — override-authored bodies in the leading-mandatory family; enrich does not rewrite authored override bodies, and their lists are entangled with the chevron/polymorph machinery.

The validator's suffix-discovery options helper (`separatedListFactoryOptions`, `packages/tools/src/validate/common.ts`) is retained for exactly these config-shaped factories — do not delete it while any generated wrap still emits a field-prefixed flank key (auditable via `rg '_\w+_(trailing|leading)_sep' packages/*/src/wrap.ts`).

**Fix, if/when prioritized:** per family — the tuple design retires the rust pair; rewriting the print/expression-tuple overrides to reference visible list kinds (the `case_tuple_pattern` precedent) retires the python trio.

## `ki-from-string-composition` — Rust `from.string` / `from.comment` canonical factories are not emitted — composition needs a design decision

**Found during:** re-pinning `packages/codegen/src/scm/__tests__/scm-roles.test.ts`. Rust's `string_literal` factory takes a config with an explicit `stringOpen` slot (the open-quote token variant: `"`, `b"`, …) plus an `elements` array, so `emitFromString` has no single-positional-child surface to compose and deliberately skips rather than inventing a default quote style (`line_comment`'s content-node shape skips `from.comment` the same way). The test now pins the absence.

**Fix, if/when prioritized:** a composition rule needs an explicit decision on the default open-quote (probably plain `"` with sub-entries like `from.string.raw(...)` for other variants) — an overrides-level declaration, not an emitter heuristic. Flip the scm-roles pin when it lands.

