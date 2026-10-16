import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadBindingsModule } from '../module.ts';
import { evaluateDsl } from '../../compiler/evaluate.ts';

const PACKAGES = join(__dirname, '../../../..');

describe('the production receiver edits', () => {
	it.each([
		['rust', 'parameters_elements', 'attributed_parameter'],
		['typescript', 'formal_parameters_elements', 'formal_parameter']
	])('%s separates its receiver from the ordinary parameters', async (grammar, list, item) => {
		const bindings = await loadBindingsModule(join(PACKAGES, grammar));
		expect(bindings?.leads).toHaveLength(1);
		expect(bindings?.leads?.[0]).toMatchObject({ list, item, field: 'receiver' });
	});
});

describe('the production bindings layers', () => {
	it.each(['call_expression_member', 'variable_declarator_definite'])(
		'keeps %s hoisted after its binding field patch',
		async (kind) => {
			const raw = await evaluateDsl(join(PACKAGES, 'typescript', 'grammar.sittir.ts'));
			expect(raw.rules[kind]).toMatchObject({ annotations: { hoisted: true } });
		}
	);

	it.each([
		['rust', 'function_item'],
		['python', 'function_definition'],
		['typescript', 'function_declaration']
	])('%s applies field edits while keeping its low-level kind names', async (grammar, functionKind) => {
		const raw = await evaluateDsl(join(PACKAGES, grammar, 'grammar.sittir.ts'));
		expect(raw.bindingEffects?.some((effect) => effect.kind === 'segment')).toBe(true);
		expect(raw.rules).toHaveProperty(functionKind);
		expect(raw.renamedFrom ?? {}).toEqual({});
	});
});
