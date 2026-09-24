import { describe, expect, it } from 'vitest';
import type { RenderRule } from '../../../types/rule.ts';
import { AssembledBranch, AssembledNonterminal, type AssembledNode, type NodeOrTerminal } from '../node-map.ts';
import { makeNodeMapWith } from '../../../__tests__/helpers/node-map-fixtures.ts';
import { collectSitePreferences } from '../site-preferences.ts';
import { preference } from '../../../dsl/primitives/preference.ts';

const rule = { type: 'SEQ', members: [] } as unknown as RenderRule;

const slot = (fieldName: string, values: readonly NodeOrTerminal[]): AssembledNonterminal =>
	new AssembledNonterminal({ fieldName, values, hasTrailingDelimiter: false, hasLeadingDelimiter: false, sourceRuleIds: [] });

const text = (value: string): NodeOrTerminal => ({ kind: 'terminal', value, multiplicity: 'single' }) as unknown as NodeOrTerminal;

function hexNodeMap() {
	const prefix = slot('prefix', [text('0x'), text('0X')]);
	const content = slot('content', [{ kind: 'terminal', multiplicity: 'single' } as unknown as NodeOrTerminal]);
	const nodes = new Map<string, AssembledNode>([['hex', new AssembledBranch('hex', rule, rule, { slots: [prefix, content] })]]);
	return { nodeMap: makeNodeMapWith(nodes), prefix, content, hex: nodes.get('hex') as AssembledBranch };
}

describe('collectSitePreferences — spelling sites', () => {
	it('a declared spelling stamps its slot with the default arm and leaves no native site', () => {
		const { nodeMap, prefix } = hexNodeMap();
		const sites = collectSitePreferences({ nodeMap, kindEntries: [], options: { hex: { 'prefix:': preference('0X') } } as never });
		expect(sites).toEqual([]);
		expect(prefix.registeredOption).toBe('spelling');
		expect(prefix.optionDefaultArm).toBe('0X');
	});

	it('a registered slot leaves the config slots, so the other slot is the sole slot', () => {
		const { nodeMap, hex, content } = hexNodeMap();
		expect(hex.soleSlot).toBeUndefined();
		collectSitePreferences({ nodeMap, kindEntries: [], options: { hex: { 'prefix:': preference('0x') } } as never });
		expect(hex.configSlots).toEqual([content]);
		expect(hex.soleSlot).toBe(content);
		expect(hex.slots).toHaveLength(2);
	});

	it('an arm the slot does not admit is refused', () => {
		const { nodeMap } = hexNodeMap();
		expect(() =>
			collectSitePreferences({ nodeMap, kindEntries: [], options: { hex: { 'prefix:': preference('0q') } } as never })
		).toThrow(/which no site it names admits \(0x, 0X\)/);
	});

	it('a plain choice site registers its slot as choice-mode, not spelling', () => {
		const rule = { type: 'SEQ', members: [] } as unknown as RenderRule;
		const kindText = (v: string): NodeOrTerminal => ({ kind: 'terminal', value: v, multiplicity: 'single' }) as unknown as NodeOrTerminal;
		const terminator = new AssembledNonterminal({
			fieldName: 'terminator',
			values: [kindText(';'), kindText(':')],
			hasTrailingDelimiter: false,
			hasLeadingDelimiter: false,
			sourceRuleIds: []
		});
		const nodes = new Map<string, AssembledNode>([
			['statement', new AssembledBranch('statement', rule, rule, { slots: [terminator] })]
		]);
		const nodeMap = makeNodeMapWith(nodes);
		const kindEntries = [
			{ kind: 'statement', member: 'Statement', id: 1 },
			{ kind: 'semi', member: 'Semi', id: 2, symbolName: ';', literalText: ';', anon: true },
			{ kind: 'colon', member: 'Colon', id: 3, symbolName: ':', literalText: ':', anon: true }
		];
		collectSitePreferences({ nodeMap, kindEntries, options: { statement: { 'terminator:': preference(';') } } as never });
		expect(terminator.registeredOption).toBe('choice');
		expect(terminator.optionDefaultArm).toBe(';');
	});
});
