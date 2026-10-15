# Grammar over-acceptance: where each grammar disagrees with its language

A census of three gaps between sittir's parsers and the languages they parse:

- **over-acceptance:** input the language rejects as a syntax error parses without ERROR;
- **under-acceptance:** valid input fails to parse;
- **mis-parse:** valid input parses clean into the wrong tree, which breaks a read's meaning and the claims that classify it.

Two sources feed it. The first is a set of witnesses, each run against three judges: sittir's parser (`packages/<g>/.sittir/parser.wasm`), the upstream parser it is built from, and the language's own compiler. The second is the four upstream trackers, `tree-sitter-{typescript,javascript,rust,python}`, with their issues (open and closed) and their open PRs. TypeScript's grammar extends JavaScript's, so the JavaScript tracker counts for TypeScript.

TypeScript is covered exhaustively over the classes below. Rust and python are a sample of their likeliest classes, to test the suspicion that the gaps are mostly TypeScript's.

## Run

```
pnpm exec tsx docs/superpowers/probes/2026-10-15-grammar-over-acceptance/census.mts
```

- `witnesses.json`: the witnesses, as `[class, name, source]` per grammar. Each grammar has one valid control, which every judge accepts.
- `upstream-rows.json`: the tracker rows, each with its references, class, fix route and, where one can be written, a witness.
- `upstream/`: the trackers as downloaded: `<repo>-issues.json` (every issue), `<repo>-prs-open.json`, and `bodies.txt` (the first code block of each syntax issue listed in `bodies-cmd.txt`).
- `results/<grammar>.tsv`: each witness with sittir's parse, the upstream parse and the compiler's verdict.
- `results/upstream.tsv`: each tracker row with sittir's parse, the upstream parse, the compiler's syntax verdict and what the run observed.

The judges:

| grammar | sittir and upstream parser | compiler |
| --- | --- | --- |
| typescript | `tree-sitter-typescript` 0.23.2, on `tree-sitter-javascript` 0.23.1 | `tsc` 7.0.2, one program per witness. tsc reports no checker grammar errors (TS1054 and its kin) for a program with any syntax error, so witnesses never share a program. |
| python | `tree-sitter-python` 0.25.0 | CPython 3.14 `compile()` |
| rust | `tree-sitter-rust` 0.24.0 | `rustc` 1.99, edition 2024, `--emit=metadata` |

For a tracker row, only the compiler's syntax errors count: TS1xxx, TS17xxx and TS18xxx, a `SyntaxError`, or a rustc error without an error code. So a witness's unresolved names do not read as a rejection.

## Answer

1. **Over-acceptance is not mostly TypeScript's.** Each grammar parses clean most of the invalid input in its sample:
   - typescript: 66 of 96 witnesses;
   - python: 18 of 19;
   - rust: 10 of 15.

   Each language rejects these in a pass after its context-free syntax: ECMAScript's early errors, CPython's parser actions and compiler, rustc's AST validation. The tree-sitter grammars leave all of that out. The python and rust rates come from their likeliest classes, so they bound nothing. They do show the over-acceptance is general.
2. **What TypeScript has more of is staleness.**
   - Its last release, 0.23.2 (2024-11-11), is our pin. It builds on `tree-sitter-javascript` 0.23.1, while JavaScript is at 0.25.0.
   - TypeScript 4.7 variance annotations and 5.0 `export type *` wait in open PRs. A `using` declaration reads as an assignment, and `for (let of of xs)` reads `let` as the loop variable. JavaScript 0.25.0 fixes both.
   - Rust is stale in a different way: v0.24.1 and v0.24.2 are git tags that npm never published (rust#318). Their fixes include `&raw[..]` (rust#277).
   - Python's pin, 0.25.0, is its latest release.
3. **Under-acceptance is real in rust and typescript.**
   - rust: all nine under-acceptance witnesses from the tracker fail to parse: two attributes on a parameter, `safe` items in an `unsafe extern` block, a trailing comma in closure parameters, a `where` clause on a unit struct, attributes on struct pattern fields, `~` in a macro, a multibyte block comment, `as T <=`, and `&raw[..]`.
   - typescript: variance annotations, members of an `import()` type, call signatures split by line breaks, ASI before a member named `in…`, a class member named `accessor`, and `type` as an exported name.
   - python: PEP 696 type-parameter defaults.
4. **sittir's grammar already differs from upstream** on two under-acceptances: `export type * as Ns from …` and `f<typeof import('m')>()` parse clean in sittir's parser and error upstream. On every over-acceptance witness the two parsers agree, so no override tightens what upstream accepts.

## Over-acceptance by class

Columns: over-accepted out of the witnessed, then the reach. Reach is whether a `grammar.sittir.ts` authoring can express the rule:
- **authoring:** an ordering, arity or placement a context-free rule states directly;
- **cloning:** context-free only by cloning rules per context, as ECMAScript's parameterized productions do (`[Await]`, `[Yield]`, `[Return]`);
- **out of reach:** it needs name equality, strict-mode state, or a whitespace fact the parser never sees.

### typescript (exhaustive)

| class | over / witnessed | witnesses (all in `results/typescript.tsv`) | reach |
| --- | --- | --- | --- |
| accessor arity | 11 / 11 | getter with parameters or type parameters; setter with zero, two, rest, optional or defaulted parameters, or a return type; in classes, object literals and interfaces | authoring: a getter's and a setter's own parameter rules (the user ruled the accessor case authored; implement owns it) |
| parameter order | 10 / 11 | rest not last, rest with an initializer or a trailing comma, optional rest, required after optional, `this` not first, rest not last in array and object patterns | authoring |
| tuples | 3 / 3 | required after optional, optional after rest, two rests | authoring |
| modifier placement | 15 / 21 | `readonly` on a method; `static`, `async`, generator or accessor constructor; property named `constructor`; async getter; `static` in an interface; parameter property outside a constructor; accessibility modifier on a function parameter; optional method in an object literal; decorator on a function or an interface; abstract member outside an abstract class; ambient function with a body | authoring, once `constructor` and the abstract class body are rules of their own |
| clause order | 3 / 6 | class extending two classes; two `default` clauses; type-only import with default and named bindings | authoring |
| type forms | 2 / 3 | `readonly` on a non-array type; computed enum member | authoring |
| expression forms | 3 / 5 | private name in an object literal; `new` with an optional chain; line break before `=>` | authoring, except the line break: out of reach without the external scanner |
| lexical | 4 / 6 | legacy octal literal and octal escape (strict code); duplicate or unknown regex flag | out of reach for octal, since a script is not strict and a module is; authoring for unknown flags, and not practical for a duplicate flag |
| context | 15 / 18 | `await` and `yield` outside their functions; `break` and `continue` outside a loop or to a non-loop label; `return` at top level; `new.target` at top level; `import` in a block; `export` in a function; `delete` of an identifier, `with`, `let let` and a labelled function (strict); duplicate arrow parameters | cloning for the function contexts and placement; out of reach for labels, strict mode and duplicate names |
| modifier duplicates and order | 0 / 9 | `static static`, `public private`, `static public` and the rest | already rejected |
| index signatures | 0 / 3 | optional, rest or two parameters | already rejected. `[k]: number` is a valid computed member and is not counted |

### python (sample)

| class | over / witnessed | witnesses | reach |
| --- | --- | --- | --- |
| parameter order | 8 / 8 | bare `*` with nothing after it, non-default after default, parameter after `**k`, two `/`, `*, **k`, two `*args`, `/` after `*`, duplicate names | authoring (the PEG grammar states the order), except duplicate names: out of reach |
| argument order | 2 / 2 | positional after keyword, `*args` after `**kwargs` | authoring |
| context | 5 / 5 | `return`, `await` and `yield` outside a function; `nonlocal` at module level; `break` outside a loop | cloning |
| assignment targets | 3 / 4 | `del f()`, `a, b += 1`, `a = *b` (assignment to a call is already rejected) | authoring: python's own grammar has target rules |

### rust (sample)

| class | over / witnessed | witnesses | reach |
| --- | --- | --- | --- |
| receiver | 2 / 2 | `self` on a free function, `self` not first | authoring for position; cloning for free against associated functions (the contextual aliases' method kinds) |
| qualifiers | 3 / 4 | `unsafe unsafe`, `async const`, `const async` (`pub pub` is already rejected) | authoring |
| visibility position | 3 / 5 | `pub` on an enum variant, a trait item or a trait impl item (E0449; `pub impl` and `pub pub` fields are already rejected) | cloning: trait and trait-impl bodies |
| parameters | 1 / 3 | `...` in a non-extern function (`...` not last and a parameter default are already rejected) | cloning |
| context | 1 / 1 | `break` outside a loop (E0268) | cloning |

## Tracker rows

From `results/upstream.tsv`. Observed: what the run saw at our pin. Route is the cheapest fix:
1. a newer upstream release;
2. an open upstream PR, pinned or ported as authored structure;
3. our own `grammar.sittir.ts` authoring;
4. out of reach.

| grammar | class | refs | title | observed at our pin | route |
| --- | --- | --- | --- | --- | --- |
| typescript | under | ts#370, PRs ts#364 and ts#361 | variance annotations (TS 4.7) | fails to parse | 2 |
| typescript | under | ts#348, PRs ts#358 and ts#360 | `export type *` (TS 5.0) | **parses clean in sittir**, errors upstream | already authored |
| typescript | under | ts#367, PR ts#375 | `typeof import()` as a call's type argument | **parses clean in sittir**, errors upstream | already authored |
| typescript | under | ts#352, ts#322, PR ts#365 | members of an `import()` type, with type arguments | fails to parse | 2 |
| typescript | under | ts#369 | a class member named `accessor` | fails to parse | 3 |
| typescript | under | ts#335 | call signatures split by line breaks | fails to parse | 3 |
| typescript | under | ts#373 | no ASI before a member named `in…` | fails to parse | 3 (external scanner) |
| typescript | under | ts#313 | `type` as an exported name | fails to parse | 3 |
| typescript | under | ts#341, PRs ts#350 and ts#342 | type arguments on a tagged template | parses clean | none needed |
| typescript | under | ts#329 | a generic function type with a default, over lines | parses clean | none needed |
| typescript | under | js#377, PR js#378 | a reserved word as a property after `?.` | parses clean | none needed |
| typescript | under | js#362, js#337 | an invalid escape in a tagged template | parses clean | none needed |
| typescript | mis-parse | js#350 | a `using` declaration reads as an assignment: 0.23.1 takes `using` as an anonymous prefix of `assignment_expression` | clean, wrong tree | 1 (javascript 0.25.0) |
| typescript | mis-parse | js#355 | `for (let of of [1])` reads `let` iterating `of[1]` | clean, wrong tree | 1 (javascript 0.25.0) |
| typescript | mis-parse | ts#309, PR ts#310 | a method's decorators sit outside `method_definition` | clean | 2 |
| typescript | mis-parse | ts#331 | an exported class's decorator attaches to the export | clean | 3 |
| typescript | mis-parse | ts#282 | `await` of a call with type arguments | clean | 3 |
| typescript | mis-parse | js#323 | an anonymous default-exported function is an expression | clean | 3 |
| typescript | mis-parse | ts#299, js#259, js#318, PR js#354 | non-null precedence; labelled statements; destructuring assignment; ASI after an arrow | not witnessed | 2 for js#354, otherwise 3 |
| typescript | over | js#209 | `export default let a = 42` | parses clean | 3 |
| typescript | over | js#204 | a reserved word as a binding name (`var enum`) | parses clean | 3 |
| typescript | over | js#303 | `await` and `yield` regardless of context | parses clean | 4 short of cloning |
| rust | under | rust#277, rust#288 in v0.24.1 | `&raw[..]` when the identifier is `raw` | fails to parse | 1 (git tag v0.24.1; npm has only 0.24.0, rust#318) |
| rust | mis-parse | rust#306 in v0.24.1, rust#307 in v0.24.2 | string literals with unexpected prefixes; recovery after repeated string literals | not witnessed | 1 (git tags) |
| rust | under | rust#315, PR rust#316 | a block comment with multibyte characters | fails to parse | 2 |
| rust | under | rust#284, PR rust#312 | `<=` after a cast to a path type | fails to parse | 2 |
| rust | under | rust#276 | two attributes on a parameter | fails to parse | 3 |
| rust | under | rust#250, PR rust#256 | `safe` items in an `unsafe extern` block (edition 2024) | fails to parse | 2 |
| rust | under | PR rust#282 | a trailing comma in closure parameters | fails to parse | 2 |
| rust | under | PR rust#271 | a `where` clause on a unit struct | fails to parse | 2 |
| rust | under | PRs rust#319 and rust#301 | attributes on struct pattern fields | fails to parse | 2 |
| rust | under | PR rust#317 | `~` in a macro token tree | fails to parse | 2 |
| rust | mis-parse | rust#291, PR rust#305 | `*` after `..` read as a binary operator | clean | 2 |
| rust | mis-parse | rust#293, PR rust#304; rust#244, rust#246, PR rust#269 | literal suffixes; attributes and doc comments on the wrong item | not witnessed | 2 |
| rust | under | rust#229 | about 50 of rustc's own test files that tree-sitter rejects | not witnessed | 3, one by one |
| python | under | py#346 | type-parameter defaults (PEP 696, 3.13) | fails to parse | 3 |
| python | under | py#303 | a generic class (PEP 695, 3.12) | parses clean | none needed |
| python | mis-parse | py#321, PR py#320 | `type(_).foo = bar` reads as a type alias | clean | 2 |
| python | mis-parse | py#334, py#333, py#293 | `\|` in an annotation reads as a binary operator | clean | 3 |
| python | mis-parse | py#314, PR py#320 | a list splat in a call | clean | 2 |
| python | mis-parse | py#309 | a comment inside an `if` body | clean | 3 |
| python | over | py#178 | newlines where python forbids them (`x = 1 +` then `2`) | parses clean | 3 |
| python | under | py#352 and PR py#353; py#335 and PR py#336 | PEP 798 unpacking comprehensions and `lazy` (3.15) | fails to parse; 3.14 rejects too | 2, when 3.15 is a target |

Excluded from the trackers: build, packaging, bindings, highlighting and query issues; questions; spam; and issues closed before each pin. Every issue closed after a pin is listed in `upstream/` with its close reason. The syntax fixes released since the pins are the ones the routes name: javascript 0.25.0 (`using`, `of` as a name), and rust's git tags v0.24.1 and v0.24.2.

## Findings

1. **The cheapest fixes are pins.**
   - JavaScript 0.25.0 under the TypeScript grammar fixes two mis-parses. Open PR ts#357 makes that bump upstream; until it lands, we can override the dependency.
   - Rust's v0.24.2 tag fixes `&raw[..]` and two string-literal reads, but only as a git dependency, since npm has 0.24.0 (rust#318).
2. **Rust's open PRs cover most of its confirmed under-acceptance:** seven of its nine rows have an open PR, all stable syntax that fails to parse today. They port as authored structure if upstream does not release.
3. **Most over-acceptance can be authored, but the cost differs.** Arity, order and placement are plain rules. Context (async, generator, function body, loop, trait body) needs cloned rules, as the contextual aliases already clone for rust's methods. Name equality, labels, strict mode and line terminators are out of reach.
4. **A clean parse is not evidence of a right tree.** Of the rows that parse clean at our pin, six TypeScript, one rust and four python rows are known mis-parses. The witnesses check only for ERROR, so every mis-parse here comes from a tracker; none was found by the probe.
5. **"Valid by construction" holds only within these bounds.** What sittir builds parses back as the parser reads it. It is not checked against the language's own grammar beyond what the parser accepts, and this census measures that gap.

## Questions

Rulings come back through brainstorm.

1. **The accessor rules are ruled; which other authoring classes go next?** Parameter order, tuples and clause order are plain rules in TypeScript, as are parameter and argument order in python.
   - (a) All of them, as one authoring stage.
   - (b) TypeScript only.
   - (c) None now.
2. **Do we take the pins?**
   - (a) Override `tree-sitter-javascript` to 0.25.0 under the TypeScript grammar, and take rust from the v0.24.2 git tag. Recommended: both are released upstream code.
   - (b) Wait for npm releases.
3. **Rust's under-acceptance: port the open PRs as authored structure, or pin a fork with them merged?**
4. **Context classes:** are cloned contexts (async, generator, loop, function, trait body) worth their parser size? The contextual-alias probe measured +0.6–0.7% STATE per split; ECMAScript's `[Await]` and `[Yield]` would clone most of the expression grammar.
