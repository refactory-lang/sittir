import { describe, it, expect } from 'vitest';
import { generate } from '../../src/index.ts';

describe('generate() for Rust', () => {
	const result = generate({
		grammar: 'rust',
		nodes: ['struct_item', 'function_item', 'use_declaration', 'attribute_item'],
		outputDir: 'src',
	});

	it('should generate builder for each node kind', () => {
		expect(result.builders.size).toBe(4);
		expect(result.builders.has('struct_item')).toBe(true);
		expect(result.builders.has('attribute_item')).toBe(true);
	});

	it('should generate self-contained builders extending Builder', () => {
		const structBuilder = result.builders.get('struct_item')!;
		expect(structBuilder).toContain('extends Builder');
		expect(structBuilder).toContain('renderImpl(ctx');
		expect(structBuilder).toContain("parts.push('struct')");
	});

	it('should generate types with all node kinds', () => {
		expect(result.types).toContain('StructItem');
		expect(result.types).toContain('AttributeItem');
		expect(result.types).toContain('RustIrNode');
	});

	it('should generate builder namespace with leaf helpers', () => {
		expect(result.builder).toContain('export const ir');
		expect(result.builder).toContain('LeafBuilder');
		expect(result.builder).toContain('identifier');
	});

	it('should generate grammar type', () => {
		expect(result.grammar).toContain('RustGrammar');
	});

	it('should generate index barrel with Builder re-export', () => {
		expect(result.index).toContain("from './builder.js'");
		expect(result.index).toContain('Builder');
	});

	it('should NOT generate render.ts, validate.ts, etc.', () => {
		expect(result).not.toHaveProperty('renderer');
		expect(result).not.toHaveProperty('renderValid');
		expect(result).not.toHaveProperty('validate');
		expect(result).not.toHaveProperty('validateFast');
	});

	it('should generate tests for each node kind', () => {
		expect(result.tests.size).toBe(4);
	});
});
