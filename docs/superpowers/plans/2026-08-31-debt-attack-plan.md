# Debt attack plan — TODO.md + KNOWN_ISSUES.md, ordered by dependency

Working order for the open debt register. Items are named by ki-id or by
substance (file/symbol), never by TODO line number. Each wave assumes the
prior one landed; within a wave, items are independent.

## Wave 0 — in flight now

- 3f static spacing (agent, three steps: `patternTrailingEdgeClass`
  canonical classifier → byte-identical post-assemble spacing stamp →
  RawWriter downgrade slice).
- Slot-accessor PR review/merge; cleanup-track commit routing
  (KNOWN_ISSUES prune + NodeMemberValue boolean split + dead
  `nodeData.ts` scaffolding deletion).
- USER DECISION pending: `ki-from-string-composition` default open-quote.

## Wave 1 — short, high-confidence, immediately after 3f lands

1. `ki-from-default-empty-delimiter` — one emitter site
   (`canDefaultToEmpty`) kills the biggest generated-type-error cluster;
   ratchet the whole-repo type-check count down and pin the new floor.
2. Lint/format debt sweep — `oxlint --fix` + `oxfmt` over the standing
   offenders (unused imports, the four pre-branch format offenders) as
   one dedicated commit; ratchet lint clean on the touched set.
3. `ki-interp-brace-padding` — delete the walker-authored padding inside
   interpolation templates; template text is the sole owner of those
   spaces. Corpus rows pin; render-parse floors may only rise. Do this
   right after 3f because it edits the same walker.
4. `ki-dict-pattern-comma` — diagnosis first (`probe-kind -g python -k
   dict_pattern --reparse`) under the current separator-as-slot model,
   then fix at the flank capture, not the template.

## Wave 2 — the model-facts arc (implements standing rulings)

5. Values-entry multiplicity override (ruled): one slot may carry values
   whose multiplicities disagree (`if_statement.alternative`); the
   overrides surface may override multiplicity per values entry, and
   storage/factory/transport/config derive from per-value multiplicities,
   not slot-level rollups.
6. Retire duplicate interpretations of the same fact — multiplicity is
   the four-way cardinality SSOT; `arity`/`isRequired`/`isMultiple`
   become (or are replaced by) derived rollups; `slotModel` vs
   `slotClass` unified the same way. Byte-identical refactor class.
7. Magic strings and hoisting rules onto the model — unnamed-slot
   storage/display fallbacks, factory-shape attribute on the model and
   slot; emitters consume stamps.

## Wave 3 — the emitter-predicate arc

8. Split `classifyChildFactorySurface` into one named predicate per
   question (factory calling convention; from-coercer shape; wrap
   `$with` shape; test call shape; ir namespacing; array auto-wrap
   eligibility). First land as byte-identical (all six return today's
   answer), then fix per-consumer divergences individually.
9. Container-vocabulary cleanup — the ~56 stale `container` mentions the
   predicate split unblocks; keep the genuine wire-shape facts
   (`$other` vs `_<slot>`).
10. Hoisting parity — factory-parameter hoisting rules applied to
    getters/setters.

## Wave 4 — fidelity residue and suite hygiene

11. Triage the pre-existing suite failures as a body of work (codegen 15,
    tools 21, incl. the `_keepModelledSlots` harness gap): classify each
    fix/pin/delete; ratchet the counts.
12. `ki-let-destructuring-parse-divergence` — dynamic-precedence
    tie-break in the ts override grammar restoring upstream's `let [`
    resolution (python's `primary_expression`/`list_splat_pattern`
    treatment is the precedent) + a corpus entry exercising
    statement-level let-destructuring.
13. `ki-sclass-residuals` chipping — the three read-render-parse floor
    shortfalls, S4 union-slot-mixed-row, and python
    `_simple_pattern_negative` (×5). The last needs a DESIGN DECISION on
    how polymorph forms surface factory metadata — couple it with the
    polymorph-shape reconsideration (AssembledPolymorph as a
    branch subclass; `node.hidden` as factory-emission SSOT; SlotClass
    as branch-factory SSOT). Each chip lowers its ceiling in the same
    commit.
14. `ki-exercise-span-transport` — root-cause why exercise-built nodes
    reach the transport with partial `$span`s (read-stub surviving
    `nodeToConfig`); fold the examples-realizable pass in here.

## Wave 5 — big rocks (phase-4 candidates; decide scope together)

15. Legacy-core retirement — port the remaining diagnostic/validator
    consumers (read-render-parse, common, perf, probe/kind, bench,
    collect-baseline TS mode, exercise read path, format-roundtrip
    type import) off `@sittir/legacy-core` to the native read, then
    delete the package.
16. `$text` content/provenance split (spec
    2026-08-26-text-content-vs-source-provenance) — the coordinate
    carrier, dead transport fields, custom-sink end-state (absorbs
    whatever of the writer layer 3f's RawWriter slice leaves), and the
    unreachable per-file-format bug it surfaced.
17. Declared `XTree` types + annotated wrap returns (fixes drill-in
    typing without the non-terminating inference) — explicitly decided
    TOGETHER with the `$text` split's stamped-interface design; then the
    layered-setters enhancement, and `AnyNodeData` retirement falls out.

## Parked / opportunistic (no scheduled wave)

- `ki-emitsymbol-fielded-seq` — proactive flag; act only when a grammar
  exercises the shape.
- Deprecated/silent-failure/silent-warning sweeps — fold into whichever
  wave touches the file; not standalone projects.
- Single-phase method consolidation (infigraph callers + lsproxy moves)
  — hygiene filler between waves.
- Manifest native-vs-js impact split — build QoL, any time.
- Four parked review threads on the merged phase-3 stack — revisit at
  wave-4 triage.
- typeGuards asserting concrete T — small; ride along with wave-5 typing
  work.
