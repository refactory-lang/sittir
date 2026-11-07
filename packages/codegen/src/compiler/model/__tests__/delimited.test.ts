import { describe, expect, it } from 'vitest';
import { grammarPackage } from '../../../grammars.ts';
import { compileGrammar } from '../../compile.ts';
import { ruleListParts } from '../../../dsl/rule-patterns.ts';
import { recordUnguardedDelimiters } from '../../assemble.ts';
import { fromAssembleWarning } from '../../diagnostics/grammar-diagnostics.ts';
import { contentLeavesOf, delimitedLeafVerdicts } from '../delimited.ts';
import { AbstractAssembledCompound, AssembledLeaf, AssembledLexedPattern, AssembleDiagnosticsCollector } from '../node-map.ts';
import { stampDelimiterFacets } from '../delimiter-facets.ts';
import { FactoryEmitter } from '../../../emitters/factories.ts';
import { emitReadyModel } from '../../../__tests__/helpers/emit-ready-model.ts';

const COMPILE_TIMEOUT = 120_000;

async function delimitedKinds(grammar: string) {
	const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar) });
	return new Map(
		[...nodeMap.nodes].flatMap(([kind, node]) => (node instanceof AbstractAssembledCompound && node.delimited !== undefined ? [[kind, node.delimited] as const] : []))
	);
}

const holds = (ranges: readonly (readonly [number, number])[], char: string) => ranges.some(([lo, hi]) => lo <= char.codePointAt(0)! && char.codePointAt(0)! <= hi);

describe('the delimited fact', () => {
	it('stamps the composites whose free text can hold their own fixed closing delimiter', async () => {
		expect([...(await delimitedKinds('python')).keys()]).toEqual([]);
		expect([...(await delimitedKinds('rust')).keys()]).toEqual(['block_comment']);
		expect([...(await delimitedKinds('typescript')).keys()]).toEqual(['comment_block']);
	}, COMPILE_TIMEOUT);

	it('excludes the closing delimiter and leaves its last character alone', async () => {
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
		const { nodeMap, generatedIdTables } = await compileGrammar({ package: grammarPackage('rust') });
		expect(() => new FactoryEmitter({ grammar: 'rust', nodeMap, generatedIdTables, triviaKinds: [] })).toThrow(/^reparse-host-missing: block_comment: its delimiters need a parse-back host/);
	}, COMPILE_TIMEOUT);
});

describe('the derived delimiters of a composite', () => {
	it('stamps a string and a raw string with the delimiter facts their content derives, and not as delimited', async () => {
		const facetsOf = async (grammar: string, kind: string) => {
			const node = (await emitReadyModel(grammar)).nodeMap.nodes.get(kind);
			return node instanceof AbstractAssembledCompound ? { delimited: node.delimited, facets: node.delimiterFacets } : undefined;
		};
		expect(await facetsOf('python', 'string')).toEqual({
			delimited: undefined,
			facets: {
				open: 'string_start',
				close: 'string_end',
				arms: [
					{ text: '"', singleLine: true },
					{ text: "'", singleLine: true },
					{ text: '"""', singleLine: false },
					{ text: "'''", singleLine: false }
				],
				closeLead: '',
				escape: '\\'
			}
		});
		expect(await facetsOf('rust', 'raw_string_literal')).toEqual({
			delimited: undefined,
			facets: { open: 'raw_string_literal_start', close: 'raw_string_literal_end', arms: [], run: '#', closeLead: '"' }
		});
	}, COMPILE_TIMEOUT);
});

describe('the free text of a composite with derived delimiters', () => {
	it('stamps the leaves that can hold another arm\'s opener and the characters they refuse', async () => {
		const python = (await emitReadyModel('python')).nodeMap.nodes;
		const string = python.get('string');
		const freeText = string instanceof AbstractAssembledCompound ? string.freeText : undefined;
		expect(freeText).toMatchObject({ leaves: ['string_fragment'], excluded: [[123, 123], [125, 125]], gate: { token: 'string_start', facet: 'prefix' } });
		const anyCase = (members: readonly string[]) => members.flatMap((member) => [...member].reduce<string[]>((spellings, char) => spellings.flatMap((s) => [s + char.toLowerCase(), s + char.toUpperCase()]), ['']));
		const eitherOrder = (member: string) => (member.length === 2 ? [member, [...member].reverse().join('')] : [member]);
		expect([...freeText!.gate!.spellings].sort()).toEqual(anyCase(['f', 't', 'rf', 'rt'].flatMap(eitherOrder)).sort());
		expect((python.get('string_fragment') as AssembledLeaf).freeText).toBe(true);
		expect((python.get('escape_interpolation') as AssembledLeaf).freeText).toBeUndefined();
		const raw = (await emitReadyModel('rust')).nodeMap.nodes.get('raw_string_literal');
		expect(raw instanceof AbstractAssembledCompound ? raw.freeText : 'not a compound').toBeUndefined();
	}, COMPILE_TIMEOUT);
});

describe('the content a closer holds', () => {
	it('stamps a closer\'s content facet with the one content leaf whose pattern holds every text the facet can', async () => {
		const python = (await emitReadyModel('python')).nodeMap.nodes;
		const end = python.get('string_end');
		if (!(end instanceof AssembledLexedPattern)) throw new Error('string_end is not a lexed pattern');
		expect(Object.fromEntries(end.slots.map((slot) => [slot.name, slot.contentLeaf]))).toEqual({ content: 'string_fragment', quote: undefined });
		const string = python.get('string');
		if (!(string instanceof AbstractAssembledCompound)) throw new Error('string is not a compound');
		expect(contentLeavesOf(string, python, '\\{\\{')).toEqual(['escape_interpolation', 'string_fragment']);
	}, COMPILE_TIMEOUT);
});

describe('the facets of a delimiter token', () => {
	const rolesOf = (nodes: ReadonlyMap<string, unknown>, kind: string) => {
		const token = nodes.get(kind);
		if (!(token instanceof AssembledLexedPattern)) throw new Error(`${kind} is not a lexed pattern`);
		return { delimiterOf: token.delimiterOf, roles: Object.fromEntries(token.slots.map((slot) => [slot.name, slot.delimiterRole])) };
	};

	it('stamps each facet as an input, a preference, a run, its mirror or content', async () => {
		const python = (await emitReadyModel('python')).nodeMap.nodes;
		expect(rolesOf(python, 'string_start')).toEqual({ delimiterOf: 'string', roles: { prefix: 'input', quote: 'preferred' } });
		expect(rolesOf(python, 'string_end')).toEqual({ delimiterOf: 'string', roles: { content: 'content', quote: 'mirror' } });
		const rust = (await emitReadyModel('rust')).nodeMap.nodes;
		expect(rolesOf(rust, 'raw_string_literal_start')).toEqual({ delimiterOf: 'raw_string_literal', roles: { prefix: 'input', hashes: 'run' } });
		expect(rolesOf(rust, 'raw_string_literal_end')).toEqual({ delimiterOf: 'raw_string_literal', roles: { hashes: 'mirror' } });
	}, COMPILE_TIMEOUT);

	it('fails generation, naming the composite, the token and the facet, when a facet is neither an input nor derivable', async () => {
		const { nodeMap } = await emitReadyModel('python');
		const start = nodeMap.nodes.get('string_start');
		if (!(start instanceof AssembledLexedPattern)) throw new Error('string_start is not a lexed pattern');
		const quote = start.slots.find((slot) => slot.name === 'quote')!;
		(quote as { registeredOption?: unknown }).registeredOption = undefined;
		expect(() => stampDelimiterFacets(nodeMap)).toThrow("delimiters: 'string' is delimited by 'string_end', whose facet 'quote' is neither an input nor derivable");
	}, COMPILE_TIMEOUT);
});

describe('the verdict of a skipped delimited composite', () => {
	it('judges a regular token safe and the same leaf as an external unguarded', async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage('rust') });
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
		const { nodeMap } = await compileGrammar({ package: grammarPackage('rust') });
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
