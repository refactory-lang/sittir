# Round-trip fidelity restoration — one storage representation per slot value, consumed everywhere

## Invariant

Every validator case round-trips: parse → read → render → reparse is
AST-identical, and every factory-built node's stored values are byte-equal
to the materialized read of its own render. Behind both: **every slot value
has exactly one canonical storage representation, stamped in the compiled
model, and consumed identically by the four layers that touch it** — the
native read (wrap tables), the transport (`FromNapiValue` accepted forms),
the render templates, and the typed factories. A value the model cannot
represent is a compile-time diagnostic (blocking), never a runtime
`expected u16 kind_id...` rejection, a silent `$other` drop, or a
factory/read divergence.

## Why this doesn't hold today

Two mechanisms, both already partially visible in the compiler's own
preflight diagnostics:

1. **Representation drift across the four consuming layers.** The same
   fact — "how is a `mut` marker stored?", "which kind id does an aliased
   node store?", "does this array slot own its trailing separator?" — is
   derived independently per layer. Probe evidence: rust
   `static mut FOO: u32 = 1;` — the wrap emits `_mutable_specifier: "mut"`
   (string), and the transport slot rejects it
   (`StaticItemMutableSpecifierTransportSlot: expected u16 kind_id, string,
   or object with $type`). Python `async def f(): pass` — the model
   *declares* `FunctionDefinition._async_marker?: boolean`, but the native
   raw read never populates it: the `async` token (id 27) lands in the
   unmodeled `$other` bucket at the `raw` stage, so render silently emits
   `def f():pass`. Factory side, the same drift: read stores
   `_newline: 101` (kind id) where factory stores `"\n"`; read stores
   `_self: 134` where factory stores `"self"`.
2. **Structural model gaps the preflight already names but doesn't block
   on.** `seq-with-nested-seq` (error severity, 7 kinds) flags exactly the
   kinds whose separators mis-render — rust `tuple_expression` is flagged,
   and its render emits `(1,2,)` for `(1, 2)` (probe-confirmed: template
   emits the comma unconditionally because the nested `seq(expr, ',')` was
   flattened without separator possession). `parsekind-noninjective` flags
   `scoped_type_identifier` collapsing
   `[generic_type_with_turbofish, generic_type]` — and both the factory
   `$type 245 ≠ 246` case and the rrp `generic_type ≠
   generic_type_with_turbofish` mismatch are that collapse at runtime.
   `union-slot-unaddressable` flags `public_field_definition` — the source
   of 20 of typescript's 36 accessor-throws. The diagnostics are correct
   and ahead of the failures; they're just not wired to the fix loop.

## Current metrics (native backend, master-equivalent run)

| grammar | rrp pass | rrp AST-match | factory pass | factory AST-match | cov | from |
|---|---|---|---|---|---|---|
| rust | 116/136 | 105/136 | 1048/1087 | 1048/1087 | 198/199 | 134/146 |
| typescript | 93/111 | 69/111 | 933/975 | 933/975 | 182/191 | 126/140 |
| python | 101/115 | 83/115 | 810/842 | 810/842 | 127/127 | 107/120 |

Shallow rrp equals deep rrp on all three grammars today — no deep-only
residue class currently exists.

## Source inventory (audited from validation-report.json + probes)

Grounded in `packages/tools/validation-report.json` (556 entries) plus
`probe-kind` stage evidence for the three biggest classes. Report mismatch
entries are attributed at every ancestor kind of a failing corpus entry (a
single rust tuple-trailing-comma bug appears as 8 rows), so raw entry
counts overstate unique bugs roughly 2–3x — the case counts below are
deduplicated validator-case deltas, not raw report rows.

| # | Source (root cause) | Layer | Evidence / members | Case count (rust/ts/python) |
|---|---|---|---|---|
| S1 | **Context-alias storage identity**: factory stamps one of (parse kindId, aliased storage id), read materializes the other; transport accepted-kind sets miss alias ids. The `aliasedFromId ?? kindId` consumption-uniformity gap — the same defect class the kindid-invariant-restoration work fixed for emitters, unfixed on the factory/wrap/transport surface. Upstream flag: `parsekind-noninjective` (10 rows). | factory + transport | rust `token_tree` 241≠168 (`delim_token_tree`, ×13), `scoped_type_identifier` 245≠246; python `block` 135≠160 (`_match_block`, ×17), `lambda_within_for_in_clause`; typescript `decorator_call_expression`/`_type_query_*`/`tuple_parameter` families (×14); rrp: `generic_type_with_turbofish`, `token_tree_paren ≠ delim_token_tree_paren`, `call_expression → call_expression_call` (×3 bugs), transport errors "alias-wrapper kind id 436... no kind-keyed child slot", "unknown kind id 428 in EnumBodyGroup1Content" | factory ~46 (14/14/18) + rrp ~10 |
| S2 | **Marker/modifier slots: population + representation.** (a) native raw read drops optional keyword tokens into `$other` instead of the declared marker slot (probe: python `async`); (b) where populated, the representation (string/bool/kindId) isn't the one transport/factory expect (probe: rust `"mut"` rejected by `FromNapiValue`; factory `_reference: true ≠ undefined`, `_self: "self" ≠ 134`, `_newline: 101 ≠ "\n"`). | read + transport + factory | python `async` (function_definition/with/decorated — `for_statement` works, so the mechanism exists and its coverage is inconsistent), `yield from`, `except*`, f-string `=`; typescript `async`/`readonly` drops, "Missing _static_marker"/"_accessibility_modifier" render errors; rust `mutable_specifier`/`reference`/`self_parameter` (rrp errors ×7 + factory ×12) | rrp ~20 errors+mismatches (10/6/8) + factory ~15 |
| S3 | **Separator structure / trailing-separator possession**: nested `seq(x, sep)` flattened without modeling who owns the separator → template emits it unconditionally (rust tuple adds trailing comma) or drops an authored trailing separator (typescript/rust `type_parameters`, python `subscript`). Upstream flag: `seq-with-nested-seq` (7 kinds, error severity, 1:1 with observed failures: `tuple_expression`, `_macro_definition_{paren,bracket,brace}`, typescript `export_specifier`/`for_in_statement`, python `_dict_pattern_group2` — the dict_pattern reparse errors). | model (normalize/collect-slots) + template | rust tuple ×4 corpus entries, `type_parameters`, macro_definition `;`; typescript `type_parameters` ×2; python `subscript`, `for_in_clause`, `match case x,`, print trailing, `statement_group1 ;` | rrp ~20 (8/4/8) |
| S4 | **Singular-slot arity**: slot modeled singular receives N values (or 0 where 1 required) → accessor-throw at read, "Missing field" at render. Upstream flags: `union-slot-unaddressable` (`public_field_definition`), `union-slot-mixed-row`. Known member: the pubfield wrap-arity bug. | model (collect-slots) | rust `_let_chain.right` (2-3 values, → "Missing _left" render errors ×3), typescript `public_field_definition` modifier clusters (20 throws + 4 render errors), `rest_pattern.lhs_expression` (throws + 2 from-errors), python `parenthesized_list_splat.content` | 60 accessor-throws + rrp ~10 errors + from 2 |
| S5 | **Template content drops**: declared fields never referenced by any template (`coverage-missing-field`, 12 rows — typescript `call_expression.{function,arguments,type_arguments}` folded into `$CONTENT`, `extends_clause.type_arguments`, `import_statement.source`, `required/optional_parameter.name`...) plus choice-arm literal drops (rust `..` → `remaining_field_pattern` lost, python `keyword_argument` `name=` lost, `list_splat` `*` lost, c-string prefix lost) plus merged-slot interleave-order loss (typescript `template_literal_type`) and one double-render (`asserts x asserts x`, merged-slot re-emission residue). | template walker / emit | maps 1:1 onto typescript rrp mismatches (`call_expression childCount 3≠1`, `extends_clause 3≠2`, "Nested type arguments", import reparse `MISSING ";"`) | cov 12 + rrp ~18 (5/9/6) |
| S6 | **Extras (comments, line_continuation, newline) unrepresentable in the factory path; comment-kind render broken**: factory outputs miss `_comment`/`_line_continuation` (~20 factory rows); rust `line_comment` render fails "Missing field _content" (4 rrp errors). | factory surface + one transport/template bug | rust ×6, typescript ×6, python ×12 | factory ~24 + rrp 4 |
| S7 | **Zero-width-token divergence (typescript `automatic_semicolon`)**: rendered output joins statements without newlines; tree-sitter's zero-width ASI token then appears/disappears on reparse. Structurally honest mismatch, but the differing "child" has no text. | spacing model OR comparator policy — decision class | ~8 typescript mismatch rows (`statement_block` ±`automatic_semicolon`, `class_body_method [method_definition, ";"]`) | rrp typescript ~8 |
| S8 | **Validator/report artifacts (not product bugs)**: (a) "kind not found at rendered offset N" (5 rows, python 4 + typescript 1) — the locator can't find the target kind post-render; same family as the known `findNodeBySpan` artifact; (b) ancestor-duplication in mismatch attribution (~2-3x inflation); (c) the `from()` metric gap (12-14 per grammar) is almost entirely unitemized in the report — only 3 `from`-error rows exist; the report writer drops from-mismatch detail. | validator/report | — | reporting quality, 0 metric |

**Category (a) genuine product bugs:** S1–S6 — all of them, including the
"string escape" reparse errors (rust raw/c-string prefixes, python f-string
`\N{...}`), which are S5-family token-fidelity drops.

**Category (b) coverage-metric artifacts:** S8. No evidence of the opposite
artifact (real render paths with zero corpus exercise) inside the failing
set — but the rrp denominators (136/111/115) are corpus-entry-derived, not
kind-derived, so a per-kind coverage census belongs in Phase 0 to rule out
silent blind spots.

**Category (c) candidate principled exclusions:** S7 is the only honest
candidate (the diverging token is zero-width — there is no text to
round-trip). Decide in its phase: either fix the spacing model to emit
statement-terminating newlines (preferred; also improves rendered-output
quality) or add a comparator normalization for zero-width tokens with a
documented exclusion list. Nothing else in the data warrants exclusion —
python2-relic constructs (`print`, chevron) are grammar-supported and their
failures are ordinary S2/S4 members.

## End state

1. **One stamped representation per slot value.** The compiled model
   stamps, per slot: storage identity (`aliasedFromId ?? kindId` — stamps
   already exist post-kindid), marker storage form, separator possession
   (including trailing-separator presence as read state), and arity. Wrap
   tables, transport enums, templates, and factory signatures are all
   *derived from the same stamp* — no layer re-decides.
2. **Preflight diagnostics gate emit.** `seq-with-nested-seq` (already
   error severity) and `union-slot-unaddressable`/`mixed-row` become
   ratcheted counts that only shrink, wired to the kinds they predict will
   fail — the compile-time detector for this bug class, exactly as
   `kindid-unstamped-*` became for phantoms.
3. **Metrics:** rrp pass AND AST-match = total on all three grammars;
   factory pass = total; cov 199/199, 191/191, 127/127 — minus only the
   explicit, per-case-documented S7 exclusion list if the comparator-policy
   branch is chosen.

## Verified along the way

- Deep-vs-shallow divergence: none currently — counts are identical on all
  three grammars.
- The marker drop (S2) is NOT a template bug — `probe-kind` shows `raw`
  (the native read) already lacks the slot before render is ever reached.
- The rust tuple bug (S3) is render/template-side — wrap/transport are
  fine; the rendered text itself is `(1,2,)`.
- The transport-rejection class (S2) is genuinely transport-layer — wrap
  emits `"mut"`, `FromNapiValue` rejects it.

Key artifacts: `packages/tools/validation-report.json`.
