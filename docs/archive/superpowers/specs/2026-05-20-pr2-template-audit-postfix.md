# PR2 post-fix template byte-equivalence audit

**Audit date:** 2026-05-20
**Branch:** `025-pr2-canonicalize-template-emitter`
**HEAD:** `6fa1f71a` (regen after Bug 1+2+3 fixes)
**vs master** (`178/184` rust, `177/182` ts, `105/108` python)

---

## Headline numbers

| Metric | Pre-fix | Post-fix | Delta |
|--------|---------|----------|-------|
| Templates changed (total incl. mirrors) | 920 | 766 | -154 restored |
| Templates changed (unique, packages/ only) | 460 | 383 | -77 restored |
| rust covPass | 158/184 | **176/184** | +18 (gap: was -20, now -2) |
| typescript covPass | 170/182 | **172/182** | +2 (gap: was -7, now -5) |
| python covPass | 100/108 | **103/108** | +3 (gap: was -6, now -3) |

> Note: the pre-fix audit recorded typescript covPass as 170/182 and python as 100/108. Those numbers differ slightly from the task description's pre-fix numbers; this audit uses the validation-history record as ground truth.

Master baseline reference (from `validation-history.jsonl`, last pre-PR2 entry 2026-05-19):
- rust: `178/184`, typescript: `177/182`, python: `105/108`

---

## Template restoration breakdown (post-fix vs. pre-fix)

Mirrors (`rust/crates/sittir-*/templates/`) are byte-for-byte copies of their `packages/*/templates/` counterparts and carry no additional signal. All classification below refers to unique files (`packages/*/templates/`).

| Grammar | Pre-fix unique | Post-fix unique | Restored |
|---------|--------------|-----------------|---------|
| rust | 185 | 162 | **23** |
| typescript | 179 | 140 | **39** |
| python | 96 | 81 | **15** |
| **Total unique** | **460** | **383** | **77** |
| Total incl. mirrors | 920 | 766 | **154** |

---

## Classification (post-fix, unique templates only)

Categories use the same methodology as the pre-fix audit. COSMETIC = whitespace-only; SHAPE-MINOR = same structure, slot name changed; SHAPE-MAJOR = different structural shape; EMPTY-CONTENT = new file.

| Grammar | Total | COSMETIC | SHAPE-MINOR | SHAPE-MAJOR | EMPTY-CONTENT (new) |
|---------|-------|----------|-------------|-------------|---------------------|
| rust packages | 162 | 0 | 41 | 101 | 20 |
| typescript packages | 140 | 0 | 34 | 103 | 3 |
| python packages | 81 | 0 | 31 | 50 | 0 |
| **Total unique** | **383** | **0** | **106** | **254** | **23** |

COSMETIC dropped to zero because the three bug fixes changed content substantially. The 0-COSMETIC result also reflects that the pre-fix "COSMETIC" bucket partly contained space-stripping cases that are now truly fixed and byte-identical with master (classified as RESTORED, not appearing in the post-fix table at all).

---

## Remaining regression candidates

### Rust (covPass gap: -2 kinds from master)

The validator reports 4 `from` failures and multiple `factory-render-parse` failures. The covPass failure list (8 failing kinds, 5 pre-existing + 3 new-from-PR2):

**Pre-existing covPass failures (byte-identical to master or already failing before PR2):**
1. `generic_type` — field `turbofish` not referenced; template unchanged
2. `line_comment_doc` — field `inner` not referenced; template unchanged
3. `type_item` — fields `where_clause1`, `where_clause2` not referenced; template unchanged
4. `match_arm` — field `value` not referenced in master template (master bug, PR2 preserved it via variant dispatch that also omits `value`)
5. `ordered_field_declaration_list` — field `attributes` not in master template (pre-existing)

**New covPass failures introduced by PR2 (template changed, field was present on master):**
1. `arguments` — master referenced `attributes | joinWithTrailing(",")`. PR2 template: `({{ attribute_item | join(" ") }} {{ expression }})` drops `attributes` entirely and introduces `expression` as unconditional singular slot. Validator: `singular slot "expression" on "arguments" requires one value; got undefined`.
2. `attribute` — master referenced `arguments` conditionally. PR2 template: `{{ path }}={{ value }}` drops `arguments` entirely and makes `value` unconditional. Validator causes field coverage failure.
3. `block_comment` — master referenced `inner` conditionally. PR2 template: `/*{{ outer }}{% if doc | isPresent %} {{ doc }}{% endif %}*/` drops `inner`.

**Additional STILL-REGRESSING kinds (not caught by covPass but confirmed via factory/rt failures):**

`let_declaration` — Bug 1 was not fully fixed. Master template: `let{% if mutable_specifier | isPresent %} {{ mutable_specifier }}{% endif %} {{ pattern }}` (unconditional space before `{{ pattern }}`). PR2 template: `let{% if mutable_specifier | isPresent %} {{ mutable_specifier }} {% endif %}{{ pattern }}` (space moved inside the conditional block). When `mutable_specifier` is absent, renders `let{{ pattern }}` → `"letx;"`. Validator: `factory-render-parse: "Async function (let_declaration)" — kind not found in re-parse (rendered: "letx;")`.

`async_block` / `gen_block` — Bug 1 not fully fixed. When `move_marker` absent, renders `async{{ block }}` (no space). Validator: `factory-render-parse: "Async Block (async_block)" — re-parse error: "async"`.

`function_item` / `function_signature_item` — Space after `visibility_modifier` removed when present:
```
master: {% if visibility_modifier | isPresent %}{{ visibility_modifier }} {% endif %}
HEAD:   {% if visibility_modifier | isPresent %}{{ visibility_modifier }}{% endif %}
```
Renders `pub fn` as `pubfn`. Also `return_type` spacing: master ` ->{{ return_type }}` → HEAD `->{{ return_type }}`.

`type_arguments` — PR2 template: `<{{ type_binding }}{% if trait_bounds | isPresent %} {{ trait_bounds }}{% endif %}>`. Validator: `singular slot "type" on "type_arguments" received 2 values`. The slot was changed from `children | joinWithTrailing(",")` (array OK) to `type_binding` (singular); when multiple type arguments are present, from-path fails.

`reference_expression` — PR2 introduced polymorph variants `[reference_expression_raw_const, reference_expression_raw_mut]`. From-path throws: `singular slot "reference_expression_raw_const" on "reference_expression" requires one value; got undefined`. This is a new-from-PR2 failure (pre-fix audit's Tier 3 "slot renamed" case).

Loop/label kinds — `loop_expression`, `while_expression`, `for_expression`: label-colon spacing changed from `{{ label }}: ` (with trailing space before keyword) to `{{ label }}:` (no space). Renders `label:loop BODY` instead of `label: loop BODY`. Only triggers when a label is present.

---

### TypeScript (covPass gap: -5 kinds from master)

**From-failures (STILL REGRESSING):**

1. `object_type` — master: `{{ opening }}{% if members | isPresent %}{{ members | join(",") }}{% endif %} {{ closing }}`. PR2: `{{ opening }},{{ export_statement }},{{ closing }}`. Drops `members`, introduces `export_statement` unconditional. Validator: `repeated slot "export_statement" requires at least one value`.

2. `required_parameter` — PR2: `{{ decorator | join(" ") }}...={{ value }}`. Makes `value` unconditional (removes `{% if value | isPresent %}`). Validator: `singular slot "value" on "required_parameter" requires one value; got undefined`.

3. `public_field_definition` — PR2: `...{{ public_field_definition_declare_first }} {{ public_field_definition_static_mods }}...={{ value }}`. Makes `value` unconditional; introduces synthesized slot names. Same pattern.

4. `optional_parameter` — same as `required_parameter`: `value` made unconditional.

5. `rest_pattern` — master: `...{{ children | join(" ") }}`. PR2: `...{{ lhs_expression }}`. Slot renamed. Validator: `singular slot "lhs_expression" on "rest_pattern" requires one value; got undefined`.

**Additional structural regressions:**

`call_expression` — moved to pure polymorph dispatch. The top-level template delegates to variant arms (`call_expression_call`, `call_expression_member`, etc.). The declared fields `arguments`, `function`, `type_arguments` are not referenced in the dispatch template. This causes covPass failure for 3 fields (pre-existing issue that persists).

`import_alias` — master: `import {{ name }}={{ children | join(" ") }}{{ value }} {{ semicolon }}`. PR2: `import {{ name }}={{ value }} {{ semicolon }}`. Drops `children`. Validator AST mismatch: `childCount 5 ≠ 4`.

---

### Python (covPass gap: -2 kinds from master)

**From-failures (mix of pre-existing and new):**

1. `comparison_operator` — master: `{{ left }} {{ operators | join(" ") }}{% if children | isPresent %} {{ children | join(" ") }}{% endif %}`. PR2: `{{ left }} {{ operators }} {{ primary_expression }}`. Changes `operators` from array (`join`) to singular + introduces `primary_expression` unconditional. Validator: `singular slot "operators" on "comparison_operator" received 5 values`. This is a field-arity regression.

2. `pattern_list` — master: `{{ children | joinWithTrailing(",") }},`. PR2: `{{ pattern }},`. Changes from array `children` to singular `pattern`. Validator: `singular slot "pattern" on "pattern_list" received 2 values`.

3. `expression_list` — same as `pattern_list`: `children | joinWithTrailing(",")` → `expression` singular. Validator: `singular slot "expression" on "expression_list" received 2 values`.

4. `yield` — master: `yield from {{ children | join(" ") }}`. PR2: `yield from {{ expression }}`. Changes from array `children` to singular `expression`. Validator: `singular slot "expression" on "yield" requires one value; got undefined`.

5. `list_splat` — template BYTE-IDENTICAL to master (`*{{ expression }}`). Failure is pre-existing (unrelated to PR2).

**New covPass failures (exec_statement):**

`exec_statement` — master: `exec {{ code }}{% if in_clause | isPresent %} in{{ in_clause | join(",") }}{% endif %}`. PR2: `exec {{ code }} in {{ expression | join(",") }}`. Drops `in_clause` field reference, hardcodes ` in `. Field `in_clause` is declared in node-types.json → new covPass failure.

---

## Comparison to pre-fix audit

### Tier 1 (semantic loss — 4 confirmed broken kinds pre-fix)

| Kind | Pre-fix status | Post-fix status |
|------|---------------|----------------|
| `binary_expression` (all 3 grammars) | BROKEN: `&&` hardcoded (Bug 3) | **FIXED** — template byte-identical to master |
| `function_item` | BROKEN: `fn{{ name }}` + unresolvable `function_item_optional1` | IMPROVED: `fn {{ name }}` with named fields restored; BUT space before `->` removed and visibility spacing broken |
| `let_declaration` | BROKEN: `let{{ pattern }}` + unresolvable `optional1/2/3` | STILL REGRESSING: `let{{ pattern }}` when mut absent (space only inside conditional block); named fields restored |
| `match_expression` | BROKEN: `match{{ value }}{{ body }}` | **FIXED** — byte-identical to master |
| `trait_item` | BROKEN: `trait{{ name }}` (Bug 1) | IMPROVED: `trait {{ name }}` (keyword-space fixed); visibility_modifier spacing still inverted (space was after, now absent) |
| `type_parameters` | BROKEN: `type_parameters_repeat1` unresolvable | STILL REGRESSING: now `{{ attribute_item | join(" ") }} {{ metavariable }}` — neither attribute_item nor metavariable is the correct field (was `attributes`) |
| `arguments` | BROKEN: renamed to `expression` | STILL REGRESSING: `expression` is unconditional singular but may be absent |
| `ordered_field_declaration_list` | BROKEN: `type` changed to singular | STILL REGRESSING: `type` still singular, `attributes` still missing |
| `type_arguments` | BROKEN: `type_arguments_repeat1` unresolvable | STILL REGRESSING: now `type_binding` singular but field has multiple types |
| `impl_item` | BROKEN: space-stripped + double-nested `negative` | IMPROVED: polymorph arms correct; spacing issues in arms remain (minor) |

### Tier 2 (space-stripping only — 16 rust kinds pre-fix)

| Kind | Pre-fix status | Post-fix status |
|------|---------------|----------------|
| `type_item` | BROKEN: `type{{ name }}` | **FIXED** — byte-identical to master |
| `const_item` | BROKEN: `const{{ name }}` | IMPROVED: `const {{ name }}` keyword space fixed; `= {{ value }}` → `={{ value }}` spacing lost |
| `use_declaration` | BROKEN: space-stripped | **FIXED** — byte-identical to master |
| `abstract_type` | BROKEN: space-stripped | IMPROVED: structurally equivalent (space moved inside block, same output) |
| `if_expression` | BROKEN: space-stripped | **FIXED** — byte-identical to master |
| `mod_item` | BROKEN: space-stripped | IMPROVED: polymorph dispatch added (structurally correct), spacing preserved |
| `loop_expression` | BROKEN: keyword space | STILL REGRESSING: `{{ label }}:loop` (no space after colon when label present) |
| `while_expression` | BROKEN: keyword space | STILL REGRESSING: `{{ label }}:while` |
| `for_expression` | BROKEN: keyword space | STILL REGRESSING: `{{ label }}:for` |
| `extern_crate_declaration` | BROKEN: space-stripped | **FIXED** — byte-identical to master |
| `enum_item` | BROKEN: space-stripped | IMPROVED: main spaces restored; body spacing lost when where_clause present |
| `trait_item` | BROKEN: `trait{{ name }}` | IMPROVED: `trait {{ name }}` fixed; visibility_modifier spacing inverted |
| `function_signature_item` | BROKEN: `fn{{ name }}` | STILL REGRESSING: visibility_modifier space removed when present → `pubfn` |
| `async_block` | BROKEN: `async{{ block }}` | STILL REGRESSING: `async{{ block }}` when move_marker absent |
| `const_block` | BROKEN: space-stripped | **FIXED** — byte-identical to master |
| `gen_block` | BROKEN: `gen{{ block }}` | STILL REGRESSING: `gen{{ block }}` when move_marker absent |

### Tier 3 (slot renamed — 5 rust kinds pre-fix)

| Kind | Pre-fix status | Post-fix status |
|------|---------------|----------------|
| `mut_pattern` | `children | join` → `pattern` | IMPROVED: space added; `pattern` unconditional (minor risk) |
| `tuple_type` | `children` → `type | joinWithTrailing(",")` | IMPROVED: correct rename to typed slot |
| `reference_expression` | `children` → `reference_expression_raw_const` | STILL REGRESSING: polymorph dispatch fails for non-raw references |
| `self_parameter` | `reference` field dropped | IMPROVED: `reference` restored as unconditional (renders empty string when absent) |
| `block_comment` | `inner` field dropped | STILL REGRESSING: `inner` still absent from template |

### Fixed count summary

| Category | Fixed | Improved | Still Regressing | New Regression |
|----------|-------|----------|-----------------|----------------|
| Tier 1 (rust, 10 kinds) | 2 | 4 | 4 | 0 |
| Tier 2 (rust, 16 kinds) | 5 | 5 | 6 | 0 |
| Tier 3 (rust, 5 kinds) | 0 | 3 | 2 | 0 |
| TypeScript regressions | partial | partial | 5 from-failures | 0 |
| Python regressions | partial | partial | 4 from-failures | 0 |

---

## New regressions (kinds passing on master, failing on HEAD, not in pre-fix audit)

The pre-fix audit covered the dominant bugs. No entirely new regression categories were identified post-fix. The remaining failures are all residue of the same three original bugs:

- `attribute` — Bug 2 residue: `arguments` field dropped by TemplateEmitter (was in pre-fix audit's SHAPE-MAJOR list but not in Tier 1/2/3 explicit list)
- `exec_statement` (python) — Bug 1 residue: `in_clause` dropped when optional-block rewritten as unconditional
- `import_alias` (typescript) — Bug 2 residue: `children` (structural) dropped, narrowing child count

These were present in the pre-fix SHAPE-MAJOR set but not explicitly called out in the tier classification because the pre-fix audit focused on the highest-severity rust cases.

---

## Validator snapshot (post-fix HEAD)

```
rust/native:
  fromPass=129    fromTotal=168
  covPass=176    covTotal=184
  read-render-parsePass=101    read-render-parseTotal=136    read-render-parseAstMatchPass=78
  read-render-parse-shallowPass=134    read-render-parse-shallowTotal=136
  factory-render-parsePass=687    factory-render-parseTotal=1455

typescript/native:
  fromPass=94    fromTotal=115
  covPass=172    covTotal=182
  read-render-parsePass=49    read-render-parseTotal=111    read-render-parseAstMatchPass=37
  read-render-parse-shallowPass=84    read-render-parse-shallowTotal=111
  factory-render-parsePass=443    factory-render-parseTotal=706

python/native:
  fromPass=86    fromTotal=118
  covPass=103    covTotal=108
  read-render-parsePass=81    read-render-parseTotal=115    read-render-parseAstMatchPass=59
  read-render-parse-shallowPass=115    read-render-parse-shallowTotal=115
  factory-render-parsePass=309    factory-render-parseTotal=896
```

---

## Ship recommendation

**Do NOT ship PR2 as-is.** A 4th fix pass is required.

### What the 3 fixes accomplished

The 3 committed fixes (Bug 1 space-stripping, Bug 2 synthesized slot names, Bug 3 operator hardcoding) were genuine and effective. They restored 154 files to byte-identity with master, closed the rust covPass gap from 20 to 2 kinds, and eliminated the dominant failure modes (factory-render-parse dropped from 133+62 error buckets to 79 errors; rust RT-deep improved from 97 to 101). Bug 3 (`binary_expression`) is fully resolved across all three grammars.

### What remains broken

The Bug 1 fix (space insertion in `seq`) was applied at the seq-level but missed a class of cases where the space belongs at the conditional boundary rather than within a seq member:

**Pattern A — space belongs AFTER the `{% endif %}` not inside the block:**
```
master: {% if foo | isPresent %}{{ foo }}{% endif %} {{ bar }}  (space unconditional)
HEAD:   {% if foo | isPresent %}{{ foo }} {% endif %}{{ bar }}  (space only when foo present)
```
This affects: `let_declaration` (space before `pattern`), `function_item`/`function_signature_item` (space after `visibility_modifier`), `async_block`/`gen_block` (space before `block`), `loop_expression`/`while_expression`/`for_expression` (space after label colon).

**Pattern B — array→singular slot narrowing (Bug 2 residue):**
The TemplateEmitter still produces singular slot references for fields that have multiple values at runtime. Confirmed for: `arguments.expression`, `type_arguments.type_binding`, `pattern_list.pattern`, `expression_list.expression`, `comparison_operator.operators`, `object_type.export_statement`.

**Pattern C — unconditional rendering of optional slots (Bug 2 residue):**
`required_parameter.value`, `optional_parameter.value`, `public_field_definition.value`, `yield.expression`, `rest_pattern.lhs_expression`, `exec_statement.in_clause` are rendered unconditionally when the field is optional.

### Minimum 4th-fix scope

1. **Conditional boundary spacing** — When a template member is an `optional` field and is the last member in a seq, the trailing space belongs AFTER the `{% endif %}` in the rendered Jinja, not inside the conditional block. Fix scope: `packages/codegen/src/emitters/templates.ts` — approximately 10–15 kinds affected by Pattern A.

2. **Array slot arity** — TemplateEmitter must check whether a slot is declared `multiple: true` in node-types.json and emit `| join(...)` instead of bare `{{ slot }}`. Without this, `type_arguments`, `arguments`, `pattern_list`, `expression_list`, `comparison_operator` all produce singular-slot throws at runtime. Fix scope: `templates.ts` + the arity-derivation path in `render-module.ts`.

3. **Optional slot guards** — TemplateEmitter must emit `{% if slot | isPresent %}{{ slot }}{% endif %}` when the field is `required: false`. Pattern C above. Affects at minimum 6 TS/Python kinds.

Until these three sub-patterns are fixed, the branch will continue to produce invalid rendering output for a significant portion of the corpus.
