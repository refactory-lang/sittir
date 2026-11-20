# A shared grammar rule library

**Status:** approved by the maintainer, 2026-11-20 ("Approved, write the plan"). A peer of its own builds it, on `feat/rule-library`, stacked on the body PR ("Stacked on the body PR").

## Why

Each sittir grammar fixes its upstream grammar in its own layer (`grammar.sittir.ts`): rules it reauthors with a cause and witnesses, and edits at positions in upstream rules. Typescript, rust and python hold about 30 reauthored rules and many edits today, and nothing is shared between them except the DSL's primitives. C, C#, Go and Java are bootstrapped on a branch, and every C-like grammar added will need the same fixes again: the `for` header's own declaration kinds, a statement's terminator, a numeric literal's sign and radix forms.

The maintainer's direction: "maybe we should implement a shared rule library, (somewhat modeled off the vocabulary/bindings and perhaps initially autoseeded) sittir grammars can just incrementally replace the upstream rules from the library... ultimately the rules library could be published independently of sittir".

## Decided by the maintainer (2026-11-20)

- **Organized by concept** ("By concept"): a library rule is a construct (a counted `for` loop, a statement terminator, a numeric literal), not a language family's fixes, so it is shared across families.
- **Library rules are rules** ("Rule shapes are rules"): a library rule is a tree-sitter rule written in the names the bindings converge on, not a function a grammar calls with its symbols.
- **Seeded from the grammars already mined** ("We already mined the other upstream grammars"): typescript, rust and python on master, and C, C#, Go and Java on `author/csharp-fields`.
- **The first version is a seed report and our own rules moved in** ("Seed report and migrate ours"). The branch's grammars adopt later.
- **The four grammars land on a new branch** stacked on the body PR, in the design worktree ("New branch, same worktree"); the body PR stays as reviewed.
- **A library rule is used as written** ("in theory we shouldn't have to compose rules from the library using our transformations - if written correctly, Java/c/c# should be able to reuse identical counted for declarations"). An adopting grammar takes the rule unchanged: no translation, no edit, no per-language variant.
- **The goal is correct lexing and parsing** ("The goal is perhaps correct lexing and parsing not identical parsing/minimal changes to the upstream"). A library rule is written to the language's own grammar, its lexical grammar included, not to stay close to upstream. Differing from upstream is expected wherever upstream is wrong; parsing as upstream does is not a measure of a library rule.
- **Kind renames reach the parser** ("Kind renames reach the parser"), replacing the 2026-10-10 ruling that low-level kind names stay upstream's. Every kind the bindings claim takes its converged name in the parser, as field names already do, so a library rule's references resolve in every grammar and a kind has one name at every level. A rename onto an existing kind is still a merge and still refused.

Rulings this builds on, from the same day: a portable path is defined by its slots and flags, so kinds whose slots and flags agree read as one path whatever rule produced them (portable spec, "A path is defined by its slots and flags"); a binding's rename reaches the field (portable spec, "A binding's rename reaches the field"); a position that admits fewer forms than its kind gets its own kinds, and the `for` loop owns its header's `;` (preference-address spec, "a position that admits fewer forms has its own kinds").

## Goals

- Each library rule lexes and parses its construct as the language's specification says: what it accepts, what it refuses, and how the tree is shaped. "Correct" is drawn where the grammar-acceptance plan draws it: the language's grammar productions, lexical and syntactic. Early errors (strict mode, duplicate names, a label's context) stay out of the parser, as that plan rules. (The maintainer, 2026-11-20: "Grammar rules only".)
- One rule per construct that two or more of the seven grammars spell alike, written once.
- A library rule carries the portable path it binds, so a grammar that adopts it gets that binding without writing it.
- A rule that holds one language's fact (an ECMAScript `_semicolon` with its automatic semicolon) is a library rule like any other, with its witnesses and the production it cites, and only that language's grammars adopt it. Where the shape settles a fact, no rule holds it: the counted `for` loop, with the header's own declaration kinds and the loop owning its `;`, admits no automatic semicolon in any grammar.
- A grammar adopts one rule at a time.
- The library can be published on its own: it is plain tree-sitter grammar syntax and depends on nothing in sittir.

## Non-goals (first version)

- C, C#, Go and Java adopting library rules, or landing on master. They feed the seed report only.
- Publishing. The library is a package boundary from the start, so publishing later is packaging.
- External scanners. A fix that needs a scanner change waits for upstream, as the grammar-acceptance plan already rules.

## Anti-goals

- A library rule with a branch per grammar. A rule only one grammar can use is that grammar's rule and stays in its layer.
- Generated library rules. The seed report proposes; rules are written by hand, as the vocabulary is.
- A second source for what a path holds. The vocabulary says which slots and flags a path has; a library rule must produce exactly those, and a check says so.
- A library rule held to upstream's behaviour. Where upstream accepts what the language refuses, or refuses what it accepts, the library rule follows the language.
- A library rule whose correctness rests on its author's reading alone. What it accepts and refuses is evidenced by witnesses that cite the language's productions and by the language's own compiler as a judge (`tsc`, `rustc`, CPython's `compile()`, as the grammar-acceptance census already runs them).

## How it works

**A library rule.** One or more tree-sitter rules for a construct, in the bound names: kind names from vocabulary paths (`boundKindName`: `statement.loop.counted` is `counted_loop_statement`) and field names as the bindings name them. With them:

- the path it binds, or none for a mechanism below a path (a terminator, a separated list, a numeric literal's forms);
- its witnesses: the forms it accepts and refuses, each citing the production that decides it, and the valid neighbours that must still parse;
- any conflict or precedence the rule needs, declared with it.

The counted `for` loop, as an example: one rule for typescript, javascript, C, C# and Java. It holds an initializer (a header declaration or expressions, then the loop's `;`, or nothing), an optional condition and `;`, optional updates, and a body. The header declaration is a part each language spells its own way (`let i = 0`, `int i = 0`), referenced by its converged name and defined by each grammar.

**Adopting.** A grammar's layer names the library rule in place of the rule it replaces, and the rule goes in unchanged. Because kind renames reach the parser, every kind name it references is a name the grammar's parser has, wherever the grammar's bindings converge that kind. The adopted rule:

- brings its binding: the path it carries is the grammar's binding for the adopted kind, and `bindings.scm` doesn't name that kind.
- needs every other kind it references to exist in the grammar under that name. A referenced kind the grammar's bindings don't converge (often a hidden helper such as `_expressions`) is a gap in the bindings, and the adoption is refused naming it. If the seed report shows that most shared shapes reference such kinds, how those parts are named comes back to the maintainer before any rule moves.
- is checked against the language, not against upstream. Its witnesses run through the grammar and the language's compiler, and they agree. Each validation row it moves is named with the reason, and a corpus case that now reads differently because upstream was wrong is replaced by a corrected local entry. Moving one of our own reauthorings into the library unchanged is the one place where nothing may move: that move's generated outputs are byte-identical.

**The seed report.** A probe over the seven grammars, reading each where it lives (master, and the merged branch). For each path two or more grammars bind, it sets their rules side by side in bound names and reports:

- the shape they share and where each grammar differs;
- the kinds a shared shape references that some grammar's bindings don't name;
- which of today's reauthorings and edits the path covers.

**Kind renames reach the parser first.** Before any library rule moves, the generated grammar bindings write each derived kind rename as a `rename` entry, so every grammar's parser, node model and low-level API use the converged kind names. This is one mechanical change per grammar, and every low-level kind name it changes is listed with its public changes. The bindings inventory and regeneration agree in one pass: today a capture that renames a field fails the inventory until regeneration has renamed it, and kind renames would widen that.

**The bindings generator keeps its job and changes role in places** (design's review, 2026-11-20; the maintainer's view: nothing is thrown away). It still binds every rule a grammar doesn't adopt. With library rules adopted as written and kind renames reaching the parser:

- The derived kind renames become `rename` entries in the generated bindings' wire block, replacing the separate `renames` export `printBindingsModule` prints today and nothing wires. `GrammarBindings.renames` stays the derivation's output.
- Derivation skips an adopted kind, and refuses any fact that targets one (a patch, rename, field wrap or split), since an adopted rule is used as written. A split is unnecessary where the library rule already has a kind per position.
- An adopted rule's path is the claim for its kind. The inventory merges it with `bindings.scm`'s claims, and refuses a `bindings.scm` claim or member capture on an adopted kind: its fields already carry the vocabulary's slot names.
- `renamedFrom`, `boundNameOf` and `baseNamesOf` carry every base-to-bound mapping once every claimed kind is renamed. An adoption that replaces an upstream rule under another name (upstream `for_statement` becomes `counted_loop_statement`) records that in `renamedFrom` too, so the conflict derivation and the fixture translation keep the chain.
- `boundKindName` is the naming contract library rules are written to; the library's check verifies each rule's kind names against it, so it stays the one source.
- The inventory checks captures against the derivation's own result, not the last generated grammar, so a renaming capture passes in one pass.

**What moves in the first version.** Every typescript, rust or python reauthoring or edit whose construct the seed report finds two or more of the seven grammars spelling alike moves into the library, and its grammar adopts the library rule in its place. A shared path alone isn't enough: numeric literals share a path in every grammar but are spelled differently in each. The rest stay in their layers. The seed report gives the list, and the maintainer sees it, before any rule moves.

## Approaches

- **Whole rules in the bound names (taken).** A library rule is a complete rule, so it travels between grammars and can be published as rules. More to write per rule than an edit.
- **Edits keyed by construct.** A library rule would be the edit itself, applied to each grammar's upstream rule. Cheaper to move today's edits, but an edit's positions belong to one upstream rule's structure (C's `_for_statement_body` and Java's `for_statement` are laid out differently), so a rule either doesn't travel or grows a branch per grammar, and it can't be published without the upstream rule it edits.
- **A library generated from the seed report.** Not taken: a generated rule can't be edited by hand, and the vocabulary stays authored for the same reason.
- **A shared base grammar each grammar extends.** Not taken: each sittir grammar already extends its own upstream grammar, and a tree-sitter grammar has one base.

## Constraints

- The grammar runs twice: tree-sitter's CLI loads the layer through `.sittir/grammar.js`, and sittir's `evaluate()` runs its own DSL. A library rule is plain tree-sitter grammar syntax in erasable TypeScript, so both run it.
- No scanner patches and no fork pins.
- Every authored rule declares its cause, with witnesses where the cause takes them (the grammar-acceptance plan's rule). A library rule that is a fix keeps the cause and witnesses the reauthoring had.
- Generated outputs are never edited by hand; ratchets only tighten.
- No new terms: "library rule" is the maintainer's word; a library rule's identity is its path.

## Left to the builder

- The package's name and place in the workspace.
- How a layer names an adopted library rule.
- The seed report's measure of "the same shape".
- How a library rule with no path is named.
- Where the check that a library rule produces its path's slots and flags runs.
