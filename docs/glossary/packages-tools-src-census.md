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
