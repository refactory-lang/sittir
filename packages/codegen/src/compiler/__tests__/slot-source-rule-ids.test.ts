import { beforeAll, describe, expect, it } from 'vitest';
import { compileGrammar } from '../compile.ts';
import { grammarPackage } from '../../grammars.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';

const at = (path: string) => `rule:recursive_pattern:${path}`;

describe("C#'s recursive_pattern: every occurrence of a slot is among its source rule ids", () => {
	let nodeMap: Awaited<ReturnType<typeof compileGrammar>>['nodeMap'];
	const slotNamed = (storageName: string) =>
		(nodeMap.nodes.get('recursive_pattern') as unknown as { slots: readonly { storageName: string; sourceRuleIds: readonly string[] }[] }).slots.filter(
			(slot) => slot.storageName === storageName
		);

	beforeAll(async () => {
		({ nodeMap } = await compileGrammar({ package: grammarPackage('csharp') }));
	}, FULL_PIPELINE_TIMEOUT);

	it('positional_pattern_clause holds the fielded occurrences of arms 0, 1 and 2 and the bare arm 3', () => {
		const ids = slotNamed('positional_pattern_clause').flatMap((slot) => slot.sourceRuleIds);
		expect(ids).toEqual(expect.arrayContaining([at('members.0/members.1'), at('members.1/members.1'), at('members.2/members.0'), at('members.3')]));
	});

	it('property_pattern_clause holds its occurrences in arms 0 and 1', () => {
		const ids = slotNamed('property_pattern_clause').flatMap((slot) => slot.sourceRuleIds);
		expect(ids).toEqual(expect.arrayContaining([at('members.0/members.2'), at('members.1/members.2')]));
	});

	it("an arm's seq is no slot's source: the designation slot holds the designation choices, not arms 0 and 2", () => {
		expect(nodeMap.slotByRuleId.get(at('members.0'))).toBeUndefined();
		expect(nodeMap.slotByRuleId.get(at('members.2'))).toBeUndefined();
		const designation = slotNamed('variable_designation').flatMap((slot) => slot.sourceRuleIds);
		expect(designation).toEqual(expect.arrayContaining([at('members.0/members.3'), at('members.2/members.1')]));
	});
});

describe("C#'s query clause slot keeps the name of the hidden rule it was inlined from", () => {
	let nodeMap: Awaited<ReturnType<typeof compileGrammar>>['nodeMap'];

	beforeAll(async () => {
		({ nodeMap } = await compileGrammar({ package: grammarPackage('csharp') }));
	}, FULL_PIPELINE_TIMEOUT);

	for (const kind of ['query_expression', 'query_body_group']) {
		it(`${kind} holds select_or_group_clause, not content`, () => {
			const names = (nodeMap.nodes.get(kind) as unknown as { slots: readonly { storageName: string }[] }).slots.map((slot) => slot.storageName);
			expect(names).toContain('select_or_group_clause');
			expect(names).not.toContain('content');
		});
	}
});

describe("C's _Generic controlling expression is its own slot", () => {
	const controlling = 'rule:generic_expression:members.2';
	let nodeMap: Awaited<ReturnType<typeof compileGrammar>>['nodeMap'];

	beforeAll(async () => {
		({ nodeMap } = await compileGrammar({ package: grammarPackage('c') }));
	}, FULL_PIPELINE_TIMEOUT);

	it('its position resolves to controlling_expression', () => {
		expect((nodeMap.slotByRuleId.get(controlling) as unknown as { storageName: string }).storageName).toBe('controlling_expression');
	});

	it('the repeated expression slot does not claim it', () => {
		const slots = (nodeMap.nodes.get('generic_expression') as unknown as { slots: readonly { storageName: string; sourceRuleIds: readonly string[] }[] }).slots;
		const expression = slots.find((slot) => slot.storageName === 'expression');
		expect(expression).toBeDefined();
		expect(expression!.sourceRuleIds).not.toContain(controlling);
	});
});
