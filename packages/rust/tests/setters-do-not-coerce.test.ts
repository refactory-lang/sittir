// A setter takes the slot's own type and stores it. Coercion belongs to
// construction: a caller who wants it reaches for the constructor that does
// it, which is one composition longer and says exactly what it converts.
//
// The rule's value is that `$with.<field>` means the same thing on every node
// — built by a factory, coerced from loose input, or read out of a parsed
// tree. A setter that coerced on some of those and not others would make the
// same key accept different things depending on where the node came from,
// with nothing in the API to say which.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';
import type * as T from '../src/types.js';

describe('setters do not coerce', () => {
	it('takes the slot type on a parsed node, not the loose config', () => {
		const file = createEngine().parse('fn main() { }\n');
		const setter: (v: NonNullable<T.SourceFile['_shebang']>) => unknown = file.$with.shebang;
		expect(typeof setter).toBe('function');
	});

	it('takes the same on a factory-built node', () => {
		const built = ir.label(ir.identifier('outer'));
		const setter: (v: T.Identifier) => unknown = built.$with.name;
		expect(typeof setter).toBe('function');
	});

	it('rejects a bare string that the CONSTRUCTOR accepts', () => {
		const built = ir.label(ir.identifier('outer'));
		// @ts-expect-error the setter stores what it is given; `ir.identifier`
		// is how a string becomes an Identifier.
		built.$with.name('inner');
		expect(built.$with.name(ir.identifier('inner')).$render()).toContain('inner');
	});

	it('keeps its rest-parameter form for a repeated slot', () => {
		const file = createEngine().parse('fn a() { }\nfn b() { }\n');
		const rebuilt = file.$with.statements(...file.statements());
		expect(rebuilt.$render()).toContain('fn a()');
	});
});
