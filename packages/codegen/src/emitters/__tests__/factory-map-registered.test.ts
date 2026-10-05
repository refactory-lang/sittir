import { describe, expect, it } from 'vitest';
import type { RenderRule } from '../../types/rule.ts';
import { AssembledBranch, AssembledNonterminal, type AssembledNode, type NodeOrTerminal } from '../../compiler/model/node-map.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { buildFactoryMap } from '../factory-map.ts';

const rule = { type: 'SEQ', members: [] } as unknown as RenderRule;
const text = (value: string): NodeOrTerminal => ({ kind: 'terminal', value, multiplicity: 'single' }) as unknown as NodeOrTerminal;
const slot = (fieldName: string, values: readonly NodeOrTerminal[], registered: boolean): AssembledNonterminal => {
	const s = new AssembledNonterminal({ fieldName, values, hasTrailingDelimiter: false, hasLeadingDelimiter: false, sourceRuleIds: [] });
	if (registered) s.registeredOption = 'choice';
	return s;
};

describe('buildFactoryMap — FactorySlotMeta.registered', () => {
	const nodes = new Map<string, AssembledNode>([
		['statement', new AssembledBranch('statement', rule, rule, { slots: [slot('terminator', [text(';'), text(':')], true)] })],
		[
			'hex',
			new AssembledBranch('hex', rule, rule, {
				slots: [slot('prefix', [text('0x'), text('0X')], true), slot('content', [text('1')], false)]
			})
		]
	]);
	const { factorySlots } = buildFactoryMap(makeNodeMapWith(nodes));

	it('a compound whose every slot is registered exports none of them as registered', () => {
		expect(factorySlots.statement!.terminator!.registered).toBeUndefined();
	});

	it('a registered slot beside a config slot exports as registered', () => {
		expect(factorySlots.hex!.prefix!.registered).toBe(true);
		expect(factorySlots.hex!.content!.registered).toBeUndefined();
	});
});

describe('buildFactoryMap — FactorySlotMeta.optionDefault', () => {
	const choiceSlot = (defaultArm: string, defaultKind: string | undefined): AssembledNonterminal => {
		const s = slot('terminator', [text(';')], true);
		s.optionDefaultArm = defaultArm;
		s.optionDefaultKind = defaultKind;
		return s;
	};
	const spellingSlot = slot('prefix', [text('0x'), text('0X')], true);
	spellingSlot.registeredOption = 'spelling';
	spellingSlot.optionDefaultArm = '0x';
	const nodes = new Map<string, AssembledNode>([
		['hex', new AssembledBranch('hex', rule, rule, { slots: [spellingSlot, slot('content', [text('1')], false)] })],
		['semi_stmt', new AssembledBranch('semi_stmt', rule, rule, { slots: [choiceSlot(';', 'semi'), slot('content', [text('1')], false)] })],
		['blank_stmt', new AssembledBranch('blank_stmt', rule, rule, { slots: [choiceSlot('blank', undefined), slot('content', [text('1')], false)] })]
	]);
	const kindEntries = [{ kind: 'semi', member: 'Semi', id: 42 }];
	const { factorySlots } = buildFactoryMap(makeNodeMapWith(nodes), kindEntries);

	it('a spelling default is its text, a choice default its arm kind id, the blank arm id 0', () => {
		expect(factorySlots.hex!.prefix!.optionDefault).toBe('0x');
		expect(factorySlots.semi_stmt!.terminator!.optionDefault).toBe(42);
		expect(factorySlots.blank_stmt!.terminator!.optionDefault).toBe(0);
	});

	it('without kind entries a choice default is left out', () => {
		expect(buildFactoryMap(makeNodeMapWith(nodes)).factorySlots.semi_stmt!.terminator!.optionDefault).toBeUndefined();
	});
});
