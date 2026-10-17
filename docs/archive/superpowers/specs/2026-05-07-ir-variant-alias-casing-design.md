# IR Variant Alias Casing — Design

## Problem

The IR emitter currently exposes attached polymorph variant aliases using the raw
`form.name` key. That preserves grammar-facing `snake_case` names on the public
IR surface even though the rest of the IR namespace is intentionally surfaced in
camelCase.

This creates an inconsistency like:

- `ir.binaryExpression`
- `ir.expression.binary`
- but polymorph variant aliases hanging off an IR bundle may still appear as
  `with_semi` instead of `withSemi`

The desired rule is surface-only normalization: internal raw factory names and
form identifiers remain unchanged, but public IR aliases should match the
existing camelCase surface convention.

## Decision

Apply camelCase normalization only when emitting attached polymorph variant
aliases in `packages/codegen/src/emitters/ir.ts`.

The emitted IR surface should:

- keep the base factory binding unchanged
- keep raw factory names / form names unchanged internally
- expose attached variant aliases in camelCase, consistent with the rest of the
  IR namespace

## Recommended approach

Use the existing IR-surface camelCase convention at the emission site in
`bundleExpr(...)`, where polymorph form bundles are attached.

That means:

1. leave `form.rawFactoryName` and `form.fromFunctionName` untouched
2. change only the emitted alias key from raw `form.name` to camelCase
3. add focused emitter coverage proving polymorph variant aliases are camelCase

## Why this approach

This is the smallest correct change:

- it fixes the public inconsistency at the source of emission
- it avoids broad IR refactoring
- it matches the user's rule that camelCase is a surface concern only

Alternative approaches such as introducing a new shared alias helper or sweeping
all IR alias generation paths are unnecessary for this bug and would create more
churn than the issue warrants.

## Scope

In scope:

- `packages/codegen/src/emitters/ir.ts`
- focused test coverage for emitted IR alias keys

Out of scope:

- renaming raw form names
- changing generated factory function names
- broader IR namespace refactors
- runtime/package-boundary work

## Verification

Verification should be focused:

- add or update a codegen/emitter test that inspects emitted IR output for a
  polymorph with variants
- assert the attached alias key is camelCase on the public IR surface
- avoid broad regenerate-all work for this minor surface fix

## Non-goals

- no hand-editing generated output
- no normalization changes outside the IR public alias surface
- no unrelated emitter cleanup bundled into this fix
