# Derive-shape Grammar Diagnostics Design

**Date:** 2026-05-28  
**Status:** Proposed  
**Branch:** `pr-c-eliminate-origin-aliassources`  
**Related specs:** [`2026-05-28-grammar-diagnostics-preflight-design.md`](./2026-05-28-grammar-diagnostics-preflight-design.md), [`2026-05-22-compiler-simplification-design.md`](./2026-05-22-compiler-simplification-design.md)

## Problem

The new grammar-diagnostics preflight can already surface structured findings before codegen, but the current compiler still has a second family of shape failures that appears later in the pipeline as derive-time audit output plus a hard stop, for example:

- `seq-with-nested-seq`
- heterogeneous choice shapes that still need `variant()` or merge work
- unexpected rule-shape wrappers reaching derive

In practice this means the tool is already useful, but all-language runs still terminate on a later derive error after printing partial diagnostics. That truncates the report surface and keeps one important class of grammar issues outside the unified preflight model.

## Decision

Promote the full derive-audit family into the existing grammar-diagnostics engine as a second first-class diagnostic source.

For this design:

1. derive-time noncanonical shapes become structured grammar diagnostics
2. those diagnostics use stable public codes based on the tree shape / grammar construct
3. the standalone tool and codegen CLI consume them through the same preflight engine
4. proceed-vs-stop stays an invocation-level decision, using the same allowlist / interactive confirmation policy as the existing preflight

## Scope

This design extends the existing grammar-diagnostics framework to cover derive-shape findings in addition to alias collisions and simplify-time grouping findings.

It covers:

1. mapping derive-audit failures into structured diagnostic records
2. defining the public code set for those records
3. attaching exact raw classifier/context metadata for debugging
4. routing those records through the existing standalone tool and codegen CLI gate

It does not:

- redesign the derive walker itself
- remove existing low-level classification helpers
- solve every flagged grammar shape in this pass
- change the already-approved allowlist / interactive policy model

## Design

### 1. One diagnostics engine, multiple sources

`grammar-diagnostics.ts` should remain the single aggregation layer, but it should collect from multiple compiler phases rather than only from parsekind collision analysis.

The unified diagnostic batch should include:

- alias collision findings
- simplify/optimize structural findings such as slot-grouping
- derive-shape findings from the later node-map / derivation path

The compiler phases remain responsible only for analysis and emission of records. The standalone tool and the codegen CLI remain responsible for formatting, allowlists, and interactive confirmation.

The intended compile flow becomes:

`evaluate -> link -> optimize/simplify diagnostics -> assemble/node-map diagnostics -> unified GrammarDiagnostic[] -> tool/CLI policy`

This keeps the detection logic at the source while ensuring all surfaced issues participate in the same preflight and saved-report flow.

### 2. Public codes name the tree-shape problem

The public allowlist surface should use stable, shape-descriptive codes rather than compiler-internal classifier strings.

Approved public code set:

- `alias-collision`
- `seq-with-nested-seq`
- `seq-member-collision`
- `choice-with-multiple-arm-shapes`
- `rule-unexpected`
- `polymorph-classification-gap`

The public code names the tree-shape or grammar-structure problem. The exact internal classifier string remains available as metadata rather than becoming the public contract.

For example, a diagnostic might expose:

- `code: 'choice-with-multiple-arm-shapes'`
- `details.rawShape: 'seq-member-choice-needs-variant-or-merge'`
- `details.ruleType: 'choice'`

This keeps allowlists readable and stable while preserving enough detail for debugging and saved reports.

### 3. `rule-unexpected` is a context-specific residual bucket

`rule-unexpected` is reserved for cases where the derive walk encounters a rule type in a containment position where that rule type should not appear.

The message for this code should be explicit:

> we did not expect rule type X inside Y / Z

That means the record should carry:

- the encountered `rule.type`
- the containment path or traversal context
- the expected shape family for that position

This keeps `rule-unexpected` honest: it is not a vague “something was noncanonical” bucket, but specifically “this rule type appeared inside a context where it should have been normalized away, grouped, merged, or classified earlier.”

### 4. Raw derive classifier output stays in metadata

The existing derive classifier and audit logic should remain the source of truth for low-level shape detection.

The important change is the output boundary:

- instead of only formatting console text and throwing
- the derive path records a structured diagnostic
- the record stores exact internal context in metadata

Suggested metadata fields:

- `details.rawShape`
- `details.ruleType`
- `details.context`
- `details.ownerKind`
- `details.expected`

This avoids string scraping and keeps the preflight engine lossless enough for saved artifacts and future tooling.

### 5. Gating policy stays consistent with the existing preflight

These derive-shape findings should use the same invocation-level policy as the current grammar-diagnostics system:

- the standalone tool prints them and returns nonzero when present
- the codegen CLI runs them before generation
- in interactive mode, the CLI may proceed only on explicit confirmation
- in non-interactive mode, the CLI fails unless the encountered codes were explicitly allowed

This is intentionally the same policy already approved for the preflight framework. The design goal is one uniform gate, not a special-case derive exception path.

## Likely implementation boundaries

- keep low-level derive shape classification in `packages/codegen/src/compiler/node-map.ts`
- add a structured derive-diagnostic emission surface near that logic, or extract it into a dedicated helper module if the file boundary becomes cleaner
- extend `packages/codegen/src/compiler/grammar-diagnostics.ts` to collect and format these additional records
- preserve the existing standalone tool and codegen CLI as consumers of the same shared batch

## Error handling

The system should still distinguish between:

1. **known grammar-shape diagnostics**
   - emitted as structured records with stable codes
   - gated by allowlist / interactive confirmation

2. **true compiler defects / unexpected exceptions**
   - still fail immediately as exceptions

So the boundary becomes:

- known noncanonical grammar shapes -> diagnostics
- genuine implementation bugs -> throws

## Testing

1. **derive-shape mapping tests**
   - raw derive classifier shapes map to the approved public codes
   - metadata preserves the exact raw shape/context

2. **compiler integration tests**
   - known derive-time shape failures appear in `GrammarDiagnostic[]`
   - the compile path no longer truncates the standalone report by throwing first for those known shapes

3. **tool / CLI preflight tests**
   - standalone tool output includes derive-shape diagnostics
   - codegen CLI treats them the same as other preflight codes
   - allowlist / interactive confirmation behavior is unchanged

## Risks

1. **diagnostic drift**
   - if derive-shape detection is duplicated outside the real audit logic, the two views will disagree

2. **code explosion**
   - exposing every raw classifier string as a public code would make allowlists unstable and noisy

3. **over-broad catch-all**
   - `rule-unexpected` must stay specific to containment-context surprises, not become a vague fallback for everything

4. **blurring compiler defects with grammar diagnostics**
   - only known shape families should downgrade into diagnostics; genuine implementation bugs must still throw

## Success criteria

This design is successful when:

1. all-language standalone diagnostic runs can surface derive-shape findings as structured records
2. the saved outputs contain both the stable public code and the exact raw shape/context
3. known derive-shape findings participate in the same allowlist / interactive gate as the rest of grammar diagnostics
4. the tool no longer stops early on a known derive-audit shape before producing the full report batch
