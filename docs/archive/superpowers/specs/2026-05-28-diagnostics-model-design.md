# Diagnostics model — `Diagnostic` hierarchy

**Date:** 2026-05-28
**Status:** Agreed; implementing on the unified-cli branch, cherry-pickable to pr-c.

## Problem

The codegen compiler has four ad-hoc diagnostic shapes with no shared base:
`GrammarDiagnostic` (grammar-diagnostics.ts), `ParseKindCollisionDiagnostic`
(diagnose-parsekind-collisions.ts), `SlotGroupingDiagnostic`
(diagnose-slot-grouping.ts), and `DeriveShapeDiagnostic`
(diagnose-derive-shapes.ts). Runtime (render/read) issues aren't typed at all.
There is no common vocabulary (code/severity/message/canProceed) or a single
back-pointer convention to the offending rule/node.

## Model

A single base with three scope-discriminated subtypes. Lives in codegen for now
(`packages/codegen/src/compiler/diagnostics.ts`); `RuntimeDiagnostic` is defined
here and moves to `@sittir/common` if/when the native render/read path starts
producing it.

```ts
type Severity = 'error' | 'warning' | 'info';

/** Common to every diagnostic. */
interface Diagnostic {
  readonly code: string;          // stable public code (e.g. 'seq-with-nested-seq')
  readonly severity: Severity;
  readonly message: string;
  readonly canProceed: boolean;   // false ⇒ blocks the preflight gate unless allowlisted
  readonly proposal?: string;     // author-facing fix suggestion
  readonly details?: Record<string, unknown>;
}

/** Static, author-facing facts about the authored grammar; subject is a Rule. */
interface GrammarDiagnostic<TRule = Rule> extends Diagnostic {
  readonly scope: 'grammar';
  readonly grammar: string;       // rust | typescript | python
  readonly ownerKind?: string;
  readonly slotName?: string;
  readonly ruleId?: RuleId;       // stable back-pointer (preferred over embedding)
  readonly subject?: TRule;       // optional typed rule, for callers that have it
}

/** Emitted during the compile pipeline about a rule OR an assembled node. */
interface CompilerDiagnostic<TSubject = Rule | NodeData> extends Diagnostic {
  readonly scope: 'compiler';
  readonly phase: 'evaluate' | 'link' | 'normalize' | 'simplify' | 'assemble' | 'emit';
  readonly ruleId?: RuleId;
  readonly subject?: TSubject;
}

/** Render / read / parse execution. */
interface RuntimeDiagnostic extends Diagnostic {
  readonly scope: 'runtime';
  readonly stage: 'render' | 'read' | 'parse';
  readonly nodeId?: string;
  readonly span?: { readonly start: number; readonly end: number };
}

type AnyDiagnostic = GrammarDiagnostic | CompilerDiagnostic | RuntimeDiagnostic;
```

- `scope` is the discriminant. `phase` spans the full pipeline
  `evaluate → link → normalize → simplify → assemble → emit`, where `normalize`
  = the phase currently implemented as `optimize` and `simplify` is the
  lossy-by-consumer phase — this names the diagnostic phase only; it does **not**
  rename the `optimize()` function in this work.
- `ruleId` is the stable back-pointer (consumers resolve via
  `nodeMap.slotByRuleId(ruleId)`), matching the codebase's ruleId-backpointer
  convention; `subject` is an optional typed escape hatch.

## Taxonomy (what migrates where, now)

| Existing diagnostic | Becomes | Notes |
|---|---|---|
| `GrammarDiagnostic` (legacy preflight shape) | base of `GrammarDiagnostic<TRule>` | the four below normalize onto it |
| `ParseKindCollisionDiagnostic` | `GrammarDiagnostic<TRule>` | keep `diagnoseParseKindCollisions<T>` generic algorithm; emit the unified shape |
| `DeriveShapeDiagnostic` | `GrammarDiagnostic<TRule>` | author-facing; `code` values retained |
| `SlotGroupingDiagnostic` | `GrammarDiagnostic<TRule>` | propose-promotion proposals |
| unnamed-choice-slot warnings | `GrammarDiagnostic<TRule>` | (if structured; else follow-up) |

`CompilerDiagnostic` and `RuntimeDiagnostic` are **defined but unpopulated** now.
Future migrations (out of scope here): typeName-collision / VAPORIZED →
`CompilerDiagnostic`; unknown-kind-id / render-silent-empty → `RuntimeDiagnostic`.

## Preflight

`collectGrammarDiagnostics` / `collectGrammarDiagnosticsForGrammar` consume the
unified `GrammarDiagnostic` shape. The CLI preflight gate and `--allow-diagnostic`
allowlist work unchanged (they already key off `code` + `canProceed`).

## Out of scope (explicit)

- Renaming the `optimize()` pipeline function to `normalize()`.
- Wiring runtime/compiler diagnostic *producers* (only the types are defined).
- Moving `RuntimeDiagnostic`/base to `@sittir/common` (deferred until a runtime
  producer needs it).
