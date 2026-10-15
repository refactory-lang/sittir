# Infigraph: code intelligence and session continuity

## Routing

Use Infigraph first for code tasks. Read non-code documents and configuration directly when useful.

| Need | Tool |
| --- | --- |
| Code related to a name or concept | `search` |
| Every occurrence of a pattern | `search` with `regex=true` |
| Constants or symbols in a file | `get_symbols_in_file` |
| Symbol source and calling context | `get_doc_context` or `get_code_snippet` |
| References before a rename/refactor | `find_all_references` and, where needed, `transitive_impact` |
| Files matching a glob | `list_files` |
| Text across documents | `search` with `scope='docs'` |

Read a function's context before editing it. Use direct source reads only for exact edit context, not as a substitute for symbol/reference discovery. If a tool is unavailable or fails, report the failure and use supported recovery; do not bypass the routing hook with raw code searches.

## Session continuity

- On session start, call `get_latest_session`. Read a narrative only when the compact fields are insufficient.
- Save meaningful new findings, decisions, completed work, or blockers before responding. One compact save may cover several related changes.
- After compaction or before clearing context, preserve unsaved context. Do not resave history already on disk.
- After ten user exchanges without a save, save a compact checkpoint if anything changed. Avoid no-change saves.
- Keep routine saves around 100–250 tokens. `summary` and `pending_tasks` replace previous values, so retain unresolved work. `decisions` appends; send only new decisions. `files_touched` unions; send only newly touched paths.
- Resend still-active constraints, assumptions, and blockers when replacing a snapshot. A narrative is optional and should add at most 100 words of context absent from the structured fields.
- Save silently unless persistence fails. If the tool is unavailable, use the hook's file fallback and verify that it succeeded.

## Worktrees and index lifecycle

Run lifecycle commands from the owning project. Initialize every new worktree after creating it and installing its dependencies.

```sh
infigraph worktree init <path>
infigraph index
infigraph doctor
```

Use `infigraph rebuild` for a corrupt, wedged, or oversized index; use `infigraph restore` to inspect restore points. `infigraph verify` checks an index offline, and `infigraph doctor --global` diagnoses registered projects. Do not repeatedly restart or rebuild an unhealthy graph without inspecting the failure.

After removing a worktree, run `infigraph worktree teardown <path>`; it works even after the directory is gone. `infigraph worktree reconcile` repairs the registry after missed teardown, and `infigraph gc` removes entries for missing projects.

For process management use `infigraph ps`, `infigraph kill <pid>`, and the project's `daemon-stop` / `daemon-restart`. Analysis questions still belong to the MCP tools rather than their CLI duplicates.
