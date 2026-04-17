# Research — Factory & Ergonomic Surface Cleanup

**Phase**: 0
**Status**: Complete — all decisions resolved during spec brainstorming.

---

## R-001 — NamespaceMap vs per-kind top-level aliases

**Decision:** Single `NamespaceMap` keyed by kind string, with per-kind namespace interfaces (`XNs extends NodeNs<X>`) + declaration-merged namespace sugar (`FunctionItem.Config`).

**Rationale:** TypeScript resolves `NodeNs<T>` once at the `XNs` declaration site; every downstream `NamespaceMap['function_item']['Config']` or `FunctionItem.Config` access is a direct property lookup. Five parallel alias families (`XConfig`, `LooseX`, `XTree`, `ConfigMap`, `LooseMap`) collapse into one map. Three access paths (`FunctionItem.Config`, `ConfigFor<'function_item'>`, `NamespaceMap['function_item']['Config']`) all resolve to the same type — consumers pick the path that fits their context.

**Alternatives considered:**

- **Keep five parallel families, just rename.** Rejected: addresses cosmetics without fixing the source-of-truth problem. Adding a new kind still requires five parallel updates.
- **Single `NamespaceMap` without namespace sugar.** Rejected: `ConfigFor<'function_item'>` works for generic code but reads awkwardly in concrete code. `FunctionItem.Config` is the ergonomic surface.
- **Namespace sugar only, no `NamespaceMap`.** Rejected: programmatic code over arbitrary kinds (`build<K extends keyof NamespaceMap>(c: ConfigFor<K>)`) needs the map form.

---

## R-002 — Type guard surface: `is` namespace + shape guards + `assert`

**Decision:** Three orthogonal axes, composed at callsites:

- **`is` namespace** — per-kind, supertype, and generic `kind(v, k)` guards. All narrow the `type` discriminant.
- **`isTree(v)` / `isNode(v)`** — shape guards with overloaded signatures. Narrow through `NamespaceMap` when kind is already known; fall back to `AnyTreeNode` / `AnyNodeData` when not.
- **`assert` namespace** — mirrors `is` with `asserts v is T` signatures; throws `TypeError` on mismatch.

Composition: `is.kind × shape = concrete type`. `is.functionItem(v) && isTree(v)` narrows `v` to `FunctionItem.Tree`.

**Rationale:** Matches Babel's `@babel/types` convention (`t.isFunctionDeclaration` / `t.assertFunctionDeclaration`). Consumers overlap with Babel users; prior-art mental model applies. The kind × shape split decomposes cleanly: the kind guards are runtime-cheap (`v.type === k` or `Set.has`); the shape guards are structural (`typeof v.range === 'function'` etc.) and can be a single function per grammar with overloaded type signatures. Assert reuses `is` runtime logic (no duplicated code), only the TypeScript assertion-function signature differs.

**Alternatives considered:**

- **One guard per-kind per-shape (`isFunctionItemTree`, `isFunctionItemNode`).** Rejected: 160 kinds × 2 shapes = 320 generated guards per grammar. Composition-at-callsite gives the same narrowing with a fraction of the surface.
- **Runtime-typed single guard (`is(v, 'function_item')`).** Rejected: string-based kind arg loses autocomplete for kind names; consumers want `is.functionItem(v)` ergonomically.
- **Skip `assert` — consumers throw manually.** Rejected: parity with Babel matters here; and `asserts v is T` signatures cannot be replicated by consumer wrappers without re-implementing the surface.

---

## R-003 — `.from()` dispatch mechanism

**Decision:** Resolver bodies become:

```ts
if (isNodeData(input)) return input as T.<Kind>.Fluent;
return <Kind>({ field: _resolveOne<ConcreteType>(input.camelField, ...), ... });
```

`isNodeData(input) === true` is identity quick-return (NodeData is already resolved). `false` branch treats input as a camelCase loose bag and reads fields single-access via `input.camelField`. The snake-keyed `.fields[...]` path is eliminated from from.ts entirely.

**Rationale:** `.from()`'s actual semantic is "translate loose bag into fluent node." NodeData inputs carry already-resolved children — field-by-field re-resolution is a no-op. Quick-return on that branch is both correct and faster. The bag branch reads camelCase because bags are authored by consumers typing camelCase property names. Single-access `input.name` is precise; no dual-access expression, no `??` fallback, no inline cast chain.

The premise that a snake-keyed NodeData at `.from()`'s boundary is always fluent (factory output OR wrap output around readNode) holds in practice: bare `readNode()` outputs flow through `wrap()` before reaching consumer code. Passing a bare `readNode` result to `.from()` is documented as an unsupported path.

**Alternatives considered:**

- **Keep inline dual-access casts (297 per grammar).** Rejected: noise at every read site; diff churn on every field-type change; computed Config paths (`NonNullable<T.FunctionItemConfig['name']>`) are indirect.
- **Extract `_f(input, snake, camel)` untyped helper.** Rejected: hides intent at the callsite. The dual-access logic is invisible without jumping to the helper.
- **Extract `_f<NS, NC, V>(input, snake, camel)` generically typed helper.** Rejected for a better reason: even with types, the helper solves the wrong problem. The deeper question is *why* `.from()` reads snake-keyed fields at all — and the answer is "it shouldn't, because NodeData is already resolved."
- **Normalize at entry via `_toBag` (rewrite NodeData.fields keys snake→camel, then single-access).** Rejected: does unnecessary work on the NodeData branch, where the fields are already resolved and re-bagging them just to read them is waste. Quick-return identity is strictly better.

---

## R-004 — Grouped `ir.*` sub-namespaces: additive vs replacement

**Decision:** Additive. Emit `ir.expr`, `ir.decl`, `ir.pattern`, etc. alongside the flat `ir.functionItem`, `ir.binaryExpression`, etc. Both surfaces point at the same factory+resolver bundle.

**Rationale:** The grouped form is ergonomic for supertype-oriented transforms but not a universal win — flat `ir.*` matches Babel's `t.*` convention and consumers cope with 150+ flat entries via autocomplete. Making sub-namespaces additive costs very little (same references, one additional emission pass) and avoids forcing migration. Consumers who want grouping get it; consumers happy with flat don't notice.

**Alternatives considered:**

- **Replace flat with grouped only.** Rejected: breaks every consumer using `ir.functionItem(...)` today. Migration cost not justified by benefit.
- **Flat only, add grouping via consumer-authored re-exports.** Rejected: duplicates work, spreads the convention across repos.

---

## R-005 — `_attach` → `Object.assign`

**Decision:** Emit `Object.assign(fn, { from: fnFrom })` directly. Remove the `_attach` helper function and all call sites.

**Rationale:** `_attach(fn, props)` body is `for (key in props) Object.defineProperty(...)` with `writable: true, configurable: true, enumerable: true` — the same runtime semantics as `Object.assign`. Same type signature (`T & P` inference). Keeping a custom helper that's equivalent to a builtin is gratuitous indirection.

**Alternatives considered:**

- **Keep `_attach` because it exists.** Rejected: Principle II (Fewer Abstractions).
- **Keep `_attach` because `defineProperty` is more explicit about descriptor semantics.** Rejected: `Object.assign` uses `[[Set]]` which is the right semantics for adding properties to a plain function. `_attach`'s explicit descriptors matter for objects with getters/setters on their prototype — factories are plain functions, so the distinction is irrelevant.

---

## R-006 — Auto-named `_union_*` aliases

**Decision:** Inline field unions at the field site. Emit a named alias only when the union is referenced at ≥2 sites; the name is semantic (derived from field context), not `_union_Foo_Bar_Baz`.

**Rationale:** An auto-name like `_union_Identifier_Metavariable` is an implementation artefact of the emitter's deduplication pass. For unions used once, the name is pure overhead — a reader has to follow an extra alias to see the actual union members. Threshold of 2+ reuses keeps meaningful shared unions named (so a rename affects one spot) while inlining the one-off cases.

**Alternatives considered:**

- **Always inline, no named aliases.** Rejected: a union used at 8 field sites duplicated 8× bloats the file and makes cross-cutting renames multi-site.
- **Keep `_union_*` naming.** Rejected: the auto-name is ugly, and the distinction between "this is a shared union worth naming" and "this is a once-used union" is valuable.

---

## R-007 — `_NodeData` duplication in wrap.ts

**Decision:** Import `_NodeData` from `@sittir/types` alongside `WrappedNode`. Remove the local interface declaration.

**Rationale:** The comment justifying the local declaration ("every grammar package is self-contained at the type level") is inconsistent with the file already importing `WrappedNode` from `@sittir/types`. Self-containment was never enforced and the local decl adds maintenance surface (changes to `_NodeData` require N regenerations).

**Alternatives considered:**

- **Preserve local decl and also import `WrappedNode` locally.** Rejected: doubles down on an inconsistent principle; forces `@sittir/types` internals to split.

---

## R-008 — `as unknown as WrappedNode<X>` double-cast in wrap.ts

**Decision:** Tighten `drillIn` return type so per-field `get` accessors match `WrappedNode<K>`'s field types structurally. Generated wrap functions return via `satisfies WrappedNode<K>` (no cast) or inferred return type.

**Rationale:** The double-cast is a workaround for `drillIn` returning `unknown`. Fixing `drillIn<T>(entry: T | undefined, tree: TreeHandle): WrappedOf<T>` with proper generic threading through `TreeHandle` eliminates the workaround at the type level, not via runtime escape-hatch. Result: one fewer unchecked coercion per wrap function × 150 kinds × 3 grammars = fewer type-safety holes.

**Alternatives considered:**

- **Keep the cast; stop worrying about type-safety escape hatches.** Rejected: the cast hides potential bugs when `drillIn`'s shape evolves — type errors get silently swallowed.

---

## R-009 — Deprecated re-exports vs hard removal

**Decision:** Old aliases (`FunctionItemConfig`, `LooseFunctionItem`, `FunctionItemTree`, `ConfigMap`, `LooseMap`) remain as deprecated re-exports throughout this spec's user stories. Removal is a follow-up.

**Rationale:** Consumer migration cost matters. `FunctionItemConfig` → `FunctionItem.Config` is a trivial find-replace, but consumers doing it in-flight shouldn't have their builds broken by an upgrade. JSDoc `@deprecated` attaches compiler-visible warnings. Follow-up spec picks the removal once internal consumers (plus any known external ones) have migrated.

**Alternatives considered:**

- **Hard removal in US1.** Rejected: blocks the spec on external migration timelines.
- **Dual export with no deprecation annotation.** Rejected: consumers have no signal to migrate.

---

## R-010 — Verification via `sg` (ast-grep) vs `grep`

**Decision:** Success criteria that check the absence of a code pattern (SC-002 / SC-004 / SC-005a / SC-005b) use `sg --pattern ...` structural queries. SC-003 (`_union_*` identifier prefix) stays `grep` because it's a substring within a single identifier node, not a structural shape.

**Rationale:** The patterns being checked are structural (an optional-chain index, a specific cast chain, a function call with variadic args). `grep` matches strings — it false-positives inside comments, string literals, and partial expressions. `sg` matches AST nodes. Also dogfooding: sittir's generated types exist to make ast-grep consumers' lives easier, so the spec's own verification uses the tool our output targets.

**Alternatives considered:**

- **All-grep.** Rejected: false-positive risk; not using the tool we target.
- **All-sg.** Rejected: identifier-prefix matches (SC-003) are awkward in sg without escalating to YAML rule form with `constraints.regex`, and a simple `grep` covers the case.

---

## R-011 — Landing order and dependency sequencing

**Decision:**

1. **US1 (NamespaceMap)** lands first. Everything else references `T.<Kind>.Fluent`, `NamespaceMap`, or the per-kind namespace — these must exist.
2. **US2 (guards)** lands second. Independent of US3/US4/US5/US6. Depends on US1 for `NamespaceMap` narrowing composition.
3. **US3 (from.ts)** lands third. Depends on US1 for `T.<Kind>.Fluent` return type and `T.<Kind>.Loose` input type. Depends on `isNodeData` in `@sittir/core`, which ships with US3 landing.
4. **US4 (codegen-time fixes)** lands fourth. Independent of US3 but shares emitter-area territory; sequencing after US3 avoids merge conflicts on `from.ts` emitter.
5. **US5 (ir.ts)** lands fifth. Touches `ir.ts` emitter; depends on US4 for the `_attach` → `Object.assign` change that also touches that emitter.
6. **US6 (lint-clean)** lands sixth. Catches any lint regressions introduced by US1-US5 AND fixes the 142 pre-existing warnings. Landing last means the zero-warnings floor is established against the final emitter state.

**Rationale:** US1 is the architectural foundation; US2/US3 hard-depend on it. US4/US5 are localized to specific emitters and can land in either order after US3. US6 lands last because (a) earlier user stories may introduce new lint signal that we want to triage once, not piecemeal; (b) establishing the zero-warnings floor against the final shape of the emitters avoids re-fixing warnings that get eliminated by later cleanups.

**Alternatives considered:**

- **Land US2 before US1.** Rejected: guard composition (`is.functionItem(v) && isTree(v) → FunctionItem.Tree`) needs `NamespaceMap` for the `FunctionItem.Tree` resolution.
- **Land US3 and US4 in parallel.** Rejected: both touch the from.ts and factories.ts emitter code paths; serial landing avoids merge conflicts.
- **Land US6 before US1 (triage existing warnings first).** Rejected: US4 alone is likely to invalidate some warnings (e.g. removing `_attach` removes unused-var warnings tied to it). Deferring means one triage pass against a known-final shape rather than two against moving targets.

---

## R-012 — Lint triage: fix-at-emitter vs suppress vs accept

**Decision:** Every one of the 142 warnings surfaced by `npx oxlint packages/*/src` on the current output is **Category A: fix at emitter**. No suppressions, no accepted warnings.

**Pre-triage findings (run against `bcd65a0` master):**

| Rule | Count | Category |
|---|---|---|
| `unicorn/no-useless-fallback-in-spread` | 122 | A — emitter fix (FR-035) |
| `no-unused-vars` (dead imports + unused top-level + unused param `v`) | 18 | A — emitter fix (FR-036, FR-037) |
| `no-useless-escape` | 2 | A — emitter fix (FR-038) |

Triage categories defined for this spec and future lint passes:

- **Category A — Fix at emitter**: the warning signals a bug in generated output. Fix the emitter so the warning is structurally impossible.
- **Category B — Suppress with comment**: the warning is a false positive for a pattern the emitter deliberately produces. Add an emitter-level `// oxlint-disable-next-line <rule>` comment with a rationale.
- **Category C — Accept grammar-wide**: the rule is genuinely not a fit for generated output. Disable at `.oxlintrc.json` level with a rationale in the config.

**Rationale:** Category A is strongly preferred. Suppression comments (B) accumulate maintenance debt; rule disables (C) lose signal for future regressions. The current 142 warnings are all Category A, which means this spec has no hard trade-offs to resolve during triage — it's mechanical emitter fixes.

**Alternatives considered:**

- **Accept current state, start linting future generated output only.** Rejected: the warnings are real emitter bugs (dead imports are confusing; `?? {}` is visible noise). Fixing is cheap.
- **Suppress 122 instances of `no-useless-fallback-in-spread` rather than changing the emitter.** Rejected: the emitter change is one line; the suppression would be 122 comments that never go away.

---

## Open questions deferred to tasks

- **Deprecation annotation mechanism**: JSDoc `@deprecated` tag alone vs additional runtime warning? JSDoc alone is sufficient for IDE surface; runtime noise not warranted. Finalize during US1 implementation.
- **`readTreeNode()` entry point documentation**: The edge case ("bare readNode output in .from() returns non-functional fluent") needs a comment in the generated `ir.ts` preamble. Wording decided during US3.
- **`assert` error message format**: `"Expected function_item, got block"` vs `"assert.functionItem: expected type 'function_item', got 'block'"`. Latter is more helpful in stack traces; decide during US2 implementation.
