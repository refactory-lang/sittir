import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { grammarPackage, type GrammarName } from '../../grammars.ts';
import { sourceChain } from '../derive-conflicts.ts';
import { evaluateForDerivation, grammarHash, type DerivationInputs } from '../evaluate-for-derivation.ts';
import { treeSitterCliVersion } from '../tree-sitter-cli.ts';

interface UpstreamGrammarJson {
	readonly rules: Record<string, unknown>;
	readonly externals?: readonly { readonly type: string; readonly name?: string }[];
	readonly conflicts?: readonly (readonly string[])[];
}

function upstreamGrammarJson(name: GrammarName, grammarJsonPath: string): UpstreamGrammarJson {
	const requireFromPackage = createRequire(join(grammarPackage(name).dir, 'package.json'));
	return JSON.parse(readFileSync(requireFromPackage.resolve(grammarJsonPath), 'utf8')) as UpstreamGrammarJson;
}

describe('grammarHash', () => {
	const grammar = { name: 'g', rules: { a: { type: 'STRING', value: 'a' } }, conflicts: [['a']] };

	it('ignores conflicts', () => {
		expect(grammarHash({ ...grammar, conflicts: [] }, '0.26.9')).toBe(grammarHash(grammar, '0.26.9'));
	});

	it('ignores key order and Map insertion order', () => {
		const reordered = { conflicts: [['a']], rules: { a: { value: 'a', type: 'STRING' } }, name: 'g' };
		expect(grammarHash(reordered, '0.26.9')).toBe(grammarHash(grammar, '0.26.9'));
		const mapped = { ...grammar, provenance: new Map([['x', 1], ['y', 2]]) };
		expect(grammarHash({ ...grammar, provenance: new Map([['y', 2], ['x', 1]]) }, '0.26.9')).toBe(grammarHash(mapped, '0.26.9'));
	});

	it('changes when the tree-sitter CLI version changes', () => {
		expect(grammarHash(grammar, '0.27.0')).not.toBe(grammarHash(grammar, '0.26.9'));
	});

	it('changes when a rule changes', () => {
		expect(grammarHash({ ...grammar, rules: { a: { type: 'STRING', value: 'b' } } }, '0.26.9')).not.toBe(grammarHash(grammar, '0.26.9'));
	});
});

describe('evaluateForDerivation', () => {
	let python: DerivationInputs;
	beforeAll(() => {
		python = evaluateForDerivation(grammarPackage('python'));
	});

	it('hashes with the version of the tree-sitter CLI that generates', () => {
		expect(treeSitterCliVersion()).toMatch(/^\d+\.\d+\.\d+/);
	});

	it('hashes the same grammar identically in two fresh processes', () => {
		expect(evaluateForDerivation(grammarPackage('python')).grammarHash).toBe(python.grammarHash);
	});

	it("carries upstream's own declared conflicts", () => {
		expect(python.upstreamConflicts).toEqual(upstreamGrammarJson('python', 'tree-sitter-python/src/grammar.json').conflicts);
		expect(python.ruleCount).toBeGreaterThan(0);
	});

	it('maps a variant hoisted from a lift to its upstream parent, not to the lift mint', () => {
		expect(sourceChain('integer_hex', python.sourceEdges)).toEqual(['integer_hex', 'integer']);
		expect(sourceChain('expression_statement_tuple', python.sourceEdges)).toEqual(['expression_statement_tuple', 'expression_statement']);
	});

	it('follows a variant of a variant to the upstream rule', () => {
		const typescript = evaluateForDerivation(grammarPackage('typescript'));
		expect(sourceChain('export_statement_default_from', typescript.sourceEdges)).toEqual([
			'export_statement_default_from',
			'export_statement_default',
			'export_statement'
		]);
	});

	it('never gives an upstream rule or external an edge', () => {
		const upstream = upstreamGrammarJson('python', 'tree-sitter-python/src/grammar.json');
		const upstreamSymbols = new Set([...Object.keys(upstream.rules), ...(upstream.externals ?? []).flatMap((e) => (e.name ? [e.name] : []))]);
		expect(Object.keys(python.sourceEdges).filter((name) => upstreamSymbols.has(name))).toEqual([]);
	});
});
