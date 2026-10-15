# @sittir/python

The Python grammar descriptor and generated type families for Sittir. Builders and accessors follow the grammar's concrete forms; the native binding parses and renders them.

```sh
pnpm add @sittir/common @sittir/python
```

```ts
import { createEngine } from '@sittir/common';
import python from '@sittir/python';

const engine = await createEngine(python);
const fn = engine.build.functionDefinition({
	name: 'greet',
	parameters: engine.build.parameters(),
	body: engine.build.block(engine.build.passStatement)
});
fn.$render(); // "def greet():\n    pass\n"
engine.parse('def greet():\n    pass\n', { errors: 'throw' }).$errors.length === 0; // true
engine.dispose();
```

Fixed syntax such as `pass` can be a kind-ID value, not a callable factory. The generated signature is authoritative for each constructor. Supplying a complete suite is the caller's responsibility; an empty block is not a semantically valid Python function body.

Exported types include `PythonAPI`, `FunctionDefinition`, and `ClassDefinition`. See the [usage guide](../../docs/use-cases-and-examples.md), [query examples](../../examples/23-read-query-with.ts), and [development guide](../../DEVELOPMENT.md). Generated output is not hand-authored.
