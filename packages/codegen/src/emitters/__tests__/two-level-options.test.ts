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

const twoLevel = {
	rules: [
		"source: ($) => repeat($.outer)",
		"outer: ($) => seq(field('inner', $.inner), optional(field('outer_end', $.semi)))",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		...tokens
	],
	options: "options: { outer: { 'outer_end:': preference('blank') }, inner: { 'inner_comma:': preference('blank') } }"
};

const threeLevel = {
	rules: [
		"source: ($) => repeat($.outer)",
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

describe('a two-level forwarder with options on both levels', () => {
	let factories: string;
	let loose: string;

	beforeAll(async () => {
		({ factories, loose } = await emitted(twoLevel));
	});

	// The emitted strict wrapper, executed with stub builders that record their arguments.
	function strictOuter(recorded: Recorded[]): (...args: unknown[]) => unknown {
		const outerBuilder = (...args: unknown[]) => {
			recorded.push({ builder: '_buildOuter', args });
			return { $type: 'Outer', value: args[0], options: args[1] };
		};
		const innerBuilder = (...args: unknown[]) => {
			recorded.push({ builder: 'buildInner', args });
			return { $type: 'Inner', from: args };
		};
		const source = emittedFunction(factories, 'buildOuter');
		return new Function('_buildOuter', 'buildInner', 'TSKindId', `${source}\nreturn buildOuter;`)(outerBuilder, innerBuilder, {
			Inner: 'Inner',
			Outer: 'Outer',
			Base: 'Base'
		}) as (...args: unknown[]) => unknown;
	}

	// The emitted loose coercer, executed with stub builders that record their arguments.
	function looseOuter(recorded: Recorded[]): (...args: unknown[]) => unknown {
		const F = {
			buildOuter: (value: unknown, options: unknown) => {
				recorded.push({ builder: 'F.buildOuter', args: [value, options] });
				return { $type: 'Outer', value, options };
			}
		};
		const coerceToInner = (input: unknown, options: unknown) => {
			recorded.push({ builder: 'coerceToInner', args: [input, options] });
			return { $type: 'Inner', from: [input, options] };
		};
		const isNodeOfKind = (input: unknown, kind: string) => (input as { $type?: unknown } | undefined)?.$type === kind;
		const configFieldOr = (input: unknown, _key: string, fallback: () => unknown) => fallback();
		const source = emittedFunction(loose, 'coerceToOuter');
		return new Function('F', 'coerceToInner', 'isNodeOfKind', 'configFieldOr', 'TSKindId', `${source}\nreturn coerceToOuter;`)(
			F,
			coerceToInner,
			isNodeOfKind,
			configFieldOr,
			{ Inner: 'Inner', Outer: 'Outer' }
		) as (...args: unknown[]) => unknown;
	}

	const base = { $type: 'Base' };
	const config_ = { name: 'x' };
	const innerOpts = { innerComma: ',' };
	const outerOpts = { outerEnd: ';' };

	describe('the strict wrapper', () => {
		it('gives the inner options to the inner builder when the input is a base', () => {
			const recorded: Recorded[] = [];
			strictOuter(recorded)(base, innerOpts);
			expect(recorded.map((r) => r.builder)).toEqual(['buildInner', '_buildOuter']);
			expect(recorded[0]!.args).toEqual([base, innerOpts]);
			expect(recorded[1]!.args[1]).toBeUndefined();
		});

		it('leaves the inner options unset and gives the outer options to the outer builder', () => {
			const recorded: Recorded[] = [];
			strictOuter(recorded)(base, undefined, outerOpts);
			expect(recorded[0]!.args).toEqual([base, undefined]);
			expect(recorded[1]!.args[1]).toEqual(outerOpts);
		});

		it('gives each options object to its own builder when both are given', () => {
			const recorded: Recorded[] = [];
			strictOuter(recorded)(base, innerOpts, outerOpts);
			expect(recorded[0]!.args).toEqual([base, innerOpts]);
			expect(recorded[1]!.args[1]).toEqual(outerOpts);
		});

		it('gives the inner options to the inner builder for a config form', () => {
			const recorded: Recorded[] = [];
			strictOuter(recorded)(config_, innerOpts, outerOpts);
			expect(recorded[0]!.args).toEqual([config_, innerOpts]);
			expect(recorded[1]!.args[1]).toEqual(outerOpts);
		});

		it('keeps both options when the config is omitted', () => {
			const recorded: Recorded[] = [];
			strictOuter(recorded)(undefined, innerOpts, outerOpts);
			expect(recorded[0]!.args).toEqual([undefined, innerOpts]);
			expect(recorded[1]!.args[1]).toEqual(outerOpts);
		});

		it('gives only the outer options to the outer builder for a built inner', () => {
			const recorded: Recorded[] = [];
			const builtInner = { $type: 'Inner' };
			strictOuter(recorded)(builtInner, outerOpts);
			expect(recorded.map((r) => r.builder)).toEqual(['_buildOuter']);
			expect(recorded[0]!.args[0]).toBe(builtInner);
			expect(recorded[0]!.args[1]).toEqual(outerOpts);
		});

		it('refuses options given with a built outer', () => {
			expect(() => strictOuter([])({ $type: 'Outer' }, outerOpts)).toThrow('carries its own options');
		});
	});

	describe('the loose coercer', () => {
		it('gives the inner options to the inner coercer and the outer options to the outer builder', () => {
			const recorded: Recorded[] = [];
			looseOuter(recorded)(base, innerOpts, outerOpts);
			expect(recorded.map((r) => r.builder)).toEqual(['coerceToInner', 'F.buildOuter']);
			expect(recorded[0]!.args).toEqual([base, innerOpts]);
			expect(recorded[1]!.args[1]).toEqual(outerOpts);
		});

		it('gives the inner options to the inner coercer for a config form', () => {
			const recorded: Recorded[] = [];
			looseOuter(recorded)(config_, innerOpts, outerOpts);
			expect(recorded.map((r) => r.builder)).toEqual(['coerceToInner', 'F.buildOuter']);
			expect(recorded[0]!.args).toEqual([config_, innerOpts]);
			expect(recorded[1]!.args[1]).toEqual(outerOpts);
		});

		it('gives only the outer options to the outer builder for a built inner', () => {
			const recorded: Recorded[] = [];
			const builtInner = { $type: 'Inner' };
			looseOuter(recorded)(builtInner, undefined, outerOpts);
			expect(recorded.map((r) => r.builder)).toEqual(['coerceToInner', 'F.buildOuter']);
			expect(recorded[0]!.args).toEqual([builtInner, undefined]);
			expect(recorded[1]!.args[1]).toEqual(outerOpts);
		});

		it('refuses options given with a built outer', () => {
			expect(() => looseOuter([])({ $type: 'Outer' }, innerOpts)).toThrow('carries its own options');
		});
	});
});

const transparentOverTwoLevel = {
	rules: [
		"source: ($) => repeat($.top)",
		"top: ($) => field('wrapped', $.outer)",
		"outer: ($) => seq(field('inner', $.inner), optional(field('outer_end', $.semi)))",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		...tokens
	],
	options: "options: { outer: { 'outer_end:': preference('blank') }, inner: { 'inner_comma:': preference('blank') } }"
};

const optionalTwoLevel = {
	rules: [
		"source: ($) => repeat($.outer)",
		"outer: ($) => seq(optional(field('inner', $.inner)), optional(field('outer_end', $.semi)), field('bar', $.pipe))",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		"pipe: () => '|'",
		...tokens
	],
	options: "options: { outer: { 'outer_end:': preference('blank') }, inner: { 'inner_comma:': preference('blank') } }"
};

describe('a two-level forwarder whose forwarded input is optional', () => {
	it('refuses the chain at emit with a named diagnostic on the outer kind', async () => {
		await expect(emitted(optionalTwoLevel)).rejects.toMatchObject({
			blocking: [expect.objectContaining({ code: 'two-level-optional-input', ownerKind: 'outer' })]
		});
	});
});

const transparentChain = {
	rules: [
		"source: ($) => repeat($.top)",
		"top: ($) => field('wrapped', $.outer)",
		"outer: ($) => field('inner', $.inner)",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		...tokens
	],
	options: "options: { inner: { 'inner_comma:': preference('blank') } }"
};

describe('two transparent wrappers above an option-bearing node', () => {
	let factories: string;
	let pkg: EmitAllResult;

	beforeAll(async () => {
		({ factories, pkg } = await emitted(transparentChain));
	});

	it('type-checks: a built inner through the top takes no options, the config form does', async () => {
		const diagnostics = await typeProbe(
			pkg,
			[
				"import { buildBase, buildComma, buildIdentifier, buildInner, buildTop } from './factories.ts';",
				'const config = { name: buildIdentifier("x") };',
				'const options = { innerComma: buildComma };',
				'const built = buildInner(buildBase(config));',
				'// @ts-expect-error a built inner carries its own options, so the top refuses them',
				'export const refused = buildTop(built, options);',
				'export const kept = buildTop(config, options);',
				'// @ts-expect-error a number is no input the top admits',
				'export const unrelated = buildTop(42);'
			].join('\n')
		);
		expect(diagnostics.map((d) => d.head)).toEqual([]);
	}, 300_000);

	function topWithStubs(recorded: Recorded[]): (...args: unknown[]) => unknown {
		const innerBuilder = (...args: unknown[]) => {
			recorded.push({ builder: 'buildInner', args });
			return { $type: 'Inner', args };
		};
		const outerBuilder = (...args: unknown[]) => {
			recorded.push({ builder: '_buildOuter', args });
			return { $type: 'Outer', args };
		};
		const topBuilder = (...args: unknown[]) => {
			recorded.push({ builder: '_buildTop', args });
			return { $type: 'Top', args };
		};
		const source = `${emittedFunction(factories, 'buildOuter')}\n${emittedFunction(factories, 'buildTop')}\nreturn buildTop;`;
		return new Function('_buildOuter', 'buildInner', '_buildTop', 'TSKindId', source)(outerBuilder, innerBuilder, topBuilder, {
			Top: 'Top',
			Outer: 'Outer',
			Inner: 'Inner',
			Base: 'Base'
		}) as (...args: unknown[]) => unknown;
	}

	it('gives the inner options to the inner builder for a config', () => {
		const recorded: Recorded[] = [];
		topWithStubs(recorded)({ name: 'x' }, innerOptsOf());
		expect(recorded.map((r) => r.builder)).toEqual(['buildInner', '_buildOuter', '_buildTop']);
		expect(recorded[0]!.args[1]).toEqual(innerOptsOf());
	});

	it('builds from a built inner alone', () => {
		const recorded: Recorded[] = [];
		topWithStubs(recorded)({ $type: 'Inner' });
		expect(recorded.map((r) => r.builder)).toEqual(['_buildOuter', '_buildTop']);
	});

	it('refuses a built inner with options, as the built-node refusal does', () => {
		expect(() => topWithStubs([])({ $type: 'Inner' }, innerOptsOf())).toThrow('carries its own options');
	});
});

function innerOptsOf(): { innerComma: string } {
	return { innerComma: ',' };
}

describe('a three-level forwarder with options on each level', () => {
	it('refuses the chain at emit with a named diagnostic on the outer kind', async () => {
		await expect(emitted(threeLevel)).rejects.toMatchObject({
			blocking: [expect.objectContaining({ code: 'three-level-option-chain', ownerKind: 'outer' })]
		});
	});

	it('refuses a transparent wrapper whose target is a two-level chain, on the wrapper kind', async () => {
		await expect(emitted(transparentOverTwoLevel)).rejects.toMatchObject({
			blocking: [expect.objectContaining({ code: 'three-level-option-chain', ownerKind: 'top' })]
		});
	});
});

describe('the generated package of the two-level fixture', () => {
	it('compiles: every emitted module type-checks with no diagnostics', async () => {
		const { pkg } = await emitted(twoLevel);
		const diagnostics = await typeProbe(pkg, 'export {};');
		expect(diagnostics.map((d) => d.head)).toEqual([]);
	}, 300_000);
});
