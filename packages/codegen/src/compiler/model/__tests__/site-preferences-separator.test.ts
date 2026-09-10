import { CHOICE, PATTERN, STRING, SYMBOL } from '../../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledList, AssembledPattern, type AssembledNode, type SeparatedListElementRule } from '../node-map.ts';
import type { RenderRule, SimplifiedRule } from '../../../types/rule.ts';
import { makeNodeMapWith } from '../../../__tests__/helpers/node-map-fixtures.ts';
import { collectSitePreferences } from '../site-preferences.ts';
import { preference } from '../../../dsl/primitives/preference.ts';

const SIMPLIFIED: SimplifiedRule = { type: SYMBOL, name: 'member' };
const RENDER: RenderRule = { type: SYMBOL, name: 'member' };
const SEP: RenderRule = {
	type: CHOICE,
	members: [
		{ type: STRING, value: ',' },
		{ type: STRING, value: ';' }
	]
};
const kindEntries = [
	{ kind: 'member_list', member: 'MemberList', id: 1 },
	{ kind: 'member', member: 'Member', id: 2 },
	{ kind: 'comma', member: 'Comma', id: 3, symbolName: ',', anon: true },
	{ kind: 'semi', member: 'Semi', id: 4, symbolName: ';', anon: true }
];

function listNodeMap(separatorRule: RenderRule | undefined) {
	const rule: SeparatedListElementRule = {
		type: SYMBOL,
		name: 'member',
		multiplicity: 'nonEmptyArray',
		separator: { value: separatorRule ?? { type: STRING, value: ',' }, trailing: 'optional' }
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('member_list', new AssembledList('member_list', rule, undefined, { separatorRule, simplifiedRule: SIMPLIFIED, renderRule: RENDER }));
	nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

describe('collectSitePreferences — the options block', () => {
	const withOptions = (options: object) =>
		collectSitePreferences({
			nodeMap: listNodeMap(SEP),
			kindEntries,
			defaults: { labels: {}, sites: { member_list: { member_separator: { label: 'separator', arm: 'semi' } } } },
			options: options as never
		});

	it('declares a site the render rules never see, and refuses one that names nothing', () => {
		const sites = withOptions({ member_list: { 'member:/separator/kind': preference('comma') } });
		expect(sites.find((s) => s.source === 'separator')?.defaultArm).toBe('comma');
		expect(() => withOptions({ member_list: { 'member:/nowhere': preference('comma') } })).toThrow(/names no site/);
	});

	it('refuses an arm no site it names admits', () => {
		expect(() => withOptions({ member_list: { 'member:/separator/kind': preference('newline') } })).toThrow(
			/which no site it names admits/
		);
	});
});

describe('collectSitePreferences — separator sites', () => {
	it('a list with a choice separator is a site whose arms are the literal kinds and whose default is the declared one', () => {
		const sites = collectSitePreferences({
			nodeMap: listNodeMap(SEP),
			kindEntries,
			defaults: { labels: {}, sites: { member_list: { member_separator: { label: 'separator', arm: 'semi' } } } }
		});
		const site = sites.find((s) => s.source === 'separator')!;
		expect(site).toEqual({
			kind: 'member_list',
			slot: 'member',
			address: 'member_separator',
			label: 'separator',
			arms: [
				{ value: 'comma', kind: 'comma' },
				{ value: 'semi', kind: 'semi' }
			],
			defaultArm: 'semi',
			source: 'separator'
		});
	});

	it('an undeclared choice separator, a foreign arm, and a declaration naming no list are build errors', () => {
		expect(() => collectSitePreferences({ nodeMap: listNodeMap(SEP), kindEntries })).toThrow(
			/member_list\.member chooses its separator per instance \(comma, semi\); declare its kind under options:/
		);
		expect(() =>
			collectSitePreferences({
				nodeMap: listNodeMap(SEP),
				kindEntries,
				defaults: { labels: {}, sites: { member_list: { member_separator: { label: 'separator', arm: 'colon' } } } }
			})
		).toThrow(/member_list\.member_separator is 'colon', not one of comma, semi/);
		expect(() =>
			collectSitePreferences({
				nodeMap: listNodeMap(undefined),
				kindEntries,
				defaults: { labels: {}, sites: { member_list: { member_separator: { label: 'separator', arm: 'comma' } } } }
			})
		).toThrow(/member_list\.member_separator names no list with a choice separator/);
	});
});
