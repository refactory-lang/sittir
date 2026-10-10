import { beforeAll, describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compile.ts';
import { loadGeneratedIdTables } from '../../generated-metadata.ts';
import { grammarPackage } from '../../../grammars.ts';
import { AbstractAssembledCompound } from '../node-map.ts';
import { defaultTriviaForm, lexicalExtrasRun, lineTerminated, triviaKinds, whitespaceTrivia, whitespaceTriviaKinds } from '../trivia.ts';
import { assertWhitespaceAdmitted } from '../../assemble.ts';
import { collectGrammarDiagnosticsForGrammar } from '../../diagnostics/grammar-diagnostics.ts';
import { evaluateTempGrammar } from '../../__tests__/_temp-grammar.ts';
import type { NodeMap } from '../../types.ts';

const nodeMaps = new Map<string, Promise<NodeMap>>();

function nodeMapOf(grammar: string): Promise<NodeMap> {
	let nodeMap = nodeMaps.get(grammar);
	if (nodeMap === undefined) {
		nodeMap = loadGeneratedIdTables(grammar).then(
			async (generatedIdTables) => (await compileGrammar({ package: grammarPackage(grammar), generatedIdTables })).nodeMap
		);
		nodeMaps.set(grammar, nodeMap);
	}
	return nodeMap;
}

beforeAll(() => Promise.all(['rust', 'python', 'typescript', 'scm'].map(nodeMapOf)), 120_000);

function innerGapsOf(nodeMap: NodeMap, kind: string): unknown {
	const node = nodeMap.nodes.get(kind);
	return node instanceof AbstractAssembledCompound ? node.innerGaps : undefined;
}

describe('trivia model facts', () => {
	it('reads the trivia kinds from the grammar extras, through supertypes both ways', async () => {
		expect([...triviaKinds(await nodeMapOf('rust'))].sort()).toEqual([
			'_blankline',
			'_double_blankline',
			'_newline',
			'_space',
			'_tab',
			'block_comment',
			'comment',
			'line_comment'
		]);
		expect([...triviaKinds(await nodeMapOf('python'))].sort()).toEqual([
			'_blankline',
			'_double_blankline',
			'_newline',
			'_space',
			'_tab',
			'comment',
			'line_continuation',
			'line_continuation_newline',
			'line_continuation_nul'
		]);
		expect([...triviaKinds(await nodeMapOf('typescript'))].sort()).toEqual([
			'_blankline',
			'_double_blankline',
			'_newline',
			'_space',
			'_tab',
			'comment',
			'comment_block',
			'comment_line',
			'html_comment'
		]);
	});

	it('keeps the extras as the rule list the grammar declares', async () => {
		expect((await nodeMapOf('rust')).extras).toEqual([
			{ type: 'PATTERN', value: '\\s' },
			{ type: 'SYMBOL', name: 'line_comment' },
			{ type: 'SYMBOL', name: 'block_comment' }
		]);
	});

	it('makes a whitespace kind trivia exactly when its literal is one or more lexical extras', async () => {
		expect(whitespaceTriviaKinds(await nodeMapOf('rust')).sort()).toEqual(['_blankline', '_double_blankline', '_newline', '_space', '_tab']);
		expect(whitespaceTriviaKinds(await nodeMapOf('python')).sort()).toEqual([
			'_blankline',
			'_double_blankline',
			'_newline',
			'_space',
			'_tab'
		]);
		const typescript = await nodeMapOf('typescript');
		expect(whitespaceTriviaKinds(typescript)).not.toContain('_tight');
		expect(whitespaceTriviaKinds(typescript)).not.toContain('_indent');
		expect(Object.fromEntries(whitespaceTrivia(typescript)?.kindIdByText ?? [])).toEqual({
			' ': typescript.nodes.get('_space')?.kindId,
			'\t': typescript.nodes.get('_tab')?.kindId,
			'\n': typescript.nodes.get('_newline')?.kindId,
			'\n\n': typescript.nodes.get('_blankline')?.kindId,
			'\n\n\n': typescript.nodes.get('_double_blankline')?.kindId
		});
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
		expect(innerGapsOf(rust, 'arguments')).toEqual([{ key: 'elements', precedingTokens: 1 }]);
		expect(innerGapsOf(rust, 'function_item')).toEqual([]);
		expect(innerGapsOf(rust, 'source_file')).toEqual([{ key: 'statements', precedingTokens: 0 }]);
		expect(innerGapsOf(await nodeMapOf('typescript'), 'program')).toEqual([{ key: 'statements', precedingTokens: 0 }]);
	});

	it('gives no inner gap where tree-sitter cannot lex an extra, or where the node cannot be empty', async () => {
		const rust = await nodeMapOf('rust');
		expect(innerGapsOf(rust, 'block_comment')).toEqual([]);
		expect(innerGapsOf(rust, '_let_chain')).toEqual([]);
		const scm = await nodeMapOf('scm');
		expect(innerGapsOf(scm, 'string')).toEqual([]);
		expect(innerGapsOf(scm, 'named_node_plain')).toEqual([]);
		expect(innerGapsOf(scm, 'named_node_supertyped')).toEqual([]);
		expect(innerGapsOf(scm, 'missing_node')).toEqual([{ key: 'name', precedingTokens: 2 }]);
		expect(innerGapsOf(await nodeMapOf('python'), 'comprehension_clauses')).toEqual([]);
	});

	it('gives a tokenless kind a gap only when it is the grammar root, keying its repeat slot', async () => {
		expect(innerGapsOf(await nodeMapOf('typescript'), 'enum_body_elements')).toEqual([]);
		expect(innerGapsOf(await nodeMapOf('scm'), 'program')).toEqual([{ key: 'definitions', precedingTokens: 0 }]);
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
				['/^(?:\\/)/u', 'ir.lineComment.docOuter'],
				['/^(?:!)/u', 'ir.lineComment.docInner']
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
		expect(rust.nodes.get('line_comment_doc_inner')?.leadingTerminals).toEqual([{ symbol: 'inner_line_doc_comment_marker' }]);
		expect(rust.nodes.get('line_comment_extra_slashes')?.leadingTerminals).toEqual([{ pattern: '\\/\\/' }]);
	});

	it('reads a symbol whitespace extra through the rule it names', async () => {
		const raw = await evaluateTempGrammar({ extras: '$._ws', rules: "_ws: () => token(repeat1(/[ \\t]/))" }, '');
		const { nodeMap } = collectGrammarDiagnosticsForGrammar({ rawGrammar: raw });
		expect(lexicalExtrasRun(nodeMap)?.test(' \t ')).toBe(true);
		expect(whitespaceTriviaKinds(nodeMap)).toContain('_space');
	}, 60_000);

	it("fails when '_layout' lists a member the stamped extras run does not admit", async () => {
		const rust = await nodeMapOf('rust');
		expect(() => assertWhitespaceAdmitted(rust)).not.toThrow();
		expect(() => assertWhitespaceAdmitted({ ...rust, nodelessExtrasRun: /^(?:\t)+$/ })).toThrow(/lists '_space'/);
	});
});
