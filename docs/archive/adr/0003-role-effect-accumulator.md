# ADR 0003 — `role()` records via side-effect, not sentinel return

**Status**: Accepted
**Date**: 2026-04-15
**Related**: specs/006-override-dsl-enrich/, ADR-0001

## Context

Grammar maintainers need to mark symbols with sittir-specific metadata — for example, tagging an external token as a structural-whitespace role (`indent`/`dedent`/`newline`) so Link can render it as a real whitespace directive. The natural place to write this is inline where the symbol is defined (inside `externals` or `rules`), not in a sidecar configuration block.

The first draft had `role('indent')` return a sentinel object that sittir-aware consumers would recognize. That works when only sittir reads the file. But ADR-0001 established that tree-sitter must also read the file, and tree-sitter expects the value in that position to be a valid grammar rule. A sentinel either crashes tree-sitter or produces a malformed rule.

## Forcing Constraint

> "role would push an entry into the sittirRoles array"

## Alternatives Considered

- **Sentinel return value**: clean to read, incompatible with tree-sitter (ADR-0001 blocks this).
- **Sidecar `sittirRoles: { indent: '_indent', ... }` config block**: tree-sitter-compatible, but separates the declaration from the symbol it describes. Maintainers have to keep two places in sync.
- **Wrap role in a transform step after the grammar is built**: adds a second phase, loses the inline authoring benefit.

## Decision

`role(name)` pushes onto a per-grammar `sittirRoles` accumulator as a side-effect, and returns a tree-sitter-valid value appropriate for its calling position (typically `blank()` or a no-op rule reference). The accumulator is scoped to the current `grammar(...)` invocation via a save/restore pattern, so nested calls like `grammar(enrich(base), {...})` do not corrupt each other's role state. Link reads the accumulator after file evaluation completes.

## Principles Applied

- **P-004 (Effects over sentinels)** — when a return-value approach fights the external contract, the call becomes a side-effect with a neutral return.
- **P-005 (Single source of truth)** — the role declaration stays next to the symbol it describes; no sidecar to drift.
- **P-006 (Consumer alignment)** — both tools see a return value they expect; the metadata travels out-of-band.

## Consequences

- **Enables**: Inline `role()` calls inside `externals` and `rules`. The same file is valid for both sittir and tree-sitter.
- **Costs**: Module-level mutable state (the accumulator). Requires save/restore discipline for nested grammar calls. Calling `role()` outside any grammar scope is an error — there's no accumulator to push into.
- **Follow-ups**: Link phase reads `sittirRoles` from the accumulator output instead of any grammar-level field.

## Verification

If nested grammar calls start leaking roles across boundaries, the save/restore pattern is wrong. If maintainers start calling `role()` from helper modules and getting the "outside any grammar scope" error, we may need a scoped context parameter instead of a module-level accumulator.
