import { describe, expect, it, vi } from 'vitest';
import type { AnyNodeData, GrammarFacts, GrammarTypeMap } from '@sittir/types';
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

function facts(innerGaps: GrammarFacts['trivia']['innerGaps']): GrammarFacts {
	return {
		render: vi.fn(() => 'rendered'),
		toEdit: vi.fn(() => ({ startPos: 0, endPos: 0, insertedText: 'rendered' })),
		trivia: { kindName: (type) => (type === 1 ? 'list' : type === 2 ? 'leaf' : undefined), kinds: new Set(), innerGaps }
	};
}

describe('bindRuntime', () => {
	const runtime = bindRuntime<GrammarTypeMap>(facts({ list: ['inner'] }));

	it('isEmpty holds only for a kind with an inner gap and no content', () => {
		expect(runtime.isEmpty({ $type: 1, $source: 2 } as AnyNodeData)).toBe(true);
		expect(runtime.isEmpty({ $type: 1, $source: 2, _items: [{ $type: 2, $source: 2 }] } as AnyNodeData)).toBe(false);
		expect(runtime.isEmpty({ $type: 2, $source: 2 } as AnyNodeData)).toBe(false);
		expect(runtime.isEmpty({ $type: 3, $source: 2 } as AnyNodeData)).toBe(false);
	});

	it('isNode recognises node data only', () => {
		expect(runtime.isNode({ $type: 2, $source: 2 })).toBe(true);
		expect(runtime.isNode('text')).toBe(false);
		expect(runtime.isNode({ kind: 'leaf' })).toBe(false);
	});

	it('withMethods renders through the engine it is handed', () => {
		const engine = facts({});
		const node = runtime.withMethods({ $type: 2, $source: 2 }, engine);
		expect(node.$render()).toBe('rendered');
		expect(engine.render).toHaveBeenCalledWith(node);
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
		const hoisted = hoist(pair);
		expect(hoisted(1)).toBe('c1');
		expect(hoisted.strict(1)).toBe('s1');
		expect(hoist({ strict })(2)).toBe('s2');
	});

	it('hoistRoutes hoists every nested flavour pair and leaves other values', () => {
		const strict = (x: number) => `s${x}`;
		const routes = hoistRoutes({ a: { strict }, b: { c: { strict, coerce: (x: number) => `c${x}` } }, n: 1 });
		expect(routes.a(1)).toBe('s1');
		expect(routes.b.c(2)).toBe('c2');
		expect(routes.n).toBe(1);
	});
});
