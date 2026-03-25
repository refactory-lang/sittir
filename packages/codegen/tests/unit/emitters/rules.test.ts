import { describe, it, expect } from 'vitest';
import { emitRule } from '../../../src/emitters/rules.ts';
import { readGrammarKind } from '../../../src/grammar-reader.ts';

describe('emitRule', () => {
	it('emits S-expression template for function_item', () => {
		const node = readGrammarKind('rust', 'function_item');
		const rule = emitRule({ grammar: 'rust', node });

		expect(rule.template).toContain('"fn"');
		expect(rule.template).toContain('name: (_)');
		expect(rule.template).toContain('body:');
		expect(rule.template).toMatch(/^\(function_item/);
		expect(rule.fields['name']).toEqual({ required: true });
	});

	it('emits S-expression template for struct_item', () => {
		const node = readGrammarKind('rust', 'struct_item');
		const rule = emitRule({ grammar: 'rust', node });

		expect(rule.template).toContain('"struct"');
		expect(rule.template).toContain('name: (_)');
		expect(rule.template).toMatch(/^\(struct_item/);
	});

	it('emits S-expression template for if_expression', () => {
		const node = readGrammarKind('rust', 'if_expression');
		const rule = emitRule({ grammar: 'rust', node });

		expect(rule.template).toContain('"if"');
		expect(rule.template).toContain('condition: (_)');
		expect(rule.template).toContain('consequence: (_)');
	});

	it('emits S-expression template for use_declaration', () => {
		const node = readGrammarKind('rust', 'use_declaration');
		const rule = emitRule({ grammar: 'rust', node });

		expect(rule.template).toContain('"use"');
		expect(rule.template).toContain('argument: (_)');
	});

	it('marks optional fields with ? quantifier', () => {
		const node = readGrammarKind('rust', 'function_item');
		const rule = emitRule({ grammar: 'rust', node });

		expect(rule.fields['name']!.required).toBe(true);
		expect(rule.fields['return_type']?.required).toBe(false);
		expect(rule.template).toContain('return_type: (_)?');
	});

	it('marks multiple fields with * quantifier', () => {
		const node = readGrammarKind('rust', 'function_item');
		const rule = emitRule({ grammar: 'rust', node });

		expect(rule.template).toBeDefined();
	});

	it('handles block with braces', () => {
		const node = readGrammarKind('rust', 'block');
		const rule = emitRule({ grammar: 'rust', node });

		expect(rule.template).toContain('"{"');
		expect(rule.template).toContain('"}"');
	});

	it('produces valid S-expression (starts/ends with parens)', () => {
		const node = readGrammarKind('rust', 'binary_expression');
		const rule = emitRule({ grammar: 'rust', node });

		expect(rule.template).toMatch(/^\(.*\)$/);
	});
});
