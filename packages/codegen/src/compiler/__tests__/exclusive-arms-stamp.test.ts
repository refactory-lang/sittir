import { beforeAll, describe, expect, it } from 'vitest';
import { assemblePredicted } from '../../__tests__/helpers/linked.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { evaluatePackage } from '../../dsl/evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import { isSlotBearingCompound } from '../../emitters/shared.ts';
import { collectKindEntries } from '../../emitters/kind-discriminant.ts';
import { armCrossingClears, armRequiredSlot, builtTypeSurfaceOf } from '../../emitters/factories.ts';
import type { NodeMap, RawGrammar } from '../types.ts';

function synthetic(rules: Record<string, unknown>): NodeMap {
	const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(rules as never);
	const raw: RawGrammar = {
		name: 'synth',
		fileTypes: [],
		rules: catalogRules,
		ruleCatalog,
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: []
	};
	return assemblePredicted(raw).nodeMap;
}

function held(nodeMap: NodeMap, kind: string): Record<string, readonly { arm: number; required: boolean }[] | undefined> {
	const node = nodeMap.nodes.get(kind);
	if (!node || !isSlotBearingCompound(node)) throw new Error(`expected '${kind}' to assemble as a compound`);
	return Object.fromEntries(node.slots.map((slot) => [slot.fieldName ?? '', slot.arms?.held]));
}

const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });
const repeat1 = (content: unknown) => ({ type: 'REPEAT1', content });
const leaves = { digits: { type: 'PATTERN', value: '[0-9]+' }, word: { type: 'PATTERN', value: '[a-z]+' } };

function slotOf(nodeMap: NodeMap, kind: string, field: string) {
	const node = nodeMap.nodes.get(kind);
	if (!node || !isSlotBearingCompound(node)) throw new Error(`expected '${kind}' to assemble as a compound`);
	return { node, slot: node.slots.find((candidate) => candidate.fieldName === field)! };
}

describe('arm-crossing setters emission', () => {
	const listArm = (): { generatedIdTables: never; nodeMap: NodeMap } => {
		const { rules: catalogRules, ruleCatalog } = buildRuleCatalog({
			input: choice(field('items', { type: 'REPEAT1', content: sym('word') }), field('value', sym('digits'))),
			...leaves
		} as never);
		const raw: RawGrammar = { name: 'synth', fileTypes: [], rules: catalogRules, ruleCatalog, evaluateSynthesized: new Set<string>(), extras: [], externals: [], supertypes: [], factoryInline: [], inline: [], conflicts: [], precedences: [], word: null, references: [] };
		const assembled = assemblePredicted(raw);
		return { generatedIdTables: assembled.generatedIdTables as never, nodeMap: assembled.nodeMap };
	};

	it('clears the scalar arm when a parsed rest setter sets the list arm', () => {
		const wrap = emitWrap({ ...listArm(), grammar: 'synth' });
		expect(wrap).toMatch(/_value: undefined, _items: /);
	});

	it('clears the scalar arm when a built rest setter sets the list arm', () => {
		const factories = emitFactories({ ...listArm(), grammar: 'synth' });
		expect(factories).toMatch(/value: undefined, items: restItems/);
	});
});

describe('arm-crossing setters', () => {
	it('clears the slots only the old arm held and keeps a shared one', () => {
		const nodeMap = synthetic({
			input: choice(seq(field('shared', sym('digits')), field('left', sym('word'))), seq(field('right', sym('word')), field('shared', sym('digits')))),
			...leaves
		});
		const crossing = (name: string) => {
			const { node, slot } = slotOf(nodeMap, 'input', name);
			return armCrossingClears(node as never, node.slots, slot).map((cleared) => cleared.fieldName);
		};
		expect(crossing('right')).toEqual(['left']);
		expect(crossing('left')).toEqual(['right']);
		expect(crossing('shared')).toEqual([]);
	});

	it('types a setter without undefined only for a slot its arm requires, and only when no arm is empty', () => {
		const exclusive = synthetic({ input: choice(field('value', sym('digits')), field('arguments', sym('word'))), ...leaves });
		const { node: exclusiveNode, slot: value } = slotOf(exclusive, 'input', 'value');
		expect(armRequiredSlot(exclusiveNode as never, exclusiveNode.slots, value)).toBe(true);
		const withEmptyArm = synthetic({ input: choice(field('value', sym('digits')), seq(choice(field('arguments', sym('word')), { type: 'BLANK' }))), ...leaves });
		const { node, slot } = slotOf(withEmptyArm, 'input', 'value');
		expect(slot.arms).toBeDefined();
		expect(armRequiredSlot(node as never, node.slots, slot)).toBe(false);
	});
});

describe('arms stamp', () => {
	it('records which arm holds each slot and whether the arm requires it', () => {
		const nodeMap = synthetic({ input: choice(field('value', sym('digits')), field('arguments', sym('word'))), ...leaves });
		expect(held(nodeMap, 'input')).toEqual({ value: [{ arm: 0, required: true }], arguments: [{ arm: 1, required: true }] });
	});

	it('records a slot two arms hold in both, each with its own requiredness', () => {
		const nodeMap = synthetic({
			input: choice(seq(field('shared', sym('digits')), field('left', sym('word'))), seq(field('right', sym('word')), field('shared', sym('digits')))),
			...leaves
		});
		expect(held(nodeMap, 'input')['shared']).toEqual([
			{ arm: 0, required: true },
			{ arm: 1, required: true }
		]);
		expect(held(nodeMap, 'input')['left']).toEqual([{ arm: 0, required: true }]);
	});

	it('leaves a choice whose arms hold the same slots unstamped', () => {
		const nodeMap = synthetic({
			input: choice(seq(field('value', sym('digits')), str('p')), seq(field('value', sym('word')), str('q'))),
			...leaves
		});
		expect(Object.values(held(nodeMap, 'input')).every((slot) => slot === undefined)).toBe(true);
	});

	it.each([
		['repeat', repeat],
		['repeat1', repeat1]
	])('leaves a choice under %s unstamped, since separate iterations may take different arms', (_, repeated) => {
		const nodeMap = synthetic({ input: repeated(choice(field('value', sym('digits')), field('arguments', sym('word')))), ...leaves });
		expect(Object.values(held(nodeMap, 'input')).every((slot) => slot === undefined)).toBe(true);
	});

	it('leaves a choice that is not a rule of arms with slots unstamped', () => {
		const nodeMap = synthetic({ input: seq(field('value', sym('digits')), choice(str('p'), str('q'))), ...leaves });
		expect(Object.values(held(nodeMap, 'input')).every((slot) => slot === undefined)).toBe(true);
	});

	describe('real grammars', () => {
		let rust: NodeMap;
		let typescript: NodeMap;
		let typescriptSurface: (kind: string) => ReturnType<typeof builtTypeSurfaceOf>;

		beforeAll(async () => {
			rust = assemblePredicted(await evaluatePackage(grammarPackage('rust'))).nodeMap;
			const assembled = assemblePredicted(await evaluatePackage(grammarPackage('typescript')));
			typescript = assembled.nodeMap;
			const kindEntries = collectKindEntries(typescript, assembled.generatedIdTables);
			typescriptSurface = (kind) => builtTypeSurfaceOf(typescript.nodes.get(kind)!, typescript, kindEntries);
		}, FULL_PIPELINE_TIMEOUT);

		it('stamps the two arms of rust attribute_input', () => {
			expect(held(rust, 'attribute_input')).toEqual({ value: [{ arm: 0, required: true }], arguments: [{ arm: 1, required: true }] });
		});

		it('prints the row of typescript binary_expression as the helper over its two arms', () => {
			const surface = typescriptSurface('binary_expression')!;
			expect(surface.buildArgs).toMatch(/^ArmRows<\[config\?: /);
			expect(surface.buildArgs).toContain("[['left' | 'operator' | 'right', 'left' | 'operator' | 'right'], ['binaryExpressionIn', 'binaryExpressionIn']]");
			expect(surface.looseArgs).toMatch(/^ArmRows</);
		});

		it('keeps typescript public_field_definition_plain one config, since its arms differ only in flags', () => {
			expect(typescriptSurface('public_field_definition_plain')!.buildArgs).not.toContain('ArmRows');
			expect(typescriptSurface('public_field_definition_plain')!.looseArgs).not.toContain('ArmRows');
		});
	});
});
