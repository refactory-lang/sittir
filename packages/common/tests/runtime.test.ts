import { describe, expect, it, vi } from 'vitest';
import type { GrammarTypeMap } from '@sittir/types';
import { inEngine } from '../src/engine-scope.ts';
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

	it('withMethods renders through the engine in scope', () => {
		const render = vi.fn(() => 'rendered');
		const node = inEngine(liveHandle({ render }), () => runtime.withMethods({ $type: 2, $source: 2 }));
		expect(node.$render()).toBe('rendered');
		expect(render).toHaveBeenCalledWith(node);
	});

	it('withMethods on a node built outside any engine cannot render', () => {
		const node = runtime.withMethods({ $type: 2, $source: 2 });
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

	it('bundle pairs the flavours; hoist calls coerce by default and keeps the routes', () => {
		const strict = (x: number) => `s${x}`;
		const coerce = (x: number) => `c${x}`;
		const pair = bundle(strict, coerce);
		expect(pair).toEqual({ strict, coerce });
		const hoisted = hoist(pair, { key: 'pair', max: 1 });
		expect(hoisted(1)).toBe('c1');
		expect(hoisted.strict(1)).toBe('s1');
		expect(hoist({ strict }, { key: 'strict', max: 1 })(2)).toBe('s2');
	});

	it('hoist refuses more arguments than its stamp allows, and a rest callable takes no stamp', () => {
		const pair = bundle((x: number, y?: number) => x + (y ?? 0), (x: number, y?: number) => x + (y ?? 0));
		const hoisted = hoist(pair, { key: 'sum', max: 2 });
		expect(hoisted(1, 2)).toBe(3);
		expect(() => (hoisted as (...a: number[]) => number)(1, 2, 3)).toThrow('sum: takes at most 2 arguments, got 3');
		expect(() => (hoisted as (...a: unknown[]) => number)(1, undefined, undefined)).toThrow('got 3');
		expect(hoist({ strict: (...xs: number[]) => xs.length })(1, 2, 3)).toBe(3);
	});

	it('the stamp is typed by the hoisted callable: a wrong or missing arity is a type error', () => {
		const strict = (x: number) => x;
		// @ts-expect-error the callable takes at most one argument
		hoist({ strict }, { key: 'strict', max: 2 });
		// @ts-expect-error a fixed-arity callable must carry its stamp
		hoist({ strict });
	});

	it('hoistRoutes hoists every nested flavour pair and leaves other values', () => {
		const strict = (x: number) => `s${x}`;
		const routes = hoistRoutes({ a: { strict }, b: { c: { strict, coerce: (x: number) => `c${x}` } }, n: 1 });
		expect(routes.a(1)).toBe('s1');
		expect(routes.b.c(2)).toBe('c2');
		expect(routes.n).toBe(1);
	});
});
