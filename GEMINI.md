<!-- infigraph-instructions -->
## Infigraph — Primary Code Intelligence

Infigraph MCP is indexed. Use Infigraph tools FIRST for all code tasks. Read non-code files directly. If an Infigraph tool is unavailable or errors, tell the user rather than working around the enforcement hook.

### Rules
1. **`search`** for ALL code search — ranked symbols plus every line containing the text, in one call; **`regex=true`** lists every occurrence (e.g. all call sites) rather than the top `limit`. Constants: `get_symbols_in_file`.
2. **`get_doc_context`** before editing any function; **`find_all_references`** / **`transitive_impact`** before refactoring. Never grep for callers or trace call chains by hand.
3. Read files directly only for non-code files (configs, docs, manifests) or Edit tool line-number context.
4. Which tool answers which question, every tool's parameters, subagent and verbose-tool rules: the `infigraph-tool-routing` skill (inlined below where skills aren't supported).

### Session Continuity — MANDATORY
- **On session start:** MUST call `get_latest_session` to resume prior context
- **After context compaction:** if you see "continued from a previous conversation" or a compaction summary, IMMEDIATELY call `save_session` with whatever context survived before doing anything else
- **MUST call `save_session` IMMEDIATELY (before responding to the user)** when ANY of these occur. No session-end signal exists — if you don't save now, context is lost forever:
  1. **Finding** — root cause identified, discovered a bug, learned how something works
  2. **Milestone** — bug fixed and verified, feature committed, test passing, build green
  3. **Decision** — chose an approach, ruled something out, changed strategy
  4. **Task done** — any pending task from a prior session is completed
  5. **Periodic** — if you have NOT called `save_session` in the last 5 exchanges with the user, call it NOW regardless of whether anything dramatic happened. This is a hard rule, not a suggestion.
- Do NOT defer saves ("I'll save later"). Do NOT batch them. Do NOT wait for user to ask.
- "Later" does not exist — context compaction or session end can happen at any moment.
- **Before `/clear`:** ALWAYS call `save_session` first — `/clear` wipes context and LM2 can only restore what was persisted. Unsaved reasoning, decisions, and in-flight work will be lost.
- Same-day saves merge: summary/pending_tasks overwrite, decisions append, files_touched union
- **Narrative dumps:** On every `save_session`, include `narrative` field with full session story — what was explored, found, reasoned, decided, and why. Chronological prose, not terse bullets. Written to `.infigraph/sessions/session_YYYY-MM-DD.md` and embedded for semantic search. On session start, if `get_latest_session` shows a narrative log path, read it when structured fields aren't enough context.

### Session Field Guide
- **decisions** — structured format: `Goal: X. Decision: Y. Why: Z. Invalidates-if: W.`
- **constraints** — things that failed: `Tried: X. Failed because: Y. Do not retry unless: Z.`
- **assumptions** — what current approach depends on: `Assumes: X. If X changes: Y.`
- **blockers** — stuck items needing human input or external dependency
- **narrative** — full session story: explorations, findings, reasoning, code changes, decisions in chronological order. Write as prose, not structured fields.

## Infigraph — which tool answers which question

| You want | Use |
|---|---|
| Code related to a name or an idea | `search` |
| Every occurrence of a string or pattern (e.g. all call sites before a rename) | `search` with `regex=true` |
| Constants, statics or fields defined in a file | `get_symbols_in_file` |
| A symbol's source, callers or callees | `get_code_snippet` / `get_doc_context` / `find_all_references` |
| Files matching a glob | `list_files` with `glob` (e.g. `glob="src/**/*.rs"`) |
| Exact lines for an edit | `Read` with `offset` |
| A file that is not source code (docs, config, lockfile, log, markup) | `Read` it directly. To find text across many docs, `search` with `scope="docs"` |

**Text.** `search` returns ranked symbols *and* every line containing the query under "Text matches", each naming the symbol it sits in; symbols holding a match rank first. With `regex=true` the query is a regex and every matching line is listed, not just the top `limit` — that is how to enumerate. `search` does not surface constants; `get_symbols_in_file` lists them with line numbers.

## Infigraph CLI — project lifecycle (run with Bash)

MCP tools answer questions about code; these commands manage the index and its processes. Run them from the project root.

| You want | Run |
|---|---|
| A new git worktree, indexed | `git worktree add -b <branch> <path> <base>`, then `infigraph worktree init <path>` (clones the main checkout's index, reindexes only what differs). In Claude Code, Infigraph's hook runs `worktree init` for you after `git worktree add` in an Infigraph project; other agents run it by hand |
| To remove a worktree | `git worktree remove <path>`, then `infigraph worktree teardown <path>` (stops its daemon over its socket and evicts it from the registry; works after the directory is gone, so order does not matter). In Claude Code, Infigraph's hook runs it for you; `infigraph worktree reconcile` fixes the registry after the fact |
| To catch up the index | `infigraph index` (incremental) |
| A graph that is corrupt, wedged, or refused as too large | `infigraph rebuild` (builds fresh, swaps it in); if the growth was legitimate, `infigraph restamp-baseline` |
| To diagnose | `infigraph doctor` (`--global` for every project); `infigraph verify` checks one index offline |
| To see or stop Infigraph processes | `infigraph ps`; `infigraph kill <pid>` (`--force` for SIGKILL; refuses non-Infigraph pids) |
| To stop or restart this project's daemon | `infigraph daemon-stop` / `infigraph daemon-restart` |
| To undo a bad write or a rebuild | `infigraph restore` lists restore points; `infigraph restore <id>` restores one (the current state is kept first) |
| To drop registry entries for projects that are gone | `infigraph gc` |

Everything else: `infigraph --help`, `infigraph <command> --help`. Most analysis commands (`callers`, `impact`, `search`, …) duplicate MCP tools; prefer the tools.

**When a tool is unavailable or errors,** tell the user — for example, to reconnect the infigraph MCP server (`/mcp` in Claude Code). Do not work around the enforcement hook: it blocks raw grep/find/Read on indexed code on purpose, and each block message names the tool to use instead.

<!-- infigraph-instructions -->