import { describe, it, expect } from 'vitest';
import { generate } from '../../src/index.ts';

describe('generate() for Rust', () => {
	const result = generate({
		grammar: 'rust',
		nodes: ['struct_item', 'function_item', 'use_declaration', 'attribute_item'],
		outputDir: 'src',
	});

	it('should generate YAML render templates', () => {
		expect(result.templatesYaml).toContain('language: rust');
		expect(result.templatesYaml).toContain('struct_item:');
		expect(result.templatesYaml).toContain('function_item:');
		expect(result.templatesYaml).toContain('$NAME');
	});

	it('should generate unified factory functions', () => {
		expect(result.factories).toContain('export function struct_item_(');
		expect(result.factories).toContain('export function function_item_(');
		expect(result.factories).toContain("type: 'struct_item'");
		expect(result.factories).toContain('render() { return render(this)');


	});

	it('should generate types with const enum SyntaxKind', () => {
		expect(result.types).toContain('export const enum SyntaxKind');
		expect(result.types).toContain("StructItem = 'struct_item'");
		expect(result.types).toContain("FunctionItem = 'function_item'");
		expect(result.types).toContain('RustNode');
	});

	it('should generate Tree interfaces for navigation', () => {
		expect(result.types).toContain('export interface StructItemTree');
		expect(result.types).toContain('export interface FunctionItemTree');
	});

	it('should generate grammar type', () => {
		expect(result.grammar).toContain('RustGrammar');
	});

	it('should generate index barrel with new exports', () => {
		expect(result.index).toContain("from './ir.js'");
		expect(result.index).toContain("from '@sittir/core'");
	});

	it('should generate consts', () => {
		expect(result.consts).toBeDefined();
	});

	it('should include templates YAML with rules', () => {
		expect(result.templatesYaml).toContain('rules:');
	});

	it('should NOT have old builder properties', () => {
		expect(result).not.toHaveProperty('builders');
		expect(result).not.toHaveProperty('builder');
		expect(result).not.toHaveProperty('leafTests');
	});
});
