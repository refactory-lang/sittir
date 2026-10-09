# Layout table for width-aware rendering: design note

Status: design note; rulings are marked where made. Its probes, outputs and prototype patches are in `docs/superpowers/probes/2026-10-02-layout-table/`, and the paths `probes/`, `outputs/` and `prototype-*.patch` below are relative to that folder. Updated 2026-10-08: see [Layout inference, kind runs and gap sets](#layout-inference-kind-runs-and-gap-sets-2026-10-08), which holds where it conflicts with earlier sections, and questions 16 to 21; the 2026-10-09 rulings (questions 2 to 8 and 12, and typescript's context source) are marked where they apply. Request of record: the width-setting issue, section "Direction under discussion".
Measured at master `fd189d4c9`, where the output-trait rebuild in [Staging](#staging) was also made. The validators and the python list form were rerun at `0f9556b17`, and everything in [Which arms a site admits](#which-arms-a-site-admits) was measured there. Master has since moved twice, to `9c01b8cbc` (slot renames; typescript has 1,360 sites against 1,356) and to `4052dd013` (python's terminated tuple form; python has 972 sites against 942); only the site counts were re-read there. Every number below comes from a throwaway prototype (see [The prototype](#the-prototype)).

## What is already ruled, and what this note settles

Ruled by the maintainer and taken as given:

- When a width is set, a **root** render fills a transient table of the whole file: a row for each piece of text and a row for each seam. A layout pass turns seam rows into line breaks, and the text is produced from the table.
- The table is built during one render and discarded. A node rendered on its own is not laid out by width.
- With no width set there is no table, the output is byte-identical and the render speed is unchanged.
- How seams break (fill, group, others) is a formatting option that selects an algorithm over the table. The table and the pass interface come first; one algorithm ships with them.
- A seam the caller set, or one read from source, is not adjustable.
- Starting set of adjustable seams: the separator seams and the two flanks of a list that sits inside brackets.

This note settles the table, how the writer fills it, the fact that lets a seam change and where it comes from, the pass interface, a first algorithm, the option names, the conditional trailing separator, the gates, and how the table sits beside the shared-arena draft. Fifteen questions are left for the maintainer, each with a recommendation, at the end.

Since the first draft the maintainer has reframed the seam fact, without ruling yet. Every seam accepts every whitespace arm of its grammar today, so the missing fact is which arms a site admits; brackets are a consequence of that fact, not the rule. [Which arms a site admits](#which-arms-a-site-admits) works the reframing through and replaces the earlier section on adjustable seams. [Staging](#staging) answers the proposed order of work and the proposed shape of the writer's output. They add questions 11 to 15; question 1 is reworded and the other nine stand as they were.

## Result in short

The table works as ruled and costs little. The writer already sends every byte through one function (`emit`) and already resolves every gap once (`flush_seam`), so the table is a record of decisions it makes anyway. A prototype fills it, breaks lists with a group rule and flattens it. At 120 it renders the two typescript parameter lists exactly as the source has them and leaves the object on one line; at 100 the object breaks as in the source too; at 100 the two rust struct expressions stay on one line, and drop the trailing comma once their delimiter is read as conditional. With no width the output is byte-identical and the writer measures the same as master. With a width the writer takes 70 to 80% longer, which is 6 to 7% of a whole `engine.render` call. Breaking every eligible list in every validator case, in all five grammars, leaves every validator count unchanged.

On the reframing: per-site admission already exists on the site model, emitted and enforced, and today it hardly varies within a grammar. The general condition, that no line-sensitive token can be read at the seam, is the right definition. Rust and scm meet it everywhere with nothing to derive, apart from three lexical sites in rust that only a forced line break found. Typescript can derive it from tree-sitter's parser, and it frees more than brackets do. Python cannot take it from the parser, which accepts line breaks outside brackets that CPython rejects, so python's brackets are declared, as the rule. The proposed output trait holds up: the prototype rebuilt on it passes the same tests, renders the same bytes and costs the same.

## The table

Three parts, all owned by the writer for the length of one render:

```rust
struct LayoutTable {
    text: String,     // every byte the render wrote, in order, without indentation
    rows: Vec<Row>,   // one per piece of text, one per seam
    lists: Vec<List>, // one per list the render reached
}

struct Row {          // 12 bytes
    end: u32,         // one past this row's bytes in `text`; it starts where the previous row ends
    list: u32,        // seam: the list whose gap this is
    depth: u16,       // the writer's depth when the row was written
    kind: u8,         // text or seam; starts a line; conditional; has a line break; broken by the pass
    fact: u8,         // seam: its place in its list; admits a line break; set by the caller; read from source
}

struct List {         // 16 bytes
    parent: u32,      // the list one of whose items this list was written in
    head: u32,        // seam row of the gap before its first item
    tail: u32,        // seam row of the gap after its last item
    flags: u8,        // separated; opens at a bracket; closes at a bracket; holds a line break
}
```

- **A text row** is the text written between two seams. Consecutive `text` calls with no mark between them share one row.
- **A seam row** is one gap as the seam law resolved it: its bytes are the whitespace the writer would have written (`""`, `" "`, `"\n"`, a whitespace trivia entry's text). Every gap that received a mark gets a row, including a tight one, because a tight flank is exactly the seam a broken list turns into a line break. A gap with no mark and no list role gets none. A space the writer inserts between two word characters is a seam row of its own.
- **A seam's place in its list** is one of head (before the first item), before a separator, after a separator, tail (after the last item), or none.
- **What a seam row says about changing it** is three bits: the gap admits a line break (see [Which arms a site admits](#which-arms-a-site-admits)); a mark at the gap was set by the caller; a mark was read from source (a classified gap, a whitespace or trivia seam). The prototype records reasons instead (not a list gap, fixed by the grammar, the root's edge, and so on). Each of those reduces to one of the three bits, to the seam's place in its list or to its own bytes.
- **A list row** names its head and tail gaps and, in a grammar that declares bracket pairs, whether each sits at one. Nesting is the `parent` link.

A real table, from the prototype, for `fn f() { send(alpha, beta); }` rebuilt from parts (`outputs/tiny-table-dump.txt`):

```
row  kind  bytes    depth list role    adjustable
 11  text  "send"   1                                      starts a line
 12  seam  ""       1                  no: not a list gap
 13  text  "("      1
 14  seam  ""       1     L2   head    yes
 15  text  "alpha"  1
 16  seam  ""       1     L2   before  no: before a separator
 17  text  ","      1
 18  seam  " "      1     L2   after   yes
 19  text  "beta"   1
 20  seam  ""       1     L2   tail    yes
 21  text  ")"      1
 22  seam  ""       1                  no: not a list gap
 23  text  ";"      1
 24  seam  "\n"     0     L1   tail    no: already a line break
 25  text  "}"      0                                      starts a line
L1 (the block's statements): not separated
L2 (the arguments): separated, opens at a bracket, closes at a bracket
```

At width 20 the pass marks rows 14, 18 and 20 broken, and the text comes out as `send(` / `alpha,` / `beta` / `);` with the items one level deeper.

The last column is the prototype's. In the recast it splits in two: whether the gap admits a line break (in rust every gap does), and whether the pass may use it, which is a head, after-separator or tail gap that admits one, was neither set nor read from source, and holds none yet.

### What a seam row does not record

Its site and its arm. Nothing in a transient table reads them: an algorithm needs the gap's bytes, its list and whether it may change. They would add 4 bytes to a 12-byte row. A kept table would need them to resolve a seam again when options change, and they can be added then as columns without touching rows or the pass (question 9).

### How the writer fills it

The fill itself is all in `rust/crates/sittir-core` and needs no change to generated render bodies. Generated code is touched elsewhere in this note: the options module gains the site flags, the root dispatch chooses the writer, and the list views change how they pass separator arms and the trailing separator.

- **Text.** `emit` is the one place output leaves the writer. With a table it appends to `text` and extends the last text row or starts one. A deferred trailing run still renders into its string buffer and lands as one text row where it is seated.
- **Seams.** `flush_seam` is the one place a gap becomes bytes. With a table it writes a seam row instead. The facts of the gap are collected while its marks arrive, in a note that is cleared at each flush: `site_at`, `flank_at` and `edge` add whether the site was set by the caller and whether it admits a line break; `token_seam` and `trivia_seam` add that the gap was read from source; the list calls below add the role. A mark with no site (a template's fixed seam, the root's edge) adds nothing, and a gap that no site frees admits no line break. The note belongs to the pending seam, so it travels with it wherever the writer sets the seam aside (`hold_context`, `take_seam`).
- **Lists.** `ListView::render` tells the sink where a list starts, which gaps separate its items and where it ends: three calls that default to nothing (`list_open`, `list_gap`, `list_close`). This is the only new information the render has to supply; separators reach the writer today as bare arms, indistinguishable from any other mark.
- **Indentation is not text.** Today the writer pays indentation lazily: a newline arms it and the first text after it writes the unit once per depth. With a table `pay_indent` writes nothing and flags the row as starting a line; the row carries the writer's depth. Flatten pays it. This is what makes breaking an outer list a recomputation: nothing inside it holds indentation bytes.
- **Depth arms and direct depth calls** (`_indent`, `_dedent` in rust, typescript and scm; `w.indent()` / `w.dedent()` for python's scanned tokens) need nothing new. They move the writer's depth, and each row records the depth it was written at.

### How a broken list is laid out

A broken seam is written as one line break. Rows between the first seam the pass broke in a list and that list's tail gap are one level deeper, so the closing bracket returns to the depth its opening line has. This is a rule of the table, not of an algorithm, and it does not use the grammar's depth arms: python and regex have none (python's are scanned tokens, so its whitespace vocabulary leaves them out), while the writer's depth is the same in every grammar. For rust it gives exactly what the grammar's own statically broken lists spell with arms (`{` after: indent, separator after: newline, `}` before: dedent).

### How it flattens

One walk over the rows writes the output: indentation where a row starts a line or follows a broken seam, at the row's depth plus one per broken list around it; then the row's bytes, or a line break for a broken seam. Conditional rows are skipped unless their list is broken.

### Cost, measured

Release build, timer inside the writer from its creation to the end of `finish`, best of 400 renders. Rebuilds made with `sittir tool emit-factory-source`.

| file | output | writer, master | writer, width unset | writer, width 100 | of which pass + flatten | rows | lists | table, used |
|---|---|---|---|---|---|---|---|---|
| rust `engine.rs` | 23,073 B | 160.6–161.7 µs | 161.8–162.8 µs | 277.9–278.2 µs | 76 µs | 6,091 | 326 | 99.7 KB |
| rust `splice.rs` | 4,171 B | 24.7–25.6 µs | 24.7–25.5 µs | 42.8–43.1 µs | 11 µs | 883 | 45 | 15.1 KB |
| typescript `format.ts` | 3,870 B | 24.1–24.2 µs | 24.5–24.7 µs | 44.3–44.6 µs | 12 µs | 995 | 57 | 16.7 KB |
| typescript `transport-data.ts` | 11,856 B | 77.7–78.5 µs | 78.0–80.5 µs | 139.3–139.4 µs | 38 µs | 3,299 | 204 | 54.5 KB |

- **Time per output byte:** 7.0 ns without the table and 11.4 ns with it on `engine.rs`; 6.7 ns and 11.7 ns on `transport-data.ts`.
- **Memory per output byte:** 4.1 bytes on `engine.rs` and 4.6 on `transport-data.ts`, beside the output string itself. `text` is about one byte per output byte; the rest is rows, one per 3.6 to 4.0 output bytes. The prototype grows its vectors by doubling, so it allocates up to 1.4 times that (141 KB on `engine.rs`); sizing them from the transport would remove the slack.
- **A whole `engine.render` call** on `engine.rs` goes from 2.80 ms to 2.97 ms (6%), because the writer is about 6% of a call; the JS projection and the napi decode are the rest.
- **Width unset** is within measurement noise of master. To get there the table is a type parameter of the writer (`SpacingWriter<W, R: Record = NoRecord>`), so the writer without a table compiles to the code it is today. A first version that tested an `Option` at each hook was 9 to 16% slower with the width unset (176 µs against 161 µs on `engine.rs`). The three list calls remain as calls that do nothing; they do not show in the measurement.
- **What the type parameter costs to build and ship.** Generated render bodies are not instantiated per writer: each takes `w: &mut dyn RenderSink`, so it is compiled once whichever writer is behind the sink. What is emitted twice is the writer. Release profile as in the workspace (fat LTO, one codegen unit):

  | | master | prototype | growth |
  |---|---|---|---|
  | rust `.node`, as shipped | 4,689,744 B | 4,739,184 B | 49,440 B (1.1%) |
  | rust dylib, unstripped | 5,422,016 B | 5,485,600 B | 63,584 B (1.2%) |
  | typescript `.node`, as shipped | 5,378,240 B | 5,411,280 B | 33,040 B (0.6%) |
  | typescript dylib, unstripped | 6,167,968 B | 6,215,424 B | 47,456 B (0.8%) |

  - Both instantiations are in the binary: 77 writer symbols against 35 at master. The writer without a table is 8,124 B of code in 38 symbols (7,916 B in 35 at master); the writer with a table is 9,160 B in 39 symbols. So the second writer is about 9 KB, 0.2% of the shipped rust binary. The same figures hold for typescript.
  - Of the rest, the table module is 7,496 B. The remaining 32.6 KB in rust and 16.2 KB in typescript has no symbol of its own: it is code that link-time optimization inlined into the generated module. That is where the list views' new calls and the conditional separator land (51 list views in rust, 18 of them with a delimiter; 37 and 8 in typescript). It is the feature's code, not a second copy of anything, but I did not attribute it line by line.
  - Build time shows no change. Release rebuild of the core and the grammar crate with the compiler cache off, six runs each, on a machine shared with other builds: rust 39.9 to 54.2 s at master and 42.3 to 57.6 s with the prototype; typescript 44.5 to 99.1 s and 42.2 to 59.8 s. CPU seconds over three of those runs: rust 43.9 to 44.1 at master and 40.0 to 42.5 with the prototype; typescript 46.1 to 49.6 and 44.6 to 46.8. The spread between runs is larger than any difference between the two.
  - For scale, the alternatives: one writer with a runtime `Option` saves the 9 KB and costs 9 to 16% of writer time with the width unset. A separate sink type for the table path is what the type parameter already produces, since generated code reaches either writer through the same `dyn RenderSink`.
  - The writer rebuilt on an output trait, in place of the type parameter, gives the same time and size ([Staging](#staging)).
- **Rows by kind** on `engine.rs`: 3,105 text, 1,098 list gaps, 1,858 other seams (1,160 of them empty), 30 lexical spaces. Recording only list gaps would roughly halve the table. I recommend keeping every marked gap, as ruled: a later rule that adjusts another kind of seam then needs no change to the fill.

## Which arms a site admits

This section replaces "Adjustable seams". It works through the maintainer's reframing, which is not yet a ruling:

1. A break can be added on any list for which a line break is not a terminator. Brackets are one consequence of that, not the rule.
2. Every seam is adjustable today, because every spacing site accepts every whitespace arm of its grammar. The missing fact is which arms a site admits.

Both hold against the code and the measurements. One qualification matters: in python the consequence is the rule, because the language ends a line at every line break outside brackets and the parser does not.

### The fact, and what exists of it today

- **It has a home.** A site's arms are a field of the site model (`RuleSpacingSite.arms`), emitted with the site table (`SPACING_SITES[site]`), enforced when options resolve (`… does not admit kind id …`) and typed per option key: the options type prints a site's own union of arms where it differs from the grammar-wide one. Narrowing a site's arms needs no new field on the site model, no new table and no change to `resolve` or to the type emitter. The writer needs one bit of it per site: whether the site admits a line break.
- **It does not vary.** On master `4052dd013`:

  | grammar | spacing sites | admit every whitespace arm | all but indent and dedent | line breaks only | not whitespace |
  |---|---|---|---|---|---|
  | rust | 1,509 | 1,437 | 71 | 1 | |
  | typescript | 1,360 | 1,285 | 52 | | 23 |
  | python | 972 | 972 | | | |
  | scm | 152 | 140 | 12 | | |
  | regex | 117 | 117 | | | |

  The 71, 52 and 12 are separator sites. The 1 is the after edge of a rust line comment. The 23 are token choices such as the statement terminator. Python's and regex's vocabularies have no indent or dedent arm. So every whitespace site in every grammar admits a line break, as the maintainer said.

### What "admits" has to mean

An arm is admitted at a site when writing it there cannot change the tokens the parser reads. Whitespace can change them through a **line-sensitive token**: one the grammar's scanner issues at a line break (python's newline, indent and dedent; typescript's two automatic semicolons), or one that reads whitespace as content (a template string's characters, an f-string's content, JSX text). So a site admits the line-break arms (newline, the blank lines, indent, dedent) in two cases, and otherwise only tight, space and tab:

- **The seam is free:** no line-sensitive token can be read there, wherever the site occurs.
- **The grammar ends a line there:** the site's declared default is a line break, or what precedes the seam is a line-terminated kind. The line-sensitive token is what the parser is meant to read.

The second case is needed. Without it the rule would refuse the grammars' own defaults: typescript writes a dedent before the `}` of a class body, and an automatic semicolon is valid there in 28 of the 44 occurrences that hold a line break; python's blank lines after a function definition sit where its newline token is read. It would also refuse four keys of the committed python options type test, which set the statement and decorator separators to a newline.

How the fact is used:

- **The pass** may turn a seam into a line break only where the gap admits one. A gap that already holds one needs nothing.
- **Options.** An option that sets an arm its site does not admit is refused when options resolve, and by the type, as an indent on a separator is today.
- **Set and read stay separate.** Whether an arm was set by the caller or read from source is a fact about one render, not about the site ([Explicitly set wins](#explicitly-set-wins)).
- **Adjustable**, where the rest of this note uses the word, now means: the head gap, an after-separator gap or the tail gap of a list with a separator token; the gap admits a line break; no mark that met there was set by the caller or read from source; it holds no line break yet.

### The two sources, measured

How it was measured. The prototype writer records every gap it resolves with the sites whose marks met there. After a root render the output is parsed with the parse log on, which names the parse state in which each token is lexed; tree-sitter's lookahead iterator then says whether a line-sensitive token is valid in that state. That is what the scanner is offered at the gap. The figures are over the validators' corpus, root renders that parse again without error, at `0f9556b17`. An inline gap is one that holds no line break.

| | rust | typescript | python |
|---|---|---|---|
| root renders; gaps | 296; 9,212 | 226; 7,502 | 230; 7,108 |
| sites seen, of all | 869 of 1,509 | 689 of 1,356 | 422 of 942 |
| line-sensitive scanner tokens | none | automatic semicolons | newline, indent, dedent |
| inline gaps inside `()`, `[]`, `{}`, none valid | 3,742 | 2,334 | 2,748 |
| inline gaps inside, one valid | 0 | 480 | 0 |
| inline gaps outside, none valid | 4,144 | 2,654 | 2,282 |
| inline gaps outside, one valid | 0 | 910 | 824 |

- **Rust** (and scm): no scanner token is line-sensitive, so brackets say nothing about safety.
- **Typescript:** brackets are neither necessary nor sufficient. 480 gaps inside brackets have an automatic semicolon valid, since a block and a class body are braces too; 2,654 gaps outside have none.
- **Python:** inside brackets no line token is ever valid. Outside, the parser calls 2,282 of 3,106 gaps free, and there it is more lenient than the language. Tree-sitter's scanner issues the newline token only where the grammar can accept one; Python's tokenizer issues it at every line break outside brackets. CPython 3.14 rejects a line break after `=`, inside a lambda's parameters, in the lists of a `for`, `with`, `case` or `except` header, in a union pattern, in a dotted name and after `def`. The parser accepts all nine without an error node, so the validators cannot see them. This is the f-string finding again, at 172 of the 244 sites seen outside brackets.

Lists of two or more items with a separator token, by where they sit:

| | rust | typescript | python |
|---|---|---|---|
| at a bracket pair, every gap free | 122 | 62 | 194 |
| inside brackets but not at a pair, every gap free | 20 | 24 | 16 |
| outside brackets, every gap free | 46 | 46 | 38 |
| outside brackets, some gap not free | 0 | 4 | 70 |

- **(a) Declared pairs** admit the first row. No list at a pair has a gap that is not free, in any of the three grammars, so pairs are a safe source. They are also what the forced-width validator runs covered.
- **(b) The general condition** admits the first three rows.
  - In rust that adds type argument and type parameter lists (30), trait bounds (16), `where` predicates (4), `let` chains (6), lifetimes and use bounds (4), and 6 array and tuple lists whose first item follows an inner attribute.
  - In typescript it adds type parameter lists (24), type argument lists (24), object type members (20, whose opening brace is a token choice the prototype's pair test does not see) and `extends` lists (2).
  - It keeps out what it should: the head of a `let` list (after `let` an automatic semicolon is valid in 32 of 34 occurrences, after `const` in none of 38, and the site is one), the gap after `return` (22 of 22) and the tail of a declarator list (72 of 72 inline occurrences). It also keeps out the tail of a type argument list in 10 of 110 occurrences, where the state still allows `<` to be a less-than.
  - In python it would admit the third row too, which the language rejects. For python the source has to be the bracket rule.

How tight is the condition? A line break was forced at one site at a time and the validators rerun, for every site seen at an inline gap. "Changes" means some validator count moved.

| sites where a line-sensitive token is valid in… | typescript: no change, changes | python | rust |
|---|---|---|---|
| no occurrence | 383, 2 | 286, 4 | 785, 3 |
| some occurrences | 39, 38 | 12, 27 | |
| every occurrence | 73, 34 | 5, 28 | |

- **It is close to sufficient.** Of the 1,463 sites it calls free, a forced line break changes a count at 9.
  - Four sit inside a string (a template type; an f-string's field and format specifier), where the break becomes content. Declaring the content token as line-sensitive catches them.
  - Two are a context the root renders never showed (`async` and python's `as` at the start of a statement). A derivation over every state catches them.
  - Three are rust's, and no token's validity shows them: after `#!` a line break turns an inner attribute into a shebang line, and after the `.` that follows an integer (`1.max(2)`, a tuple index) it lets the scanner read `1.` as a float. Rust is "everything" at 785 of 788 sites; these three need an explicit exception, and only forcing found them.
- **It is not necessary.** 112 of the 184 typescript sites it flags, and 17 of python's 72, take a line break in every corpus occurrence with no change: before `.` in a member chain, before a binary operator, before `?` and `:`, before `=`, before `(`. Tree-sitter's scanner looks at the character after the line break before it issues an automatic semicolon, and that is C code no table records. A corpus cannot prove such a site safe: `break` is among the 112 only because no corpus `break` has a label.

### Deriving the general condition

Two derivations were named. Only one works.

- **Follow sets, computed by sittir over the grammar's rules.**
  - Within one rule they are unsound. After `let` a declarator must follow, so the rule alone calls the seam free; yet the state after the token `let` also holds the item that reads `let` as an identifier, where a statement may end.
  - Over the whole grammar they are sound and useless. In python a newline can follow a comma somewhere (`x = a,`), so no comma seam would be free, bracketed or not.
  - The condition needs the parser's states, which tell contexts apart, and only tree-sitter builds them.
- **Tree-sitter's parse table.** Tractable, in two halves.
  - *Which tokens are valid in a state* is data in the generated `parser.c`: `ts_lex_modes` gives each state its external lex state and `ts_external_scanner_states` the external tokens valid in it. Python has 2,292 states, with a line token valid in 355; typescript 7,238, with one valid in 2,492.
  - *Which states a seam is lexed in.* A token is lexed in the state reached after the token before it. `tree-sitter generate --report-states-for-rule '*'` lists every state's items with the dot position (1.3 MB for python, 10.9 MB for typescript), and its "state index" is the runtime state number.
  - *A site that follows a token* (after an opening bracket, after a keyword, after a separator) is lexed in the states whose items have the dot just after that token, and the derivation is complete. Checked against the measurement: python has 112 such sites, 89 of them free, and all 100 that the corpus shows agree. Typescript has 207, 160 free; 132 of 133 agree. The one miss is a merged state (the state after `void` is printed with the item for `any`), so the report has to come from a run with state merging off.
  - *A site that follows a child* (before a token, a kind's edge, a list seat) is lexed in the state after the child's last token, deep in another rule. The state that holds the site's own item under-reports: it called free 2 of 55 python sites and 4 of 48 typescript sites that the measurement shows are not (before `:=`; before the `:` of a `match`; before `=>`; before the `>` of type arguments). The exact answer follows the reductions backwards through the table. That is bounded work over `parser.c`, not a second table construction, and it is not prototyped. It is most of the sites: kind edges and list seats are 748 of typescript's 1,356 and 661 of python's 942, against 225 and 140 that follow a token.
  - *Costs.* The state report is a debug print with no stability promise; its help text names `-` as the wildcard, and the one that prints items is `*`. It needs a second `generate` run, with merging off. Variants and hoisted lists have to be mapped to tree-sitter's variables: 25 of the 207 typescript sites found no item by name.

### What stays for render time

A site is free only if its seam is free wherever the site occurs. Three things follow.

- **A gap admits a line break when at least one site whose mark met there does.** Several sites meet at one gap: the bracket's own, the list's flank, the edges of the item. A kind's edge sites are almost never free, since the kind can be written anywhere. One admitting site is enough, because the gap is an occurrence of that site's seam.
- **Python keeps the render-time check.** Its list kinds serve bracketed and bare uses alike: `parameters_elements` is the parameter list of a `def` (10 in the corpus) and of a `lambda` (4); `import_list` sits inside `parenthesized_import_list` and bare in three other statements; `pattern_list` and `expression_list` likewise. Their separator sites are not free, and nothing else meets those gaps. So in a grammar that declares pairs the prototype's check stays: a list whose head gap and tail gap sit at a declared pair admits a line break at every gap of its own. That is Python's own rule, that what lies between brackets is one logical line, applied per list.
- **Rust needs no check, and typescript needs none once its sites are derived.** Every flank and separator site of the 188 rust lists and the 132 typescript lists whose gaps are all free is free in itself.

### Exceptions the parser cannot supply, and where they are declared

*Superseded on 2026-10-08: legality is declared in `grammar.sittir.ts`, never in the `options` block; see [the context set's source](#the-gaps-valid-set-replaces-per-site-admission) and question 19. The cases below stand; where they are declared does not.*

Three declarations, all per grammar. Their names are open (question 13).

- **The line-sensitive tokens.** Python already declares its three with `role(…)`. Typescript would declare the two automatic semicolons and its content tokens the same way. Rust and scm declare none.
- **Bracket pairs,** in the `options` block beside `indent`.
  - In python they are `()`, `[]` and `{}`, and they state the language's line-joining rule.
  - Until typescript's sites are derived it declares the same three, as a source the validators have checked.
  - In every grammar they are also how the first rule chooses its lists (question 14).
- **"Does not admit a line break", per kind or per site,** in the `options` block, where site addresses are already spelled.
  - Python `interpolation`: before Python 3.12 a single-quoted f-string cannot span lines, so nothing rendered inside one may break, a bracketed call included. The exception covers the kind's whole content, not only its own braces.
  - Typescript: after `throw`. The parser accepts a line break there in all 4 occurrences; JavaScript reports "Illegal newline after throw". The other restricted places of the language (before `=>`, before a postfix `++`) need no declaration: an automatic semicolon is valid there in some occurrences, so the derivation keeps them out.
  - Rust: the three sites found by forcing.
  - Regex, at its root kind: the grammar lists a newline as an extra, so a broken pattern would parse the same and be a different expression. With the root declared, every regex site admits `tight` alone, and regex has no spacing options and no `width`.

### What restricting options would refuse

Only source (b) can restrict options. Source (a) says nothing about a site that is not at a pair.

| | sites | lose the line-break arms |
|---|---|---|
| rust | 1,509 | 3, by declaration |
| scm | 152 | none |
| regex | 117 | all 117, by declaration |
| typescript | 1,356; 569 seen at an inline gap | 184 of the 569 (107 in every occurrence, 77 in some). The 667 never rendered at the root are not measured. |
| python, by the parser | 942; 362 seen | 72 of the 362 |
| python, by the language | | 244 of the 362: every site seen outside brackets. The 118 seen only inside brackets keep them. |

- **Defaults:** none is refused. Every default that is a line break sits at a free site or where the grammar ends a line (73 in rust, 70 in typescript, 4 in python, 1 in scm).
- **Committed tests and examples:** none is refused. Line-break arms are set in the three `options.test.ts` files only. Rust's are all free. Typescript's are an array separator (free), the object type and enum separators and the class body's braces (defaults). Python's four are statement and decorator separators, where the grammar ends a line. The examples and the dogfood targets set no arm.
- **What it takes away that works today:** in typescript, a line break before `.`, before a binary operator and at the other sites among the 112, unless each is declared to admit one. In python, a line break before an operator inside parentheses, which is valid there and which a per-site fact cannot express.
- **What it stops that is broken today:** a line break after `return`, which changes the meaning; after python's `=`, a syntax error; and the 72 typescript and 55 python sites where the corpus shows the parse changing.

### What changes in the table

- **A seam row** carries three bits beside its place in its list: the gap admits a line break; a mark was set by the caller; a mark was read from source. The prototype's other reasons go. "Fixed by the grammar" and "the root's edge" are marks with no site, so they free nothing. "Before a separator" is the seam's place. "Already a line break" is the row's bytes. The row stays 12 bytes.
- **A list row** keeps "head at a pair" and "tail at a pair" only in a grammar that declares pairs.
- **Per site,** one flag byte beside `SITE_SPECS`: admits a line break; opens a pair; closes a pair. The writer reads it only when it fills a table.
- **The pass** reads "admits" where it read "adjustable or why not". The group and fill rules are unchanged.

## Explicitly set wins

Two sources reach a gap, and each needs its own record.

- **Options.** `Options::resolve` knows which sites an options object named. It records one bit per site in the resolved options. Strength cannot serve: `set_arm` writes the declared strength, and so do defaults the grammar author declared. In the prototype, setting `(arguments)/"("/after` to its default value leaves every `arguments` list alone at width 80 (a 107-column line stays) while parameters and struct expressions still break (`outputs/rust-explicit-site-80.txt`).
- **Values carried by the node.** A list's separator arms are filled in `prepare` from the wire, else from the source gaps between items that are still coordinates, else from the options. By render they are all `Some`, so where a value came from is lost. I propose that `prepare` stops copying the options default onto the node, and that `ListView` takes the separator's site ids and resolves an unset arm through the sink, at the strength a separator arm writes with today. A value on the node is then one the wire or the source gave, which is exactly "set, or read from source". This removes two generated lines per list from `prepare` and changes the list view's fields; it must be byte-identical.
- **Edges** need no new stamp. An edge that meets an adjustable gap is the kind's own (a seat only fills the gap before a separator), so the writer can look up the set bit of the kind's edge site; an edge stamped without a strength came from the wire or from source.

A gap is not adjustable when any mark that met there was explicit, not only the mark that won the seam law. That is the conservative reading and the cheapest to record.

Consequence of "read from source": a parsed list that was edited keeps the layout its source had. If its separators were inline it never breaks; if they held line breaks it stays broken, and its default flanks now break and indent with it instead of rendering `f(a,` / `b,` / `c)` (question 2).

## The pass interface

A breaking rule receives the table read-only, with one thing it may do:

- **Reads:** rows (text or seam, width, whether it holds a line break, depth, list, place in the list, whether the gap admits a line break, whether a mark was set or read from source); lists (parent, head, tail, at a declared pair, separated, broken as written); the width, the indent unit's width and the tab width.
- **May do:** turn an adjustable seam into a line break. A request on any other seam is refused.

Which lists a rule breaks is the rule's choice among those whose seams are adjustable. The first rule takes the lists at a declared pair (question 14).

Everything else follows from the seams, by rules of the table:

- **A list is broken** when a gap between its items holds a line break, or its head or tail gap does, whether written that way or broken by the pass.
- **Continuation depth** is as above.
- **The conditional trailing separator** is written when its list is broken. `ListView.trailing` is computed before render today; with a table the separator is written as rows that exist only when the list is broken, so the decision waits for the pass. Without a table (no width, or a fragment) the list is judged by its separator's after arm.
- **A multi-line item**, such as a closure with a block body or a source slice of several lines, is a text row holding a line break. A rule sees it and decides; the first rule ends its measurement there.
- **A comment inside a list.** A line comment between items leaves a line break in one of the list's own gaps at trivia strength. The list is then broken as written. A block comment is text and forces nothing.

## Breaking rules and options

### `group`, the first rule

Lists are decided in document order, outermost first.

- A list stays on its line when its rows, flat, plus what follows it up to the next place the line can end, fit in the width. The line can end at a line break, at a broken seam of an enclosing list, or at the head of a later list that could break.
- A line break inside the list ends the measurement there: the list is judged by its first line, so a callback argument does not force a call's arguments apart.
- Otherwise every adjustable seam of the list becomes a line break.
- A list that is broken as written breaks its remaining adjustable seams whatever the width.
- Each list is decided on the line it stands on. Inside a list that stayed flat, a list on the same line fits by the same measurement; inside a broken one, each item starts its own line.

This is the line judged to its end. It is linear: each decision looks ahead at most one width of rows.

### `fill`, to show that a second rule plugs in

A separator gap becomes a line break only when the item after it would cross the width. It is about 70 lines over the same table and gives `function rebaseKinds(kinds: …, editStart: number,` / `delta: number): … {`. A rule is one function over the pass interface, one value of the option and one arm of a `match`.

A third candidate, hugging, is in question 3.

### Options and how they travel

*Ruled 2026-10-09 (questions 7 and 8):* every whole-render layout setting sits in one `layout` group under `render`:

```ts
render: { layout: { width: 100, tabWidth: 4, breaking: 'group', indent: '\t', newline: '\n' } }
```

- `width`: columns. Unset, and not detected, means no table.
- `breaking`: `'group'` (default) or `'fill'`.
- `tabWidth`: how many columns a tab counts as when a line is measured against `width`. Tabs are always written as `\t`; this setting only measures. Default 4.
- `indent` and `newline` move into the group: `indent` from `render.indent`, and `newline` as the line-endings plan adds it there.

They are not site addresses. They are accepted at engine level (`createEngine(language, { render: { layout: { width: 100 } } })`) and per call, read by `Options::read` and carried in the resolved options the writer already holds. A grammar that declares no bracket pair has no `width` key, as a grammar with no indent character has no `indent` key. The root dispatch chooses the table output when a width is set and the transport is the grammar's root kind ([Staging](#staging)).

## The conditional trailing separator

- **A third value of the delimiter option:** trailing only when the list is broken (bit 4 beside `Leading` 1 and `Trailing` 2; name to be chosen, question 6). Every list that admits `Trailing` admits it.
- **Read from source.** The generated wrap stamps every parsed list's delimiter from its source today (`Trailing` or `None`), and the emit tool prints it. That is why the rebuild renders `{ start: e.start_pos, end: e.end_pos, }`. Proposed reading: a trailing separator on a broken list reads as the conditional value, on an inline list as `Trailing`; none on a broken list reads as `None`; none on an inline list reads as the site's default when that is `None` or the conditional value. The reader needs one more fact per parsed list, whether its source layout is broken.
- **Measured** on `splice.rs` with the three struct expressions given the conditional value (`outputs/rust-conditional-separator.txt`): one line without the comma at 100; at 70 the list breaks and the comma is written.

## The five examples

Group rule, a tab counted as one column as in the issue's table. Outputs are in `outputs/`.

| Example | Flat | At 120 | At 100 |
|---|---|---|---|
| ts returned object | 102 | one line | broken, as the source has it |
| ts `rebaseTriviaItems` parameters | 135 | broken, as the source has it | the same |
| ts `rebaseKinds` parameters | 147 | broken, as the source has it | the same |
| rust `InvalidRange` fields | 90 | one line; 89 without the comma once the delimiter reads as conditional | the same |
| rust `NonCharBoundary` fields | 93 | one line; 92 without the comma | the same |

```ts
function rebaseTriviaItems(
	trivia: readonly FormatTrivia[] | undefined,
	editStart: number,
	delta: number
): FormatTrivia[] | undefined {
```

```ts
	return {
		...format,
		...(trivia !== undefined && { trivia }),
		...(kinds !== undefined && { kinds })
	};
```

```rust
            return Err(SpliceError::InvalidRange { start: e.start_pos, end: e.end_pos });
```

At 100 the rebuilt `format.ts` differs from its source in three lines, all blank lines the rebuild does not carry.

What else moves in those two files, so the maintainer sees the rule's reach:

- `splice.rs`, at 100 and at 120: two match arms break their struct pattern because the macro call after it is long (`SpliceError::OutOfBounds {` / `end,` / `source_len` / `} => write!(…),`). Nothing else on those lines can break, since a macro's token tree is not a separated list.
- `splice.rs`, at 100: an `if` condition of 107 columns breaks its last call's single argument, because operator chains do not wrap.
- Narrower than the examples need, a call wrapping one struct expression breaks the call before the struct (`Err(` / `SpliceError::… { … }` / `)`); rustfmt keeps `Err(SpliceError::… {` together. See question 3.

Lines differing from the original source, both sides counted:

| file | width unset | group | hug | fill |
|---|---|---|---|---|
| `engine.rs` at 100 | 299 | 247 | 219 | 322 |
| `splice.rs` at 100 | 51 | 59 | 59 | 53 |
| `format.ts` at 120 | 21 | 9 | 9 | 23 |
| `transport-data.ts` at 120 | 19 | 14 | 14 | 23 |

## Gates

1. **Width unset is byte-identical on all five grammars.** The validators' report equals the committed one; the dogfood byte fixtures and every crate's tests pass. The writer without a table is the same code, so this is a gate on the refactor, not on the table. Prototype: report identical, 21 of 21 byte fixtures, `cargo test --workspace --no-default-features` green.
2. **The table is a faithful record.** A rule that breaks nothing, rendered through the table, equals the direct writer byte for byte on the same suites. This needs a test-only way to force the table. Prototype, at a width nothing reaches: validator counts identical, 21 of 21 byte fixtures, the four rebuilds identical.
3. **Breaking never changes the parse.** The validators through the table at width 1 keep every count in all five grammars. Prototype: identical.
4. **The five examples** render as tabled above.
5. **Benchmark.** `sittir tool bench` and `check-perf` unchanged with the width unset; reported with it set. Prototype: writer plus 70 to 80%, a render call plus 6 to 7%.
6. **Every site that admits a line break takes one.** One validator run per grammar with a line break forced at every admitting site at once keeps every count. It widens gate 3 from list seams to the whole fact, and it is how rust's three lexical exceptions were found. Prototype, with every site that takes a forced break on its own: 495 typescript sites, 303 python and 785 rust sites forced together, every count unchanged. The run costs one validator pass. It sees what the parser sees, so it cannot stand in for python's bracket rule.

The table can be filled without changing output when the setting is off. It is not filled at all then.

## Staging

A proposed order of work, relayed with the reframing and not ruled:

1. Refactor the writer onto an output trait, with the text output only. Byte-identical.
2. The table output, the list calls, `width`, the group rule and the admission fact.
3. The `prepare` change.
4. The conditional trailing separator.
5. More rules.

The trait is the maintainer's shape: the writer is already generic over its output, so the output becomes the trait, in place of a second type parameter with a check at each hook.

### The output trait, against the prototype

It holds up. The measured variant of the prototype was rebuilt on it.

- **Shape.** The trait is the table's recording methods: text, the begin and end of a resolved seam, a note about the pending gap, indentation owed, the lexical space, list open, gap and close, the conditional trailing separator, finish. The text output implements each as the write the writer does today, or as nothing. It is implemented once, for everything that is `fmt::Write`, so the writer's callers do not change: on master the writer touches its output in one place (`emit`), and every construction in the core, its tests and the generated crates compiles as it is.
- **Result.** The writer has no `Option` and no second parameter left; 17 calls go to the output. Against the type-parameter prototype the writer's own diff shrinks by a quarter (244 changed lines to 186), and the trait with its two implementations is 176 lines in the table module.
  - Tests: `cargo test --workspace --no-default-features`, 255 passed, as before.
  - Bytes: 28 of 28 rendered outputs identical (four rebuilds; width unset, 100 and 120; group and fill), and the four with the width unset equal master's.
  - Time, writer only, three runs: `engine.rs` 151.7 to 160.7 µs with the width unset (master 160.6 to 161.7) and 270 to 277 µs at 100 (type-parameter variant 278). The other three files agree in the same way.
  - Size: rust `.node` 4,739,168 B and typescript 5,411,248 B, within 32 B of the type-parameter variant. Both writers are still compiled, as before: in the rust library the text writer is 5,384 B of code in 19 symbols, the table writer 8,968 B in 39, and the table module, which now holds the trait and its two implementations, 7,488 B in 17 (type-parameter variant: 8,124 B, 9,160 B and 7,496 B).
- **Three things the trait needs that the proposal's list does not name.**
  - *Notes.* A gap's facts arrive mark by mark, before the seam is resolved. If the writer kept them it would pay for them with the width unset. So the output takes each fact as it arrives, which is nothing for text, and when the writer sets a pending seam aside (trailing trivia) the note is taken and put back with it.
  - *A compile-time flag.* The writer must know whether the output lays lists out, to leave the conditional trailing separator to it. An associated constant does that at no cost.
  - *Deferred runs stay the writer's.* A trailing comment is rendered into the writer's own buffer and seated later as one piece of text. That branch is not the output's business and stays where it is.
- **One addition to step 1.** Route the generated root dispatch through one function in the core that builds the writer. Step 1 is then the only step that changes the generated dispatch; step 2 adds the choice of output inside the core.

### The order

- **Step 3 has to come before step 2, or inside it.** Until the list view resolves a separator's arm by its site, a separator reaches the writer as a bare arm. The writer then knows neither the separator's site, so not whether it admits a line break, nor whether the caller set it. The prototype covers this with a shortcut (every separator arm on a node is treated as a default), which breaks "explicitly set wins" for exactly the seams the pass changes most.
- **Step 2 can ship without deriving admission.** It needs the per-site flag byte and three declarations: none in rust and scm; bracket pairs in python and typescript; the root exception in regex. That gives the lists the prototype measured, with gates 3 and 6 as the check.
- **Deriving admission from the parser is its own step, after the table.** It is what restricts options and what lets typescript break lists outside brackets. It carries the two costs named in [Deriving the general condition](#deriving-the-general-condition): the walk back through the parse table for the sites that follow a child, and a decision on the 112 typescript sites the condition flags and the scanner tolerates.
- **Suggested order:** 1, the output trait; 3, the `prepare` change; 2, the table with declared sources; 4, the conditional trailing separator; then admission from the parser; 5, more rules.

## Beside the shared-arena draft, and a later kept table

- **The arena** is about how nodes are stored and cross to native. The table is downstream of the writer and reads nothing from the transport. Neither constrains the other.
- **A kept table** would need three things this one leaves out on purpose: which node wrote which rows (a column of node ids, which the arena's ids could supply); each seam's site and arm, to resolve it again when options change; and the writer's state at node boundaries (depth, pending seam, last character), to re-render one node's rows and splice them in. All three are added columns. Rows, seams, lists and the pass interface stay as they are.
- **What the transient table already gives a kept one:** indentation is derived, not stored, so moving a subtree to another depth rewrites no text.

## Limits to state plainly

- The first rule breaks only separated lists at a declared pair. With `()`, `[]` and `{}` declared, type argument lists in `<>` do not break, nor do operator chains, method chains, macro token trees or long strings. A line with none of the first kind stays long. Admission allows more than the rule uses: in the corpus, 66 rust lists and 70 typescript lists outside a pair have every gap free, and rust could declare `<` and `>` at no risk.
- Admission, where it is derived, is what tree-sitter's parser accepts. Where the parser is more lenient than the language the difference has to be declared, and nothing in the validators shows a missing declaration: python outside brackets, python's f-string field, typescript's `throw`.
- A list is recognized where the model has one list. At `fd189d4c9` a rule that spelled a first element followed by a repeat of separator and element was not one, so its head was not at the bracket and it stayed flat. On master `0f9556b17` that form is one list (python's `expression_list` and `pattern_list`, rust's `tuple_expression`): the prototype applied there breaks it inside brackets (`pairs = (` / `a,` / `b` / `)`) and leaves it outside them (`left, right = a, b`, `return a, b, c`).
- A source slice of several lines keeps its own indentation when the list around it breaks, as a parsed node moved to another depth does today.
- Decisions the render takes from the writer's state (whether trivia joins with a space or a line break) are taken on the flat layout and not revisited. They are trivia seams and never adjustable.
- Width counts characters. Wide and combining characters count as one.

## The prototype

When measured, in the scratch area: worktree `scratchpad/wt-386` (detached at `fd189d4c9`, holding the measured variant), worktree `scratchpad/wt-386m` (detached at `0f9556b17`, holding the validation variant, which applies there unchanged), and the folder now kept as `docs/superpowers/probes/2026-10-02-layout-table/` with patches, probes, outputs and logs.

- `prototype-core.patch` with `prototype-generated-hand-edits.patch`: the measured variant. The table is a type parameter; the conditional separator is in. It hand-edits generated list views and the dispatch, which a throwaway may do and the real change must not.
- `prototype-output-trait-core.patch` with the same hand edits: the measured variant rebuilt on the output trait. This is what `scratchpad/wt-386` holds now.
- `prototype-validation-variant.patch`: no generated edits, so the validators accept it. The table is switched on at run time; `SITTIR_LAYOUT_WIDTH` forces it on every render, `SITTIR_LAYOUT_UNSAFE` drops the bracket requirement, `SITTIR_LAYOUT_DUMP` prints a small table. It also holds the `fill` and `hug` rules.
- `prototype-oracle-variant.patch`: the validation variant plus the measurement behind [Which arms a site admits](#which-arms-a-site-admits). This is what `scratchpad/wt-386m` holds now.
  - `SITTIR_SEAM_ORACLE=<dir>` records every gap of every render with its sites, parses the output with the parse log on and writes one line per gap with the parse states and the watched tokens valid in them (`SITTIR_SEAM_WATCH`).
  - `SITTIR_FORCE_LINE_SITE=<site>` and `SITTIR_FORCE_LINE_SITES=<file>` force a line break at one site, or at a set of sites at once.
  - `probes/oracle-report.py`, `probes/forced-report.py` and `probes/static-admission.py` produce the tables; their outputs are in `oracle/`. [Tools](#tools) lists every script.
- Shortcuts a real change replaces: bracket flags are read off site labels or paths instead of a declared and stamped fact; the table is on for every render with a width, not only a root; separator arms on a node are treated as defaults; the pending gap's note does not travel through `take_seam`.
- Two cautions for anyone rerunning: `sittir validate counts` records a commit on the checkout it runs in unless `SITTIR_HISTORY_NO_COMMIT=1` is set, and `pnpm exec` can wait for minutes while another session runs pnpm, so the probes call the binaries directly.

## Tools

Every measurement in this note can be rerun from `probes/`; the probes folder's `README.md` gives the commands in order. Each script's header says what it measures, how to run it and what it prints, and each runs from the root of the checkout it measures. Nothing is promoted; the last column is a recommendation.

The existing tools were checked first (`sittir tool --help`). `bench` times corpus renders end to end, `check-perf` holds a baseline of FFI round-trip time and payload size, `emit-factory-source` makes the fixtures, and `separated-lists` is a compile-time census of list shapes. None of them measures a line width, the writer alone, a binary's size, or what the parser accepts at a seam.

Switches in the prototype's native code, which exist only in the patches:

| Switch | What it measures | Promote |
|---|---|---|
| `SITTIR_LAYOUT_STATS=1` | Writer time from its creation to the end of `finish`, split into the walk and the pass with the flatten, and the table's rows, seams, lists and bytes; one line per render | Yes, with the table. It is the only figure that separates the writer from the projection and the napi decode. The writer is 6% of a call, so `bench` cannot see a writer regression. As a cargo feature of the core, not an environment check in a release build. |
| `SITTIR_LAYOUT_DUMP=1`, `SITTIR_LAYOUT_ROWS=1` | The table of a render row by row, with why each seam did or did not break; row counts by kind | Yes, with the table, as `sittir tool layout-table` (a source or file, a width, a rule). |
| `SITTIR_LAYOUT_WIDTH=<n>` | Forces the table on every render | Yes. Gates 2 and 3 need a test-only way to force the table; make it a validator option. |
| `SITTIR_LAYOUT_UNSAFE=1` | Drops the bracket requirement | No. It showed why python needs pairs; the admission fact replaces it. |
| `SITTIR_SEAM_ORACLE`, `SITTIR_SEAM_WATCH` | Per gap: the sites that met there, the list role, the brackets, and the line-sensitive tokens valid in the parse states where the next token was lexed | Yes, as `sittir tool seam-oracle`, behind a cargo feature. It is what admission is checked against, and it has to be rerun when a grammar or its scanner changes. |
| `SITTIR_FORCE_LINE_SITE`, `SITTIR_FORCE_LINE_SITES` | Forces a line break at one site, or at every site of a set | Yes. The set form is gate 6, as a validator option. The single form names the site when gate 6 fails. |

Scripts:

| Script | What it measures | Promote |
|---|---|---|
| `render-files.mts` | Four real files rebuilt through factories, at a width and a rule: bytes, lines, widest line, lines over 100 and 120 columns, and render time split into projection and native | Yes, as options of `bench` (a file, a width, a rule, the line-width columns), not as a new tool. Gates 4 and 5 read these columns. |
| `writer-stats.mts`, `writer-stats.py` | Runs and summarizes the writer timer: writer time per file and width as a range over runs, the pass with the flatten, the table's size | Yes, as the mode of `bench` that reads the timer. Writer time per output byte belongs in `check-perf`'s baseline. |
| `validate-through-table.sh` | Validator counts with the table off, on with nothing to break, and with every breakable list broken; how many renders and lists went through | Yes, as the validator option above. The script is then two lines of CI. |
| `site-admission.py` | Per grammar, which arms each site admits and which it holds by default, tallied | Yes, as `sittir tool site-admission`, reading the site model. This script reads the generated Rust, which a real tool must not. It is the census a restriction of admission is reviewed with, and its counts can be ratcheted. |
| `oracle-run.sh`, `oracle-report.py` | Runs the oracle over the validators' renders; classes each site by whether a line-sensitive token is ever valid at its inline gaps; lists by bracket position | Yes, as the report of `seam-oracle`. |
| `forced-sites.py`, `forced-run.sh`, `forced-report.py` | One validator run per site with a line break forced there, crossed with the oracle's class of the site | Yes, as a diagnostic of `seam-oracle`. It found the three lexical sites in rust and the four inside strings. It is costly as written, one validator run per site (788 for rust); bisecting over sets would make it logarithmic. |
| `forced-sets.py`, `forced-all.sh` | Every site of a set forced in one run | Yes. This is gate 6. |
| `state-report.sh`, `static-admission.py` | Whether admission can be derived from tree-sitter's state listing and `parser.c` alone, and how far that agrees with the oracle | No. It is a sketch of the derivation, which belongs in the compiler; its comparison with the oracle becomes that step's test. |
| `binary-size.sh`, `writer-code-size.py` | Library and shipped `.node` size, writer and table symbol counts, code bytes per instantiation of the writer | The `.node` size: yes, as a field of `check-perf`'s metrics, since nothing watches binary size today. The breakdown per instantiation: no, it answered one question. |
| `build-time.sh` | Release rebuild time, wall clock and CPU, three runs | No. On a shared machine the spread between runs is larger than any difference it measured. |
| `example-*.mts`, five | One behaviour each: the conditional separator, an explicitly set site, python's bracket rule, the f-string field, the table of a small render | No. Each becomes a test when its step lands. |
| `make-fixtures.sh`, `build-native-direct.mts`, `root.mts`, `oracle_lib.py`, `line-tokens.json` | Support: fixtures through `emit-factory-source`, a native build that does not wait on pnpm, shared code, the line-sensitive tokens of each grammar | No. `line-tokens.json` holds the fact question 13 asks the grammar to declare. |

## Layout inference, kind runs and gap sets (2026-10-08)

This section folds in what was ruled on 2026-10-08, the writer change ruled the same day, and the gap census's statement-list measurement (`sittir tool gap-census --runs`). Where it conflicts with an earlier section, this one holds. It adds questions 16 to 21.

### Ruled on 2026-10-08

- **Detection, not preservation.**
  - Layout read from a parsed tree is detected as options: the line ending, the indent unit, and the gaps of statement lists. A rendered gap is spelled from the detected option, not from that gap's own source bytes.
  - Acceptance:
    - a source rendered unedited equals itself wherever it follows its own pattern;
    - an inserted statement takes the pattern's gap;
    - an explicit option overrides a detected one;
    - a source gap that departs from the file's own pattern is evened out to the pattern (statement-list gaps are no longer stamped, question 18).
- **Detection stays internal.** There is no public `inferOptions`. The public way in is `engine.styleFrom` (see [Detection](#detection)). The tree-inferred options work's inference walk and "indentation as one fact" are absorbed into this design. Its per-site table resolved at `prepare` is dropped, and so is its tree layer in the native resolution: a detected option reaches the engine as an ordinary option (see [Detection](#detection)).
- **Where each detected option applies.**
  - The line ending and the indent unit apply to every render, a fragment included, and need no table.
    - The line ending is applied by a `LineEndings` write adapter at the end of the render (`docs/superpowers/plans/2026-10-08-line-endings.md`, approved, executed after the typed reader's 1c-i).
    - The indent unit is the writer's `indent`.
  - Run patterns and the width apply on the table. A root render builds the table whenever either is in effect; with neither, there is no table and the output is byte-identical.
- **"Run" means a run of kinds.** A run is a maximal sequence of consecutive items of one kind in a list, such as a block of imports. Repeated whitespace is not a run. `blankline` is `seq(newline, newline)`, `double_blankline` is three references, and there is no general whitespace-count primitive.
- **Run addresses take both shapes.** Under a list slot:
  - `(source_file)/statements:/(_)/run/before|after` is any run;
  - `(source_file)/statements:/(use_declaration)/run/before|after` is a run of that kind.

  The kind address wins by the address design's strict-subset rule. Inside a run, the existing seated `(_)/after` and `(K)/after` sites keep applying.
- **The table copies text.** Measured against borrowing:
  - a borrowed row needs a 16-byte `&str` beside the row's facts, about 24 bytes in place of 12;
  - rows come every 3.6 to 4 output bytes, while the copy costs one byte per output byte;
  - adjacent pieces merge into one row only because they are adjacent in the copy;
  - borrowing would also put a lifetime on `RenderSink` and on every generated render function.

### The gap's valid set replaces per-site admission

The writer change ruled on 2026-10-08, which sittir-implement is building, gives every gap an exact set of legal layout kinds:

- **One sink call.** `seam(kinds: LayoutKinds)` replaces `seam` and `token_seam`.
  - A whitespace token, or source trivia classified when it is read, passes one fixed kind.
  - Any other seam passes the set of kinds valid at its gap.
  - The writer takes the resolved arm, else the narrowest kind.
- **Leaf edge sets.** Each leaf kind carries a leading and a trailing accepted set, derived from its pattern with `CharSet`: the layout kinds the pattern cannot absorb. A pending seam is intersected with the set where it lands. A leaf's own text is written with the empty set.

A gap's valid set is the intersection of two sets:

1. **The context set,** fixed at compile time per seam. Python allows a line break only inside a bracket-delimited node; outside one, the break is `line_continuation`. Typescript allows none at its no-line-terminator positions.
2. **The leaf edge sets** of the leaves on either side.

The leaf edge sets cover what [Which arms a site admits](#which-arms-a-site-admits) found by forcing breaks: rust's three lexical sites (`#!` then a newline, `1.` then a newline) are leaf-edge facts.

**The "matches whitespace" rule (ruled by the maintainer 2026-10-08).** A whitespace layout kind is not eligible at a seam if a pattern that applies at the seam matches its text. The leaf edge sets apply the rule to the two neighbouring leaves. Step 3 extends it to the lex state: every token that could be lexed at the seam, which comes from the parse table.
- **Example, regex:** between `)` and `|`, a `pattern_character` (`[^…\r\n]`) could start, so space and tab drop out there. Newline stays legal, because it is regex's extra, but nothing asks for it.
- **What this decides without any declaration:** regex's root and any kind whose content is lexed this way.
- **Python's f-string fields need nothing either:** the grammar targets Python 3.14, where a replacement field may span lines (PEP 701).

What the lex state cannot supply is a scanner's context, decided outside the lex tables. That part of the context set has no source in `grammar.json`, so it needs a declared one.

**The context set's source (ruled by the maintainer 2026-10-08: declared in `grammar.sittir.ts`, never as an options row).** Legality is a grammar fact, not a preference, the way immediacy is `token.immediate` and `renderAs`. It takes two forms:

- **Newline's choices in a context: python's pairs.** Python allows a break almost everywhere in an expression; what changes with the context is how the break is spelled. Inside a pair it is the plain `_newline`. Outside every pair it is the escaped break `line_continuation` (`\\` then a newline, already an extra of the grammar). That is a choice for one member, not a narrower set:

  ```ts
  layout: {
  	newline: { outside: $.line_continuation, within: [['(', ')'], ['[', ']'], ['{', '}']] }
  }
  ```

  The statement gaps are untouched: the break between statements is the scanner's own `_newline` token, which passes one fixed kind.
- **A narrower supertype: typescript's no-break positions, derived (ruled 2026-10-09).** After `return`, `break` and `continue`, and before a postfix `++` or `--`, no spelling of a break is legal, so the gap draws from a narrower supertype. Enrich mints `_inline_layout` (`_tight`, `_space`, `_tab`) as a hidden supertype beside `_layout`. No marker places it: the positions come from the "matches whitespace" rule over the lex state (step 3).
  - **The automatic semicolon is a token that matches whitespace.** Its lexical shape is a line break that the external scanner does not continue: `\n` not followed by a character that continues the expression (`.`, `,`, `(`, `[`, a binary operator, `?`, `:`, `=`, a backtick, and the scanner's handling of `++` and `--`). That pattern, with its lookahead, is the one declared fact, mirroring the scanner, the way `renderAs` gives python's string externals their shape.
  - **Where it is lexable at a seam and matches `\n` plus the next leaf's first character, the newline kinds are ruled out** and the seam's `kinds` compile to `_inline_layout`'s members. `return` ⎵ `x` matches (`\nx`), so the gap is inline only. `a` ⎵ `+ b` does not (`\n+`), so it keeps its break: the 112 sites the parse table alone flags, and that take a break with no change, come out right.
  - **`throw` and `=>` are upstream.** tree-sitter-javascript accepts a break after `throw` and before `=>`, which JavaScript rejects; neither involves the automatic semicolon (`=` continues the expression). The parser is followed and the difference is reported upstream; nothing is declared for it.
  - **Open for the implementation:** whether `renderAs` can carry a lexical pattern for a token whose render spelling differs (an automatic semicolon renders as `;` or nothing), or whether the lexical shape needs a sibling declaration.

**How it compiles onto each seam's `kinds`.**
- **A narrower supertype:** the emitter writes the supertype's members as the constant `kinds` of the seam at that gap.
- **A newline choice:** `kinds` holds the `newline` flag, meaning "a break may go here". Which member spells it is the context's choice:
  - **At compile time** where every occurrence of the seam's kind lies in one context. Python's `argument_list` is itself delimited by a pair, for example.
  - **At render time** where a kind occurs both bracketed and bare: `parameters_elements` under `def` and `lambda`, `import_list`, `pattern_list`, `expression_list`. The emitter marks the pair tokens; the writer keeps a stack of contexts and spells the `newline` flag with the top one.
- **The table and the width rule** see one "a break is legal" flag either way. In python the first rule breaks only lists at a pair (question 14), so it never writes a continuation.

**Later, not scoped: the same facts as `bindings.scm` captures.** Once the generator reads `bindings.scm` (the bootstrap work, where the generator runs sittir's own scm package), the declarations above can move beside the vocabulary claims, as query captures that reach codegen through a generated `grammar.bindings.ts`. They would compile onto `kinds` exactly as above. Proposed names:

- `@layout.break.<kind>` on a node: inside it, a break is spelled with that layout kind, and the innermost capture wins.

```scheme
; python
(module) @layout.break.line_continuation
(_ "(" ")") @layout.break.newline
(_ "[" "]") @layout.break.newline
(_ "{" "}") @layout.break.newline
```

Typescript needs no capture: its positions are derived (above).

What this changes in the table: a seam row carries its gap's valid set in place of the "admits a line break" bit.

- **The kinds a gap's set can hold:** `tight`, `space`, `tab`, `newline`, `blankline`, `double_blankline`, plus python's `line_continuation`: seven.
- **What stays out:** `indent` and `dedent` are depth marks, carried on the writer's depth and never ranked as a gap's text, so they are not members. Python's `line_continuation_nul` (`\` then a NUL) is an extra no render writes.
- **Seven fit in the row's existing `fact` byte,** so the row stays 12 bytes.
- **If the writer's `LayoutKinds` also carries the depth marks,** it is nine or more bits. Then the row needs a `u16` there, and alignment takes it to 16 bytes, a third more table per output byte. The table should store the gap's set without the depth marks either way. Confirm against the writer's `LayoutKinds` when its branch is named. Breaking rules and run patterns pick from that set and never decide legality themselves. The per-site flag byte beside `SITE_SPECS` is not needed.

### Statement runs: what the corpora show

The census counted the blank lines between adjacent items of every statement list, inside a run and at a run boundary, under three groupings: parser kind, supertype and vocabulary role. Gaps holding a comment are excluded. The real-world sets are 106 rust files from the cargo registry, 117 typescript files from `node_modules`, and 109 python files from the 3.14 standard library.

Share of gaps holding at least one blank line:

| list | grouping | within a run | at a boundary |
| --- | --- | --- | --- |
| rust `source_file` | kind | 10.7% | 30.2% |
| | supertype | 12.2% | 36.9% |
| | role | 12.9% | 31.7% |
| typescript `program` | kind | 32.4% | 67.5% |
| | supertype | 36.0% | 66.1% |
| | role | 35.0% | 64.7% |
| python `module` | kind | 52.8% | 84.1% |
| | supertype | 56.4% | 79.8% |
| | role | 55.7% | 85.3% |

Per kind, the signal is much stronger than the boundary alone suggests:

- **Grouping kinds:** packed inside a run, blank after it.
  - rust `use_declaration`: within 248 of 297 gaps hold none; after the run, 80 of 124 hold one.
  - rust `const_item`: within 972 of 975 hold none.
  - typescript `import_statement`: within 69 of 78 hold none; after the run, 19 of 23 hold one.
- **Separated kinds:** a blank line after every item.
  - rust `impl_item` bodies: within 122 of 183 hold one.
  - typescript `function_declaration`: within 70 of 105 hold one.
  - python module-level `function_definition`: within 85 hold one and 96 hold two; `class_definition`: 97 hold one and 76 hold two.
  - python module-level `decorated_definition`: within 13 of 13 hold two.
- **Prefix kinds:** never followed by a blank line. Rust `attribute_item`: after the run, 566 of 567 hold none.

Three findings for the design:

1. **The parser kind groups about as well as anything coarser.** It has the lowest within-run share in all three grammars. Its boundary share is within seven points of the best: supertype is higher in rust (36.9% against 30.2%), role in python (85.3% against 84.1%). A coarser grouping needs a classifier and does not separate clearly better. Recommend the parser kind (question 17). Shares count gaps between items on separate lines; same-line pairs are left out.
2. **Two wrappers hide kinds the pattern needs.**
   - Python's `simple_statements` holds imports and assignments alike, so "imports, then code" is one run of `simple_statements` (523 of 733 within-run gaps hold none, 195 hold one).
   - Typescript's `export_statement` wraps the declaration it exports.

   Before ruling, the census should be rerun with these two keyed by the statement they hold (question 17).
3. **A boundary gap coalesces the two sides with the existing seam law** (ruled, question 16): strength, then rank. Detection keeps rust's attributes right. An attribute's run ends in a newline 566 times in 567, so the run after it shows no uniform `before` and none is detected.

### Statement runs: the reruns (2026-10-08)

`probes/statement-runs.mts` (output in `outputs/statement-runs.txt`) reruns the run measurement. Its real-world sets are drawn afresh: every k-th file of 1.5 to 30 KB, from the cargo registry (139 parsed), `node_modules` (139) and the python 3.14 standard library (81), so the shares differ a little from the census's. Shares count gaps on separate lines, holding at least one blank line.

| real-world list | keying | within a run | at a boundary |
| --- | --- | --- | --- |
| rust `source_file` | kind | 19.6% | 28.8% |
| | through wrappers | 19.6% | 28.8% |
| | role | 21.1% | 27.3% |
| | **attributes seated** | 24.8% | **71.3%** |
| rust `block` | kind | 16.4% | 30.0% |
| | attributes seated | 16.4% | 32.2% |
| typescript `program` | kind | 46.7% | 95.0% |
| | through wrappers | 47.2% | 97.2% |
| | role | 49.5% | 97.3% |
| python `module` | kind | 53.3% | 90.2% |
| | through wrappers | 51.6% | 83.4% |
| | role (through wrappers) | 53.7% | 92.2% |
| python `block` | kind | 22.9% | 21.1% |
| | through wrappers | 28.8% | 15.7% |

- **Seating prefix kinds is the one large effect.** With rust's attributes seated onto the item after them, the boundary gaps that hold no blank line fall from 1,440 to 147, and the boundary share goes from 28.8% to 71.3%. An attribute-to-item gap is the item's own, not a run boundary.
- **Keying through wrappers helps typescript a little** (`export` grouped with what it exports: 95.0% to 97.2%). **It hurts python's generic statements:** `simple_statements` keyed by its statement splits an assignment from the call after it, which adds boundaries with no blank line (module 90.2% to 83.4%, block 21.1% to 15.7%).
- **Python's role grouping, through the wrappers, gives the best module boundary share (92.2%).** It groups `import` with `from … import` while leaving generic statements together, but in rust it does slightly worse than the kind.
- **Python imports followed by a definition:** 7 module-level boundaries, 3 with one blank line and 4 with two. Imports followed by anything else: 53, of which 43 have one blank line. Under the ruled coalescing, a detected `(import)/run/after` of one line and a `(class_definition)/run/before` of two give two, as PEP 8 asks.

### Detection

One native walk over a parsed tree, run when `styleFrom` is called. It returns its result to the client as an options object in the language's `render` options shape, and keeps nothing in the native option chain. Per statement list kind, it detects:

- **Within-run gaps.** `(_)/after` is the dominant gap inside runs over all kinds. `(K)/after` is detected for a kind whose own dominant gap differs from it and that has at least as many votes as the smallest kind the corpora show a pattern for (question 20).
- **Boundaries.** `(K)/run/after` is the dominant gap where a run of K ends. `(J)/run/before` is detected only where the before-attribution is uniform across J's predecessors and is not already explained by those predecessors' `after`. `(_)/run/after` and `(_)/run/before` are detected from the rest.
- **The indent unit:** the consensus of line starts, today's `extract_format` rule, which replaces the tree's format record.
- **The line ending:** the majority of logical breaks (`\r\n`, `\n`, `\r`). This feeds the adapter's `newline`.
- **No pattern:** a tie, or no occurrence, leaves the key absent, and the declared default applies. The detection records each key as detected or defaulted; `styleFrom` reports that later.

Precedence (ruled by the maintainer 2026-10-08) follows the acceptance that an explicit option overrides a detected one. An engine's options are explicit too, so every key someone set beats detection:

1. per-call options;
2. the keys the engine's options set;
3. the detected options;
4. the grammar's declared defaults.

**Detected options are applied once, when `styleFrom` is called (ruled by the maintainer 2026-10-08).** `styleFrom` is the public entry; the detection behind it (`inferOptions`) stays internal. The native engine has no detected layer, and the client does no tracking.

- **When:** a call to `styleFrom` runs detection on the sources it is given. The client lays the keys `createEngine` was given over the detected options and hands the result to the native engine as its options, replacing what the engine held. That is the only point where detected options are applied.
- **Parse runs no detection and changes no options.** Neither does rendering, editing or disposing a tree.
- **Renders** go through the native resolve as today: per-call options over the engine's options, then the grammar's defaults.
- **Consequence:** nothing changes an engine's style unless `styleFrom` is called. A caller who wants a file's own style calls it once with that file, or its tree; until then, and for every engine that never calls it, the `createEngine` options and the grammar's defaults apply.
- **What the native engine needs:** a way to replace its options after construction. Today they are resolved once in the constructor.
- **Cost:** detection is paid only on a `styleFrom` call. Stage 4 measures it.
- **The shape (ruled by the maintainer 2026-10-08): `engine.styleFrom(...sources)`**, the one entry point.
  - **Sources:** `styleFrom(...sources: (Tree | SourcePath<G>)[])`. Each is a tree the engine parsed, or a file path.
    - **Path type:** `SourcePath<G>` is `` `${string}.${FileType}` ``, built from the descriptor's `fileTypes`. For a grammar with no file types it is `never`, so `styleFrom` takes trees only; the type is the whole gate.
    - **Computed paths:** `engine.isSourcePath(p): p is SourcePath<G>` narrows paths from globs, `readdir` or a command line to the same type.
  - **File I/O:** done by the client, not the native engine. `@sittir/common` reads each path with Node's `fs` (`readFile`), parses the text with the engine's own parser, and disposes those trees after detection, also when one fails. Trees the caller passed are left alone. Taking paths is what makes the call `async`.
  - **No run-time extension check.** An untyped caller who passes a file of another language gets a tree that parses with errors. Detection then finds few or no patterns, so most keys come back `defaulted`; nothing throws.
  - **More than one source:** detection's raw votes are summed across sources before the fold, so the result is never a majority of per-file majorities.
  - **Applying:** the `createEngine` keys win, and one native call replaces the engine's options.
  - **Return value:** the applied options, with each key marked `detected`, `defaulted`, or `set` where the `createEngine` options set it (ruled by the maintainer 2026-10-08). That is the record the tree-inferred options work said `styleFrom` reports.
  - **What it retires:** the engine-less `styleFrom(language, ...paths)` and `rust.styleFrom(...paths)` that the tree-inferred options work ruled, and the source-text `styleFromSource` beside them. Source text is parsed with `engine.parse` and passed as a tree.

This reverses the render-options design, which put a tree layer above the engine's options in the native chain, and the reversal is ruled. An engine configured with `indent: '\t'` now renders a parsed four-space file with tabs; before, it followed the file. Nothing in the native chain or the table depends on a render naming its tree for options. The typed reader's `$_layout.at` names a node's tree for its own reasons (folding an untouched node to its source).

Before and after, to measure in the stage that delivers patterns, for each of the three grammars:

- an unedited statement list renders as its source;
- a statement inserted mid-run takes the run's within gap;
- a statement inserted at a boundary takes the boundary's gap;
- with an explicit option, the option wins.

Today's render is the "before": an inserted statement takes the slot's declared default, whatever the file does.

### Staging, revised

Two pieces run outside this note: the line-ending plan, after 1c-i, and the `seam(kinds)` writer change, now. Then:

1. **The output trait,** text output only, byte-identical. The generated root dispatch goes through one core function. The prototype's table module is renamed (`table.rs`), because master's `layout.rs` now holds `TransportLayout`.
2. **The `prepare` change:** the list view resolves a separator's arm by its site.
3. **Context sets:** the "matches whitespace" rule over the lex state at each seam (from the parse table); python's `layout: { newline }` declared in `grammar.sittir.ts`; typescript's automatic-semicolon pattern, from which the `_inline_layout` positions are derived; both compiled into `seam(kinds)`; the writer's context stack. Gate 6. This step does not wait for the generator to read `bindings.scm`.
4. **Detection:** the native walk behind `styleFrom` returning an options object, applied once under the `createEngine` keys by the native engine replacing its options, and indentation as one fact. This stage already delivers the detected line ending and indent unit, with no table.
5. **The table output:** rows carry valid sets; there are list calls and a pass interface.
6. **The run-pattern rule over the table.** This is the first stage that delivers statement-gap patterns: an inserted statement takes the file's gap, and the before-and-after check above is its gate.
7. **`width` and the group rule,** then the conditional trailing separator.
8. **Later rules:**
   - **Column alignment:** multi-space runs render as one space today, in 160 rust gaps (aligned macro token trees), 18 typescript and 7 python.
   - `fill`, and admission derived from the parser where it is not yet derived.

Stages 3 and 4 do not depend on each other. Stage 6 needs 1, 2, 4 and 5.

## Open questions for the maintainer

1. **Bracket pairs: declared per grammar, or fixed in codegen?** (Revised 2026-10-08: legality is declared in `grammar.sittir.ts`, never in `options`; see question 19.)
   Recommend declared, in `grammar.sittir.ts`. In python the pairs are the contexts of newline's choice (question 19). In every grammar they also choose the lists the first rule breaks (question 14), which is the same declaration read by the rule, not a second one. Regex declares none.

2. **An edited parsed list whose source gaps were inline: may width break it?** Ruled (maintainer, 2026-10-09): yes. Width applies to every list whenever it is set or detected, parsed lists included, as detection-not-preservation already holds for gaps. A source-read seam is no longer "not adjustable" by that fact alone; an explicitly set one still is.
   - Detection gains `width` (ruled 2026-10-09): the file's longest line, measured with `tabWidth`, rounded up to the next multiple of 10. An unedited file gains no break, and inserted content breaks at the file's own width. A file whose longest line is one unbreakable piece (a long string or comment) detects a wide width and so breaks little; detection may later measure only lines that hold a breakable gap, if the corpora show such outliers.

3. **The first rule: plain group, or group that hugs a single item?** Ruled (maintainer, 2026-10-09): plain group.
   Recommended plain group now and hugging as a later rule. Hugging is closer to rustfmt (`Ok(ParsedTree {` … `})`; 219 against 247 differing lines on `engine.rs`) but misfires on a closure whose body ends in a call (`.map(|node| KindId(` / `node.kind_id()` / `))`), and a clean condition needs a fact the table does not hold.

4. **A list that already holds a line break between its items: do its default flanks break too, whatever the width?** Ruled (maintainer, 2026-10-09): yes.
   Recommended yes. A list is either flat or broken; this turns a comment-forced or explicitly separated list from `f(a,` / `b)` into a properly broken one. It applies only when a width is set.

5. **A multi-line item: judged by its first line?** Ruled (maintainer, 2026-10-09): yes. Otherwise a callback's block body forces every argument of its call apart, since the line holding the call never fits.

6. **The conditional separator's name, and whether rust's defaults move to it.** Ruled (maintainer, 2026-10-09): only where the grammar spells an optional trailing separator, the same condition `Trailing` has; the grammar makes it legal and the option chooses whether to write it. Name and rust's defaults as recommended.
   Recommended `Delimiter.TrailingIfBroken`. Recommend moving rust's bracketed lists to it as a separate change after the table lands: it is what rustfmt writes, and with no width it changes bytes only for lists broken as written.

7. **Tab width.** Ruled (maintainer, 2026-10-09): tabs are always written as `\t`; `tabWidth` only measures, default 4.
   Recommended a `tabWidth` option defaulting to 4. The issue's table counted a tab as one; oxfmt here counts two.

8. **Option names.** Ruled (maintainer, 2026-10-09): `render: { layout: { width, tabWidth, breaking, indent, newline } }`, with `indent` and `newline` in the group (see [Options and how they travel](#options-and-how-they-travel)).

9. **Should a seam row record its site and arm now?**
   Recommend no: nothing reads them, and they would add a third to every row. Add them with a kept table.

10. **A width set while a fragment is rendered.**
    Recommend that it renders flat, silently, as ruled, with the option's doc saying so. Refusing it would break `$render()` on any node under an engine that has a width.

Added with the reframing:

11. **Per-site admission: is this the right definition?**
    Recommend yes: a site admits the line-break arms when its seam is free or the grammar ends a line there, and otherwise only tight, space and tab. Without the second case the grammars' own defaults and four keys of the committed python options test would be refused.

12. **Admission from the parser: build it, when, and should it restrict options?** Ruled (maintainer, 2026-10-09): the options type reads the same `kinds` each seam already carries, with no new vocabulary. A site whose set excludes the newline kinds (typescript's derived `_inline_layout` positions) offers no line-break arms; leaf-edge exclusions are left to the writer's intersection. Typescript's positions come from the automatic semicolon's pattern (see [the context set's source](#the-gaps-valid-set-replaces-per-site-admission)), so the 112 keep their break.
    Recommended building it as its own step after the table, and restricting options only then.
    - Rust and scm need nothing built: no scanner token is line-sensitive.
    - Typescript needs tree-sitter's state report and a walk back through the parse table for the sites that follow a child. Neither is hard and neither is done.
    - Restricting options with it refuses 184 of the 569 typescript sites seen, 112 of which take a line break today with no change (before `.`, before a binary operator). Recommend declaring those to admit one rather than losing them.
    - Until then only declared exceptions restrict: regex, python's f-string field, typescript's `throw`, rust's three sites.

13. **The three declarations: names and places.** (Superseded by question 19.)
    The line-sensitive tokens keep `role(…)`. The bracket pairs and "does not admit a line break" become question 19's two forms in `grammar.sittir.ts`: newline's choices for python's pairs, and the `_inline_layout` supertype for typescript's no-break positions. Regex's root is decided by the "matches whitespace" rule, and python's f-string field needs nothing, since Python 3.14 lets a replacement field span lines. Neither goes in the `options` block.

14. **Which lists the first rule breaks, now that rust admits a break everywhere.**
    Recommend lists at a declared pair in every grammar, as measured. Admission says where a break is safe, not where it reads well: rust's trait bounds and `let` chains are free too, and a list broken at `+` or `&&` wants a different layout. Rust can add `<` and `>` to its pairs at no risk.

15. **The order of work.**
    Recommend the output trait, then the `prepare` change, then the table with declared sources, then the conditional trailing separator, then admission from the parser, then more rules. The `prepare` change has to precede the table: without it the writer cannot tell a separator's site, or whether the caller set it.

Added on 2026-10-08:

16. **Precedence at a run boundary.** Ruled (maintainer, 2026-10-08): the existing coalescing, as at every gap: strength first, then rank, so tight wins over space and a blank line over a newline. Rust's attributes stay right through detection: a run's `before` is detected only where its predecessors agree, and an attribute's run ends in a newline 566 times in 567, so after an attribute no detected `before` asks for a blank line. An explicit `(J)/run/before` applies after an attribute too; that is what the caller asked for.

17. **What "same kind" means for a run.** Ruled (maintainer, 2026-10-08):
    - seat prefix kinds (rust's `attribute_item`), derived from the seated-node fact, so an attribute-to-item gap is never a run boundary;
    - group runs by parser kind in every grammar, with typescript's `export` wrappers keyed by what they export;
    - python uses the parser kind, and "a blank line after imports" is an explicit option.

    The evidence is in [the reruns](#statement-runs-the-reruns-2026-10-08).

18. **Do occurrence stamps survive for statement lists?** Ruled (maintainer, 2026-10-08): statement-list stamps go, as recommended.
    `prepare` today keeps a kept source gap's class on the node. Under detection a statement gap is spelled from the detected option. Recommend that statement-list gaps stop being stamped and the run-pattern rule decides them; other lists keep their stamps until a rule covers them. The acceptance holds either way; what differs is a source gap that departs from the file's own pattern, which detection then evens out.

19. **The context set's form.** Ruled (maintainer, 2026-10-08): declared in `grammar.sittir.ts`, as newline's choices in a context or as a specific supertype; never in `options`. Not scoped yet: the move to `bindings.scm` captures, which waits for the generator to read `bindings.scm`.
    - Python's pairs take newline's choices: `layout: { newline: { outside: $.line_continuation, within: [pairs] } }`, with the writer's context stack where a kind occurs both bracketed and bare. Its f-string field needs no declaration: Python 3.14 lets a replacement field span lines.
    - Typescript's no-break positions take the minted `_inline_layout` supertype. Revised 2026-10-09: derived from the automatic semicolon's declared pattern through the "matches whitespace" rule, with no `gap(…)` marker.

    A supertype compiles to a constant `kinds`; a newline choice is spelled at compile time where the context is fixed, else through the writer's context stack. This replaces question 13's three declarations; the line-sensitive tokens keep their `role(…)`.

20. **Detection thresholds.** Ruled (maintainer, 2026-10-08): as recommended.
    Recommend the majority, with the declared default on a tie, and a kind-specific `after` or `before` only where it differs from the list's `(_)` value with support of at least three gaps. The number is a starting point to tune against the census; the detected options record which keys were detected and which defaulted.

21. **The order of work.** Ruled (maintainer, 2026-10-08): the revised order.
    Recommend the revised order in [Staging, revised](#staging-revised). It replaces question 15's order: the context sets come before the table, detection comes before the table and delivers the line ending and indent unit on its own, and run patterns come before width.
