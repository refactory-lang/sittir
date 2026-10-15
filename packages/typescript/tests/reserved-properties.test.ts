import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

function memberNames(node: object): string[] {
	const names = new Set<string>();
	for (let o: object | null = node; o !== null && o !== Object.prototype && o !== Array.prototype; o = Object.getPrototypeOf(o)) {
		for (const name of Object.getOwnPropertyNames(o)) if (/^[a-z]/.test(name) && !(name in Array.prototype)) names.add(name);
	}
	return [...names];
}

function hasKind(node: unknown, kind: number): boolean {
	if (node === kind) return true;
	if (node === null || typeof node !== 'object') return false;
	if ((node as { $type?: unknown }).$type === kind) return true;
	return memberNames(node).some((name) => {
		const member = (node as Record<string, unknown>)[name];
		if (typeof member !== 'function' || member.length !== 0) return false;
		const held: unknown = member.call(node);
		return (Array.isArray(held) ? held : [held]).some((child) => hasKind(child, kind));
	});
}

describe('the reserved set in effect at a position', () => {
	it('admits a keyword where a rule-level reserved set is empty', () => {
		const member = ts.build.memberExpression({ object: 'Symbol', separator: '.', property: 'for' } as never);
		expect(member.$render!()).toBe('Symbol.for');
		expect(ts.parse('Symbol.for;').$render!().toString()).toBe('Symbol.for;');
	});

	it('still refuses the keyword at a plain identifier', () => {
		expect(() => (ts.build.identifier as (text: string) => unknown)('for')).toThrow("identifier: 'for' is a reserved word");
	});

	it.each(['a?.for;', 'a?.class();', 'a?.await;', 'a?.static;'])('parses %s after an optional chain', (src) => {
		const tree = ts.parse(src);
		expect(tree.$render!().toString()).toBe(src);
		expect(JSON.stringify(tree)).not.toContain('ERROR');
	});

	it('builds an optional-chain member over a keyword property', () => {
		const member = ts.build.memberExpression({ object: 'a', separator: '?.', property: 'for' } as never);
		expect(member.$render!()).toBe('a?.for');
	});

	it.each([true, false])('renders the boolean %s as a literal value', (value) => {
		expect(ts.build.pair({ key: 'enabled', value } as never).$render!().toString()).toBe(`enabled: ${value}`);
	});

	it.each(['a?.for;', 'a?.class();', 'a?.await;', 'a.for;', 'a.b;'])('reads the property of %s as a property_identifier, never as a keyword kind', (src) => {
		const tree = ts.parse(src);
		expect(hasKind(tree, ts.kinds.PropertyIdentifier)).toBe(true);
		expect(hasKind(tree, ts.kinds.ForKeyword)).toBe(false);
		expect(hasKind(tree, ts.kinds.ClassKeyword)).toBe(false);
	});
});
