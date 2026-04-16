# Data Model — Override DSL with enrich(base)

**Feature**: 006-override-dsl-enrich
**Phase**: 1

Entities are conceptual — none of them are classes. They describe the shapes flowing through the pipeline. Concrete TypeScript types live in `packages/codegen/src/dsl/` and `packages/codegen/src/compiler/`.

---

## Base Grammar

The untouched tree-sitter grammar object imported from a published grammar package (e.g., `tree-sitter-python/grammar.js`).

**Shape**: `{ name: string, rules: Record<string, Rule>, externals?: Rule[], extras?: Rule[], supertypes?: string[], word?: Rule, ... }` — whatever the tree-sitter CLI accepts.

**Source**: default export from `../../node_modules/.pnpm/tree-sitter-<lang>/grammar.js`.

**Invariants**: sittir treats this as read-only. No pass mutates it.

---

## Enriched Grammar

Output of `enrich(base)`. Same shape as Base Grammar but with mechanical transformations applied to `rules`. `externals`, `extras`, `supertypes`, `word` pass through unchanged (enrich does not touch top-level arrays).

**Invariants**:
- `enrich(base)` is pure: `enrich(g) === enrich(g)` (by structural equality).
- `enrich(enrich(g))` is a fixed point: applying enrich twice produces the same grammar as applying it once.
- Skipped passes are reported to stderr (FR-010a) but do not affect the returned value.

---

## Override File

The hand-authored `packages/<lang>/overrides.ts` module. Its default export is a tree-sitter grammar object produced by `grammar(baseOrEnriched, config)`.

**Fields in `config`**:
- `name: string` — grammar name (must match base's name or tree-sitter errors)
- `rules: Record<string, (... ) => Rule>` — rule overrides (can call `transform()`, `role()`, etc.)
- `supertypes?: Rule[]` — extension entries (merged with base per R-006)
- `externals?: Rule[]` — extension entries (merged with base per R-006)
- `extras?: Rule[]` — extension entries (merged with base per R-006)
- `word?: Rule` — replacement value (scalar, not merged)

**After evaluation**, the exported grammar object carries a sidecar `sittirRoles: string[]` field (from the accumulator) that tree-sitter ignores but sittir's Link phase reads.

---

## Role Registry

Per-grammar collection of role names accumulated during `overrides.ts` evaluation. Scoped via save/restore (R-004). Not a persistent data structure — rebuilt on every codegen run.

**Shape**: `string[]` — ordered by call order (first `role('indent')` at index 0).

**Consumer**: Link phase reads `grammar.sittirRoles` and resolves each name against the `externals` array to find the token being tagged.

**Invariants**:
- Scoped to the enclosing `grammar(...)` call — nested calls do not leak.
- Calling `role()` outside any grammar scope is a hard error.

---

## Transform Patch

A targeted modification applied to a rule's structure by the pre-evaluate phase. Created by calling `transform()`, `insert()`, or `replace()` in the override file.

**Shape** (conceptual):
```
{
  kind: 'transform' | 'insert' | 'replace',
  path: string,              // e.g., '0/1/2' or '0/*/0'
  payload: Rule | Rule[],    // the value to install at the path
}
```

**Application**: pre-evaluate walks the base rule, resolves the path (including wildcards), and returns a new rule with the patch applied. The base rule is not mutated.

**Invariants**:
- Out-of-bounds paths fail at patch-application time with a message naming the path and the actual shape.
- Wildcard patches apply to every matching branch; if zero branches match, it's a hard error (a silent no-op would be a typo magnet).

---

## Post-Transform Grammar

The grammar object after the pre-evaluate phase has applied all `enrich` passes, all transform patches, and captured all role accumulator state. This is the artifact the rest of the sittir pipeline (Evaluate → Link → Optimize → Assemble → Emit) consumes, AND the artifact tree-sitter's parser generator validates in CI.

**Shape**: tree-sitter grammar object + sidecar `sittirRoles` field. Tree-sitter ignores `sittirRoles`; sittir reads it in Link.

**Invariants**:
- Must be a valid tree-sitter grammar (FR-019).
- Must be serializable back to `grammar.js` source for the transpile step.

---

## Skip Report

A per-pass notification emitted to stderr when enrich could not apply a mechanical transformation.

**Shape** (line format):
```
enrich: skipped <pass-name> on <rule-name> (<reason>)
```

**Example**:
```
enrich: skipped keyword-prefix-promotion on function_definition (field 'async' already exists)
enrich: skipped kind-to-name on tuple_expression (multiple expression children present)
```

**Invariants**:
- Non-fatal — enrich continues on the next rule.
- One line per skipped pass per rule.
- Writes to `process.stderr`, not `process.stdout`, so codegen output stays pipeable.

---

## Extension Merge Result

Output of merging an override file's extension fields (`supertypes`, `externals`, `extras`, `word`) with the base grammar's.

**Shape** (conceptual, applied per-field):
```
supertypes:  dedupe([...base.supertypes, ...overrides.supertypes])     // reference-equality dedupe
externals:   dedupe([...base.externals, ...overrides.externals])
extras:      dedupe([...base.extras,    ...overrides.extras])
word:        overrides.word ?? base.word                                // scalar replacement
```

**Invariants**:
- Order: base entries first, override entries appended.
- Dedupe: reference equality (R-006).
- Omitted extension fields leave base unchanged (FR-019c).

---

## Relationships

```
Base Grammar
    │
    ▼ enrich()
Enriched Grammar
    │
    ▼ grammar(enriched, config) in overrides.ts
Override File default export
    │
    │  (during evaluation, role() pushes into Role Registry,
    │   transform() patches produce Transform Patches)
    │
    ▼ pre-evaluate phase applies patches + merges extensions
Post-Transform Grammar ──► CI: tree-sitter generate (validation)
    │
    ▼ Evaluate → Link → Optimize → Assemble → Emit
Generated packages (factories, templates, types, ...)
```

---

## Out-of-scope entities

These are mentioned in the spec but not modeled here because they are either pre-existing or stable:

- **Fidelity Ceiling**: already tracked in `corpus-validation.test.ts`. No shape change.
- **CST Node / Edit / RenderContext**: `@sittir/core` types, unchanged by this feature.
