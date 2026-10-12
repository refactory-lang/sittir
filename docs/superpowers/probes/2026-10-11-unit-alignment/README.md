# Unit alignment: the cost of a rebuilt list's unit sides

`reversal-cost.mts` measures one rebuild: a typescript program of `n` call statements (4000 by default) behind one unit statement that carries a comment (`// A⏎;`). The probe reverses the statements through `$with.statements(…)` and renders the result. It prints the wall time and the heap the rebuild and its render add.

A rebuilt list carries its unit children's sides by aligning the old items with the new ones in anchor runs. This probe checks that the alignment stays linear in the list's length, in both time and memory. Set `NOUNIT=1` to drop the unit, which gives the same rebuild with nothing to align as a baseline.

```bash
pnpm exec tsx docs/superpowers/probes/2026-10-11-unit-alignment/reversal-cost.mts           # 4000 statements
pnpm exec tsx docs/superpowers/probes/2026-10-11-unit-alignment/reversal-cost.mts 16000     # scale n; time and heap should grow linearly
NOUNIT=1 pnpm exec tsx docs/superpowers/probes/2026-10-11-unit-alignment/reversal-cost.mts  # baseline with no unit
```

Run it from a checkout whose typescript native is built. The test that pins the behavior is `packages/typescript/tests/trivia-ownership.test.ts`, which reverses 2000 statements and keeps the unit's comment.
