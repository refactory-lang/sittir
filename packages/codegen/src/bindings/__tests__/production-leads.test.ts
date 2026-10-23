import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateDsl } from '../../dsl/evaluate.ts';
import { grammarPackage, topLayerPath } from '../../grammars.ts';

const recorded = JSON.parse(readFileSync(join(__dirname, '../../dsl/__tests__/fixtures/bindings-layer-effects.json'), 'utf8')) as Readonly<
	Record<string, { readonly provenance: { readonly leadFrom?: unknown; readonly bindingEffects: readonly { readonly kind: string }[] } }>
>;

describe('the production leads, on the lead verb', () => {
	it.each([
		['rust', ['_parameter_receiver', '_attributed_parameter_receiver', '_parameters_elements_receiver', 'parameters_elements_receiver_group']],
		['typescript', ['_parameter_name_receiver', '_required_parameter_receiver', '_parameter_name_formal_parameter', '_formal_parameters_elements_receiver', 'formal_parameters_elements_receiver_group']]
	])("%s ends with its lead's copies and then its group, and projects the recorded provenance", async (grammar, last) => {
		const raw = await evaluateDsl(topLayerPath(grammarPackage(grammar)));
		expect(Object.keys(raw.rules).slice(-last.length)).toEqual(last);
		const { provenance } = recorded[grammar]!;
		expect(JSON.stringify(raw.leadFrom)).toBe(JSON.stringify(provenance.leadFrom));
		const leads = (effects: readonly { readonly kind: string }[] | undefined) => JSON.stringify((effects ?? []).filter((effect) => effect.kind === 'lead'));
		expect(leads(raw.bindingEffects)).toBe(leads(provenance.bindingEffects));
	});
});

describe('the production receiver edits', () => {
	it.each([
		['rust', 'parameters_elements', 'attributed_parameter'],
		['typescript', 'formal_parameters_elements', 'formal_parameter']
	])('%s separates its receiver from the ordinary parameters', async (grammar, list, item) => {
		const raw = await evaluateDsl(topLayerPath(grammarPackage(grammar)));
		const leads = (raw.bindingEffects ?? []).filter((effect) => effect.kind === 'lead');
		expect(leads).toHaveLength(1);
		expect(leads[0]).toMatchObject({ list, item, field: 'receiver' });
	});
});

describe('the production bindings layers', () => {
	it.each(['call_expression_member', 'variable_declarator_definite'])(
		'keeps %s hoisted after its binding field patch',
		async (kind) => {
			const raw = await evaluateDsl(topLayerPath(grammarPackage('typescript')));
			expect(raw.rules[kind]).toMatchObject({ annotations: { hoisted: true } });
		}
	);

	it.each([
		['rust', 'function_item'],
		['python', 'function_definition'],
		['typescript', 'function_declaration']
	])('%s applies field edits while keeping its low-level kind names', async (grammar, functionKind) => {
		const raw = await evaluateDsl(topLayerPath(grammarPackage(grammar)));
		expect(raw.bindingEffects?.some((effect) => effect.kind === 'segment')).toBe(true);
		expect(raw.rules).toHaveProperty(functionKind);
		expect(raw.renamedFrom ?? {}).toEqual({});
	});
});
