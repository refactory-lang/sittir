# Known Issues

Running list of known, non-blocking gaps discovered during feature work — documented here rather than silently forgotten, but not urgent enough to have blocked the work that found them. When one gets fixed, delete its entry rather than marking it done.

Every entry heading starts with a stable backticked `ki-*` id — refer to an entry by that id (in conversation, commits, or across sessions); ids never renumber when neighbors are deleted, and a fixed entry's id simply disappears with it. Pick unused ids for new entries.

Suggested attack order (by payoff ÷ effort; remove a line when its entry is deleted):

1. `ki-diagnostic-residuals` — the error rows behind the non-zero diagnostic ceilings, biggest first
2. `ki-from-string-composition` — blocked on a quote-style design decision
11. `ki-emitsymbol-fielded-seq` — proactive flag only; act when a grammar exercises the shape

## `ki-emitsymbol-fielded-seq` — `emitSymbol`'s generalized hidden-helper inlining doesn't yet handle a fielded sequence inside the inlined target

**Found during:** indent-aware rendering for python (`rrp-ast-match-sweep`), generalizing `emitSymbol` (`packages/codegen/src/emitters/templates.ts`) so a NAMED field wrapping a hidden `inline: true` target (e.g. `function_definition.body` → `_suite`) inlines the target's `renderRule` the same way an unnamed group-lift helper already does, instead of always emitting an opaque `{{ body }}` slot reference. Confirmed via a full-grammar scan: 46 total "named field → hidden inline:true target" occurrences across the 3 grammars (python 11, all → `_suite`; rust 12 and typescript 23, all → 0-slot `pattern`/`enum` leaf wrappers like `_type_identifier`/`_semicolon`) — the fix was applied generically to all 46 since the non-`_suite` targets have no internal structure to be affected by inlining.

The generalization was verified safe for every CURRENT occurrence (`_suite`'s own 3 choice arms declare no fields of their own; the 35 pattern/enum targets have zero slots), but the inlining logic itself does not yet handle the case where the inlined target's content is a `seq` whose members are ALL themselves field-wrapped (as opposed to `_suite`'s arm-2 shape, `seq($._indent, $.block)`, where only the `$.block` member is field-addressable and `$._indent` is a bare terminal). If a future grammar or override introduces a hidden `inline: true` helper referenced from a named field where every seq member carries its own `fieldName`, the current inlining path's conditional-gating logic (keyed on a single `condKey`, preferring the outer field's own name) has not been exercised against that shape and may need additional handling — e.g. surfacing each inner field independently rather than gating the whole inlined body on one presence check.

**Status: not yet encountered, flagged proactively during design review — not blocking the current fix.**

**Fix, if/when prioritized:** when a future case exercises this shape, extend `emitSymbol`'s inlining block (`packages/codegen/src/emitters/templates.ts`, the `if (rule.type === SYMBOL && rule.inline === true)` branch) to detect "target's own top-level rule is a SEQ whose members are all field-wrapped" and route each inner field through its own presence/emission logic instead of a single shared conditional — likely mirroring render-module.ts's existing "group-lift inner field hoisting" pattern (hoisting a helper's inner named fields onto the parent struct) for the template side too.

## `ki-diagnostic-residuals` — the error rows behind the non-zero diagnostic ceilings

**Found during:** the per-code diagnostic ratchet work. The live counts are `packages/tools/diagnostic-ceilings.json` (per grammar, the error and warning rows each code may have; a code a grammar does not list has ceiling 0) and `packages/tools/validation-report.json` (the rows themselves). Every non-zero ceiling is a grammar diagnostic at severity `error` that regeneration does not stop on:

- `rule-reauthored-without-cause` — python 4, rust 4, typescript 1.
- `patch-without-cause` — python 4.
- `unclassifiable-shape` — rust 1, scm 1, typescript 2.
- `union-slot-mixed-row` — typescript 1 (`binary_expression`, allowed by the grammar's `expectDiagnostics`).

**Status: open.** Each row is held at its count by its ceiling. A fix lowers the matching ceiling in the same commit; the gate prints a reminder when a code drops below its ceiling. Why each of these error rows lets regeneration continue, and whether any is residue of an older design, is not yet audited.

## `ki-let-destructuring-parse-divergence` — the typescript override parser never parses `let [...] = ...` as a declaration

**Found during:** closing the `rest_pattern` reparse rows — their wrapper (`let [${r}] = [];`) never reparsed because of this, not because of wrapper selection.

The override parser resolves `let [`'s declaration-vs-subscript ambiguity to the EXPRESSION fork: `let [c] = [];` parses as `expression_statement > assignment_expression > subscript_expression(object: reserved_identifier, ERROR, …)` — even the simplest array-destructuring `let` fails, while `const [c] = [];` (unambiguous keyword) parses correctly, and upstream tree-sitter-typescript parses the `let` form as a `lexical_declaration`. A GLR tie-break in the override grammar diverges from upstream's here (`let` doubles as a reserved identifier, so `let [` genuinely forks). No corpus entry currently exercises statement-level `let`-destructuring, so no validator row pins this — but it corrupts any real-world source using the construct. Fix belongs at the grammar level (a dynamic-precedence tie-break restoring upstream's resolution, the `primary_expression`/`list_splat_pattern` treatment in python's grammar being the in-repo precedent), not in consumers.

## `ki-from-string-composition` — Rust `from.string` / `from.comment` canonical factories are not emitted — composition needs a design decision

**Found during:** re-pinning `packages/codegen/src/scm/__tests__/scm-roles.test.ts`. Rust's `string_literal` factory takes a config with an explicit `stringOpen` slot (the open-quote token variant: `"`, `b"`, …) plus an `elements` array, so `emitFromString` has no single-positional-child surface to compose and deliberately skips rather than inventing a default quote style (`line_comment`'s content-node shape skips `from.comment` the same way). The test now pins the absence.

**Fix, if/when prioritized:** a composition rule needs an explicit decision on the default open-quote (probably plain `"` with sub-entries like `from.string.raw(...)` for other variants) — an overrides-level declaration, not an emitter heuristic. Flip the scm-roles pin when it lands.

