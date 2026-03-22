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

	it('should generate types with all node kinds', () => {
		expect(result.types).toContain('StructItem');
		expect(result.types).toContain('AttributeItem');
		expect(result.types).toContain('RustIrNode');
	});

	it('should generate fluent namespace', () => {
		expect(result.fluent).toContain('export const ir');
	});

	it('should generate render scaffold', () => {
		expect(result.renderer).toContain("case 'struct_item':");
		expect(result.renderer).toContain("case 'attribute_item':");
	});

	it('should generate tests for each node kind', () => {
		expect(result.tests.size).toBe(4);
	});
});
