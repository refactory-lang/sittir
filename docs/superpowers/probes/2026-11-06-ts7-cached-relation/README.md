# TypeScript 7 accepts a build form TypeScript 6 rejects

A parenthesized TypeScript expression has two build forms on the portable grammar map: a sequence, with no type, and any other expression, with an optional type. A literal that pairs a sequence with a type fits neither form. TypeScript 6 rejects it. TypeScript 7 (`typescript@7.1.0-beta`, the native compiler) and tsrs (its port, which every repo type-check runs) reject it too, unless the program has already related the path's read to its input. After that check they accept it.

`typed-sequence.ts` is the whole repro: line 8 relates the read to the input, and line 13 is the literal.

| checker | line 8 present | line 8 removed |
| --- | --- | --- |
| TypeScript 6.0.3 | rejects line 13 | rejects line 13 |
| TypeScript 7.1.0-beta | accepts line 13 | rejects line 13 |
| tsrs 0.20.1 | accepts line 13 | rejects line 13 |

The same order dependence turns up in the grammar packages. `readsFitInputs`, in `packages/<grammar>/tests/build-forms.portable.test-d.ts`, relates every path's read to its input, and any later negative check on a build form can be skipped silently. That is why those files hold only positive checks. Negative checks go in `*.portable.ts6.test-d.ts`, which only the TypeScript 6 lane of the portable conformance ratchet checks.

## What it is not

- Not a missing key. Both forms state every member of the path: the sequence form marks `type` absent, and the other form leaves it optional.
- Not reproduced without the map's depth. The same `Applied` and `Inputs` shapes over small hand-written interfaces relate correctly under both checkers. Bisecting by path finds one other path whose fit check alone has the same effect: `argument`.

## Run

From the repo root:

```bash
node node_modules/typescript/bin/tsc -p docs/superpowers/probes/2026-11-06-ts7-cached-relation/tsconfig.json --pretty false
pnpm exec tsrs -p docs/superpowers/probes/2026-11-06-ts7-cached-relation/tsconfig.json --pretty false
node node_modules/typescript6/bin/tsc6 -p docs/superpowers/probes/2026-11-06-ts7-cached-relation/tsconfig.json --pretty false
```

Only the TypeScript 6 run reports TS2322 at line 13.

Not filed upstream.
