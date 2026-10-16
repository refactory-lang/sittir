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

describe('a decorator reads super as the object of a member expression', () => {
	const tree = ts.parse('class C {\n  @(super.decorate)\n  method2() {}\n}');

	it('reads the object as the super kind', () => {
		expect(hasKind(tree, ts.kinds.Super)).toBe(true);
	});
});
