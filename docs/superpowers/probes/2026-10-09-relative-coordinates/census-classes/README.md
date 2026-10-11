# What the snapshot census's whitespace differences are

`dump.mts` writes the live and snapshot renders of every corpus entry where they differ (the entries `../snapshot-census.json` names). `classify.py` aligns each pair line by line and classes every differing region:

- **(i) in-line spacing:** two lines that differ only in spaces within the line, at the same indentation.
- **(ii) layout inside a template:** a line's indentation (`ii-indent`), or line breaks and blank lines (`ii-break`). Where an empty body breaks in one render and not the other, the alignment misplaces the region's edges; in an entry that differs only in whitespace, such a region counts as `ii-break`.
- **(iii) layout beside a comment:** a line break or blank line between a comment and the node it leads or trails.
- **(iv) anything else.**

```sh
SITTIR_BACKEND=native pnpm exec tsx docs/superpowers/probes/2026-10-09-relative-coordinates/census-classes/dump.mts /tmp/dump.json
python3 docs/superpowers/probes/2026-10-09-relative-coordinates/census-classes/classify.py /tmp/dump.json
```

## Results

Entries holding each class (an entry may hold several):

| grammar | entries | (i) | (ii) | (iii) | (iv) | only (i) |
| --- | --- | --- | --- | --- | --- | --- |
| rust | 79 | 35 | 47 | 9 | 0 | 23 |
| typescript | 60 | 26 | 41 | 2 | 1 | 18 |
| python | 45 | 19 | 28 | 4 | 0 | 15 |
| scm | 14 | 1 | 13 | 1 | 0 | 1 |
| regex | 1 | 0 | 1 | 0 | 0 | 0 |

The typescript (iv) entry is the one text difference: the read drops an `ERROR` placed on a `predefined_type` enum leaf.

Across the (i) line pairs, the snapshot adds spaces in 107, removes them in 73, and moves them in 8. Some additions are seam defaults that read wrong, not a house style:

- rust `*const` becomes `* const`, `'static: 'static` becomes `'static : 'static`, `$/` becomes `$ /`;
- typescript `void;` becomes `void ;`;
- python `print()` becomes `print ()`;
- scm `(MISSING program)` becomes `( MISSING program )`.

Others are the defaults doing their job, as with rust `en_greetings ;` becoming `en_greetings;` and `<RHS=Self>` becoming `<RHS = Self>`.

Examples of each class:

| class | grammar | live | snapshot |
| --- | --- | --- | --- |
| (i) | rust | `use … as en_greetings ;` | `use … as en_greetings;` |
| (i) | python | `print()` | `print ()` |
| (ii) indent | typescript | `    let numberOfGreetings: number;` | `  let numberOfGreetings: number;` |
| (ii) indent | python | `  return answer;` | `    return answer;` |
| (ii) break | rust | `async { let x = 10; }` | `async {⏎    let x = 10;⏎}` |
| (ii) break | scm | `(program⏎  name: (_))` | `(program name: (_))` |
| (iii) | typescript | `function bar()⏎  // above is a function declaration` | `function bar() // above is a function declaration` |
| (iii) | rust | `ok! {⏎  // one⏎  /* two */` | `ok!{// one⏎/* two */}` |
