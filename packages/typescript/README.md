# @sittir/typescript

The TypeScript grammar descriptor and generated type families for Sittir. The node API follows tree-sitter's TypeScript grammar as authored by Sittir; it does not perform TypeScript type checking or name resolution.

```sh
pnpm add @sittir/common @sittir/typescript
```

```ts
import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';

const engine = await createEngine(typescript);
const declaration = engine.build.interfaceDeclaration({
	name: 'User',
	body: engine.build.objectType.curly()
});
declaration.$render(); // "interface User {}"
const source = 'const value: number = 1; // retained\n';
engine.parse(source).$render() === source; // true
engine.dispose();
```

Use `engine.build`, `engine.is`, and `engine.kinds` for construction and narrowing. Exported types include `TypescriptAPI`, `InterfaceDeclaration`, and `FunctionDeclaration`. Parsed accessors and `$with` updates use the same grammar-specific node families.

See the [usage guide](../../docs/use-cases-and-examples.md), [examples](../../examples/README.md), and [development guide](../../DEVELOPMENT.md). Generated `src/` files are derived output.
