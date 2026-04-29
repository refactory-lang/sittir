# No-silent-formatting refactor — plan

> Status: design draft

## Goal

Eliminate the template walker's `needsSpace()`-driven runtime space
insertion. Every whitespace decision in a generated `.jinja` template
must be EXPLICIT — either a literal token from the grammar rule or a
Jinja conditional tied to the presence of a specific field.

User directive: _"get rid of needsSpace at runtime, only use the
Jinja conditionals"_.

Reference: https://jinja.palletsprojects.com/en/stable/templates/

## Current behaviour (what goes)

`packages/codegen/src/compiler/template-walker.ts:1096` — `needsSpace()`
is called between every pair of adjacent emitted parts in the seq
walker. It returns true when both sides are "word-like" (using a
grammar `word` matcher or the `/\w/` fallback) and the emitted part
starts with `$` (which `needsSpace` treats as the character `a`).

Consequences:

1. Placeholders are always treated as word-like, even when their
   content is non-word punctuation (`$SEMICOLON` resolving to `;`,
   `$OPENING` resolving to `{`). Spurious spaces creep in:
   `break {{ semicolon }}` renders as `break ;`.
2. Absent optional fields leave dangling whitespace: the walker-
   inserted space remains when the field is empty.
3. Spacing is inferred from character heuristics rather than from
   the semantic content of the placeholder.

## Target shape (what replaces it)

Each field / symbol placeholder carries its OWN leading-whitespace
decision based on two signals from the rule tree:

1. **Content word-likeness** — the first emitted character of the
   field's resolved content. Determined from the content rule:
   - `symbol(X)` resolving to an identifier / keyword / expression
     kind → word-like
   - `string('...')` starting with `[^\w]` → punct (no leading space)
   - `string('...')` starting with a word char → word-like
   - `choice(...)` → all-branches-word-like OR mixed (default to
     word-like to be safe)
   - Aliased refs (`aliasedTo`) → consult the target kind
2. **Optionality** — whether the field's content is wrapped in
   `optional(...)` or the field itself appears in an
   `optional(seq(field(...), ...))` wrapper. Also captured by
   `isRequired(AssembledField)`.

Resulting placeholder shapes:

| Content   | Required                        | Optional                       |
| --------- | ------------------------------- | ------------------------------ |
| word-like | ` $FOO` (leading space literal) | `{% if foo %} $FOO{% endif %}` |
| punct     | `$FOO` (no space)               | `{% if foo %}$FOO{% endif %}`  |

The seq walker loses its `out.push(' ')` call entirely. Whatever
the field emits is what lands in the output. Literal tokens emit
themselves unchanged.

## Examples

### `break_statement` (`seq('break', field('label', optional(...)), _semicolon)`)

Walker emits:

```
break{% if label %} $LABEL{% endif %}$SEMICOLON
```

Translated:

```
break{% if label %} {{ label }}{% endif %}{{ semicolon }}
```

Renders:

- `break;` source → `break;` ✓
- `break foo;` source → `break foo;` ✓

### `let_declaration` (`seq('let', field('mutable_specifier', optional(...)), field('pattern', ...), ..., _semicolon)`)

Walker emits:

```
let{% if mutable_specifier %} $MUTABLE_SPECIFIER{% endif %} $PATTERN...$SEMICOLON
```

Renders both `let foo;` and `let mut foo;` correctly.

### `function_item` (stacked optional modifiers)

Walker emits:

```
{% if visibility_modifier %} $VISIBILITY_MODIFIER{% endif %}{% if function_modifiers %} $FUNCTION_MODIFIERS{% endif %} fn $NAME...
```

_Note the leading-space-inside pattern is fine for middle/end
position but leaves a stray leading space when the entire
prefix is absent (`{% if %}{% endif %}{% if %}{% endif %} fn foo`
renders as ` fn foo` when both vis and mods are absent)._

For top-level kinds, a post-process pass (or a top-level
`.trim()` on the renderer output — already present in
`packages/core/src/render.ts`) absorbs that leading space.

## Scope

Files touched:

| File                                               | Change                                                                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/codegen/src/compiler/template-walker.ts` | Delete `out.push(' ')` in seq case; delete `needsSpace` helper. `field` / `symbol` cases gain per-placeholder leading-whitespace logic based on content word-likeness + optionality. |
| `packages/codegen/src/compiler/node-map.ts`        | `translateToJinja` becomes simpler — drops the `optionalFields`-aware conditional emission I tried (since walker now emits the conditional directly).                                |

## Risks

1. **Cascade regressions across every template.** Every kind in
   every grammar re-renders. Needs:
   - Freeze-template unit tests for a representative set (rust
     `function_item`, python `class_definition`, ts
     `interface_declaration`, etc.)
   - Round-trip validator as the integration signal.
2. **Word-likeness detection for complex content.** Nested choices
   where branches mix word and punct content — default to
   word-like (safe: may insert spurious space but doesn't smash
   tokens).
3. **Clause / variant emission already handles conditionality
   differently.** The existing `bang_clause` / optional-flank
   clause pattern has its own conditional emission. The refactor
   needs to not double-emit conditionals.

## Test gate

Before landing:

- All 516 codegen-internal tests pass
- `corpus-validation` rtPass / rtAstMatchPass numbers ≥ current
  values for ALL three grammars
- No new un-renderable kinds
- Regression-test: `probe-kind --grammar typescript --source
'break;' --kind break_statement` must show `rendered: 'break;'`
  and `astDiff.childCountMatch: true`

## Commit sequence

1. Add freeze-template unit tests for 5-10 representative kinds
   across the three grammars (capture CURRENT template output as
   baseline).
2. Refactor template walker: per-placeholder whitespace, delete
   `needsSpace`. Tests from step 1 will show the diff.
3. Update node-model / translate to match.
4. Regen all three grammars; update frozen template tests to
   reflect the NEW (correct) shapes.
5. Measure corpus metrics; commit the regen.
6. Raise `FLOORS` in `corpus-validation.test.ts` for any improved
   rtPass / rtAstMatchPass numbers.

## Why not in this session

The refactor is a ~4-hour careful pass with per-kind validation.
This session's context budget is better spent on the handful of
R1-blocking clusters where the fix is smaller (python
`tuple_pattern → case_pattern`, rust `impl_item !` token, python
comments-as-extras). The walker refactor should be a dedicated
workstream with its own commit series.
