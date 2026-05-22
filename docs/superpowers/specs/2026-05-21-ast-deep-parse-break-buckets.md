# AST deep-parse break buckets — diagnosis (C+D regression triage)

- Date: 2026-05-21
- Branch: `025-pr2-canonicalize-template-emitter`
- HEAD: `06e326d2` · pre-C+D baseline: `343c06d6` · C+D landing: `49299942`
- Method: read-only. Compared committed artifacts (`git show <rev>:…`) for the
  jinja templates, `node-model.json5`, and the **rust crate** render layer
  (`rust/crates/sittir-<g>/src/render/transport.rs` + `bridge.rs` + `templates/`),
  cross-checked against `dump-ast-mismatches --verbose` rendered output on HEAD.
  No code changed, no regen.

## Headline

The rust −4 / python −2 AST-match regression from C+D is caused by **ONE
bucket**: `template/transport-slot name mismatch` produced by the new
`collectSlots`. C+D renamed merged-choice slots (and split/relabeled a few
others), so the per-slot transport field changed name — but the **template
variable names were NOT updated to agree**. The render-time slot binding
(`bridge.rs`) then resolves the template var against a slot that no longer
exists (or against the raw children list), so the slot renders **empty or
partial** and the reparsed child array is short. This is observable as
"`childCount N ≠ M`, rendered has fewer children".

The dominant new signature is the rename of merged-choice slots to **`_content`**:
HEAD adds 20 (rust) / 17 (python) / 27 (ts) `js_name = "_content"` transport
fields that did not exist at baseline, while the corresponding `.jinja`
templates still reference the pre-C+D value-level names
(`shorthand_field_initializer`, `closure_expression`, `type_binding`,
`expression`, `pair`, …).

**The slot-NAME theory was only half-right and that is why the reverted fix
(`3a8538ff`) failed.** `3a8538ff` renamed the *slot* to the first-ref name
(`_pattern`→`pattern`, `_expression`→`expression`). But the templates emit
*value-level* names buried inside the choice (`closure_expression`,
`type_binding`, `shorthand_field_initializer`) — not the first-ref name — so
renaming the slot to `pattern`/`expression` still did not agree with the
template, and rust even went 76→75 (it perturbed separator metadata without
closing the real gap). The real fix must make the **template emitter and the
slot model agree on the SAME name**, and must emit the merged choice as a
single list over the whole `_content` slot (not a single value-name).

## Summary table (HEAD numbers: rust 76, python 43, ts 41)

| Bucket | C+D-new? | rust | python | ts | Example kinds |
|---|---|---|---|---|---|
| **B1 template↔slot name mismatch (`_content` rename)** | **YES — the regression** | ✓ | ✓ | (net +) | rust `field_initializer_list`, `struct_pattern`, `tuple_pattern`, `type_arguments`; python `argument_list`, `dictionary`, `parenthesized_expression` |
| **B2 merged-choice slot split (`arguments`)** | YES | ✓ | — | — | rust `arguments` (two slots both bound to `children`) |
| **B3 operator-enum (D) left-operand / separator loss** | partial | — | — | pre-existing | ts `union_type`, `intersection_type` (`string \| number` → `\|number`) |
| **B4 statement terminator `;` loss** | pre-existing | — | — | pre-existing | ts `import_alias`, `variable_declaration` (drops trailing `;`) |
| **B5 pre-existing array-collapse (single-scalar slot binding)** | NO | ✓ | ✓ | ✓ | rust `tuple_type`; python `tuple`, `list`; ts `array` |
| **B6 polymorph dispatch / `<none>` first-child** | NO | ✓ | ✓ | ✓ | rust `token_tree`, `struct_item`, `range_expression`; ts `public_field_definition` |
| **B7 parameters / call arguments empty-parens** | mixed | ✓ | ✓ | — | rust `parameters` (`(parameter)`→`()`), `arguments` |

Coarse landscape of the full deep-fail set (deep-only failures = pass shallow,
fail deep): rust 64, python ~13 mismatches + 65 read-errors, ts 33 mismatches +
27 read-errors. The vast majority share the single shape "rendered array is
shorter than input array" — i.e. a slot under-populates at render time.

---

## B1 — template↔slot name mismatch (`_content` rename) — THE C+D REGRESSION

`collectSlots` names a merged/unnamed choice slot `content` (transport field
`_content`, js_name `_content`). The template emitter still emits the OLD
value-level variable. Because the names disagree, `bridge.rs` cannot bind the
template var to the populated slot, so it renders empty/partial.

### Evidence — rendered output before/after (HEAD `dump-ast-mismatches --verbose`)

```
field_initializer_list   INPUT:  SomeStruct { field1, field2: expression, field3, }
                         RENDERED: SomeStruct {  field1, field3 }     # drops field_initializer
struct_expression        INPUT:  User{name, ..current_user()}
                         RENDERED: User {  name }                     # drops base_field_initializer
tuple_pattern            INPUT:  ("Bacon", b)
                         RENDERED: ("Bacon")                          # drops identifier b
type_arguments           INPUT:  E<F, str>
                         RENDERED: E <F >                             # drops str
python argument_list     INPUT:  (r1, r2, r3)
                         RENDERED: ()                                 # drops ALL args
python argument_list     INPUT:  ("…", {dict}, safe_dict)
                         RENDERED: (safe_dict)                        # keeps only last
python dictionary/paren  INPUT:  (y := f(x))
                         RENDERED: ()                                 # drops named expr
```

### Evidence — the name disagreement (artifact diff)

`rust/crates/sittir-rust/src/render/transport.rs` slot field renamed; the
matching `rust/crates/sittir-rust/templates/<kind>.jinja` still uses the old name:

| Kind | transport slot BASE → HEAD | HEAD `.jinja` var | Agree? |
|---|---|---|---|
| `field_initializer_list` | `_shorthand_field_initializer` → `_content` | `shorthand_field_initializer` | NO |
| `struct_pattern` | `_field_pattern` → `_content` | `field_pattern` | NO |
| `tuple_pattern` | `_pattern` → `_content` | `closure_expression` | NO (and never matched the value) |
| `type_arguments` | `_type` (Vec) → `_content` (Option<Vec>) | `type_binding`, `trait_bounds` | NO |
| py `argument_list` | `_expression` → `_content` | `expression` | NO |
| py `dictionary` | `_pair` → `_content` | `pair` | NO |
| py `parenthesized_expression` | `_expression` → `_content` | `expression` | NO |

The rename is the C+D fingerprint: HEAD adds **20 rust / 17 python / 27 ts**
`js_name = "_content"` transport fields absent at baseline (`git diff 343c06d6 HEAD
-- rust/crates/sittir-<g>/src/render/transport.rs | grep -c '_content'`).

Full rust set of structs whose slot signature changed (24): `Arguments`,
`AttributedParameter`, `AttributedTypeParameter`, `BinaryExpression`,
`BracketedType`, `ClosureParameters`, `Comment`, `ElseClause`,
`FieldInitializerList`, `GenericPattern`, `LastMatchArm`, `LetChain`,
`NonSpecialToken`, `OrderedFieldDeclarationList`, `ReferenceExpression`,
`StringLiteral`, `StructPattern`, `TraitBounds`, `TuplePattern`,
`TypeArgumentsRepeat1`, `TypeArguments`, `TypeParametersRepeat1`, `UseBounds`,
`VisibilityModifierPubParens`. Most are `_<value>` → `_content`.

### Fix direction (B1)

Make the template emitter and `collectSlots` agree on the slot name AND emit the
merged choice as a single list over the whole slot. Two viable shapes:

1. Template emitter reads the slot's canonical name (`content`) from the slot
   model and emits `{{ content | join(...) }}` — i.e. stop emitting value-level
   names. (`packages/codegen/src/emitters/templates.ts`, slot-name selection;
   `emitListSlot`/`emitScalarSlot` ~line 1157.)
2. OR keep value-level names but have `collectSlots` keep the original
   first-ref-derived slot name AND have the template iterate the full
   heterogeneous member set, not one branch. (`packages/codegen/src/compiler/collect-slots.ts`,
   `buildSlot` choice-naming; `node-map.ts` consumes it.)

The reverted `3a8538ff` tried (2)-lite (rename slot to first-ref) but the
template still emitted a *different* value-name, so it could not bind. The fix
must close the loop end-to-end: same name on both sides + list-over-whole-slot.

---

## B2 — merged-choice slot SPLIT (`arguments`)

C+D split rust `arguments` from one slot (`_attributes` carrying both
`attribute_item` and `_expression`) into two slots (`_attribute_item`,
`_expression`). The template was updated to `({{ attribute_item | join(" ") }} {{
expression | join(" ") }})`, but `bridge.rs` binds **both** template vars to the
same raw `children` slot:

```rust
// rust/crates/sittir-rust/src/render/bridge.rs (HEAD, ArgumentsTemplate)
attribute_item: ListNonterminalView { items: children_renderables … },
expression:     ListNonterminalView { items: children_renderables … },  // SAME children
```

Result: `Duration::from_millis(0)` → `Duration::from_millis ( )` and `(0)` → `( )`
— the `integer_literal` does not land in the `children` slot the template reads,
so it renders nothing.

Fix direction: the bridge/template binding for `arguments` must bind `expression`
to the `_expression` slot (and `attribute_item` to `_attribute_item`), or the
two split slots must collapse back to one list slot that the template joins.

---

## B3 — operator-enum (D) left-operand / separator loss (NOT the regression)

Commit `49299942` chunk D made link-symbols carrying a `fieldName` render as a
slot (`{{ operator }}`) so the parsed operator is substituted
(`packages/codegen/src/emitters/templates.ts` `emitSymbol` ~line 1157). For
`union_type`/`intersection_type` the operator binds but the LEFT operand drops:

```
ts union_type   INPUT:  string | number
                RENDERED: |number          # drops left predefined_type
```

`union_type.jinja` and `UnionTypeTransport` are **byte-identical** baseline→HEAD,
so this specific failure is **pre-existing**, not C+D. (D's net effect on ts was
+3.) Listed for completeness; deprioritize relative to B1/B2.

---

## B4 — statement terminator `;` loss (pre-existing)

```
ts import_alias        INPUT:  import r = X.N;
                       RENDERED: import r=X.N        # drops ';'
ts variable_declaration INPUT: var x;
                       RENDERED: var x               # drops ';'
```

`import_statement.jinja` is identical baseline→HEAD → pre-existing. Trailing
statement terminator not emitted by the template.

---

## B5 — pre-existing array-collapse (single-scalar slot binding) — NOT C+D

These look identical to B1 in the rendered output but the **artifact is
unchanged** baseline→HEAD, proving they pre-date C+D:

- rust `tuple_type`: INPUT `(i32, String)` → `(String)`. The entire chain —
  `node-model.json5` entry (lines base 16004–16035 == head 16214–16245),
  `tuple_type.jinja` (`({{ type_ | joinWithTrailing(",") }})`),
  `TupleTypeTransport` (`type_: Vec<_TypeTransport>`), `_TypeTransport`,
  and `read_node.rs` — is byte-identical. The `type` slot under-populates at read
  time (only the last `_type` member survives) regardless of C+D.
- python `tuple`/`list`: `(0,1,2)` → `()`, `[match]` → `[]`. `TupleTransport`
  (`_collection_elements: Option<Box<AnyTransport>>`) and the `TupleTemplate`
  binding in `bridge.rs` are identical baseline→HEAD; `collection_elements` is
  bound as a single scalar (`OptionalNonterminalView`), never a list-join.

The C+D premise listed rust `tuple_type` and python `dictionary` as regressors;
artifact comparison **clears `tuple_type`** (pre-existing B5) and **confirms
`dictionary`** (B1 `_content` rename). Treat `tuple_type`/`tuple`/`list` as a
separate, older read-side array-collapse defect.

Fix direction (separate from the C+D fix): the reader must collect ALL members
of a hidden-alias array slot, and the bridge must bind these as a list, not a
single `as_scalar()`.

---

## B6 — polymorph dispatch `<none>` first child (pre-existing)

Warnings during native read: `[nodeToConfig] polymorph '<kind>' … no variant
matched first child kind '<none>'` for rust `token_tree`, `function_type`,
`struct_item`, `reference_expression`, `range_expression`, `macro_definition`,
`token_tree_pattern`; ts `public_field_definition`. Pre-existing; tracked
elsewhere (see memory `project_polymorph_dispatcher_slot_probe`). Not C+D.

---

## B7 — parameters / call-argument empty parens

Largest rust cluster: `parameters: childCount 3 ≠ 2 ["(",parameter,")"] vs
["(",")"]` (12), `…arguments: 3 ≠ 2` (10+9). These are the same under-population
shape as B1/B2. `arguments` is the B2 split; `parameters` resolution should be
audited the same way (does the `parameter`/`self_parameter` child land in the
slot the template reads). Likely shares the B1/B2 root once those are fixed.

---

## C+D regression set — ranked by confidence

1. **(highest) `_content` rename, template not updated — B1.** Rust
   `field_initializer_list`, `struct_pattern`, `tuple_pattern`, `type_arguments`;
   python `argument_list`, `dictionary`, `parenthesized_expression`. Direct
   transport-field rename + unchanged template var = guaranteed empty/partial
   render. This bucket accounts for the rust −4 and python −2.
2. **(high) `arguments` split — B2.** Bridge binds both new vars to raw
   `children`; rendered `( )`. Distinct from B1 but same C+D `collectSlots`
   origin.
3. **(low/clearing) `tuple_type` — NOT C+D (B5).** Artifact byte-identical;
   pre-existing read-side array-collapse. Remove from the C+D set.

## Recommended fix order

1. **B1 first** (closes the rust −4 / python −2): in
   `packages/codegen/src/emitters/templates.ts`, make the rendered variable name
   equal the slot's canonical name from the slot model (or have `collectSlots` in
   `packages/codegen/src/compiler/collect-slots.ts` keep a name the template can
   address), and emit the merged choice as ONE list over the whole `_content`
   slot. Verify template var == transport `js_name` for every changed kind. Do
   NOT just rename the slot (that was `3a8538ff` and it failed).
2. **B2** (`arguments`): fix the `bridge.rs`/template binding so each split slot
   binds to its own resolve target, or recombine into one list slot.
3. **B7** (`parameters`/call args): re-audit after B1/B2 — likely subsumed.
4. **B5/B6** are pre-existing; schedule separately, not on the C+D-recovery
   critical path.

## Saved artifact

This document: `docs/superpowers/specs/2026-05-21-ast-deep-parse-break-buckets.md`
