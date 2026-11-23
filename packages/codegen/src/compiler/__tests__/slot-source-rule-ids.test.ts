import { beforeAll, describe, expect, it } from 'vitest';
import { compileGrammar } from '../compile.ts';
import { grammarPackage } from '../../grammars.ts';
import { assemblePredicted } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';

const at =(path: string) => `rule:recursive_pattern:${path}`;

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
		expect(nodeMap.slotByRuleId.get('recursive_pattern')?.get(at('members.0'))).toBeUndefined();
		expect(nodeMap.slotByRuleId.get('recursive_pattern')?.get(at('members.2'))).toBeUndefined();
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

describe('a rule id held by two kinds resolves to each kind its own slot', () => {
	const shared = 'rule:_import_list:members.0';
	let nodeMap: Awaited<ReturnType<typeof compileGrammar>>['nodeMap'];

	beforeAll(async () => {
		({ nodeMap } = await compileGrammar({ package: grammarPackage('python') }));
	}, FULL_PIPELINE_TIMEOUT);

	for (const kind of ['import_list', 'names']) {
		it(`python's ${kind}`, () => {
			const own = (nodeMap.nodes.get(kind) as unknown as { slots: readonly { sourceRuleIds: readonly string[] }[] }).slots.find((slot) => slot.sourceRuleIds.includes(shared));
			expect(own).toBeDefined();
			expect(nodeMap.slotByRuleId.get(kind)?.get(shared)).toBe(own);
		});
	}
});

describe('a fielded expression before a repeated expression group is its own slot', () => {
	const controlling = 'rule:generic_expression:members.2';
	const association = "seq($.type_descriptor, ':', $.expression)";
	const upstream = {
		extras: '/\\s/',
		rules: [
			'source: ($) => repeat($.generic_expression)',
			`generic_expression: ($) => seq('_Generic', '(', $.expression, ',', ${association}, repeat(seq(',', ${association})), ')')`,
			'expression: () => /[0-9]+/',
			'type_descriptor: () => /[a-z]+/'
		].join(', ')
	};
	let nodeMap: ReturnType<typeof assemblePredicted>['nodeMap'];

	beforeAll(async () => {
		({ nodeMap } = assemblePredicted(await evaluateTempGrammar(upstream, "edits: { generic_expression: { 2: field('controlling_expression') } }")));
	}, FULL_PIPELINE_TIMEOUT);

	it('its position resolves to controlling_expression', () => {
		expect((nodeMap.slotByRuleId.get('generic_expression')?.get(controlling) as unknown as { storageName: string } | undefined)?.storageName).toBe('controlling_expression');
	});

	it('the repeated expression slot does not claim it', () => {
		const slots = (nodeMap.nodes.get('generic_expression') as unknown as { slots: readonly { storageName: string; sourceRuleIds: readonly string[] }[] }).slots;
		const expression = slots.find((slot) => slot.storageName === 'expression');
		expect(expression).toBeDefined();
		expect(expression!.sourceRuleIds).not.toContain(controlling);
	});
});
