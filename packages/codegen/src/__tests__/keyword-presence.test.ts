import { describe, it, expect } from 'vitest';
import {
	keywordPresenceKind,
	keywordPresenceValue,
	keywordPresenceValues,
	keywordPresenceIsNonEmptyRepeat
} from '../emitters/shared.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNonterminal, NodeOrTerminal } from '../compiler/node-map.ts';
import { AssembledKeyword, AssembledPattern, AssembledEnum } from '../compiler/node-map.ts';

// ---------------------------------------------------------------------------
// Test helpers (mirrors resolve-effective-literal.test.ts)
// ---------------------------------------------------------------------------

function makeNodeMap(nodes: [string, any][]): NodeMap {
	return {
		name: 'test',
		nodes: new Map(nodes),
		nodeByRuleId: new Map(),
		slotByRuleId: new Map(),
		signatures: { signatures: new Map() },
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		polymorphFormKinds: new Set()
	};
}

function makeField(values: readonly NodeOrTerminal[]): AssembledNonterminal {
	return {
		name: 'field',
		propertyName: 'field',
		configKey: 'field',
		paramName: 'field',
		source: 'grammar',
		values,
		hasTrailing: false,
		hasLeading: false
	} as AssembledNonterminal;
}

const terminal = (value: string, multiplicity: NodeOrTerminal['multiplicity']): NodeOrTerminal => ({
	kind: 'terminal',
	value,
	multiplicity
});
const ref = (name: string, multiplicity: NodeOrTerminal['multiplicity']): NodeOrTerminal => ({
	kind: 'node-ref',
	node: { kind: 'unresolved-ref', name },
	multiplicity
});

function makeKeyword(kind: string, text: string): AssembledKeyword {
	return new AssembledKeyword(kind, { type: 'string', value: text });
}

function makeEnum(kind: string, values: string[]): AssembledEnum {
	return new AssembledEnum(kind, {
		type: 'enum',
		members: values.map((v) => ({ type: 'string', value: v }))
	} as any);
}

function makeLeaf(kind: string): AssembledPattern {
	return new AssembledPattern(kind, { type: 'pattern', value: '' });
}

// ---------------------------------------------------------------------------
// keywordPresenceKind — shape matrix
// ---------------------------------------------------------------------------

describe('keywordPresenceKind', () => {
	describe('boolean classification', () => {
		it("optional(STRING('mut')) → 'boolean'", () => {
			const f = makeField([terminal('mut', 'optional')]);
			expect(keywordPresenceKind(f, makeNodeMap([]))).toBe('boolean');
		});

		it('optional(SYMBOL(_kw_mut)) where _kw_mut = "mut" → boolean', () => {
			const f = makeField([ref('_kw_mut', 'optional')]);
			const nm = makeNodeMap([['_kw_mut', makeKeyword('_kw_mut', 'mut')]]);
			expect(keywordPresenceKind(f, nm)).toBe('boolean');
		});

		it("optional(enum-of-1('mut')) → 'boolean'", () => {
			const f = makeField([ref('enum_mut', 'optional')]);
			const nm = makeNodeMap([['enum_mut', makeEnum('enum_mut', ['mut'])]]);
			expect(keywordPresenceKind(f, nm)).toBe('boolean');
		});

		it("repeat1(STRING('async')) degenerate one-literal → 'boolean'", () => {
			const f = makeField([terminal('async', 'nonEmptyArray')]);
			expect(keywordPresenceKind(f, makeNodeMap([]))).toBe('boolean');
		});

		it("repeat(_kw_async) degenerate one-literal → 'boolean'", () => {
			const f = makeField([ref('_kw_async', 'array')]);
			const nm = makeNodeMap([['_kw_async', makeKeyword('_kw_async', 'async')]]);
			expect(keywordPresenceKind(f, nm)).toBe('boolean');
		});
	});

	describe('bitflag classification', () => {
		it("repeat1(choice('a','b')) → 'bitflag'", () => {
			const f = makeField([terminal('a', 'nonEmptyArray'), terminal('b', 'nonEmptyArray')]);
			expect(keywordPresenceKind(f, makeNodeMap([]))).toBe('bitflag');
		});

		it("repeat(enum('a','b','c')) → 'bitflag'", () => {
			const f = makeField([terminal('a', 'array'), terminal('b', 'array'), terminal('c', 'array')]);
			expect(keywordPresenceKind(f, makeNodeMap([]))).toBe('bitflag');
		});

		it("repeat1(SYMBOL(_kw_a) | SYMBOL(_kw_b)) → 'bitflag'", () => {
			const f = makeField([ref('_kw_a', 'nonEmptyArray'), ref('_kw_b', 'nonEmptyArray')]);
			const nm = makeNodeMap([
				['_kw_a', makeKeyword('_kw_a', 'a')],
				['_kw_b', makeKeyword('_kw_b', 'b')]
			]);
			expect(keywordPresenceKind(f, nm)).toBe('bitflag');
		});
	});

	describe('null classification', () => {
		it("optional(enum-of-2('pub','priv')) → null (literal-union, not keyword-presence)", () => {
			// Single optional entry pointing at an enum with 2+ values —
			// resolveEntryLiteral returns undefined because enum isn't
			// single-value. So the single-entry-optional branch doesn't fire.
			const f = makeField([ref('enum_vis', 'optional')]);
			const nm = makeNodeMap([['enum_vis', makeEnum('enum_vis', ['pub', 'priv'])]]);
			expect(keywordPresenceKind(f, nm)).toBeNull();
		});

		it('repeat(choice(STRING, SYMBOL($.kind))) → null (non-literal symbol disqualifies)', () => {
			const f = makeField([terminal('const', 'array'), ref('mutable_specifier', 'array')]);
			const nm = makeNodeMap([['mutable_specifier', makeLeaf('mutable_specifier')]]);
			expect(keywordPresenceKind(f, nm)).toBeNull();
		});

		it('optional($.kind) → null (non-literal symbol)', () => {
			const f = makeField([ref('identifier', 'optional')]);
			const nm = makeNodeMap([['identifier', makeLeaf('identifier')]]);
			expect(keywordPresenceKind(f, nm)).toBeNull();
		});

		it('single required literal → null (not optional, not repeat)', () => {
			const f = makeField([terminal('break', 'single')]);
			expect(keywordPresenceKind(f, makeNodeMap([]))).toBeNull();
		});

		it('empty values → null', () => {
			const f = makeField([]);
			expect(keywordPresenceKind(f, makeNodeMap([]))).toBeNull();
		});
	});
});

// ---------------------------------------------------------------------------
// keywordPresenceValue
// ---------------------------------------------------------------------------

describe('keywordPresenceValue', () => {
	it("returns the literal for optional(STRING('mut'))", () => {
		const f = makeField([terminal('mut', 'optional')]);
		expect(keywordPresenceValue(f, makeNodeMap([]))).toBe('mut');
	});

	it('returns the keyword text for optional(SYMBOL(_kw_async))', () => {
		const f = makeField([ref('_kw_async', 'optional')]);
		const nm = makeNodeMap([['_kw_async', makeKeyword('_kw_async', 'async')]]);
		expect(keywordPresenceValue(f, nm)).toBe('async');
	});

	it('returns the single literal for degenerate repeat1(async)', () => {
		const f = makeField([terminal('async', 'nonEmptyArray')]);
		expect(keywordPresenceValue(f, makeNodeMap([]))).toBe('async');
	});

	it('returns undefined for bitflag fields', () => {
		const f = makeField([terminal('a', 'array'), terminal('b', 'array')]);
		expect(keywordPresenceValue(f, makeNodeMap([]))).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// keywordPresenceValues
// ---------------------------------------------------------------------------

describe('keywordPresenceValues', () => {
	it('returns the ordered-unique literal set for a bitflag', () => {
		const f = makeField([
			terminal('async', 'nonEmptyArray'),
			terminal('unsafe', 'nonEmptyArray'),
			terminal('const', 'nonEmptyArray')
		]);
		expect(keywordPresenceValues(f, makeNodeMap([]))).toEqual(['async', 'unsafe', 'const']);
	});

	it('returns [] for boolean fields', () => {
		const f = makeField([terminal('mut', 'optional')]);
		expect(keywordPresenceValues(f, makeNodeMap([]))).toEqual([]);
	});

	it('dedupes repeated literals', () => {
		const f = makeField([terminal('a', 'array'), terminal('b', 'array'), terminal('a', 'array')]);
		// 'a' + 'b' distinct → bitflag; value list has 'a','b' in insertion order
		expect(keywordPresenceValues(f, makeNodeMap([]))).toEqual(['a', 'b']);
	});
});

// ---------------------------------------------------------------------------
// keywordPresenceIsNonEmptyRepeat
// ---------------------------------------------------------------------------

describe('keywordPresenceIsNonEmptyRepeat', () => {
	it('returns true when every entry is nonEmptyArray', () => {
		const f = makeField([terminal('a', 'nonEmptyArray'), terminal('b', 'nonEmptyArray')]);
		expect(keywordPresenceIsNonEmptyRepeat(f)).toBe(true);
	});

	it('returns false when any entry is array (zero-allowed)', () => {
		const f = makeField([terminal('a', 'nonEmptyArray'), terminal('b', 'array')]);
		expect(keywordPresenceIsNonEmptyRepeat(f)).toBe(false);
	});

	it('returns false for optional boolean field', () => {
		const f = makeField([terminal('mut', 'optional')]);
		expect(keywordPresenceIsNonEmptyRepeat(f)).toBe(false);
	});
});
