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
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('setters do not coerce', () => {
	it('takes the slot type on a parsed node, not the loose config', () => {
		const file = rs.parse('fn main() { }\n');
		const refused = () => {
			// @ts-expect-error the shebang setter takes a built Shebang; text is the constructor's input
			file.$with.shebang('#!/bin/sh');
			// @ts-expect-error a node of another kind is not a Shebang
			file.$with.shebang(rs.build.identifier('x'));
		};
		expect(file.$with.shebang(rs.build.shebang('#!/bin/sh')).shebang()?.$type).toBe(rs.kinds.Shebang);
		expect(typeof refused).toBe('function');
	});

	it('takes the same on a factory-built node', () => {
		const built = rs.build.label(rs.build.identifier('outer'));
		const refused = () => {
			// @ts-expect-error a node of another kind is not an Identifier
			built.$with.name(rs.build.block());
			// @ts-expect-error the loose config the constructor accepts is not a node
			built.$with.name({ name: 'inner' });
		};
		expect(built.$with.name(rs.build.identifier('inner')).$render()).toContain('inner');
		expect(typeof refused).toBe('function');
	});

	it('rejects a bare string that the CONSTRUCTOR accepts', () => {
		const built = rs.build.label(rs.build.identifier('outer'));
		// @ts-expect-error `ir.identifier` is how a string becomes an Identifier.
		expect(() => built.$with.name('inner')).toThrow(/a strict factory takes a built node, not a string/);
		expect(built.$with.name(rs.build.identifier('inner')).$render()).toContain('inner');
	});

	it('takes the items of a repeated slot as arguments, as the factory setter does', () => {
		const file = rs.parse('fn a() { }\nfn b() { }\n');
		const rebuilt = file.$with.statements(...file.statements());
		expect(rebuilt.$render()).toContain('fn a()');
	});
});
