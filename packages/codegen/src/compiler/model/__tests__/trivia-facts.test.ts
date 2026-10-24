import { beforeAll, describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compile.ts';
import { loadGeneratedIdTables } from '../../generated-metadata.ts';
import { grammarPackage } from '../../../grammars.ts';
import { AbstractAssembledCompound } from '../node-map.ts';
import { defaultTriviaForm, lexicalExtrasRun, lineBreakTerminated, lineTerminated, stampedTriviaKinds, stampedTriviaOptions, triviaKinds, whitespaceTrivia, whitespaceTriviaKinds } from '../trivia.ts';
import type { SitePreference } from '../site-preferences.ts';
import { assertWhitespaceAdmitted } from '../../assemble.ts';
import { collectGrammarDiagnosticsForGrammar } from '../../diagnostics/grammar-diagnostics.ts';
import { evaluateTempGrammar } from '../../../__tests__/helpers/temp-grammar.ts';
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
	it('reads the trivia kinds from the grammar extras and the always-admitted tight member, through supertypes both ways', async () => {
		expect([...triviaKinds(await nodeMapOf('rust'))].sort()).toEqual([
			'_blankline',
			'_dedent',
			'_double_blankline',
			'_indent',
			'_layout',
			'_newline',
			'_space',
			'_tab',
			'_tight',
			'block_comment',
			'comment',
			'line_comment'
		]);
		expect([...triviaKinds(await nodeMapOf('python'))].sort()).toEqual([
			'_blankline',
			'_dedent',
			'_double_blankline',
			'_indent',
			'_layout',
			'_newline',
			'_space',
			'_tab',
			'_tight',
			'comment',
			'line_continuation',
			'line_continuation_newline',
			'line_continuation_nul'
		]);
		expect([...triviaKinds(await nodeMapOf('typescript'))].sort()).toEqual([
			'_blankline',
			'_dedent',
			'_double_blankline',
			'_indent',
			'_layout',
			'_newline',
			'_space',
			'_tab',
			'_tight',
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

	it('makes a whitespace kind trivia when its literal is one or more lexical extras, or it is always admitted (tight)', async () => {
		expect(whitespaceTriviaKinds(await nodeMapOf('rust')).sort()).toEqual(['_blankline', '_double_blankline', '_newline', '_space', '_tab', '_tight']);
		expect(whitespaceTriviaKinds(await nodeMapOf('python')).sort()).toEqual([
			'_blankline',
			'_double_blankline',
			'_newline',
			'_space',
			'_tab',
			'_tight'
		]);
		const typescript = await nodeMapOf('typescript');
		expect(whitespaceTriviaKinds(typescript)).toContain('_tight');
		expect(whitespaceTriviaKinds(typescript)).not.toContain('_indent');
		expect(Object.fromEntries(whitespaceTrivia(typescript)?.kindIdByText ?? [])).toEqual({
			'': typescript.nodes.get('_tight')?.kindId,
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

	it('derives inner gaps from optional and repeat slots between the tokens, in render order, each with the slots inside it', async () => {
		const rust = await nodeMapOf('rust');
		expect(innerGapsOf(rust, 'block')).toEqual([{ key: 'statements', precedingTokens: 1, slots: ['_statements', '_trailing_expression'] }]);
		expect(innerGapsOf(rust, 'arguments')).toEqual([{ key: 'elements', precedingTokens: 1, slots: ['_elements'] }]);
		expect(innerGapsOf(rust, 'function_item')).toEqual([]);
		expect(innerGapsOf(rust, 'source_file')).toEqual([{ key: 'statements', precedingTokens: 0, slots: ['_shebang', '_statements'] }]);
		expect(innerGapsOf(await nodeMapOf('typescript'), 'program')).toEqual([{ key: 'statements', precedingTokens: 0, slots: ['_hash_bang_line', '_statements'] }]);
	});

	it('gives no inner gap where tree-sitter cannot lex an extra, or where the node cannot be empty', async () => {
		const rust = await nodeMapOf('rust');
		expect(innerGapsOf(rust, 'block_comment')).toEqual([]);
		expect(innerGapsOf(rust, '_let_chain')).toEqual([]);
		const scm = await nodeMapOf('scm');
		expect(innerGapsOf(scm, 'string')).toEqual([]);
		expect(innerGapsOf(scm, 'named_node_plain')).toEqual([]);
		expect(innerGapsOf(scm, 'named_node_supertyped')).toEqual([]);
		expect(innerGapsOf(scm, 'missing_node')).toEqual([{ key: 'name', precedingTokens: 2, slots: ['_name'] }]);
		expect(innerGapsOf(await nodeMapOf('python'), 'comprehension_clauses')).toEqual([]);
	});

	it('counts a zero-width kind between the slots as a token, as it did when the grammar hid it', async () => {
		const python = await nodeMapOf('python');
		expect(innerGapsOf(python, 'match_block_block')).toEqual([{ key: 'alternative', precedingTokens: 1, slots: ['_alternative'] }]);
		expect(innerGapsOf(python, 'block')).toEqual([]);
		expect(innerGapsOf(python, 'suite_block')).toEqual([]);
	});

	it('gives a tokenless kind a gap only when it is the grammar root, keying its repeat slot', async () => {
		expect(innerGapsOf(await nodeMapOf('typescript'), 'enum_body_elements')).toEqual([]);
		expect(innerGapsOf(await nodeMapOf('scm'), 'program')).toEqual([{ key: 'definitions', precedingTokens: 0, slots: ['_definitions'] }]);
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

	it('ends a line at the dedent that closes an indentation level, as at the newline token', async () => {
		const python = await nodeMapOf('python');
		expect(lineBreakTerminated(python, '_dedent')).toBe(true);
		expect(lineBreakTerminated(python, 'block')).toBe(true);
		expect(lineBreakTerminated(python, '_indent')).toBe(false);
	});

	it('stamps the comment kinds a record can be built of: every trivia kind but layout and supertypes', async () => {
		expect(stampedTriviaKinds(await nodeMapOf('rust'))).toEqual(['block_comment', 'line_comment']);
		expect(stampedTriviaKinds(await nodeMapOf('python'))).toEqual(['comment']);
		expect(stampedTriviaKinds(await nodeMapOf('typescript'))).toEqual(['comment_block', 'comment_line', 'html_comment']);
		expect(stampedTriviaKinds(await nodeMapOf('scm'))).toEqual(['comment']);
	});

	it("names an option site inside a stamped comment kind, the kinds it holds included, but never the kind's own edges", async () => {
		const site = (kind: string, kindEdge?: true): SitePreference => ({
			kind,
			slot: 'probe',
			address: `${kind}_probe`,
			label: 'probe',
			arms: [],
			defaultArm: '',
			source: 'spacing',
			...(kindEdge === undefined ? {} : { kindEdge })
		});
		const sites = [site('block_comment', true), site('block_comment_doc_inner'), site('line_comment'), site('function_item')];
		expect(stampedTriviaOptions(await nodeMapOf('rust'), sites).map(({ kind, site }) => `${kind} holds ${site.kind}`)).toEqual([
			'block_comment holds block_comment_doc_inner',
			'line_comment holds line_comment'
		]);
	});
});
