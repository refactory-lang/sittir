import { stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { assemblePredicted, rawIdTablesOf, withFixtureLexicalRanks } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { computeNodeSCC } from '../../compiler/scc.ts';
import { resolveRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import { collectSitePreferences } from '../../compiler/model/site-preferences.ts';
import { collectKindEntries } from '../kind-discriminant.ts';
import { stampStaticSpacing } from '../templates.ts';
import { NO_JOINS } from '../../compiler/model/join-seams/index.ts';
import { emitAll, type EmitAllResult } from '../emit.ts';
import { probeDiagnostics, type TypeCheckDiagnostic } from '../../typecheck.ts';
import { REPO_ROOT } from '../../grammars.ts';

const tokens = [
	"semi: () => ';'",
	"comma: () => ','",
	"bang: () => '!'",
	'identifier: () => /[a-z]+/'
];

const oneLevel = {
	rules: [
		'source: ($) => repeat($.outer)',
		"outer: ($) => field('inner', $.inner)",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		...tokens
	],
	options: "options: { inner: { 'inner_comma:': preference('blank') } }"
};

const twoLevel = {
	rules: [
		'source: ($) => repeat($.outer)',
		"outer: ($) => seq(field('inner', $.inner), optional(field('outer_end', $.semi)))",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		...tokens
	],
	options: "options: { outer: { 'outer_end:': preference('blank') }, inner: { 'inner_comma:': preference('blank') } }"
};

const optionalTwoLevel = {
	rules: [
		'source: ($) => repeat($.outer)',
		"outer: ($) => seq(optional(field('inner', $.inner)), optional(field('outer_end', $.semi)), field('bar', $.pipe))",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		"pipe: () => '|'",
		...tokens
	],
	options: "options: { outer: { 'outer_end:': preference('blank') }, inner: { 'inner_comma:': preference('blank') } }"
};

const threeLevel = {
	rules: [
		'source: ($) => repeat($.outer)',
		"outer: ($) => seq(field('middle', $.middle), optional(field('outer_end', $.semi)))",
		"middle: ($) => seq(field('inner', $.inner), optional(field('middle_end', $.pipe)))",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		"pipe: () => '|'",
		...tokens
	],
	options:
		"options: { outer: { 'outer_end:': preference('blank') }, middle: { 'middle_end:': preference('blank') }, inner: { 'inner_comma:': preference('blank') } }"
};

const patternEnd = {
	rules: [
		'source: ($) => repeat($.outer)',
		"outer: ($) => field('inner', $.inner)",
		"inner: ($) => seq(field('base', $.identifier), optional(field('inner_comma', $.comma)))",
		...tokens
	],
	options: "options: { inner: { 'inner_comma:': preference('blank') } }"
};

const emptyInner = {
	rules: [
		'source: ($) => repeat($.outer)',
		"outer: ($) => field('inner', $.inner)",
		"inner: ($) => seq(optional(field('base', $.base)), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(optional(field('name', $.identifier)), optional(field('base_bang', $.bang)))",
		...tokens
	],
	options: "options: { inner: { 'inner_comma:': preference('blank') } }"
};

const transparentOverTwoLevel = {
	rules: [
		'source: ($) => repeat($.top)',
		"top: ($) => field('wrapped', $.outer)",
		"outer: ($) => seq(field('inner', $.inner), optional(field('outer_end', $.semi)))",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		...tokens
	],
	options: "options: { outer: { 'outer_end:': preference('blank') }, inner: { 'inner_comma:': preference('blank') } }"
};

const transparentChain = {
	rules: [
		'source: ($) => repeat($.top)',
		"top: ($) => field('wrapped', $.outer)",
		"outer: ($) => field('inner', $.inner)",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		...tokens
	],
	options: "options: { inner: { 'inner_comma:': preference('blank') } }"
};

async function emitted(grammar: { rules: readonly string[]; options: string }): Promise<{ factories: string; loose: string; pkg: EmitAllResult }> {
	const raw = await evaluateTempGrammar({ extras: '/\\s/', rules: grammar.rules.join(', ') }, grammar.options);
	const { nodeMap, generatedIdTables } = assemblePredicted(raw, withFixtureLexicalRanks(rawIdTablesOf(raw)));
	nodeMap.scc = computeNodeSCC(nodeMap);
	const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
	const rulesConfig = { nodeMap, kindEntries, options: raw.options, whitespaceText: whitespaceTextOf(raw.renderAs, nodeMap) };
	const renderRules = resolveRenderRules(rulesConfig, (spaced) => stampStaticSpacing(nodeMap, 'demo', spaced, kindEntries, NO_JOINS)).seamed;
	collectSitePreferences({ nodeMap, kindEntries, renderRules, options: raw.options });
	const pkg = emitAll({ grammar: 'demo', nodeMap, generatedIdTables, joins: NO_JOINS, options: raw.options, renderAs: raw.renderAs, triviaKinds: [] });
	return { factories: pkg.factories, loose: pkg.from, pkg };
}

const flatSpecifiers = (text: string): string => text.replace(/from '(?:\.\.?\/)+([^']+)\.js'/g, "from './$1.ts'");

async function typeProbe(pkg: EmitAllResult, probe: string): Promise<TypeCheckDiagnostic[]> {
	return probeDiagnostics(
		{
			extends: join(REPO_ROOT, 'tsconfig.json'),
			sources: {
				'types.ts': flatSpecifiers(pkg.types),
				'types-internal.ts': flatSpecifiers(pkg.typesInternal),
				'kinds.ts': flatSpecifiers(pkg.kinds ?? ''),
				'is.ts': flatSpecifiers(pkg.is),
				'factories.ts': flatSpecifiers(pkg.factories),
				'probe.ts': probe
			}
		},
		REPO_ROOT
	);
}

function emittedFunction(text: string, name: string): string {
	const start = text.indexOf(`export function ${name}(`);
	if (start < 0) throw new Error(`no ${name} in the emitted output`);
	const end = text.indexOf('\n}\n', start) + 2;
	return stripTypeScriptTypes(text.slice(start, end)).replace(/^export /m, '');
}

type Recorded = { readonly builder: string; readonly args: readonly unknown[] };

describe('an option chain is refused by name when an option bag is two or more hops away, or a second bag sits on the chain', () => {
	it('refuses two option bags on a forwarder that owns options (two-level)', async () => {
		await expect(emitted(twoLevel)).rejects.toMatchObject({
			blocking: [expect.objectContaining({ code: 'option-chain-depth', ownerKind: 'outer' })]
		});
	});

	it('refuses an optional input on a two-level chain as the same rule', async () => {
		await expect(emitted(optionalTwoLevel)).rejects.toMatchObject({
			blocking: [expect.objectContaining({ code: 'option-chain-depth', ownerKind: 'outer' })]
		});
	});

	it('refuses three option bags on a forwarding chain (three-level), on the owning node', async () => {
		await expect(emitted(threeLevel)).rejects.toMatchObject({
			blocking: expect.arrayContaining([expect.objectContaining({ code: 'option-chain-depth', ownerKind: 'outer' })])
		});
	});

	it('refuses a transparent wrapper over a two-level chain, on the node that owns the second bag', async () => {
		await expect(emitted(transparentOverTwoLevel)).rejects.toMatchObject({
			blocking: [expect.objectContaining({ code: 'option-chain-depth', ownerKind: 'outer' })]
		});
	});

	it('refuses an option bag that forwards into a pattern (pattern-ending), on the forwarder', async () => {
		await expect(emitted(patternEnd)).rejects.toMatchObject({
			blocking: [expect.objectContaining({ code: 'option-chain-depth', ownerKind: 'outer' })]
		});
	});

	it('refuses a transparent wrapper whose option bag sits two hops below it, on the wrapper', async () => {
		await expect(emitted(transparentChain)).rejects.toMatchObject({
			blocking: [expect.objectContaining({ code: 'option-chain-depth', ownerKind: 'top' })]
		});
	});
});

describe('a forwarder whose option bag is one hop away is supported', () => {
	let factories: string;
	let pkg: EmitAllResult;

	beforeAll(async () => {
		({ factories, pkg } = await emitted(oneLevel));
	});

	it('emits, and the declared calls type-check', async () => {
		expect(factories.length).toBeGreaterThan(0);
		const diagnostics = await typeProbe(
			pkg,
			[
				"import { buildBase, buildComma, buildIdentifier, buildInner, buildOuter } from './factories.ts';",
				'const config = { name: buildIdentifier("x") };',
				'const innerOpts = { innerComma: buildComma };',
				'const builtInner = buildInner(buildBase(config));',
				'export const withOptions = buildOuter(config, innerOpts);',
				'export const alone = buildOuter(builtInner);',
				"// @ts-expect-error a built inner takes no options through its forwarder",
				'export const builtWithOptions = buildOuter(builtInner, innerOpts);'
			].join('\n')
		);
		expect(diagnostics.map((d) => d.head)).toEqual([]);
	}, 300_000);

	it('runs: a config with the inner bag reaches the inner builder; a built inner given options throws', () => {
		const recorded: Recorded[] = [];
		const stub = (builder: string) => (...args: unknown[]) => {
			recorded.push({ builder, args });
			return { $type: builder, args };
		};
		const source = `${emittedFunction(factories, 'buildOuter')}\nreturn buildOuter;`;
		const kinds = new Proxy({}, { get: (_target, key) => String(key) });
		const buildOuter = new Function('_buildOuter', 'buildInner', 'TSKindId', source)(stub('_buildOuter'), stub('buildInner'), kinds) as (...args: unknown[]) => unknown;
		buildOuter({ name: 'x' }, { innerComma: ',' });
		expect(recorded.map((r) => r.builder)).toEqual(['buildInner', '_buildOuter']);
		expect(recorded[0]!.args[1]).toEqual({ innerComma: ',' });
		expect(() => buildOuter({ $type: 'Inner' }, { innerComma: ',' })).toThrow('carries its own options');
	});
});

describe('an omitted outer input still forwards the inner options, in both storage emitters', () => {
	it('passes the inner options to the outer builder when the inner target takes no arguments', async () => {
		const { pkg } = await emitted(emptyInner);
		for (const text of [pkg.factories, pkg.factoriesRecords]) {
			const recorded: Recorded[] = [];
			const stub = (builder: string) => (...args: unknown[]) => {
				recorded.push({ builder, args });
				return { $type: builder, args };
			};
			const source = `${emittedFunction(text, 'buildOuter')}\nreturn buildOuter;`;
			const kinds = new Proxy({}, { get: (_target, key) => String(key) });
			const buildOuter = new Function('_buildOuter', 'buildInner', 'TSKindId', source)(stub('_buildOuter'), stub('buildInner'), kinds) as (...args: unknown[]) => unknown;
			buildOuter(undefined, { innerComma: ',' });
			expect(recorded.map((r) => r.builder)).toEqual(['buildInner', '_buildOuter']);
			expect(recorded[0]!.args).toEqual([{ innerComma: ',' }]);
		}
	});
});

describe('the generated package of the two-level fixture is refused; the generated package of a supported chain compiles', () => {
	it('compiles: every emitted module of a one-level chain type-checks with no diagnostics', async () => {
		const { pkg } = await emitted(oneLevel);
		const diagnostics = await typeProbe(pkg, 'export {};');
		expect(diagnostics.map((d) => d.head)).toEqual([]);
	}, 300_000);
});
