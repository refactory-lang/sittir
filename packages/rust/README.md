# @sittir/rust

The Rust grammar descriptor and generated type families for Sittir. Construction paths, accessors, and guards follow the Rust grammar; parsing and rendering use the package's native binding.

```sh
pnpm add @sittir/common @sittir/rust
```

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);
const fn = engine.build.statement.function({
	visibilityModifier: 'pub',
	name: 'main',
	parameters: engine.build.parameters(),
	body: engine.build.block()
});
fn.$render(); // "pub fn main() {}"
fn.$with.name(engine.build.identifier('run')).$render(); // "pub fn run() {}"
engine.dispose();
```

The ordinary builder resolves ergonomic inputs; `.strict` exposes explicit construction. `parse` returns a typed source root, and `$with` creates an immutable update. Rebuild containing slots to propagate a child replacement to the root.

Types such as `RustAPI` and `FunctionItem` are exported from this package. Obtain callable APIs through `createEngine`; direct data literals do not establish engine ownership.

See the [usage guide](../../docs/use-cases-and-examples.md), [examples](../../examples/README.md), and [development guide](../../DEVELOPMENT.md). Everything under `src/` is generated; author changes in the grammar or codegen and regenerate.
