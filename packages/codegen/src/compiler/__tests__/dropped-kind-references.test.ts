import { describe, expect, it } from 'vitest';
import { diagnosePredicted, predictedRawGrammarOf as rawGrammarOf, rawIdTablesOf } from '../../__tests__/helpers/linked.ts';
import { undeclaredSeparatorSites } from '../model/site-preferences.ts';
import { collectGeneratedKindEntries } from '../../dsl/symbol-table.ts';
import type { RawGrammar } from '../types.ts';

const str = (value: string) => ({ type: 'STRING', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const variantSym = (name: string, variant: string, variantOf: string) => ({ type: 'SYMBOL', name, annotations: { variant, variantOf } });

function supertypeOverDroppedVariant(): RawGrammar {
	return rawGrammarOf(
		{
			program: { type: 'SYMBOL', name: 'literal' },
			literal: { type: 'CHOICE', members: [variantSym('literal_a', 'a', 'literal'), variantSym('literal_b', 'b', 'literal')] },
			literal_a: { type: 'CHOICE', members: [seq(str('new'), str('.'), str('target')), seq(str('import'), str('.'), str('meta'))] },
			literal_b: { type: 'PATTERN', value: '[0-9]+' }
		},
		['literal']
	);
}

describe('a supertype variant that assemble dropped', () => {
	it('is read as an absence assemble already reported, so site preferences do not throw', () => {
		const result = diagnosePredicted(supertypeOverDroppedVariant());
		expect(result.nodeMap.droppedKinds).toEqual(new Set(['literal_a']));
		expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'single-literal-choice', ownerKind: 'literal_a' }));
	});

	it('still throws for a variant that is absent without being reported', () => {
		const raw = supertypeOverDroppedVariant();
		const result = diagnosePredicted(raw);
		const kindEntries = collectGeneratedKindEntries(rawIdTablesOf(raw));
		const unreported = { ...result.nodeMap, droppedKinds: new Set<string>() };
		expect(() => undeclaredSeparatorSites({ nodeMap: unreported, kindEntries })).toThrow(/'literal_a' is not a kind of this grammar/);
	});
});

describe('a node whose rule is a choice of literals followed by more text', () => {
	it('is not classified an enum', () => {
		const raw = rawGrammarOf(
			{
				program: { type: 'SYMBOL', name: 'target' },
				target: seq({ type: 'CHOICE', members: [str('field'), str('event')] }, str(':'))
			},
			[]
		);
		const result = diagnosePredicted(raw);
		expect(result.diagnostics).not.toContainEqual(expect.objectContaining({ code: 'kind-shape-mismatch', ownerKind: 'target' }));
		expect(result.nodeMap.nodes.get('target')?.modelType).not.toBe('enum');
	});

	it('is not classified an enum when it is a lexed token with an optional suffix', () => {
		const raw = rawGrammarOf(
			{
				program: { type: 'SYMBOL', name: 'zero' },
				zero: { type: 'TOKEN', content: seq({ type: 'TOKEN', content: str('0') }, { type: 'OPTIONAL', content: { type: 'CHOICE', members: [str('l'), str('L')] } }) }
			},
			[]
		);
		const result = diagnosePredicted(raw);
		expect(result.diagnostics).not.toContainEqual(expect.objectContaining({ code: 'kind-shape-mismatch', ownerKind: 'zero' }));
		expect(result.nodeMap.nodes.get('zero')?.modelType).not.toBe('enum');
	});
});
