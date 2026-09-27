import { describe, expect, it } from 'vitest';
import {
	assertPredictionAgrees,
	inlinesAtReference,
	predictedRenames,
	predictedSymbolSource,
	symbolFactsOf,
	type SymbolSource
} from '../rule-patterns.ts';
import type { AnyRule } from '../../types/rule.ts';

const sym = (name: string) => ({ type: 'SYMBOL' as const, name });
const str = (value: string) => ({ type: 'STRING', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const alias = (content: unknown, value: string, named = true) => ({ type: 'ALIAS', named, value, content });

function sourceOf(
	rules: Record<string, unknown>,
	opts: { externals?: string[]; extras?: string[]; visibleExternals?: string[] } = {}
): SymbolSource {
	return predictedSymbolSource(
		symbolFactsOf({
			rules: rules as Record<string, AnyRule>,
			externals: (opts.externals ?? []).map(sym),
			inline: [],
			supertypes: [],
			extras: (opts.extras ?? []).map(sym),
			visibleExternals: Object.fromEntries((opts.visibleExternals ?? []).map((name) => [name, true]))
		})
	);
}

const renamesOf = (rules: Record<string, unknown>, opts: { extras?: string[]; visibleExternals?: string[] } = {}) =>
	Object.fromEntries(predictedRenames(rules as Record<string, AnyRule>, new Set(opts.extras ?? []), sourceOf(rules, opts)));

describe('predicted symbol facts', () => {
	const rules = {
		source: seq(sym('_item'), alias(sym('_named'), 'named'), sym('word')),
		_item: choice(str('a'), sym('word')),
		_named: seq(str('('), str(')')),
		word: str('w')
	};
	const symbols = sourceOf(rules, { externals: ['_ext', 'visible_ext', '_declared'], visibleExternals: ['_declared'] });

	it('a hidden rule every reference aliases to one name is not hidden', () => {
		expect(symbols.isHidden('_item')).toBe(true);
		expect(symbols.isHidden('_named')).toBe(false);
	});
	it('an external is visible when its name has no underscore and no body, or when the grammar declares it', () => {
		expect(symbols.isVisibleExternal('visible_ext')).toBe(true);
		expect(symbols.isVisibleExternal('_declared')).toBe(true);
		expect(symbols.isVisibleExternal('_ext')).toBe(false);
	});
	it('the inline predicate reads only the source', () => {
		const ctx = { symbols, inlineNames: new Set<string>(), selfReferencing: new Map<string, boolean>() };
		expect(inlinesAtReference('_item', ctx)).toBe(true);
		expect(inlinesAtReference('word', ctx)).toBe(false);
	});
});

describe('predictedRenames', () => {
	it('renames a symbol with no bare reference to its most frequent named alias, ties to the first site', () => {
		const rules = {
			source: seq(alias(sym('_a'), 'x'), alias(sym('_a'), 'y'), alias(sym('_a'), 'y'), alias(sym('_b'), 'p'), alias(sym('_b'), 'q')),
			_a: str('a'),
			_b: str('b')
		};
		expect(renamesOf(rules)).toEqual({ _a: 'y', _b: 'p' });
	});
	it('keeps a symbol that is also referenced bare or only through an anonymous alias', () => {
		const rules = { source: seq(alias(sym('_a'), 'x'), sym('_a'), alias(sym('_b'), 'b', false)), _a: str('a'), _b: str('b') };
		expect(renamesOf(rules)).toEqual({});
	});
	it('keeps a declared visible external', () => {
		const rules = { source: alias(sym('_ext'), 'ext') };
		expect(renamesOf(rules, { visibleExternals: ['_ext'] })).toEqual({});
		expect(renamesOf(rules)).toEqual({ _ext: 'ext' });
	});
	it('keeps both symbols when two claim one name, and a symbol whose name another rule already holds', () => {
		const rules = {
			source: seq(alias(sym('_a'), 'x'), alias(sym('_b'), 'x'), alias(sym('_c'), 'taken')),
			_a: str('a'),
			_b: str('b'),
			_c: str('c'),
			taken: str('t')
		};
		expect(renamesOf(rules)).toEqual({});
	});
	it('counts only uses reachable from the start rule and the extras', () => {
		const rules = {
			source: alias(sym('_a'), 'x'),
			comment: alias(sym('_c'), 'c'),
			orphan: sym('_a'),
			_a: str('a'),
			_c: str('c')
		};
		expect(renamesOf(rules)).toEqual({ _a: 'x' });
		expect(renamesOf(rules, { extras: ['comment'] })).toEqual({ _a: 'x', _c: 'c' });
	});
});

describe('assertPredictionAgrees', () => {
	const rules = { source: seq(sym('_item'), sym('word')), _item: choice(str('a'), sym('word')), word: str('w') };
	const predicted = sourceOf(rules);
	const none = new Map<string, string>();

	it('passes when both sources answer every fact the inline predicate reads alike', () => {
		expect(() =>
			assertPredictionAgrees({ predicted, catalog: predicted, inlineNames: new Set(), renames: { predicted: none, catalog: none } })
		).not.toThrow();
	});
	it('lists each reference whose trace differs, and each rename that differs', () => {
		const catalog: SymbolSource = { ...predicted, isHidden: (name) => name !== '_item' && predicted.isHidden(name) };
		expect(() =>
			assertPredictionAgrees({
				predicted,
				catalog,
				inlineNames: new Set(),
				renames: { predicted: none, catalog: new Map([['_item', 'item']]) }
			})
		).toThrow(
			/_item: predicted \[isSupertype\(_item\)=false, isHidden\(_item\)=true.*\], catalog \[isSupertype\(_item\)=false, isHidden\(_item\)=false -> inline=false\][\s\S]*_item: renamed to \(none\) predicted, item in the catalog/
		);
	});
});
