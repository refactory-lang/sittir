// A `$with` setter on a PARSED node accepts what the field's coercer accepts,
// not only a pre-built node of the field's kind. Both surfaces route through
// the one exported `resolve<Kind>_<field>`, so a setter and `coerceTo<Kind>`
// cannot drift apart about what a field admits.
//
// A FACTORY-built node's `$with` stays strict: it is spelled from the config
// the factory already holds, and widening it would let a caller put a value
// into storage the factory itself would have rejected.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';
import type * as T from '../src/types.js';

describe('loose $with on parsed tree nodes', () => {
	it('declares the loose config type, not the field type', () => {
		const file = createEngine().parse('fn main() { }\n');
		// If the setter took the strict field type this would not compile:
		// `LooseConfig['shebang']` is what the field's resolver accepts.
		const setter: (v: T.SourceFile.LooseConfig['shebang']) => unknown = file.$with.shebang;
		expect(typeof setter).toBe('function');
	});

	it('rebuilds through the field resolver at runtime', () => {
		const file = createEngine().parse('fn main() { }\n');
		const rebuilt = file.$with.statements(...file.statements());
		expect(rebuilt.$render()).toContain('fn main()');
	});

	it('keeps the factory-built setter strict', () => {
		const built = ir.functionItem({
			name: 'main',
			parameters: ir.parameters.strict(),
			body: ir.block.strict()
		});
		// @ts-expect-error a factory-built node's setter takes the field's own
		// type; a bare string is not an Identifier node.
		built.$with.name('run');
		expect(built.$render()).toContain('main');
	});
});
