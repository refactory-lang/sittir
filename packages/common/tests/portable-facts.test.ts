import { describe, expect, it } from 'vitest';
import { portablePathHasFacts, readableEntries } from '../src/portable/facts.ts';

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

describe('readableEntries', () => {
	const entry = (path: string, test: readonly { readonly up: number }[] = [], within: readonly unknown[] = []) => ({ path, test, within });
	const paths = (entries: readonly { readonly path: string }[]) => entries.map(({ path }) => path);

	it('passes over an entry that an unconditional entry refines, whatever their order', () => {
		expect(paths(readableEntries([entry('declaration.parameter'), entry('declaration.parameter.receiver')]))).toEqual(['declaration.parameter.receiver']);
		expect(paths(readableEntries([entry('declaration.parameter.receiver'), entry('declaration.parameter')]))).toEqual(['declaration.parameter.receiver']);
	});

	it('keeps an entry a conditional entry refines, since the refinement may not hold', () => {
		expect(paths(readableEntries([entry('declaration.parameter.private', [{ up: 0 }]), entry('declaration.parameter')]))).toEqual([
			'declaration.parameter.private',
			'declaration.parameter'
		]);
	});

	it('stops at an unconditional entry nothing refines, since it always reads first', () => {
		expect(paths(readableEntries([entry('declaration.parameter.receiver'), entry('declaration.parameter.private', [{ up: 0 }])]))).toEqual([
			'declaration.parameter.receiver'
		]);
	});

	it('leaves out an entry that depends on where the node sits', () => {
		expect(paths(readableEntries([entry('declaration.method', [], [7]), entry('declaration.function.inner', [{ up: 1 }]), entry('declaration.function')]))).toEqual([
			'declaration.function'
		]);
	});
});
