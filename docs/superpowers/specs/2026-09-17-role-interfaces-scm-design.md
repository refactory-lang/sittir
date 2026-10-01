# Role Interfaces & `roles.scm`

**Status:** Design spec, v2. Supersedes v1 (`superseded/`).
**Prerequisites:** Canonical rule library spec (slot model, shared discriminator resolution, unification). Overlay chain (`emitters/overlays/`, `OVERLAY_CHAIN`).
**Replaces:** SCIP vocabulary spec's `SyntaxKind` adoption and expansion layer. See §8.
**Sequence:** Native reader + `shape.scm` can land before the rule library, against today's grammars. Vocabulary and interfaces land with it. Field lift lands with the library.

---

## 1. Two sources, one SSOT for roles

| File | Describes | Covers |
|---|---|---|
| `grammar.sittir.ts` | the write side — what the grammar *is* | everything, including sub-visible: tokens, externals, precedence, `role($._indent, 'indent')` |
| `roles.scm` | the read side — what the visible tree *means* | kind classification, members, contracts |

**`roles.scm` is the single source of truth for role mapping.** Nothing else states a role: not `ir.ts`, not the factories, not a derived table. Every consumer — lifter, checker, type generator, overlay emitter, runtime reader — reads the file. Everything else in the package is derived from the pair.

Ordering resolves consistency: `grammar.sittir.ts` evaluates first; `roles.scm` is applied to the result. Boundary: scm addresses visible nodes; sub-visible facts stay in `grammar.sittir.ts`.

---

## 2. Where roles.scm changes land: overrides vs overlays

sittir distinguishes grammar-affecting changes (**overrides** — compiled into the parser via the patched pipeline) from sittir-only changes (**overlays** — layered re-export modules over the generated factory bundle; current chain `refines → polymorphs → supertypes`). `roles.scm` splits along exactly that line:

| roles.scm content | Mechanism | Effect |
|---|---|---|
| Member captures on slots the discriminator resolver marks **ambiguous** | **override** (field lift) | `field(...)` applied to the slot; parser regenerated; node-types/builders/ast-grep see the field |
| Member captures that **rename** an existing field (dial: normalized/authored/forked) | **override** (field rename) | field renamed in the emitted grammar; old→new recorded for query migration |
| Member captures that **alias** an existing field (dial: strangled) | **`roles` overlay** | contract name mapped onto upstream field; grammar untouched |
| Kind claims that **refine beyond the grammar** (a distinction the grammar lacks: Rust method, `true`/`false`, line/block comment) — dial: normalized/authored | **override** (kind split via `alias()` form-splitting; parent preserved) | new kinds in node-types; ast-grep and builders see them; resolver ambiguity may drop |
| Same claims — dial: strangled | **`refines` overlay** (already in `OVERLAY_CHAIN`) | discriminated types projected over the upstream kind; parse tree untouched |
| Everything else — kind claims, members on unambiguous slots, contracts | **`roles` overlay**, appended to `OVERLAY_CHAIN` after `supertypes` | contract views, `roles.as/is/find`, typed member access generated over the builders. No grammar mutation |
| The file itself | **runtime** | executed by the reader in the same query pass as `shape.scm` |

The field lift is the only grammar-affecting consequence of `roles.scm`, and it is gated by the existing rule — **kind when unambiguous, field only when ambiguous** — not by the presence of a capture. A member capture *declares* a member; whether that member becomes a field is the resolver's call. (v1 had this wrong: it made every captured slot a field.)

```
grammar.sittir.ts ─evaluate─▶ grammar.json ─[field lift ← roles.scm]─▶ patched grammar ─▶ parser
                                                                              │
                                              factories ─refines─polymorphs─supertypes─▶ roles overlay ◀─ roles.scm
                                                                              │
                                          reader:  parse ─▶ query(shape.scm ++ roles.scm ++ user.scm) ─▶ captures ─▶ NodeData
```

---

## 3. Vocabulary: namespaced kinds

### 3.1 Why not SyntaxKind

SCIP's `SyntaxKind` is an occurrence taxonomy for highlighting. Its identifier subtypes encode *position*: `IdentifierFunctionDefinition` means "the identifier in a function declaration's name slot." That is already stated — more precisely — by a kind-level claim plus a member: `(function_item (identifier) @name) @declaration.function`. Adopting `SyntaxKind` would state every such fact twice. Dropped as a source. Kept as an optional *projection* (§3.4).

`SymbolInformation.Kind` is different: it's a taxonomy of *what a node is*, forced through cross-language agreement. It covers declarations only. sittir extends the same shape to the other node categories and namespaces the result.

### 3.2 Namespaces — sittir names, ecosystem-derived coverage

Names are sittir's throughout, namespaced and hierarchical (§3.2.1). Two ecosystem sources are consulted, for two different things — neither for names:

| Source | Consulted for | Not consulted for |
|---|---|---|
| **tags.scm** | **structure** — `@definition.x` on the node, `@name` on the slot, nesting for context: literally the shape of `roles.scm`. Validates bare member captures and innermost-claim scoping as precedent | granularity (it maps struct/enum/union/type-alias all to `definition.class` — the conflation §3.2.1 forbids) |
| **highlights.scm** (upstream, per grammar) | only what the kind list cannot show: **anonymous-token grouping** (which literals are keywords, and in which groups; punctuation classes), **predicate-based classes** (prelude types, casing-based constants, builtins by name), **contextual refinements** (`(line_comment (doc_comment))`, `(type (identifier))`) | coverage of named kinds (it collapses distinctions — Rust files `char_literal` with `string_literal` under `@string`, integers/floats/booleans under `@constant.builtin` — so an inventory read from it is already coarser than the grammar), names, or classification |
| **SCIP `SymbolInformation.Kind`** | **declaration granularity** — the `declaration.*` leaves, verbatim | anything outside declarations |

**Coverage comes from the grammar itself.** The inventory of nameable things is the grammar's visible named kinds (`grammar.json` / `node-types.json`), at their native granularity — not any query file, since every query file is a lossy projection of that list. Two invariants follow, both mechanically checkable from `grammar.json` + `roles.scm`:

- **Totality.** Every visible named kind carries a kind claim, or appears in an explicit `; unclaimed:` list with a reason (e.g. internal wrapper kinds). Unclaimed-and-unlisted is a build error. This is the read-side twin of `shape.scm`'s totality over rules.
- **Injectivity within a grammar.** Two distinct kinds in one grammar never map to the same vocabulary leaf. Rust `char_literal` and `string_literal` cannot both be `literal.string`; TS `required_parameter` and `optional_parameter` cannot both be `declaration.parameter`; the three form-split `call_expression_*` kinds cannot all be `expression.call`. If the grammar bothered to distinguish them, the vocabulary refines (`literal.char`, `declaration.parameter.optional`, `expression.call.member`). *Across* grammars, synonyms share a leaf (`closure_expression` / `arrow_function` / `lambda` → `expression.lambda`); *within* one, the map is injective. This is §3.2.1's no-conflation rule as a test rather than a discipline.

`extract-roles.ts` keeps its parser; its job narrows to surfacing the three things above and to the cross-check — an upstream capture that disagrees with `roles.scm` is reported as an upstream inconsistency, never adopted.

| Namespace | Provenance | Kinds (initial) |
|---|---|---|
| `declaration` | SCIP Kind, verbatim | `function` `method` (`.trait` `.static`) `constructor` `getter` `setter` `class` `struct` `union` `enum` (`.member`) `interface` `trait` `protocol` `mixin` `delegate` `field` `property` `parameter` (`.self` `.type` `.optional` `.typed` …) `variable` `constant` `type_alias` `module` `namespace` `package` `macro` … — SCIP names, compound ones nested (§5.6 ¶0) |
| `expression` | sittir | `call` (`.member` `.template` `.new`) `binary` → class → **operator leaf** (`.arithmetic.add` `.arithmetic.floor_divide` `.comparison.strict_equal` `.logical.and` `.bitwise.xor` `.shift.right_unsigned` `.nullish` `.membership.in` `.identity.is_not` …) `unary` (`.negation` `.plus` `.not` `.bitwise_not` `.deref` `.typeof` `.void` `.delete`) `update` (`.increment` `.decrement`) `assignment` (`.compound.add` …) `reference` `try` `conditional` `member` `subscript` `assignment` `lambda` `parenthesized` `cast` `await` `macro_invocation` `range` `tuple` `array` `object` `interpolation` … |
| `statement` | sittir | `block` `if` `loop` `for` (`.in` …) `while` `return` `break` `continue` `switch` `match` `try` `throw` `expression` `import` … |
| `pattern` | sittir | `identifier` `tuple` `struct` `wildcard` `rest` `or` … |
| `literal` | sittir; coverage from highlights | `string` (`.escape` `.raw` `.byte`) `template` `regex` `char` — `char` is its own leaf wherever the grammar has its own kind `number` (`.integer` `.float`) `boolean` (`.true` `.false`) `null` (`.undefined`) |
| `identifier` | sittir; coverage from highlights | `identifier` (bare) `.type` `.field` `.property` `.label` `.lifetime` `.metavariable` `.self` `.super` `.builtin` |
| `type` | sittir | `primitive` `named` (`.prelude`) `generic` `function` `tuple` `array` `pointer` `reference` `union` `optional` … |
| `comment` | sittir; coverage from highlights | `line` `block` — each refinable `.doc` (Rust `(line_comment (doc_comment))`) |
| `keyword` | sittir; **grouping** observed from highlights | `declaration` `conditional` `repeat` `return` `operator` `import` `exception` `modifier` `visibility` `type` … |
| `punctuation` | sittir; classes observed from highlights | `bracket` `delimiter` `special` (interpolation braces) |
| `operator` | **derived** from expression leaves (§4.2) | `arithmetic.add` `comparison.equal` `logical.and` … — never authored |
| `modifier` | sittir | named modifier **nodes** only: `visibility` (`.pub` `.crate` `.in_path`) `accessibility` (`.public` `.private` `.protected`) `mutable` `extern` `override` `function` (Rust's `function_modifiers` set) — bare keyword markers are **members**, not kinds (§4.3) |
| `attribute` | sittir | `attribute` (`.inner`) — Rust `attribute_item`, TS/Python `decorator` |
| `trivia` | sittir | `whitespace` `newline` |

**Projections, not sources.** `highlights.scm` and `tags.scm` for authored grammars are *generated* from `roles.scm`: leaves by a rename table (`literal.string → @string`, `identifier.lifetime → @label`, `literal.number.integer → @number`), identifier occurrence roles from (kind, member) (`(declaration.parameter, name) → @variable.parameter`, `(expression.call, function) → @function.call`, `(declaration.method, name) → @function.method`), tags by coarsening (`declaration.{struct,enum,union,type_alias} → definition.class`). SCIP `SyntaxKind` is a third, optional. None are authored; editor compatibility is an output.

Why `declaration.*` rather than tags' `definition.*`: a bodiless prototype is a declaration and not a definition; SCIP and tags elide the distinction, LSP does not. `declaration` stays correct if the distinction is ever needed as a refinement.

### 3.2.1 Kinds are hierarchical; distinctions are never dropped

A canonical kind is a dotted path: `namespace.kind[.refinement…]`. Two rules govern it:

- **Never conflate for the sake of mapping.** If a grammar distinguishes two things, the vocabulary keeps two leaves. Rust `match_expression` is `statement.match`, not `statement.switch`; Python `integer`/`float` are `literal.number.integer` / `literal.number.float`; TS `true`/`false` are distinct kinds and stay `literal.boolean.true` / `literal.boolean.false`; Python `not_operator` is `expression.unary.not`; TS `for_in_statement` is `statement.for.in`. A synonym is renamed (Python `attribute` → `expression.member`, `raise` → `statement.throw`, `lambda`/`closure`/`arrow` → `expression.lambda`); a **distinction** is refined, never merged. The test: could a consumer ever need to tell them apart? If yes, two leaves.
- **A parent level exists only when some grammar uses it as a kind.** TS has a single `number` kind → `literal.number`; Rust/Python refine it → `literal.number.integer`, `.float`. Rust has one `binary_expression` → `expression.binary`; Python refines → `expression.binary.logical`, `expression.binary.comparison`. The hierarchy is therefore *derived from what grammars actually distinguish*, not designed top-down, and each grammar claims at the depth it parses.

**A prefix is a kind-set.** `literal.number` matches `literal.number.integer` and `literal.number.float` and TS's bare `literal.number` — the same resolution editor themes already apply to highlight captures (fallback to the nearest defined prefix), which is what makes the highlights projection lossless. This is the same "groupings are kind-sets, not nominal supertypes" rule as before, now with the common case built into the naming: prefix for refinement families, unions (§5) for cross-cutting sets like `Callable` that have no shared parent.

Rules:
- **`declaration.*` names are SCIP's, verbatim.** Refinements beneath them and extensions beside them are marked `(ext)` in the vocabulary file and are semver-minor to add.
- **All other namespaces are sittir's**, kept boring — the names grammar authors already converge near — and complete with respect to the upstream coverage inventory.
- **No nominal supertypes across kinds.** Groupings are kind-sets (§5).
- The vocabulary lives in one file, `vocabulary.ts`, as a literal union per namespace. Capture names in `roles.scm` are validated against it at lift time.

v1's recorded `lifetime` gap is a coverage finding, not a naming one: upstream Rust highlights classify it (`@label`), so it is a nameable thing; sittir names it `identifier.lifetime`.

### 3.3 Kind is a (node, context) fact

The same node kind claims different vocabulary kinds under different nesting — Rust `function_item` is `declaration.function` at module level, `declaration.method` in an `impl_item` body, `declaration.method.trait` in a `trait_item` body. Context is ordinary scm nesting; no directive.

### 3.4 SCIP projection (optional, derived)

If SCIP occurrence emission is ever wanted, `SyntaxKind` is a small table over (kind, member): `(declaration.function, name) → IdentifierFunctionDefinition`, `(expression.call, function) → IdentifierFunction`, `literal.string → StringLiteral`, `comment.* → Comment`. Derived, not authored, not shipped unless asked for.

---

## 4. Capture conventions

```scheme
(function_item                          ; pattern root
  (identifier)   @name                  ; member capture — bare member name
  (parameters)   @parameters
  (block)        @body
) @declaration.function                 ; kind capture — @namespace.kind
```

| Capture | Form | On | Meaning |
|---|---|---|---|
| kind | `@namespace.kind` | a node | classification claim; keys the contract |
| member | `@member` | a slot | declares the member; capture name **is** the slot/field name |

**Scoping rule.** A member capture binds to the **innermost enclosing node that carries a kind capture**. A member capture with no enclosing kind capture is an error. Nested claims scope naturally:

```scheme
(impl_item
  (declaration_list
    (function_item (identifier) @name) @declaration.method   ; @name → the method
  ) @body
) @declaration.impl                                          ; @body → the impl (ext)
```

**The delta principle: members are stated only where the grammar's own field names don't already say it.** The contract member vocabulary is `grammar fields ∪ roles.scm member captures`. A slot that already carries the right field name is a member with no capture needed — `(function_item) @declaration.function` is complete for Rust, because `name`, `parameters`, `body` exist upstream. A member capture is written for exactly three cases:

1. **Missing name** — the slot is unfielded (Python `typed_parameter` name slot).
2. **Canonical alias** — the field exists under a different name; the capture supplies the contract name and the upstream field is left in place (Python `attribute.attribute` → `@property`; Rust `let_declaration.pattern` → `@name`).
3. **Rename** — same capture, but the field is renamed in the emitted grammar.

Cases 2 and 3 are **the same capture**. `roles.scm` states intent — "this slot is `name`" — and the package's dial setting decides how it's realized: strangled grammars realize canonical names as aliases (overlay; upstream field queries keep working), normalized/authored/forked grammars realize them as renames (override; parser regenerated; node-types and builders carry the canonical name). The file is dial-invariant: a grammar that later forks flips one package setting and the same `roles.scm` becomes renames. A rename's old→new field mapping is, by construction, the migration table entry for that slot (query-surface spec).

Consequently the **member vocabulary is chosen by upstream convergence**, not by taste: `name` `body` `parameters` `left` `right` `operator` `condition` `consequence` `alternative` `function` `arguments` `object` `value` `type` are what three unrelated grammar authors already picked. Measured against the current dumps the delta is ~a dozen captures per grammar, almost all aliases (§7). The interfaces spec's earlier `members` was itself a mistake by this rule — every grammar calls a declaration body `body`; the interface now does too.

**Member captures name slots, not fields.** `@name` says "this slot is the member `name`." Whether a `field('name', …)` exists in the emitted grammar is the resolver's decision:
- unambiguous slot → member is kind-addressed; no field; `shape.scm` addresses it by kind + anchor.
- ambiguous slot (construction: two slots accept overlapping kinds; discrimination: two same-kind slots carry different members) → field lifted.

Authored `roles.scm` therefore never needs `field:` syntax. Generated `shape.scm` uses `name:` prefixes wherever a field exists, for runtime precision.

**Lift semantics by constraint class:**

| Constraint | Lift |
|---|---|
| member capture on ambiguous slot | make field |
| member capture on unambiguous slot | declare only |
| kind capture | declare only (overlay + checker input); no mutation |
| kind / structure constraints | **match-only**; mismatch is a loud error, never an implicit alias |
| `#eq?`/`#match?` on a slot holding **literal tokens** | liftable (decidable over the rule tree) — e.g. TS `accessor_kind` |
| `#eq?`/`#match?` on non-literal slots | runtime predicate only |
| `(#set! …)` | reserved; not used |

**Slot-not-arm.** A constraint selecting a `choice` slot decorates the whole slot.

### 4.1 Refinements the grammar lacks

`roles.scm` may claim a distinction the grammar does not make. Rust has no method kind (`function_item` in an `impl_item` body), one `boolean_literal` (no `true`/`false` kinds), TS one `comment` kind (no line/block). The claim is written the same way as any other — the pattern supplies the discriminating context or predicate:

```scheme
(impl_item (declaration_list (function_item) @declaration.method))           ; context
((boolean_literal) @literal.boolean.true  (#eq? @literal.boolean.true  "true"))   ; literal-token arm
((boolean_literal) @literal.boolean.false (#eq? @literal.boolean.false "false"))
((comment) @comment.line  (#match? @comment.line  "^//"))                    ; token text
((comment) @comment.block (#match? @comment.block "^/\\*"))
(call (attribute) @function) @expression.call.member                         ; Python: context — TS has this as a kind
((string (string_start) @_p) @literal.string.f (#match? @_p "^[fF]"))        ; Python: string_start token text
```

Refine only distinctions the **language** has, not just ones another grammar has: Python gets no line/block comment split because Python has no block comments. The cross-grammar symmetry that matters is at the vocabulary level (`comment.block` exists; Python never claims it), not forced parity of claims.

Every such pattern executes at runtime regardless. What the **dial** decides is whether the distinction is also pushed *into the grammar* — and sittir already has both realizations; `roles.scm` just becomes their single source:

| Realization | Mechanism (existing) | Effect | Dial |
|---|---|---|---|
| **Override** | `alias()` form-splitting (patched pipeline; parent kind preserved for ast-grep) | grammar gains the kind: node-types, builders, ast-grep `kind:` queries see `method_item` / `true` / `line_comment`; resolver ambiguity can *drop* (more kinds → fewer overlapping slots → fewer fields) | normalized / authored |
| **Overlay** | `refines()` → the `refines` overlay already in `OVERLAY_CHAIN` | discriminated types projected over the upstream kind; `NodeData.$kind` carries the refinement; parse tree and node-types untouched | strangled |

Hand-authored `refines()` / form-split `alias()` calls in `grammar.sittir.ts` are therefore replaced by claims in `roles.scm` where the discriminator is expressible as a pattern; the grammar file keeps only splits that need sub-visible information.

**Liftability of a refinement** (whether the override realization is *available*), by discriminator class:

| Discriminator | Grammar-level realization | Notes |
|---|---|---|
| **Context** — nesting under a distinct rule position | `alias()` by position: `declaration_list: repeat(choice(alias($.function_item, $.method_item), …))` | Standard tree-sitter. Limit: if one rule position serves several contexts (trait *and* impl bodies both use `declaration_list`), splitting by context requires **duplicating the rule** — a cost signal that the overlay realization is the better dial position for that refinement |
| **Literal arm** — the kind is a `choice` of literal tokens | alias per arm: `choice(alias('true', $.true), alias('false', $.false))` | Always available; cheap |
| **Token text** — the kind is a single `token()` whose pattern is a `choice` of independent alternatives | split the token into two tokens | Available only when the alternatives are separable *at the token boundary* (JS `comment` is `token(choice(seq('//', …), seq('/*', …)))` — separable). Anything finer is the lexical floor: not lifted |
| **Finite text set on an identifier slot** — `__init__`, `constructor`, `staticmethod`/`classmethod`, prelude type names | **keyword promotion + arm split**: the text becomes a literal in a second arm of the rule (`choice(alias(seq('def', alias('__init__', $.identifier), …), $.constructor_definition), …)`); tree-sitter's `word`-based keyword extraction lexes it as that literal wherever the parse state admits it, and the inner `alias(…, $.identifier)` keeps the node an `identifier` for upstream queries | Liftable. Behaviour is identical to the runtime predicate, including the same false positive on a user type shadowing a prelude name. Cost: grammar gains keywords, which touches error recovery marginally |
| **Regex on an identifier slot** — dunder `^__.*__$`, ALL_CAPS constants | token split only (a `dunder_identifier` token with lexical precedence over `identifier`) | Lexical floor. Case by case, default overlay: same-length matches between two identifier-shaped tokens need `token(prec(…))` and are the fragile kind of change the floor exists to keep out |

The refinement always exists in the vocabulary; what varies is whether the parser knows about it. That is precisely the `alias()` / `role()` distinction from the patched-pipeline spec — structural vs annotation — now driven from one file and selected per grammar by the dial rather than chosen per call site by hand.

### 4.2 Operator refinements — leaf per operator

`binary`, `unary`, `update`, and compound `assignment` refine down to **the operator**, with the class as the intermediate level: `expression.binary.arithmetic.add`, `expression.binary.comparison.strict_equal`, `expression.unary.not`. The reason is caller ergonomics on both sides: a reader asks for `expression.binary.arithmetic.add` and gets exactly `+` nodes with no post-filter on operator text; a builder gets `binary.arithmetic.add(left, right)` from the `roles` overlay with the operator baked in, instead of `binary(left, '+', right)`. Class queries still cost nothing — `expression.binary.arithmetic` is a prefix kind-set.

The discriminator is a literal arm (the operator slot is a `choice` of literal tokens), so the override realization is always available, and the library's `binaryLadder` — one arm per precedence level × operator — already has exactly the arms to alias. The vocabulary cost is bounded and finite (~30 binary leaves per grammar); the hierarchy keeps it navigable.

```scheme
(binary_expression operator: "+")   @expression.binary.arithmetic.add
(binary_expression operator: "===") @expression.binary.comparison.strict_equal   ; TS-only leaf; `==` is `.equal`
(binary_expression operator: "??")  @expression.binary.nullish                   ; TS-only class with one member
(unary_expression  operator: "-")   @expression.unary.negation
(update_expression operator: "++")  @expression.update.increment
```

Where a grammar already splits structurally, the structural kind claims the class and refines beneath it: Python `boolean_operator` → `expression.binary.logical` → `.and` / `.or` by operator; `comparison_operator` → `.comparison` → `.equal` … and also `.membership.in` / `.identity.is`, since Python parks `in` and `is` there. Own upstream kinds keep their own leaves: TS `update_expression` → `expression.update`, Rust `reference_expression` → `expression.reference`, `try_expression` → `expression.try`.

**The operator token's kind is derived, not restated.** The `operator` member of an `expression.binary.arithmetic.add` node is `operator.arithmetic.add` by construction — the leaf claim on the expression determines the token's classification. `roles.scm` therefore states the operator table once, as expression leaves; `@operator.*` token claims are generated from it (and are what the highlights projection uses). The duplication-agreement check from the earlier draft is unnecessary.

### 4.3 Markers and modifiers — members, not a bag

Declarations carry modifiers (`pub` `async` `static` `unsafe` `readonly` `abstract` `override` `public|private|protected` …) and parameters/properties carry markers (`?` optional, `...` rest, `mut`). The base tree draft had `modifiers?: ModifierSet` — a bag. That conflates the encodings the grammars use, and a set loses the distinctions between them. **The grammar-side encoding of markers is a work in progress** (the `_kw_*_marker` hidden rules, marker field naming, and form-splitting of structured modifiers are all still moving); this section fixes the *member form* per encoding **class**, not the current encoding. The examples below are illustrative of today's dumps and will drift; the classes and their member forms are the contract:

| Encoding in the grammar | Example | Member form |
|---|---|---|
| **Optional keyword** — `optional('async')` (today: fielded as `async_marker` via `_kw_async_marker`; encoding WIP) | TS `async` `static` `readonly` `declare` `abstract` `optional` `accessor`; Rust `mut` `unsafe` `move` `ref` | `async: boolean` — `BooleanKeywordRule` (bitflag spec) |
| **Exclusive choice of keywords** — a named node that is a `choice` of literals | TS `accessibility_modifier` = `'public' \| 'private' \| 'protected'`; `accessor_kind` = `'get' \| 'set' \| '*'` | `accessibility: 'public' \| 'private' \| 'protected'` — union-literal member |
| **Set of keywords** — `repeat1(choice(literals…))` | Rust `function_modifiers` = `repeat1(field('modifier', choice('async','default','const','unsafe', extern_modifier)))` | storage is the `BitflagRule` number; the **interface projects it to per-keyword booleans** (`async`, `const`, `unsafe`, `default`) plus `extern?: Modifier.Extern` — the consumer never sees whether a language encodes modifiers as separate optionals or one repeat |
| **Structured modifier** — a node with its own grammar | Rust `visibility_modifier` (`pub`, `pub(crate)`, `pub(in path)` — already form-split by sittir), `extern_modifier` (`extern "C"`) | node member with its own kind: `visibility?: Modifier.Visibility` |

**Rules.**

- **Keyword and punctuation markers are members, never kinds.** An anonymous token has no kind to claim; its meaning is its slot. Named modifier *nodes* (`visibility_modifier`, `accessibility_modifier`, `function_modifiers`, `extern_modifier`, `mutable_specifier`) are kinds under `modifier.*`, and their literal arms refine (`modifier.accessibility.public`).
- **Combinable → boolean member; exclusive → union-literal member or refinement.** `async` + `unsafe` + `const` co-occur, so they are booleans. `get`/`set` are exclusive, so `accessorKind` is a union member *and* `Declaration.Method.Getter` is a refinement narrowing it. A refinement is a named narrowing of a member (§5.5 rule 3); it is never the only place a modifier lives.
- **Keyword modifiers normalize to one bitflag member.** `modifiers: Modifier.Flags` — a number, per the bitflag spec — holds every keyword-shaped modifier the language has: `fn.modifiers & M.Async`, built as `{ modifiers: M.Pub | M.Async }`. Exclusive groups (accessibility) are bits under a group mask with at-most-one enforced by the checker and the builder. Structured modifiers (`visibility` with a path, `extern` with an ABI) set their presence bit *and* carry a node member for the payload. **Bit positions are assigned once, in the base vocabulary**; each grammar's `Modifier.Flags` enum is the winnowed subset with the same positions, so a flags value built against one grammar means the same thing everywhere it is representable. `M.Static` on Python does not exist — compile error — exactly as with winnowed kinds.
- **Base carries the union via a mixin**, per-grammar deltas winnow: `Base.Declaration.Function = Base.Modifiers & { name … }` where `Base.Modifiers = { modifiers: Modifier.Flags; visibility?: Modifier.Visibility; extern?: Modifier.Extern }` and `Base.Modifier.Flags` enumerates `Async Static Const Unsafe Abstract Readonly Override Declare Default Mutable Public Private Protected Pub …`. Python's delta narrows the enum to `{ Async }` — the member is the same, the representable bits differ.
- **Encoding → member is derived from rule shape, not authored.** `optional(literal)` → boolean; named `choice(literals)` → union literal; `repeat(choice(literals…))` → set storage projected to booleans; named node → node member. Whatever marker-field convention the grammar side settles on (`*_marker` today), the mapping is one rule in the overlay, never per-field captures in `roles.scm`. Consequence: **the encoding can keep changing without touching `roles.scm` or the type tree** — only the derivation moves. An authored capture is needed only where a marker's slot is unfielded or an upstream grammar's own name diverges from the member.

**Where a grammar can only reach a modifier by predicate**, the refinement is the claim and it sets the same bit. Python has no `static` keyword — `@staticmethod` is a decorator — so `(decorated_definition (decorator (identifier) @_d) (function_definition) @declaration.method.static) (#eq? @_d "staticmethod")` claims the refinement, and `Python.Declaration.Method.Static = Method & { modifiers: M.Static | … }`. TS reaches the bit by field, Python by predicate; `m.modifiers & M.Static` is correct on both.

**Declaring modifiers in `roles.scm`.** The declaration is one list member, `@modifiers`, captured at every modifier position of the claim — §4.4's multi-position form. Whether the grammar spreads modifiers over N separate optional fields (TS), packs them into one repeat (Rust), or has a single marker (Python), the *declaration* is the same shape and the *positions* are the only grammar-specific part:

```scheme
; TS — N separate optional marker fields → one list member
(method_definition
  accessibility_modifier: (_)?  @modifiers
  static_marker:          _?    @modifiers
  override_modifier:      (_)?  @modifiers
  readonly_marker:        _?    @modifiers
  async_marker:           _?    @modifiers) @declaration.method

; Rust — one repeat + one structured node → the same list member
(function_item
  visibility_modifier: (_)? @modifiers
  (function_modifiers modifier: (_)* @modifiers)?) @declaration.function

; Python — one marker
(function_definition async_marker: _? @modifiers) @declaration.function
```

The `roles` overlay then derives the typed members from the **items**, by the encoding-class rules above, with no further declaration:

| Item captured into `@modifiers` | Derived member |
|---|---|
| anonymous keyword token (`"async"`, `"static"`, `"mut"`) | bit named by the token text: `M.Async` |
| named node claimed `modifier.<x>` with literal arms (`accessibility_modifier`) | one bit per arm under a group mask: `M.Public` (mask `M.Accessibility`) |
| named node claimed `modifier.<x>` with structure (`visibility_modifier`, `extern_modifier`) | presence bit **and** a node member for the payload: `M.Pub` + `visibility: Modifier.Visibility` |

So the scm-level *bag* (a list of what's present) is real and is the right declaration primitive — scm has no way to say "bit" — and the bitflag is its normalized form. The two are one derivation apart. When the marker encoding changes, only the positions in these patterns move; the derivation, the type tree, and every consumer are untouched. Member names come from token text, so cross-language synonyms (if any arise) are handled by a vocabulary-level alias table, not per grammar.

Possible later shortcut, not adopted now: since the vocabulary already knows which tokens are `keyword.modifier.*` and which nodes are `modifier.*`, modifier membership could be *inferred* for any such child of a declaration claim, removing the position lists entirely. It is not adopted because the same token is not always a modifier — `static` is the declaration keyword in Rust `static_item` — and resolving that needs contextual precedence for token claims, which is more machinery than five explicit positions.

**Other bag-shaped things, same treatment:**

| Thing | Encoding | Member form |
|---|---|---|
| Parameter markers — `?`, `...`, `mut`, `self` | optional punctuation / keyword | bits in the same `modifiers` member: `M.Optional`, `M.Rest`, `M.Mutable` |
| Attributes / decorators | repeated named nodes | `attributes: Attribute[]` — a real list member; the nodes are kinds (`attribute`) |
| Labels on loops/blocks (Rust `'outer: loop`) | optional named node | `label?: Identifier.Label` |
| Accessor kind | exclusive literal choice | `accessorKind: 'get' \| 'set' \| '*'` + Getter/Setter refinements |
| Doc comments attached to declarations | trivia association | `doc?: Comment.Doc` — a trivia-attachment concern, adjacent to this spec; listed so it isn't modelled as a modifier |

### 4.4 Declaration forms — multiplicity

Standard scm already answers most of "how do we declare": a capture name may appear more than once in a pattern, a quantified node binds every match to its capture, and one node may carry several captures. `roles.scm` assigns each of those a fixed meaning:

| Form | Meaning | Type | Lift |
|---|---|---|---|
| `<slot> @m` — once, unquantified | scalar member `m` | the slot's accepted kinds | field on that slot, if the resolver says ambiguous |
| `<slot>+ @m` / `<slot>* @m` — quantified | **list** member `m`, in position order | `T[]` | same field on the repeat position (tree-sitter fields are multi-valued natively) |
| `@m` on **several positions in one pattern** | list member `m` drawn from all of them, in position order | `(T₁ \| T₂ …)[]` | **same field name applied at each position** — legal in tree-sitter, `childrenByFieldName` returns all |
| `@m` on the **same slot across alternative patterns** (form-split, or a `choice` slot written arm-by-arm) | one scalar member, union-typed | `T₁ \| T₂` | one field on the `choice` slot (slot-not-arm) |
| `(node) @m @ns.kind` — member and kind on one node | the node is member `m` of the enclosing claim **and** opens its own claim | — | — |
| two member captures on one position | **error** — one member per position per claim; naming is alias/rename, not double capture | — | — |
| `@_x` — underscore prefix | pattern-local helper for predicates; never a member | — | — |
| `(container (_)* @m)` — quantified capture **inside a child node** | list member `m` on the *enclosing* claim, read through the container | `T[]` | no field lift (the positions belong to the child rule); read-side projection only. The write side keeps the container — this is the list/wrapper model sittir already has, expressed as a claim |

Examples, against the current grammars:

```scheme
; multiple positions → one list member. TS heritage is two clauses under class_heritage:
(class_declaration
  (class_heritage
    (class_heritage_extends_clause (_) @heritage)
    (implements_clause type: (_) @heritage))) @declaration.class          ; heritage: (Expression | Type)[]

; quantified repeat → list member. Rust's modifier set (before projection to booleans, §4.3):
(function_item (function_modifiers modifier: (_)* @modifiers)) @declaration.function

; nested container → list member on the enclosing claim; container stays for the write side:
(function_definition (parameters (_)* @parameters)) @declaration.function   ; parameters: Parameter[]

; member + own claim on one node:
(call (argument_list) @arguments @expression.argument_list) @expression.call
```

Composites are **not** an scm concern. A member like `range: { start, end }` is two members (`start`, `end`); if a composite view is wanted, the type tree or a derived accessor assembles it. `roles.scm` binds positions to members and nothing else — keeping the file free of shape decisions is what keeps it dial-invariant.

One consequence for the type tree: the `parameters` member is the **list of parameters**, not the container node, wherever the grammar interposes a container — the nested-container form above is the normal way to declare it, and the container is what the builders construct. That is the existing sittir list model (`AssembledList`), reached from the claim rather than inferred.

**Every pattern executes at runtime.** Liftability is about field-makeability, not execution. A predicate-bearing pattern executes like any other, kind-addressed where it can't be fielded.

---

## 5. Contracts as a type tree

The vocabulary and its contracts are one authored artifact: a **type tree** whose shape mirrors the kind hierarchy. Per-grammar contracts are not authored — the `roles` overlay emits them as a **transformation** of the base tree, driven by that grammar's `roles.scm` claims and slot model.

### 5.1 Base tree (authored, `vocabulary.ts`) — generic over a grammar context

The base types are **generic in one parameter, the grammar context** `G`: a map from vocabulary kind to that grammar's concrete node types. Member types are written against vocabulary kinds and resolve through `G`:

```ts
export interface GrammarContext { [kind: string]: NodeData }        // vocabulary kind → node type(s)

export namespace Declaration {
  export type Function<G extends GrammarContext> = Modifiers<G> & {
    name?:           G['identifier']
    parameters:      G['declaration.parameter'][]
    typeParameters?: G['declaration.parameter.type'][]
    returnType?:     G['type']
    body?:           G['statement.block']
  }
  export type Method<G extends GrammarContext> = Function<G> & { receiver?: G['declaration.parameter.self'] }
  export type Parameter<G extends GrammarContext> = Modifiers<G> & { name: G['identifier'] | G['pattern']; type?: G['type']; default?: G['expression'] }
  export namespace Parameter {
    export type Optional<G extends GrammarContext> = Parameter<G> & { modifiers: M.Optional }
  }
  // …
}
export namespace Expression {
  export type Binary<G extends GrammarContext> = { left: G['expression']; operator: G['operator']; right: G['expression'] }
  export namespace Binary {
    export type Arithmetic<G extends GrammarContext> = Binary<G> & { operator: G['operator.arithmetic'] }
    export namespace Arithmetic {
      export type Add<G extends GrammarContext> = Arithmetic<G> & { operator: '+' }
    }
  }
}
```

Type aliases carry the shapes, TS namespaces carry the hierarchy (dotted type paths mirror dotted kind paths; alias and namespace of the same name merge). The flat machine form — `KindContracts<G>` keyed by dotted kind string, `Kind`, `Contract<K, G>` — is generated beside the namespaces from the same source.

Why a context parameter and not per-member parameters (`Function<I, P, B, …>`): the parameter list would grow with every member, instantiation would be unreadable, and nothing would tie `I` on `Function` to `I` on `Method`. One context ties every member on every kind to one table.

### 5.2 The grammar context is the claim map

`G` is not a new artifact. It is the **typed claim map**: for each vocabulary kind, the union of node types that claim it in that grammar's `roles.scm` — the vocabulary-keyed projection of the `KindMap` / `NamespaceMap` sittir already generates.

```ts
// rust — GENERATED from roles.scm claims
export type RustContext = {
  'identifier':                  Rust.Identifier | Rust.Metavariable      // both claim identifier in name slots
  'declaration.parameter':       Rust.Parameter
  'declaration.parameter.self':  Rust.SelfParameter
  'statement.block':             Rust.Block
  'expression':                  Rust.Expression                          // the supertype
  'operator.arithmetic':         '+' | '-' | '*' | '/' | '%'
  // … one entry per claimed kind; unclaimed kinds are ABSENT
}
```

- **Winnowing is at the context.** `G['declaration.trait']` on `PythonContext` is a type error at the point of use; `Base.Declaration.Trait<PythonContext>` fails to instantiate. The error names the missing kind — better than namespace omission.
- **Member kind narrowing is free.** `Rust.Declaration.Function['name']` is `Rust.Identifier | Rust.Metavariable` because that is what `RustContext['identifier']` says; no per-kind delta restates it.
- **Structural assignability across contexts is automatic.** TS compares instantiations structurally, so `Function<RustContext>` is assignable to `Function<BaseContext>` whenever each `RustContext[k]` is assignable to `BaseContext[k]` — which the base context guarantees by being the union over grammars. No assertion, no intersection needed for this direction.
- **The base context** is `BaseContext = { [k in Kind]: NodeData & { $kind: k } }` — the permissive closure; cross-language code is written against `Kind<BaseContext>`.

### 5.3 What `G` cannot say — the residual delta

Three of the four transform operations are expressed by `G`; the fourth is not, and refinements need one more thing:

| Operation | Where it lives |
|---|---|
| **Narrow member kinds** | `G` |
| **Winnow kinds** | absence from `G` |
| **Winnow members** (never present) | `G[k] = never` where the member is `G[k]`-typed, e.g. `typeParameters?: never[]` → treated as absent by the surface |
| **Narrow optionality** (Rust `body` required; Rust `receiver` required) | not expressible by `G` — but expressible by **one utility**: `Require<T, K>` |
| **Add members** (Rust `whereClause`, TS `accessorKind`) | **not expressible by `G`** — intersection |
| **Refinements** (`Add = Arithmetic & { operator: '+' }`) | intersections in the base itself; `G` supplies the operator union |

Optionality is a single transformation, not a per-kind rewrite:

```ts
type Require<T, K extends keyof T> = T & { [P in K]-?: T[P] }      // subtype of T by construction
type Absent <T, K extends keyof T> = T & { [P in K]?: never }      // winnowed member; `G[k] = never` gives this for free where the member is G-typed
```

So per-grammar types are the generic instantiation, one `Require` with a generated key list, and an intersection for additions only:

```ts
export namespace Declaration {
  export type Function = Require<Base.Declaration.Function<RustContext>, 'body'> & {
    whereClause?: Rust.WhereClause                                   // added: grammar field the base doesn't name
    visibility?:  Rust.VisibilityModifier
  }
  export type Method = Require<Base.Declaration.Method<RustContext>, 'body' | 'receiver'> & {
    whereClause?: Rust.WhereClause; visibility?: Rust.VisibilityModifier
  }
}
```

The key list is generated from the slot model (members whose slot is not `optional()` in the rule); `Require` is a named alias, so hover and errors show `Require<Base.Declaration.Method<RustContext>, "body" | "receiver">` rather than a mapped-type expansion. Both operands are subtypes of the base instantiation by construction, so assignability to `Base.Declaration.Method<BaseContext>` remains structural with no assertion.

**Rejected alternative — mapped types over member descriptors.** All four operations *can* be expressed uniformly by generating a per-grammar member table (`{ 'declaration.function': { body: { kind: 'statement.block', required: true }, … } }`) and computing every type with a mapped type. It is more uniform and emits less, but the shipped `.d.ts` then reads as mapped-type machinery on hover and in errors, and legible errors are the point of shipping types (`Python.Declaration.Trait` must fail with a message a person can read). Generic-plus-delta keeps the base readable, the context readable, and the delta tiny.

### 5.4 Groupings

Unions, never nominal supertypes — now with the prefix case falling out of the namespace: `Expression.Binary.Arithmetic` *is* the kind-set of its leaves (each leaf is assignable to it). Cross-cutting sets that have no shared parent remain explicit unions:

```ts
export type Callable = Declaration.Function | Declaration.Method | Declaration.Constructor | Declaration.Method.Getter | Declaration.Method.Setter | Declaration.Method.Trait
```

### 5.5 What remains to check

With subtyping by construction and completeness by compilation, the residual checks are grammar-level and base-level, none type-level in the shipped output:

1. **Totality / injectivity** — §3.2, over `grammar.json` + `roles.scm`.
2. **Delta narrowness** — `Delta<K> extends Partial<Base[K]>` per claimed kind; sittir's codegen test suite, catching base-permissiveness gaps.
3. **Refinement narrows something** — a leaf whose delta is `{}` is a naming error, not a kind; base-tree lint.
4. **Operator derivation** — §4.2; `operator.*` token kinds generated from expression leaves.

### 5.6 The normalized surface

The generated, vocabulary-level API — read side and build side — is the **normalized surface** (semantic, namespaced; the raw factories underneath are the *encoded* surface). Its goal is not a common surface across grammars — the surfaces differ wherever the languages do — but a **consistent API that is ergonomic per grammar**. Five conventions, all generated from the claims:

**0. Naming.** The vocabulary and `roles.scm` captures are `snake_case` (`declaration.parameter.self`, `expression.binary.comparison.less_equal`) — they are data, and they match SCIP and grammar spelling. The TypeScript surface is camelCase for builders and members (`d.parameter.self()`, `e.lessEqual`, `d.typedDefault`), PascalCase for types and enum bits (`Declaration.Parameter.Self`, `M.Async`). The mapping is mechanical and one-directional (snake → camel); nothing is authored twice.

SCIP compound names whose prefix is itself a kind are **nested rather than flattened**, so the hierarchy carries the qualifier and the API reads naturally: `SelfParameter` → `declaration.parameter.self` (`d.parameter.self()`, hoisted `d.self()`), `TypeParameter` → `declaration.parameter.type`, `TraitMethod` → `declaration.method.trait`, `EnumMember` → `declaration.enum.member`. The SCIP → path table is recorded in `vocabulary.ts` so provenance stays traceable; "verbatim" applies to the name, the path is sittir's.

**1. Hoisting.** A kind is reachable at every ancestor level where its leaf name is unique within that namespace; the full path always remains valid. Uniqueness is computed over the **base** vocabulary, so a hoisted name means the same thing in every grammar that has it.

| Full path | Hoists to | Why |
|---|---|---|
| `expression.binary.arithmetic.add` | `e.binary.add` | `add` also exists under `expression.assignment.compound` → not unique at `e.` |
| `expression.binary.comparison.less` | `e.less` | unique across `expression` |
| `expression.unary.not` | `e.not` | unique |
| `expression.call.member` | `e.call.member` | `member` collides with `expression.member` → stays |
| `literal.number.float` | `l.float` | unique |
| `declaration.method.static` | `d.method.static` | `static` also under `declaration.variable` |
| `declaration.parameter.typed_default` | `d.typedDefault` | unique; camelCase on the API |

**2. Coercion.** Builders accept the loosest input the slot can disambiguate, using the factory layer's existing `coerceTo*`. Rules, by the slot's accepted kinds:

| Input | Slot accepts | Coerces to |
|---|---|---|
| string | identifier family only | that identifier kind (`'owner'` → `identifier`; in a type slot → `identifier.type`) |
| string | string literal only | string literal |
| string | expression (both) | **identifier** — the documented default; a string *literal* in an expression slot is `l.string('…')` or the tagged form `` l`…` `` |
| number | literal / expression | `literal.number.integer` if integral, else `.float`. Grammars that spell integral floats distinctly (Rust `0.0`) take `l.float(0)` or the string `'0.0'` |
| boolean | literal / expression | `literal.boolean` |
| array | list slot | the list, elements coerced recursively |
| plain object | — | **not coerced.** Nested config objects name the *parameters* where naming the *builder* is shorter and unambiguous: `d.parameter('owner', 'str')`, not `{ name: 'owner', type: 'str' }`. The only object form on this surface is a builder's top-level `(config)` alternative |
| node | anything it fits | as is |

**3. Positional parameters.** Every builder has a positional form generated from the claim, and it follows the existing factory conventions (`$with`, `$trivia`) rather than a trailing options object:

- **Principals in claim order** — required members, in the order of their positions in the rule. Since modifiers precede the name in every grammar's rule, **modifiers are the first positional where a kind has them**, typed as the flags number and therefore optional-by-type: `d.method(M.Pub | M.Async, 'deposit', …)` and `d.method('deposit', …)` are both valid; a leading number is flags.
- **The last list-typed principal is a rest parameter.** A kind with one list member takes it spread in last position: `d.class('Account', ...members)`, `d.struct('Account', ...fields)`, `s.if(cond, ...consequence)`. A kind with more than one list member spreads only the last; earlier lists stay arrays: `d.function('total', [params], ...body)`.
- **Everything else is `$with`.** Optional members that are not principals are set on the built node with the existing fluent setters: `.$with.returnType('float')`, `.$with.receiver(d.self(M.Ref))`, `.$with.doc('A bank account.')`. No options object — which is also what makes the rest parameter possible.
- **Comments are `$trivia`.** Comments are not members and never appear in a body list; they attach to the node they precede or follow: `s.return(…).$trivia(b.comment('sum balances'))`. The existing `$trivia(...args)` rebuilds the node with trivia attached. `doc` is different: it is a *member* on the claim (`@doc`), so it is `$with.doc(…)` — realized as a doc comment (trivia) on TypeScript and Rust and as the docstring statement on Python, the encoding-class inversion again.

The `(config)` form remains for programmatic construction; the positional form is the ergonomic one. **Nested config objects are not part of the surface**: every slot that would take one instead takes the result of a named builder. Naming the builder (`d.typedDefault('balance', 'float', 0.0)`) picks the kind explicitly, which is what the object's keys were doing implicitly and less legibly.

**4. Modifiers are bitflags** (§4.3): `{ modifiers: M.Pub | M.Async }` on build, `node.modifiers & M.Async` on read, with `M` the grammar's winnowed enum over base-assigned bit positions.

**5. Escape hatch.** Where the vocabulary has no coverage, the encoded surface and the existing snippet parser are one step away and interleave freely: a `T.*` factory result or a `` from`…` `` node fits any slot that accepts its kind. The normalized surface is a layer, not a wall.

### 5.7 Consumer surface (read side — sketch; not built out yet)



```ts
roles.is(node, 'declaration.function')                          // claim check (kind + where)
roles.as(node, 'declaration.function')                          // Rust.Declaration.Function | undefined (per-grammar) — or Base.… via the base entry point
roles.find(root, 'expression.binary.arithmetic')                // prefix kind-set: every arithmetic leaf
e.binary.add(left, right)                                       // normalized surface; operator baked in; hoisted name
```

**Deliberately absent:** semantic members (`isExported`, `resolvedType`); per-language *authored* contracts (a grammar claims or doesn't — its tree is derived); nominal supertypes; a forced-common builder surface.

**Versioning:** base tree — optional member additions and new leaves are minor; required members, member removals, kind renames are major. Per-grammar trees are outputs and carry no version of their own.

## 6. Runtime model

```
parse → one QueryCursor pass over shape.scm ++ roles.scm ++ user.scm → flat captures → materialize NodeData
```

- Native thin layer is grammar-agnostic and role-agnostic: it knows captures. Predicates evaluate in the binding layer, as they do everywhere tree-sitter is embedded.
- Range-scoped (`ts_query_cursor_set_byte_range`); materialize per subtree on demand.
- `NodeData` stays plain objects; the producer changes from per-grammar `wrap.ts` (`rust` 11.8K lines, `typescript` 12.9K, `python` 8.3K — 33K generated) to `shape.scm` + fixed executor.
- **User-pluggable:** projects ship their own `.scm` (house conventions, extra contracts) into the same pass. No regeneration. Patterns wanting an unliftable field run kind-addressed.
- `shape.scm` is the lifter's inverse: rule → total pattern, one per rule, every slot captured, quantifiers mirroring rule optionality, `field:` prefixes where the resolver emitted fields.

### 6.1 Totality (the risk)
Query matching is existential; readers must be total. Mandatory: `shape.scm` quantifiers mirror rule optionality; dedicated ERROR/MISSING pass; **differential harness vs `wrap.ts` on a corpus including malformed files** before the executor replaces anything.

### 6.2 ast-grep seam
`SgNode` → materialization must share the tree (one process via `ast_grep_core`). JSSG integration becomes load-bearing for the read layer.

### 6.3 Read/write asymmetry
scm describes what to read (selective, slot-keyed). Rule IR describes what to write (total, carries optionality/separators/spacing). Builders stay Rule-IR-generated; the `roles` overlay is scaffolding over them.

---

## 7. Worked patterns — the measured delta

Computed against the current patched dumps (hidden symbols followed, so fields surfacing through `_call_signature`, `_parameter_name`, `_variable_declarator_arm*` count as present). Kind claims are always stated; member captures only on the delta.

**Rust** — declaration layer fully fielded upstream. Delta: three aliases, one binding name.

```scheme
(function_item) @declaration.function
(impl_item (declaration_list (function_item) @declaration.method))
(trait_item (declaration_list (function_item) @declaration.method.trait))
(struct_item) @declaration.struct   (enum_item) @declaration.enum   (trait_item) @declaration.trait
(parameter) @declaration.parameter  (self_parameter) @declaration.parameter.self
(let_declaration (_) @name) @declaration.variable            ; alias: upstream field is `pattern`
(field_expression (_) @object (_) @property) @expression.member   ; alias: upstream `value` / `field`
(call_expression) @expression.call  (binary_expression) @expression.binary
(lifetime) @identifier.lifetime      (primitive_type) @type.primitive
(match_expression) @statement.match  ; not `switch` — a distinction, not a synonym
(integer_literal) @literal.number.integer   (float_literal) @literal.number.float
```

**TypeScript** — form-split kinds carry their fields through the hidden `_…` rule. Delta: two aliases plus the literal-predicate lifts.

```scheme
(function_declaration) @declaration.function
(method_definition) @declaration.method
((method_definition) @declaration.method.getter (#eq? accessor_kind "get"))   ; literal slot → lifts
((method_definition (property_identifier) @name) @declaration.constructor (#eq? @name "constructor"))
(required_parameter (_) @name) @declaration.parameter        ; alias: upstream `pattern`
(optional_parameter (_) @name) @declaration.parameter.optional
(for_in_statement (_) @pattern) @statement.for.in            ; refinement; alias: upstream `left`
(call_expression_call) @expression.call  (call_expression_member) @expression.call.member   ; forms are distinct kinds → distinct leaves
(variable_declarator_arm2) @declaration.variable  (variable_declarator_arm1) @declaration.variable.pattern
```

**Python** — the one genuine *missing* name in three grammars, plus aliases from Python's `left/right` habit.

```scheme
(function_definition) @declaration.function
(class_definition (block (function_definition) @declaration.method)) @declaration.class
((function_definition (identifier) @name) @declaration.constructor (#eq? @name "__init__"))
(typed_parameter (_) @name) @declaration.parameter           ; MISSING upstream; slot kinds disjoint
                                                             ; from `type` → kind-addressed, no lift
(default_parameter) @declaration.parameter
(attribute (_) @property) @expression.member                 ; alias: upstream `attribute`
(assignment (_) @name (_) @value) @declaration.variable      ; alias: upstream `left` / `right`
(for_statement (_) @pattern (_) @value) @statement.for       ; alias: upstream `left` / `right`
(call) @expression.call  (binary_operator) @expression.binary
(boolean_operator) @expression.binary.logical   (comparison_operator) @expression.binary
(not_operator (_) @operand) @expression.unary.not     ; refinement, not merged into unary
```

Two findings worth recording. First, **genuine missing names are rare** (one, across three grammars): upstream authors fielded what needed fielding, and the resolver reconstructs their policy. Second, **aliases cluster by grammar idiom** — Python's `left/right` for anything binary-shaped, Rust's `value/field` on member access — so canonical aliases are a per-grammar handful, not per-rule noise.

## 8. Corrections to prior specs

| Prior | Correction |
|---|---|
| SCIP vocabulary spec: adopt `SyntaxKind` for the occurrence axis | **Dropped.** Occurrence facts are (kind, member) and stated once. `SymbolInformation.Kind` retained verbatim as `declaration.*`; other namespaces sittir-extended. `SyntaxKind` survives only as an optional derived projection |
| SCIP spec: no invented taxonomy | Amended: **namespaced extension is sanctioned**; groupings still never nominal |
| SCIP spec: expansion layer; derived shipped role map | Deleted / demoted to build-time view. `roles.scm` is SSOT and executes directly |
| v1 §2: member capture ⇒ field made | Member capture ⇒ member declared; field iff resolver says ambiguous |
| v1 §6: `typed_parameter` forces a field by discrimination | Wrong — slot kinds disjoint; kind-addressed. `keyword_argument` is the ambiguous case |
| v1: sittir-only changes as grammar patches | Split: field lift = override; everything else = `roles` overlay (`OVERLAY_CHAIN` + `'roles'`) |
| v1 capture forms `@syntax.*`, `@Kind.member` | `@namespace.kind` on nodes, bare `@member` on slots, innermost-claim scoping |
| Library spec: role discrimination is the second ambiguity clause | Unchanged, restated: two same-kind slots carrying different **members** |
| v1/v2-draft: every member restated in `roles.scm` | **Delta principle** — members stated only where missing, aliased, or renamed; grammar fields are members by default |
| v2-draft drafts: `match`→`switch`, `integer`/`float`→`number`, `true`/`false`→`boolean` | **Conflation.** Kinds are hierarchical; refinements preserved; parents exist where some grammar uses them; prefix = kind-set |
| v2-draft: leaf names taken verbatim from highlights.scm | Reverted. Names are sittir's throughout; highlights/tags for authored grammars are **generated projections** |
| v2-draft: highlights.scm as the coverage inventory | Wrong — highlights collapses distinctions the vocabulary must preserve, so an inventory read from it is already coarser than the grammar. **Coverage is the grammar's own kind list**; totality + within-grammar injectivity are checked against `grammar.json`. highlights consulted only for anonymous-token grouping, predicate classes, contextual refinements |
| Refinements the grammar lacks (method, `true`/`false`, line/block comment) authored as `refines()`/`alias()` calls | Authored as **claims in `roles.scm`**; realized as `alias()` split (override) or the existing `refines` overlay, by dial; liftability classified by discriminator (context / literal arm / token text / free-text predicate) |
| Binary/unary refined only where a grammar already split them | Refined to **the operator** (class as intermediate level) so callers never select the operator; `operator.*` token kinds derived from expression leaves; `.boolean` → `.logical` |
| v2 §5: hand-written `KindContracts` interface per kind | **Type tree** (`vocabulary.ts`: namespaces for hierarchy, aliases for shape), **generic over a grammar context** `G` = the typed claim map; per-grammar contracts are `Base<G> & Delta` with the delta reduced to optionality + additions |
| §5.3 draft: generated `extends Base` assertions as the checker | Unnecessary — instantiation over `G` plus intersection makes subtyping structural/syntactic; completeness is the generated materializer compiling. Only delta-narrowness survives, as a codegen-suite test |
| §5.3 draft: whole-type deltas per kind | Member kinds move into `G`; optionality is one utility (`Require<T, K>`) with a generated key list; the intersection carries additions only. Per-member generics (`Function<I,P,B,…>`) and descriptor mapped types considered and rejected |
| Base tree: `modifiers?: ModifierSet` bag | **Flat members** via a `Modifiers` mixin; boolean for combinable keywords, union-literal for exclusive choices, per-keyword booleans projected from Rust's `function_modifiers` set, nodes for structured modifiers; `*_marker` fields mapped by rule; bag is a derived view |
| §4.1: free-text predicates never liftable | **Finite text sets are liftable** via keyword promotion (`word` extraction) + arm split with the token aliased back to `identifier`; only regex predicates sit at the lexical floor |
| v2 drafts: `required_parameter`/`optional_parameter`, `call_expression_*` forms, `import`/`import_from`, `static_item`/`let_declaration` sharing leaves | Injectivity violations; refined (`declaration.parameter.optional`, `expression.call.member`/`.template`, `statement.import.from`, `declaration.variable.static`) |
| v2-draft: alias vs rename as distinct authoring | Same capture; the **package dial** decides realization (overlay alias vs override rename). `roles.scm` is dial-invariant |
| v2-draft interfaces: `members` for declaration bodies | `body` — chosen by upstream convergence, which now governs the member vocabulary |
| v2-draft §7: TS form-split kinds "have no fields" | Dump artifact — fields live on the hidden `_call_expression_call` etc. and surface on the alias kind |

Open item (unchanged): structural facts (`sepBy`, bitflags) as anchored sequence patterns vs provenance sidecar. Litmus test stands.

---

## 9. Verification tasks

1. **Read-side differential** (gates everything): query-materialized vs `wrap.ts`-materialized, node-for-node, all corpora including malformed files.
2. **Lift differential:** `roles.scm` on pre-/post-lift parses; post-lift matches everywhere pre-lift did, field-precise.
3. **Resolver gating:** `typed_parameter @name` lifts no field; `keyword_argument @name/@value` does (or is confirmed present).
4. **Scoping:** nested `@name` binds to the innermost claim; unscoped member capture is rejected.
5. **Vocabulary validation:** unknown `@namespace.kind` rejected at lift; `(ext)` additions accepted.
5a. **Totality + injectivity:** every visible named kind in `grammar.json` is claimed or explicitly unclaimed; no two kinds in one grammar share a leaf. Both computed mechanically; both gate the build.
6. **Literal-predicate lift:** TS `accessor_kind "get"` lifts; `__init__` does not.
6b. **Operator derivation:** `operator.*` token kinds are generated from expression leaves; the highlights projection consumes the generated table. `binary.arithmetic.add(l, r)` is emitted by the `roles` overlay and round-trips to a `+` node.
6e. **Multiplicity:** TS `heritage` reads both clauses in order as one list; Rust `modifiers` repeat and Python nested `parameters` read as lists; a pattern with two member captures on one position is rejected; `@_x` helpers never appear in generated types; a multi-position list member lifts to the same field name at every position and `childrenByFieldName` returns them all.
6f. **Modifier declaration uniformity:** the TS multi-field, Rust repeat, and Python single-marker `@modifiers` declarations all produce the same member forms through the same derivation; changing a marker's field name in the grammar changes one position in one pattern and nothing downstream.
6d. **Modifier projection:** Rust `pub const unsafe fn` reads as `{ visibility: {…}, const: true, unsafe: true, async: false }`; TS `public static async` reads as `{ accessibility: 'public', static: true, async: true }`; Python `@staticmethod` claims `Method.Static` with `static: true`; a `Base.Declaration.Method` consumer reading `.static` compiles and is correct on all three.
6c. **Keyword-promotion lift:** Python `__init__` realized as an arm split; `(function_definition name: (identifier))` upstream queries still match the constructor's name node; `roles.find('declaration.constructor')` identical to the predicate realization.
6a. **Refinement realization:** `literal.boolean.true`/`.false` realized both ways on Rust — as an `alias()` split (node-types gains `true`/`false`; parent preserved; ast-grep `kind: boolean_literal` still matches) and as a `refines` overlay (node-types unchanged; `$kind` refined) — with identical `roles.find` results. `declaration.method` vs `declaration.method.trait` on Rust demonstrates the shared-`declaration_list` duplication cost and defaults to overlay.
7. **Overlay chain:** `roles` overlay emits `<Grammar>.d.ts` as `Base & Delta` per claimed kind; a required member with no binding makes the generated materializer fail to compile; `Python.Declaration.Trait` does not typecheck; a deliberately widened delta is caught by the codegen-suite narrowness test, not by the shipped types.
7a. **Transform fidelity:** Rust `Function.body` is required and `name` is `Identifier | Identifier.Metavariable`; Python gains `Parameter.Typed`; TS `Method` gains `accessorKind`; a `Base.Declaration.Function` consumer compiles unchanged against all three.
8. **User scm:** project-supplied pattern adds a claim with no regeneration.
9. **Seam:** `SgNode` → materialization shares the tree.

## 10. Not covered
Symbol monikers; `SymbolRole` access bits; injections; write-side scm (no RHS — shape rewrites and entry declaration stay in `grammar.sittir.ts`); automatic promotion of checker disagreements.

---

## Appendix A — Side-by-side: one program, three grammars

The same small program written for each grammar, followed by (1) the claims each construct receives under the drafted `roles.scm` files, (2) the per-grammar contract deltas for one kind, and (3) consumer code written once against `Base` and once against a grammar. Node kinds are those of the current patched grammars.

### A.1 Source

**Python**
```python
from dataclasses import field

class Account:
    """A bank account."""
    rate: float = 0.02

    def __init__(self, owner: str, balance: float = 0.0):
        self.owner = owner
        self.balance = balance

    @staticmethod
    def zero(owner: str) -> "Account":
        return Account(owner)

    @property
    def is_overdrawn(self) -> bool:
        return self.balance < 0

    async def deposit(self, amount: float) -> float:
        if amount <= 0:
            raise ValueError(f"bad amount: {amount}")
        self.balance += amount
        return self.balance

def total(accounts: list[Account]) -> float:
    # sum balances
    return sum(a.balance for a in accounts if not a.is_overdrawn)
```

**TypeScript**
```ts
import { round } from "./math";

/** A bank account. */
export class Account {
  static rate = 0.02;
  constructor(public readonly owner: string, private balance: number = 0) {}

  static zero(owner: string): Account { return new Account(owner); }

  get isOverdrawn(): boolean { return this.balance < 0; }

  async deposit(amount: number): Promise<number> {
    if (amount <= 0) throw new Error(`bad amount: ${amount}`);
    this.balance += amount;
    return this.balance;
  }
}

export function total(accounts: Account[]): number {
  // sum balances
  return accounts.filter(a => !a.isOverdrawn).reduce((s, a) => s + a.balance, 0);
}
```

**Rust**
```rust
use crate::math::round;

/// A bank account.
pub struct Account { pub owner: String, balance: f64 }

impl Account {
    pub const RATE: f64 = 0.02;

    pub fn new(owner: String, balance: f64) -> Self { Self { owner, balance } }
    pub fn zero(owner: String) -> Self { Self::new(owner, 0.0) }

    pub fn is_overdrawn(&self) -> bool { self.balance < 0.0 }

    pub async fn deposit(&mut self, amount: f64) -> Result<f64, String> {
        if amount <= 0.0 { return Err(format!("bad amount: {amount}")); }
        self.balance += amount;
        Ok(self.balance)
    }
}

pub fn total(accounts: &[Account]) -> f64 {
    // sum balances
    accounts.iter().filter(|a| !a.is_overdrawn()).map(|a| a.balance).sum()
}
```

### A.2 Claims, construct by construct

Column entries are `node kind → claimed kind`, with the discriminator class where the grammar lacks the distinction. **—** means the language has no such construct and the kind is winnowed from that grammar's tree (a compile error to reference).

| Construct | Python | TypeScript | Rust | Notes |
|---|---|---|---|---|
| Import | `import_from_statement → statement.import.from` | `import_statement → statement.import` | `use_declaration → statement.import` | synonym across grammars; Python's `from` form is a distinct upstream kind → refined |
| Doc on the type | `expression_statement(string)` in first body position → `literal.string.docstring`, bound as `@doc` | `comment` matching `^/\*\*` → `comment.block.doc` (token-text refinement) | `line_comment(line_comment_doc_outer)` → `comment.line.doc` (sittir form-split) | three routes, one member: `doc` on the declaration. Python's is not a comment at all |
| The type | `class_definition → declaration.class` | `class_declaration → declaration.class` | `struct_item → declaration.struct` **and** `impl_item → declaration.impl` | Rust separates data from behaviour; the vocabulary keeps both kinds. "Type with methods" is the `TypeDecl` union, not a forced `class` |
| Exported / visible | — (module-level is public by convention) | `export_statement` wrapper → context-derived `exported: true` on the wrapped declaration | `visibility_modifier → modifier.visibility.pub`, member `visibility` | not conflated: `exported` and `visibility` are distinct members; "is public API" is a consumer helper |
| Class constant | `assignment` with annotation in class body → `declaration.field` | `public_field_definition` with `static_marker` → `declaration.field`, `static: true` | `const_item` in impl → `declaration.constant`, `visibility` | |
| Constructor | `function_definition` named `__init__` → `declaration.constructor` (finite text → keyword-liftable) | `method_definition` named `constructor` → `declaration.constructor` (finite text → liftable) | — by the language; `fn new` is convention. A project can claim it from `user.scm`: `((function_item name: (identifier) @name) @declaration.constructor (#eq? @name "new"))` | the language-absent rule vs user-pluggable scm, side by side |
| Constructor parameter properties | — | `required_parameter` with `accessibility_modifier` / `readonly_marker` → `declaration.parameter` with `accessibility: 'public'`, `readonly: true` | — | modifiers on a parameter: same `@modifiers` derivation as on declarations |
| Static / associated | `@staticmethod` decorator → `declaration.method.static` (predicate; sets `M.Static`) | `method_definition` with `static_marker` → `declaration.method`, `M.Static` | `function_item` in impl body whose first parameter is not `self_parameter` → `declaration.method.static` (structural context) | three discriminator classes, one bit. Rust *has* the method/associated-fn distinction; its grammar doesn't |
| Getter | `@property` decorator → `declaration.method.getter` (predicate) | `accessor_kind: "get"` → `declaration.method.getter` (literal arm → liftable) | — (`is_overdrawn(&self)` is a plain `declaration.method`) | `Rust.Declaration.Method.Getter` does not exist |
| Async method | `async_marker` → `M.Async` | `async_marker` → `M.Async` | `function_modifiers` item `"async"` → `M.Async` | one `@modifiers` list declaration each; one bit, same position everywhere |
| Receiver | `parameters . (identifier)` anchored → `declaration.parameter.self` | — (`this` is implicit) | `self_parameter` (`&mut self`) → `declaration.parameter.self`, bound as `@receiver` | |
| Typed parameter with default | `typed_default_parameter → declaration.parameter.typed_default` `{name,type,default}` | `required_parameter` `{pattern→name, type, default}` | `parameter` `{name: pattern, type}` (no defaults in the language) | Python's four parameter kinds are four leaves (injectivity); `Rust.Declaration.Parameter.default` is winnowed |
| `if` | `if_statement → statement.if` | `if_statement → statement.if` | `if_expression → statement.if`; also a member of the `expression` supertype | Rust's is expression-valued: recorded as supertype membership in the delta, not a different kind |
| Raise / throw | `raise_statement → statement.throw` | `throw_statement → statement.throw` | — (`return Err(..)`; no exceptions) | winnowed on Rust |
| Interpolated string | `string` with `string_start` `f` → `literal.string.f`; `interpolation → expression.interpolation` | `template_string → literal.template`; `template_substitution → expression.interpolation` | `macro_invocation → expression.macro_invocation`; the `{amount}` inside `token_tree` is not parsed | Rust's interpolation is invisible to the grammar — honestly unclaimed, not faked |
| `+=` | `augmented_assignment → expression.assignment.compound.add` | `augmented_assignment_expression → …compound.add` | `compound_assignment_expr → …compound.add` | leaf per operator; `operator.assignment.add` token kind derived |
| `<`, `<=` | `comparison_operator → expression.binary.comparison.less` / `.less_equal` | `binary_expression → …comparison.less` | `binary_expression → …comparison.less` | Python's structural split claims the class; all three reach the same leaves |
| `not` / `!` | `not_operator → expression.unary.not` | `unary_expression "!" → expression.unary.not` | `unary_expression "!" → expression.unary.not` | structural kind vs literal arm; same leaf |
| Method call | `call` whose `function` is `attribute` → `expression.call.member` (context) | `call_expression_member → expression.call.member` (sittir form kind) | `call_expression` whose `function` is `field_expression` → `expression.call.member` (context) | one grammar has the kind, two reach it by context |
| Path call `Self::new(..)` | — | — | `call_expression` whose `function` is `scoped_identifier` → `expression.call.path` | Rust-only leaf under `expression.call` |
| Lambda | — in this file (see next row) | `arrow_function → expression.lambda` | `closure_expression → expression.lambda` | synonym leaf |
| Comprehension | `generator_expression → expression.comprehension.generator` | — | — | Python-only kind; the vocabulary is union-shaped |
| Member access | `attribute → expression.member` `{object, attribute→property}` | `member_expression → expression.member` | `field_expression → expression.member` `{value→object, field→property}` | two aliases, one member set |
| Float literal | `float → literal.number.float` | `number → literal.number` | `float_literal → literal.number.float` | TS claims the parent; the prefix kind-set `literal.number` matches all three |
| Line comment | `comment → comment.line` | `comment` matching `^//` → `comment.line` | `line_comment(line_comment_regular_dslash) → comment.line` | |

Every row is one vocabulary kind reached by whatever the grammar offers — kind, field, context, literal arm, token text, predicate — and the consumer never sees which.

### A.3 One kind, three deltas

`declaration.method` for `deposit`. The base is the permissive union; each grammar's delta is what it actually does.

```ts
// Base — generic over the grammar context; member kinds resolve through G
Base.Declaration.Method<G> = Base.Modifiers<G> & {
  name?: G['identifier']; parameters: G['declaration.parameter'][]; typeParameters?: G['declaration.parameter.type'][]
  returnType?: G['type']; body?: G['statement.block']; receiver?: G['declaration.parameter.self']; doc?: G['doc']
}

// Per grammar: the context does the narrowing; the delta says only what G cannot
Python.Declaration.Method     = Require<Base.Declaration.Method<PythonContext>, 'name' | 'body'>
                                                          // PythonContext['doc'] = Literal.String.Docstring; M = { Async, Static }
TypeScript.Declaration.Method = Require<Base.Declaration.Method<TypeScriptContext>, 'name' | 'body'>
                                & { accessorKind?: 'get' | 'set' | '*' }      // added: grammar field
                                                          // no 'declaration.parameter.self' in TypeScriptContext → receiver absent
Rust.Declaration.Method       = Require<Base.Declaration.Method<RustContext>, 'body' | 'receiver'>
                                & { whereClause?: Rust.WhereClause; visibility?: Rust.VisibilityModifier; extern?: Rust.ExternModifier }
                                                          // RustContext['identifier'] = Identifier | Metavariable; M = { Async, Const, Unsafe, Default, Pub }
```

Each is a generic instantiation over the grammar's context plus a residual intersection, so each is assignable to `Base.Declaration.Method<BaseContext>` with no assertion (§5.2–5.3). `TypeScript.Declaration.Method.receiver` is `never`; `Rust.Declaration.Method.receiver` is required — both are facts about the language, expressed as types.

### A.4 Consumers

Written once against `Base`, correct on all three parses:

```ts
const asyncMethods = (root: NodeData) =>
  roles.find(root, 'declaration.method').filter(m => m.modifiers & M.Async)   // Base.Declaration.Method[]

const staticLike = (root: NodeData) =>
  roles.find(root, 'declaration.method.static')                          // decorator predicate (py), marker field (ts),
                                                                         // structural no-receiver (rs) — one query

const floats = (root: NodeData) => roles.find(root, 'literal.number')     // prefix kind-set: .float leaves and TS's parent
const adds   = (root: NodeData) => roles.find(root, 'expression.assignment.compound.add')
```

Written against a grammar, with what that grammar actually has:

```ts
const pubAsync = (root: NodeData) =>
  roles.find<Rust>(root, 'declaration.method')
       .filter(m => m.modifiers & (M.Async | M.Pub))                          // M.Pub exists only on Rust's enum

const docstrings = (root: NodeData) =>
  roles.find<Python>(root, 'declaration.class').map(c => c.doc?.text)              // doc is a docstring only on Python

// roles.find<Rust>(root, 'declaration.method.getter')   → compile error: winnowed
```

And the build side, from the `roles` overlay:

```ts
build.expression.assignment.compound.add(lhs, rhs)          // operator baked in; renders `+=` in each grammar's syntax
d.method(M.Async, 'deposit', [params], ...body)                  // flags first, last list spread, the rest via $with
```

### A.5 What this file exercises, by mechanism

| Mechanism | Rows |
|---|---|
| Kind claims on upstream kinds (delta = nothing) | import, `if`, `+=`, member access, float, line comment |
| Alias captures (upstream field kept) | `attribute → property`, `value/field → object/property`, `pattern → name` |
| Refinements by context | Rust method/associated, Python method call, Rust member call, Rust path call |
| Refinements by literal arm (liftable) | TS getter, `!`, `<` |
| Refinements by token text (liftable where separable) | Python f-string, TS doc comment |
| Refinements by finite text (keyword-liftable) | `__init__`, `constructor` |
| Refinements by free-text predicate (overlay only) | `@staticmethod`, `@property` |
| `@modifiers` list → bitflags | async, static, readonly, accessibility, visibility (bit + node) |
| Winnowed kinds / `never` members | Rust getter/throw/default, TS receiver, Python visibility |
| User-pluggable claim | Rust `fn new` as constructor |
| Honestly unclaimed | Rust `format!` interpolation |

---

## Appendix B — Building the examples on the normalized surface

Per-grammar `build` is the normalized surface (§5.6): hoisted names, coercion, positional principals, bitflag modifiers. `M` is the grammar's modifier enum. The mapping tables show where each config lands on the encoded surface (`T.*`, the existing factories).

### B.1 Python

```ts
import { build as b, M, render } from '@sittir/python/roles'
const { declaration: d, expression: e, statement: s, literal: l } = b

const account = d.class('Account',
  d.field('rate', 'float').$with.value(0.02),

  d.constructor([ d.self(), d.typed('owner', 'str'), d.typedDefault('balance', 'float', 0.0) ],
    e.assign(e.member('self', 'owner'),   'owner'),                        // strings → identifiers in expression slots
    e.assign(e.member('self', 'balance'), 'balance'),
  ),

  d.method.static('zero', [d.typed('owner', 'str')],                       // emits @staticmethod
    s.return(e.call('Account', 'owner')),                                   // call: (function, ...args)
  ).$with.returnType(l.string('Account')),

  d.getter('is_overdrawn', [d.self()],                                      // emits @property
    s.return(e.less(e.member('self', 'balance'), 0)),
  ).$with.returnType('bool'),

  d.method(M.Async, 'deposit', [d.self(), d.typed('amount', 'float')],     // flags first, by type
    s.if(e.lessEqual('amount', 0),
      s.throw(e.call('ValueError', l.f('bad amount: ', e.interpolation('amount'))))),
    e.assign.add(e.member('self', 'balance'), 'amount'),
    s.return(e.member('self', 'balance')),
  ).$with.returnType('float'),
).$with.doc('A bank account.')                                               // member `doc` → docstring statement

const total = d.function('total', [d.typed('accounts', e.subscript('list', 'Account'))],
  s.return(e.call('sum',
    e.generator(e.member('a', 'balance'), e.forIn('a', 'accounts'), e.ifClause(e.not(e.member('a', 'is_overdrawn')))),
  )).$trivia(b.comment('sum balances')),                                     // comment attaches to the statement
).$with.returnType('float')

render(b.module(s.import.from('dataclasses', 'field'), account, total))
```

| Normalized | → encoded (`T.*`) |
|---|---|
| `d.constructor([params], ...body)` | `FunctionDefinition({ name: Identifier('__init__'), parameters: Parameters([SelfParameter…]), body })` — name fixed by the refinement |
| `d.method.static(…)` / `d.getter(…)` | `DecoratedDefinition({ decorators: [Decorator(Identifier('staticmethod' \| 'property'))], definition })` — predicate refinement inverted |
| `{ modifiers: M.Async }` | `FunctionDefinition({ asyncMarker: true })` — bit → optional keyword |
| `d.typed('owner', 'str')` / `d.typedDefault('balance', 'float', 0.0)` | `TypedParameter({ name, type })` / `TypedDefaultParameter({ name, type, value })` — the builder names the leaf; nothing is inferred from keys |
| `.$with.doc('A bank account.')` | first `ExpressionStatement(String)` in `body` — docstring claim inverted, anchored position |
| `.$trivia(b.comment(…))` | leading trivia on the node — the existing `$trivia(...args)` rebuild |
| `e.less(a, b)` | `ComparisonOperator({ left, operators: ['<'], right })` |
| `e.assign.add(a, b)` | `AugmentedAssignment({ left, operator: '+=', right })` |

### B.2 TypeScript

```ts
import { build as b, M, render } from '@sittir/typescript/roles'
const { declaration: d, expression: e, statement: s, literal: l, type: t } = b

const account = d.class(M.Export, 'Account',                                // Export is a bit on TS (wraps in export_statement)
  d.field(M.Static, 'rate').$with.value(0.02),

  d.constructor([
    d.parameter(M.Public | M.Readonly, 'owner', 'string'),                  // parameter properties: same bits
    d.parameter(M.Private, 'balance', 'number').$with.default(0),
  ]),

  d.method(M.Static, 'zero', [d.parameter('owner', 'string')],
    s.return(e.new('Account', 'owner')),
  ).$with.returnType('Account'),

  d.getter('isOverdrawn', [], s.return(e.less(e.member(e.this(), 'balance'), 0))).$with.returnType('boolean'),

  d.method(M.Async, 'deposit', [d.parameter('amount', 'number')],
    s.if(e.lessEqual('amount', 0), s.throw(e.new('Error', l.template('bad amount: ', e.interpolation('amount'))))),
    e.assign.add(e.member(e.this(), 'balance'), 'amount'),
    s.return(e.member(e.this(), 'balance')),
  ).$with.returnType(t.generic('Promise', 'number')),
).$with.doc('A bank account.')                                               // member `doc` → /** */ trivia

const total = d.function(M.Export, 'total', [d.parameter('accounts', t.array('Account'))],
  s.return(
    e.call.member(
      e.call.member('accounts', 'filter', e.lambda(['a'], e.not(e.member('a', 'isOverdrawn')))),
      'reduce', e.lambda(['s', 'a'], e.binary.add('s', e.member('a', 'balance'))), 0),
  ).$trivia(b.comment('sum balances')),
).$with.returnType('number')

render(b.module(s.import(['round'], './math'), account, total))
```

| Normalized | → encoded |
|---|---|
| `M.Export` on a declaration | `ExportStatement({ declaration })` — presence bit realized as a wrapper (context member inverted) |
| `M.Static \| M.Async \| M.Readonly` | `staticMarker: true, asyncMarker: true, readonlyMarker: true` |
| `M.Public` (group `M.Accessibility`) | `accessibilityModifier: AccessibilityModifier('public')` — at most one bit in the group; builder throws otherwise |
| `d.getter(…)` | `MethodDefinition({ accessorKind: 'get' })` |
| `e.call.member(obj, name, ...args)` | `CallExpressionMember({ function: MemberExpression({ object, property }), arguments })` — the form kind is the factory |
| `e.new(fn, ...args)` | `NewExpression({ constructor: fn, arguments })` |
| `'number'` in a type slot | `PredefinedType('number')`; `'Account'` → `TypeIdentifier('Account')` — coercion picks by the slot's accepted kinds and the string's membership in the primitive set |

### B.3 Rust

```ts
import { build as b, M, render, from } from '@sittir/rust/roles'
const { declaration: d, expression: e, statement: s, literal: l, type: t } = b

const account = d.struct(M.Pub, 'Account',
  d.field(M.Pub, 'owner', 'String'),                                        // positional: flags, name, type
  d.field('balance', 'f64'),
).$with.doc('A bank account.')                                               // member `doc` → /// trivia

const impl = d.impl('Account',
  d.constant(M.Pub, 'RATE', 'f64', 0.02),

  d.method.static(M.Pub, 'new', [d.parameter('owner', 'String'), d.parameter('balance', 'f64')],
    from`Self { owner, balance }`,
  ).$with.returnType('Self'),

  d.method.static(M.Pub, 'zero', [d.parameter('owner', 'String')],
    e.call.path(['Self', 'new'], 'owner', l.float(0)),                       // l.float(0) → `0.0`
  ).$with.returnType('Self'),

  d.method(M.Pub, 'is_overdrawn', [],
    e.less(e.member(e.self(), 'balance'), l.float(0)),
  ).$with.receiver(d.self(M.Ref)).$with.returnType('bool'),

  d.method(M.Pub | M.Async, 'deposit', [d.parameter('amount', 'f64')],
    s.if(e.lessEqual('amount', l.float(0)),
      s.return(e.call('Err', e.macro('format', from`("bad amount: {amount}")`)))),
    e.assign.add(e.member(e.self(), 'balance'), 'amount'),
    e.call('Ok', e.member(e.self(), 'balance')),                             // tail expression
  ).$with.receiver(d.self(M.Ref | M.Mut)).$with.returnType(t.generic('Result', 'f64', 'String')),
)

const total = d.function(M.Pub, 'total', [d.parameter('accounts', t.ref(t.slice('Account')))],
  e.call.member(
    e.call.member(
      e.call.member(e.call.member('accounts', 'iter'), 'filter', e.lambda(['a'], e.not(e.call.member('a', 'is_overdrawn')))),
      'map', e.lambda(['a'], e.member('a', 'balance'))),
    'sum',
  ).$trivia(b.comment('sum balances')),
).$with.returnType('f64')

render(b.module(from`use crate::math::round;`, account, impl, total))
```

| Normalized | → encoded |
|---|---|
| `M.Pub` | `visibilityModifier: VisibilityModifierPub()` — presence bit → structured node; `pub(crate)` etc. take the node form `{ visibility: m.visibility.crate() }` |
| `M.Async` (+ `M.Const`, `M.Unsafe`) | `functionModifiers: FunctionModifiers(['async'])` — bits → one repeat node; the caller never built the set |
| `receiver: d.self({ modifiers: M.Ref \| M.Mut })` | `Parameters([SelfParameter({ reference: true, mutable: true }), …])` — prepended |
| `d.method.static(…)` | `FunctionItem` with no `self_parameter` — absence is the encoding |
| `.$with.doc(…)` / `.$trivia(…)` | leading `LineComment(LineCommentDocOuter(…))` / `LineComment(…)` trivia — doc is a member realized as trivia; a comment is trivia only |
| `e.call.member(obj, name, ...args)` | `CallExpression({ function: FieldExpression({ value, field }), arguments })` — rest args; none → `()` |
| `e.call.path(segments, ...args)` | `CallExpression({ function: ScopedIdentifier(…), arguments })` |
| `` from`…` `` | parsed and embedded — struct expression, `format!` token tree, `use` path |

### B.4 What is and isn't shared

The three scripts are *consistent* — same namespaces, same hoisting, same positional order, same coercions, same bitflag idiom — and *not identical*: Python has `d.self()` and docstrings, TS has `M.Export` and `e.this()`, Rust has `receiver`, `M.Pub`, `e.call.path`, `l.float(0)`. That asymmetry is the languages', reported by the surface rather than hidden by it: `M.Static` on Python's enum, `M.Pub` on TypeScript's, `s.throw` on Rust's are compile errors.

Cross-language *construction* is therefore not a goal of this surface. It remains possible over the intersection of the per-grammar configs (write side is contravariant where the read side is covariant), and the overlay can emit that intersection type on request, but it is a derived convenience for the subset of constructs every target shares, not the API.

### B.5 Round trip

```
render(build(...))  ==  A.1 source                                      (byte-equal after formatting)
roles.find(parse(render(build(...))), K)  ==  the claims in A.2         (for every K in the file)
```

A builder is correct iff what it renders re-parses to the claim it was built from — the pre-lift/post-lift differential applied to construction, generated per builder from the same claim.
