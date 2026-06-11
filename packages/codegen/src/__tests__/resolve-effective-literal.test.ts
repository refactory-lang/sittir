import { PATTERN, STRING } from '../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { resolveEffectiveLiteral, isAutoStampField } from '../emitters/shared.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNonterminal } from '../compiler/node-map.ts';
import { AssembledKeyword, AssembledPattern } from '../compiler/node-map.ts';
import type { NodeOrTerminal } from '../compiler/node-map.ts';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeNodeMap(nodes: [string, any][]): NodeMap {
	return {
		name: 'test',
		nodes: new Map(nodes),
		signatures: { signatures: new Map() },
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		polymorphFormKinds: new Set()
	};
}

function makeField(
	overrides: Partial<AssembledNonterminal> & { values: readonly NodeOrTerminal[] }
): AssembledNonterminal {
	return {
		name: 'field',
		propertyName: 'field',
		configKey: 'field',
		paramName: 'field',
		source: 'grammar',
		hasTrailing: false,
		hasLeading: false,
		...overrides
	} as AssembledNonterminal;
}

/** Create a single-value field with an inline terminal literal. */
function literalField(value: string, multiplicity: NodeOrTerminal['multiplicity'] = 'single'): AssembledNonterminal {
	return makeField({
		values: [{ value, multiplicity }]
	});
}

/** Create a single-value field that references a grammar node kind. */
function nodeRefField(kindName: string, multiplicity: NodeOrTerminal['multiplicity'] = 'single'): AssembledNonterminal {
	return makeField({
		values: [
			{
				node: { kind: 'unresolved-ref', name: kindName },
				multiplicity
			}
		]
	});
}

/** Create a field with multiple values (choice). */
function multiValueField(values: readonly NodeOrTerminal[]): AssembledNonterminal {
	return makeField({ values });
}

function makeKeyword(kind: string, text: string): AssembledKeyword {
	return new AssembledKeyword(kind, { type: STRING, value: text });
}

function makeLeaf(kind: string): AssembledPattern {
	return new AssembledPattern(kind, { type: PATTERN, value: '' });
}

// ---------------------------------------------------------------------------
// resolveEffectiveLiteral
// ---------------------------------------------------------------------------

describe('resolveEffectiveLiteral', () => {
	describe('Source A — inline literal', () => {
		it('returns the single literal value when values has exactly one terminal (required)', () => {
			const field = literalField('break', 'single');
			const nodeMap = makeNodeMap([]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBe('break');
		});

		it('returns the literal for a single-char punctuation literal (required)', () => {
			const field = literalField('::', 'single');
			const nodeMap = makeNodeMap([]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBe('::');
		});

		it('returns undefined for optional single-literal field', () => {
			const field = literalField('in', 'optional');
			const nodeMap = makeNodeMap([]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});

		it('returns undefined for multi-literal (choice-of-strings)', () => {
			const field = multiValueField([
				{ value: '{', multiplicity: 'single' },
				{ value: '{|', multiplicity: 'single' }
			]);
			const nodeMap = makeNodeMap([]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});

		it('returns undefined for empty values', () => {
			const field = makeField({ values: [] });
			const nodeMap = makeNodeMap([]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});
	});

	describe('Source B — referenced constant kind', () => {
		it('returns the keyword text when values has exactly one hidden AssembledKeyword ref (required)', () => {
			const field = nodeRefField('_kw_break', 'single');
			const nodeMap = makeNodeMap([['_kw_break', makeKeyword('_kw_break', 'break')]]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBe('break');
		});

		it('returns undefined for optional single-keyword ref', () => {
			const field = nodeRefField('_kw_async', 'optional');
			const nodeMap = makeNodeMap([['_kw_async', makeKeyword('_kw_async', 'async')]]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});

		it('returns undefined for visible (non-hidden) keyword kinds to avoid mixed-choice false-positives', () => {
			// e.g. pointer_type.mutable_specifier where the choice also includes 'const'
			// The choice produces TWO values: TerminalValue('const') + NodeRef(mutable_specifier)
			// so values.length !== 1, meaning auto-stamp never fires (correct behavior)
			const field = multiValueField([
				{ value: 'const', multiplicity: 'single' },
				{
					node: { kind: 'unresolved-ref', name: 'mutable_specifier' },
					multiplicity: 'single'
				}
			]);
			const nodeMap = makeNodeMap([['mutable_specifier', makeKeyword('mutable_specifier', 'mut')]]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});

		it('returns undefined for multi-kind values', () => {
			const field = multiValueField([
				{
					node: { kind: 'unresolved-ref', name: '_kw_a' },
					multiplicity: 'single'
				},
				{
					node: { kind: 'unresolved-ref', name: '_kw_b' },
					multiplicity: 'single'
				}
			]);
			const nodeMap = makeNodeMap([
				['_kw_a', makeKeyword('_kw_a', 'a')],
				['_kw_b', makeKeyword('_kw_b', 'b')]
			]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});

		it('returns undefined when the single referenced kind is not AssembledKeyword', () => {
			const field = nodeRefField('_hidden_leaf', 'single');
			const nodeMap = makeNodeMap([['_hidden_leaf', makeLeaf('_hidden_leaf')]]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});

		it('returns undefined when the referenced kind is not in the nodeMap', () => {
			const field = nodeRefField('_unknown_kind', 'single');
			const nodeMap = makeNodeMap([]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});
	});

	describe('array multiplicity guard', () => {
		it('returns undefined for a repeated terminal field (array multiplicity)', () => {
			const field = literalField('async', 'array');
			const nodeMap = makeNodeMap([]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});

		it('returns undefined for a repeated field with single AssembledKeyword ref (nonEmptyArray)', () => {
			const field = nodeRefField('_kw_async', 'nonEmptyArray');
			const nodeMap = makeNodeMap([['_kw_async', makeKeyword('_kw_async', 'async')]]);
			expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined();
		});
	});

	describe('isAutoStampField convenience wrapper', () => {
		it('returns true when resolveEffectiveLiteral would return a value', () => {
			const field = literalField('pub', 'single');
			const nodeMap = makeNodeMap([]);
			expect(isAutoStampField(field, nodeMap)).toBe(true);
		});

		it('returns false when resolveEffectiveLiteral would return undefined (optional)', () => {
			const field = literalField('pub', 'optional');
			const nodeMap = makeNodeMap([]);
			expect(isAutoStampField(field, nodeMap)).toBe(false);
		});

		it('returns false when resolveEffectiveLiteral would return undefined (non-literal kind)', () => {
			const field = nodeRefField('identifier', 'single');
			const nodeMap = makeNodeMap([['identifier', makeLeaf('identifier')]]);
			expect(isAutoStampField(field, nodeMap)).toBe(false);
		});
	});
});
