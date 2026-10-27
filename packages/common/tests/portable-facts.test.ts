import { describe, expect, it } from 'vitest';
import { portablePathHasFacts } from '../src/portable/facts.ts';

describe('portablePathHasFacts', () => {
	it('holds when the read path names every fact of the guard path, in order, other facts between', () => {
		expect(portablePathHasFacts('declaration.method.public', 'declaration.method.getter.public')).toBe(true);
		expect(
			portablePathHasFacts('declaration.method.public.internal', 'declaration.method.getter.public.internal')
		).toBe(true);
		expect(portablePathHasFacts('declaration.method', 'declaration.method')).toBe(true);
	});

	it('requires every fact, its whole segment, its order, and the same namespace', () => {
		for (const read of [
			'declaration.method.getter',
			'declaration.method.getter.publicity',
			'modifier.declaration.method.getter.public',
			'expression.method.getter.public'
		])
			expect(portablePathHasFacts('declaration.method.public', read), read).toBe(false);
		expect(
			portablePathHasFacts('declaration.method.public.internal', 'declaration.method.internal.getter.public')
		).toBe(false);
	});

	it.each([
		['assignment', 'pattern.assignment', 'pattern.object.assignment'],
		['constant', 'declaration.constant', 'declaration.variable.constant'],
		['default', 'clause.default', 'clause.case.default'],
		['map', 'pattern.map', 'pattern.rest.map'],
		['match', 'clause.match', 'clause.case.match'],
		['member', 'expression.member', 'expression.call.member'],
		['object', 'type.object', 'type.primitive.object'],
		['rest', 'pattern.rest', 'pattern.struct.rest'],
		['signature', 'declaration.signature', 'declaration.method.signature'],
		['struct', 'declaration.struct', 'declaration.enum_member.struct']
	])('reads %s as the kind it names, never as a refinement of another kind spelled the same', (_, guard, read) => {
		expect(portablePathHasFacts(guard, read)).toBe(false);
		expect(portablePathHasFacts(guard, guard)).toBe(true);
	});

	it('matches a refinement under its own kind across other refinements', () => {
		expect(portablePathHasFacts('pattern.rest', 'pattern.rest.map')).toBe(true);
		expect(portablePathHasFacts('pattern.rest.map', 'pattern.rest.map')).toBe(true);
		expect(portablePathHasFacts('declaration.property.getter', 'declaration.property.signature.abstract.getter')).toBe(
			true
		);
		expect(portablePathHasFacts('literal.number.integer.binary', 'literal.number.integer.big.binary')).toBe(true);
		expect(portablePathHasFacts('literal.string.raw', 'literal.string.bytes.raw')).toBe(true);
	});

	it('holds for no read path when there is none', () => {
		expect(portablePathHasFacts('declaration', undefined)).toBe(false);
	});
});
