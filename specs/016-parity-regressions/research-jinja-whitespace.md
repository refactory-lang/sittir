# Research — Jinja whitespace primitives across Nunjucks (TS) + Askama (Rust)

**Status**: research-only, pre-Cluster F (walker refactor) of feature 016.
**Date**: 2026-04-25.
**Driver**: `feedback_walker_refactor_blockers.md` plans `{% if foo is defined %}` for the new emission strategy. This artifact verifies (with prototypes, not just docs) what is actually intersection-safe between the two backends sittir ships, and surfaces a divergence from the walker plan.

All claims in §4 are verified against compiled prototypes — see §V for the verification log.

---

## 1. Jinja whitespace-control primitives — canonical reference

Source: <https://jinja.palletsprojects.com/en/stable/templates/>

| #   | Primitive                   | Syntax                                                                                  | Semantic                                                                                                                                                                                                  |
| --- | --------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Strip markers               | `{%- ... -%}`, `{{- ... -}}`, `{#- ... -#}`                                             | A leading `-` strips ALL whitespace (spaces / tabs / newlines) preceding the delimiter; a trailing `-` strips ALL whitespace following it. No space allowed between `{%` and `-`.                         |
| 2   | `trim_blocks` env option    | `Environment(trim_blocks=True)`                                                         | Auto-strips the FIRST newline after every block tag (PHP-style). Targets one newline only — does not touch indentation.                                                                                   |
| 3   | `lstrip_blocks` env option  | `Environment(lstrip_blocks=True)`                                                       | Strips leading tabs/spaces from a line whose first non-whitespace token is a block tag. Only fires when no other content precedes the tag on that line.                                                   |
| 4   | `{% set %}`                 | `{% set foo = expr %}` (inline) or `{% set foo %}...{% endset %}` (block)               | Assigns; emits nothing. Block form captures rendered content into the variable.                                                                                                                           |
| 5   | Conditionals                | `{% if cond %}...{% elif cond %}...{% else %}...{% endif %}`                            | Standard branching; the tags themselves emit nothing. Tests: `cond` (truthy on non-empty/non-zero/non-false), `cond is defined` (true iff name resolves), `cond is none` / `is not none` (None-equality). |
| 6   | `{% macro %}`               | `{% macro name(arg, kw=default) %}...{% endmacro %}`                                    | Defines a callable; emits nothing at definition.                                                                                                                                                          |
| 7   | Whitespace-touching filters | `\| trim`, `\| striptags`, `\| wordwrap(n)`, `\| indent(n)`, `\| safe`, `\| default(v)` | `trim` strips outer whitespace; `striptags` collapses whitespace + drops tags; `wordwrap` reflows; `indent` prepends spaces; `safe` is a marker only; `default` substitutes when undefined.               |
| 8   | Scoping blocks              | `{% call name(args) %}...{% endcall %}`, `{% with x = expr %}...{% endwith %}`          | `call` passes its body to a macro as `caller()`; `with` introduces a scoped binding. Both emit only what their body / callee produces.                                                                    |

---

## 2. Nunjucks coverage (TS-side)

Sources:

- <https://mozilla.github.io/nunjucks/templating.html>
- Empirical prototype: `/tmp/jinja-research/test*.js` against `nunjucks@3.2.4` (the version pinned in this repo).

| #   | Primitive                                                             | Support                        | Notes / divergence                                                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Strip markers `{%-` `-%}` `{{-` `-}}` `{#-` `-#}`                     | **Full**                       | Identical syntax to Jinja2.                                                                                                                                                                                                                                                                     |
| 2   | `trimBlocks` env option                                               | **Full**                       | JS-camelcased name. Sittir's env sets `trimBlocks: false` (production decision — whitespace stays explicit per template).                                                                                                                                                                       |
| 3   | `lstripBlocks` env option                                             | **Full**                       | JS-camelcased. Sittir's env sets `lstripBlocks: false`.                                                                                                                                                                                                                                         |
| 4   | `{% set %}` (inline + block)                                          | **Full**                       | `{% set foo %}...{% endset %}` works.                                                                                                                                                                                                                                                           |
| 5   | `{% if %}` / `{% elif %}` / `{% else %}` / `{% endif %}`              | **Partial**                    | Branching works. Tests `is defined` / `is undefined` exist (UNDOCUMENTED — empirically present in 3.2.4). `is none` / `is not none` are NOT documented and were not in the empirical probe — treat as unsafe. **Note**: `{% else if %}` (Askama spelling) does NOT work — must be `{% elif %}`. |
| 6   | `{% macro %}`                                                         | **Full**                       | Same syntax.                                                                                                                                                                                                                                                                                    |
| 7   | Filters `trim` / `striptags` / `indent` / `safe` / `default` / `join` | **Full**                       | All present. Defaults differ: Nunjucks `striptags` has a `preserve_linebreaks` parameter Jinja2 doesn't have.                                                                                                                                                                                   |
|     | Filter `wordwrap`                                                     | **Not supported**              | Absent from Nunjucks.                                                                                                                                                                                                                                                                           |
| 8   | `{% call %}` block                                                    | **Full**                       | Same callable-body pattern.                                                                                                                                                                                                                                                                     |
| 9   | Autoescape                                                            | **Full**, no whitespace impact | Doesn't touch spacing. Sittir's env sets `autoescape: false` because outputs are source code, not HTML.                                                                                                                                                                                         |

**Key empirical detail on `is defined`** (the walker plan's proposed primitive):

- `is defined` is true when the key is in the context, EVEN IF the value is `null` or `''`.
- It is only false when (a) the key is absent or (b) the key maps to `undefined` explicitly.
- For sittir's render context (always populated from a NodeData where empty optional fields are usually `undefined` rather than absent), `is defined` is NOT a reliable "is non-blank" test. See §5 for scenario impact.

---

## 3. Askama coverage (Rust-side)

Sources:

- <https://askama.rs/en/stable/template_syntax.html> (note: redirected via askama.readthedocs.io; the canonical home is `askama.rs`)
- <https://askama.rs/en/stable/filters.html>
- Empirical prototype: `/tmp/askama-research/` against `askama 0.14` (the version pinned in this repo's `Cargo.toml`).

| #   | Primitive                                                                                                                                                                                                                                                                  | Support                        | Notes / divergence                                                                                                                                                                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Strip markers `{%-` / `-%}`                                                                                                                                                                                                                                                | **Full**                       | Plus Askama-only `{%~` / `~%}` ("minimize, prefer newline") and `{%+` / `+%}` ("preserve, override default-suppress config").                                                                                                                                                                                                                                         |
| 2   | `trim_blocks` analog                                                                                                                                                                                                                                                       | **Partial**                    | Configured via `#[template(whitespace = "...")]` per template OR `[general] whitespace` in `askama.toml`. Default: preserve all whitespace except a single trailing newline of the file is suppressed.                                                                                                                                                                |
| 3   | `lstrip_blocks` analog                                                                                                                                                                                                                                                     | **Partial**                    | Same `whitespace` config knob; `"minimize"` / `"suppress"` modes act somewhat similarly but at coarser granularity than Jinja2's per-line `lstrip_blocks`.                                                                                                                                                                                                            |
| 4   | `{% set %}` / `{% let %}` (both spellings)                                                                                                                                                                                                                                 | **Full**                       | `{% let foo = expr %}` is canonical; `{% set %}` is an alias. `{% let mut %}` and `{% mut x += 1 %}` add Rust-specific mutability.                                                                                                                                                                                                                                    |
| 5   | `{% if %}` / `{% elif %}` / `{% else if %}` / `{% else %}` / `{% endif %}`                                                                                                                                                                                                 | **Full**, with Rust extensions | Both `{% elif %}` AND `{% else if %}` accepted (verified). Ships `{% if let Some(x) = opt %}` and `{% if x is defined %}` / `{% if x is not defined %}` — but the latter is COMPILE-TIME (true iff field exists in struct), not a runtime presence check. **Critical: `{% if foo %}` on a `&str`/`String` field FAILS to compile** — the expression must be a `bool`. |
| 6   | `{% match %}` / `{% when %}`                                                                                                                                                                                                                                               | **Full** (Askama-only)         | Dedicated Rust pattern matching. No Nunjucks equivalent.                                                                                                                                                                                                                                                                                                              |
| 7   | `{% macro %}`                                                                                                                                                                                                                                                              | **Full**                       | Same syntax.                                                                                                                                                                                                                                                                                                                                                          |
| 8   | Filters `trim` / `indent` / `safe` / `default` / `join` / `truncate` / `escape` / `lower` / `upper` / `wordcount` / `capitalize` / `center` / `fmt` / `format` / `linebreaks` / `linebreaksbr` / `paragraphbreaks` / `pluralize` / `urlencode` / `filesizeformat` / `json` | **Mostly full**                | Pipeline syntax (`{{ x                                                                                                                                                                                                                                                                                                                                                | trim }}`) matches Jinja2. `{% filter X %}`block form not documented for Askama; treat as unsupported.`wordwrap`and`striptags` are NOT in Askama's built-in set. |
| 9   | `{% call %}` block                                                                                                                                                                                                                                                         | **Full**                       | Same callable-body pattern.                                                                                                                                                                                                                                                                                                                                           |

**Key empirical detail on Askama's static typing**:

- `{% if foo is defined %}` checks whether `foo` is a struct field at compile time. For sittir's generated `TemplateContext` structs (where fields are declared per-grammar-rule), `is defined` is ALWAYS true if the field exists. It does NOT branch on whether the field's String value is empty.
- For a "this field has content" check, the only intersection-safe primitive is the existing `isPresent` filter from `sittir-core::filters` (already shipped on both engines, see `packages/core/src/templates/nunjucks-env.ts:167` and `rust/crates/sittir-core/src/filters.rs:111`).
- Rust-only alternatives (`{% if let Some(x) = opt %}`, `{% if !x.is_empty() %}`) work but break Nunjucks parity.

---

## 4. Intersection — primitives that work IDENTICALLY in both backends

Each row was prototype-verified except where noted. "Intersection-safe" means: byte-equal output across both engines AND no per-backend template branching needed.

| Primitive                                      | Nunjucks behaviour                                                        | Askama behaviour                                                       | Intersection-safe?                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `{%- ... -%}` strip markers                    | Strips adjacent whitespace including newlines                             | Strips adjacent whitespace including newlines                          | **Yes** (verified)                                                                                             |
| `{%~`/`~%}` (Askama "minimize")                | Not supported                                                             | Supported                                                              | **No** (Askama-only)                                                                                           |
| `trim_blocks` / `lstrip_blocks` env opts       | `trimBlocks` / `lstripBlocks`, runtime-configurable                       | `whitespace = "..."` template attr, codegen-time                       | **No** (different granularity, different timing). Sittir already disables both — keep that.                    |
| `{% set foo = expr %}` (inline)                | Supported                                                                 | Supported (also as `{% let %}`)                                        | **Yes** (use the `{% set %}` spelling for portability)                                                         |
| `{% set foo %}...{% endset %}` (block)         | Supported                                                                 | Not documented                                                         | **Treat as no** (unverified on Askama; safer to avoid in shared templates)                                     |
| `{% if cond %}...{% endif %}`                  | `cond` is truthy-coerced (empty string is false)                          | `cond` MUST be `bool`-typed; `&str`/`String` fails to compile          | **No** for raw field refs — wrap in a filter                                                                   |
| `{% if foo \| isPresent %}`                    | Returns true on non-blank scalar                                          | Returns true on non-blank scalar                                       | **Yes** (verified — the canonical sittir idiom)                                                                |
| `{% if foo \| isBlank %}`                      | Returns true on blank/empty/null/undefined                                | Returns true on `trim().is_empty()`                                    | **Yes** (verified)                                                                                             |
| `{% elif %}`                                   | Supported                                                                 | Supported                                                              | **Yes** (verified)                                                                                             |
| `{% else if %}` (Askama spelling)              | NOT supported (parse error)                                               | Supported                                                              | **No** — always emit `{% elif %}`                                                                              |
| `{% else %}`                                   | Supported                                                                 | Supported                                                              | **Yes** (verified)                                                                                             |
| `{% if foo is defined %}`                      | Runtime — true unless key absent or set to `undefined`                    | Compile-time — true iff field exists in struct                         | **No** (semantics differ — Askama can't see runtime emptiness; Nunjucks treats `null`/`''` as defined). Avoid. |
| `{% if foo is none %}` / `is not none`         | Documented? unclear; not in 3.2.4's docs                                  | Not standard                                                           | **No** — avoid                                                                                                 |
| `{% if let Some(x) = opt %}`                   | Not supported (parse error)                                               | Supported                                                              | **No** (Askama-only)                                                                                           |
| `{% if !foo.is_empty() %}`                     | Not supported (Rust method call)                                          | Supported                                                              | **No** (Askama-only)                                                                                           |
| `{% if foo != "" %}`                           | True for `undefined`/`null` (treats as `!= ""`) — buggy for missing slots | Works on `&str` field that's always present                            | **No** — semantics diverge on missing/null inputs                                                              |
| `{% macro name(args) %}...{% endmacro %}`      | Supported                                                                 | Supported                                                              | **Yes** (docs-only verified, not exercised in sittir today)                                                    |
| `{% call name() %}...{% endcall %}`            | Supported                                                                 | Supported                                                              | **Yes** (docs-only verified)                                                                                   |
| `{% match %}` / `{% when %}`                   | Not supported                                                             | Supported                                                              | **No** (Askama-only)                                                                                           |
| Filter `\| trim`                               | Yes                                                                       | Yes                                                                    | **Yes**                                                                                                        |
| Filter `\| join(",")`                          | Yes — sittir overrides to tolerate undefined / non-array                  | Yes — typed `&[String]`; fails on undefined                            | **With caveats** — sittir-core wraps both sides; `joinby`/`joinWithTrailing`/etc. are the parity-safe names    |
| Filter `\| safe`                               | Yes (marker; no whitespace effect)                                        | Yes                                                                    | **Yes** (no-op when autoescape disabled)                                                                       |
| Filter `\| default(v)`                         | Yes — substitutes when undefined                                          | Yes — has a `boolean` second arg variant                               | **With caveats** — argument shape diverges; prefer `\| isPresent`-gated `{% else %}` block                     |
| Filter `\| indent(n)`                          | Yes                                                                       | Yes                                                                    | **Yes**                                                                                                        |
| Filter `\| wordwrap`                           | Not supported (Nunjucks lacks it)                                         | Yes                                                                    | **No**                                                                                                         |
| Filter `\| striptags`                          | Yes                                                                       | Not supported (Askama lacks it)                                        | **No**                                                                                                         |
| Autoescape (HTML escaping of `<`/`>`/`&`/etc.) | Configurable; sittir disables                                             | Configurable per template; sittir templates use `ext = "txt"` to avoid | **Yes** when both disabled (current state)                                                                     |

**The load-bearing intersection-safe set for the walker refactor** (rows that resolve all four scenarios in §5):

1. `{% if foo | isPresent %}...{% endif %}` (and `| isBlank` for the inverse)
2. `{% elif %}` and `{% else %}` for multi-branch
3. `{%- ... -%}` strip markers for cosmetic newline removal
4. `{{ foo }}` straight interpolation
5. `{{ children | joinby(sep, leading, trailing) }}` (or the per-side filters for the TS engine — already wired)

That's it. Everything else either diverges semantically or is single-engine.

---

## 5. Specific scenarios — proposed templates

Each scenario was verified end-to-end (see §V).

### Scenario A — Optional field with leading space

**Grammar**: `seq('break', field('label', optional($.identifier)), ';')`

**Today's broken template** (matches `packages/rust/templates/break_expression.jinja` at HEAD):

```jinja
break {% if label | isPresent %}{{ label }}{% endif %} {{ children | join(" ") }}
```

Renders `break  ;` (double space) when label absent — the conditional sits between two literal spaces.

**Recommended template** (works in BOTH engines, verified):

```jinja
break{% if label | isPresent %} {{ label }}{% endif %};
```

- Place the leading space INSIDE the conditional block, after `{% if %}`.
- No outer space between `break` and the opener; no outer space between the closer and `;`.

**Verified output**:

- present: `break foo;`
- absent / empty / null / undefined / whitespace-only: `break;`

### Scenario B — Optional field WITHOUT leading space

**Grammar**: `seq($.identifier, optional(field('args', $.argument_list)))`

**Recommended template**:

```jinja
{{ name }}{% if args | isPresent %}{{ args }}{% endif %}
```

- No space anywhere. Same shape as scenario A but no leading space inside the conditional.

**Verified output**:

- with args: `foo()`
- without: `foo`

### Scenario C — Multi-position optional with separator

**Grammar**: `seq('if', $.condition, ':', $.body, optional(seq('else', ':', $.else_body)))`

**Recommended template**:

```jinja
if {{ cond }}: {{ body }}{% if else_body | isPresent %} else: {{ else_body }}{% endif %}
```

- Leading space + `else` + colon + space + body, all INSIDE the conditional.
- The required-prefix `if {{ cond }}: {{ body }}` stays unconditional.

**Verified output**:

- with else: `if x: y else: z`
- without: `if x: y` (no orphan `else`, no trailing space)

### Scenario D — Required field whose value MAY be empty

**Grammar**: `seq('print', $.expression_list)` where `expression_list` may be 0-or-more.

**Recommended template**:

```jinja
print{% if list | isPresent %} {{ list }}{% endif %}
```

- The grammar says `print` always has the field, but the field's RENDERED value may be empty. Same conditional pattern as scenario A — the field's presence at the type/struct level is irrelevant; what matters is whether the rendered string is blank.
- Note: scenario D is structurally identical to scenario A from the template's point of view. The grammar-vs-template distinction (optional vs required-may-be-empty) collapses at the render boundary because `isPresent` operates on the rendered string.

**Verified output**:

- with expressions: `print a, b, c`
- empty: `print` (no trailing space)

### Scenario E — Comment placeholder positioning (forward-looking, feature 017)

**Grammar**: `seq($.let_keyword, $.identifier, '=', $.value, ';')` where source has a trailing `// comment`.

Neither Jinja2 nor Askama nor Nunjucks has a primitive for "preserve original byte text including extras (comments / whitespace) at this boundary". Both engines' templates render the structured fields only; comment preservation requires:

- Either: a pre-render pass that captures `extras` (comments + trivia) per byte-range as additional template inputs (e.g. `{{ trailing_extras }}` injected at boundaries).
- Or: a post-render reapply pass that re-inserts captured extras.

Recommendation: defer to feature 017. The closest plain-Jinja primitive is a conditional emit, e.g. `{% if trailing_extras | isPresent %} {{ trailing_extras }}{% endif %}` — but the WALKER must learn to emit those slots, which is a separate piece of work.

---

## 6. Risks + caveats

### Askama static typing

- `{% if foo is defined %}` is compile-time only. Sittir's generated structs declare every field per kind, so `is defined` is always-true and unhelpful as a presence check.
- Workarounds (`{% if let Some(x) = opt %}`, `{% if !x.is_empty() %}`) all break Nunjucks parity.
- The only intersection-safe path is the `isPresent` filter, which is already shipped and known-correct on both sides.

### Nunjucks autoescape

- Sittir disables autoescape (`autoescape: false` in `nunjucks-env.ts`). Autoescape does NOT touch whitespace per Nunjucks docs — it transforms `<` → `&lt;` and similar. Disabled, it is a non-issue. If a future contributor enables it for HTML output, all current templates break (source code with `<>` operators would be mangled), but whitespace handling stays unaffected.

### Filter divergence on empty/undefined inputs

- `{{ foo | join(",") }}` on Askama with a `&[String]` works. On Nunjucks, sittir's wrapping `join` filter tolerates undefined inputs by returning `""`. If a future Askama template sees the same shape it will fail to compile (`Vec<String>` doesn't have an "undefined" state in Rust). The codegen handles this by emitting typed `Vec<String>` fields with explicit empty defaults. Not a runtime risk, but a codegen-emission risk if a per-rule emitter forgets to default-init the vec.

### `default` filter argument shapes

- Jinja: `{{ foo | default("fallback") }}` substitutes when undefined.
- Askama: `{{ foo | default(value, boolean) }}` — second positional arg controls behavior.
- Verdict: avoid `| default()` in shared templates; use `{% if foo | isBlank %}fallback{% else %}{{ foo }}{% endif %}` instead — fully portable, fully explicit.

### `{%- -%}` strip markers — behavior on whitespace inside conditionals

- Strip markers eat ALL adjacent whitespace including newlines. Inside an `{% if %}` block, a leading-space-then-strip-marker (`{%- if x -%} {{ x }}{%- endif -%}`) will eat the leading space too. The walker emission must NOT use strip markers to "tidy up" if it relies on a leading-space-inside-conditional pattern. Verified: `X\n{%- if foo | isPresent -%} {{ foo }}{%- endif -%}\nY` with `foo='bar'` renders `XbarY`, not `X barY`. Strip markers should only be used at template boundaries (top/bottom) for cosmetic newline cleanup, never around conditional content where intentional spaces live.

---

## 7. Recommendation

**Use `{% if FIELD | isPresent %}...{% endif %}` with the leading separator (space, comma, etc.) placed INSIDE the conditional block.**

The full emission pattern for an optional field at slot N in a seq:

```jinja
{% if FIELD | isPresent %}<separator-before>{{ FIELD }}{% endif %}
```

where `<separator-before>` is the literal that should precede this field's content (space, `, `, `else `, etc.) — exactly one separator, exactly inside the conditional, exactly preceding the interpolation.

**Why this beats the walker plan's `{% if foo is defined %}`**:

1. **Cross-engine parity (load-bearing)**: `is defined` semantics diverge between Nunjucks and Askama, so the walker plan as written would either:
   - render correctly in Nunjucks but always-emit in Askama (compile-time true), or
   - require per-backend template emission (violates the walker's "emit one template, render in either backend" architecture).

2. **Reuses already-shipped primitives**: `isPresent` and `isBlank` are already registered as filters on both engines (`packages/core/src/templates/nunjucks-env.ts:167` and `rust/crates/sittir-core/src/filters.rs:111`), with matching cross-engine semantics, with tests, with documentation. The walker refactor inherits a tested foundation instead of introducing a new primitive that needs cross-engine bridging.

3. **Smaller surface area**: One filter per conditional. No `is defined` / `is none` / `default()` / `if let` to reason about.

4. **Handles all four walker-relevant scenarios** (A/B/C/D) without per-scenario branching — the same template shape works for "optional with leading space", "optional without leading space", "multi-position optional with prefix", and "required-but-may-render-empty".

### Score against the walker plan

| Aspect                                 | Walker plan (`is defined`)                                               | This recommendation (`isPresent` filter)                           |
| -------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Works in Nunjucks                      | Yes (3.2.4 has it, undocumented)                                         | Yes (registered filter, tested)                                    |
| Works in Askama                        | NO — compile-time, always-true for declared fields                       | Yes (registered filter, tested)                                    |
| Treats `null` / empty-string as absent | NO — `is defined` is true for both                                       | YES — `isPresent` returns false                                    |
| Treats whitespace-only as absent       | NO                                                                       | YES (`trim().is_empty()`)                                          |
| Per-backend template branching needed  | YES if you want correctness on both                                      | NO                                                                 |
| Already shipped on both engines        | NO (`is defined` filter doesn't exist as a custom filter; Nunjucks-only) | YES (both `nunjucks-env.ts` and `sittir-core::filters` have it)    |
| Test coverage                          | None                                                                     | `rust/crates/sittir-core/tests/filters.rs` covers it on both sides |

**Walker plan divergence — surface this to the user**:

- Tasks T035 / T036 in `specs/016-parity-regressions/tasks.md` reference `{% if foo is defined %}` explicitly. Those task descriptions should be updated to use `{% if foo | isPresent %}` before implementation begins.
- The note in `feedback_walker_refactor_blockers.md` should be similarly updated.
- The freeze-test step (T033) is unaffected — it captures CURRENT broken output; the corrected output (T035) just uses a different conditional spelling than the original plan.

---

## V. Verification log

All claims tagged "verified" in this artifact were exercised by prototypes:

### Nunjucks prototypes

- Location: `/tmp/jinja-research/test*.js` (transient — re-run requires `node /tmp/jinja-research/test4.js` after re-creating the scripts; files were not preserved).
- Engine: `nunjucks@3.2.4` from this repo's `node_modules/.pnpm/`.
- Filter `isPresent` was registered with the exact production semantics from `packages/core/src/templates/nunjucks-env.ts:160-167`.
- Confirmed:
  - `{% if foo is defined %}` returns YES for present-empty (`{ foo: '' }`) and present-null (`{ foo: null }`); returns NO only for missing keys or explicit `undefined`. Therefore unsuitable as a "non-blank" check.
  - `{% if foo %}` truthy-test returns NO on `''`/`null`/missing.
  - `!= ""` returns YES on missing keys (Nunjucks treats undefined as `!= ""`); incorrect for sittir's use case.
  - All four scenarios (A/B/C/D) render identically with the recommended pattern.
  - `{% else if %}` (Askama spelling) errors with "unknown path" — Nunjucks requires `{% elif %}`.

### Askama prototypes

- Location: `/tmp/askama-research/` (transient cargo project, present at time of research).
- Engine: `askama 0.14` from crates.io (matches this repo's `Cargo.toml` workspace pin).
- Filter `isPresent` was implemented inline in a `mod filters` block matching the production signature from `rust/crates/sittir-core/src/filters.rs:110-113`.
- Confirmed:
  - `{% if foo %}` on a `&str` field FAILS to compile (`the trait bound 'str: PrimitiveType' is not satisfied`).
  - `{% if foo is defined %}` compiles and is always-true for a declared field, regardless of runtime value.
  - `{% if foo != "" %}` compiles on `&str` and works correctly when the field is always-present.
  - `{% if foo | isPresent %}` works identically to the Nunjucks prototype, byte-equal output for all scenarios.
  - Both `{% elif %}` and `{% else if %}` parse and run.
  - `{% if let Some(x) = opt %}` works on `Option<&str>` — Askama-only.
  - Default whitespace handling: a single trailing newline in the source template is auto-stripped (Askama default; matches the empirical output where templates ending in `\n` did not produce a leading newline in output).

### Production reference points

- `packages/core/src/templates/nunjucks-env.ts:160-189` — production `isPresent`/`isBlank`/`value` filter registration (Nunjucks side).
- `rust/crates/sittir-core/src/filters.rs:82-113` — production `isPresent`/`isBlank` filters (Askama side).
- `rust/crates/sittir-core/tests/filters.rs` — parity tests for the filter family.
- `packages/rust/templates/break_expression.jinja` — example of a current-state broken template that the walker refactor will fix to the recommended shape.
- `packages/rust/templates/closure_expression.jinja`, `packages/rust/templates/let_declaration.jinja` — additional broken examples; same fix applies.

### Doc URLs (re-verifiable)

- Jinja2: <https://jinja.palletsprojects.com/en/stable/templates/>
- Nunjucks: <https://mozilla.github.io/nunjucks/templating.html>
- Askama syntax: <https://askama.rs/en/stable/template_syntax.html>
- Askama filters: <https://askama.rs/en/stable/filters.html>
- Askama crate root (redirects to askama.rs): <https://docs.rs/askama/latest/askama/>
