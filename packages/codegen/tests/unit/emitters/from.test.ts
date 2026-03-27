import { describe, it, expect } from 'vitest';
import { emitFrom } from '../../../src/emitters/from.ts';
import { readGrammarKind, listKeywordKinds, listLeafKinds, listSupertypes } from '../../../src/grammar-reader.ts';

const grammar = 'rust';
const leafKinds = listLeafKinds(grammar);
const keywordKinds = listKeywordKinds(grammar);
const supertypes = listSupertypes(grammar);
const nodes = ['function_item', 'binary_expression', 'let_chain'].map(k => readGrammarKind(grammar, k));

describe('emitFrom', () => {
	const source = emitFrom({ grammar, nodes, leafKinds, keywordKinds, supertypes });

	it('emits _resolveByKind dispatch', () => {
		expect(source).toContain('function _resolveByKind(kind: string, rest: any)');
		expect(source).toContain("case 'function_item':");
	});

	it('emits per-kind From functions', () => {
		expect(source).toContain('export function functionItemFrom(');
		expect(source).toContain('export function binaryExpressionFrom(');
	});

	it('uses named Tree interfaces in overload signatures', () => {
		expect(source).toContain('input: FunctionItemTree): any');
		expect(source).toContain('input: BinaryExpressionTree): any');
	});

	it('imports assign functions from assign.js', () => {
		expect(source).toContain("from './assign.js'");
		expect(source).toContain('assignFunctionItem');
	});

	it('uses assign functions instead of .assign() on factories', () => {
		expect(source).not.toContain('.assign(input)');
		expect(source).toContain('assignFunctionItem(input)');
	});

	it('imports named Tree types from types.js', () => {
		expect(source).toContain('FunctionItemTree');
		expect(source).toContain('BinaryExpressionTree');
	});

	it('does not reference bare _ or _-prefixed supertypes in dispatch', () => {
		expect(source).not.toContain("case '_':");
		expect(source).not.toContain("case '_expression':");
		expect(source).not.toContain(' _From(');
		// Supertypes are expanded to concrete subtypes, not dispatched as abstract kinds
		expect(source).not.toMatch(/\bexpressionFrom\(/);
	});
});
