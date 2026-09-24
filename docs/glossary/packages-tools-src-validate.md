# `packages/codegen/src/packages/tools/src/validate` — Function Glossary

Per-function reference for `packages/codegen/src/packages/tools/src/validate/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/tools/src/validate/render-bodies.ts::module`

```text
/**
 * The generated render bodies of a grammar — `packages/<grammar>/.sittir/render-bodies.json`,
 * one body IR per emitted kind — are the validators' catalog of renderable
 * kinds and the source the coverage checker reads a kind's body from.
 */
```

### `packages/tools/src/validate/render-bodies.ts::renderBodiesPath`

#### body

```text
// packages/tools/src/validate/ → ../../.. → packages/
```

### `packages/tools/src/validate/render-bodies.ts::loadRenderBodies`

```text
/** Every emitted kind's body. An absent file (a grammar never generated) throws, naming the path from `renderBodiesPath(grammar)`. */
```

### `packages/tools/src/validate/render-bodies.ts::deriveRuleKinds`

```text
/** The kinds the renderer can handle: those with an emitted body. */
```

### `packages/tools/src/validate/render-bodies.ts::bodyToLegacyRule`

```text
/**
 * A body in the coverage checker's placeholder shape: a slot reference is
 * `$NAME`, a gated arm is a `$TEST_CLAUSE` placeholder whose clause body is
 * the arm, and literal text is itself. The fallback of a gate chain inlines
 * into the surrounding template; an adjacency mark and a seam contribute
 * nothing. `indent`/`dedent` contribute the depth arms' stamped text
 * (`INDENT_TEXT`/`DEDENT_TEXT`) and a token seam contributes its own text —
 * exactly what the retired `whitespace` node contributed.
 */
```

### `packages/tools/src/validate/common.ts::module`

```text
/**
 * validate/common.ts — shared infrastructure across the three
 * corpus validators (`validate-roundtrip`, `validate-factory-roundtrip`,
 * `validate-from`):
 *   - Tree-sitter adapter: `adaptNode`, `treeHandle`, `findFirst`,
 *     `collectKinds`.
 *   - Corpus parser: `parseCorpus`, `loadCorpusEntries`.
 *   - Reparse wrapping: `buildKindToSupertypes`, `wrapForReparse`.
 *
 * Per-validator logic (per-kind assertions, reporting) stays in its
 * own file and imports whatever it needs from here.
 */
```

```text
// Codegen internals reached through the shared surface: types via import-type
// (runtime-erased), runtime values via load() at module top (destructure once,
// call synchronously — no per-call invoke()).
```

```text
// `loadWebTreeSitter` moved to ./engine-loader.ts (R9: codegen-run infrastructure
// kept out of the relocatable validator surface). Imported for the internal
// caller below and re-exported so this module's public surface is unchanged.
```

### `packages/tools/src/validate/common.ts::SlotArity`

```text
// Validator-local slot model. validate/common.ts has no AssembledNonterminal
// instances (it walks already-read napi NodeData), so slot descriptors are
// built from bare name strings + locally-derived arity.
// The validator is the ONLY allowed reader of the opaque `origin` fact
// (feedback_metadata_not_behavior.md); the compiler never sees this type.
```

### `packages/tools/src/validate/common.ts::SlotModel.storageKey`

```text
// always `_<name>` (or `$other` for the catch-all unmatched-children slot)
```

### `packages/tools/src/validate/common.ts::SlotModel.metadata`

```text
/** Validator-only facts; read ONLY via `readFacts` (never branched on by the compiler). */
```

### `packages/tools/src/validate/common.ts::CorpusEntry`

```text
// ---------------------------------------------------------------------------
// Corpus parser — tree-sitter test corpus format
// ---------------------------------------------------------------------------
```

### `packages/tools/src/validate/common.ts::parseCorpus`

```text
/**
 * Parse a tree-sitter test corpus file.
 * Format: `====` header, test name, `====`, source, `----`, expected tree.
 */
```

#### body

```text
// Capture optional `:language(...)` directive lines that may appear
// between the name and the closing `====` (e.g. `:language(tsx)`).
// The directive selects which sub-grammar variant to use; when it
// names a grammar other than the one being validated, the entry is
// skipped entirely (sittir's validator loads a single parser per
// grammar — it cannot parse TSX-only entries with the TS parser, so
// counting them as failures would skew the numbers).
```

#### body

```text
// Entry is declared for a different sub-grammar (e.g.
// `:language(tsx)` when validating `typescript`). Skip it
// entirely — don't include in totals.
```

### `packages/tools/src/validate/common.ts::FIXTURES_DIR`

```text
// ---------------------------------------------------------------------------
// Fixtures directory + loader
// ---------------------------------------------------------------------------
```

```text
// The corpus fixtures live in the codegen package; resolve them there explicitly
// (this validator was relocated from codegen/src/validate to tools/src/validate — R9c).
```

### `packages/tools/src/validate/common.ts::treeHandle`

#### body

```text
// NodeById removed. JS-side readNode now navigates via
// nodes[handle].children()[childIndex]. The nodes[] array is populated
// lazily by pushNode() inside readNode as it walks the tree.
// Phase D: kindIdFromName is required for JS-side reads (readNode emits
// numeric $type). Supply it from the grammar's types module.
```

### `packages/tools/src/validate/common.ts::boundaryModulePath`

```text
/** The grammar package's boundary module, as a file URL for dynamic import. */
```

### `packages/tools/src/validate/common.ts::loadNativeEngine`

```text
/**
 * The native engine the corpus validators read AND render through: the
 * grammar package's own default engine (`boundary.ts`'s `defaultEngine()`),
 * never a second instance. A coordinate names the tree by the tag its
 * engine minted, so a node read through one engine cannot render through
 * another — the read handle and the boundary's `render` must share the
 * instance.
 *
 * Cached per (grammar, binary mtime): napi modules cannot be re-dlopened
 * in-process, so a binary rebuilt mid-process is refused loudly rather than
 * validated stale. The staleness gate (`assertNativeBinaryFresh`) and the
 * debug-profile gate run on first load.
 */
```

#### body

```text
// Debug binaries have a known segfault class under validation; refuse
// them unless explicitly allowed. Binaries predating the getter report
// undefined — tolerated.
```

### `packages/tools/src/validate/common.ts::cachedNativeEngineProfile`

```text
/**
 * Compile profile of the currently cached native engine for `grammar`
 * ('debug' | 'release'), or undefined if no native engine has been loaded
 * for it yet (or the binary predates the `buildProfile` getter). A debug
 * profile only reaches here via `SITTIR_ALLOW_DEBUG_VALIDATE=1` — the loader
 * above refuses debug binaries by default — so callers that record results
 * (e.g. validation-history) still need to check this explicitly.
 */
```

### `packages/tools/src/validate/common.ts::buildReadHandle`

```text
/**
 * Build the read-side TreeHandle for the corpus validators. Selects
 * between the wasm/JS handle (default) and a native-engine handle
 * (when `SITTIR_BACKEND=native` is set). A native handle is the grammar
 * engine's own parse (`diagnostics.parseAndRead`): every read — root and
 * drill-in alike — goes through the engine that also renders, so the
 * coordinates it hands out resolve at render time.
 *
 * The wasm `tree` is still required: validators use it for kind
 * navigation (`findFirst`, `collectKinds`) — that traversal needs a
 * raw tree-sitter tree the JS side can walk. The native engine owns
 * its own internal tree for reads; the two coexist within one probe.
 */
```

### `packages/tools/src/validate/common.ts::readNodeAt`

```text
/**
 * Read a specific tree-sitter node via its adapted AnyTreeNode reference.
 *
 * ReadNode no longer accepts a nodeId. For the WASM/JS path,
 * validators use this helper to push the target node into the handle's
 * nodes[] array and call readNode with the resulting handle + childIndex=0.
 * For native handles (handle.read present), uses the native coords from
 * findNativeNodeId.
 */
```

#### body

```text
// WASM/JS path: temporarily set rootNode to the target node and read
// with no navigation coords (readNode reads rootNode when handle is undefined).
```

### `packages/tools/src/validate/common.ts::NativeNodeCoords`

```text
/**
 * Navigation coordinates for a native drill-in.
 * `handle` is the parent's index in the tree's nodes[], `childIndex` is
 * the position in parent's child array.
 */
```

### `packages/tools/src/validate/common.ts::NativeNodeCoords.embeddedData`

```text
/**
	 * Set instead of `handle`/`childIndex` for a match found inside
	 * `$_trivia` — those entries are fully materialized at read time
	 * (not lazy stubs), so they carry no handle+child-index coordinates
	 * to re-read them by. Callers must use this data directly rather
	 * than calling `handle.read(handle, childIndex)`.
	 */
```

### `packages/tools/src/validate/common.ts::collectNativeChildNodes`

```text
/**
 * Native NodeData's addressable child positions: named-slot (`_foo`) and
 * legacy (`$fields`) values, the anonymous-token bucket (`$other`), and
 * attached trivia (`$_trivia.leading`/`.trailing` — comment/extras
 * nodes read_node.rs attaches to a SIBLING rather than re-parenting into
 * the normal field/children tree, so this is the only place they're
 * reachable from).
 */
```

### `packages/tools/src/validate/common.ts::findNativeNodeId`

```text
/**
 * For a native TreeHandle (`handle.read` is present), walk the native
 * NodeData tree to find the parent-handle + child-index pair for the
 * first node whose `$type` equals `kind`. Native engine handles and
 * WASM/JS engine handles occupy different navigation spaces, so WASM
 * coordinates must never be passed to a native handle's
 * `readNode(handle, childIndex)`.
 *
 * Returns null when `handle` is a WASM handle (no `handle.read`) —
 * callers fall back to the JS tree's `node.id` in that case.
 *
 * Returns { handle, childIndex } instead of NodeId.
 */
```

#### body

```text
// No handle+child-index exists for this entry (see
// `NativeNodeCoords.embeddedData`) — return the already-
// materialized data directly instead of falling through to
// the coordinate-based match/drill logic below, which can
// never succeed for it.
```

#### body

```text
// A trivia entry's own `$nodeHandle` differs from its containing
// sibling's (`d`) — it was read as a child of the ENCLOSING node,
// not `d` — so prefer the child's own handle when present. For
// ordinary field/children-tree entries this is always equal to
// `d.$nodeHandle` (both were read via the same `read_children`
// call), so the preference is a no-op there.
```

### `packages/tools/src/validate/common.ts::NativeCandidateCoords`

```text
/**
 * A native candidate: navigation coordinates plus the node's byte span
 * (when available from the native AnyNodeData's `$span`).
 */
```

### `packages/tools/src/validate/common.ts::walkNativeForKind`

```text
/**
 * Walk the native AnyNodeData tree rooted at `handle` and collect ALL nodes
 * whose kind matches `kind`, in DFS order. Returns one entry per matching
 * node with its navigation coordinates (`handle` + `childIndex`) and byte
 * span (when present in the native data, so callers can slice the source).
 *
 * This is the "walk-native-for-candidates" counterpart to `findNativeNodeId`
 * (which returns only the first match). Used by `read-render-parse.ts` to
 * replace WASM-tree-walk-then-bridge with a pure native iteration that gives
 * each candidate its own correct coords — no span-equality match across
 * WASM/native boundary needed.
 *
 * Returns an empty array when `handle` has no native `read` method (i.e. a
 * WASM/JS handle). Callers fall back to WASM iteration in that case.
 */
```

#### body

```text
// Root-level match: coords = {} (no parent/childIndex navigation).
```

#### body

```text
// Still recurse to find nested matches of the same kind within
// the root's children (e.g. an impl_item contains impl_items).
```

#### body

```text
// See findNativeNodeId's walk() for why the child's own
// `$nodeHandle` is preferred over `d`'s.
```

#### body

```text
// Drill when the child doesn't already carry its own sub-children.
```

### `packages/tools/src/validate/common.ts::findFirst`

#### body

```text
// Cluster H (016): match only named nodes — the kind set comes from
// `collectKinds` which is named-only, but tree-sitter exposes both
// named and anonymous nodes that can share a `type` string (ts has a
// named `string` kind for `'…'`/`"…"` literals AND an anonymous
// `string` keyword inside `predefined_type` choice). Without the
// named filter, `findFirst` resolves to the anonymous keyword node
// when scanning a class with `: string` annotations and the rt
// probe tries to round-trip the bare keyword.
```

### `packages/tools/src/validate/common.ts::buildKindToSupertypes`

```text
// ---------------------------------------------------------------------------
// Supertype-based reparse wrapping
// ---------------------------------------------------------------------------
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.rust.mut_pattern`

```text
// Kind-specific: `mut_pattern` only appears inside match arms and
// if-let conditions — NOT in plain `let` statements (tree-sitter-rust
// flattens `let mut x = ..` into `let_declaration` with
// `mutable_specifier` + `identifier` siblings, no `mut_pattern` node).
// Using match-arm wrapper forces the parser to produce a mut_pattern.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.rust.generic_type_with_turbofish`

```text
// `generic_type_with_turbofish`'s rendered form includes `::` (e.g.
// `Bar::<X>`), only valid inside a scoped_type_identifier like
// `Bar::<X>::Item`. Bare type position (`type _X = ${r};`) rejects
// it. Wrap as a scoped path element.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.rust.scoped_type_identifier_in_expression_position`

```text
// `scoped_type_identifier_in_expression_position`:
// aliased to `scoped_type_identifier` only inside struct_expression's
// name field. Needs struct-literal context to round-trip.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.rust.delim_token_tree`

```text
// `delim_token_tree`: aliased to `token_tree` at
// attribute.arguments and macro_invocation positions. Both kinds
// use structural rendering (macro token content is
// author-declared-verbatim, mixes named and anon tokens).
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.rust.token_tree`

```text
// `token_tree` (the REAL rule, macro_rules arm bodies) is disjoint
// from the aliased invocation/attribute form above: an invocation
// wrapper reparses the fragment as `delim_token_tree` whose variant
// children (`delim_token_tree_paren` …) mismatch the original's
// `token_tree_paren` on deep AST compare. A macro-rule right-hand
// side is the one context that parses a true `token_tree`.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.rust.visibility_modifier`

```text
// visibility_modifier is a declaration-position prefix — has no
// supertype it fits under. Only fires when variant() adoption
// has been applied (see `wrapForReparse` — wrappers whose kind
// isn't in `deepReadKinds` are skipped so the wrapper doesn't
// expose the baseline `{% if variant %}` fall-through).
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.typescript.expression`

```text
// Tree-sitter-typescript exposes supertypes unprefixed (no leading
// `_`): `declaration`, `expression`, `statement`, `type`, `pattern`.
// The hidden-prefix form ('_expression' etc.) existed pre-regen
// due to an older convention and silently null-wrapped every
// TS kind — counted as auto-pass without reparse, masking real
// factory-rt failures.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.typescript.interface_body`

```text
// Alias-target-specific wrappers: tree-sitter aliases are
// position-dependent. `interface_body` is `alias($.object_type,
// $.interface_body)` inside `interface_declaration.body`.
// Reparsing the rendered content inside the generic `type _X
// = ${r};` wrapper produces `object_type` (no alias), but the
// original was `interface_body`. Wrap in an interface
// declaration so the alias re-fires and reparse produces
// interface_body for AST-match parity.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.typescript.decorator_member_expression`

```text
// Alias-position wrappers for the decorator variant family:
// `_decorator_member_expression` / `_decorator_call_expression` /
// `_decorator_parenthesized_expression` are restricted rules that
// exist only after `@`, and their member-object position admits
// `identifier` but not `super` — so in `@(super.decorate)` the word
// `super` lexes as a plain identifier. The generic `let _ = ${r};`
// expression wrapper reparses the same bytes where `super` is a
// `super` node, producing a leaf kind mismatch that is pure
// wrapper-context infidelity, not a render defect. Reparse in a real
// decorator position so leaf classification matches the original.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.typescript.rest_pattern`

```text
// Kind-specific: `rest_pattern` (`...x`) appears in array
// destructuring, tuple types (TS), and parameter lists. The
// generic `pattern` wrapper `let ${r} = null;` produces a
// parse error — `let ...x = null` is invalid. Wrap in an
// array destructuring target so the rest-pattern surfaces.
// `const`, not `let`: the override parser resolves `let [`'s
// declaration-vs-subscript ambiguity to the expression fork
// (`let` as reserved_identifier + subscript ERROR — see the
// KNOWN_ISSUES let-destructuring divergence), so a `let`
// wrapper never reparses; `const [` is unambiguous.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.python.expression`

```text
// tree-sitter-python supertypes are also unprefixed.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.python.pattern`

```text
// The `pattern` supertype covers assignment/for/parameter targets
// (tuple_pattern, list_pattern, …) — NOT match-case patterns, which
// are the disjoint `case_*` family. A `match _:\n  case ${r}:`
// context reparses `(a,b)` as case_tuple_pattern, so the original
// kind is never found at the fragment offset. A for-loop target is
// a true pattern-supertype position and reproduces the same
// `tuple_pattern > ( pattern_group … )` subtree the corpus
// contexts (parameters, for_in_clause, lambda params) produce.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.python._parameters`

```text
// Kind-specific: `_parameters` is the paren-LESS parameter interior
// (aliased as `parameter_list` in lambda contexts) — the visible
// `parameters` wrapper above expects the rendering to carry its own
// parens, so the interior needs them supplied here.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.python.list_splat`

```text
// Kind-specific: `list_splat` (`*args`) only appears inside
// argument lists, list/tuple/set literals, and expression
// lists. Generic expression wrapper `_ = *()` is syntactically
// invalid. Argument-list context accepts it.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.python.list_splat_pattern`

```text
// Kind-specific: `list_splat_pattern` (`*rest`) appears inside
// assignment patterns (`a, *rest = xs`) and function parameter
// lists. Wrap in an assignment-target position.
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.python.attribute`

```text
// Kind-specific: `attribute` (`a.b`) and `subscript` (`a[b]`)
// — tree-sitter-python parses `*a.b` and `*a[b]` as an
// attribute / subscript whose object is a list_splat (the
// `Lists` corpus exercises this through `[*a.b]` / `[*a[b].c]`).
// The generic `expression` wrapper `_ = ${r}` rejects
// `_ = *a.b` standalone. List-literal context accepts both
// the splat-prefix form AND plain accesses (`[obj.attr]`,
// `[*a.b]`, `[obj[k]]`, `[*a[b]]`). (016 Cluster I.)
```

### `packages/tools/src/validate/common.ts::REPARSE_WRAPPERS.python.parenthesized_expression`

```text
// Kind-specific: `parenthesized_expression` (`(expr)`) — the
// `Function definitions` corpus exercises `(*a)` from
// `j(((*a)))`. The generic `expression` wrapper `_ = (*a)`
// reparses as `tuple` (since bare `*a` is only valid inside
// a collection). Wrap as a single-arg call so the inner
// parens stay parenthesized_expression: `f((*a))` keeps the
// outer `(...)` as the argument list and the inner `(*a)`
// as a parenthesized_expression. (016 Cluster I.)
```

### `packages/tools/src/validate/common.ts::WrapForReparseResult.text`

```text
/** The rendered fragment spliced into the supertype wrapper template. */
```

### `packages/tools/src/validate/common.ts::WrapForReparseResult.offset`

```text
/** Byte offset where the rendered fragment begins in `text`. */
```

### `packages/tools/src/validate/common.ts::applyWrapperTemplate`

```text
/**
 * Apply a wrapper template to `rendered` and compute the byte offset at which
 * the rendered fragment begins inside the resulting string.
 *
 * @param rendered - The rendered fragment to splice into the wrapper.
 * @param wrapper - A function that takes the fragment and returns a full
 *   parse-valid program snippet.
 * @returns A `WrapForReparseResult` with `text` (the spliced program) and
 *   `offset` (byte position of `rendered` inside `text`).
 */
```

### `packages/tools/src/validate/common.ts::selectAndApplySupertypeWrapper`

```text
/**
 * Select the highest-priority wrapper reachable from `kind` via BFS over the
 * supertype graph and apply it.
 *
 * @remarks
 * Priority order: expression > type > declaration > statement > pattern (and
 * their `_`-prefixed siblings). Some kinds (python `attribute`, `subscript`)
 * are subtypes of BOTH `primary_expression` → `expression` AND `pattern`. A
 * pattern wrapper reparses an expression-shaped rendering as `dotted_name` /
 * other pattern kinds, not the original — so prefer the expression wrapper.
 * The ordering matches how tree-sitter grammars overload syntax: a construct
 * appears as an expression first, a pattern only in match-arm contexts, which
 * is the more restricted interpretation.
 *
 * Python's `attribute` has supertype `primary_expression` which isn't in the
 * wrapper map, but `primary_expression` itself is a subtype of `expression`
 * which IS mapped. BFS up through supertype chains so any mapped ancestor
 * produces a valid wrapping context.
 *
 * @param kind - The concrete grammar kind being wrapped.
 * @param wrappers - The grammar's wrapper map.
 * @param kindToSupertypes - BFS graph: kind → list of direct supertypes.
 * @param rendered - The rendered fragment to splice.
 * @returns A `WrapForReparseResult`, or `null` if no mapped ancestor exists.
 */
```

#### body

```text
// Declaration/statement-flavored wrappers come before expression/type/
// pattern ones: a kind can be reachable via BOTH (e.g. typescript's
// `internal_module`, which upstream tree-sitter-typescript lists under
// both `declaration` and `expression`) without the two positions being
// parse-equivalent. Statement-position content can carry positional
// tokens (e.g. an ASI-driven `automatic_semicolon`) that the external
// scanner only emits in statement context — wrapping the same bytes as
// an expression VALUE (`let _ = ${r};`) silently drops them even though
// the reparse itself succeeds without error. The declaration/statement
// wrappers are identity (`(r) => r`) and exactly reproduce the
// original top-level position, so they're strictly safer to prefer
// whenever reachable.
```

#### body

```text
// Reachable but not in priority list — take the first one.
```

### `packages/tools/src/validate/common.ts::VARIANT_ADOPTION_GATED_WRAPPERS`

```text
/**
 * Kind names whose direct `REPARSE_WRAPPERS[grammar]` entry should only
 * fire when variant() adoption is in effect for that kind. Otherwise
 * the wrapper is skipped so the baseline `{% if variant %}`
 * fall-through (a parent-template shape that only works under variant()
 * adoption) doesn't expose the kind to reparse where it'd render empty.
 */
```

### `packages/tools/src/validate/common.ts::wrapForReparse`

#### body

```text
// `kind` is the candidate's CANONICAL source kind (validator candidates
// are bucketed by the wire `$type`'s catalog name), so kind-specific
// wrappers keyed on source names — rust's disjoint `token_tree`
// (macro_rules arm body) vs `delim_token_tree` (invocation/attribute
// arguments) contexts — resolve directly through the lookups below.
// Canonical-hidden architecture (Option Y): the validator may pass
// a canonical hidden kind (`_x`) where REPARSE_WRAPPERS and
// `kindToSupertypes` are keyed on the visible alias-target name
// (`x`) — tree-sitter parser only sees visible names. Pre-strip
// for both lookups, but preserve the original `kind` for kind-
// specific lookups (e.g. `_expression` is itself a wrapper key).
```

#### body

```text
// Kind-specific wrapper first — the SOURCE kind's own context is the
// most specific one known: some kinds only appear in contexts their
// supertype's generic wrapper doesn't produce (rust `mut_pattern`
// surfaces in match/if-let but NOT in plain `let` statements), and a
// source-keyed wrapper must beat the alias-target preference below
// (rust `delim_token_tree` has targetKind `token_tree`, whose OWN
// wrapper is the disjoint macro_rules-body context).
```

#### body

```text
// Alias-target wrapper preference: when `kind` (the canonical source)
// differs from `targetKind` (the tree-sitter-emitted alias target), a
// wrapper keyed on the alias target — if one exists — reproduces the
// original parse position so reparse emits the same aliased kind. That
// keeps AST-match parity for kinds whose alias target doesn't survive
// a generic supertype wrapper (ts `interface_body` → `object_type`
// when reparsed in a `type _X = …;` context).
```

#### body

```text
// An alias-source occurrence sits in its alias TARGET's grammar
// position, so the target's supertype context is an equally valid
// reparse context — reach it when the source kind has no supertype
// edges of its own (e.g. python's `lambda_within_for_in_clause`,
// whose display `lambda` is the name the supertype graph knows).
```

The wrapper is chosen by the kind being rendered when it is visible, else by the parse kind the fixture targets —
never by stripping underscores, which can land on an unrelated kind (`_number` is not `number`).

### `packages/tools/src/validate/common.ts::WASM_PATHS`

```text
// ---------------------------------------------------------------------------
// Well-known WASM module paths
// ---------------------------------------------------------------------------
```

### `packages/tools/src/validate/common.ts::WRAP_MODULE_PATHS`

```text
/** Relative path from codegen validators to grammar source wrap modules. */
```

### `packages/tools/src/validate/common.ts::loadReadTreeNode`

```text
/**
 * Dynamic import of a grammar's `readTreeNode` entry point. Used by
 * validators to build source-typed wrapped views — the wire `$type` is
 * the grammar symbol, so nodes arrive under their source kind and the
 * validator render dispatches through the source template directly.
 */
```

### `packages/tools/src/validate/common.ts::loadWrapNode`

```text
/**
 * Dynamic import of a grammar's `wrapNode` entry point — the fluent-view
 * wrapper `readTreeNode` applies after reading. Used to produce the same
 * wrapped shape for already-materialized data (e.g. a trivia entry's
 * `NativeNodeCoords.embeddedData`) that has no handle+child-index to read
 * through `readTreeNode` itself.
 */
```

### `packages/tools/src/validate/common.ts::NODE_MODEL_PATHS`

```text
// ---------------------------------------------------------------------------
// node-model.json5 — the single on-disk metadata source (PR-K)
// ---------------------------------------------------------------------------
```

```text
/** Relative path from codegen/src/validate to each grammar's node-model.json5. */
```

### `packages/tools/src/validate/common.ts::Seat`

```text
/**
 * The validator-facing factory metadata, formerly read from `factory-map.json5`.
 * PR-K folds all five sections into `node-model.json5` (emitted from the single
 * `buildFactoryMap` derivation) and the validators read them here — there is no
 * validator-side re-derivation.
 */
```

```text
/**
 * Where a hoisted kind sits on the author-facing surface of its parent, as
 * the overlay decided and the node model stamped: an `arm` is reached through
 * the parent's mount route (`ir.<parent>.<mount>`), a `splice` spreads the
 * group's keys into the parent's config, `elements` keeps each element as
 * the group's config object.
 */
```

### `packages/tools/src/validate/common.ts::Seat.seated`

```text
/** An arm whose config-shaped child is handed to the wrapper as its own
	 *  config under the slot key, because a key it would merge is also a slot
	 *  of the parent. */
```

### `packages/tools/src/validate/common.ts::SeatTable`

```text
/**
 * `seats[parentKind][slotName][seatKind]`; a list's element seats sit under
 * the slot name `*` because a list's elements arrive as unnamed children.
 */
```

### `packages/tools/src/validate/common.ts::ParsedNodeModel`

```text
/** Minimal shape of the parsed node-model.json5 — only the fields the
 * validators consume. `factoryShape`/`factoryFields` are per-node;
 * `factorySlots`/`fieldAliasMap`/`polymorphVariants` are top-level. */
```

### `packages/tools/src/validate/common.ts::readNodeModelFile`

```text
/**
 * Load a grammar's `node-model.json5` and project the validator-facing factory
 * metadata. `factoryShapes` / `factoryFields` are reindexed from the per-node
 * records (pure reshape of serialized facts); `factorySlots` / `fieldAliasMap` /
 * `polymorphVariants` are read verbatim from their top-level sections. The file
 * is plain JSON (emitter uses `JSON.stringify`), so no comment-stripping. Returns
 * empty maps when the grammar is unknown or the file is unavailable — mirrors the
 * legacy `loadFactoryMap` fail-soft behavior so bootstrap runs don't throw.
 */
```

### `packages/tools/src/validate/common.ts::walkWrappedTree`

```text
/**
 * Walk a wrapped tree via declared getters, calling `visit` on each
 * encountered wrapped node. Enumeration uses `Object.keys` + accessor
 * invocation — accessors defined via `{get foo() {}}` appear as
 * enumerable keys and fire on read, so each child materializes through
 * the wrap layer's drill-in ($type on every node is the grammar-symbol
 * wire identity stamped by the read).
 *
 * `$`-prefixed keys are spread NodeData metadata (not child getters)
 * and get skipped. Leaves short-circuit when accessing a getter that
 * doesn't return a wrapped-shape value.
 */
```

#### body

```text
// $nodeHandle + $childIndex form the composite dedup key: a handle can
// repeat across child positions, so neither part suffices alone.
```

### `packages/tools/src/validate/common.ts::AccessorThrowRecord`

```text
/**
 * One accessor-throw occurrence — a slot's declared getter threw instead of
 * returning a value, so `resolveWrappedStorageValue` fell back to the raw,
 * unwrapped stub for that slot (see its doc comment for what that masks).
 * Callers that care about these beyond the unconditional stderr line (e.g.
 * `validateReadRenderParse`, for folding into the unified validation report)
 * pass an `onAccessorThrow` collector through to receive one record per
 * occurrence, in addition to — not instead of — the stderr line.
 */
```

### `packages/tools/src/validate/common.ts::ValidatorSkip`

```text
/**
 * One untested item, named, with the reason it went untested. Every
 * validator result carries two lists of these, so that no item leaves a
 * validator without a record:
 *
 * - `skips`: items counted in `total` but neither passed nor failed. The
 *   result's `skip` count is `skips.length`, derived from the list rather
 *   than kept as a separate counter, and `fail` is `total - pass - skip`.
 * - `excluded`: in-domain items dropped before counting (a corpus entry
 *   that does not parse, a candidate with no reparse wrapper or an empty
 *   render, a kind with no from/factory function or no render rule).
 *
 * Items outside a validator's domain (anonymous nodes, supertypes, pure
 * leaves, kinds outside the grammar's rule set) are not in either list.
 * `collectValidatorFailuresForGrammar` writes both lists into
 * `validation-report.json` at severity `info`: one `<stage>-skip` entry per
 * skip, and one `<stage>-excluded` entry per (reason, kind) carrying the
 * candidate `count` and the sorted corpus `entries` it came from.
 */
```

### `packages/tools/src/validate/common.ts::resolveWrappedStorageValue`

#### body

```text
// Unconditional (not env-gated): a thrown accessor here means this
// ENTIRE slot falls back to raw, unwrapped stubs below — including
// any sibling elements in an array-valued slot that wrapped fine on
// their own. Without SITTIR_VALIDATOR_DUMP_ACCESSOR_THROW, the only
// visible symptom is a downstream render/FromNapiValue error on an
// innocent sibling element, which misdirects investigation toward
// that sibling instead of the actual failing accessor.
```

### `packages/tools/src/validate/common.ts::TYPES_MODULE_PATHS`

```text
/** Relative path from codegen/src/validate to language package types.ts */
```

### `packages/tools/src/validate/common.ts::IrEntry`

```text
/** One `ir` binding: the bundle's `strict` plus its mount routes by name. */
```

### `packages/tools/src/validate/common.ts::IrSurface`

```text
/**
 * The author-facing factory surface: every kind bound on `ir`, keyed by its
 * canonical kind, plus the seat table that says how a hoisted child is
 * spelled on its parent. A kind without an entry (a privately wired hoisted
 * kind, or one an overlay does not bind) is built through its raw factory.
 */
```

### `packages/tools/src/validate/common.ts::loadKindNames`

```text
/**
 * Load the grammar package's `kindNameFromId` resolver for Phase D numeric
 * `$type` support. Returns a safe wrapper that returns `undefined` on unknown
 * ids rather than throwing.
 */
```

```text
/**
 * Load the static KIND_NAMES map from the grammar's generated types module.
 * Returns the Map directly for use as `RulesConfig.kindNames`.
 */
```

#### body

```text
// KIND_DISPLAY_NAMES (not KIND_NAMES) — this feeds the JS-backend
// template renderer's name resolution, which needs the parser's
// display label, not the canonical (wrap-dispatch) catalog key.
// See emitKindIdEnumAndLookups's KIND_DISPLAY_NAMES doc comment.
```

### `packages/tools/src/validate/common.ts::loadStorageKindNameFromId`

```text
/**
 * Storage-identity resolver: id → the canonical catalog kind name
 * (KIND_NAMES). The display resolver below serves the native<->WASM
 * locator, whose names must match tree-sitter's raw `.type` label — an
 * ALIASED id therefore resolves to its parse FACE there, never to the
 * storage kind. Identity decisions (which from/factory pair owns a read
 * node) must use THIS resolver instead.
 */
```

### `packages/tools/src/validate/common.ts::loadIsLeafKind`

```text
/**
 * The model's own classification of a kind as a leaf — a `pattern`, `token`,
 * `keyword` or `enum` kind carries text, not storage — keyed by kind id.
 * Unknown ids (and a grammar with no node model) are not leaves.
 */
```

### `packages/tools/src/validate/common.ts::loadKindNameFromId`

#### body

```text
// KIND_DISPLAY_NAMES (not KIND_NAMES) — this feeds findNativeNodeId/
// walkNativeForKind's native<->WASM kind-name bridge, which must
// match tree-sitter's own raw `.type` string (the display label),
// not the canonical catalog key. See emitKindIdEnumAndLookups's
// KIND_DISPLAY_NAMES doc comment.
```

#### body

```text
// Legacy fallback for pre-Phase-D generated types
```

### `packages/tools/src/validate/common.ts::loadCanonicalKindNameFromId`

```text
/**
 * Load the CANONICAL (catalog-key) kind-name resolver — `KIND_NAMES`, the
 * wrap-dispatch name table, NOT the parser display labels. Alias-source
 * kinds diverge between the two (rust `delim_token_tree` displays as
 * `token_tree`); use this wherever the SOURCE identity of a node matters —
 * e.g. selecting a reparse wrapper context — and `loadKindNameFromId`
 * wherever tree-sitter's own `.type` string must match.
 */
```

### `packages/tools/src/validate/common.ts::loadKindIdFromName`

```text
/**
 * Load the grammar package's `kindIdFromName` resolver for Phase D numeric
 * `$type` support. Returns the raw function (which throws on unknown names)
 * so callers can wrap it in try/catch as needed.
 */
```

### `packages/tools/src/validate/common.ts::loadLanguageForGrammar`

```text
/**
 * Load the best available parser for a grammar: override-compiled
 * WASM if it exists, otherwise the base grammar's WASM from npm.
 *
 * The override WASM is produced by `compileParser()` and lives at
 * `packages/<grammar>/.sittir/parser.wasm`. When present, it carries
 * all field labels from transform()/enrich() patches natively.
 */
```

#### body

```text
// Hash-verify the grammar's generated content before any consumer touches
// it. This is the universal choke point — every validator, every probe,
// every dev tool that loads a grammar funnels through here. See A5 in
// docs/superpowers/conventions/2026-05-15-024-cleanup-rules.md.
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts`

```text
// ---------------------------------------------------------------------------
// nodeToConfig — NodeData → factory Config-shape conversion
// ---------------------------------------------------------------------------
//
// Validators read tree-sitter output via `readNode` (snake_case `_<name>`
// keys, $-prefixed metadata). The factory signatures take `ConfigOf<T>`:
//   - top-level keys in camelCase (snake→camel on each `_<name>` entry)
//   - `children` in place of $children
//   - leaf values as bare strings (factory leaf signatures are `(text: string)`)
//   - branch values as NodeData produced by THAT kind's factory — when
//     `tree` + `factoryMap` are supplied, children are drilled via
//     `readNode` and reconstructed through their own factory before
//     being installed under the parent's config. This is what makes the
//     factory layer actually exercise construction instead of passing
//     data through verbatim; a declared-type mismatch (e.g. a
//     match_statement.body typed as Block but carrying case_clauses)
//     surfaces at construction time via the child factory's ConfigOf
//     rejecting the shape it was given.
//
// Plain shallow mode (no tree/factoryMap) still works and matches the
// older camelFields behavior so other validators can adopt this helper
// without the recursion cost.
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts.factoryShapes`

```text
/** Per-kind factory signature hint (from the generated `_factoryShapes`
	 * map). `'config'` expects a Config object; `'children'` is rest-
	 * params `(...children)`; `'text'` expects a bare string. Without
	 * this, recursion defaults to `'config'` which breaks children-shape
	 * factories (e.g. python `argument_list`) because they'd interpret
	 * the whole Config object as the single rest-param item. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts.fieldAliasMap`

```text
/** Per-field alias-source map (from the generated `_fieldAliasMap`).
	 * Key format: `"parentKind.fieldName"`; value: the source kind the
	 * factory expects. When a child arrives at an alias-declared slot,
	 * its tree-sitter-emitted $type is the alias target; `resolveChild`
	 * consults this map to dispatch the matching source-kind factory
	 * instead. Without it, an aliased field silently dispatches the
	 * wrong factory (e.g. `block` factory on a `_match_block` body). */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts.factoryFields`

```text
/** Per-kind list of declared factory Config field names (from the
	 * generated `_factoryFields`). Drives orphan-child promotion: when
	 * a read node has $children but the expected field is missing from
	 * $fields (tree-sitter elided the label — python `list_splat` at
	 * expression-statement position is the canonical case), route
	 * children into the declared fields by position. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts.factorySlots`

```text
/** Per-kind slot metadata (from the generated `_factorySlots`).
	 * Drives config-surface normalization for both named and unnamed slots. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts.cstNodeKindHint`

```text
/** Validator-supplied CST node-kind fallback for override polymorphs whose
	 * readNode shape collapsed the discriminating wrapper before factory dispatch. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts.firstNamedChildKindHint`

```text
/** Validator-supplied CST fallback for override polymorphs whose native
	 * read collapsed the wrapper child kind before factory dispatch. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts.namedChildKindHints`

```text
/** Ordered CST named-child candidates for override polymorphs whose
	 * discriminating wrapper kind is not the first named child. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts._parentKind`

```text
/** Internal — current parent kind during field recursion. Used with
	 * `fieldAliasMap` to form `${parentKind}.${fieldName}` lookups. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts._fieldName`

```text
/** Internal — current field name during field recursion. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts._depth`

```text
/** Internal recursion guard — set by the helper, not the caller. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts.kindNameFromId`

```text
/** Phase D: resolver for numeric $type → string kind name. Required when
	 * input nodes carry numeric $type (readNode output post-Phase-D). */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts.surface`

```text
/** When set, nodes are built through the author-facing `ir` surface and a
	 * hoisted child is projected by its seat instead of built on its own. */
```

### `packages/tools/src/validate/common.ts::ReadNodeLike.$type`

```text
// $type is numeric (TSKindId) for parser.c-derived kinds; string for
// hidden/synthetic kinds (e.g. "_suite") that have no parser.c entry.
```

### `packages/tools/src/validate/common.ts::isAnonTokenPassthrough`

```text
/**
 * Determine whether an anonymous NodeData token should pass through
 * `resolveChild` unchanged.
 *
 * @remarks
 * Anonymous tokens (separators, delimiters, keywords promoted to `_<name>` by
 * readNode) must stay as NodeData. Render's `$named !== false` filter drops
 * them from `$$$CHILDREN`, and flankSep probes their span/text to reconstruct
 * trailing separators. Converting them to bare strings bypasses those filters
 * and double-emits (e.g. struct_pattern's trailing `,` showed up twice in the
 * rendered output).
 *
 * @param c - The candidate child NodeData.
 * @returns `true` if the child is an anonymous token and should be returned as-is.
 */
```

### `packages/tools/src/validate/common.ts::shouldHaltRecursion`

```text
/**
 * Guard the recursion depth and availability of tree/factory context before
 * drilling into a child node.
 *
 * @remarks
 * Depth cap: recursive construction shouldn't run away even on pathologically
 * nested corpus entries. 64 is well past real-world AST depth and stops before
 * Node's default call-stack limit.
 *
 * @param depth - Current recursion depth.
 * @param tree - Tree handle, if available.
 * @param factoryMap - Factory map, if available.
 * @returns `true` if recursion should be halted (cap exceeded or context absent).
 */
```

### `packages/tools/src/validate/common.ts::resolveAliasedKind`

```text
/**
 * Resolve the effective factory kind for a child, unaliasing the
 * tree-sitter-emitted kind when the declaring slot has an alias-source
 * registered in `fieldAliasMap`.
 *
 * @remarks
 * `fieldAliasMap` is keyed `parentKind.fieldName` → `{ targetKind: sourceKind }`.
 * Example: python `match_statement` has `body: alias($._match_block, $.block)`,
 * so `match_statement.body` maps `'block'` → `'_match_block'`. A child with
 * `$type 'block'` arriving at that slot dispatches to the `_match_block`
 * factory (whose config accepts `alternative: CaseClause[]` rather than the
 * plain block's `children: Statement[]`).
 *
 * @param rawKind - The kind as emitted by tree-sitter.
 * @param parentKind - The kind of the parent node, if known.
 * @param fieldName - The field name under which the child was found, if known.
 * @param fieldAliasMap - Per-field alias-source map.
 * @returns The source kind to dispatch, or `rawKind` when no alias applies.
 */
```

### `packages/tools/src/validate/common.ts::resolveChild`

```text
/**
 * Drill into a shallow child NodeData via the tree handle, then convert
 * recursively and route through its kind's factory. Falls back to the
 * passed-in shallow NodeData when `tree` isn't available OR the child
 * lacks a $nodeId (factory-built children don't carry one).
 */
```

#### body

```text
// $type may be numeric (TSKindId) or string (hidden/synthetic kind).
```

#### body

```text
// Phase D: kindNameFromId returns the canonical form (e.g. '_type_identifier')
// but factoryMap is keyed by the tree-sitter visible name ('type_identifier').
// If the factory lookup fails and kind starts with '_', try the stripped form.
```

### `packages/tools/src/validate/common.ts::soleWrappedNode`

```text
/**
 * The concrete node inside a factoryless wrapper. A supertype the read stamps
 * over its child (`_non_special_token` over a `string_literal`) has no factory
 * of its own, and holds that child under a single `_<kind>` key; resolution
 * has to go through it or the child arrives unbuilt. Only a node with a
 * factory of its own is unwrapped: a wrapper holding bare text, or a token
 * with no builder, is left whole, because its text is what names the kind id
 * or the leaf a caller would type.
 */
```

### `packages/tools/src/validate/common.ts::readNodeText`

```text
/**
 * Whether a node holds its own contents rather than being a lazy read stub.
 * A stub carries its coordinate and nothing else; a leaf's text, slot keys,
 * `$children` or `$other` all mean the node has already been materialized.
 */
```

```text
/**
 * The bytes a read node stands for: its captured text when the reader kept
 * one (an anonymous token, a text kind), otherwise the span it was read at,
 * sliced from the tree's source. Empty only when neither is known.
 */
```

### `packages/tools/src/validate/common.ts::drillReadNode`

```text
/**
 * Materialize a lazily read child (`$nodeHandle` + `$childIndex`) into its
 * own `_<name>` keys / `$children`. Native handles read via napi
 * (`tree.read`); wasm handles fall through to the JS walker, so validators
 * stay backend-agnostic. A handle that lacks the node (a factory-built
 * subtree) leaves the shallow entry as is.
 *
 * A child that already carries its own contents is left alone. Re-reading it
 * would return the raw parse node and discard the wrap layer's per-slot kind
 * filter, which is what parks a separated list's separators in `$other`
 * rather than handing them back as elements.
 */
```

### `packages/tools/src/validate/common.ts::armRouteOf`

```text
/** The mount route a projected config asks for, when one of its slots is an arm seat. */
```

### `packages/tools/src/validate/common.ts::positionalOf`

```text
/** The exact arguments a positional parent takes, when a tuple seat filled its sole slot. */
```

### `packages/tools/src/validate/common.ts::isSpliced`

```text
/** Whether a projected config carries a spliced group's keys in place of the group. */
```

### `packages/tools/src/validate/common.ts::readValueKind`

```text
/** The canonical kind of a read slot value: a node's `$type`, or a kind-id leaf. */
```

### `packages/tools/src/validate/common.ts::seatForSlotValue`

```text
/**
 * The seat a read slot value occupies on its parent, when the parent is built
 * through the `ir` surface. A node or kind-id value is looked up by kind; a
 * bare text value takes the slot's only text arm; an array takes the slot's
 * elements seat.
 */
```

### `packages/tools/src/validate/common.ts::projectElements`

```text
/** Each element of an elements seat: the group's config object for a group element, a built node otherwise. */
```

### `packages/tools/src/validate/common.ts::carryElementTrivia`

```text
/**
 * A seated element projects to the group's config, and a config cannot carry
 * trivia — the transport rejects the key. The group's own built value can, and
 * it renders in the element's position, so a comment the read attached to the
 * group rides that value instead. Only a group with exactly one built value
 * has an unambiguous carrier; anything else keeps the group's trivia
 * unattached rather than guessing which child owns it.
 */
```

### `packages/tools/src/validate/common.ts::projectArmSlot`

```text
/**
 * Project an arm seat child onto its parent's config the way the mount
 * route spells it. A token leaf hands the route nothing: the mount carries
 * the value. A text leaf hands its text. A config-shaped child on a config
 * parent is flattened when the seat merges: its keys join the parent's, and
 * a nested arm inside it extends the route, since a variant minted inside
 * another variant's rule is spelled inside it (`withLeft.withRight`). A seat
 * the model marks `seated` keeps its value whole under the slot — a
 * config-shaped child its config, a one-argument child (direct, or forwarded
 * to a non-spread target) its one argument — which is what the mount route
 * hands the child's builder; any other child hands the route its own factory
 * arguments under the slot, spread into the builder.
 */
```

### `packages/tools/src/validate/common.ts::splitRegisteredSlots`

```text
/**
 * Pulls a kind's registered (spelling/choice) slots out of a projected
 * config — they have no home there any more, only in the factory's
 * trailing options argument — and returns what's left alongside them.
 */
```

#### body

```text
// The common case: nothing to split. Return `config` itself, not a
// rebuilt copy — `nodeToConfig` may have attached non-enumerable
// metadata (e.g. the POSITIONAL marker) that a plain-object rebuild
// via Object.entries would silently drop.
```

### `packages/tools/src/validate/common.ts::factoryArgs`

```text
/**
 * The positional arguments a factory of `shape` takes for a projected
 * config. A config whose arm seat asks for a mount route hands that route
 * the child's arguments directly on a non-config parent.
 */
```

#### body

```text
// `separatedListFactoryOptions` reads `_separator`/`_delimiter` off the
// raw read node by field name alone — a false match when the kind has
// its own unrelated structural field of the same name (e.g.
// member_expression's `.`/`?.` separator). Real list-options slots
// never coexist with a same-named config key, so that's the signal.
```

### `packages/tools/src/validate/common.ts::walkMount`

```text
/**
 * The callable the `ir` surface offers for `kind`: the entry's `strict`, or
 * the mount route's `strict` when the projected config asks for one. A leaf
 * binding IS the callable, with no `strict` of its own, because its strict
 * and loose forms are the same call. A missing route is an error, not a
 * fallback: the seat said the spelling exists. `undefined` when the kind is
 * not bound on `ir`.
 */
```

```text
/** Walk a dotted mount (`withLeft.withRight`) down an `ir` entry. */
```

### `packages/tools/src/validate/common.ts::buildWithFactory`

```text
/**
 * Build `referenceData` through `factory` by the calling convention its
 * declared shape implies; on the `ir` surface the same convention is applied
 * to the kind's `ir` binding (or its mount route) instead.
 */
```

#### body

```text
// $TEXT-templated branch/container (e.g. rust raw_string_literal) —
// the factory accepts the raw source span because external-scanner
// delimiters can't be reconstructed from children.
```

### `packages/tools/src/validate/common.ts::carryTrivia`

```text
/**
 * A comment rides the FOLLOWING node's trivia, and trivia is not config — a
 * factory rebuilds from the config alone, so a node built from a read would
 * otherwise drop the comments the read attached to it. The `$with` setters
 * already carry trivia across a rebuild for the same reason; construction is
 * the other place a node is remade from its config.
 */
```

### `packages/tools/src/validate/common.ts::directFactoryValue`

```text
/**
 * The one positional value a `direct` / `forwarded` factory takes: the
 * kind's sole slot (the model's structural slot record, `factorySlots`),
 * else the first declared factory field, else the first child.
 */
```

### `packages/tools/src/validate/common.ts::isIdentifierShapedFieldKey`

```text
/**
 * Test whether a named-slot key is identifier-shaped and thus a valid factory
 * Config slot.
 *
 * @remarks
 * Promoted anonymous keyword / punctuation tokens use the token's raw text as
 * the storage key (e.g. `_,`, `_:`, `_(`). Factory Config types only declare
 * identifier-shaped slots; spreading punctuation keys pollutes the config
 * without ever being read by the factory.
 *
 * @param key - A raw key (without `_` prefix) from a named slot.
 * @returns `true` if the key matches `[a-zA-Z_]\w*` and should be included.
 */
```

### `packages/tools/src/validate/common.ts::shouldPromoteOrphanChildren`

```text
/**
 * Determine whether to promote orphan `$children` into declared factory fields
 * by position instead of routing them to `children`.
 *
 * @remarks
 * When the parent kind declares fields via `_factoryFields` but none of them
 * appear in the node's `_<name>` keys, tree-sitter likely elided the field label for this
 * GLR state (python `list_splat` at expression-statement position is the
 * canonical case). Route the named children into the declared fields by
 * position so the factory sees the expected slots instead of `children`. Fires
 * only when no declared field is already populated — otherwise children
 * genuinely belong in `$$$CHILDREN` (e.g. rust `impl_item`'s body).
 *
 * @param declaredFields - The factory's declared field names for the parent kind.
 * @param populatedOut - The config object built so far (to check if any field is already set).
 * @param namedChildren - The filtered list of named child nodes.
 * @returns `true` if the orphan-promotion path should be taken.
 */
```

### `packages/tools/src/validate/common.ts::slotOrigin`

```text
/** Read the validator-only `origin` fact off a slot's opaque metadata. The
 *  validator MAY branch on this (it's the deprecated-ish TS read path); the
 *  compiler may not — hence the explicit `readFacts` seam. */
```

### `packages/tools/src/validate/common.ts::declaredSlotNameForKey`

```text
/**
 * The declared slot a read key belongs to. The read stores an unnamed slot
 * under the child's own kind (`_parameter` for `attributed_parameter.content`),
 * and the factory map stamps those spellings as the slot's `wireKeys`; a key
 * that is a declared slot name, or that no slot claims, resolves to itself.
 */
```

### `packages/tools/src/validate/common.ts::getChildFactoryArgs`

```text
/**
 * Resolve the spread-shape factory's single rest-param slot from
 * `nodeToConfig`'s output. `nodeToConfig` only writes the literal
 * `children` key for genuinely UNNAMED ($other-derived) slots — a
 * spread-shape kind whose sole field has a real grammar name (e.g.
 * python `module`'s `statement`) gets that key instead
 * (`slotConfigKey`'s field-origin branch: `snakeToCamel(slot.name)`).
 * Without `factoryFields`, such kinds always read `undefined` here and
 * the spread call silently invokes the factory with zero arguments.
 *
 * @param factoryFields - Declared factory field list per kind (from
 *   `_factoryFields`). Optional for backward compatibility with callers
 *   that only ever exercise the genuinely-unnamed `children` case.
 */
```

### `packages/tools/src/validate/common.ts::nodeToConfig`

#### body

```text
// $type may be numeric (TSKindId) or string (hidden/synthetic kind).
```

#### body

```text
// Named slots are stored as `_<name>` top-level keys
// directly on the NodeData object (de-hoisted storage). Fall back to the
// legacy `$fields` wrapper for backward compatibility with old fixtures.
```

#### body

```text
// Missing declared fields were recovered from surviving named children.
```

#### body

```text
// Assign by position: first N named children → first N declared fields.
```

#### body

```text
// Ambiguous-free anonymous-token fill completed above.
```

#### body

```text
// Residual scalar children on optional singular `children` slots are token
// baggage from the native read path, not structural children for the factory surface.
```

### `packages/tools/src/validate/common.ts::emitValidatorMetrics`

```text
// ---------------------------------------------------------------------------
// Metrics emission helper
// ---------------------------------------------------------------------------
```

```text
/**
 * Single shared call site for `dumpMetrics` so all four corpus validators
 * funnel through one definition (DRY: one source, one derivation). The
 * metrics accumulator is process-wide; each invocation writes the
 * cumulative state, so when vitest runs all four validators against all
 * three grammars in one process the final write contains every per-kind
 * entry observed in that run.
 *
 * Backend selection mirrors `buildReadHandle`: `SITTIR_BACKEND=native`
 * → `'native'`; anything else → `'ts'`. No-op when `SITTIR_METRICS=1`
 * is unset (the underlying `dumpMetrics` short-circuits).
 *
 * @see packages/common/src/metrics.ts for the accumulator + writer.
 */
```

### `packages/tools/src/validate/common.ts::dedupeMismatchesByContainment`

```text
// ---------------------------------------------------------------------------
// Mismatch dedup — ancestor-containment collapse
// ---------------------------------------------------------------------------
```

```text
/**
 * A failing node re-renders as part of every enclosing ancestor kind's own
 * independent round-trip test, so read-render-parse and factory-render-parse
 * each report the same defect once per ancestor kind — one bug becomes N
 * rows. Collapse to the innermost (root-cause) span per entry: drop a
 * mismatch when another mismatch for the same entry has a span strictly
 * contained within it.
 */
```

### `packages/tools/src/validate/common.ts::separatedListFactoryOptions`

```text
/**
 * Build a separatedList factory's options bag from a read/wrap node's
 * kind-level separator facts — `_delimiter` (bitflag: leading = 1,
 * trailing = 2) and `_separator` (dynamic separator kind id). One wire
 * spelling: a delimiter-bearing list is always its own separatedList
 * kind, so the kind-level keys are the only place these facts live. A
 * read delimiter is always passed through, `Delimiter.None` included: the
 * factory's own default is the grammar's declared one and applies only
 * when the caller says nothing.
 */
```

### `packages/tools/src/validate/common.ts::FactoryDispatchArtifacts`

```text
// ---------------------------------------------------------------------------
// Factory-call dispatch — the ONE mapping from a factory's declared shape to
// its calling convention, shared by the factory-render-parse validator and
// the exercise tool.
// ---------------------------------------------------------------------------
```

### `packages/tools/src/validate/common.ts::buildFactoryNodeFromReference`

```text
/**
 * Dispatch `referenceData` through the factory call convention its declared
 * shape (`factoryShapes[kind]`) implies and return the built node. Throws
 * whatever the factory throws — callers own error recording. Returns `null`
 * when no factory is registered for `kind`.
 */
```
