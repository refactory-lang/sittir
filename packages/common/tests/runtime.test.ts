import { describe, expect, it, vi } from 'vitest';
import type { GrammarTypeMap } from '@sittir/types';
import { inEngine } from '../src/engine-scope.ts';
import { withMembers } from './support/members.ts';
import { liveHandle } from './support/fake-engine.ts';
import {
	admitAliasContent,
	bindRuntime,
	bundle,
	coerceKindEnumStorage,
	coerceMixedEnumStorage,
	hoist,
	hoistRoutes,
	rejectBareText,
	rejectKeywordText
} from '../src/utils.ts';

describe('bindRuntime', () => {
	const runtime = bindRuntime<GrammarTypeMap>();

	it('isNode recognises node data only', () => {
		expect(runtime.isNode({ $type: 2, $source: 2 })).toBe(true);
		expect(runtime.isNode('text')).toBe(false);
		expect(runtime.isNode({ kind: 'leaf' })).toBe(false);
	});

	it('members render through the engine in scope', () => {
		const render = vi.fn(() => 'rendered');
		const node = inEngine(liveHandle({ render }), () => withMembers({ $type: 2, $source: 2 }));
		expect(node.$render()).toBe('rendered');
		expect(render).toHaveBeenCalledWith(node);
	});

	it('members on a node built outside any engine cannot render', () => {
		const node = withMembers({ $type: 2, $source: 2 });
		expect(() => node.$render()).toThrow(/no engine.*engine\.render\(node\)/);
	});
});

describe('grammar-free runtime helpers', () => {
	it('rejectBareText refuses a string, inside arrays too', () => {
		const built = { $type: 2 };
		expect(rejectBareText(built, 'f', 'a leaf')).toBe(built);
		expect(() => rejectBareText('x', 'f', 'a leaf')).toThrow('f: a strict factory takes a built node');
		expect(() => rejectBareText([built, 'x'], 'f', 'a leaf')).toThrow('expected a leaf, or use .coerce');
	});

	it("rejectKeywordText refuses a word leaf spelling the slot's keyword", () => {
		expect(rejectKeywordText({ $type: 7, $text: 'x' }, 'f', 7, ['fn'])).toEqual({ $type: 7, $text: 'x' });
		expect(() => rejectKeywordText({ $type: 7, $text: 'fn' }, 'f', 7, ['fn'])).toThrow("f: 'fn' is this slot's keyword");
		expect(rejectKeywordText({ $type: 8, $text: 'fn' }, 'f', 7, ['fn'])).toEqual({ $type: 8, $text: 'fn' });
	});

	it('admitAliasContent builds the alias whose storage holds the id', () => {
		const build = (content: unknown) => ({ alias: content });
		expect(admitAliasContent({ $type: 4 }, [[[4], build]])).toEqual({ alias: { $type: 4 } });
		expect(admitAliasContent(4, [[[4], build]])).toEqual({ alias: 4 });
		expect(admitAliasContent([{ $type: 5 }], [[[4], build]])).toEqual([{ $type: 5 }]);
	});

	it('coerceMixedEnumStorage maps text to ids and keeps unmapped text', () => {
		const byText = [['+', 10] as const];
		expect(coerceMixedEnumStorage('+', byText)).toBe(10);
		expect(coerceMixedEnumStorage('other', byText)).toBe('other');
		expect(coerceMixedEnumStorage({ $type: 10 }, byText)).toBe(10);
		expect(coerceMixedEnumStorage(['+', undefined], byText)).toEqual([10]);
	});

	it('coerceKindEnumStorage maps text and node text to ids and refuses unknown text', () => {
		const byText = [['pub', 20] as const];
		expect(coerceKindEnumStorage('pub', byText)).toBe(20);
		expect(coerceKindEnumStorage({ $type: 3, $source: 2, $text: 'pub' }, byText)).toBe(20);
		expect(coerceKindEnumStorage({ $type: 21 }, byText)).toBe(21);
		expect(() => coerceKindEnumStorage('priv', byText)).toThrow('kind-enum slot: "priv" is not a valid value (expected one of: pub)');
	});

	it('bundle pairs the flavours with their stamp; hoist calls coerce by default and keeps the routes', () => {
		const strict = (x: number) => `s${x}`;
		const coerce = (x: number) => `c${x}`;
		const pair = bundle(strict, coerce, { key: 'pair', max: 1 });
		expect(pair).toEqual({ strict, coerce, arity: { key: 'pair', max: 1 } });
		const hoisted = hoist(pair);
		expect(hoisted(1)).toBe('c1');
		expect(hoisted.strict(1)).toBe('s1');
		expect('arity' in hoisted).toBe(false);
		expect(hoist(bundle(strict, undefined, { key: 'strict', max: 1 }))(2)).toBe('s2');
	});

	it('a pair whose strict entry is a constant hoists to its coercer', () => {
		const hoisted = hoist(bundle(7, (_input?: string) => 7, { key: 'kw', max: 1 }));
		expect(hoisted()).toBe(7);
		expect(hoisted.strict).toBe(7);
		expect(() => (hoisted as (...a: unknown[]) => number)('x', 'y')).toThrow('kw: takes at most 1 argument, got 2');
	});

	it('hoist refuses more arguments than the pair stamp allows, and a rest callable takes no stamp', () => {
		const sum = (x: number, y?: number) => x + (y ?? 0);
		const hoisted = hoist(bundle(sum, sum, { key: 'sum', max: 2 }));
		expect(hoisted(1, 2)).toBe(3);
		expect(() => (hoisted as (...a: number[]) => number)(1, 2, 3)).toThrow('sum: takes at most 2 arguments, got 3');
		expect(() => (hoisted as (...a: unknown[]) => number)(1, undefined, undefined)).toThrow('got 3');
		expect(hoist(bundle((...xs: number[]) => xs.length, undefined))(1, 2, 3)).toBe(3);
	});

	it('the stamp is typed by the pair it is built with: a wrong or missing arity is a type error', () => {
		const strict = (x: number) => x;
		// @ts-expect-error the callable takes at most one argument
		bundle(strict, undefined, { key: 'strict', max: 2 });
		// @ts-expect-error a fixed-arity callable must carry its stamp
		bundle(strict, undefined);
		// @ts-expect-error the stamp follows the coerce flavour when there is one
		bundle(strict, (x: number, y: number) => x + y, { key: 'pair', max: 1 });
	});

	it('a pair spread into a route object carries its stamp, and a later pair replaces it', () => {
		const one = (x: number) => x;
		const two = (x: number, y?: number) => x + (y ?? 0);
		const routes = hoistRoutes({ a: { ...bundle(one, one, { key: 'a', max: 1 }), b: bundle(two, two, { key: 'a.b', max: 2 }) } });
		expect(() => (routes.a as (...a: number[]) => number)(1, 2)).toThrow('a: takes at most 1 argument, got 2');
		expect(routes.a.b(1, 2)).toBe(3);
		expect(() => (routes.a.b as (...a: number[]) => number)(1, 2, 3)).toThrow('a.b: takes at most 2 arguments, got 3');
		const replaced = hoist({ ...bundle(one, one, { key: 'a', max: 1 }), ...bundle(two, two, { key: 'a', max: 2 }) });
		expect(replaced(1, 2)).toBe(3);
	});

	it('hoistRoutes hoists every nested flavour pair and leaves other values', () => {
		const strict = (x: number) => `s${x}`;
		const routes = hoistRoutes({ a: { strict }, b: { c: { strict, coerce: (x: number) => `c${x}` } }, n: 1 });
		expect(routes.a(1)).toBe('s1');
		expect(routes.b.c(2)).toBe('c2');
		expect(routes.n).toBe(1);
	});
});
