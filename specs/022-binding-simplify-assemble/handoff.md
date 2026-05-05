# Handoff: Spec 022 Rewrite

**Branch**: `022-binding-simplify-assemble`
**Date**: 2026-05-03
**ADR**: `docs/adr/0018-dehoist-nodedata-surface.md`

## What happened this session

1. **ADR-0017 merged** — `$nodeId` → `$nodeHandle` + `$childIndex`, `$source` numeric, Engine/ParsedTree split, native RT as authoritative validator
2. **RT validator fixed** — uses native parse + native render, deep recursive mode added, structural identity assertion, source-vs-rendered in failure reports
3. **Spec 022 brainstormed** — started from pipeline rewrite, evolved to full runtime surface redesign
4. **ADR-0018 written** — captures all design decisions for the new NodeData surface

## What needs to happen next

### Priority 1: Rewrite spec 022 from scratch

The current `spec.md` is a patchwork of amendments. Rewrite cleanly incorporating:
- ADR-0018 surface design (the target)
- Incremental migration (surface-first, internals-later)
- Native RT as the gate (3 modes: shallow, deep, factory)

### Priority 2: New task order (surface-first)

Old order: Binding → Simplify → Assemble → De-hoist → $with
New order: **Surface first, internals later**

1. `_`-prefix storage + function-call accessors + freeze + `$with` + `$`-prefix methods
2. Terminal value hoisting (leaf values as strings)
3. napi direct (remove serde JSON round-trip)
4. THEN: Binding/Simplify/Assemble (internal pipeline consuming the new surface)

Rationale: the surface is what consumers see. Get it right first. The
internal pipeline refactor is invisible to consumers and can land after.

### Priority 3: Finalize assembled model taxonomy

Draft decisions:
- `AssembledBranch` absorbs Container + Multi
- `AssembledNonterminal` replaces Field + Child
- `AssembledLeaf` base (Pattern/Keyword/Token/Enum)
- Multi removal? Polymorph boundary? — still open

### Open questions for next session

1. Does `AssembledMulti` go away or just get absorbed?
2. Exact Polymorph vs Branch boundary — when does a choice-of-kinds become a polymorph vs an enum?
3. Should `$child`/`$children` be regular `_`-prefixed storage with accessor functions too? (e.g. `_children` + `children()` cursor)
4. How do we handle the `$with` for `$child`/`$children`? (`$with.children([...])` or `$with.child(node)`)

## Key files (current state, needs rewrite)

| File | Status |
|------|--------|
| `specs/022-binding-simplify-assemble/spec.md` | Patchwork — needs clean rewrite |
| `specs/022-binding-simplify-assemble/plan.md` | Stale — references old task order |
| `specs/022-binding-simplify-assemble/tasks.md` | Stale — wrong order, wrong surface |
| `specs/022-binding-simplify-assemble/data-model.md` | Partially valid — taxonomy section is DRAFT |
| `specs/022-binding-simplify-assemble/research.md` | Valid — R1-R5 decisions still hold |
| `docs/adr/0018-dehoist-nodedata-surface.md` | **Authoritative** — the design source of truth |

## Context to preserve

- Native RT numbers: python 114/115, rust 124/136, typescript 108/112 (zero failures)
- Factory RT ceilings: rust 15, typescript 25, python 70 (target: 0)
- ADR-0017 on master (merged PR #21): `$nodeHandle` + `$childIndex`, numeric `$source`, ParsedTree/Engine split
- Three RT modes enforced: shallow, deep (structural identity), factory
- `vitest.setup.ts` rebuilds dists before tests
- `kindIdFromName` resolves symbol values (`"+"` → TSKindId.Plus)
