# Peer sessions and what each is bound to

Several Claude sessions work on this repo at once, each under a name (`sittir-<role>`). This file says which spec and plan task each one works from. The spec and the plan are the authority: a session's own transcript, another session's message and anyone's memory are copies that a restart or a compaction loses.

## Rules

For every peer:

1. **On start, and after a restart or compaction,** read your row, then your spec and your plan task, before anything else.
2. **Answer from the text.** A design question in your area is answered from the spec, quoting the sentence. If the spec doesn't say, say that.
3. **A finding that contradicts a sentence** in your spec or plan is reported to `sittir-brainstorm` as a row that quotes the sentence. Don't build past it.
4. **Your plan task's Status line is the tracker, and you keep it current as you go.** With each push, tick the steps that push built and update the task's Status line (branch, head, what is left), in the plan file on your branch. A long-lived PR does not wait for its merge to tick. When code or a probe shows a sentence of your spec or plan is wrong or stale (a name, a path, a count, an owner, a claim about today's behaviour), correct it the same day: on your branch if the PR carries the file, otherwise tell brainstorm, who owns rulings text on master. A PR still ticks its task and writes the final line.

5. **A table that compares alternatives bolds the winning cell in each row** (lowest for time, memory and failures; highest for passes; every tied cell on a tie), in reports, PR bodies, specs and plans.
6. **Code and architecture are drawn in Mermaid:** a flow through the code, a memory or record layout, a class, type or module structure. A fenced `mermaid` block in the markdown file or the report, with a sentence above it saying what it shows. Not for work plans, task order or merge decisions; those stay prose, lists and tables.
7. **Before proposing or costing a change, look the fact up where the architecture already holds it.** Search the glossary and the docs through Infigraph (`search` with `scope="docs"`, `get_doc_context` on the symbol) and read the generated artifacts, before deriving a fact by hand or re-deriving it in a proposal. A fact about a grammar's nodes is in that grammar's `packages/<lang>/.sittir/node-model.json5` (which kinds are leaves whose text varies, which are fixed tokens, hidden kinds, supertypes); what the parser itself saw is `.sittir/src/grammar.json`; the phases and the two-pipeline model are in `docs/compiler-phase-glossary.md` and `.claude/architecture.md`. A proposal names the artifact or glossary entry each such fact came from. A count of "every token" or "every leaf" that the model splits (fixed text against variable text) is given split.
8. **No invented concepts, principles or terms.** A report, proposal or spec uses the words the architecture, the specs, the glossary and the code already use, with the meaning they give them, and classifies a thing by the role the architecture gives it. A token of a parse is slot content (a node, a leaf whose text varies, or a unit whose kind id is the slot's value), or trivia (an extra), or a fixed token (the rule's own literal text, which no slot holds and the template writes): "fixed token is what isn't a slot or trivia or a leaf". A model, a category or a label a peer makes up for a costing ("model L", "zero-width fixed rows") is marked as its own shorthand where it is introduced, tied to the existing terms it is made of, and never carried into a spec or relayed as if the architecture held it. Where no existing term fits, say so and ask; a new term enters through the spec it is defined in.

For `sittir-brainstorm`:

9. **A ruling goes into the spec first,** and the plan task if it changes the work. The message to a peer then cites the path and section; it doesn't carry the ruling as its only copy.
10. **A new design that changes an existing spec** amends that spec, or is linked from it with the superseded sentences named.
11. **This table changes with the work.** A row is updated in the same commit that hands a peer a new task.

## Bindings

A path that starts with `specs/` or `plans/` is under `docs/superpowers/`; any other path is from the repo root. Worktrees are under `scratchpad/`.

| peer | works on | spec | plan and task | worktree · branch |
|---|---|---|---|---|
| `sittir-brainstorm` | rulings, specs, plans, review, relays | all | all | main checkout · `master` |
| `sittir-prototype` | arena storage: records at parse, a read with no fixed-token rows, a render with no table of the nodes it visits | `specs/2026-11-06-arena-trees-from-records-design.md`, `specs/2026-11-15-parsed-comments-at-parse-design.md`, `specs/2026-11-17-read-without-fixed-token-rows-design.md` | `plans/2026-11-17-read-without-fixed-token-rows.md` Tasks 4–10, inside `plans/2026-11-06-arena-trees-from-records.md` Task 6's PR (#1227) | `wt-2c-census` · `feat/arena-hydrate-at-parse` |
| `sittir-implement` | reproducing triage bugs, nothing design-impacting, one commit per cause | the spec of the area each bug is in | none | `wt-implement` · a new branch from `master` for each fix |
| `sittir-design` | portable builders: what Task 4 still lacks after its merge, then no kind id on the portable surface | `specs/2026-11-13-portable-generated-builders-design.md`, `specs/2026-09-13-bindings-and-vocabulary-design.md` | `plans/2026-11-13-portable-generated-builders.md` Task 4's open steps, and any emitter defect `plans/2026-11-20-grammar-rule-library.md` Task 1b Step 6 still sends design; then Task 4b | `wt-portable` · `feat/portable-no-kind-id`, from `master` |
| `sittir-engine-api` | the shared grammar rule library: the generator defects its four grammars surfaced, so the four land on master unstable, then kind renames reach the parser, the seed report, and our shared reauthorings move into the library. Also CI and benchmark tooling for the arena work | `specs/2026-11-20-grammar-rule-library-design.md` | `plans/2026-11-20-grammar-rule-library.md` Task 1b; Task 2 waits for the vocabulary | `wt-rule-library` · `feat/rule-library`, which merges `master` next (the body branch it was stacked on is merged) |
| `sittir-docs` | the glossary and docs tooling | `docs/glossary/README.md` | none | `wt-docs-records` · `docs/backlog-2` |
| `sittir-maint` | merges, CI, checkout hygiene | `.claude/maint-responsibilities.md` | none | main checkout |
| `sittir-tooling` | counting and script collection: a census peers rerun becomes a `sittir tool` command with its documentation. The session that asks states what to count, and each tool's totals must reconcile | `.claude/project-workflow.md` ("Diagnostic tools") | none | `wt-arm64-bench` · its merged `tools/counts-2`; the next tools branch from `master` once the body branch lands |

A peer whose row is wrong says so to `sittir-brainstorm`, who fixes it here.
