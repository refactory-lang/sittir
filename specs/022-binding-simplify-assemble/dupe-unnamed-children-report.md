# Dupe Unnamed Children Report

**Generated**: 2026-05-03 during Phase 1d.v
**Source**: `DEBUG_DUPE_UNNAMED=1` instrumentation in `buildSlotsRecord`
  (added/removed in this session — not committed)
**Purpose**: Inventory of every kind across rust/typescript/python where
  `AssembledBranch.slots` would have a key collision under the strict
  FR-T05 design (at most one unnamed positional slot per branch, remap
  inferred slots to `'child'` / `'children'` Record keys).

**Total: 14 kinds** with > 1 unnamed positional slot.

---

## Rust (6 kinds)

| Kind | # slots | Slot names | Pattern |
|---|---|---|---|
| `block` | 2 | `statement`, `expression` | Choice-of-kinds (collapsible) |
| `function_type` | 2 | `function_type_trait_form`, `function_type_fn_form` | Polymorph form siblings |
| `generic_pattern` | 2 | `identifier`, `scoped_identifier` | Choice-of-kinds (collapsible) |
| `last_match_arm` | 2 | `attribute_item`, `inner_attribute_item` | Choice-of-kinds (collapsible) |
| `reference_expression` | **3** | `reference_expression_raw_const`, `reference_expression_raw_mut`, `mutable_specifier` | Polymorph form siblings + modifier mix |
| `struct_pattern` | 2 | `field_pattern`, `remaining_field_pattern` | Choice-of-kinds (collapsible) |

## TypeScript (6 kinds)

| Kind | # slots | Slot names | Pattern |
|---|---|---|---|
| `_export_statement_type_export` | 2 | `export_clause`, `semicolon` | Modifier accumulation (override target) |
| `export_statement_type_export` | 2 | `export_clause`, `semicolon` | Modifier accumulation (override target) |
| `for_in_statement` | **3** | `for_header_lhs`, `for_header_var_kind`, `for_header_let_const_kind` | Polymorph form siblings |
| `optional_parameter` | 2 | `accessibility_modifier`, `override_modifier` | Modifier accumulation (override target) |
| `public_field_definition` | **6** ⚠ | `public_field_definition_declare_first`, `public_field_definition_access_first`, `public_field_definition_static_mods`, `public_field_definition_abstract_first`, `public_field_definition_readonly_first`, `public_field_definition_accessor_opt` | Polymorph form siblings (worst offender) |
| `required_parameter` | 2 | `accessibility_modifier`, `override_modifier` | Modifier accumulation (override target) |

## Python (2 kinds)

| Kind | # slots | Slot names | Pattern |
|---|---|---|---|
| `complex_pattern` | 2 | `integer`, `float` | Choice-of-kinds (collapsible) |
| `typed_parameter` | **3** | `identifier`, `list_splat_pattern`, `dictionary_splat_pattern` | Choice-of-kinds (collapsible) |

---

## Patterns

Three distinct shapes emerge:

### 1. Polymorph form siblings (~3-4 kinds)

Kinds whose unnamed slots are different *form variants* of the same parent
kind, named via the polymorph synthesis machinery (`*_form` suffix or
`*_first` / `*_opt` for tagged forms).

Examples: rust `function_type` (`*_trait_form`, `*_fn_form`),
ts `public_field_definition` (6 form-variant slots), ts `for_in_statement`
(3 for-header variants).

**Resolution path**: these slots came from `AssembledGroup` form synthesis
that lifted variant alternatives into separate slot positions. The
locked design absorbs `AssembledGroup` into `AssembledPolymorph.forms[]`
(spec 022 Phase 4 / FR-T03) — once that lands, these polymorph form
slots no longer appear as separate AssembledBranch slots.

### 2. Modifier accumulation (~5 kinds)

Slots that accumulate distinct modifier kinds in declaration order, where
the grammar legitimately allows a sequence of distinct optional markers.

Examples: ts `optional_parameter` / `required_parameter`
(`accessibility_modifier` + `override_modifier`), ts export-statement
(`export_clause` + `semicolon`).

**Resolution path**: these need explicit grammar field names assigned
via overrides ("Owner A" migration). Each modifier position becomes
`field('xxx_modifier', ...)`. After overrides, every slot has a real
grammar field name and the strict FR-T05 invariant holds.

### 3. Choice-of-kinds (~5 kinds)

A single positional slot accepting different kinds at the same position
in the rule. The dupe arises because `deriveChildren` produces one
AssembledChild per distinct kind name rather than collapsing them.

Examples: rust `block` (`statement` OR `expression` at any position),
rust `generic_pattern` (`identifier` OR `scoped_identifier`),
py `complex_pattern` (`integer` OR `float`),
py `typed_parameter` (`identifier` OR `list_splat_pattern` OR
`dictionary_splat_pattern`).

**Resolution path**: this is a derivation refinement, NOT a grammar
override change. `deriveChildren` (now `_deriveChildrenInternal`) should
recognize that multiple kind targets at the same positional slot
represent a single multi-kinded slot — collapse them into ONE
AssembledChild whose `values: NodeOrTerminal[]` contains entries for
each kind. Result: one slot, multi-kind, no dupe.

This refinement could land **without** any grammar override migration —
it's purely an internal derivation change. After landing it, the
choice-of-kinds bucket disappears entirely from this report and the
modifier-accumulation cases (5 kinds) become the only remaining work
for the strict FR-T05 enforcement.

---

## Implications for Phase 1d.v strict enforcement

Strict FR-T05 (collision throw, >1-unnamed throw, key remap to
`'child'` / `'children'`) is currently disabled in `buildSlotsRecord`
because it would break all 14 kinds at codegen time.

Path to enable:

1. **Land choice-of-kinds collapse in derivation** — a focused refactor
   of `_deriveChildrenInternal` / `collectChildFromMember` that
   recognizes multi-kind references at the same position. Eliminates
   ~5 kinds from this list with no grammar override changes.
2. **Land grammar overrides for modifier-accumulation kinds** — ~5 kinds
   each get a few `field()` overrides. Mechanical, per-kind work.
3. **Wait on or coordinate with Phase 4 polymorph rework** — the ~4
   polymorph-form-sibling kinds resolve when Phase 4 absorbs
   `AssembledGroup` into `AssembledPolymorph.forms[]`. Until then,
   these kinds may need temporary overrides too.
4. **THEN flip on strict enforcement** in `buildSlotsRecord`.
