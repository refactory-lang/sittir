# Renderable Native Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the erased JSON-string native render boundary with typed plain-object JS→Rust transport and a renderable native view layer that streams join/filter composition through Askama.

**Architecture:** Keep ADR-0015's walker-owned render contract as the source of slot truth, but move typed projection earlier: generated per-kind TypeScript data interfaces become the JS→Rust transport shape, Rust decodes directly into matching generated transport enums/structs, and generated `from_transport(...)` bridges build Askama-facing `FieldView` / `ListView` values backed by a closed renderable family. String-backed native views disappear as the default representation; final render-ready text is preserved explicitly as `Renderable::Text(...)`.

**Tech Stack:** TypeScript ESM, pnpm workspaces, Vitest, napi-rs 3, Rust 1.88+, Askama 0.15, workspace codegen under `packages/codegen`, grammar packages under `packages/{rust,typescript,python}`, native crates under `rust/crates/sittir-*`.

---

## File Structure

**Shared runtime / boundary**

- Modify: `packages/core/src/native-boundary.ts` — retire the generic `NativeNodeData` assertion role; replace it with a smaller helper surface for grammar-owned transport validators or delete it if generation fully subsumes it.
- Modify: `packages/core/tests/native-boundary.test.ts` — assert that per-node `$format` rejection and other TS-only metadata checks move to the new grammar-owned transport validator path.
- Modify: `rust/crates/sittir-core/src/filters.rs` — replace string-backed `ListView` / `FieldView` with renderable-backed views and streaming `joinby`.
- Modify: `rust/crates/sittir-core/tests/filters.rs` — cover `Renderable::Text`, mixed renderable lists, and streaming `joinby`.
- Modify: `rust/crates/sittir-core/src/engine.rs` — make the generic engine render path consume typed transport input rather than `node_json: String`.
- Modify: `rust/crates/sittir-core/src/types.rs` — keep the existing `NodeData` wire shape for reader paths only; do not reuse it as the render transport once typed transport lands.

**Codegen**

- Modify: `packages/codegen/src/emitters/types.ts` — emit data-only per-kind transport types alongside the existing type family.
- Modify: `packages/codegen/src/emitters/client-utils.ts` — generate grammar-local transport assertions / guards instead of relying on `@sittir/core/src/native-boundary.ts`.
- Modify: `packages/codegen/src/emitters/render-module.ts` — emit Rust transport enums/structs, `from_transport(...)` bridges, and renderable-backed Askama struct fields.
- Modify: `packages/codegen/src/cli.ts` — ensure generated Rust render modules and package outputs include the new transport artifacts.
- Modify: `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` — assert `from_transport(...)`, renderable-backed fields, and no string-backed `_list` assumptions.
- Create: `packages/codegen/src/__tests__/native-transport-emit.test.ts` — snapshot the generated TS transport type surface and Rust transport enum surface.

**Grammar packages / package boundary**

- Modify: `packages/{rust,typescript,python}/src/backend.ts` — native engine interface changes from `render(nodeJson: string): string` to object transport input.
- Modify: `packages/{rust,typescript,python}/src/engine.ts` — stop `JSON.stringify(node)` on render, call the generated transport assertion, and pass the plain object through N-API.
- Modify: `packages/{rust,typescript,python}/src/boundary.ts` — keep default-engine surface unchanged while routing through the new object transport.
- Modify: `packages/{rust,typescript,python}/tests/backend-boundary.test.ts` — assert native render receives a plain object, not a JSON string.

**Grammar-native crates**

- Modify: `rust/crates/sittir-{rust,typescript,python}/src/lib.rs` — N-API `render(...)` signature changes from `String` to typed transport input.
- Modify: `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs` (generated) — rendered from `from_transport(...)` bridges instead of NodeData projection helpers.

---

## Task 1: Freeze the new JS→Rust boundary with failing tests

**Files:**

- Modify: `packages/rust/tests/backend-boundary.test.ts`
- Modify: `packages/typescript/tests/backend-boundary.test.ts`
- Modify: `packages/python/tests/backend-boundary.test.ts`
- Modify: `packages/core/tests/native-boundary.test.ts`

- [ ] **Step 1: Rewrite the backend-boundary mocks to expect plain objects instead of JSON strings.**

```ts
function mockNativeBackend(
	SittirEngine: new (
		options?: { format?: string }
	) => {
		render(node: Record<string, unknown>): string;
		applyEdits(
			source: string,
			edits: { startPos: number; endPos: number; insertedText: string }[]
		): string;
	}
): void {
	vi.resetModules();
	vi.doMock('../src/backend.js', () => ({
		getActiveBackend: () => ({
			name: 'native',
			hashMatch: true,
			native: { SittirEngine }
		})
	}));
}
```

- [ ] **Step 2: Add a failing assertion that native render receives the object graph unchanged.**

```ts
it('passes a plain transport object to native render', async () => {
	const renderSpy = vi.fn((node: Record<string, unknown>) => `ok:${String(node.$type)}`);
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

	const { render } = await import('../src/boundary.ts');
	expect(render(identifier)).toBe('ok:identifier');
	expect(renderSpy).toHaveBeenCalledWith(identifier);
});
```

- [ ] **Step 3: Update the shared native-boundary test to fail until grammar-owned transport validation exists.**

```ts
it('rejects non-data values at the native transport boundary', async () => {
	const invalidNode = {
		$type: 'identifier',
		$text: 'x',
		render: () => 'nope'
	} as const;

	expect(() => assertNativeNodeData(invalidNode as never)).toThrow(/render/);
});
```

This test is intentionally temporary: once grammar-owned transport validators are generated, move the assertion target from `assertNativeNodeData(...)` to the generated grammar-local helper and delete the generic test.

- [ ] **Step 4: Run the focused boundary tests and verify they fail for the right reason.**

Run:

```bash
pnpm test packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts packages/core/tests/native-boundary.test.ts
```

Expected: FAIL because each grammar engine still calls `engine.render(JSON.stringify(node))` and the mock now expects an object.

- [ ] **Step 5: Commit the red tests.**

```bash
git add packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts packages/core/tests/native-boundary.test.ts
git commit -m "test: freeze object transport at native render boundary"
```

---

## Task 2: Generate data-only transport types and grammar-local validators

**Files:**

- Modify: `packages/codegen/src/emitters/types.ts`
- Modify: `packages/codegen/src/emitters/client-utils.ts`
- Create: `packages/codegen/src/__tests__/native-transport-emit.test.ts`
- Modify: `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts`

- [ ] **Step 1: Extend the generated type family with a data-only transport projection.**

Add a transport namespace/member for every concrete kind in `packages/codegen/src/emitters/types.ts`:

```ts
export namespace CallExpression {
	export interface Transport {
		$type: 'call_expression';
		function: Expression.Transport;
		arguments?: readonly Expression.Transport[];
	}
}

export type TransportFor<K extends SyntaxKind> =
	K extends 'call_expression' ? CallExpression.Transport :
	K extends 'identifier' ? Identifier.Transport :
	never;
```

Rules:

- transport mirrors the generated per-kind TS interface naming
- transport is data-only (no methods/getters/render helpers)
- child fields use transport unions, not runtime `AnyNodeData`

- [ ] **Step 2: Generate grammar-local transport assertions in `client-utils.ts`.**

Replace the generic boundary assumption with generated validators per grammar:

```ts
export function assertNativeRenderTransport(node: unknown): asserts node is AnyTransport {
	if (!isRecord(node)) throw new TypeError('node must be an object');
	if (typeof node.$type !== 'string') throw new TypeError('node.$type must be a string');
	switch (node.$type) {
		case 'identifier':
			assertIdentifierTransport(node, 'node');
			return;
		case 'call_expression':
			assertCallExpressionTransport(node, 'node');
			return;
		default:
			throw new TypeError(`unsupported native transport kind: ${String(node.$type)}`);
	}
}
```

Do **not** route this through the generic `$fields` / `$children` validator from `@sittir/core/src/native-boundary.ts`.

- [ ] **Step 3: Add codegen tests that snapshot both TS and Rust transport emission.**

Create `packages/codegen/src/__tests__/native-transport-emit.test.ts`:

```ts
it('emits data-only TS transport types', () => {
	const files = emitTypes(makeMinimalNodeMap());
	expect(files.contents).toContain('export interface Transport');
	expect(files.contents).toContain("readonly $type: 'call_expression'");
	expect(files.contents).not.toContain('render(): string');
});

it('emits transport-oriented Rust render support', () => {
	const files = emitRenderModule(makeMinimalNodeMap(), 'rust');
	expect(files.templatesRs.contents).toContain('pub enum AnyTransport');
	expect(files.templatesRs.contents).toContain('from_transport');
});
```

- [ ] **Step 4: Run the focused codegen tests and make them pass.**

Run:

```bash
pnpm test packages/codegen/src/__tests__/native-transport-emit.test.ts packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the generated transport surface.**

```bash
git add packages/codegen/src/emitters/types.ts packages/codegen/src/emitters/client-utils.ts packages/codegen/src/__tests__/native-transport-emit.test.ts packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
git commit -m "codegen: emit data-only native transport types"
```

---

## Task 3: Switch grammar package engines and N-API bindings from JSON strings to object transport

**Files:**

- Modify: `packages/rust/src/backend.ts`
- Modify: `packages/typescript/src/backend.ts`
- Modify: `packages/python/src/backend.ts`
- Modify: `packages/rust/src/engine.ts`
- Modify: `packages/typescript/src/engine.ts`
- Modify: `packages/python/src/engine.ts`
- Modify: `rust/crates/sittir-rust/src/lib.rs`
- Modify: `rust/crates/sittir-typescript/src/lib.rs`
- Modify: `rust/crates/sittir-python/src/lib.rs`

- [ ] **Step 1: Change the TS-side native engine interfaces to accept plain objects.**

In each `packages/*/src/backend.ts`:

```ts
export interface NativeEngine {
	readonly templateBundleHash: string;
	parseAndRead(source: string): string;
	findAndRead(source: string, pattern: string): string;
	readNode(nodeId: NodeId): string;
	render(node: Record<string, unknown>): string;
	applyEdits(
		source: string,
		edits: { startPos: number; endPos: number; insertedText: string }[]
	): string;
	dispose(): void;
}
```

- [ ] **Step 2: Stop stringifying render payloads in the grammar engines.**

In each `packages/*/src/engine.ts`, replace:

```ts
assertNativeNodeData(node);
return engine.render(JSON.stringify(node));
```

with:

```ts
assertNativeRenderTransport(node);
return engine.render(node);
```

Use the **generated grammar-local** `assertNativeRenderTransport` helper from the previous task. Do **not** keep importing `assertNativeNodeData` from `@sittir/core/engine`.

- [ ] **Step 3: Change each N-API binding entrypoint to decode object transport instead of string JSON.**

In each `rust/crates/sittir-*/src/lib.rs`, replace:

```rust
#[napi]
pub fn render(&self, node_json: String) -> Result<String> {
    self.inner.render(node_json).map_err(Error::from_reason)
}
```

with a typed object decode entry:

```rust
#[napi]
pub fn render(&self, node: serde_json::Value) -> Result<String> {
    let transport: render::AnyTransport =
        serde_json::from_value(node).map_err(|e| Error::from_reason(format!("decode transport failed: {e}")))?;
    self.inner.render_transport(&transport).map_err(Error::from_reason)
}
```

If napi-rs object decoding supports a stronger direct type than `serde_json::Value` in practice, use that stronger type during implementation; the architectural requirement is **plain object input, not JSON text**.

- [ ] **Step 4: Run the boundary tests and verify they now pass.**

Run:

```bash
pnpm test packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts
```

Expected: PASS — native mocks receive plain objects, not strings.

- [ ] **Step 5: Commit the boundary signature change.**

```bash
git add packages/rust/src/backend.ts packages/typescript/src/backend.ts packages/python/src/backend.ts packages/rust/src/engine.ts packages/typescript/src/engine.ts packages/python/src/engine.ts rust/crates/sittir-rust/src/lib.rs rust/crates/sittir-typescript/src/lib.rs rust/crates/sittir-python/src/lib.rs
git commit -m "native: pass plain transport objects across napi"
```

---

## Task 4: Replace string-backed native views with renderable views and streaming joins

**Files:**

- Modify: `rust/crates/sittir-core/src/filters.rs`
- Modify: `rust/crates/sittir-core/tests/filters.rs`

- [ ] **Step 1: Introduce the closed renderable family in `filters.rs`.**

Add the new value model:

```rust
pub enum Renderable<'a> {
    Text(&'a str),
    Expr(ExpressionRef<'a>),
    Item(ItemRef<'a>),
    Joined(Joined<'a>),
}
```

During implementation, use the smallest concrete set that compiles cleanly with the generated grammar wrappers. Keep it **closed and explicit**; do not start with `Box<dyn RenderableChunk>`.

- [ ] **Step 2: Convert `FieldView` / `ListView` to carry renderables.**

Replace the current string-backed definitions:

```rust
pub struct ListView<'a> {
    pub items: &'a [String],
    pub separator: &'static str,
    pub leading: bool,
    pub trailing: bool,
}

pub enum FieldView<'a> {
    Missing,
    Scalar(&'a str),
    List(ListView<'a>),
}
```

with:

```rust
pub struct ListView<'a> {
    pub items: &'a [Renderable<'a>],
    pub separator: &'a str,
    pub leading: bool,
    pub trailing: bool,
}

pub enum FieldView<'a> {
    Missing,
    One(Renderable<'a>),
    Many(ListView<'a>),
}
```

Include the explicit short-circuit rule in code comments: render-ready text from parser-owned or pre-rendered slots becomes `Renderable::Text(...)`.

- [ ] **Step 3: Rewrite `joinby` as a streaming wrapper over renderables.**

Replace the current `String` return:

```rust
pub fn joinby<T: JoinSource + ?Sized>(
    xs: &T,
    sep: &str,
    leading: bool,
    trailing: bool,
) -> Result<String, askama::Error>
```

with:

```rust
pub struct Joined<'a> {
    pub items: &'a [Renderable<'a>],
    pub sep: &'a str,
    pub leading: bool,
    pub trailing: bool,
}

impl askama::FastWritable for Joined<'_> {
    fn write_into<W: fmt::Write + ?Sized>(
        &self,
        out: &mut W,
        values: &dyn askama::Values,
    ) -> askama::Result<()> {
        if self.leading {
            out.write_str(self.sep).map_err(askama::Error::custom)?;
        }
        for (idx, item) in self.items.iter().enumerate() {
            if idx > 0 {
                out.write_str(self.sep).map_err(askama::Error::custom)?;
            }
            item.write_into(out, values)?;
        }
        if self.trailing {
            out.write_str(self.sep).map_err(askama::Error::custom)?;
        }
        Ok(())
    }
}

#[askama::filter_fn]
pub fn joinby<'a>(
    xs: &'a ListView<'a>,
    _values: &dyn askama::Values,
    sep: &str,
    leading: bool,
    trailing: bool,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    Ok(askama::filters::Safe(Joined {
        items: xs.items,
        sep,
        leading,
        trailing,
    }))
}
```

Stay on Askama's **public** extension surface only (`FastWritable`, `Display`, `Safe<T>`).

- [ ] **Step 4: Add Rust tests for mixed text/renderable lists and streaming joins.**

In `rust/crates/sittir-core/tests/filters.rs` add:

```rust
#[test]
fn joinby_streams_mixed_renderables() {
    let items = [
        Renderable::Text("pub"),
        Renderable::Text(" "),
        Renderable::Text("fn"),
    ];
    let view = ListView {
        items: &items,
        separator: "",
        leading: false,
        trailing: false,
    };

    let rendered = askama::filters::Safe(Joined {
        items: view.items,
        sep: view.separator,
        leading: view.leading,
        trailing: view.trailing,
    })
    .to_string();

    assert_eq!(rendered, "pub fn");
}
```

- [ ] **Step 5: Run the Rust filter tests and commit.**

Run:

```bash
cargo test -p sittir-core filters --quiet
```

Expected: PASS.

```bash
git add rust/crates/sittir-core/src/filters.rs rust/crates/sittir-core/tests/filters.rs
git commit -m "rust: add renderable native views and streaming joins"
```

---

## Task 5: Emit Rust transport bridges and switch generated render structs to `from_transport(...)`

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/cli.ts`
- Modify: `rust/crates/sittir-core/src/engine.rs`
- Modify: `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts`
- Generated: `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs`
- Generated: `packages/{rust,typescript,python}/src/types.ts`
- Generated: `packages/{rust,typescript,python}/src/utils.ts`

- [ ] **Step 1: Emit a top-level generated Rust transport enum for each grammar.**

In `packages/codegen/src/emitters/render-module.ts`, emit:

```rust
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "$type")]
pub enum AnyTransport {
    #[serde(rename = "identifier")]
    Identifier(IdentifierTransport),
    #[serde(rename = "call_expression")]
    CallExpression(CallExpressionTransport),
}
```

and per-kind structs:

```rust
#[derive(Debug, Clone, Deserialize)]
pub struct CallExpressionTransport {
    pub function: ExpressionTransport,
    #[serde(default)]
    pub arguments: Option<Vec<ExpressionTransport>>,
}
```

- [ ] **Step 2: Emit generated `from_transport(...)` bridges beside Askama templates.**

For each struct, emit:

```rust
impl<'a> CallExpressionTemplate<'a> {
    pub fn from_transport(node: &'a CallExpressionTransport) -> Result<Self, askama::Error> {
        Ok(Self {
            function: FieldView::One(Renderable::Expr(ExpressionRef::new(&node.function))),
            arguments: ListView::from_exprs(node.arguments.as_deref().unwrap_or(&[]), ", "),
        })
    }
}
```

The bridge decides between:

- `Renderable::Text(...)` for final render-ready text
- typed renderable refs for structured children
- `FieldView::Missing` / `One` / `Many` per ADR-0015 slot shape

- [ ] **Step 3: Change generated per-kind render functions and engine glue to consume transport.**

Replace the old pattern:

```rust
pub fn render_call_expression(node: &NodeData) -> Result<String, askama::Error> {
    let template = CallExpressionTemplate { /* resolve_field(...) */ };
    template.render()
}
```

with:

```rust
pub fn render_call_expression(node: &CallExpressionTransport) -> Result<String, askama::Error> {
    CallExpressionTemplate::from_transport(node)?.render()
}
```

and update `rust/crates/sittir-core/src/engine.rs` to expose:

```rust
pub fn render_transport(&self, node: &G::Transport) -> Result<String, String> {
    self.grammar.render_transport(node)
}
```

using a new associated type on `EngineGrammar`:

```rust
type Transport;
fn render_transport(self, node: &Self::Transport) -> Result<String, String>;
```

Do **not** delete `NodeData` reader support; only stop using it as the render payload.

- [ ] **Step 4: Run codegen tests, regenerate all grammars, and run the full validation suite.**

Run:

```bash
pnpm test packages/codegen/src/__tests__/native-transport-emit.test.ts packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
pnpm run build
pnpm -r run type-check
pnpm test
```

Expected: all commands PASS; no native render path still depends on `JSON.stringify(node)` or `NodeData`-driven render decode.

- [ ] **Step 5: Commit the generated transport/render bridge cutover.**

```bash
git add packages/codegen/src/emitters/render-module.ts packages/codegen/src/cli.ts rust/crates/sittir-core/src/engine.rs packages/codegen/src/__tests__/render-pipeline-optimization.test.ts packages/rust/src/types.ts packages/typescript/src/types.ts packages/python/src/types.ts rust/crates/sittir-rust/src/render/templates.rs rust/crates/sittir-typescript/src/render/templates.rs rust/crates/sittir-python/src/render/templates.rs
git commit -m "codegen: bridge typed transport into native render templates"
```

---

## Self-review checklist

- **Spec coverage:** this plan covers the three architecture moves from the spec:
  1. typed plain-object JS→Rust transport
  2. generated Rust transport decode + `from_transport(...)`
  3. renderable-native view/filter layer with text short-circuit and streaming `joinby`
- **Placeholder scan:** no TBD/TODO placeholders remain; every task names exact files, commands, and concrete code targets.
- **Type consistency:** the plan consistently uses:
  - TS: `*Transport`
  - Rust: `*Transport`, `AnyTransport`
  - bridge: `from_transport(...)`
  - view layer: `Renderable`, `FieldView`, `ListView`, `Joined`

