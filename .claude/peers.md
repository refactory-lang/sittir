# Peer sessions and what each is bound to

Several Claude sessions work on this repo at once, each under a name (`sittir-<role>`). This file says which spec and plan task each one works from. The spec and the plan are the authority: a session's own transcript, another session's message and anyone's memory are copies that a restart or a compaction loses.

## Rules

For every peer:

1. **On start, and after a restart or compaction,** read your row, then your spec and your plan task, before anything else.
2. **Answer from the text.** A design question in your area is answered from the spec, quoting the sentence. If the spec doesn't say, say that.
3. **A finding that contradicts a sentence** in your spec or plan is reported to `sittir-brainstorm` as a row that quotes the sentence. Don't build past it.
4. **Your plan task's Status line is the tracker.** A PR ticks its task and updates that line.

5. **A table that compares alternatives bolds the winning cell in each row** (lowest for time, memory and failures; highest for passes; every tied cell on a tie), in reports, PR bodies, specs and plans.
6. **A logical flow, a memory layout, or a class or architecture structure is drawn in Mermaid,** as a fenced `mermaid` block in the markdown file or the report, with a sentence above it saying what it shows.

For `sittir-brainstorm`:

7. **A ruling goes into the spec first,** and the plan task if it changes the work. The message to a peer then cites the path and section; it doesn't carry the ruling as its only copy.
8. **A new design that changes an existing spec** amends that spec, or is linked from it with the superseded sentences named.
9. **This table changes with the work.** A row is updated in the same commit that hands a peer a new task.

## Bindings

A path that starts with `specs/` or `plans/` is under `docs/superpowers/`; any other path is from the repo root. Worktrees are under `scratchpad/`.

| peer | works on | spec | plan and task | worktree · branch |
|---|---|---|---|---|
| `sittir-brainstorm` | rulings, specs, plans, review, relays | all | all | main checkout · `master` |
| `sittir-prototype` | arena storage: records at parse, comments placed at parse, release | `specs/2026-11-06-arena-trees-from-records-design.md`, `specs/2026-11-15-parsed-comments-at-parse-design.md` | `plans/2026-11-06-arena-trees-from-records.md` Tasks 6, 6c, 6d, 7 | `wt-2c-census` · `feat/comments-at-parse` (on `feat/arena-hydrate-at-parse`) |
| `sittir-implement` | the node-surface hoist | `specs/2026-11-15-node-surface-hoist-design.md` | `plans/2026-11-16-node-surface-hoist.md` (on the hoist branch until its PR merges); Tasks 1–2 done, 3–8 wait for the vocabulary branch | `wt-implement` · `feat/node-surface-hoist` |
| `sittir-design` | portable vocabulary: no `content` member, flattening, renames | `specs/2026-11-13-portable-generated-builders-design.md`, `specs/2026-09-13-bindings-and-vocabulary-design.md` | `plans/2026-11-13-portable-generated-builders.md` Task 3b | `wt-vocab-rulings` · `feat/no-content-member` |
| `sittir-engine-api` | the allocation count by call site, in both storages; then the outline for routing hand cell decoders through the record views. Also CI and benchmark tooling for the arena work | `specs/2026-11-15-call-scratch-allocator-design.md` (the record-encoding direction in it is closed), `specs/2026-11-06-arena-trees-from-records-design.md` | `plans/2026-11-06-arena-trees-from-records.md` Task 6e (outline only until Task 6 merges) | `wt-engine-api` · `ci/alloc-count` |
| `sittir-docs` | the glossary and docs tooling | `docs/glossary/README.md` | none | `wt-docs-records` · `docs/backlog-2` |
| `sittir-maint` | merges, CI, checkout hygiene | `.claude/maint-responsibilities.md` | none | main checkout |

A peer whose row is wrong says so to `sittir-brainstorm`, who fixes it here.
