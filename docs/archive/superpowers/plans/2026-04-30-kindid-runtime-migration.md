# KindID Runtime Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace string kind-name runtime discrimination with generated numeric `KindId` across TS runtime objects, JS↔Rust/native transport, and native dispatch, while keeping compiler/codegen reasoning name-first and preserving name-based public/debug labels.

**Architecture:** Reuse the existing late generated-metadata path from spec 021: codegen still reasons in kind names, but emits a dense runtime `KindId` table plus `kindNameFromId` / `kindIdFromName` helpers. Generated TS runtime/data-only transport interfaces switch `$type` from string literals to numeric enum members, package entrypoints normalize legacy string `$type` once, and native crates decode/render by `KindId` instead of string kind names.

**Tech Stack:** TypeScript ESM, pnpm workspaces, Vitest, napi-rs 3, Rust 1.88+, Askama 0.15, generated metadata in `packages/codegen/src/compiler/generated-metadata.ts`, grammar packages under `packages/{rust,typescript,python}`, native crates under `rust/crates/sittir-*`.

---

## File Structure

**Generated metadata / compiler hooks**

- Modify: `packages/codegen/src/compiler/generated-metadata.ts` — treat late tree-sitter `kindId` tables as a first-class emitted runtime surface, not just analysis metadata.
- Modify: `packages/codegen/src/compiler/types.ts` — if needed, widen `GeneratedMetadataCatalog` consumers so emitted runtime helpers can consume `kindId`.

**TypeScript generated/runtime surfaces**

- Modify: `packages/codegen/src/emitters/types.ts` — switch generated runtime/data-only transport interfaces from `$type: 'kind_name'` to `$type: TSKindId.KindName`.
- Modify: `packages/codegen/src/emitters/client-utils.ts` — emit `TSKindId`, `kindNameFromId`, `kindIdFromName`, `normalizeKindId`, and boundary-local legacy string normalization.
- Modify: `packages/codegen/src/emitters/is.ts` — generated guards should compare numeric `$type` values while keeping named APIs like `is.functionItem(...)`.
- Modify: `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts`
- Create: `packages/codegen/src/__tests__/kindid-emit.test.ts`

**Grammar packages**

- Modify: `packages/rust/src/engine.ts`
- Modify: `packages/typescript/src/engine.ts`
- Modify: `packages/python/src/engine.ts`
- Modify: `packages/rust/src/backend.ts`
- Modify: `packages/typescript/src/backend.ts`
- Modify: `packages/python/src/backend.ts`
- Modify: `packages/rust/tests/backend-boundary.test.ts`
- Modify: `packages/typescript/tests/backend-boundary.test.ts`
- Modify: `packages/python/tests/backend-boundary.test.ts`

**Native runtime**

- Modify: `rust/crates/sittir-core/src/types.rs` — change runtime render transport discriminants from `String` to numeric `KindId` while keeping reader-side `NodeData` support compatible during migration.
- Modify: `rust/crates/sittir-core/src/engine.rs` — dispatch by `KindId`.
- Modify: `rust/crates/sittir-rust/src/lib.rs`
- Modify: `rust/crates/sittir-typescript/src/lib.rs`
- Modify: `rust/crates/sittir-python/src/lib.rs`
- Modify: generated `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs`
- Modify: `rust/crates/sittir-core/tests/boundary_roundtrip.rs`
- Modify: `rust/crates/sittir-core/tests/wire_shape.rs`

---

## Task 1: Freeze the KindID target at the codegen/type level

**Files:**

- Modify: `packages/codegen/src/emitters/types.ts`
- Create: `packages/codegen/src/__tests__/kindid-emit.test.ts`

- [ ] **Step 1: Write the failing TS codegen test for numeric `$type`.**

Create `packages/codegen/src/__tests__/kindid-emit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { emitTypes } from '../emitters/types.ts';
import { makeMinimalNodeMap } from './helpers/make-minimal-node-map.ts';

describe('KindId emission', () => {
	it('emits numeric runtime discriminants and lookup helpers', () => {
		const contents = emitTypes({
			grammar: 'rust',
			nodeMap: makeMinimalNodeMap()
		});

		expect(contents).toContain('export const enum TSKindId');
		expect(contents).toContain('$type: TSKindId.CallExpression;');
		expect(contents).toContain('export function kindNameFromId(');
		expect(contents).toContain('export function kindIdFromName(');
		expect(contents).not.toContain("$type: 'call_expression'");
	});
});
```

- [ ] **Step 2: Run the test and verify it fails because emitted types still use string literal `$type`.**

Run:

```bash
pnpm test packages/codegen/src/__tests__/kindid-emit.test.ts -t "emits numeric runtime discriminants and lookup helpers"
```

Expected: FAIL on the `TSKindId` and `$type: TSKindId.CallExpression` expectations.

- [ ] **Step 3: Implement `TSKindId` emission and numeric `$type` in generated transport/data interfaces.**

In `packages/codegen/src/emitters/types.ts`, add a new emitted enum section:

```ts
lines.push('export const enum TSKindId {');
for (const [kind, meta] of sortedKindMetadata) {
	const member = nodeMap.nodes.get(kind)?.typeName ?? toPascal(kind);
	lines.push(`  ${member} = ${meta.kindId},`);
}
lines.push('}');
lines.push('');
```

Then change generated transport/data interfaces from:

```ts
readonly $type: 'call_expression';
```

to:

```ts
readonly $type: TSKindId.CallExpression;
```

The generator still reasons in **names**; only the emitted runtime discriminant changes.

- [ ] **Step 4: Re-run the focused codegen test and verify it passes.**

Run:

```bash
pnpm test packages/codegen/src/__tests__/kindid-emit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the KindID type emission change.**

```bash
git add packages/codegen/src/emitters/types.ts packages/codegen/src/__tests__/kindid-emit.test.ts
git commit -m "codegen: emit KindID runtime discriminants"
```

---

## Task 2: Generate boundary-local KindID lookup and legacy normalization helpers

**Files:**

- Modify: `packages/codegen/src/compiler/generated-metadata.ts`
- Modify: `packages/codegen/src/emitters/client-utils.ts`
- Modify: `packages/codegen/src/emitters/is.ts`
- Modify: `packages/rust/tests/backend-boundary.test.ts`
- Modify: `packages/typescript/tests/backend-boundary.test.ts`
- Modify: `packages/python/tests/backend-boundary.test.ts`

- [ ] **Step 1: Write a failing boundary test that accepts legacy string `$type` but normalizes to numeric KindID before native render.**

In `packages/rust/tests/backend-boundary.test.ts` (and replicate for the other grammars):

```ts
it('normalizes legacy string $type to KindID before native render', async () => {
	const renderSpy = vi.fn((node: Record<string, unknown>) => String(node.$type));
	mockNativeBackend(
		class {
			render(node: Record<string, unknown>): string {
				return renderSpy(node);
			}
			applyEdits(source: string): string {
				return source;
			}
		}
	);

	const { render, TSKindId } = await import('../src/index.ts');
	const legacyNode = { ...identifier, $type: 'identifier' } as const;
	render(legacyNode as never);
	expect(renderSpy).toHaveBeenCalledWith(
		expect.objectContaining({ $type: TSKindId.Identifier })
	);
});
```

- [ ] **Step 2: Run the boundary test and verify it fails because no normalization helper exists yet.**

Run:

```bash
pnpm test packages/rust/tests/backend-boundary.test.ts -t "normalizes legacy string \\$type to KindID before native render"
```

Expected: FAIL because the runtime still passes a string `$type` through unchanged.

- [ ] **Step 3: Emit `kindNameFromId`, `kindIdFromName`, and `normalizeKindId` in `client-utils.ts`.**

In `packages/codegen/src/emitters/client-utils.ts`, emit:

```ts
export function kindNameFromId(kindId: TSKindId): string {
	switch (kindId) {
		case TSKindId.Identifier:
			return 'identifier';
		case TSKindId.CallExpression:
			return 'call_expression';
		default:
			throw new TypeError(`unknown kind id ${String(kindId)}`);
	}
}

export function kindIdFromName(name: string): TSKindId {
	switch (name) {
		case 'identifier':
			return TSKindId.Identifier;
		case 'call_expression':
			return TSKindId.CallExpression;
		default:
			throw new TypeError(`unknown kind name ${name}`);
	}
}

export function normalizeKindId<T extends { $type: string | number }>(
	node: T
): T & { $type: TSKindId } {
	return {
		...node,
		$type:
			typeof node.$type === 'number'
				? (node.$type as TSKindId)
				: kindIdFromName(node.$type)
	};
}
```

Then update generated `is.*` guards in `packages/codegen/src/emitters/is.ts` to compare:

```ts
return value.$type === TSKindId.FunctionItem;
```

not:

```ts
return value.$type === 'function_item';
```

- [ ] **Step 4: Re-run the boundary tests and verify the normalization path passes.**

Run:

```bash
pnpm test packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts
```

Expected: PASS — legacy string `$type` is accepted only at the package boundary and normalized before native render.

- [ ] **Step 5: Commit the lookup + normalization helpers.**

```bash
git add packages/codegen/src/compiler/generated-metadata.ts packages/codegen/src/emitters/client-utils.ts packages/codegen/src/emitters/is.ts packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts
git commit -m "runtime: add KindID lookup and legacy normalization"
```

---

## Task 3: Switch grammar package runtime and native boundary to KindID objects

**Files:**

- Modify: `packages/rust/src/engine.ts`
- Modify: `packages/typescript/src/engine.ts`
- Modify: `packages/python/src/engine.ts`
- Modify: `packages/rust/src/backend.ts`
- Modify: `packages/typescript/src/backend.ts`
- Modify: `packages/python/src/backend.ts`
- Modify: `rust/crates/sittir-rust/src/lib.rs`
- Modify: `rust/crates/sittir-typescript/src/lib.rs`
- Modify: `rust/crates/sittir-python/src/lib.rs`

- [ ] **Step 1: Write a failing boundary assertion that native render receives numeric `$type`, not a string.**

In `packages/rust/tests/backend-boundary.test.ts`:

```ts
it('passes numeric KindID over the native render boundary', async () => {
	const renderSpy = vi.fn((node: Record<string, unknown>) => String(node.$type));
	mockNativeBackend(
		class {
			render(node: Record<string, unknown>): string {
				return renderSpy(node);
			}
			applyEdits(source: string): string {
				return source;
			}
		}
	);

	const { render, TSKindId } = await import('../src/index.ts');
	render(identifier as never);
	expect(renderSpy).toHaveBeenCalledWith(
		expect.objectContaining({ $type: TSKindId.Identifier })
	);
});
```

- [ ] **Step 2: Run the test and verify it fails because `engine.render(JSON.stringify(node))` still sends strings.**

Run:

```bash
pnpm test packages/rust/tests/backend-boundary.test.ts -t "passes numeric KindID over the native render boundary"
```

Expected: FAIL — the native boundary still sees a stringified payload.

- [ ] **Step 3: Change grammar package runtime and backend signatures to plain objects with numeric `$type`.**

In each `packages/*/src/backend.ts`, change:

```ts
render(nodeJson: string): string;
```

to:

```ts
render(node: Record<string, unknown>): string;
```

Then in each `packages/*/src/engine.ts`, replace:

```ts
assertNativeNodeData(node);
return engine.render(JSON.stringify(node));
```

with:

```ts
const normalized = normalizeKindId(node as { $type: string | number });
return engine.render(normalized);
```

and keep the compatibility shim strictly local to this package boundary.

- [ ] **Step 4: Change each native crate N-API entrypoint to decode object transport, not string JSON.**

In each `rust/crates/sittir-*/src/lib.rs`, replace:

```rust
#[napi]
pub fn render(&self, node_json: String) -> Result<String> {
    self.inner.render(node_json).map_err(Error::from_reason)
}
```

with:

```rust
#[napi]
pub fn render(&self, node: serde_json::Value) -> Result<String> {
    let transport: render::AnyTransport =
        serde_json::from_value(node).map_err(|e| Error::from_reason(format!("decode transport failed: {e}")))?;
    self.inner.render_transport(&transport).map_err(Error::from_reason)
}
```

Use a stronger N-API object type if available during implementation, but do **not** reintroduce JSON text.

- [ ] **Step 5: Re-run the grammar backend-boundary tests and commit.**

Run:

```bash
pnpm test packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts
```

Expected: PASS — numeric `$type` travels over the native boundary as a plain object.

```bash
git add packages/rust/src/engine.ts packages/typescript/src/engine.ts packages/python/src/engine.ts packages/rust/src/backend.ts packages/typescript/src/backend.ts packages/python/src/backend.ts rust/crates/sittir-rust/src/lib.rs rust/crates/sittir-typescript/src/lib.rs rust/crates/sittir-python/src/lib.rs
git commit -m "native: send KindID objects across runtime boundary"
```

---

## Task 4: Make native runtime types and dispatch KindID-first

**Files:**

- Modify: `rust/crates/sittir-core/src/types.rs`
- Modify: `rust/crates/sittir-core/src/engine.rs`
- Modify: `rust/crates/sittir-core/tests/boundary_roundtrip.rs`
- Modify: `rust/crates/sittir-core/tests/wire_shape.rs`
- Generated: `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs`
- Modify: `packages/codegen/src/emitters/render-module.ts`

- [ ] **Step 1: Write a failing Rust test that expects numeric discriminants in native transport types.**

In `rust/crates/sittir-core/tests/wire_shape.rs` add:

```rust
#[test]
fn native_transport_uses_numeric_kind_ids() {
    let json = r#"{ "$type": 42, "$named": true, "$source": "factory", "$text": "x" }"#;
    let node: NodeData = serde_json::from_str(json).expect("decode node");
    assert_eq!(node.type_, 42);
}
```

This should fail immediately because `NodeData.type_` is still `String`.

- [ ] **Step 2: Run the Rust wire-shape tests and verify the failure.**

Run:

```bash
cargo test -p sittir-core wire_shape --quiet
```

Expected: FAIL because `$type` still deserializes as a string.

- [ ] **Step 3: Replace native transport discriminants and render dispatch with `KindId`.**

In `rust/crates/sittir-core/src/types.rs`, change:

```rust
#[serde(rename = "$type")]
pub type_: String,
```

to a generated/runtime enum:

```rust
#[serde(rename = "$type")]
pub type_: KindId,
```

and define:

```rust
#[repr(u16)]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum KindId {
    Identifier = 42,
    CallExpression = 73,
}
```

Then update render dispatch in `rust/crates/sittir-core/src/engine.rs` and generated render modules from string matches like:

```rust
match node.type_.as_str() {
    "call_expression" => render_call_expression(node),
```

to:

```rust
match node.type_ {
    KindId::CallExpression => render_call_expression(node),
```

Use generated lookup functions for diagnostics:

```rust
kind_name_from_id(node.type_)
```

instead of reintroducing string matching.

- [ ] **Step 4: Re-run Rust wire-shape tests and native crate builds.**

Run:

```bash
cargo test -p sittir-core wire_shape --quiet
cargo build -p sittir-rust -p sittir-typescript -p sittir-python --quiet
```

Expected: PASS.

- [ ] **Step 5: Commit the KindID-first native runtime.**

```bash
git add rust/crates/sittir-core/src/types.rs rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/tests/boundary_roundtrip.rs rust/crates/sittir-core/tests/wire_shape.rs packages/codegen/src/emitters/render-module.ts rust/crates/sittir-rust/src/render/templates.rs rust/crates/sittir-typescript/src/render/templates.rs rust/crates/sittir-python/src/render/templates.rs
git commit -m "rust: dispatch native runtime by KindID"
```

---

## Task 5: Regenerate, validate, and remove the last string-kind dispatch assumptions

**Files:**

- Modify: generated files under `packages/{rust,typescript,python}/src/`
- Modify: any affected tests under `packages/{rust,typescript,python}/tests/`
- Modify: any affected core tests under `packages/core/tests/`

- [ ] **Step 1: Add a focused regression test that public diagnostics still show kind names.**

In a grammar package test file (for example `packages/rust/tests/backend-boundary.test.ts`), add:

```ts
it('reports readable kind names in boundary errors', async () => {
	const { kindNameFromId, TSKindId } = await import('../src/index.ts');
	expect(kindNameFromId(TSKindId.Identifier)).toBe('identifier');
});
```

- [ ] **Step 2: Regenerate all grammar packages.**

Run:

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Expected: all three commands succeed and generated TS files contain numeric `$type: TSKindId.*`.

- [ ] **Step 3: Run the full validation suite.**

Run:

```bash
pnpm run build
pnpm -r run type-check
pnpm test
```

Expected: PASS — no runtime or test path still depends on string kind-name discrimination internally.

- [ ] **Step 4: Delete or shrink the generic string-based native-boundary helper if all callers are gone.**

In `packages/core/src/native-boundary.ts`, remove logic that treats string `$type` as the long-term runtime contract. If a minimal compatibility helper remains, document it as migration-only and ensure no grammar package internal path depends on it.

- [ ] **Step 5: Commit the final KindID migration sweep.**

```bash
git add packages/core/src/native-boundary.ts packages/core/tests/native-boundary.test.ts packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts packages/rust/src/types.ts packages/typescript/src/types.ts packages/python/src/types.ts packages/rust/src/index.ts packages/typescript/src/index.ts packages/python/src/index.ts
git commit -m "runtime: finalize KindID migration across TS and native paths"
```

---

## Self-review checklist

- **Spec coverage:** the plan covers the design’s required layers:
  1. KindID metadata generation and lookup tables
  2. numeric `$type` in generated TS runtime/data-only transport surfaces
  3. boundary-local legacy string normalization
  4. plain-object KindID transport over N-API
  5. KindID-first native decode and dispatch
- **Placeholder scan:** no TBD/TODO placeholders remain.
- **Type consistency:** the plan consistently uses:
  - TS: `TSKindId`, `kindNameFromId`, `kindIdFromName`, `normalizeKindId`
  - Rust: `KindId`
  - transport/runtime key: `$type`

