import { describe, expect, it } from 'vitest';
import { inlinesAtReference, type SymbolSource } from '../rule-patterns.ts';
import {
	assertPredictedKindEntries,
	catalogRenames,
	predictKindCatalog,
	predictedSymbolSourceOf,
	type GeneratedKindEntry
} from '../symbol-table.ts';
import type { AnyRule } from '../../types/rule.ts';

const sym = (name: string) => ({ type: 'SYMBOL' as const, name });
const str = (value: string) => ({ type: 'STRING', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const alias = (content: unknown, value: string, named = true) => ({ type: 'ALIAS', named, value, content });

function grammarOf(rules: Record<string, unknown>, opts: { externals?: string[]; extras?: string[] } = {}) {
	return {
		rules: rules as Record<string, AnyRule>,
		externals: (opts.externals ?? []).map(sym),
		extras: (opts.extras ?? []).map(sym),
		inline: [],
		supertypes: [],
		word: null
	};
}

const renamesOf = (rules: Record<string, unknown>, opts: { extras?: string[] } = {}) =>
	Object.fromEntries(catalogRenames(Object.keys(rules), predictKindCatalog(grammarOf(rules, opts)).entries));

describe('predicted symbol facts', () => {
	const rules = {
		source: seq(sym('_item'), alias(sym('_named'), 'named'), sym('word'), sym('_ext'), sym('_declared')),
		_item: choice(str('a'), sym('word')),
		_named: seq(str('('), str(')')),
		word: str('w')
	};
	const symbols: SymbolSource = predictedSymbolSourceOf({
		...grammarOf(rules, { externals: ['_ext', '_declared'] }),
		visibleExternals: { _declared: true }
	});

	it('a hidden rule every reference aliases to one name is not hidden', () => {
		expect(symbols.isHidden('_item')).toBe(true);
		expect(symbols.isHidden('_named')).toBe(false);
	});
	it('an external is visible when the grammar declares it', () => {
		expect(symbols.isVisibleExternal('_declared')).toBe(true);
		expect(symbols.isVisibleExternal('_ext')).toBe(false);
	});
	it('the inline predicate reads only the source', () => {
		const ctx = { symbols, inlineNames: new Set<string>(), selfReferencing: new Map<string, boolean>() };
		expect(inlinesAtReference('_item', ctx)).toBe(true);
		expect(inlinesAtReference('word', ctx)).toBe(false);
	});
});

describe('catalogRenames over the predicted catalog', () => {
	it('renames a symbol with no bare reference to its most frequent named alias, ties to the first site', () => {
		const rules = {
			source: seq(alias(sym('_a'), 'x'), alias(sym('_a'), 'y'), alias(sym('_a'), 'y'), alias(sym('_b'), 'p'), alias(sym('_b'), 'q')),
			_a: seq(str('a'), str('a')),
			_b: seq(str('b'), str('b'))
		};
		expect(renamesOf(rules)).toEqual({ _a: 'y', _b: 'p' });
	});
	it('keeps a symbol that is also referenced bare or only through an anonymous alias', () => {
		const rules = {
			source: seq(alias(sym('_a'), 'x'), sym('_a'), alias(sym('_b'), 'b', false)),
			_a: seq(str('a'), str('a')),
			_b: seq(str('b'), str('b'))
		};
		expect(renamesOf(rules)).toEqual({});
	});
	it('keeps both symbols when two claim one name, and a symbol whose name another rule already holds', () => {
		const rules = {
			source: seq(alias(sym('_a'), 'x'), alias(sym('_b'), 'x'), alias(sym('_c'), 'taken'), sym('taken')),
			_a: seq(str('a'), str('a')),
			_b: seq(str('b'), str('b')),
			_c: seq(str('c'), str('c')),
			taken: seq(str('t'), str('t'))
		};
		expect(renamesOf(rules)).toEqual({});
	});
	it('counts only uses reachable from the start rule and the extras', () => {
		const rules = {
			source: alias(sym('_a'), 'x'),
			comment: alias(sym('_c'), 'c'),
			orphan: sym('_a'),
			_a: seq(str('a'), str('a')),
			_c: seq(str('c'), str('c'))
		};
		expect(renamesOf(rules)).toEqual({ _a: 'x' });
		expect(renamesOf(rules, { extras: ['comment'] })).toEqual({ _a: 'x', _c: 'c' });
	});
});

describe('predictKindCatalog over a grammar tree-sitter rejects', () => {
	it('returns the undefined names beside the rows of every defined name, which keep their class', () => {
		const rules = { source: seq(sym('item'), sym('missing')), item: seq(str('i'), sym('word')), word: str('w') };
		const catalog = predictKindCatalog(grammarOf(rules));
		expect(catalog.undefinedNames).toEqual(['missing']);
		expect(catalog.entries.find((entry) => entry.kind === 'missing')).toBeUndefined();
		expect(catalog.entries.find((entry) => entry.kind === 'source')?.terminal).toBeUndefined();
		expect(catalog.entries.find((entry) => entry.kind === 'item')?.terminal).toBeUndefined();
		expect(catalog.entries.find((entry) => entry.kind === 'word')?.terminal).toBe(true);
	});
});

describe('assertPredictedKindEntries', () => {
	const row = (kind: string, extra: Partial<GeneratedKindEntry> = {}): GeneratedKindEntry => ({ kind, id: 1, ...extra });

	it('passes when every row agrees on every read field, whatever the ids', () => {
		expect(() => assertPredictedKindEntries([row('a', { id: 7 })], [row('a')])).not.toThrow();
	});
	it('lists each disagreeing field and each row only one side has', () => {
		expect(() => assertPredictedKindEntries([row('a', { hidden: true }), row('b')], [row('a'), row('c')])).toThrow(
			/a\.hidden: predicted true, catalog undefined[\s\S]*c: in the catalog, not predicted[\s\S]*b: predicted, not in the catalog/
		);
	});
});
