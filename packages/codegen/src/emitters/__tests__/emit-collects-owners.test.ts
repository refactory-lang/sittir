import { describe, expect, it } from 'vitest';
import { querySlotRows } from '../client-utils.ts';
import { assemblePredicted, predictedRawGrammarOf } from '../../__tests__/helpers/linked.ts';
import { EmitHaltedError } from '../../types/diagnostics.ts';

const S = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });

describe('one emission reports every owner that breaks', () => {
	it('lists two kinds whose slot is named like the where-condition flag, not only the first', () => {
		const raw = predictedRawGrammarOf({
			source: { type: 'REPEAT', content: { type: 'CHOICE', members: [sym('left'), sym('right')] } },
			left: { type: 'SEQ', members: [S('l'), field('is', sym('word'))] },
			right: { type: 'SEQ', members: [S('r'), field('is', sym('word'))] },
			word: { type: 'PATTERN', value: '[a-z]+' }
		});
		const { nodeMap } = assemblePredicted(raw);
		let halted: EmitHaltedError | undefined;
		try {
			querySlotRows(nodeMap);
		} catch (error) {
			halted = error as EmitHaltedError;
		}
		expect(halted).toBeInstanceOf(EmitHaltedError);
		const reserved = halted!.blocking.filter((d) => d.code === 'reserved-slot-name');
		expect(reserved.map((d) => (d as { ownerKind?: string }).ownerKind).sort()).toEqual(['left', 'right']);
		expect(reserved.every((d) => d.canProceed === false)).toBe(true);
	});
});
