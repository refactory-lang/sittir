import { stripTypeScriptTypes } from 'node:module';
import { beforeAll, describe, expect, it } from 'vitest';
import { configFieldOr, spelledForm } from '@sittir/common/utils';
import { assemblePredicted, rawIdTablesOf, withFixtureLexicalRanks } from '../../__tests__/helpers/linked.ts';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { computeNodeSCC } from '../../compiler/scc.ts';
import { resolveRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import { collectSitePreferences } from '../../compiler/model/site-preferences.ts';
import { collectKindEntries } from '../kind-discriminant.ts';
import { stampStaticSpacing } from '../templates.ts';

const upstream = {
	extras: '/\\s/',
	rules: [
		'source: ($) => repeat(choice($.hex, $.long))',
		"hex: () => token(seq(choice('0x', '0X'), /[0-9a-f]+/))",
		"long: () => token(seq(/[0-9]+/, choice('L', 'l')))"
	].join(', ')
};

const config = [
	"edits: { hex: { '0/0': field('radix_prefix') }, long: { '0/1': field('suffix') } }",
	"options: { hex: { 'radix_prefix:': preference('0x') }, long: { 'suffix:': preference('L') } }"
].join(', ');

async function emittedFor(grammar: { extras: string; rules: string }, wired: string): Promise<string> {
	const raw = await evaluateTempGrammar(grammar, wired);
	const { nodeMap, generatedIdTables } = assemblePredicted(raw, withFixtureLexicalRanks(rawIdTablesOf(raw)));
	nodeMap.scc = computeNodeSCC(nodeMap);
	const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
	const rulesConfig = { nodeMap, kindEntries, options: raw.options, whitespaceText: whitespaceTextOf(raw.renderAs, nodeMap) };
	const renderRules = resolveRenderRules(rulesConfig, (spaced) => stampStaticSpacing(nodeMap, 'demo', spaced, kindEntries)).seamed;
	collectSitePreferences({ nodeMap, kindEntries, renderRules, options: raw.options });
	return emitFrom({ grammar: 'demo', nodeMap, generatedIdTables });
}

function coercerOf(emitted: string, fn: string): string {
	const start = emitted.indexOf(`export function ${fn}`);
	return emitted.slice(start, emitted.indexOf('\n}\n', start) + 2);
}

describe('a coercer whose kind spells a delimiter in its text', () => {
	let emitted: string;

	beforeAll(async () => {
		emitted = await emittedFor(upstream, config);
	});

	it('types an opening spelling from the alternative the text starts with', () => {
		const hex = coercerOf(emitted, 'coerceToHex');
		expect(hex).toContain('CoercedSpelling<I, O, "radixPrefix", "0x" | "0X", "0x">>');
		expect(hex).toContain('spelledForm(input, ["0x", "0X"] as const, [""] as const)');
		expect(hex).toContain('radixPrefix: options?.radixPrefix ?? _spelled.open');
	});

	it('types a closing spelling from the alternative the text ends with', () => {
		const long = coercerOf(emitted, 'coerceToLong');
		expect(long).toContain('CoercedSpelling<I, O, "suffix", "L" | "l", "L", "close">>');
		expect(long).toContain('spelledForm(input, [""] as const, ["L", "l"] as const)');
		expect(long).toContain('suffix: options?.suffix ?? _spelled.close');
	});
});

type Built = { readonly content: unknown; readonly options: unknown };

const PASSED = { passed: true };

function runLong(emitted: string): (input: unknown, options?: unknown) => Built | typeof PASSED {
	const source = stripTypeScriptTypes(coercerOf(emitted, 'coerceToLong').replace(/^export /gm, ''));
	const F = { buildLong: (content: unknown, options: unknown): Built => ({ content, options }) };
	return new Function('F', 'isNodeValue', 'spelledForm', 'configFieldOr', 'TSKindId', '_resolveOne', '_K0', `${source}\nreturn coerceToLong;`)(
		F,
		(value: unknown) => value === PASSED,
		spelledForm,
		configFieldOr,
		{ Long: 1 },
		(value: unknown) => value,
		0
	) as (input: unknown, options?: unknown) => Built | typeof PASSED;
}

describe('a coercer that reads a spelled closing delimiter', () => {
	it('builds the content before the spelling, with the spelling as its option, or the bare content with none', async () => {
		const coerce = runLong(await emittedFor(upstream, config));
		expect(coerce('10l')).toEqual({ content: '10', options: { suffix: 'l' } });
		expect(coerce('10L')).toEqual({ content: '10', options: { suffix: 'L' } });
		expect(coerce('10')).toEqual({ content: '10', options: undefined });
	});

	it('lets a given spelling option win over the text, and an absent one keep it', async () => {
		const coerce = runLong(await emittedFor(upstream, config));
		expect(coerce('7L', { suffix: 'l' })).toEqual({ content: '7', options: { suffix: 'l' } });
		expect(coerce('7l', { suffix: undefined })).toEqual({ content: '7', options: { suffix: 'l' } });
		expect(coerce('7l', { other: 1 })).toEqual({ content: '7', options: { other: 1, suffix: 'l' } });
	});

	it('returns a passed node as it is, whatever spelling the options give', async () => {
		const coerce = runLong(await emittedFor(upstream, config));
		expect(coerce(PASSED, { suffix: 'L' })).toBe(PASSED);
	});

	it('builds absent optional content from a text that is only the spelling', async () => {
		const optional = { extras: '/\\s/', rules: ["source: ($) => repeat($.long)", "long: () => token(seq(optional(/[0-9]+/), choice('L', 'l')))"].join(', ') };
		const coerce = runLong(
			await emittedFor(optional, "edits: { long: { '0/0': field('content'), '0/1': field('suffix') } }, options: { long: { 'suffix:': preference('L') } }")
		);
		expect(coerce('l')).toEqual({ content: undefined, options: { suffix: 'l' } });
		expect(coerce('L')).toEqual({ content: undefined, options: { suffix: 'L' } });
		expect(coerce('7L')).toEqual({ content: '7', options: { suffix: 'L' } });
	});
});

describe('a spelled delimiter its text cannot always tell', () => {
	const suffixed = (content: string, suffixes: readonly string[]) => ({
		extras: '/\\s/',
		rules: ['source: ($) => repeat($.long)', `long: () => token(seq(${content}, choice(${suffixes.map((text) => `'${text}'`).join(', ')})))`].join(', ')
	});
	const spelled = (preference: string) => `edits: { long: { '0/1': field('suffix') } }, options: { long: { 'suffix:': preference('${preference}') } }`;

	it('is refused when one spelling ends another', async () => {
		await expect(emittedFor(suffixed('/[0-9]+/', ['L', 'LL']), spelled('L'))).rejects.toThrow(/spelled-affix-undecided: 'long' spells 'suffix' as "L" \| "LL"/);
	});

	it('is refused when the content can end with a spelling', async () => {
		await expect(emittedFor(suffixed('/[0-9a-f]+/', ['F', 'f']), spelled('F'))).rejects.toThrow(/spelled-affix-undecided: 'long'/);
	});
});
