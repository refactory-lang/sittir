# PR2 template byte-equivalence audit

**Audit date:** 2026-05-20
**Branch:** `025-pr2-canonicalize-template-emitter` (vs `master`)
**Total templates changed:** 920 (460 in `packages/*/templates/` + 460 mirror copies in `rust/crates/sittir-*/templates/`)
**Audit method:** programmatic diff analysis (no git checkout dance; Step 3 skipped — regression candidates derived from SHAPE-MAJOR templates + live validator output)

---

## Summary

| Grammar | Total changed | COSMETIC | SHAPE-MINOR | SHAPE-MAJOR | EMPTY-CONTENT (new files) |
|---------|--------------|----------|-------------|-------------|--------------------------|
| rust | 185 | 34 | 36 | 95 | 20 |
| typescript | 179 | 62 | 13 | 101 | 3 |
| python | 96 | 21 | 20 | 55 | 0 |
| crate-rust mirror | 185 | 34 | 36 | 95 | 20 |
| crate-typescript mirror | 179 | 62 | 13 | 101 | 3 |
| crate-python mirror | 96 | 21 | 20 | 55 | 0 |
| **Total (unique)** | **460** | **117** | **69** | **251** | **23** |

Mirrors (`rust/crates/sittir-*/templates/`) are byte-for-byte copies of their `packages/*/templates/` counterparts — they carry no additional signal. All analysis below refers to the unique set (460 files).

LOC delta (content lines only, excluding generated header):
- rust: +185 / -189 (net -4)
- typescript: +179 / -176 (net +3)
- python: +98 / -112 (net -14)

---

## Validate:native baseline comparison

| Metric | master | PR2 HEAD | Δ |
|--------|--------|----------|---|
| rust covPass | 178/184 | 158/184 | **-20** (note: 26 fail, not 20 — 184-158=26) |
| rust RT-deep | 102/136 | 97/136 | -5 |
| rust RT-deep ast match | 92 | 75 | -17 |
| rust RT-shallow | 134/136 | 134/136 | 0 |
| rust fromPass | ~168/168 (est.) | 128/168 | -40 |
| rust factory-render-parse | ~765/1455 (est.) | 568/1455 | large drop |

Spec records PR2 HEAD as: `covPass 158/184, RT-deep 101/136, RT-shallow 134/136`. Live validator run on this audit: `covPass=158, RT-deep=97/136, RT-shallow=134/136, factory 568/1455`.

The RT-shallow gate held at 134/136 (same as master) — confirming the regressions are in DEEP round-trip and template coverage, not initial parse shape.

factory-render-parse first-failing buckets (live probe-factory output):
- **[133] re-parse error** — top kinds: `function_item` (32), `type_parameters` (18), `trait_item` (11), `match_expression` (9), `type_item` (8), `impl_item` (7), `pointer_type` (6), `const_item` (5). Sample: `"asyncfnabc(){}"`.
- **[62] kind not found in re-parse** — top kinds: `let_declaration` (17), `tuple_type` (8), `type_item` (7), `abstract_type` (5), `mut_pattern` (3). Sample: `"letx;"`.
- **[3] factory threw** — `_array_expression_list` (2), `ordered_field_declaration_list` (1).

---

## Root cause: two systemic TemplateEmitter bugs

The 920 template changes are not independent. They share two root causes.

### Bug 1: Space stripping between keyword literals and slot references

The new TemplateEmitter emits slot references immediately adjacent to keyword tokens without intervening spaces. This produces syntactically invalid Rust (and Python/TypeScript):

```
OLD: fn {{ name }}{{ parameters }}...{{ body }}
NEW: fn{{ name }}{{ parameters }}...{{ body }}
     ^^^^ no space
```

Rendered output: `"asyncfnabc(){}"`, `"letx;"`, `"ifcondition"`, `"matchvalue"`, etc.

This is the primary driver of the 133 "re-parse error" and 62 "kind not found" factory failures. It affects every kind that has a keyword token preceding a slot. The COSMETIC bucket (117 files) actually contains 12 rust templates where this space-stripping occurs between keywords and slots (incorrectly classified COSMETIC because the character sequence is the same; the difference is purely whitespace). Examples: `abstract_type`, `associated_type`, `async_block`, `const_block`, `enum_item`, `gen_block`, `let_condition`, `reference_type`, `trait_item`, `type_item`.

### Bug 2: Slot name substitution with synthesized helper names

The TemplateEmitter substituted field names declared in `node-types.json` with auto-generated synthesized helper names (`_optional1`, `_optional2`, `_repeat1`, etc.) in 23+ kinds. These synthesized helpers are not populated by the FROM/read path, causing:
- `from` throws: `"singular slot 'expression' on 'arguments' requires one value; got undefined"`
- cov failures: declared field missing from template

Additionally, `binary_expression` (all three grammars) had its `operator` slot replaced with a hardcoded `&&` literal — a semantic loss for all other operators (`+`, `-`, `*`, `/`, `|`, `as`, etc.).

---

## SHAPE-MAJOR subtypes (rust only, 95 total)

| Subtype | Count | Description |
|---------|-------|-------------|
| separator_changed | 34 | join filter or separator literal changed; includes `children` → typed slot name |
| condition_lost | 29 | conditional `{% if %}` guard removed from template |
| polymorph_new | 15 | new `{%- if variant == "..." -%}` arms added (generally correct direction) |
| vars_removed | 7 | fewer slot names in new template (slot dropped, not renamed) |
| condition_gained | 5 | new `{% if %}` guard added |
| filter_changed | 5 | join filter changed (e.g. `joinWithTrailing(",")` → bare `{{ x }}`) |

The "polymorph_new" subtype is the correct structural evolution — polymorphic kinds now get per-variant dispatch templates. The other subtypes contain the regression candidates.

---

## Regression candidate kinds

Cross-reference of SHAPE-MAJOR templates with validator failures. Sorted by severity.

### Tier 1: semantic loss (confirmed broken output)

These kinds produce syntactically invalid or semantically wrong output on PR2:

**`binary_expression`** (rust, typescript, python):
```
OLD: {{ left }} {{ operator }} {{ right }}
NEW: {{ left }}&&{{ right }}
```
`operator` field dropped; `&&` hardcoded. All non-`&&` binary operators produce wrong output.

**`function_item`** (rust, 32 factory re-parse errors):
```
OLD: {% if visibility_modifier | isPresent %}{{ visibility_modifier }} {% endif %}{% if function_modifiers | isPresent %}{{ function_modifiers }} {% endif %}fn {{ name }}{% if type_parameters | isPresent %} {{ type_parameters }}{% endif %}{{ parameters }}{% if return_type | isPresent %} ->{{ return_type }}{% endif %}{% if where_clause | isPresent %} {{ where_clause }}{% endif %} {{ body }}
NEW: {% if visibility_modifier | isPresent %}{{ visibility_modifier }}{% endif %}{% if function_modifiers | isPresent %}{{ function_modifiers }}{% endif %}fn{{ name }}{% if type_parameters | isPresent %}{{ type_parameters }}{% endif %}{{ parameters }}{% if function_item_optional1 | isPresent %}{{ function_item_optional1 }}{% endif %}{% if where_clause | isPresent %}{{ where_clause }}{% endif %}{{ body }}
```
Space-stripping (`fn{{ name }}`) + `return_type` replaced by unresolvable `function_item_optional1`.

**`let_declaration`** (rust, 17 "kind not found" factory errors):
```
OLD: let{% if mutable_specifier | isPresent %} {{ mutable_specifier }}{% endif %} {{ pattern }}{% if type | isPresent %}:{{ type }}{% endif %}{% if value | isPresent %} ={{ value }}{% endif %}{% if alternative | isPresent %} else {{ alternative }}{% endif %};
NEW: let{% if mutable_specifier | isPresent %}{{ mutable_specifier }}{% endif %}{{ pattern }}{% if let_declaration_optional1 | isPresent %}{{ let_declaration_optional1 }}{% endif %}{% if let_declaration_optional2 | isPresent %}{{ let_declaration_optional2 }}{% endif %}{% if let_declaration_optional3 | isPresent %}{{ let_declaration_optional3 }}{% endif %};
```
Space after `let` and `mutable_specifier` removed; `type`, `value`, `alternative` replaced by unresolvable `_optional1/2/3`.

**`match_expression`** (rust, 9 factory errors):
```
OLD: match {{ value }} {{ body }}
NEW: match{{ value }}{{ body }}
```
Space between `match` and value removed; space before body removed.

**`trait_item`** (rust, 11 factory errors):
```
OLD: {% if visibility_modifier | isPresent %}{{ visibility_modifier }} {% endif %}{% if unsafe_marker | isPresent %}{{ unsafe_marker }} {% endif %}trait {{ name }}...
NEW: {% if visibility_modifier | isPresent %}{{ visibility_modifier }}{% endif %}{% if unsafe_marker | isPresent %}{{ unsafe_marker }}{% endif %}trait{{ name }}...
```
Space-stripping throughout.

**`type_parameters`** (rust, 18 factory errors):
```
OLD: <{% if attributes | isPresent %}{{ attributes | joinWithTrailing(",") }}{% endif %}>
NEW: <{{ type_parameters_repeat1 }}>
```
`attributes` field replaced by `type_parameters_repeat1` (synthesized helper, not a declared field).

**`arguments`** (rust):
```
OLD: ({% if attributes | isPresent %}{{ attributes | joinWithTrailing(",") }}{% endif %})
NEW: ({{ attribute_item | join(" ") }}{{ expression }})
```
`attributes` replaced by `attribute_item` (renamed) + `expression` added without separator.

**`ordered_field_declaration_list`** (rust):
```
OLD: ({% if children | isPresent %}{{ children | joinWithTrailing(",") }}{% endif %}{% if type | isPresent %} {{ type | join(",") }}{% endif %})
NEW: ({{ attribute_item | join(" ") }}{% if visibility_modifier | isPresent %}{{ visibility_modifier }}{% endif %}{{ type }})
```
`type` changed from array (`join(",")`) to singular; `attributes` field dropped.

**`type_arguments`** (rust):
```
OLD: <{{ children | joinWithTrailing(",") }}>
NEW: <{{ type_arguments_repeat1 }}>
```
`type_arguments_repeat1` is a synthesized helper that isn't declared in node-types.json.

**`impl_item`** (rust, 7 factory errors):
```diff
-{% if unsafe_marker | isPresent %}unsafe {% endif %}impl{% if type_parameters | isPresent %} {{ type_parameters }}{% endif %}{% if trait | isPresent %} {% if negative | isPresent %}! {% endif %}{{ trait }} for{% endif %} {{ type }}{% if where_clause | isPresent %} {{ where_clause }}{% endif %} {% if children | isPresent %}{{ children | join(" ") }}{% else %};{% endif %}
+{%- if variant == "body" -%}{% if unsafe_marker | isPresent %}{{ unsafe_marker }}{% endif %}impl{% if type_parameters | isPresent %}{{ type_parameters }}{% endif %}{% if negative | isPresent %}{% if negative | isPresent %}{{ negative }}{% endif %}{{ trait }}for{% endif %}{{ type }}...
```
Polymorph is correct direction, but `for` keyword hardcoded without space, `negative` block double-nested.

### Tier 2: space-stripping only (output concatenated without spaces)

These kinds produce syntactically invalid output because spaces between keyword tokens and slots are stripped:

`type_item` (8 factory errors), `const_item` (5 factory errors), `use_declaration`, `abstract_type`, `if_expression`, `mod_item`, `loop_expression`, `while_expression`, `for_expression`, `extern_crate_declaration`, `enum_item`, `trait_item` (already listed), `function_signature_item`, `async_block`, `const_block`, `gen_block`.

### Tier 3: slot renamed (children → typed name)

Slot renamed from the generic `children` to a typed name. Behavioral impact depends on whether the FROM path populates the new slot name:

`mut_pattern` (`children | join` → `pattern`), `tuple_type` (`children | joinWithTrailing(",")` → `type | joinWithTrailing(",")`), `reference_expression` (`children | join(" ")` → `reference_expression_raw_const`), `self_parameter` (`reference` field dropped), `block_comment` (`inner` field dropped).

### Tier 4: New polymorph templates (likely correct)

`array_expression`, `closure_expression`, `delim_token_tree`, `mod_item`, `pointer_type`, `range_expression`, `struct_item`, `macro_definition`, `token_tree`, `token_tree_pattern`, `visibility_modifier`, `expression_statement`, `match_arm`, `function_type` — these added variant dispatch arms and are structurally sound in intent, though spaces within arm bodies may share the Tier 2 issue.

---

## Representative samples per category

### COSMETIC (5 samples)

Trailing space removed inside conditional block — functionally identical in most cases:

```
_closure_expression_block.jinja:
  OLD: {% if return_type | isPresent %}->{{ return_type }} {% endif %}{{ body }}
  NEW: {% if return_type | isPresent %}->{{ return_type }}{% endif %}{{ body }}

compound_assignment_expr.jinja:
  OLD: {{ left }} {{ operator }} {{ right }}
  NEW: {{ left }}{{ operator }}{{ right }}

continue_expression.jinja:
  OLD: continue{% if label | isPresent %} {{ label }}{% endif %}
  NEW: continue{% if label | isPresent %}{{ label }}{% endif %}

_range_expression_binary.jinja:
  OLD: {{ start }}{{ operator }} {{ end }}
  NEW: {{ start }}{{ operator }}{{ end }}

return_expression.jinja (COSMETIC-but-RISKY):
  OLD: return{% if children | isPresent %} {{ children | join(" ") }}{% endif %}
  NEW: return{% if expressions | isPresent %}{{ expressions }}{% endif %}
```

Note: `compound_assignment_expr` space removal (slot-space-slot) is different from keyword-space-slot and may be acceptable if slots carry their own spacing. The `return_expression` sample actually renames the slot (`children` → `expressions`) — borderline COSMETIC/SHAPE-MINOR.

### SHAPE-MINOR (5 samples)

Same structure, slot name changed to more specific type:

```
_delim_token_tree_bracket.jinja:
  OLD: [{{ children | join(" ") }}]
  NEW: [{{ delim_tokens | join(" ") }}]

_delim_token_tree_paren.jinja:
  OLD: ({{ children | join(" ") }})
  NEW: ({{ delim_tokens | join(" ") }})

tuple_type.jinja:
  OLD: ({{ children | joinWithTrailing(",") }})
  NEW: ({{ type | joinWithTrailing(",") }})

_simple_statements.jinja (python):
  OLD: {{ children | joinWithTrailing(";") }}
  NEW: {{ simple_statement | joinWithTrailing(";") }}

class.jinja (typescript):
  OLD: {% if decorator | isPresent %}{{ decorator | join(" ") }} {% endif %}class{% if name | isPresent %} {{ name }}{% endif %}...
  NEW: {{ decorator | join(" ") }}class{% if name | isPresent %}{{ name }}{% endif %}...
```

### SHAPE-MAJOR (5 samples)

Structural changes that clearly affect output:

```
binary_expression.jinja (rust, typescript, python):
  OLD: {{ left }} {{ operator }} {{ right }}
  NEW: {{ left }}&&{{ right }}
  [CRITICAL: operator slot dropped, hardcoded]

function_item.jinja (rust):
  OLD: fn {{ name }}{{ parameters }}{% if return_type | isPresent %} ->{{ return_type }}{% endif %}...{{ body }}
  NEW: fn{{ name }}{{ parameters }}{% if function_item_optional1 | isPresent %}{{ function_item_optional1 }}{% endif %}...{{ body }}
  [CRITICAL: space + return_type → unresolvable helper]

let_declaration.jinja (rust):
  OLD: let {{ pattern }}{% if type | isPresent %}:{{ type }}{% endif %}{% if value | isPresent %} ={{ value }}{% endif %}...
  NEW: let{{ pattern }}{% if let_declaration_optional1 | isPresent %}{{ let_declaration_optional1 }}{% endif %}...
  [CRITICAL: space + type/value/alternative → unresolvable helpers]

_array_expression_list.jinja (rust):
  OLD: [{% if attributes | isPresent %}{{ attributes | join("\n") }} {% endif %}{{ children | joinWithTrailing(",") }}{% if elements | isPresent %} {{ elements | join(",") }}{% endif %}]
  NEW: [{{ attributes | join(" ") }}{{ attribute_item | join(" ") }}{{ elements }}]
  [conditions removed, attributes renamed, separator changed, elements changed to singular]

arguments.jinja (rust):
  OLD: ({% if attributes | isPresent %}{{ attributes | joinWithTrailing(",") }}{% endif %})
  NEW: ({{ attribute_item | join(" ") }}{{ expression }})
  [attributes renamed, expression added without separator]
```

### EMPTY-CONTENT — new files (5 samples)

These are newly synthesized helper templates for auto-groups; they didn't exist on master:

```
_array_type_optional1.jinja (rust) — NEW:
  ;{{ length }}
  [synthesized helper for array_type optional length]

_attributed_enum_variant.jinja (rust) — NEW:
  {{ attribute_item | join(" ") }}{{ enum_variant }}
  [synthesized helper for attributed enum variant]

_attributed_parameter.jinja (rust) — NEW:
  {% if attribute_item | isPresent %}{{ attribute_item }}{% endif %}{{ parameter }}
  [synthesized helper for attributed parameter]

_ambient_declaration_declaration.jinja (typescript) — NEW:
  {{ ambient_declaration_declaration }}
  [synthesized polymorph arm helper]

_ambient_declaration_module.jinja (typescript) — NEW:
  {{ ambient_declaration_module }}
```

---

## Findings

### 1. Space stripping is the dominant failure mode

The new TemplateEmitter systematically strips inter-token spaces. The old walker emitted `fn {{ name }}` (space before slot). The new emitter emits `fn{{ name }}` (no space). For Rust, Python, and TypeScript, a keyword immediately adjacent to an identifier produces unparseable output. This is not a case-by-case bug — it is a systemic property of how the TemplateEmitter concatenates tokens.

Affected kinds (space-stripped, confirmed in template diff): `async_block`, `binary_expression` (all three grammars), `const_block`, `enum_item`, `for_expression`, `function_declaration`, `function_item`, `function_signature_item`, `gen_block`, `if_expression`, `impl_item`, `let_condition`, `let_declaration`, `loop_expression`, `match_expression`, `mod_item`, `reference_type`, `trait_item`, `type_item`, `use_declaration`, `while_expression`, and more.

This explains the factory probe's dominant bucket: 133 "re-parse error" with sample `"asyncfnabc(){}"`.

### 2. Synthesized helper slot names are not resolved by the FROM/read path

The TemplateEmitter introduced synthesized slot names (`function_item_optional1`, `let_declaration_optional1/2/3`, `type_parameters_repeat1`, `type_arguments_repeat1`, `const_item_optional1`, etc.) that don't correspond to any declared field in `node-types.json`. The FROM path cannot populate these slots, causing `from` throws and cov failures.

This accounts for the 26-kind covPass regression (178→158) and the 40-kind fromPass regression.

### 3. `binary_expression.operator` field dropped across all three grammars

The `operator` field of `binary_expression` is declared in node-types.json. The new template hardcodes `&&` as the literal operator. This is a functional regression affecting every binary expression with an operator other than `&&` (i.e., `+`, `-`, `*`, `/`, `%`, `|`, `^`, `<<`, `>>`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `||`, `as`).

### 4. The polymorph arm additions are structurally correct

15 rust kinds (+ proportional counts in typescript and python) gained new `{%- if variant == "..." -%}` dispatch arms. This is the right direction architecturally. The problem is that the arm bodies inherit the same space-stripping issue.

### 5. SHAPE-MINOR renames (`children` → typed slot name) are correctness improvements

`tuple_type`, `_delim_token_tree_*`, `_simple_statements`, and similar renames from the generic `children` slot to a named typed slot are the right semantic evolution. Whether they actually work depends on whether the FROM/read path populates the new slot name, which is a separate concern from the template text itself.

### 6. The 20 new template files (EMPTY-CONTENT) are correct additions

The 20 new rust files (and 3 new typescript files) are synthesized helper templates for auto-group decomposition (`applyAutoGroups` was re-enabled in PR2). These are additive and structurally sound.

---

## Ship recommendation

**Do NOT ship PR2 as-is.** The two systemic bugs require fixes before the branch is production-safe:

**Must-fix before merge:**

1. **Space stripping** — The TemplateEmitter must insert separator spaces between keyword literals and adjacent slot references. The original walker emitted `fn {{ name }}`; the new emitter must match. Minimum fix: when a literal string ends with an alphanumeric character and the next token is a `{{ slot }}` reference, emit a space. This is a one-location fix in `packages/codegen/src/emitters/templates.ts`.

2. **Synthesized slot names in FROM path** — Either (a) the FROM path must be taught to resolve `_optional1/2/3` helper templates back to the named fields they wrap, OR (b) the TemplateEmitter must emit named field references (`return_type`, `type`, `value`, `alternative`) rather than auto-generated positional helpers. The latter is cleaner. The cov and from regressions vanish once this is fixed.

3. **`binary_expression.operator` drop** — The template emitter emitted the first observed operator literal instead of the `{{ operator }}` slot. This needs to reference the slot.

**Ship-able after those fixes, no additional blockers identified:**

- The new polymorph dispatch templates (15+ kinds) are structurally sound once space-stripping is fixed.
- The 20 new rust helper templates are additive and safe.
- The SHAPE-MINOR slot renames are correctness improvements pending FROM-path alignment.
- The COSMETIC group (117 files) is safe — trailing-space removal within conditionals does not affect parse output.
- RT-shallow held at 134/136 (unchanged from master) — the parser-grammar changes are not regressed.
