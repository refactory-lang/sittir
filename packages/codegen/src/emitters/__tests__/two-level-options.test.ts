import { stripTypeScriptTypes } from 'node:module';
import { beforeAll, describe, expect, it } from 'vitest';
import { assemblePredicted, rawIdTablesOf, withFixtureLexicalRanks } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { computeNodeSCC } from '../../compiler/scc.ts';
import { resolveRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import { collectSitePreferences } from '../../compiler/model/site-preferences.ts';
import { collectKindEntries } from '../kind-discriminant.ts';
import { stampStaticSpacing } from '../templates.ts';
import { NO_JOINS } from '../../compiler/model/join-seams/index.ts';

const upstream = {
	extras: '/\\s/',
	rules: [
		"source: ($) => repeat($.outer)",
		"outer: ($) => seq(field('inner', $.inner), optional(field('outer_end', $.semi)))",
		"inner: ($) => seq(field('base', $.base), optional(field('inner_comma', $.comma)))",
		"base: ($) => seq(field('name', $.identifier), optional(field('base_bang', $.bang)))",
		'identifier: () => /[a-z]+/',
		"semi: () => ';'",
		"comma: () => ','",
		"bang: () => '!'"
	].join(', ')
};

const config = "options: { outer: { 'outer_end:': preference('blank') }, inner: { 'inner_comma:': preference('blank') } }";

function emittedFunction(emitted: string, name: string): string {
	const start = emitted.indexOf(`export function ${name}(`);
	if (start < 0) throw new Error(`no ${name} in the emitted output`);
	const end = emitted.indexOf('\n}\n', start) + 2;
	return stripTypeScriptTypes(emitted.slice(start, end)).replace(/^export /m, '');
}

type Recorded = { readonly builder: string; readonly args: readonly unknown[] };

describe('a two-level forwarder with options on both levels', () => {
	let factories: string;
	let loose: string;

	beforeAll(async () => {
		const raw = await evaluateTempGrammar(upstream, config);
		const { nodeMap, generatedIdTables } = assemblePredicted(raw, withFixtureLexicalRanks(rawIdTablesOf(raw)));
		nodeMap.scc = computeNodeSCC(nodeMap);
		const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
		const rulesConfig = { nodeMap, kindEntries, options: raw.options, whitespaceText: whitespaceTextOf(raw.renderAs, nodeMap) };
		const renderRules = resolveRenderRules(rulesConfig, (spaced) => stampStaticSpacing(nodeMap, 'demo', spaced, kindEntries, NO_JOINS)).seamed;
		collectSitePreferences({ nodeMap, kindEntries, renderRules, options: raw.options });
		factories = emitFactories({ grammar: 'demo', nodeMap, generatedIdTables });
		loose = emitFrom({ grammar: 'demo', nodeMap, generatedIdTables });
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
