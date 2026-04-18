# Quickstart — Factory & Ergonomic Surface (post-008)

Consumer-facing examples showing the new surface. Use these as acceptance-test smoke checks once each user story lands.

---

## Scenario 1 — Three paths to the same type

**After US1 lands.** Any of these three expressions resolve to the same concrete type:

```ts
import type { FunctionItem, ConfigFor, NamespaceMap } from '@sittir/rust';

// 1. Namespace sugar (preferred for specific code)
function a(c: FunctionItem.Config): FunctionItem.Fluent { /* ... */ return null as any; }

// 2. Generic accessor (preferred for kind-parametric code)
function b<K extends keyof NamespaceMap>(c: ConfigFor<K>) { /* ... */ }

// 3. Direct map access (preferred for programmatic type utilities)
type X = NamespaceMap['function_item']['Config'];

// Type-level proof: all three are the same type.
type _Check =
    FunctionItem.Config extends ConfigFor<'function_item'>
        ? ConfigFor<'function_item'> extends NamespaceMap['function_item']['Config']
            ? NamespaceMap['function_item']['Config'] extends FunctionItem.Config
                ? true
                : never
            : never
        : never;
// Expected: type _Check = true
```

Acceptance: `_Check` resolves to `true`, confirming SC-010.

---

## Scenario 2 — Kind × shape guard composition

**After US2 lands.** Narrow an `AnyNodeData` or `AnyTreeNode` through two orthogonal axes:

```ts
import { is, isTree, isNode, assert } from '@sittir/rust';
import type { AnyNodeData, AnyTreeNode } from '@sittir/types';

declare const v: AnyNodeData | AnyTreeNode;

// Kind only — narrows the $type discriminant (post-US7)
if (is.functionItem(v)) {
    v.$type; // narrowed to 'function_item'
    // shape still ambiguous here — could be Tree or Node
}

// Kind + shape — resolves to concrete type via NamespaceMap
if (is.functionItem(v) && isTree(v)) {
    v.field('name');    // ✓ FunctionItem.Tree — typed field access (tree-sitter API keeps .type / .text())
    v.range();          // ✓ tree-node method
}

if (is.functionItem(v) && isNode(v)) {
    v.$fields.name;     // ✓ FunctionItem.Node — typed data fields
    v.$fields.body;     // ✓
}

// Generic inverse form
const k = 'function_item' as const;
if (is.kind(v, k) && isTree(v)) {
    v.field('name');    // ✓ resolves FunctionItemTree via NamespaceMap[K]['Tree']
}

// Supertype narrowing
if (is.expression(v) && isTree(v)) {
    v.type;             // tree-sitter API — tree nodes keep `.type` (not `$type`)
    v.range();          // ✓ tree method
}

// Shape only — kind unknown, fallback overload
if (isTree(v)) {
    v.range();          // ✓ AnyTreeNode
}

// Assert form — throws TypeError on mismatch, narrows via `asserts v is T`
function processDecl(v: AnyNodeData) {
    assert.functionItem(v);
    // Remainder of scope: v is narrowed to { $type: 'function_item' }
    v.$fields.name;     // ✓ narrowed
}
```

Acceptance: each composition narrows as described, verified by a type-level `expectTypeOf` or `extends` test (SC-006). `assert.functionItem({ $type: 'block' })` throws `TypeError: assert.functionItem: expected type 'functionItem', got 'block'` (SC-007).

---

## Scenario 3 — `.from()` identity quick-return on NodeData

**After US3 lands.** The resolver recognises already-resolved input and returns it unchanged:

```ts
import { ir } from '@sittir/rust';

const factoryOutput = ir.functionItem({
    name: 'fibonacci',
    body: ir.block({ statements: [] }),
});

// Same JS object — resolver is identity on NodeData
const returnValue = ir.functionItem.from(factoryOutput);
console.assert(returnValue === factoryOutput);  // ✓

// Loose bag — resolver translates, returns new fluent node
const fromBag = ir.functionItem.from({
    name: 'fibonacci',
    body: { statements: [] },  // nested bag — resolver descends
});
console.assert(fromBag !== factoryOutput);      // ✓ different instance
console.assert(fromBag.$fields.name !== undefined);  // ✓ resolved (post-US7)
console.assert(fromBag.$source === 'factory');       // ✓ provenance tag
```

Acceptance: `===` holds for the NodeData input case (SC-005c); bag input produces a freshly-constructed fluent node.

---

## Scenario 4 — Flat and grouped `ir` namespaces produce identical output

**After US5 lands.** Both access forms point at the same factory+resolver bundle:

```ts
import { ir, expression, pattern } from '@sittir/rust';

// ir.expression.* is attached to ir; `expression` is also exported
// standalone for tree-shakeable access.
const viaFlat    = ir.binaryExpression /* legacy-style camelCase */ ?? ir.binary;
const viaGrouped = ir.expression.binary;
// Both resolve to the same _attach bundle. The flat `ir.*` key is the
// supertype-stripped short name (`binary` < `binary_expression`).
console.assert(viaFlat === viaGrouped);  // ✓ SC-012

// The standalone group export is also identity-equal:
console.assert(ir.expression === expression);
```

Acceptance: identical `_attach` bundle from both paths (SC-012) — verified by
`packages/rust/tests/ir-grouped-equivalence.test.ts`.

---

## Scenario 5 — Tree-shaking preserved under namespace imports

**After US3 lands.** A consumer who imports only one factory gets only that factory in the bundled output:

```ts
// consumer.ts
import { ir } from '@sittir/rust';
console.log(ir.functionItem({ name: 'hello', body: ir.block({ statements: [] }) }).render());
```

```bash
$ esbuild consumer.ts --bundle --minify --tree-shaking=true --format=esm | grep -c 'rust_.*From ='
# Expected: only functionItemFrom and blockFrom (and their transitive deps) — not all ~160 resolvers.
```

Acceptance: unused resolvers are eliminated (SC-011). Namespace imports (`import * as F from './factories.js'`) preserve tree-shaking because bundlers track named property access on the namespace object.

---

## Scenario 6 — Generated file size reduction

**After US1 lands.** Types file for each grammar shrinks by ≥700 lines:

```bash
$ wc -l packages/rust/src/types.ts
#    (pre-008 baseline)   ~3518
#    (after US1)          ≤2818  (SC-001: delta ≥ 700)
```

Acceptance: line-count check is the simplest way to confirm the ~791-line elimination landed (five parallel alias families → one `NamespaceMap`).

---

## Scenario 7 — Dead-code patterns eliminated

**After US4 lands.** Generated output contains none of the cleanup target patterns:

```bash
# 1. _attach helper gone
$ sg --pattern '_attach($$$)' --lang typescript packages/*/src/ir.ts
# Expected: no matches (SC-002)

# 2. Auto-named _union_* aliases gone
$ grep -l '_union_' packages/*/src/types.ts
# Expected: no output (SC-003)

# 3. Double-cast on wrap returns gone
$ sg --pattern '$E as unknown as WrappedNode<$K>' --lang typescript packages/*/src/wrap.ts
# Expected: no matches (SC-004)

# 4. Import walls replaced by namespace imports
$ awk '{ print length }' packages/*/src/{ir,from}.ts | sort -n | tail -1
# Expected: < 500 chars (SC-005)
```

Acceptance: all four patterns return zero / under-threshold.

---

## Scenario 8 — Snake-keyed fields path eliminated from `from.ts`

**After US3 lands.** `.from()` resolvers read camelCase single-access; no `.fields[snake]` path:

```bash
$ sg --pattern '$OBJ.fields?.[$KEY]' --lang typescript packages/*/src/from.ts
# Expected: no matches (SC-005a)

$ sg --pattern '(input as $T).$P' --lang typescript packages/*/src/from.ts
# Expected: no matches (SC-005a)

$ sg --pattern 'if (isNodeData(input)) return input as $$$' --lang typescript packages/*/src/from.ts | grep -c "^packages/"
# Expected: matches every non-leaf resolver (SC-005b)
```

Acceptance: two zero-match checks + one count-matches check.

---

---

## Scenario 9 — Zero-warnings `oxlint` on generated output

**After US6 lands.** Every generated package produces clean lint output:

```bash
$ npx oxlint packages/rust/src packages/typescript/src packages/python/src
Finished in Xms on N files with M rules using T threads.
Found 0 warnings and 0 errors.
```

Pre-US6 state (against master `bcd65a0`): 142 real warnings across three rules — all emitter-level. Post-US6: zero.

```bash
# Before (expected pre-US6):
$ npx oxlint packages/rust/src packages/typescript/src packages/python/src 2>&1 | grep '^Found'
Found 142 warnings and 0 errors.

# After (expected post-US6):
$ npx oxlint packages/rust/src packages/typescript/src packages/python/src 2>&1 | grep '^Found'
Found 0 warnings and 0 errors.
```

Acceptance: SC-013 (zero warnings + zero errors) and SC-014 (CI runs the check on every PR).

---

## Scenario 10 — `$`-prefix metadata resolves `type` collisions

**After US7 lands.** Python's `type_alias_statement` has a FIELD literally
named `type`. Pre-008 this collided with the NodeData kind discriminant
(`node.type === 'type_alias_statement'` vs `node.fields.type === 'type'`).
Post-US7 the discriminant is `$type`, so the two are unambiguous:

```ts
import { ir } from '@sittir/python';

const stmt = ir.typeAliasStatement({
    type: 'type',           // the `type` keyword field (bag still uses bare `type` key)
    left: ir.typeIdentifier('Foo'),
    right: ir.typeIdentifier('u64'),
});

console.assert(stmt.$type === 'type_alias_statement');  // ✓ kind discriminant
console.assert(stmt.$fields.type === 'type');           // ✓ keyword field
console.assert(stmt.$source === 'factory');             // ✓ provenance
```

Acceptance: no cast workaround needed in generated `from.ts` — the
`$type` vs `$fields.type` distinction is type-level unambiguous.

Tree nodes (from `readTreeNode(tree)`) keep the tree-sitter `.type` API
unchanged; only the data / factory surface uses `$`-prefix. `$source`
lets `.from()` distinguish `'ts'` vs `'factory'` at a glance.

---

## Migration notes (for consumers on a pre-008 version)

Old alias → new form (deprecated re-exports preserve backward compat throughout 008; removal is a follow-up):

| Pre-008 | Post-008 |
|---|---|
| `FunctionItemConfig` | `FunctionItem.Config` |
| `LooseFunctionItem` | `FunctionItem.Loose` |
| `FunctionItemTree` | `FunctionItem.Tree` |
| `ConfigMap['function_item']` | `NamespaceMap['function_item']['Config']` or `ConfigFor<'function_item'>` |
| `LooseMap['function_item']` | `NamespaceMap['function_item']['Loose']` or `LooseFor<'function_item'>` |
| `ReturnType<typeof functionItem>` | `FunctionItem.Fluent` or `FluentFor<'function_item'>` |
| Manual `v.type === 'function_item'` check | `is.functionItem(v)` |
| Manual cast after kind check | `is.functionItem(v) && isTree(v)` or `is.functionItem(v) && isNode(v)` |
| Manual `throw new TypeError(...)` on kind mismatch | `assert.functionItem(v)` |
| `node.type` / `node.fields` / `node.text` / `node.children` (data read) | `node.$type` / `node.$fields` / `node.$text` / `node.$children` (post-US7) |
| (no equivalent) | `node.$source: 'ts' \| 'factory'` for producer provenance |

`XConfig` / `LooseX` / `XTree` / `ConfigMap` / `LooseMap` aliases remain
emitted as back-compat re-exports during the 008 window. Tree-node types
(from `AnyTreeNode`, `readTreeNode`, tree-sitter API) keep their unprefixed
`.type` / `.text()` — only the data / factory surface uses `$`-prefix.
