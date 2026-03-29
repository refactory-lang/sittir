# Coverage & Heuristic Gaps

Audit from 2026-03-29. Items marked [FIXED] were addressed in the same session.

## Rules Emitter (`packages/codegen/src/emitters/rules.ts`)

### [FIXED] Quantifier precedence: optional+multiple emitted `?` instead of `*`
Field quantifier map used `!required ? '?' : multiple ? '*' : ''`, so optional+multiple fields got `?`. Fixed: `multiple ? '*' : !required ? '?' : ''`.

### 1. Shared `seen` set across CHOICE branches corrupts field counting
**Severity: High**

`ruleToSExpr` passes `seen` by reference to all CHOICE branches. Branch 1 adds its fields to `seen`, so branch 2's field count is deflated (fields already in `seen` return `[]`). The "pick branch with most fields" heuristic compares distorted counts.

The final template still works because the field was emitted by branch 1, but the wrong branch's tokens may be selected.

**Fix:** Clone `seen` before evaluating each CHOICE branch for counting, then merge the winning branch's additions back.

### 2. Optional CHOICE drops tokens paired with fields
**Severity: Medium**

`optional(seq("->", field("return_type", ...)))` sets `optional=true` for all members, dropping the `"->"` token. When `return_type` is present, rendered output is `i32` instead of `-> i32`.

**Fix:** Track token-field pairing — tokens immediately preceding/following a field in a SEQ should share the field's quantifier, not the outer optional.

### 3. CHOICE tie-breaking is first-wins
**Severity: Medium**

When two CHOICE branches have equal field counts, the first branch wins. No secondary heuristic (e.g., prefer branch with more tokens).

### 4. SYMBOL always emits `(_)*` regardless of repeat context
**Severity: Low**

Every unnamed SYMBOL becomes `(_)*`. Non-adjacent symbols separated by tokens produce `(_)* "token" (_)*`, potentially duplicating children in render output. The dedup logic only collapses **consecutive** `(_)*` entries.

## Render Engine (`packages/core/src/render.ts`)

### 5. Single separator per node type for all multi-fields
**Severity: Medium**

`joinBy` maps one separator per node kind. If a node has two list fields needing different separators (params: `, ` vs statements: `\n`), both get the same one.

### 6. Empty array for `+` quantifier silently accepted
**Severity: Medium**

One-or-more fields with empty arrays produce empty string (filtered by `parts.filter(p => p !== '')`), instead of throwing an error.

### 7. Parts joined with single space, no way to suppress
**Severity: Low (design trade-off)**

All non-empty parts joined with space. Tokens that should be adjacent (parens, dots) always have space: `name ( params )` instead of `name(params)`. Known trade-off for simplicity.

## S-expression Parser (`packages/core/src/sexpr.ts`)

### 8. Backslash unescape is incomplete
**Severity: Medium**

Only `\"` → `"` is unescaped. `\\` stays doubled. Affects tokens containing literal backslashes (rare but possible in operator tokens).

**Fix:** Add `raw.replace(/\\\\/g, '\\')` after the quote unescape.

### 9. Nested parentheses not handled
**Severity: Low (latent)**

Parser uses `indexOf(')')` to find closing paren — would break on nested S-expressions. Safe currently since templates are flat, but fragile if extended.

## Test Generator (`packages/codegen/src/emitters/test-new.ts`)

### [FIXED] Fallback `{ type, fields: {} }` crashes render for nodes with required fields
Used `ir.kindName(minimalArgs)` factory calls instead of raw objects. Recursion guard prevents infinite loops on recursive types.

### [FIXED] No tests for optional fields
Added "renders with optional fields" test that exercises all optional non-multiple fields populated.

### 10. No multi-element list tests for separator coverage
**Severity: Low**

`wrapMultiple` creates single-element arrays `[value]`. joinBy separator logic (which requires 2+ items) is never exercised.
