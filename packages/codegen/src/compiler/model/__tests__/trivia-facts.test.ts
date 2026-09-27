import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compile.ts';
import { loadGeneratedIdTables } from '../../generated-metadata.ts';
import { AbstractAssembledCompound } from '../node-map.ts';
import { defaultTriviaForm, lineTerminated, triviaKinds } from '../trivia.ts';
import type { NodeMap } from '../../types.ts';

async function nodeMapOf(grammar: string): Promise<NodeMap> {
	return (await compileGrammar({ grammar, generatedIdTables: await loadGeneratedIdTables(grammar) })).nodeMap;
}

function innerGapsOf(nodeMap: NodeMap, kind: string): unknown {
	const node = nodeMap.nodes.get(kind);
	return node instanceof AbstractAssembledCompound ? node.innerGaps : undefined;
}

describe('trivia model facts', () => {
	it('reads the trivia kinds from the grammar extras, through supertypes both ways', async () => {
		expect([...triviaKinds(await nodeMapOf('rust'))].sort()).toEqual(['block_comment', 'comment', 'line_comment']);
		expect([...triviaKinds(await nodeMapOf('python'))].sort()).toEqual([
			'comment',
			'line_continuation',
			'line_continuation_newline',
			'line_continuation_nul'
		]);
		expect([...triviaKinds(await nodeMapOf('typescript'))].sort()).toEqual([
			'comment',
			'comment_block',
			'comment_line',
			'html_comment'
		]);
	});

	it('marks a token line-terminated only when every arm ends in an open pattern that cannot cross a line', async () => {
		const rust = await nodeMapOf('rust');
		expect(lineTerminated(rust, 'line_comment')).toBe(true);
		expect(lineTerminated(rust, 'block_comment')).toBe(false);
		const python = await nodeMapOf('python');
		expect(lineTerminated(python, 'comment')).toBe(true);
		expect(lineTerminated(python, 'line_continuation_newline')).toBe(false);
		expect(lineTerminated(python, 'line_continuation_nul')).toBe(false);
		const typescript = await nodeMapOf('typescript');
		expect(lineTerminated(typescript, 'comment_line')).toBe(true);
		expect(lineTerminated(typescript, 'html_comment')).toBe(false);
	});

	it('derives inner gaps from optional and repeat slots between the tokens, in render order', async () => {
		const rust = await nodeMapOf('rust');
		expect(innerGapsOf(rust, 'block')).toEqual([{ key: 'statements', precedingTokens: 1 }]);
		expect(innerGapsOf(rust, 'arguments')).toEqual([{ key: 'arguments_elements', precedingTokens: 1 }]);
		expect(innerGapsOf(rust, 'function_item')).toEqual([]);
		expect(innerGapsOf(rust, 'source_file')).toEqual([{ key: 'statements', precedingTokens: 0 }]);
		expect(innerGapsOf(await nodeMapOf('typescript'), 'program')).toEqual([{ key: 'statements', precedingTokens: 0 }]);
	});

	it("takes the loose trivia form from ir.comment's default arm: its kind, literal delimiters, coercer and sibling leads", async () => {
		const rust = defaultTriviaForm(await nodeMapOf('rust'));
		expect({ ...rust, siblings: rust?.siblings.map((sibling) => [String(sibling.lead), sibling.builder]) }).toEqual({
			kind: 'line_comment',
			open: '//',
			close: '',
			coercer: 'coerceToLineComment',
			siblings: [
				['/^(?:(?:\\/\\/))/u', 'ir.lineCommentExtraSlashes'],
				['/^(?:\\/)/u', 'ir.lineCommentDocOuter'],
				['/^(?:!)/u', 'ir.lineCommentDocInner']
			]
		});
		expect(defaultTriviaForm(await nodeMapOf('python'))).toEqual({ kind: 'comment', open: '#', close: '', coercer: 'coerceToComment', siblings: [] });
		expect(defaultTriviaForm(await nodeMapOf('typescript'))).toEqual({
			kind: 'comment_line',
			open: '//',
			close: '',
			coercer: 'coerceToCommentLine',
			siblings: []
		});
	});

	it('reads how a kind starts through the same edge walk as how it ends', async () => {
		const rust = await nodeMapOf('rust');
		expect(rust.nodes.get('line_comment_doc_inner')?.leadingTerminals).toEqual([{ literal: '!' }]);
		expect(rust.nodes.get('line_comment_extra_slashes')?.leadingTerminals).toEqual([{ pattern: '\\/\\/' }]);
	});
});
