import { describe, it, expect } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { emitTemplatesYaml } from '../../../src/emitters/rules.ts';
import { buildGrammarModel } from '../../../src/grammar-model.ts';
import type { RulesConfig } from '@sittir/types';

const { newModel } = buildGrammarModel('rust');
const nodes = [...newModel.models.values()];

function getConfig(): RulesConfig {
	const yaml = emitTemplatesYaml({ grammar: 'rust', nodes, grammarSha: 'test' });
	return parseYaml(yaml) as RulesConfig;
}

describe('emitTemplatesYaml', () => {
	it('produces valid YAML with expected top-level keys', () => {
		const config = getConfig();
		expect(config.language).toBe('rust');
		expect(config.extensions).toEqual(['rs']);
		expect(config.expandoChar).toBeNull();
		expect(config.metadata.grammarSha).toBe('test');
		expect(config.rules).toBeDefined();
	});

	it('emits template for function_item with $VARIABLE syntax', () => {
		const config = getConfig();
		const rule = config.rules['function_item'];
		expect(rule).toBeDefined();
		const template = typeof rule === 'string' ? rule : (rule as any).template;
		expect(template).toContain('$NAME');
		expect(template).toContain('fn');
	});

	it('emits template for binary_expression as string form', () => {
		const config = getConfig();
		const rule = config.rules['binary_expression'];
		expect(typeof rule).toBe('string');
		expect(rule).toContain('$LEFT');
		expect(rule).toContain('$OPERATOR');
		expect(rule).toContain('$RIGHT');
	});

	it('emits template for struct_item', () => {
		const config = getConfig();
		const rule = config.rules['struct_item'];
		expect(rule).toBeDefined();
		const template = typeof rule === 'string' ? rule : (rule as any).template;
		expect(template).toContain('struct');
		expect(template).toContain('$NAME');
	});

	it('synthesizes clauses for optional token+field groups', () => {
		const config = getConfig();
		const rule = config.rules['function_item'];
		if (typeof rule === 'object' && rule !== null) {
			// Should have return_type_clause or similar
			const clauseKeys = Object.keys(rule).filter(k => k.endsWith('_clause'));
			expect(clauseKeys.length).toBeGreaterThan(0);
		}
	});

	it('includes joinBy for rules with separators', () => {
		const config = getConfig();
		// parameters should have joinBy for comma separation
		const rule = config.rules['parameters'];
		if (typeof rule === 'object' && rule !== null) {
			expect((rule as any).joinBy).toBeDefined();
		}
	});
});
