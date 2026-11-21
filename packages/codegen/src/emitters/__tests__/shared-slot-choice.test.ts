import { describe, expect, it } from 'vitest';
import { assemblePredicted, predictedRawGrammarOf } from '../../__tests__/helpers/linked.ts';
import { collectGeneratedKindEntries } from '../../dsl/symbol-table.ts';
import { NO_JOINS } from '../../compiler/model/join-seams/index.ts';
import { EmitHaltedError, type GrammarDiagnostic } from '../../types/diagnostics.ts';
import { concat, duplicateSlots, gate, seam, slot, type Body, type IfArm } from '../render-body.ts';
import { flatSlotBody, flatSlotOrder, runTemplateEmitter } from '../templates.ts';
import { storageKindOfValue, type NodeOrTerminal } from '../../compiler/model/node-map.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });
const repeat1 = (content: unknown) => ({ type: 'REPEAT1', content });
const blank = { type: 'BLANK' };
const pattern = (value: string) => ({ type: 'PATTERN', value });

function compile(rules: Record<string, unknown>) {
	const { nodeMap, generatedIdTables } = assemblePredicted(predictedRawGrammarOf(rules));
	return { nodeMap, emit: () => runTemplateEmitter({ grammar: 'synth', nodeMap, kindEntries: collectGeneratedKindEntries(generatedIdTables), joins: NO_JOINS }) };
}

function slotsOf(nodeMap: ReturnType<typeof compile>['nodeMap'], kind: string): readonly { readonly storageName: string; readonly values: readonly NodeOrTerminal[] }[] {
	return (nodeMap.nodes.get(kind) as unknown as { slots: readonly { storageName: string; values: readonly NodeOrTerminal[] }[] }).slots;
}

function rendered(body: Body, present: ReadonlySet<string> | ReadonlyMap<string, string>): string[] {
	const out: string[] = [];
	const kindOf = (slot: string): string | undefined => (present instanceof Map ? present.get(slot) : undefined);
	const takes = (arm: IfArm): boolean =>
		arm.kinds === undefined ? [arm.test, ...(arm.or ?? [])].some((test) => present.has(test)) : present.has(arm.test) && arm.kinds.includes(kindOf(arm.test)!);
	for (const node of body) {
		switch (node.kind) {
			case 'text':
				if (node.text.trim() !== '') out.push(node.text.trim());
				break;
			case 'slot':
				if (present.has(node.name)) out.push(node.name);
				break;
			case 'if': {
				const arm = node.arms.find(takes);
				const taken = arm?.body ?? node.fallback;
				if (taken !== undefined) out.push(...rendered(taken, present));
				break;
			}
			default:
				break;
		}
	}
	return out;
}

describe('a choice whose arms share a slot takes exactly one arm', () => {
	it("tests scm's named_node arms on the slot only the anchored arm holds", () => {
		const { emit } = compile({
			host: choice(field('items', repeat1(sym('item'))), seq(field('items', repeat(sym('item'))), sym('item'), str('.'))),
			item: pattern('[a-z]+')
		});
		const body = emit().bodies.get('host')!;
		expect(duplicateSlots(body)).toEqual([]);
		expect(rendered(body, new Set(['items']))).toEqual(['items']);
		expect(rendered(body, new Set(['items', 'item']))).toEqual(['items', 'item', '.']);
		expect(rendered(body, new Set(['item']))).toEqual(['item', '.']);
	});

	describe("C#'s recursive_pattern: six arms, a designation that may be the discard `_`", () => {
		const rules = {
			host: choice(
				seq(field('type', sym('tname')), field('clause', sym('clause')), choice(sym('prop'), blank), sym('_designation')),
				seq(field('type', sym('tname')), field('clause', sym('clause')), choice(sym('prop'), blank)),
				seq(field('clause', sym('clause')), sym('_designation')),
				sym('clause'),
				sym('host_arm2'),
				sym('host_arm4')
			),
			host_arm2: seq(field('type', sym('tname')), sym('prop')),
			host_arm4: seq(sym('prop'), sym('_designation')),
			_designation: choice(sym('discard'), sym('paren'), field('name', sym('identifier'))),
			discard: str('_'),
			paren: seq(str('('), sym('identifier'), str(')')),
			clause: seq(str('('), sym('number'), str(')')),
			prop: seq(str('{'), sym('identifier'), str('}')),
			tname: pattern('[A-Z][a-z]*'),
			identifier: pattern('[a-z]+'),
			number: pattern('[0-9]+')
		};

		it('holds the designation of both arms in one slot: the discard, the parenthesized designation and the named identifier', () => {
			const { nodeMap } = compile(rules);
			const designation = slotsOf(nodeMap, 'host').filter((slot) => slot.values.some((value) => storageKindOfValue(value) === 'paren'));
			expect(designation).toHaveLength(1);
			expect(designation[0]!.values.map(storageKindOfValue).sort()).toEqual(['discard', 'identifier', 'paren']);
			const codes = nodeMap.assembleWarnings.filter((warning) => warning.ownerKind === 'host').map((warning) => warning.code);
			expect(codes).not.toContain('union-slot-content-collision');
		});

		it('renders each form, and the forms without a designation write no `_`', () => {
			const { nodeMap, emit } = compile(rules);
			const d = slotsOf(nodeMap, 'host').find((slot) => slot.values.some((value) => storageKindOfValue(value) === 'paren'))!.storageName;
			const body = emit().bodies.get('host')!;
			expect(duplicateSlots(body)).toEqual([]);
			const forms: [string[], string[]][] = [
				[['type', 'clause', d], ['type', 'clause', d]],
				[['type', 'clause', 'prop', d], ['type', 'clause', 'prop', d]],
				[['type', 'clause'], ['type', 'clause']],
				[['type', 'clause', 'prop'], ['type', 'clause', 'prop']],
				[['clause', d], ['clause', d]],
				[['clause'], ['clause']],
				[['host_arm2'], ['host_arm2']],
				[['host_arm4'], ['host_arm4']]
			];
			for (const [present, expected] of forms) expect(rendered(body, new Set(present))).toEqual(expected);
		});
	});

	it("keeps go's capacity: `a[1:2:3]` renders its third index", () => {
		const optional = (content: unknown) => choice(content, blank);
		const { emit } = compile({
			host: seq(
				field('operand', sym('expr')),
				str('['),
				choice(
					seq(field('start', optional(sym('expr'))), str(':'), field('end', optional(sym('expr')))),
					seq(field('start', optional(sym('expr'))), str(':'), field('end', sym('expr')), str(':'), field('capacity', sym('expr')))
				),
				str(']')
			),
			expr: pattern('[a-z0-9]+')
		});
		const body = emit().bodies.get('host')!;
		expect(duplicateSlots(body)).toEqual([]);
		expect(rendered(body, new Set(['operand', 'start', 'end', 'capacity']))).toEqual(['operand', '[', 'start', ':', 'end', ':', 'capacity', ']']);
		expect(rendered(body, new Set(['operand', 'end', 'capacity']))).toEqual(['operand', '[', ':', 'end', ':', 'capacity', ']']);
		expect(rendered(body, new Set(['operand', 'start', 'end']))).toEqual(['operand', '[', 'start', ':', 'end', ']']);
		expect(rendered(body, new Set(['operand']))).toEqual(['operand', '[', ':', ']']);
	});

	it("tells C#'s function body arms apart by the body's kind: a block body writes no `;`", () => {
		const { emit } = compile({
			host: seq(field('name', sym('identifier')), sym('_function_body')),
			_function_body: choice(field('body', sym('block')), seq(field('body', sym('arrow')), str(';')), str(';')),
			block: seq(str('{'), str('}')),
			arrow: seq(str('=>'), sym('identifier')),
			identifier: pattern('[a-z]+')
		});
		const body = emit().bodies.get('host')!;
		expect(duplicateSlots(body)).toEqual([]);
		expect(rendered(body, new Map([['name', 'identifier'], ['body', 'block']]))).toEqual(['name', 'body']);
		expect(rendered(body, new Map([['name', 'identifier'], ['body', 'arrow']]))).toEqual(['name', 'body', ';']);
		expect(rendered(body, new Map([['name', 'identifier']]))).toEqual(['name', ';']);
	});

	it("keeps C's `;` after an expression initializer of a for statement", () => {
		const { emit } = compile({
			host: seq(str('for'), str('('), sym('_for_statement_body'), str(')')),
			_for_statement_body: seq(
				choice(field('initializer', sym('declaration')), seq(field('initializer', choice(sym('expr'), blank)), str(';'))),
				field('condition', choice(sym('expr'), blank)),
				str(';'),
				field('update', choice(sym('expr'), blank))
			),
			declaration: seq(str('int'), sym('expr'), str(';')),
			expr: pattern('[a-z0-9]+')
		});
		const body = emit().bodies.get('host')!;
		expect(duplicateSlots(body)).toEqual([]);
		expect(rendered(body, new Map([['initializer', 'declaration'], ['condition', 'expr']]))).toEqual(['for', '(', 'initializer', 'condition', ';', ')']);
		expect(rendered(body, new Map([['initializer', 'expr'], ['condition', 'expr'], ['update', 'expr']]))).toEqual(['for', '(', 'initializer', ';', 'condition', ';', 'update', ')']);
		expect(rendered(body, new Map([['condition', 'expr']]))).toEqual(['for', '(', ';', 'condition', ';', ')']);
		expect(rendered(body, new Map())).toEqual(['for', '(', ';', ';', ')']);
	});

	it('splits arms no single slot owns: {a b}, {a c}, {b c}', () => {
		const { emit } = compile({
			host: choice(
				seq(field('a', sym('x')), str('+'), field('b', sym('y'))),
				seq(field('a', sym('x')), str('-'), field('c', sym('z'))),
				seq(field('b', sym('y')), str('*'), field('c', sym('z')))
			),
			x: pattern('[a-z]+'),
			y: pattern('[0-9]+'),
			z: pattern('[A-Z]+')
		});
		const body = emit().bodies.get('host')!;
		expect(duplicateSlots(body)).toEqual([]);
		expect(rendered(body, new Set(['a', 'b']))).toEqual(['a', '+', 'b']);
		expect(rendered(body, new Set(['a', 'c']))).toEqual(['a', '-', 'c']);
		expect(rendered(body, new Set(['b', 'c']))).toEqual(['b', '*', 'c']);
	});

	it("keeps C's type qualifier: `long const int x` writes its `const`", () => {
		const { emit } = compile({
			host: choice(
				seq(field('elements', repeat(sym('sign'))), field('type', choice(sym('primitive_type'), blank)), field('elements_2', repeat1(sym('sign')))),
				seq(field('elements', repeat1(sym('sign'))), repeat(sym('type_qualifier')), field('type', choice(sym('primitive_type'), blank)), field('elements_2', repeat(sym('sign'))))
			),
			sign: pattern('long|short|signed|unsigned'),
			type_qualifier: choice(str('const'), str('volatile')),
			primitive_type: pattern('int|char')
		});
		const body = emit().bodies.get('host')!;
		expect(duplicateSlots(body)).toEqual([]);
		expect(rendered(body, new Set(['elements', 'type_qualifier', 'type']))).toEqual(['elements', 'type_qualifier', 'type']);
		expect(rendered(body, new Set(['elements', 'type', 'elements_2']))).toEqual(['elements', 'type', 'elements_2']);
		expect(rendered(body, new Set(['elements_2']))).toEqual(['elements_2']);
	});

	it('refuses with shared-slot-choice when no slot tells two arms apart', () => {
		const { emit } = compile({
			host: choice(seq(field('a', sym('x')), str('+'), field('b', sym('y'))), seq(field('b', sym('y')), str('-'), field('a', sym('x')))),
			x: pattern('[a-z]+'),
			y: pattern('[0-9]+')
		});
		let halted: unknown;
		try {
			emit();
		} catch (error) {
			halted = error;
		}
		expect(halted).toBeInstanceOf(EmitHaltedError);
		expect((halted as EmitHaltedError).blocking as readonly GrammarDiagnostic[]).toMatchObject([{ code: 'shared-slot-choice', ownerKind: 'host' }]);
	});
});

describe('flatSlotOrder', () => {
	it('places slots in an order every arm agrees with, the first to appear first among those ready', () => {
		expect(flatSlotOrder([['a', 'c'], ['b', 'c']])).toEqual(['a', 'b', 'c']);
		expect(flatSlotOrder([['a', 'c'], ['b', 'c', 'd']])).toEqual(['a', 'b', 'c', 'd']);
		expect(flatSlotOrder([['elements', 'type', 'elements_2'], ['elements', 'type_qualifier', 'type', 'elements_2']])).toEqual(['elements', 'type_qualifier', 'type', 'elements_2']);
	});

	it('keeps the order of first appearance when the arms disagree', () => {
		expect(flatSlotOrder([['static', 'override', 'readonly'], ['abstract', 'readonly'], ['readonly', 'abstract']])).toEqual(['static', 'override', 'readonly', 'abstract']);
	});
});

describe('flatSlotBody', () => {
	const typeGate = gate('type', slot('type'));

	it("keeps a seam named for a slot with that slot's unit, as in C's sized_type_specifier", () => {
		const bare = concat(slot('elements'), seam('elements_after'), typeGate, seam('elements_2_before'), slot('elements_2'));
		const qualified = concat(slot('elements'), seam('elements_after'), slot('type_qualifier'), typeGate, seam('elements_2_before'), slot('elements_2'));
		expect(flatSlotBody([bare, qualified])).toEqual({
			body: concat(
				gate('elements', slot('elements')),
				seam('elements_after'),
				gate('type_qualifier', slot('type_qualifier')),
				typeGate,
				seam('elements_2_before'),
				gate('elements_2', slot('elements_2'))
			),
			slots: ['elements', 'type_qualifier', 'type', 'elements_2']
		});
	});

	it('declines a seam named for no neighbouring slot, and a slot whose seams differ between arms', () => {
		expect(flatSlotBody([concat(slot('a'), seam('x_after'), slot('b')), concat(slot('a'), slot('c'), slot('b'))])).toBeUndefined();
		expect(flatSlotBody([concat(slot('a'), seam('a_after'), slot('b')), concat(slot('a'), slot('c'), slot('b'))])).toBeUndefined();
	});
});
