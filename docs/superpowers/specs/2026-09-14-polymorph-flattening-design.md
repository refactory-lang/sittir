# Polymorph flattening

A polymorph parent is a kind whose rule is a pure choice of its variants. It exists in the parse tree only to wrap one of them, which costs a level of nesting in every tree and a `content` slot in every model, factory and vocabulary interface. This design lists every such parent as a tree-sitter supertype. The parent disappears from the parse tree, its variants become its subtypes, and each variant carries everything the parent carried. The factory overlay keeps the ergonomic surface, `ir.<parent>.<variant>(…)`, so construction reads the same.

It depends on the whole-arm variant hoist, which makes a variant parent a pure choice, and it precedes the rule re-authoring retirement, whose gate snapshots the flattened model.

## 1. End state

- Every parent whose rule is a pure choice of `variant()` aliases is a supertype in both pipelines. Its variants are its subtypes, and a slot that admitted the parent admits the supertype.
- Every variant is a kind in both pipelines, including a variant whose arm is a single symbol or a single token. The parser already emits such a variant as its own node; sittir mints the same kind.
- The parse tree has no node for a flattened parent. A node's variant is its own kind, and the reader dispatches on it.
- The strict surface has no factory for a flattened parent. The overlay entry `ir.<parent>` remains, with one route per variant and the chained routes the variants already carry.
- A patch that addresses a flattened parent descends through it by the variant structure (§4). No grammar file's patches change.

## 2. What the spike established

Listing four pure python parents (`expression_statement`, `with_clause`, `_match_block`, `_suite`) under `supertypes:` with no other change:

- `tree-sitter generate` succeeds and no rule body changes. `node-types.json` lists each parent as a supertype whose subtypes are its variant kinds.
- The parse tree loses the level: `with_statement with_clause: (with_clause_bare …) body: (suite_inline …)`.
- A query still matches through a supertype: tree-sitter-rust's own highlights query uses `(_expression)`.
- Listing hides a rule without an underscore rename: python's `expression` is a supertype and never appears in a parse tree.

Where it broke, and why: 51 factory-render-parse mismatches, all in slots typed by the new supertypes. Sittir's node model had never minted a kind for a variant whose arm is a bare symbol (`suite_inline` over `_simple_statements`, `suite_empty` over a newline); it dereferenced the alias to its content and relied on the parent's dispatch to map the parser's `suite_inline` node back. With the parent gone, the reader meets `suite_inline` nodes the model has no kind for.

## 3. Variants mint kinds on both sides

A `variant()` names a kind. Sittir mints it whenever the parser does, whatever the arm's shape:

- **A structured arm** (a sequence, a choice, a whole-arm body) is minted today and is unchanged.
- **A bare-symbol arm** (`suite_inline` over `_simple_statements`) becomes a kind with one slot holding the aliased content. Its storage and parse kind are the variant, not the aliased rule.
- **A token arm** (`suite_empty` over a newline) becomes a leaf kind whose text is the token's.

The unmaterializable-branch rule (a hidden rule with no token of its own and at most one named child, which tree-sitter inlines away) keeps deciding when an alias would promise a node the parser never emits. A variant it declines is not a subtype; its parent is not pure and is not flattened (§5).

## 4. Patch descent through a flattened parent

Patches run on the enriched rules after the hoist has made the parent a pure choice, and grammar files address the parent's original positions. Path descent gains one step, beside the existing steps through an enrich lift and a content alias. At a parent that is a pure choice of whole-arm variants, whose variant bodies keep the parent's member positions:

- **The choice position followed by `/k`** selects variant `k`. `'1/0': variant('input')` labels the first variant.
- **Any other position** applies to that position in every variant. `0: field('path')` names the path in each variant.
- **A position some variant lacks** is an error naming the variant, never a silent skip.

The step is the same whether or not the parent is also a supertype, so the hoist and the flattening share it.

## 5. Which parents flatten

A parent flattens when all of these hold:

- its rule, after the hoist, is a pure choice whose every arm is a `variant()` alias or an enrich lift that carries one;
- every arm is a kind on both sides (§3);
- it is not an extra (a supertype cannot be one);
- no rule references it in a position a supertype cannot occupy, which today means an alias target.

Wire lists each such parent under `supertypes:` from the same analysis the hoist uses, so the listing reaches both pipelines from one place and the grammar files stay unchanged. A parent that fails a condition keeps its wrapper, and the regen log names it with the condition.

After the hoist: python 6 of 7 variant parents, typescript 15 of 18, rust 19 of 21 are pure. The rest (python `except_clause`; typescript `binary_expression`, `import_statement`, `arrow_function`; rust `attribute`, `function_type`) keep their wrappers until their variants can be hoisted.

## 6. Downstream

- **Reader.** A slot typed by a flattened supertype reads the variant node directly through the existing supertype dispatch. The parse-kind to storage-kind mapping that the parent's dispatch applied for bare-symbol variants is gone, because the variant is its own kind.
- **Model.** The parent is an `AssembledSupertype`; its variants are compounds or leaves of their own. No `content` slot exists for a flattened parent.
- **Strict factories.** No factory for the parent. A slot that admits it takes any variant's built node.
- **Overlay.** `ir.<parent>` keeps a route per variant, `strict` and `coerce`, plus the chained routes a variant carries. Its type is the union of the variant routes. It is the one construction spelling for a flattened parent.
- **Options.** An address that names the parent reaches its variants through the supertype member map, which already treats a polymorph parent as the union of its variants.
- **Vocabulary and bindings.** A variant is a refinement of its parent's claim, and a binding claims the variant node directly (`(struct_item_brace) @declaration.struct.brace`). Queries upstream wrote against the parent keep matching through the supertype.

## 7. Verification

- **Grammar diff.** Per grammar, the generated grammar and node model before and after differ exactly by the listed parents becoming supertypes, their wrapper nodes and `content` slots disappearing, and the bare-symbol and token variants gaining kinds. Anything else is a failure.
- **Validators.** `sittir validate history` numbers per grammar at or above the pre-change run in every lane, with accessor throws at zero.
- **Suite and examples.** The unit suite green, the examples type-check clean, the dogfood rebuild examples regenerated by their generator, API-surface and options snapshots updated with the listed parent factories removed.
- **Unit tests.** Path descent through a flattened parent: arm selection, fan-out, and the missing-position error. Minting a bare-symbol variant and a token variant on sittir's side.

## 8. Out of scope

Flattening the parents the hoist leaves per-arm, the rule re-authoring retirement, and the bindings pass that claims the variant kinds.
