import { describe, expect, it } from 'vitest';
import { branches, type Body } from '../render-body.ts';
import { droppedLiteralTexts } from '../templates.ts';
import type { RenderRule } from '../../types/rule.ts';

const literal = (value: string) => ({ type: 'STRING', value, nonterminal: false }) as unknown as RenderRule;
const seq = (...members: RenderRule[]) => ({ type: 'SEQ', members }) as unknown as RenderRule;
const noSlots = { slots: [] } as never;
const text = (value: string): Body => [{ kind: 'text', text: value }];

describe('droppedLiteralTexts', () => {
	it('reports a literal no template text carries', () => {
		expect(droppedLiteralTexts(seq(literal('['), literal('^')), text('['), noSlots)).toEqual(['^']);
	});

	it('counts a literal an arm of a conditional writes', () => {
		const body = branches([{ test: 'x', body: text('^') }], undefined);
		expect(droppedLiteralTexts(seq(literal('^')), body, noSlots)).toEqual([]);
	});

	it('counts a literal that only the fallback of a conditional writes', () => {
		const body = branches([{ test: 'x', body: text('+') }], text('-'));
		expect(droppedLiteralTexts(seq(literal('-')), body, noSlots)).toEqual([]);
	});
});
