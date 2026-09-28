import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from './_sittir-grammar.ts';
import { collectGrammarDiagnosticsForGrammar } from '../diagnostics/grammar-diagnostics.ts';
import { toScreamingSnakeCase } from '../model/casing.ts';
import type { RawGrammar } from '../types.ts';

const require = createRequire(import.meta.url);

function predictedKeys(raw: RawGrammar): ReadonlySet<string> {
	const kinds = raw.predictedKinds;
	if (kinds === undefined || !('entries' in kinds)) throw new Error(`${raw.name}: no predicted catalog`);
	return new Set(kinds.entries.map((entry) => entry.kind));
}

describe('bootstrapping an upstream grammar predicts a catalog with one key per parser symbol', () => {
	it('tree-sitter-c keeps the case of its keyword keys', async () => {
		const raw = await evaluateSittirGrammar(require.resolve('tree-sitter-c/grammar.js'), 'c');
		const keys = predictedKeys(raw);
		expect(keys.has('_alignof_keyword')).toBe(true);
		expect(keys.has('_Alignof_keyword')).toBe(true);
	}, 120_000);

	it('tree-sitter-c keeps the literal letters of its punctuation keys, so quote prefixes differing only by case stay apart', async () => {
		const raw = await evaluateSittirGrammar(require.resolve('tree-sitter-c/grammar.js'), 'c');
		const keys = predictedKeys(raw);
		for (const key of ['u_squote', 'U_squote', 'L_squote', 'u_dquote', 'U_dquote', 'L_dquote']) expect(keys.has(key)).toBe(true);
		const kinds = raw.predictedKinds;
		expect(kinds !== undefined && 'keyCollisions' in kinds ? kinds.keyCollisions : []).toEqual([]);
	}, 120_000);

	it('keywords that differ only by case keep distinct derived names, the collapsed type name renamed as a naming event', async () => {
		const raw = await evaluateSittirGrammar(resolve(__dirname, '../../__tests__/fixtures/keyword-case-grammar.js'), 'keyword_case');
		const { nodeMap } = collectGrammarDiagnosticsForGrammar({ rawGrammar: raw });
		const names = ['_alignof_keyword', '_Alignof_keyword'].map((kind) => {
			const node = nodeMap.nodes.get(kind)!;
			return { typeName: node.typeName, irKey: node.irKey, rustConst: toScreamingSnakeCase(node.typeName, kind) };
		});
		expect(names).toEqual([
			{ typeName: 'AlignofKeyword2', irKey: 'alignofKeyword2', rustConst: '_ALIGNOF_KEYWORD2' },
			{ typeName: 'AlignofKeyword', irKey: 'alignofKeyword', rustConst: '_ALIGNOF_KEYWORD' }
		]);
		expect(nodeMap.namingEvents).toEqual([expect.objectContaining({ kind: '_alignof_keyword', from: 'AlignofKeyword', to: 'AlignofKeyword2' })]);
	}, 120_000);

	it('tree-sitter-go gives the anonymous side of a punctuation/named collision the punctuation suffix', async () => {
		const raw = await evaluateSittirGrammar(require.resolve('tree-sitter-go/grammar.js'), 'go');
		const keys = predictedKeys(raw);
		expect(keys.has('dot')).toBe(true);
		expect(keys.has('dot_punctuation')).toBe(true);
	}, 120_000);
});
