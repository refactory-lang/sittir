import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../__tests__/_sittir-grammar.ts';
import { collectGrammarDiagnosticsForGrammar } from '../../diagnostics/grammar-diagnostics.ts';
import { compileGrammar } from '../../compile.ts';
import { loadGeneratedIdTables } from '../../generated-metadata.ts';
import { grammarPackage } from '../../../grammars.ts';
import { AbstractAssembledCompound } from '../node-map.ts';
import type { NodeMap } from '../../types.ts';

const require = createRequire(import.meta.url);

async function nodeMapOf(grammar: string): Promise<NodeMap> {
	return (await compileGrammar({ package: grammarPackage(grammar), generatedIdTables: await loadGeneratedIdTables(grammar) })).nodeMap;
}

function fullFormOf(nodeMap: NodeMap, kind: string): unknown {
	const node = nodeMap.nodes.get(kind);
	return node instanceof AbstractAssembledCompound ? node.fullForm : undefined;
}

describe('full form stamp', () => {
	it('takes the literal runs around one text content: a pattern, a pattern leaf, or text arms of the polymorph', async () => {
		const rust = await nodeMapOf('rust');
		expect(fullFormOf(rust, 'escape_sequence_hex')).toEqual({ open: { texts: ['\\'] }, close: { texts: [''] } });
		expect(fullFormOf(rust, 'lifetime')).toEqual({ open: { texts: ["'"] }, close: { texts: [''] } });
		expect(fullFormOf(rust, 'line_comment')).toEqual({ open: { texts: ['//'] }, close: { texts: [''] } });
		expect(fullFormOf(rust, 'block_comment')).toEqual({ open: { texts: ['/*'] }, close: { texts: ['*/'] } });
	});

	it('records a spelling choice as alternatives of its slot', async () => {
		expect(fullFormOf(await nodeMapOf('python'), 'integer_hex')).toEqual({
			open: { texts: ['0x', '0X'], slot: 'prefix' },
			close: { texts: [''] }
		});
	});

	it('stamps nothing around node content, around an optional delimiter, or across a word seam', async () => {
		const rust = await nodeMapOf('rust');
		expect(fullFormOf(rust, 'bracketed_type')).toBeUndefined();
		expect(fullFormOf(rust, 'char_literal_escaped')).toBeUndefined();
		expect(fullFormOf(rust, 'field_pattern_shorthand')).toBeUndefined();
		expect(fullFormOf(await nodeMapOf('python'), 'global_statement')).toBeUndefined();
		const typescript = await nodeMapOf('typescript');
		expect(fullFormOf(typescript, 'namespace_import')).toBeUndefined();
		expect(fullFormOf(typescript, 'number_bigint')).toBeUndefined();
		for (const arm of ['number_bigint_decimal', 'number_bigint_hex', 'number_bigint_binary', 'number_bigint_octal']) {
			expect(fullFormOf(typescript, arm)).toEqual({ open: { texts: [''] }, close: { texts: ['n'] } });
		}
	});

	it('takes the literal runs around an enum that is the whole content', async () => {
		const raw = await evaluateSittirGrammar(require.resolve('tree-sitter-go/grammar.js'), 'go');
		const { nodeMap } = collectGrammarDiagnosticsForGrammar({ rawGrammar: raw });
		expect(fullFormOf(nodeMap, 'rune_literal_arm2_arm5')).toEqual({ open: { texts: ["'\\"] }, close: { texts: ["'"] } });
		const content = nodeMap.nodes.get('rune_literal_arm2_arm5')?.slots.find((slot) => slot.name === 'content');
		expect(content?.values.map((value) => ('value' in value ? [value.value, value.resolvedKind] : undefined))).toEqual(
			['a', 'b', 'f', 'n', 'r', 't', 'v', '\\', "'", '"'].map((text) => [text, undefined])
		);
	}, 120_000);
});

