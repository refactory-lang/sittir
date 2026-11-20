# A shared grammar rule library

**Status:** in design, from the maintainer's direction of 2026-11-20. Not yet approved for a plan.

## Why

Each sittir grammar fixes its upstream grammar in its own layer (`grammar.sittir.ts`): rules it reauthors with a cause and witnesses, and edits at positions in upstream rules. Typescript, rust and python hold about 30 reauthored rules and many edits today, and nothing is shared between them except the DSL's primitives. C, C#, Go and Java are bootstrapped on a branch, and every C-like grammar added will need the same fixes again: the `for` header's own declaration kinds, a statement's terminator, a numeric literal's sign and radix forms.

The maintainer's direction: "maybe we should implement a shared rule library, (somewhat modeled off the vocabulary/bindings and perhaps initially autoseeded) sittir grammars can just incrementally replace the upstream rules from the library... ultimately the rules library could be published independently of sittir".

## Decided by the maintainer (2026-11-20)

- **Organized by concept** ("By concept"): a library rule is a construct (a counted `for` loop, a statement terminator, a numeric literal), not a language family's fixes, so it is shared across families.
- **Library rules are rules** ("Rule shapes are rules"): a library rule is a tree-sitter rule written in the names the bindings converge on, not a function a grammar calls with its symbols.
- **Seeded from the grammars already mined** ("We already mined the other upstream grammars"): typescript, rust and python on master, and C, C#, Go and Java on `author/csharp-fields`.
- **The first version is a seed report and our own rules moved in** ("Seed report and migrate ours"). The branch's grammars adopt later.
- **The four grammars land on a new branch** stacked on the body PR, in the design worktree ("New branch, same worktree"); the body PR stays as reviewed.

Rulings this builds on, from the same day: a portable path is defined by its slots and flags, so kinds whose slots and flags agree read as one path whatever rule produced them (portable spec, "A path is defined by its slots and flags"); a binding's rename reaches the field (portable spec, "A binding's rename reaches the field"); a position that admits fewer forms than its kind gets its own kinds, and the `for` loop owns its header's `;` (preference-address spec, "a position that admits fewer forms has its own kinds").

## Goals

- One rule per construct that two or more of the seven grammars spell alike, written once.
- A library rule carries the portable path it binds, so a grammar that adopts it gets that binding without writing it.
- A language fact (no automatic `;` in an ECMAScript `for` header; no `+` literal type in TypeScript) lives with the rule it changes, with its witnesses and the production it cites, and applies to every grammar of that language.
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
- A library rule that changes what a grammar parses without a witness.

## How it works

**A library rule.** One or more tree-sitter rules for a construct, in the bound names: kind names from vocabulary paths (`boundKindName`: `statement.loop.counted` is `counted_loop_statement`) and field names as the bindings name them. With them:

- the path it binds, or none for a mechanism below a path (a terminator, a separated list, a numeric literal's forms);
- its language facts, each a variant of the rule with its witnesses and the production that excludes the forms it drops;
- any conflict or precedence the rule needs, declared with it.

The counted `for` loop, as an example: the header's declarations are their own kinds holding the keyword and declarators, the loop writes the header's `;` after any non-empty initializer, and the ECMAScript fact (no automatic `;` in the header) is the variant typescript and javascript take.

**Adopting.** A grammar's layer names the library rule, and the language facts it takes, in place of the rule it replaces. The adopted rule:

- is translated to the grammar's parser names on the way in. Kind renames don't reach the parser (the grammar-bindings wiring ruling: low-level kind names stay upstream's), so each bound kind name the library rule references is mapped back through the grammar's generated `renames`. Field renames do reach the parser, so field names need no mapping.
- brings its binding: the path it carries is the grammar's binding for the adopted kind, and `bindings.scm` doesn't name that kind. So the renames a translation reads never depend on the adoption itself.
- needs a binding for every other kind it references. A referenced kind the grammar's bindings don't name (often a hidden helper such as `_expressions`) is a gap in the bindings, and the adoption is refused naming it. If the seed report shows that most shared shapes reference such kinds, how a library rule names those parts comes back to the maintainer before any rule moves.
- is checked like a reauthoring. Where it replaces the grammar's own rule with the same rule, the generated outputs are byte-identical. Where it changes what parses, its witnesses say so, and the validation history moves only where the change says it does.

**The seed report.** A probe over the seven grammars, reading each where it lives (master, and the merged branch). For each path two or more grammars bind, it sets their rules side by side in bound names and reports:

- the shape they share and where each grammar differs;
- the kinds a shared shape references that some grammar's bindings don't name;
- which of today's reauthorings and edits the path covers.

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
