import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { kindIdTablesOf, makeNodeMapWith, withIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flatten } from '../../compiler/flatten.ts';
import { AssembledBranch, AssembledPattern, AssembledPunctuation, AssembledSupertype } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import { CHOICE, FIELD, PATTERN, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { SeqRule } from '../../types/rule.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

const entries: KindEnumEntry[] = [
	{ id: 1, lexicalRank: 1, kind: 'name', member: 'Name' },
	{ id: 2, lexicalRank: 2, kind: 'number', member: 'Number' },
	{ id: 3, lexicalRank: 3, kind: 'semi', symbolName: ';', literalText: ';', anon: true, member: 'Semi' },
	{ id: 4, lexicalRank: 4, kind: 'call', member: 'Call' },
	{ id: 5, lexicalRank: 5, kind: 'loop', member: 'Loop' },
	{ id: 6, lexicalRank: 6, kind: 'holder', member: 'Holder' }
];

const symbol = (name: string) => ({ type: SYMBOL, name }) as const;

function emittedFor(arms: readonly string[], list = false): string {
	const { nodeMap, generatedIdTables } = withIdTables((kindEntries) => {
		const branch = (name: string, rule: SeqRule<'link'>) => new AssembledBranch(name, flatten(rule), flatten(rule), { kindEntries });
		const callRule: SeqRule<'link'> = { type: SEQ, members: [{ type: STRING, value: 'call' }, { type: FIELD, name: 'target', content: symbol('name') }] };
		const loopRule: SeqRule<'link'> = { type: SEQ, members: [{ type: STRING, value: 'loop' }, { type: FIELD, name: 'target', content: symbol('name') }] };
		const body = list ? { type: REPEAT, content: symbol('stmt') } : symbol('stmt');
		const holderRule = {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'tag', content: symbol('name') },
				{ type: FIELD, name: 'body', content: body }
			]
		} as SeqRule<'link'>;
		const nodes = new Map<string, AssembledNode>();
		nodes.set('name', new AssembledPattern('name', { type: PATTERN, value: '[a-z]+' }, { kindEntries, factoryName: 'name' }));
		nodes.set('number', new AssembledPattern('number', { type: PATTERN, value: '[0-9]+' }, { kindEntries, factoryName: 'number' }));
		nodes.set('semi', new AssembledPunctuation('semi', { type: STRING, value: ';' }, { kindEntries }));
		nodes.set('call', branch('call', callRule));
		nodes.set('loop', branch('loop', loopRule));
		nodes.set('stmt', new AssembledSupertype('stmt', { type: CHOICE, members: arms.map(symbol) }, arms.map((name) => ({ name })), { kindEntries }));
		nodes.set('holder', branch('holder', holderRule));
		return makeNodeMapWith(nodes);
	}, kindIdTablesOf(entries));
	return emitFrom({ grammar: 'synth', nodeMap, generatedIdTables });
}

const storedSemi = (helper: string) => new RegExp(`${helper}\\(\\s*[\\w.]+,\\s*\\[TSKindId\\.Semi\\]`);

describe('a fixed token beside many arms of a slot', () => {
	it('is admitted by its kind id when no arm takes a number', () => {
		expect(emittedFor(['semi', 'call', 'loop'])).toMatch(storedSemi('_resolveKindEnum'));
	});

	it('is admitted by its kind id in a list slot', () => {
		expect(emittedFor(['semi', 'call', 'loop'], true)).toMatch(storedSemi('_resolveKindEnumItems'));
	});

	it('is not admitted by its kind id when an arm takes a number', () => {
		expect(emittedFor(['semi', 'number', 'call'])).not.toMatch(storedSemi('_resolveKindEnum'));
	});
});
