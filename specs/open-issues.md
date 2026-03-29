# Coverage & Heuristic Gaps

Audit from 2026-03-29. Items marked [FIXED] were addressed in the same session.

## Rules Emitter (`packages/codegen/src/emitters/rules.ts`)

### [FIXED] Quantifier precedence: optional+multiple emitted `?` instead of `*`
Field quantifier map used `!required ? '?' : multiple ? '*' : ''`, so optional+multiple fields got `?`. Fixed: `multiple ? '*' : !required ? '?' : ''`.

### [FIXED] Shared `seen` set across CHOICE branches corrupts field counting
`ruleToSExpr` passed `seen` by reference to all CHOICE branches, so losing branches polluted the winner's field tracking. Fixed: clone `seen` per branch, merge winner back. Also added auto-append fallback for any model field the walker still can't reach.

**Remaining:** `attribute.arguments` relies on auto-append (equal-count CHOICE tie, field placed at template end rather than natural position).

### 1. Optional CHOICE drops tokens paired with fields
**Severity: Medium**

`optional(seq("->", field("return_type", ...)))` sets `optional=true` for all members, dropping the `"->"` token. When `return_type` is present, rendered output is `i32` instead of `-> i32`.

**Fix:** Track token-field pairing — tokens immediately preceding/following a field in a SEQ should share the field's quantifier, not the outer optional.

### 2. CHOICE tie-breaking is first-wins
**Severity: Medium**

When two CHOICE branches have equal field counts, the first branch wins. No secondary heuristic (e.g., prefer branch with more tokens, or prefer branch covering more unique fields).

Affects `attribute` (branches `value` and `arguments` each have 1 field — `value` wins by position, `arguments` falls to auto-append).

### 3. SYMBOL always emits `(_)*` regardless of repeat context
**Severity: Low**

Every unnamed SYMBOL becomes `(_)*`. Non-adjacent symbols separated by tokens produce `(_)* "token" (_)*`, potentially duplicating children in render output. The dedup logic only collapses **consecutive** `(_)*` entries.

## Render Engine (`packages/core/src/render.ts`)

### 4. Single separator per node type for all multi-fields
**Severity: Medium**

`joinBy` maps one separator per node kind. If a node has two list fields needing different separators (params: `, ` vs statements: `\n`), both get the same one.

### 5. Empty array for `+` quantifier silently accepted
**Severity: Medium**

One-or-more fields with empty arrays produce empty string (filtered by `parts.filter(p => p !== '')`), instead of throwing an error.

### 6. Parts joined with single space, no way to suppress
**Severity: Low (design trade-off)**

All non-empty parts joined with space. Tokens that should be adjacent (parens, dots) always have space: `name ( params )` instead of `name(params)`. Known trade-off for simplicity.

## S-expression Parser (`packages/core/src/sexpr.ts`)

### 7. Backslash unescape is incomplete
**Severity: Medium**

Only `\"` → `"` is unescaped. `\\` stays doubled. Affects tokens containing literal backslashes (rare but possible in operator tokens).

**Fix:** Add `raw.replace(/\\\\/g, '\\')` after the quote unescape.

### 8. Nested parentheses not handled
**Severity: Low (latent)**

Parser uses `indexOf(')')` to find closing paren — would break on nested S-expressions. Safe currently since templates are flat, but fragile if extended.

## Test Generator (`packages/codegen/src/emitters/test-new.ts`)

### [FIXED] Fallback `{ type, fields: {} }` crashes render for nodes with required fields
Used `ir.kindName(minimalArgs)` factory calls instead of raw objects. Recursion guard prevents infinite loops on recursive types.

### [FIXED] No tests for optional fields
Added "renders with optional fields" test that exercises all optional non-multiple fields populated.

### 9. No multi-element list tests for separator coverage
**Severity: Low**

`wrapMultiple` creates single-element arrays `[value]`. joinBy separator logic (which requires 2+ items) is never exercised.

## Pipeline / Reconcile (`packages/codegen/src/node-model.ts`)

### 10. Grammar sections not consumed
**Severity: Informational**

`Grammar` interface declares `extras`, `conflicts`, `precedences`, `externals`, `inline`, `word` — none are read by the pipeline. Most are parser-construction concerns, but:
- **`extras`** could inform assign (skip whitespace/comment children) and render (don't inject extras between fields)
- **`word`** could cross-check keyword detection
- **`externals`** could flag nodes that need scanner support (not expressible in grammar rules)
