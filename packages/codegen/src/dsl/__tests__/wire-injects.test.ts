import { describe, expect, it } from 'vitest';
import { applyWirePatternReplacement, withWireContext, type WireContext } from '../wire/wire.ts';

type Fn = ($: unknown, previous?: unknown) => unknown;
const str = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const parenX = () => seq(str('('), sym('x'), str(')'));

const wireContext = (): WireContext => withWireContext(null, (ctx) => ctx).ctx;

describe('injects', () => {
	it('a hidden inject replaces every structural match with a plain reference and defines the rule once', () => {
		const rules: Record<string, Fn> = { a: () => seq(sym('k'), parenX()), b: () => seq(parenX(), sym('k')) };
		applyWirePatternReplacement(rules, new Set(), undefined, wireContext(), { _paren_x: () => parenX() });
		expect(Object.keys(rules).sort()).toEqual(['_paren_x', 'a', 'b']);
		const a = rules.a!({}) as { members: unknown[] };
		const b = rules.b!({}) as { members: unknown[] };
		expect(a.members[1]).toEqual({ type: 'SYMBOL', name: '_paren_x' });
		expect(b.members[0]).toEqual({ type: 'SYMBOL', name: '_paren_x' });
		expect(rules._paren_x!({})).toEqual(parenX());
	});

	it('a visible inject behaves exactly as the same groups entry', () => {
		const viaGroups: Record<string, Fn> = { a: () => seq(sym('k'), parenX()) };
		const viaInjects: Record<string, Fn> = { a: () => seq(sym('k'), parenX()) };
		applyWirePatternReplacement(viaGroups, new Set(), { paren_x: () => parenX() }, wireContext());
		applyWirePatternReplacement(viaInjects, new Set(), undefined, wireContext(), { paren_x: () => parenX() });
		expect(viaInjects.a!({})).toEqual(viaGroups.a!({}));
		expect(Object.keys(viaInjects).sort()).toEqual(Object.keys(viaGroups).sort());
		const a = viaInjects.a!({}) as { members: { type: string; value?: string }[] };
		expect(a.members[1]).toMatchObject({ type: 'ALIAS', value: 'paren_x' });
	});

	it('a hidden key under groups is redirected to injects', () => {
		expect(() => applyWirePatternReplacement({}, new Set(), { _paren_x: () => parenX() }, wireContext())).toThrow(
			/injects/
		);
	});
});
