import { describe, expect, it, vi } from 'vitest';
import type { GrammarTypeMap } from '@sittir/types';
import { inEngine } from '../src/engine-scope.ts';
import { withMembers } from './support/members.ts';
import { stampBuilt } from '../src/source-stamp.ts';
import { liveHandle } from './support/fake-engine.ts';
import {
	admitAliasContent,
	bindRuntime,
	coerceKindEnumStorage,
	coerceMixedEnumStorage,
	delegate,
	listStorage,
	rejectBareText,
	rejectKeywordText
} from '../src/utils.ts';

describe('bindRuntime', () => {
	const runtime = bindRuntime<GrammarTypeMap>();

	it('isNode recognises a node by its source stamp, never by its shape', () => {
		expect(runtime.isNode(stampBuilt({ $type: 2 }))).toBe(true);
		expect(runtime.isNode({ $type: 2, $source: 2 })).toBe(false);
		expect(runtime.isNode('text')).toBe(false);
		expect(runtime.isNode({ kind: 'leaf' })).toBe(false);
	});

	it('members render through the engine in scope', () => {
		const render = vi.fn(() => 'rendered');
		const node = inEngine(liveHandle({ render }), () => withMembers(stampBuilt({ $type: 2 })));
		expect(node.$render()).toBe('rendered');
		expect(render).toHaveBeenCalledWith(node);
	});

	it('members on a node built outside any engine cannot render', () => {
		const node = withMembers(stampBuilt({ $type: 2 }));
		expect(() => node.$render()).toThrow(/no engine.*engine\.render\(node\)/);
	});
});

describe('grammar-free runtime helpers', () => {
	it('rejectBareText refuses a string, inside arrays too', () => {
		const built = { $type: 2 };
		expect(rejectBareText(built, 'f', 'a leaf')).toBe(built);
		expect(() => rejectBareText('x', 'f', 'a leaf')).toThrow('f: a strict factory takes a built node');
		expect(() => rejectBareText([built, 'x'], 'f', 'a leaf')).toThrow("expected a leaf, or the default engine's builder, which takes loose input");
		expect(() => rejectBareText(1n, 'f', 'a leaf')).toThrow('f: a strict factory takes a built node, not a bigint');
		expect(rejectBareText(7, 'f', 'a leaf')).toBe(7);
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
		expect(listStorage(['+', undefined], (item) => coerceMixedEnumStorage(item, byText))).toEqual([10]);
	});

	it('coerceKindEnumStorage maps text and node text to ids and refuses unknown text', () => {
		const byText = [['pub', 20] as const];
		expect(coerceKindEnumStorage('pub', byText)).toBe(20);
		expect(coerceKindEnumStorage(stampBuilt({ $type: 3, $text: 'pub' }), byText)).toBe(20);
		expect(coerceKindEnumStorage({ $type: 21 }, byText)).toBe(21);
		expect(() => coerceKindEnumStorage('priv', byText)).toThrow('kind-enum slot: "priv" is not a valid value (expected one of: pub)');
	});

	it('delegate forwards every argument to the shared builder it wraps, as a function of its own', () => {
		const shared = (x: number, y?: number) => x + (y ?? 0);
		const wrapped = delegate(shared);
		expect(wrapped).not.toBe(shared);
		expect(wrapped(1, 2)).toBe(3);
		Object.assign(wrapped, { extra: 1 });
		expect('extra' in shared).toBe(false);
	});
});
