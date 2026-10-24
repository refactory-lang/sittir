import { describe, expect, it } from 'vitest';
import { applyWirePatternReplacement, evaluatedConfig, withWireContext, type DeclaredPattern, type WireContext } from '../wire/wire.ts';

type Fn = ($: unknown, previous?: unknown) => unknown;
const str = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const parenX = () => seq(str('('), sym('x'), str(')'));

const wireContext = (): WireContext => withWireContext(null, (ctx) => ctx).ctx;
const pattern = (key: string): DeclaredPattern[] => [{ key, body: parenX() }];

describe('pattern injection', () => {
	it('an authored hidden rule replaces every structural match with a plain reference and keeps its own body', () => {
		const rules: Record<string, Fn> = { _paren_x: () => parenX(), a: () => seq(sym('k'), parenX()), b: () => seq(parenX(), sym('k')) };
		applyWirePatternReplacement(rules, new Set(['_paren_x']), [], wireContext());
		expect(Object.keys(rules).sort()).toEqual(['_paren_x', 'a', 'b']);
		const a = rules.a!({}) as { members: unknown[] };
		const b = rules.b!({}) as { members: unknown[] };
		expect(a.members[1]).toEqual({ type: 'SYMBOL', name: '_paren_x' });
		expect(b.members[0]).toEqual({ type: 'SYMBOL', name: '_paren_x' });
		expect(rules._paren_x!({})).toEqual(parenX());
	});

	it('a groups: entry mints its hidden rule and aliases every match to its key', () => {
		const rules: Record<string, Fn> = { a: () => seq(sym('k'), parenX()) };
		applyWirePatternReplacement(rules, new Set(), pattern('paren_x'), wireContext());
		expect(Object.keys(rules).sort()).toEqual(['_paren_x', 'a']);
		const a = rules.a!({}) as { members: { type: string; value?: string }[] };
		expect(a.members[1]).toMatchObject({ type: 'ALIAS', value: 'paren_x' });
	});

	it('a hidden key under groups: is refused, naming the rules: section a hidden pattern belongs in', () => {
		expect(() => evaluatedConfig({ groups: { _paren_x: () => parenX() } })).toThrow(/rules:/);
	});
});
