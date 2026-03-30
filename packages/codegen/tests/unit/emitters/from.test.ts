import { describe, it, expect } from 'vitest';
import { emitFrom } from '../../../src/emitters/from.ts';
import { buildGrammarModel } from '../../../src/grammar-model.ts';

const grammar = 'rust';
const { newModel } = buildGrammarModel(grammar);
const allNodes = [...newModel.models.values()];

describe('emitFrom', () => {
	const source = emitFrom({ grammar, nodes: allNodes });

	it('emits _resolveByKind dispatch', () => {
		expect(source).toContain('function _resolveByKind(kind: string, rest: any)');
		expect(source).toContain("case 'function_item':");
	});

	it('emits shared resolver functions', () => {
		expect(source).toContain('function _resolve');
	});

	it('emits per-kind From functions', () => {
		expect(source).toContain('export function functionItemFrom');
		expect(source).toContain('export function binaryExpressionFrom');
	});
});
