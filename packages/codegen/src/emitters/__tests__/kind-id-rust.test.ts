import { describe, expect, it } from 'vitest';
import { emitKindIdRust, relaxedKeywordIds } from '../kind-id-rust.ts';
import { collectKindEntries } from '../kind-discriminant.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import type { GrammarName } from '../../grammars.ts';
import { evaluatePackage } from '../../dsl/evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';

async function emittedKindIds(grammar: GrammarName) {
	const raw = await evaluatePackage(grammarPackage(grammar));
	const generatedIdTables = await loadGeneratedIdTables(grammar);
	if (generatedIdTables === undefined) throw new Error(`no generated id tables for ${grammar}`);
	const linked = link(raw, { generatedIdTables });
	const nodeMap = assemble(
		AssembleCtx.from({ ...normalizeGrammar(linked), generatedIdTables: generatedIdTables })
	);
	const entries = collectKindEntries(nodeMap, generatedIdTables);
	const idOf = (kind: string): number => {
		const id = entries.find((entry) => entry.kind === kind)?.id;
		if (id === undefined) throw new Error(`no kind entry for ${kind}`);
		return id;
	};
	return { source: emitKindIdRust({ grammar, nodeMap, generatedIdTables }), idOf, nodeMap };
}

describe('facts the wrap layer owns', () => {
	it(
		'resolves relaxed literals by catalog precedence regardless of row order',
		async () => {
			const { nodeMap } = await emittedKindIds('python');
			expect(nodeMap.relaxedLiterals).toContain('async');
			const anonymous = { kind: 'async', member: 'Async', id: 22, literalText: 'async', anon: true };
			const literal = {
				kind: 'async_literal',
				member: 'AsyncLiteral',
				id: 11,
				literalText: 'async',
				literalRule: true
			};
			const terminal = { kind: 'async_token', member: 'AsyncToken', id: 5, literalText: 'async', terminal: true };
			const other = { kind: 'async_branch', member: 'AsyncBranch', id: 1, literalText: 'async' };
			for (const entries of [
				[literal, anonymous],
				[anonymous, literal],
				[other, terminal, literal, anonymous],
				[anonymous, literal, terminal, other]
			])
				expect(relaxedKeywordIds(nodeMap, entries)).toEqual([22]);
			expect(relaxedKeywordIds(nodeMap, [other, terminal, literal])).toEqual([11]);
			expect(relaxedKeywordIds(nodeMap, [literal, terminal, other])).toEqual([11]);
			expect(relaxedKeywordIds(nodeMap, [other, terminal])).toEqual([5]);
			expect(relaxedKeywordIds(nodeMap, [other])).toEqual([]);
			expect(relaxedKeywordIds(nodeMap, [])).toEqual([]);
		},
		FULL_PIPELINE_TIMEOUT
	);

	it('emits no slot-separator or anonymous-children table for the reader', async () => {
		for (const grammar of ['python', 'typescript', 'rust'] as const) {
			const { source } = await emittedKindIds(grammar);
			expect(source).not.toContain('SLOT_SEPARATORS');
			expect(source).not.toContain('is_slot_separator');
			expect(source).not.toContain('keeps_anonymous_children');
		}
	}, FULL_PIPELINE_TIMEOUT);
});
