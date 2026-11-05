# Feature scrub probe

Scripts behind section 5 of `docs/superpowers/notes/2026-11-05-portable-features-proposal.md` and its matrix
(`2026-11-05-portable-features-matrix.tsv`). Throwaway: they read absolute scratch paths and the probe grammars on this branch.

- `rows.mts` lists every vocabulary kind and feature-owned or core-gap member, with python, rust and typescript's measured holds.
- `measure.mts <grammar...>` runs `derive()` on a grammar's bindings and lists the kinds and members it holds (go and c here).
- `paper_rules.py` holds the paper judgments for swift, go, java, c#, c and c++ as path-prefix rules; `matrix.py` joins rows, measurements and rules into the matrix.
- `cuts.py` computes the granularity cuts, the splits a fourth grammar needs, and the targeted family cut.
- `nt-summary.py` summarizes an upstream `node-types.json`; `check-bindings.mts` compiles a grammar's `bindings.scm`.

The probe grammars (go, java, csharp, c) are unstable and outside every gate. Their compositions in `compositions.ts` extend every
feature, so their claims are measured ungated.
