# `packages/tools/src/census` — Function Glossary

Grammar-wide censuses run as `sittir tool <name>`.

---

### `packages/tools/src/census/text-kind-overlap.ts::textKindOverlapCensus`

The loose surface builds a bare string as the first text kind, in lexical rank order, that a slot admits and whose check accepts it. This census lists where that order decides between two kinds: for every slot's candidate text kinds (`slotResolverKinds` over `leafTextChecks`, the checks the emitted registry prints), each ranked pair reports the texts of the lower-ranked kind that the higher-ranked kind also accepts — a string the loose surface builds as the winner. A fixed-text loser is tested by its values exactly; a pattern loser is tested by the texts its kind has in the parsed corpus.

Known limit: corpus samples come from the tree-sitter tree, so a loser the tree never names — a sittir mint such as a number variant or `char_literal_empty` — has no samples. Such a pair is listed as `UNSAMPLED` rather than counted clean.

### `packages/tools/src/census/text-kind-overlap.ts::corpusTextsByKind`

Every distinct text per node type across the grammar's corpus entries that parse without errors: named nodes and anonymous tokens alike.

### `packages/tools/src/census/text-kind-overlap.ts::formatTextKindOverlapCensus`

One header line with the shadowing and unsampled pair counts, then a `SHADOWS` row per pair (winner > loser, the shadowed texts, the slots) and an `UNSAMPLED` row per pair with no loser samples.

### `packages/tools/src/census/node-json-census.ts::nodeJsonCensus`

What node JSON and its reviver rest on, measured per grammar over the corpus entries that parse and enumerate without a read error. Four tables:

1. The text-leaf kinds: the pattern nodes (`isPatternLeaf`), so a fixed-text kind (a keyword or punctuation unit) is not one, and neither is a lexed compound or an alias of a pattern leaf, which have wraps. Each row counts its corpus instances, how many already carry `$render`, and how many sit inside the corpus's comments (`triviaKinds`), which the node walk does not visit. A kind with instances but none rendering is one whose parsed node crosses as plain data; a kind with no instance is no such gap, since there is nothing to measure, and is reported apart: as trivia only when the comments hold it, and as having no corpus instance otherwise.
2. The corpus kinds that are neither keys of `_fromMap` nor units (`unitKindIds`): the kinds a reviver could not build. Units are counted separately because they revive to their kind id.
3. The value shape each `querySlots` accessor returns, per kind and accessor, as instance counts: node, list, kind id, boolean, string, undefined, or throws.
4. The comment kinds: `triviaFacts.kinds` that name a kind and are not in `triviaFacts.layout`.

A fifth table lists the corpus entries whose read threw while nodes were enumerated, by message: a tree whose nodes cannot be enumerated cannot be serialized either.

A kind absent from the corpus has no instances, so its slot shapes are absent from table 3.

### `packages/tools/src/census/node-json-census.ts::slotShapeOf`

Classifies what an accessor returned. A number is a kind id (a unit read as its id), an array or an iterable without `$type` is a list, an object with `$type` is a node.

### `packages/tools/src/census/node-json-census.ts::formatNodeJsonCensus`

One header line, then the tables as sections, one tab-separated row per kind or slot. The text-leaf table is two sections: `1.` the kinds the corpus holds that do not all render, and `1b.` the kinds with no corpus node, each labeled `trivia only` (with its count inside comments) or `no corpus instance`.

### `packages/tools/src/census/node-json-census.ts::triviaKinds`

The kind names inside a node's comments: every trivia side's entries, written to JSON and walked for `$type` (`jsonKinds`). A trivia entry is a node without `$query`, so its JSON is the one view that names every kind it holds, its variant leaves included.
