import { describe, expect, it } from 'vitest';
import { portablePathHasFacts, readableEntries, tokenKind } from '../src/portable/facts.ts';
import type { PortableSeat } from '@sittir/types';

describe('portablePathHasFacts', () => {
	it('holds when the read path names every fact of the guard path, in order, other facts between', () => {
		expect(portablePathHasFacts('declaration.member.method.public', 'declaration.member.method.getter.public')).toBe(true);
		expect(
			portablePathHasFacts('declaration.member.method.public.internal', 'declaration.member.method.getter.public.internal')
		).toBe(true);
		expect(portablePathHasFacts('declaration.member.method', 'declaration.member.method')).toBe(true);
	});

	it('requires every fact, its whole segment, its order, and the same namespace', () => {
		for (const read of [
			'declaration.member.method.getter',
			'declaration.member.method.getter.publicity',
			'modifier.declaration.method.getter.public',
			'expression.method.getter.public'
		])
			expect(portablePathHasFacts('declaration.member.method.public', read), read).toBe(false);
		expect(
			portablePathHasFacts('declaration.member.method.public.internal', 'declaration.member.method.internal.getter.public')
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
		['signature', 'declaration.member.signature', 'declaration.member.method.signature'],
		['struct', 'declaration.type.struct', 'declaration.member.enum_member.struct']
	])('reads %s as the kind it names, never as a refinement of another kind spelled the same', (_, guard, read) => {
		expect(portablePathHasFacts(guard, read)).toBe(false);
		expect(portablePathHasFacts(guard, guard)).toBe(true);
	});

	it('matches a refinement under its own kind across other refinements', () => {
		expect(portablePathHasFacts('pattern.rest', 'pattern.rest.map')).toBe(true);
		expect(portablePathHasFacts('pattern.rest.map', 'pattern.rest.map')).toBe(true);
		expect(portablePathHasFacts('declaration.member.property.getter', 'declaration.member.property.signature.abstract.getter')).toBe(
			true
		);
		expect(portablePathHasFacts('literal.number.integer.binary', 'literal.number.integer.big.binary')).toBe(true);
		expect(portablePathHasFacts('literal.string.raw', 'literal.string.bytes.raw')).toBe(true);
	});

	it("takes a namespace's segment as part of the kind it holds, not as a fact of another", () => {
		expect(portablePathHasFacts('declaration.member', 'declaration.member.method.signature')).toBe(true);
		expect(portablePathHasFacts('declaration.member.signature', 'declaration.member.signature.index')).toBe(true);
		expect(portablePathHasFacts('declaration.member.field', 'declaration.member.method')).toBe(false);
		expect(portablePathHasFacts('declaration.type.enum', 'declaration.member.enum_member')).toBe(false);
		expect(portablePathHasFacts('expression.collection', 'expression.collection.list.repeat')).toBe(true);
		expect(portablePathHasFacts('expression.collection.tuple', 'expression.collection.list')).toBe(false);
		expect(portablePathHasFacts('expression.binary.arithmetic', 'expression.binary.arithmetic.add')).toBe(true);
		expect(portablePathHasFacts('expression.binary.arithmetic', 'expression.binary.comparison.equal')).toBe(false);
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
		expect(paths(readableEntries([entry('declaration.member.method', [], [7]), entry('declaration.function.inner', [{ up: 1 }]), entry('declaration.function')]))).toEqual([
			'declaration.function'
		]);
	});
});

describe('tokenKind', () => {
	const seats = [{ kinds: [], tokens: { '+': 7, in: 9 } }] as unknown as readonly PortableSeat[];

	it("reads a token's kind by its text", () => {
		expect(tokenKind('+', seats)).toBe(7);
		expect(tokenKind('in', seats)).toBe(9);
		expect(tokenKind('-', seats)).toBeUndefined();
	});

	it("reads only the seat's own tokens, never an inherited property", () => {
		for (const text of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) expect(tokenKind(text, seats)).toBeUndefined();
	});
});
