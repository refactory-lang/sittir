# Handoff — VARIANT removal (TODO 10), and what's around it

Paste from the `---` line down.

---

Work from a fresh branch stacked on `from-empty-list-default` (always
stack; three PRs are open and unmerged: #252 slot-accessor →
#253 3f → #254 brace/lint/overlay). Session memory:
`get_latest_session`. Read
[docs/compiler-phase-glossary.md](../../compiler-phase-glossary.md)
before touching the pipeline.

## Read this before planning: TODO 10 is not a mechanical removal

The item says "remove references to `VARIANT` and the VARIANT type
itself." The reference count makes that sound like a sweep — 104 in
`packages/codegen/src` production source across 20 files, 23 more in
tests, 1 in `packages/tools/src/validate/common.ts`. It is not a sweep.

`VARIANT` is a live rule type (`types/rule-types.ts:7`) with a
`VariantRule` interface (`types/rule.ts:172`) carrying **`name`**, and
that name is load-bearing: polymorph variants are classified in link
from `variant()` metadata, and the label survives into the generated
overlay's namespaced constructors. Deleting the node without deciding
where its name lives would silently drop variant identity.

It is minted in exactly four places:
- `dsl/builders.ts:252,427` — the user-facing `variant(name, content)`
  builder, called from `packages/<lang>/grammar.sittir.ts`
- `compiler/normalize.ts:372,429` — re-wrapped to preserve the name
  while normalizing the body

Everything else is consumption: switch arms, and
`unwrapStructuralPassthroughs` (`compiler/model/node-map.ts`), which
peels `VARIANT` and `GROUP` alike. `GROUP` is the sibling passthrough
with a near-identical footprint (105 mentions) and no name — worth
deciding both together rather than twice.

**So the first deliverable is a decision, not a diff:** where does the
variant name live once the rule node is gone? Candidates worth costing
before writing code — a stamped attribute on the wrapped node (the
`tokenized`/`immediate`/`staticSeamBefore` precedent), a link-time
side table keyed by rule id, or keeping `VARIANT` as a DSL-only
construct that link dissolves so no phase after link ever sees it.
That last one is the smallest and matches how the phase-3 notes
describe the intent ("VARIANT/GROUP left the rule vocabulary" — which
turned out to mean the *assembled model* vocabulary, not the rule
vocabulary; the rule type is still very much alive).

Write a plan before code, and confirm the naming path with the user —
this is architectural, not clean-up.

## Gates (exact — ratchets only tighten)

- `set -o pipefail; pnpm run validate:native` — exit 0, floors exact:
  coverage 208/208 · 194/194 · 142/142; factory-render-parse
  1519 · 1202 · 1390; read-render-parse 134/137 · 112/114 · 115/116
  (the three shortfalls are pre-existing floors); from()
  149/149 · 145/145 · 126/126. Fixtures 1486 · 1500 · 1361
  (rust · typescript · python — that order, it is easy to get backwards).
- `pnpm -C packages/codegen run type-check` — 4 pre-existing errors.
  `pnpm -C packages/tools run type-check` — 1. Whole repo — 46.
  Per grammar: rust 30, typescript 5, python 5.
- `pnpm -C packages/codegen exec vitest run` — 15 pre-existing failures
  / 1089 passed / 1 skipped. Use exactly this invocation from inside the
  package; `vitest run <path>` from the repo root resolves a different
  config and undercounts. Baseline-diff by test NAME.
- If VARIANT dissolves before assemble, generated output should be
  byte-identical — make that the gate. If it cannot be, say why in the
  plan before proceeding.

## If you would rather take something mechanical first

TODO 29 — split `classifyChildFactorySurface`
(`emitters/shared.ts`) — is the better-shaped slice. One predicate
answers six different questions for eight call sites (factory calling
convention; from-coercer shape ×3; wrap `$with` shape ×2; test call
shape ×3; ir namespacing; array auto-wrap eligibility), and that
conflation is why any change to the child/slot surface cascades. Land
it byte-identical first — all six predicates returning today's answer —
then fix per-consumer divergences one at a time. It also unblocks
TODO 14 (the ~56 stale `container` mentions).

## Standing constraints

Commit by pathspec (`git commit -- <paths>`); never commit `TODO.md`,
`examples/*`, `tsconfig.json`, `packages/tools/validation-report.json`
(deliberately dirty). Comments never go in `packages/codegen/src` —
rationale lives in `docs/glossary/<dir>.md`. No spec/plan/PR/task
numbers in docs or comments. Generated outputs are never hand-edited.
The manifest pre-commit hook trips on python's nondeterministic
`.sittir/grammar.js` reorder — regenerate python, restage, retry. It
also trips on a STALE-BINARY check if you touch a `.jinja` without
rebuilding that grammar's napi crate.

Two things need the user, not you: the rust `from.string` default
quote style (blocks `ki-from-string-composition`), and whether the
style-spacing gap matters — rendered output drops style spaces
(`const[c]=[]`, `{1:a,2:b}`), reparse-safe and pre-existing, but a
`FormatCtx` question that keeps surfacing.

## Two lessons from the last session, both earned the hard way

- **Verify an item's premise before working it.** Six of eleven
  KNOWN_ISSUES entries were already fixed and only documented as open,
  and one carried a stated fix that would have broken the build.
  Probe first; the entry's own description is not evidence.
- **Never trust a type-level change validated on one site.** A
  `never`-safe config helper typechecked on a single hand-edited method
  and produced 330 rust / 29 typescript / 41 python errors once emitted
  across the board. Emit it everywhere and re-measure before believing
  it.
