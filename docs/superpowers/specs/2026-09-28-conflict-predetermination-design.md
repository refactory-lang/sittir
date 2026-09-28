# Conflict predetermination

**Status:** Design, approved in conversation. No plan yet.

## Problem

enrich and wire reshape upstream rules (lifts, groups, variants, fields,
renames). A reshaped rule can meet an LR conflict that the upstream grammar
never had, and `tree-sitter generate` then fails. Today such conflicts are
written by hand in `grammar.sittir.ts` (for example python's `conflicts:` list).
Every reshaping change risks a new one, and nothing checks that a hand-written
entry is still needed.

## Goal

A grammar's conflicts are derived, not written, and upstream's dynamic
precedences survive reshaping. Generation reaches zero unresolved conflicts without hand-written
conflict entries, and the derived set is exactly what the final grammar needs:
no entry that tree-sitter would call unnecessary.

## Source of truth: tree-sitter's conflict summary

`tree-sitter generate --json-summary` reports the first unresolved conflict as
JSON and stops. Shape, measured on tree-sitter 0.26.9:

```json
{ "BuildTables": { "Conflict": {
  "symbol_sequence": ["_expr", "'+'", "_expr"],
  "conflicting_lookahead": "'+'",
  "possible_interpretations": [
    { "preceding_symbols": ["_expr", "'+'"], "variable_name": "binary",
      "production_step_symbols": ["_expr", "'+'", "_expr"],
      "step_index": 1, "done": false,
      "conflicting_lookahead": "'+'", "precedence": null, "associativity": null }
  ],
  "possible_resolutions": [
    { "Associativity": { "symbols": ["binary"] } },
    { "AddConflict":   { "symbols": ["binary"] } }
  ]
} } }
```

The loop reads only this report. It never re-derives LR states itself.

## Design

### The loop

Generation runs:

1. Evaluate the grammar with the current resolutions (below).
2. Run `tree-sitter generate --json-summary`.
3. No conflict reported: done.
4. A conflict reported: choose one resolution by the policy, add it to the
   resolutions, and go to 1.

The loop terminates with a blocking diagnostic, `conflict-unresolvable`, when:

- the same conflict (same `symbol_sequence`, lookahead and interpretations) is
  reported twice, meaning the chosen resolution did not resolve it;
- no resolution the policy can use is offered; or
- the iteration cap is reached. The cap is the number of rules in the grammar,
  since each resolution names at least one rule.

### Resolutions reach both runtimes through one generated file

The loop writes `packages/<grammar>/.sittir/resolutions.json` beside the other
generated outputs (`parser.c`, `grammar.json`). It is generated, never
hand-edited, and it is regenerated whenever the grammar is regenerated.

`sittirGrammar` reads it when the grammar module loads and merges its entries
into the grammar options. Both runtimes, tree-sitter's CLI running the bundled
`grammar.js` and sittir's evaluate, run the same `sittirGrammar`, so both see the
same conflicts and precedences. `parser.c` and sittir's model cannot disagree.

`resolutions.json` records the hash of the evaluated grammar it was derived
from, without the resolutions themselves. When the hash matches, generation uses
the file as it is and runs `generate` once. When it differs, the loop re-derives
from empty, so an entry the changed grammar no longer needs cannot survive.

### Every conflict is derived

The final `conflicts` array does not include `previous`. Upstream's declared
conflicts are dropped, the same way an extension may filter `previous`, and
every conflict the final grammar needs is re-derived by the loop.

Hand-written entries in `grammar.sittir.ts` are retired. After migration, any
`conflicts:` entry written in a `grammar.sittir.ts` is a blocking diagnostic,
`conflict-authored`, since the loop owns the set.

### Policy: which resolution the loop applies

Every reported conflict is resolved with `AddConflict`. The loop never applies a
static precedence or associativity: upstream's own static precedences stay as upstream
wrote them, and the probe shows that declaring every conflict reproduces today's
parsers exactly.

A declared conflict is settled at parse time by dynamic precedence (`prec.dynamic`).
That is upstream's own tie-breaker, so it must survive reshaping. For every rule in a
derived conflict, the loop compares the dynamic precedence of the rule's upstream
source (below) with the dynamic precedence the reshaped rule carries:

- **Carried:** nothing to do.
- **Lost:** the reshaped rule gets its source's `prec.dynamic` copied onto it. Each
  copy is recorded and reviewed, since it changes the parser toward upstream's parse.

A first census over the five grammars decides which of these exists today. If no
dynamic precedence is lost, the check stays as the blocking diagnostic
`conflict-dynamic-precedence-lost`, and parsers stay identical to the current ones.

### Finding the upstream source of a reshaped rule

The dynamic-precedence check needs the upstream rule a reshaped rule came from. It
reads the records enrich and wire already keep; no
name matching:

- wire's rename records, which include lifts;
- the variant annotation (`variantOf`), which wins over a rename on the same rule.

A name upstream defines, as a rule or an external, is its own source. A promoted group
keeps its upstream name (its visible name is an alias, never a rule). Any other sittir
mint has no upstream source, so there is no dynamic precedence to compare.

### Diagnostics

- Each derived resolution is a record in `grammar-diagnostics.json`: the conflict,
  the resolution applied, and which policy step chose it. Records are
  informational.
- `conflict-unresolvable` (blocking, not floorable): the termination cases above.
- `conflict-authored` (blocking, not floorable): a `conflicts:` entry written in
  `grammar.sittir.ts`.
- `conflict-dynamic-precedence-lost` (blocking, not floorable): a rule in a derived
  conflict lacks the dynamic precedence its upstream source carries.
- An upstream conflict the loop never re-derives is recorded as unnecessary in
  the final grammar (informational). It shows what reshaping removed.

## Testing

- A fixture with `binary: _expr '+' _expr` converges to `AddConflict`.
- A fixture whose upstream rule carries `prec.dynamic`, reshaped into a variant that
  lost it, gets the dynamic precedence copied (or raises
  `conflict-dynamic-precedence-lost` while the census finds none).
- python: with its four hand-written conflicts deleted, generation converges, and
  the derived set replaces them. `parser.c` is byte-identical when the derived set
  equals the removed one; any difference is reported for review.
- All five grammars converge. A second generate with an unchanged grammar runs
  `tree-sitter generate` once; after a grammar change the set is re-derived from
  empty.
- Termination: a fixture whose only offered resolution is unusable stops with
  `conflict-unresolvable`.
- `resolutions.json` is regenerated, not hand-edited: the generated-output
  hygiene checks cover it.

## Out of scope

- Applying static precedence or associativity to resolve a conflict.
- Precedence declarations upstream wrote outside `conflicts` (its `precedences`
  list, `prec` on rules). They are kept as upstream wrote them; only the
  `conflicts` array is re-derived.
