# `$set`: in-place edits that keep the source

**Status:** Proposed. The maintainer set the direction on 2026-11-26. The open questions below come to them before a plan.

## Intent

An edit to a node changes it in place, and only the edit's own text changes in the render. Every other byte of a parsed source comes out as it was written. The maintainer reached it from a comment write ("when a span of text in the source gets derefed, the spot that was changed points to the new node that supplies its text"). They noted that the source then works as the node's template ("almost as if the source functions as a replacement template..... for the node's actual template"), and widened it to every edit ("Let's consider handling all edits this way").

## The surface

- **`node.$set.<slot>(value)`** replaces a slot's value in place. It's named `$set` "so it doesn't conflate the 2": `$with` keeps building a new node, and the edit facet `$edit` of the node API spec (`2026-10-02-node-query-traversal-modification-api-design.md`) keeps its own meaning.
- **A node is a reference.** A `$set` changes the node wherever it's held, not only along the route the caller took (the maintainer: "it's a reference so it changes wherever it was referenced not just that path"). This holds for parsed and built nodes alike, as a `$trivia` write already does for a parsed node's sides.
- **A comment or blank-line write** (`$trivia`) is the same edit, made to a side rather than a slot.

## How it renders

- **A parsed node: the source is its template.** The parse keeps a list of replaced ranges, each naming the node, the slot or side it replaces, and the value or row that now supplies its text. A node with no replaced range inside it renders as its source bytes, as today. A node with one renders as a template: its source byte runs between its children are its fixed parts, its children are rendered by the same rule, and each replaced range is filled by its value through the writer. The seams at a replaced range are the writer's seams for that slot or side. The order of replaced ranges at one offset is the template's part order: an outer node's leading side before an inner node's, and an inner node's trailing side before an outer node's. The offsets are the original source's, so they never shift, as with tree-sitter's incremental parse run in reverse (the maintainer: "It's almost like tree-sitter's own incremental parse in reverse"). The source isn't copied or shifted, and the new text is held elsewhere ("we don't have to shift the source - it's effectively stored in another place").
- **A built node has no source.** The engine keeps a list of the built nodes a `$set` changed, each naming what now stands in its place. A render that meets one takes its replacement.

Arena storage holds both lists in its chunks: the parse's list on the read's side record (one word per read), and the built list on the engine (not designed). The first part built is the comment-write case, the arena plan's Task 6f: its list holds a written side's row against the node and side, and its entries are keyed so a slot can be named too.

## Not changed

- `$with` builds a new node, and a rebuilt parent's gaps come from options, as ruled on 2026-11-15.
- The edit facet `$edit`, with its transform verbs over list slots, stays as the node API spec has it.

## Open, for the maintainer before a plan

1. **`$set`'s return value:** the receiver, so calls chain, or nothing.
2. **What a `$set` admits:** the same value its slot's `$with` admits, through the same builder checks.
3. **A `$set` on a slot holding a list:** whether it replaces the whole list, as `$with` does.
4. **Object storage:** both storages must render the same tree the same way. For comment writes this is settled: object storage's parsed trees gain the same list and template render in the same PR as arena storage's (the maintainer, 2026-11-26). Still open for `$set` on slots: its built nodes are already JS references, and whether a JS reference set in place needs anything further.
5. **Counts:** a `$set` drops the old value's count and holds the new one. The arena's lists hold counts of what they name.
6. **The built list's home and lookup cost.** A render checks it at each built record it meets, one check while it's empty.
7. **Drafts and commit:** the node API spec's drafts and tree-sitter commit assume a tree, which an arena parse no longer keeps. What a later reparse of a source with replaced ranges does is left for that spec.
