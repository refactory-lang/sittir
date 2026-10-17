# Round-trip fidelity restoration — implementation plan

> Governing spec: `docs/superpowers/specs/2026-08-02-round-trip-fidelity-restoration.md`.
> This plan sequences the work the spec's "End state" describes, phase by
> phase, mirroring the kindid-invariant-restoration plan's structure.

## Phase 0 — measurement + report integrity (no product change)

**Goal:** trustworthy per-class accounting before anything moves.

**Tasks:**

1. Dedupe mismatch attribution — report each failing corpus entry once at
   its root-cause kind, not per ancestor. This alone makes
   `dump-ast-mismatches --cluster` histograms match the metric deltas.
2. Itemize `from()` mismatches in `validation-report.json` — currently 3
   rows explain a 39-case gap.
3. Tag each validator row with its S-class (mechanical classifier over
   error shape) so `validate history` can report per-class deltas.
4. Per-kind corpus-coverage census — which kinds have zero rrp corpus
   exposure — to close the spec's category-(b) question (silent blind
   spots vs. attribution inflation).
5. Re-record baseline on clean master.

**Gate:** report row counts reconcile exactly with the counts-metric gaps
per grammar; baseline committed.

**Depends on:** nothing.

## Phase 1 — S1: context-alias storage identity (largest factory class, no parser change)

**Goal:** factory stamping, wrap materialization, transport accepted-kind
sets, and the factory validator's comparison all consume the same stamped
storage identity.

**Tasks:** audit the three consumption sites (factory `$type` stamping in
the factory emitter; wrap materialization kind selection;
`acceptedTransportKinds`/`buildSupertypeTransportSet` alias expansion — the
known visible-alias no-op stub is a named member); flip each to the
stamped `aliasedFromId`/`kindId` pair per the kindid-established pattern;
fix the two transport dispatch errors ("alias-wrapper kind id 436",
"unknown kind id 428") as the same flip at the accepted-set site.
Per-grammar sub-gates — python `block` ×17 is the cheapest first win.

**Gate:** factory AST-match +14 rust / +14 typescript / +18 python (→
~1062/947/828); rrp errors −2 typescript; `parsekind-noninjective` rows
unchanged (they describe grammar shape, not the bug) but no runtime case
cites an alias id anymore; no regression via `validate history`.

**Depends on:** Phase 0 (accounting); kindid stamps (landed).

## Phase 2 — S2: marker-slot population + canonical representation

**Goal:** every declared marker slot is populated by the native read
(nothing marker-shaped left in `$other`) and stores one canonical form all
four layers agree on.

**Tasks:**

1. Decide the canonical stored form for boolean-marker slots (recommend:
   boolean at the model surface, kind id on the wire — but decide once,
   stamp it).
2. Fix the native raw-read routing tables so marker anon-token ids map to
   their slots — diagnose why `for_statement`'s async marker populates
   while `function_definition`'s doesn't (suspects: enrich auto-promotion
   skipped when a user override exists; per-parent wrap-table emission
   gap) and fix the *mechanism*, not the kind.
3. Widen the per-slot transport `FromNapiValue` accepted forms to exactly
   the canonical form (kills the "expected u16 kind_id..." rejections:
   rust static/visibility/pointer_type, typescript required_parameter,
   python simple_pattern).
4. Align factory input-hint storage (`BooleanKeyword`) with the same
   stamp.

**Gate:** rrp errors −7 rust / −6 typescript; rrp AST mismatches −8 python
(async/yield-from/except*/f-string `=`); factory −12 rust marker rows;
`probe-kind` on the five probe cases shows the marker at every stage.

**Depends on:** Phase 0. Independent of Phase 1 (can run in parallel by
different owners; touching different layers).

## Phase 3 — S4: arity (singular slots receiving N)

**Goal:** no accessor-throw; slots' modeled arity matches grammar-permitted
arity.

**Tasks:** retype the flagged slots via the collect-slots union-routing
machinery: typescript `public_field_definition` (the
`union-slot-unaddressable` row — give the fieldless structural choice a
routable slot), rust `_let_chain.right`, typescript
`rest_pattern.lhs_expression`, python `parenthesized_list_splat.content`,
python `yield` union-routing ("cannot union-route" → the yield-from arm).
Templates/transports regenerate from the new arity.

**Gate:** accessor-throw 60 → 0; rrp errors −3 rust ("Missing _left") / −6
typescript; from-errors −2 typescript; `union-slot-unaddressable` count 1 →
0 (ratchet).

**Depends on:** Phase 2 (marker representation settles what a "value" is
before arity retypes); soft — can start on non-marker slots earlier.

## Phase 4 — S3: separator possession + nested-seq normalization

**Goal:** the 7 `seq-with-nested-seq` kinds normalized (separator
ownership modeled), and trailing-separator presence round-trips.

**Tasks:**

1. Normalize nested `seq(x, sep)` shapes at link/normalize into proper
   separated-group form (model-side only — no grammar/parser change).
2. Add trailing-separator presence as read state on array slots and
   consume it in templates (the walker currently has no bit to consult —
   this is the rust-tuple `(1,2,)` fix at root).
3. Sweep the trailing-comma corpus family.

Watch the multi-separator-template known limitation (one-separator-per-
field walker assumption) — in scope if it blocks a flagged kind.

**Gate:** `seq-with-nested-seq` 7 → 0 (ratchet, already error severity —
promote to blocking); rrp AST-match +8 rust / +4 typescript / +8 python
incl. the python dict_pattern reparse errors; byte-identity for all
non-flagged kinds.

**Depends on:** Phase 0 only; independent of 1-3. **This phase carries the
most model-shape risk** — slot names/shapes for 7 kinds change; factories
for those kinds churn.

## Phase 5 — S5: template projection completeness

**Goal:** every declared field referenced by a template; no choice-arm
literal drops; merged-slot interleave order preserved.

**Tasks:**

1. The 12 `coverage-missing-field` kinds — mostly typescript
   call_expression-family fields folded into `$CONTENT` (fix the walker's
   fold decision, not per-kind).
2. Choice-arm literal drops (known walker cluster: rust `..`, python
   `keyword_argument`/`list_splat`/`default_parameter`, string-prefix
   fidelity).
3. typescript `template_literal_type` interleave order (merged array slots
   must render in document order).
4. The `asserts` double-render residue.

**Gate:** cov 199/199, 191/191 (+127/127 holds); rrp AST-match +5 rust / +9
typescript / +6 python; the three typescript `asserts` reparse errors
gone.

**Depends on:** Phase 4 (walker changes stack; don't run two walker
rewrites concurrently).

## Phase 6 — S6: extras in the factory surface

**Goal:** factory round-trip handles comments/newline/line_continuation;
comment kinds render.

**Tasks:**

1. Fix the rust `line_comment` "Missing field _content" transport/template
   bug (small, immediate, could land any time).
2. Design decision for factory extras: either factories accept extras
   slots (surface change, ADR-worthy) or the factory validator's storage
   comparison treats read-attached extras as non-factory-owned state
   (comparison-policy change, documented). Recommend the latter — extras
   are attachment metadata, not construction inputs.

**Gate:** factory +6 rust / +6 typescript / +12 python (→ factory gap
closes to ~0 combined with Phase 1); rrp errors −4 rust.

**Depends on:** Phase 1 (factory comparison semantics touched once, in one
place).

## Phase 7 — S7 decision + tighten

**Goal:** resolve the ASI class; convert everything to permanent gates.

**Tasks:**

1. S7 decision: spacing model emits statement-terminating newlines
   (preferred) or comparator zero-width-token normalization with
   documented exclusion rows.
2. Ratchet validator counts to exact floors (pass=total everywhere, or
   total-minus-documented-exclusions).
3. Promote the S-class report tags from info to gate.
4. S8 validator-artifact fixes ("kind not found at rendered offset"
   locator).

**Gate:** typescript rrp AST-match +8; all three grammars at floor;
`validate history` shows monotone non-regression across the whole
program.

**Depends on:** Phases 1-6.

## Dependency / sequencing summary

| Phase | Class | Depends on | Est. case kills (rust/ts/python) | Parser change? | Primary gate |
|---|---|---|---|---|---|
| 0 | measurement | — | 0 (infra) | No | report/metric reconciliation |
| 1 | S1 alias identity | 0 | factory 14/14/18, rrp 0/2/0 | No | factory AST-match delta |
| 2 | S2 markers | 0 (∥ with 1) | rrp 7/6/8, factory 12/0/3 | No | rrp error delta + probes |
| 3 | S4 arity | 2 (soft) | throws −60, rrp 3/6/1 | No | accessor-throw 0, union-slot ratchet |
| 4 | S3 separators | 0 (∥) | rrp 8/4/8 | No (model-only) | seq-with-nested-seq 7→0 |
| 5 | S5 templates | 4 | rrp 5/9/6, cov +1/+9/0 | No | cov at total |
| 6 | S6 extras | 1 | factory 6/6/12, rrp 4/0/0 | No | factory at ~total |
| 7 | S7 + tighten | 1-6 | rrp 0/8/0 | No | floors ratcheted |

Sum closes rrp to total on rust/python and to total-or-documented on
typescript, and factory to total on all three. No phase changes the
parser — the entire program is model/emit/native-runtime surface, so
per-phase revert is a normal git revert, and phases 1, 2, 4 can be worked
in parallel by separate owners (different layers: factory/transport vs.
read tables vs. normalize/walker).

## Confidence

High on class boundaries and layer verdicts for the probed classes
(S1/S2/S3-rust). Medium on exact per-phase kill counts — they are
ancestor-dedup estimates; Phase 0 task 1 firms them up.
