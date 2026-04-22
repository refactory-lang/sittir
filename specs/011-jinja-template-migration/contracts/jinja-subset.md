# Contract: Jinja Authoring Subset

The intersection of Nunjucks and askama supported by sittir templates.
Any construct not listed here is **forbidden** and MUST cause a
translator-time failure (FR-005) or a Nunjucks / askama build-time
failure on the TS and Rust sides respectively.

## Allowed constructs

### Interpolation

```jinja
{{ variable }}
{{ variable | filter }}
{{ variable | filter(arg) }}
```

### Conditionals

```jinja
{% if condition %}
  ...
{% elif other_condition %}
  ...
{% else %}
  ...
{% endif %}
```

Condition operators: `==`, `!=`, truthiness of strings (empty = falsy)
and booleans. No `and` / `or` chains beyond simple two-term forms
(portability between Nunjucks and askama breaks on complex expressions).

### Loops

```jinja
{% for item in collection %}
  {{ item }}
  {%- if not loop.last %}, {% endif %}
{% endfor %}
```

Supported loop variables: `loop.first`, `loop.last`, `loop.index`
(1-based), `loop.index0` (0-based). No `loop.cycle`, no `loop.changed`.

### Whitespace control

```jinja
{%- if x -%}...{%- endif -%}
{{- var -}}
```

The hyphens (`-`) strip adjacent whitespace (including newlines) on the
indicated side. Nunjucks and askama handle this identically — verified
by the round-trip corpus per-node.

### Comments

```jinja
{# This comment is stripped at render time. #}
```

### Filters (standardized on Nunjucks names)

| Filter | Nunjucks | askama | Purpose |
|--------|----------|--------|---------|
| `join(sep)` | native | native | Join an array with a separator |
| `length` | native | native | Collection size |
| `default(v)` | native | native | Fallback when value is falsy |
| `trim` | native | native | Strip leading/trailing whitespace |
| `upper` | native | alias to `uppercase` | Uppercase |
| `lower` | native | alias to `lowercase` | Lowercase |

**Alias registration**: The askama side of Phase B registers filter
aliases in `crates/sittir-render/src/filters.rs`. Templates always use
the Nunjucks name; the alias map converts to askama's native filter at
build time.

## Forbidden constructs

| Construct | Why forbidden |
|-----------|---------------|
| `{% extends %}`, `{% block %}` | Not needed; adds complexity; per-rule file model is flatter. |
| `{% macro %}` | Semantics differ between Nunjucks and askama. |
| `{% match %}` | askama-only — breaks portability. |
| `{% set %}` | Cross-scope variable mutation complicates rendering contract. |
| `{% include %}` | Breaks one-file-per-rule invariant (forces ad-hoc shared fragments). |
| Raw Rust / JavaScript expressions | Non-portable. |
| Custom filters beyond the standardized set | Drift risk; every new filter must be added to both Nunjucks and askama sides. |
| Method calls (`x.method()`) | Nunjucks and askama differ. |
| Property access on non-context objects | Only `TemplateContext` fields are addressable. |

## Enforcement

- **Authoring time**: The translator (§3 in data-model) walks the
  `AssembledNode` and emits only constructs from this contract. Any
  rule that would require a forbidden construct throws.
- **TS load time**: Nunjucks's parser rejects syntax outside its
  support. Reaching this path implies a codegen bug.
- **Rust build time**: askama rejects unknown variables, unknown
  filters, and unsupported syntax at `cargo build`. This is the
  strictest gate — it enforces the subset per-template per-build.

## Adding a new construct

1. Verify Nunjucks and askama both support it with identical semantics.
2. Add to the "Allowed constructs" section of this contract.
3. Add cross-render parity test case to `crates/sittir-render/tests/parity.rs`.
4. Update the translator (if it's a construct the translator emits).
5. Re-run the full round-trip corpus.

Never add to this subset without proving cross-render parity on at
least one representative template.
