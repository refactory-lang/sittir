import { beforeAll, describe, expect, it } from 'vitest';
import { assemblePredicted, diagnosePredicted, predictedRawGrammarOf } from '../../__tests__/helpers/linked.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { evaluatePackage } from '../../dsl/evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import { isSlotBearingCompound } from '../../emitters/shared.ts';
import { collectKindEntries } from '../../emitters/kind-discriminant.ts';
import { builtTypeSurfaceOf } from '../../emitters/factories.ts';
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

function stamps(nodeMap: NodeMap, kind: string): Record<string, { required: boolean; branched: boolean } | undefined> {
	const node = nodeMap.nodes.get(kind);
	if (!node || !isSlotBearingCompound(node)) throw new Error(`expected '${kind}' to assemble as a compound`);
	return Object.fromEntries(
		node.slots.map((slot) => [
			slot.fieldName ?? '',
			slot.coOptional === undefined ? undefined : { required: slot.coOptional.required, branched: slot.coOptional.branch !== undefined }
		])
	);
}

const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const optional = (content: unknown) => ({ type: 'CHOICE', members: [content, { type: 'BLANK' }] });

describe('coOptional stamp', () => {
	it('marks each member of an ungrouped optional branch with whether it was required inside it', () => {
		const nodeMap = synthetic({
			number: {
				type: 'SEQ',
				members: [
					field('integer', sym('digits')),
					optional({
						type: 'SEQ',
						members: [str('e'), field('exponent_sign', optional(sym('sign'))), field('exponent', sym('digits'))]
					})
				]
			},
			digits: { type: 'PATTERN', value: '[0-9]+' },
			sign: { type: 'PATTERN', value: '[+-]' }
		});
		const slots = stamps(nodeMap, 'number');
		expect(slots['integer']).toBeUndefined();
		expect(slots['exponent']).toEqual({ required: true, branched: true });
		expect(slots['exponent_sign']).toEqual({ required: false, branched: true });
	});

	it('leaves a lone optional member unstamped', () => {
		const nodeMap = synthetic({
			number: { type: 'SEQ', members: [field('integer', sym('digits')), optional({ type: 'SEQ', members: [str('e'), field('exponent', sym('digits'))] })] },
			digits: { type: 'PATTERN', value: '[0-9]+' }
		});
		expect(stamps(nodeMap, 'number')['exponent']).toBeUndefined();
	});

	it('fails with a blocking diagnostic when an ungrouped optional branch nests inside another', () => {
		const { diagnostics } = diagnosePredicted(
			predictedRawGrammarOf({
				number: {
					type: 'SEQ',
					members: [
						field('integer', sym('digits')),
						optional({
							type: 'SEQ',
							members: [
								str('e'),
								field('exponent', sym('digits')),
								optional({ type: 'SEQ', members: [str('f'), field('scale', sym('digits')), field('unit', sym('digits'))] })
							]
						})
					]
				},
				digits: { type: 'PATTERN', value: '[0-9]+' }
			})
		);
		const nested = diagnostics.filter((d) => d.code === 'unclassifiable-shape' && d.message.includes('nested-optional-branch'));
		expect(nested).toHaveLength(1);
		expect(nested[0]?.canProceed).toBe(false);
	});

	describe('float kinds', () => {
		let typescript: NodeMap;
		let python: NodeMap;
		let typescriptSurface: (kind: string) => ReturnType<typeof builtTypeSurfaceOf>;

		beforeAll(async () => {
			const assembled = assemblePredicted(await evaluatePackage(grammarPackage('typescript')));
			typescript = assembled.nodeMap;
			const kindEntries = collectKindEntries(typescript, assembled.generatedIdTables);
			typescriptSurface = (kind) => builtTypeSurfaceOf(typescript.nodes.get(kind)!, typescript, kindEntries);
			python = assemblePredicted(await evaluatePackage(grammarPackage('python'))).nodeMap;
		}, FULL_PIPELINE_TIMEOUT);

		it('prints a float row as the helper over the config row, a lone-slot kind as it was', () => {
			const surface = typescriptSurface('number_float_point')!;
			expect(surface.buildArgs).toMatch(/^CoOptionalRows<\[config: /);
			expect(surface.buildArgs).toMatch(/'exponentSign'/);
			expect(surface.looseArgs).toMatch(/^CoOptionalRows<\[config: T\.NumberFloatPoint\.Loose/);
			expect(typescriptSurface('number_float_scientific')!.buildArgs).not.toContain('CoOptionalRows');
			expect(typescriptSurface('index_signature_colon')!.buildArgs).not.toContain('CoOptionalRows');
		});

		it('leaves a group kind unstamped, since its optional lies on the parent', () => {
			const slots = stamps(typescript, 'index_signature_colon');
			expect(Object.values(slots).every((s) => s === undefined)).toBe(true);
		});

		it.each([
			['typescript', 'number_float_point'],
			['typescript', 'number_float_leading_point'],
			['python', 'float_point'],
			['python', 'float_leading_point']
		])('%s %s carries the stamp on its branch slots', (grammar, kind) => {
			const slots = stamps(grammar === 'typescript' ? typescript : python, kind);
			const stamped = Object.values(slots).filter((s) => s !== undefined);
			expect(stamped.length).toBeGreaterThanOrEqual(2);
			expect(stamped.some((s) => s?.required)).toBe(true);
			expect(stamped.every((s) => s?.branched)).toBe(true);
		});
	});
});
