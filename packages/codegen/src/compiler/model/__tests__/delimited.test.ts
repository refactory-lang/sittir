import { describe, expect, it } from 'vitest';
import { grammarPackage } from '../../../grammars.ts';
import { compileGrammar } from '../../compile.ts';
import { loadGeneratedIdTables } from '../../generated-metadata.ts';
import { ruleListParts } from '../../../dsl/rule-patterns.ts';
import { recordUnguardedDelimiters } from '../../assemble.ts';
import { fromAssembleWarning } from '../../diagnostics/grammar-diagnostics.ts';
import { delimitedLeafVerdicts } from '../delimited.ts';
import { AbstractAssembledCompound, AssembleDiagnosticsCollector } from '../node-map.ts';
import { FactoryEmitter } from '../../../emitters/factories.ts';

const COMPILE_TIMEOUT = 120_000;

async function delimitedKinds(grammar: string) {
	const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables: await loadGeneratedIdTables(grammar) });
	return new Map(
		[...nodeMap.nodes].flatMap(([kind, node]) => (node instanceof AbstractAssembledCompound && node.delimited !== undefined ? [[kind, node.delimited] as const] : []))
	);
}

const holds = (ranges: readonly (readonly [number, number])[], char: string) => ranges.some(([lo, hi]) => lo <= char.codePointAt(0)! && char.codePointAt(0)! <= hi);

describe('the delimited fact', () => {
	it('stamps the composites whose free text can hold their own closing delimiter', async () => {
		expect([...(await delimitedKinds('python')).keys()]).toEqual(['string']);
		expect([...(await delimitedKinds('rust')).keys()].sort()).toEqual(['block_comment', 'raw_string_literal']);
		expect([...(await delimitedKinds('typescript')).keys()]).toEqual(['comment_block']);
	}, COMPILE_TIMEOUT);

	it('excludes the closing delimiter, the other arms leading characters and line terminators', async () => {
		const string = (await delimitedKinds('python')).get('string')!;
		expect(string.varying).toBe(true);
		for (const char of ['"', "'", '\\', '{', '}', '\n']) expect(holds(string.excluded, char)).toBe(true);
		expect(holds(string.excluded, 'a')).toBe(false);
		const block = (await delimitedKinds('rust')).get('block_comment')!;
		expect(block).toMatchObject({ varying: false, open: { text: '/*' }, close: { text: '*/' } });
		expect(holds(block.excluded, '*')).toBe(true);
		expect(holds(block.excluded, '/')).toBe(false);
	}, COMPILE_TIMEOUT);

	it('leaves a kind whose closing delimiter is a word alone', async () => {
		expect((await delimitedKinds('rust')).has('impl_item_negative_clause')).toBe(false);
		expect((await delimitedKinds('typescript')).has('namespace_import')).toBe(false);
	}, COMPILE_TIMEOUT);

	it('fails generation, naming the kind, when a non-trivia delimited kind has no host', async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage('python'), generatedIdTables: await loadGeneratedIdTables('python') });
		expect(() => new FactoryEmitter({ grammar: 'python', nodeMap, triviaKinds: ['comment'] })).toThrow(/^string: its delimiters need a parse-back host/);
	}, COMPILE_TIMEOUT);
});

describe('the verdict of a skipped delimited composite', () => {
	it('judges a regular token safe and the same leaf as an external unguarded', async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage('rust'), generatedIdTables: await loadGeneratedIdTables('rust') });
		const externals = new Set(ruleListParts(nodeMap.externals ?? []).names);
		const verdicts = (declared: ReadonlySet<string>) =>
			delimitedLeafVerdicts(nodeMap.nodes, nodeMap.wordMatcher, { word: nodeMap.word, reserved: nodeMap.reserved, externals: declared });
		const regular = verdicts(externals).filter((verdict) => verdict.safety === 'regular-token');
		expect(regular.length).toBeGreaterThan(0);
		const flipped = verdicts(new Set([...externals, ...regular.map((verdict) => verdict.leaf)]));
		for (const verdict of regular) {
			expect(flipped.find((other) => other.kind === verdict.kind && other.leaf === verdict.leaf)?.safety).toBe('unguarded');
		}
	}, COMPILE_TIMEOUT);

	it('records the blocking delimited-closer-unguarded for an external leaf and none for a regular one', async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage('rust'), generatedIdTables: await loadGeneratedIdTables('rust') });
		const declared = ruleListParts(nodeMap.externals ?? []).names;
		const grammar = (externals: readonly string[]) => ({
			word: nodeMap.word ?? null,
			reserved: nodeMap.reserved,
			wordMatcher: nodeMap.wordMatcher,
			externals: externals.map((name) => ({ type: 'SYMBOL' as const, name }))
		});
		const run = (externals: readonly string[]) => {
			const assembleDiagnostics = new AssembleDiagnosticsCollector();
			recordUnguardedDelimiters(nodeMap.nodes, { grammar: grammar(externals), assembleDiagnostics });
			return assembleDiagnostics.assembleWarnings.all;
		};
		expect(run(declared)).toEqual([]);
		const regular = delimitedLeafVerdicts(nodeMap.nodes, nodeMap.wordMatcher, {
			word: nodeMap.word,
			reserved: nodeMap.reserved,
			externals: new Set(declared)
		}).filter((verdict) => verdict.safety === 'regular-token');
		const warnings = run([...declared, ...regular.map((verdict) => verdict.leaf)]);
		expect(warnings.map((warning) => warning.code)).toEqual(warnings.map(() => 'delimited-closer-unguarded'));
		expect(warnings.map((warning) => warning.ownerKind).sort()).toEqual([...new Set(regular.map((verdict) => verdict.kind))].sort());
		for (const warning of warnings) expect(fromAssembleWarning('rust', warning)).toMatchObject({ canProceed: false, severity: 'error' });
	}, COMPILE_TIMEOUT);
});
