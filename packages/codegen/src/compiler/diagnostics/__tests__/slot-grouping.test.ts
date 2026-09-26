import { describe, it, expect } from 'vitest';
import { diagnoseRepeatedSeqGrouping } from '../slot-grouping.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name }) as any;
const str = (v: string) => ({ type: 'STRING', value: v }) as any;
const seq = (...m: any[]) => ({ type: 'SEQ', members: m }) as any;
const choice = (...m: any[]) => ({ type: 'CHOICE', members: m }) as any;
const optional = (content: any) => ({ type: 'OPTIONAL', content }) as any;
const repeat = (content: any) => ({ type: 'REPEAT', content }) as any;
const repeat1 = (content: any) => ({ type: 'REPEAT1', content }) as any;
const field = (name: string, content: any) => ({ type: 'FIELD', name, content }) as any;

const diagnose = (rules: Record<string, any>, inlineKinds: ReadonlySet<string> = new Set()) =>
	diagnoseRepeatedSeqGrouping(rules, inlineKinds);

describe('diagnoseRepeatedSeqGrouping — multi-slot-nested-seq on link-phase rules', () => {
	it('flags the regex term shape: repeat1 over a seq of an atom and a fielded quantifier', () => {
		const term = repeat1(
			seq(
				choice(sym('pattern_character'), sym('class_character')),
				field('quantifier', optional(choice(sym('zero_or_more'), sym('one_or_more'))))
			)
		);
		const records = diagnose({ term });
		expect(records).toHaveLength(1);
		expect(records[0]).toMatchObject({ code: 'multi-slot-nested-seq', ownerKind: 'term', slotCount: 2 });
	});

	it('flags a repeated multi-slot seq nested inside a choice arm', () => {
		const records = diagnose({ host: choice(repeat(seq(sym('a'), sym('b'))), sym('c')) });
		expect(records.map((r) => r.ownerKind)).toEqual(['host']);
	});

	it('looks through an inline kind referenced as the repeat body', () => {
		const rules = { host: repeat(sym('_pair')), _pair: seq(sym('a'), str(','), sym('b')) };
		expect(diagnose(rules, new Set(['_pair'])).map((r) => r.ownerKind)).toEqual(['host']);
		expect(diagnose(rules)).toHaveLength(0);
	});

	it('terminates on a self-referential inline kind', () => {
		expect(diagnose({ host: repeat(sym('_loop')), _loop: sym('_loop') }, new Set(['_loop']))).toHaveLength(0);
	});

	it('is silent for a repeated single slot', () => {
		expect(diagnose({ host: repeat(seq(str('('), sym('a'), str(')'))) })).toHaveLength(0);
	});

	it('is silent for an optional multi-slot seq', () => {
		expect(diagnose({ host: seq(sym('x'), optional(seq(sym('a'), sym('b')))) })).toHaveLength(0);
	});

	it('is silent for a multi-slot rule body', () => {
		expect(
			diagnose({ binary_expression: seq(field('left', sym('e')), str('+'), field('right', sym('e'))) })
		).toHaveLength(0);
	});

	it('is silent for multi-slot seq choice arms', () => {
		expect(diagnose({ host: choice(seq(sym('a'), sym('b')), seq(sym('c'), sym('d'))) })).toHaveLength(0);
	});
});
