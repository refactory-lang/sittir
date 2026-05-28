# Grammar Diagnostics Preflight Design

**Date:** 2026-05-28  
**Status:** Proposed  
**Branch:** `pr-c-eliminate-origin-aliassources`  
**Related specs:** [`2026-05-22-compiler-simplification-design.md`](./2026-05-22-compiler-simplification-design.md)

## Problem

PR-C currently surfaces non-mergeable `parseKind` collisions as unconditional codegen-time failures. That behavior is correct for proving the collision pass works, but it is too rigid for the expected inventory of genuine collisions such as:

- python `_suite.block`
- rust `scoped_type_identifier.path`

The current behavior blocks codegen in the middle of assembly, ties policy to compiler internals, and gives no reusable inspection surface for future grammar diagnostics.

## Decision

Introduce a **grammar-diagnostics preflight** that runs before codegen and is also available as a standalone developer tool.

For PR-C:

- identical `parseKind` collisions still **MERGE** automatically
- structurally distinct collisions become **diagnostic records**
- whether the current invocation may proceed becomes a **CLI policy decision**, not an assembly-time hardcoded throw

The default workflow is:

1. run grammar diagnostics before codegen
2. print findings with stable diagnostic codes
3. continue only if:
   - the invocation explicitly allows the reported codes, or
   - the user confirms interactively
4. in non-interactive mode, fail unless the reported codes were explicitly allowed

## Scope

This design adds one reusable preflight surface for grammar/codegen diagnostics and applies it first to non-injective `parseKind` collisions from PR-C §4d.1.

It covers:

1. **Shared diagnostic model**
   - stable codes
   - structured records
   - code-based allow/proceed policy

2. **Standalone diagnostics tool**
   - exposed through `packages/tools`
   - intended for inspection and triage before generation

3. **Automatic codegen preflight**
   - runs at the beginning of the codegen CLI
   - prompts interactively when diagnostics are present
   - uses explicit allow flags in non-interactive mode

4. **PR-C collision policy change**
   - convert unconditional fail-on-diagnostic into diagnostic emission plus invocation-level gate

## Scope boundary

This design does **not**:

- remove the low-level collision analysis
- change the auto-merge rule for structurally identical collisions
- require runtime structural recovery or resolution tables
- attempt to solve every future grammar diagnostic in this PR

The first shipped diagnostic family is `parseKind` non-injectivity. The framework is intentionally extensible to future checks.

## Design

### 1. Grammar diagnostics become a first-class preflight

Add a small grammar-diagnostics framework that can be called from both the codegen CLI and the developer tools CLI.

Each finding should use a stable structured shape, for example:

```ts
interface GrammarDiagnostic {
	readonly code: string;
	readonly severity: 'warning' | 'error';
	readonly grammar: string;
	readonly ownerKind: string;
	readonly slotName?: string;
	readonly message: string;
	readonly proposal?: string;
	readonly canProceed: boolean;
	readonly details?: Record<string, unknown>;
}
```

The important contract is the **diagnostic code**. Invocation policy must be driven by explicit codes, not message parsing.

### 2. `parseKind` collisions become diagnostics, not unconditional throws

Keep the current low-level merge-or-diagnose logic from `diagnose-parsekind-collisions.ts`.

The behavior changes only at the policy boundary:

- if colliding storage kinds are structurally identical, collapse them to one representative value
- if they are structurally distinct, emit a diagnostic record with a stable code such as `parsekind-noninjective`

Assembly and node-map code should no longer own the final fail-vs-proceed decision. They should surface diagnostics upward.

This preserves PR-C’s dealiasing objective — the compiler still detects the loss of injectivity — while making the gate explicit and reusable.

### 3. Code-based gating policy

When grammar diagnostics are present, the current invocation proceeds only if the reported diagnostic codes are explicitly accepted.

The codegen CLI should support a repeatable allow flag:

```text
--allow-diagnostic <code>
```

Policy:

- **interactive TTY**
  - print grouped diagnostic summary
  - if unallowed codes remain, prompt `Proceed? [y/N]`
  - continue only on explicit yes

- **non-interactive**
  - print grouped diagnostic summary
  - fail unless every reported code was allowed on invocation

This gives the requested “diagnostic by default, strict by invocation” behavior.

### 4. Standalone tool in `packages/tools`

Add a concrete `grammar-diagnostics` command under the tools package in the existing **Inspection** area.

The standalone tool and the auto-run codegen preflight must call the same underlying diagnostics engine so there is only one source of truth.

The standalone tool should:

- run the same checks without generating output
- print grouped diagnostics with codes
- make it easy to inspect cases like python `_suite.block` and rust `scoped_type_identifier.path`

This keeps the concern discoverable and avoids burying grammar triage inside `assemble()`.

### 5. Compiler/CLI boundary

The compiler should stay focused on analysis and projection. CLI policy should handle prompting and invocation allowances.

Concretely:

- low-level compiler code emits diagnostics
- the top-level CLI boundary decides whether those diagnostics are tolerated for this run
- if compilation or preflight needs to stop, it should do so with a typed error that carries the encountered diagnostic codes
- the top-level handler should check those codes against the invocation’s allowlist

This keeps prompting, TTY behavior, and command policy out of compiler internals.

## Likely file boundaries

- keep collision analysis in `packages/codegen/src/compiler/diagnose-parsekind-collisions.ts`
- add shared grammar-diagnostics orchestration in codegen source
- refactor `packages/codegen/src/compiler/node-map.ts`
- refactor `packages/codegen/src/compiler/assemble.ts`
- extend `packages/codegen/src/cli.ts` with:
  - auto-run preflight
  - `--allow-diagnostic`
  - interactive proceed prompt
- add a standalone tool module under `packages/tools/src/**`
- register the new command in `packages/tools/src/cli.ts`

## Error handling

The system should distinguish between:

1. **compiler defects / unexpected exceptions**
   - still fail immediately

2. **known grammar diagnostics**
   - represented by stable diagnostic codes
   - may stop the current invocation if not explicitly allowed

This means the user-facing failure path is no longer “mid-assembly string throw only.” It becomes “diagnostic-coded gate failure unless allowed.”

## Testing

1. **Low-level collision tests**
   - preserve merge-vs-diagnose coverage
   - assert stable diagnostic codes for non-mergeable cases

2. **Compiler integration tests**
   - verify diagnostics are surfaced without unconditional assembly-owned fail behavior

3. **Codegen CLI tests**
   - auto-run preflight before generation
   - interactive prompt path
   - non-interactive failure without `--allow-diagnostic`
   - success when encountered codes are allowed

4. **Tools CLI tests**
   - standalone grammar-diagnostics command
   - expected output for known collisions

## Non-goals

- solving every inventory case in this design pass
- inventing runtime disambiguation for non-injective parse kinds
- replacing override-based fixes with resolution tables
- broadening PR-C into a general grammar-health initiative beyond this new preflight surface

## Risks

1. **Policy drift**
   - if the standalone tool and codegen preflight do not share one engine, they will disagree

2. **Compiler/CLI boundary leakage**
   - prompting or allowlist policy could creep back into compiler internals

3. **Silent normalization**
   - turning failures into diagnostics must not hide the distinction between merged identical collisions and genuinely distinct structures

4. **Spec drift**
   - PR-C currently describes these cases as `fail`; the governing spec/plan must be updated to reflect the new diagnostic-and-gate behavior

## Success criteria

This design is successful if:

- `parseKind` collisions like python `_suite.block` and rust `scoped_type_identifier.path` are surfaced with stable diagnostic codes
- codegen runs the check before generation starts
- the same check is available through `packages/tools`
- interactive users can explicitly proceed
- non-interactive invocations fail unless they explicitly allow the encountered codes
- compiler internals no longer hardcode unconditional throw behavior for this class of diagnostic
