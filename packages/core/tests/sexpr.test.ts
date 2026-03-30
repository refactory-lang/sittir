import { describe, it, expect } from 'vitest';
import { parseTemplate } from '../src/sexpr.ts';

describe('parseTemplate', () => {
	it('parses a simple template with tokens and fields', () => {
		const result = parseTemplate('(function_item "fn" name: (_) body: (_))');
		expect(result.kind).toBe('function_item');
		expect(result.elements).toEqual([
			{ type: 'token', value: 'fn' },
			{ type: 'field', name: 'name' },
			{ type: 'field', name: 'body' },
		]);
	});

	it('parses optional field quantifier', () => {
		const result = parseTemplate('(function_item name: (_) return_type: (_)?)');
		expect(result.elements).toEqual([
			{ type: 'field', name: 'name' },
			{ type: 'field', name: 'return_type', quantifier: '?' },
		]);
	});

	it('parses multiple field quantifier *', () => {
		const result = parseTemplate('(parameters "(" items: (_)* ")")');
		expect(result.elements).toEqual([
			{ type: 'token', value: '(' },
			{ type: 'field', name: 'items', quantifier: '*' },
			{ type: 'token', value: ')' },
		]);
	});

	it('parses one-or-more quantifier +', () => {
		const result = parseTemplate('(list items: (_)+)');
		expect(result.elements).toEqual([
			{ type: 'field', name: 'items', quantifier: '+' },
		]);
	});

	it('parses unnamed children with quantifier', () => {
		const result = parseTemplate('(block "{" (_)* "}")');
		expect(result.elements).toEqual([
			{ type: 'token', value: '{' },
			{ type: 'children', quantifier: '*' },
			{ type: 'token', value: '}' },
		]);
	});

	it('parses mixed tokens and fields', () => {
		const result = parseTemplate('(let_declaration "let" pattern: (_) ":" type: (_)? "=" value: (_)? ";")');
		expect(result.kind).toBe('let_declaration');
		expect(result.elements).toEqual([
			{ type: 'token', value: 'let' },
			{ type: 'field', name: 'pattern' },
			{ type: 'token', value: ':' },
			{ type: 'field', name: 'type', quantifier: '?' },
			{ type: 'token', value: '=' },
			{ type: 'field', name: 'value', quantifier: '?' },
			{ type: 'token', value: ';' },
		]);
	});

	it('throws on invalid template', () => {
		expect(() => parseTemplate('not an sexpr')).toThrow('must be an S-expression');
	});

	it('handles multiple quoted strings', () => {
		const result = parseTemplate('(use_declaration "use" argument: (_) ";")');
		expect(result.elements).toEqual([
			{ type: 'token', value: 'use' },
			{ type: 'field', name: 'argument' },
			{ type: 'token', value: ';' },
		]);
	});
});
