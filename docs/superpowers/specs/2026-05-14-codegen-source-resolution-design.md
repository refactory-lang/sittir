# Codegen Source Resolution Design

## Problem

Workspace tooling currently imports `@sittir/codegen` runtime subpaths through package exports that resolve to `dist`. That means validator/debug workflows can run stale built output even after source edits land in `packages/codegen/src`, which hides fixes until `packages/codegen` is rebuilt.

The goal is to make workspace/dev execution resolve `@sittir/codegen` runtime exports from source while preserving publish-safe package behavior for external/package-manager consumers.

## Scope

In scope:

- workspace/dev-time runtime resolution for `@sittir/codegen` exports
- validator/debug/probe flows that currently depend on `@sittir/codegen` runtime subpaths
- preserving package-style imports instead of replacing them with repo-relative source imports

Out of scope:

- changing validator semantics
- changing published package behavior to execute `.ts` source directly
- widening this to unrelated workspace packages unless they need the same source-resolution mode

## Chosen approach

Use a workspace-only source-resolution mode for `@sittir/codegen` exports.

- Default/package behavior remains `dist`-backed.
- Workspace/dev commands opt into a source-targeted export condition.
- Internal callers keep importing `@sittir/codegen/...` subpaths instead of hard-coding `packages/codegen/src/...` paths.

This keeps the public package contract stable while making local debugging and validation reflect source edits immediately.

## Alternatives considered

### 1. Direct source imports in workspace packages

Rejected as the default approach.

This is simple, but it spreads repo-relative knowledge into callers like `@sittir/validator` and does not actually make `@sittir/codegen` resolve to source. It also creates a second import style to maintain.

### 2. TypeScript path aliases only

Rejected.

Path aliases help editor/type-check tooling, but they do not solve runtime Node/tsx resolution by themselves.

### 3. Unconditional source exports

Rejected.

This would make published/package-manager consumers depend on source execution details, which conflicts with the requirement to keep package behavior publish-safe and `dist`-backed outside the workspace/dev flow.

## Design details

### Export model

`packages/codegen/package.json` will expose a workspace/dev-only source path for runtime exports, while keeping the default import target on `dist`.

The intended resolution order is:

1. workspace/dev mode enabled → resolve runtime subpaths to `src`
2. default/package mode → resolve runtime subpaths to `dist`

### Caller model

Workspace commands that execute validator/debug logic directly must enable the workspace/dev resolution condition consistently.

That applies to commands such as:

- validator CLI entrypoints
- codegen debugging/probe utilities
- any other workspace runtime path that expects live source edits in `packages/codegen/src` to take effect immediately

### Non-goals

This design does not try to make every workspace package source-resolved. It only establishes the pattern for `@sittir/codegen` runtime exports because that is the current stale-resolution pain point.

## Validation

Success criteria:

1. Editing a file under `packages/codegen/src/validate/*` changes validator behavior immediately in workspace/dev runs without rebuilding `packages/codegen`.
2. Default package resolution still points to `dist` when the workspace/dev condition is not enabled.
3. Existing package-style imports like `@sittir/codegen/validate/from` remain unchanged at call sites.

## Risks and mitigations

### Risk: inconsistent command behavior

Some scripts may enable the workspace/dev condition while others do not.

Mitigation:

- document the condition clearly
- update the workspace scripts that are meant to run against live source
- keep the default fallback on `dist` so missing the condition does not break execution

### Risk: source-only resolution leaks into publish behavior

Mitigation:

- keep the default export target on `dist`
- use the source path only through the explicit workspace/dev condition

## Implementation outline

1. Add a workspace/dev-only source resolution condition to `@sittir/codegen` runtime exports.
2. Update the relevant workspace commands to enable that condition.
3. Verify validator/debug flows resolve source immediately.
4. Verify default/package behavior still resolves `dist`.
