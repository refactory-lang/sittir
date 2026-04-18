# Landing Report — Spec 008 (Factory & Ergonomic Surface Cleanup)

**Branch**: `008-factory-ergonomic-cleanup`
**Recorded**: 2026-04-17
**Scope landed**: US1, US2, US3, US4, US5, US6 (six of seven stories)
**Deferred**: US7 (`$`-prefix metadata rename) → follow-up spec 009

---

## Tests

```
Test Files  43 passed (43)
     Tests  1250 passed (1250)
```

Baseline was 1228. Added: 9 namespace-map convergence tests (rust/typescript/python), 9 is-guards tests (rust), 4 ir-grouped-equivalence tests (rust). **All corpus ceilings unchanged** — the added tests are type-level convergence checks and API equivalence checks, not corpus-driven counts.

## Type-check

All six workspace packages pass `tsgo --noEmit` with zero errors.

## Lint

```
$ npx oxlint --deny-warnings packages/rust/src packages/typescript/src packages/python/src
Found 0 warnings and 0 errors.
```

Baseline was 142 distinct warnings (122 no-useless-fallback-in-spread, 18 no-unused-vars, 2 no-useless-escape). CI enforces the zero-warning floor via a new step between `type-check` and the broad `lint`.

---

## Line counts — baseline vs final

| Grammar | File | Baseline | Final | Δ |
|---|---|---|---|---|
| rust | types.ts | 4004 | 5611 | +1607 |
| rust | factories.ts | 4395 | 4394 | −1 |
| rust | from.ts | 1956 | 1956 | 0 |
| rust | wrap.ts | 1876 | 1868 | −8 |
| rust | ir.ts | 199 | 581 | +382 |
| typescript | types.ts | 3959 | 5818 | +1859 |
| typescript | factories.ts | 4904 | 4845 | −59 |
| typescript | from.ts | 2198 | 2198 | 0 |
| typescript | wrap.ts | 2100 | 2092 | −8 |
| typescript | ir.ts | 227 | 367 | +140 |
| python | types.ts | 2538 | 3667 | +1129 |
| python | factories.ts | 2886 | 2885 | −1 |
| python | from.ts | 1366 | 1366 | 0 |
| python | wrap.ts | 1290 | 1282 | −8 |
| python | ir.ts | 142 | 300 | +158 |

### Why types.ts grew despite SC-001's "−700 lines" target

SC-001 was phrased as a reduction target, but the actual landing inverted
the sign: US1 introduced `NamespaceMap` + per-kind `NodeNs` interfaces +
declaration-merged namespace sugar blocks. Each kind now gets:

- Its concrete data interface (unchanged)
- `Config` / `Tree` / `LooseX` aliases (kept for back-compat; flat aliases)
- A new `<TypeName>Ns` interface (computed base over `NodeNs<T>`)
- A `NamespaceMap['<kind>']: <TypeName>Ns` entry
- A new `namespace <TypeName> { Config; Fluent; Loose; Tree; Kind; }` block

The namespace blocks and `Ns` interfaces are net-adds. The SC-001 number
in the spec was aspirational and predicated on also dropping the legacy
`XConfig`/`LooseX`/`XTree` aliases — that drop was kept for back-compat
and will land with US7's breaking-change sweep.

The DOWNSTREAM surface (factories.ts / from.ts / wrap.ts) DID shrink or
stay flat despite adding new features — namespace imports (US5) replaced
3000-character import walls with two-line `import * as F` declarations,
and `_union_*` aliases were inlined (US4).

### ir.ts growth — tradeoff for tree-shakeable groups

`ir.ts` grew per grammar because each supertype now has its own exported
`const <supertype>` block ALSO attached to `ir.<supertype>`. This is the
tree-shake-friendly topology that SC-011 called for. Max line per file:

| Grammar | Baseline max line | Final max line | SC-005 target |
|---|---|---|---|
| rust | 3831 chars | 443 chars | < 500 ✅ |
| typescript | ~3600 chars | 404 chars | < 500 ✅ |
| python | ~2800 chars | 296 chars | < 500 ✅ |

---

## Pattern sweep — zero-match targets

| Pattern | Baseline | Final | SC | Story |
|---|---|---|---|---|
| `grep '_union_' packages/*/src/types.ts` | 3 | 0 | SC-003 | US4 |
| `grep 'interface _NodeData' packages/*/src/wrap.ts` | 3 | 0 | (implicit) | US4 |

The SC-002 target (`_attach` removal) and SC-004 target (`as unknown as
WrappedNode<K>` removal) were both **kept with inline documentation**:

- `_attach` survives because `Object.assign` breaks on polymorph forms
  whose name collides with `Function.name` (a read-only own property).
  The TypeScript grammar's `importSpecifier` has a variant literally
  named `name`. `_attach` uses `defineProperty` with explicit
  descriptors to override. Documented at
  `packages/codegen/src/emitters/ir.ts` lines 39–46.
- `as unknown as WrappedNode<K>` survives because the wrap function's
  getter return type is `unknown` (from `drillIn`). Threading a generic
  `drillIn<T>` type through the wrap emission requires US7's `$`-prefix
  metadata rename to disambiguate user-facing fields named `type` from
  the NodeData discriminant. Deferred to spec 009.

Both decisions are tracked as "rejected after investigation, reason:
..." in `tasks.md`.

---

## Per-story summary

| Story | Status | Commit | Landing highlights |
|---|---|---|---|
| **US1** | ✅ | 4526f5f | `NamespaceMap`, `NodeNs<T>`, per-kind `Ns` interfaces, `ConfigFor<K>` / `FluentFor<K>` / `LooseFor<K>` / `TreeFor<K>` generic accessors, declaration-merged `namespace X { Config; Fluent; Loose; Tree; Kind; }` sugar. Convergence tests landed per-grammar (codegen can't dep on its output). |
| **US2** | ✅ | 086a857 | `is.ts` emitter with `IsGuards` + `AssertGuards` interfaces, per-kind `is.<guardKey>` + supertype guards, `isTree` / `isNode` shape guards, `assert.<guardKey>` throwing forms. Overloaded signatures narrow through `NamespaceMap`. |
| **US3** | ✅ | c952e5b | `from.ts` quick-return via `isNodeData` + namespace imports (`F.` / `FR.`), per-resolver single `(input as T.<Parent>.Loose).propertyName` cast replaces per-field casts. |
| **US4** | ✅ | b4a9fb8 | Inline field unions at the field site (no more `_union_Foo_Bar_Baz`), import `_NodeData` from `@sittir/types`, document `_attach` rationale. |
| **US5** | ✅ | 3442b8e | `ir.ts` namespace imports + tree-shakeable supertype group consts attached to `ir.*`. SC-005 + SC-012 verified. |
| **US6** | ✅ | 331c2a7 | Zero-warning generated output + CI `--deny-warnings` enforcement. Bonus: fluent setter params renamed to `value` / `values`; base kinds use `T.${Type}.Config` namespace sugar. |
| **US7** | ⏭ Deferred | — | `$`-prefix metadata rename (`$type` / `$fields` / `$source`). 500+ coordinated touches (types, core, emitters, tests) — belongs in its own spec cycle (follow-up 009). |

---

## Constitution update

Bumped from v1.1 → v1.2 in a separate commit: added principles **IX**
(`@sittir/core` stays minimal / Rust-port-ready — no utilities; put
NamespaceMap-narrowing helpers in generated `utils.ts` instead) and
**X** (don't hand-roll types you can import — treat existing types in
`@sittir/types` / third-party libs as the single source of truth).

---

## Follow-ups captured to memory

- Test helpers: `_nodeToBag` + `_nodeToFactory` helpers (test-only) to
  reduce hand-written NodeData literals in corpus tests.
- `$`-prefix metadata rename (US7 → spec 009).
- `$source` provenance tag on every producer (part of US7 / spec 009).
- Drop legacy `XConfig` / `LooseX` / `XTree` / `ConfigMap` / `LooseMap`
  aliases (also deferred to 009 — coupled with US7's metadata rename
  because both are breaking-shape changes).
- Tree-shake bundle-size verification via esbuild (deferred from T066).

---

## Risk assessment

**Green** — all tests pass, type-check clean, lint clean, ceilings
preserved. The deferred US7 work is gated on a future spec and doesn't
block landing US1–US6.
