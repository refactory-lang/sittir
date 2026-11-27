import { describe, expect, it } from 'vitest';
import { assemblePredicted, rawIdTablesOf, withFixtureLexicalRanks } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { computeNodeSCC } from '../../compiler/scc.ts';
import { resolveRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import { NO_JOINS, type JoinFacts } from '../../compiler/model/join-seams/index.ts';
import type { RuleId } from '../../types/rule.ts';
import { collectKindEntries } from '../kind-discriminant.ts';
import { runTemplateEmitter, stampStaticSpacing } from '../templates.ts';
import type { Body } from '../render-body.ts';

function shape(body: Body): string {
	return body
		.map((node) => {
			switch (node.kind) {
				case 'text':
					return JSON.stringify(node.text);
				case 'space':
					return '_';
				case 'adjacent':
					return '^';
				case 'slot':
					return `{${node.name}}`;
				case 'seam':
					return `<${node.field}>`;
				case 'if':
					return `[${node.arms.map((arm) => shape(arm.body)).join(' | ')}${node.fallback === undefined ? '' : ` / ${shape(node.fallback)}`}]`;
				default:
					return node.kind;
			}
		})
		.join(' ');
}

async function shapeOf(rules: readonly string[], kind: string, joins: Partial<JoinFacts> = {}): Promise<string> {
	const facts: JoinFacts = { ...NO_JOINS, ...joins };
	const raw = await evaluateTempGrammar({ extras: '/\\s/', rules: rules.join(', ') }, '');
	const { nodeMap, generatedIdTables } = assemblePredicted(raw, withFixtureLexicalRanks(rawIdTablesOf(raw)));
	nodeMap.scc = computeNodeSCC(nodeMap);
	const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
	const rulesConfig = {
		nodeMap,
		kindEntries,
		options: raw.options,
		whitespaceText: whitespaceTextOf(raw.renderAs, nodeMap),
		tight: facts.tight,
		tightAfter: facts.tightAfter
	};
	const renderRules = resolveRenderRules(rulesConfig, (spaced) => stampStaticSpacing(nodeMap, 'demo', spaced, kindEntries, facts)).seamed;
	const body = runTemplateEmitter({ grammar: 'demo', nodeMap, kindEntries, renderRules, joins: facts }).bodies.get(kind);
	if (body === undefined) throw new Error(`demo: no body for ${kind}`);
	return shape(body);
}

const toggle = ["source: ($) => repeat($.toggle)", "toggle: ($) => seq('(?', '-', $.word, ')')"];

describe('a boundary the grammar admits no seam at', () => {
	it('keeps two literals as two writes joined tight when the next one is immediate', async () => {
		const immediate = ["source: ($) => repeat($.toggle)", "toggle: ($) => seq('(?', token.immediate('-'), $.word, ')')"];
		expect(await shapeOf(immediate, 'toggle')).toContain('"(?" ^ "-"');
	});

	it('keeps two literals as two writes joined tight when the derivation proves the seam tight', async () => {
		const minus = 'rule:toggle:members.1' as RuleId;
		expect(await shapeOf(toggle, 'toggle', { tight: new Map([[minus, new Set(['before'] as const)]]) })).toContain('"(?" ^ "-"');
		expect(await shapeOf(toggle, 'toggle')).not.toContain('"(?" ^ "-"');
	});
});

describe('a seam the derivation proves tight only after one member', () => {
	const close = 'rule:interpolation:members.3' as RuleId;
	const spec = 'rule:interpolation:members.2' as RuleId;

	it('glues the next member when the member before it is always present', async () => {
		const rules = ["source: ($) => repeat($.interpolation)", "interpolation: ($) => seq('{', $.word, $.spec, '}')", "spec: ($) => seq(':', $.word)"];
		const tightAfter = new Map([[close, new Set([spec])]]);
		expect(await shapeOf(rules, 'interpolation', { tightAfter })).toMatchInlineSnapshot(`"<interpolation_before> "{" <lbrace_after> {word} ^ {spec} "}" <interpolation_after>"`);
		expect(await shapeOf(rules, 'interpolation')).toMatchInlineSnapshot(`"<interpolation_before> "{" <lbrace_after> {word} ^ {spec} <rbrace_before> "}" <interpolation_after>"`);
	});

	it('holds the next member\'s seam in the absent branch when the member before it is optional', async () => {
		const rules = ["source: ($) => repeat($.interpolation)", "interpolation: ($) => seq('{', $.word, optional($.spec), '}')", "spec: ($) => seq(':', $.word)"];
		const tightAfter = new Map([[close, new Set([spec])]]);
		expect(await shapeOf(rules, 'interpolation', { tightAfter })).toMatchInlineSnapshot(`"<interpolation_before> "{" <lbrace_after> {word} [{spec} / <rbrace_before>] "}" <interpolation_after>"`);
		expect(await shapeOf(rules, 'interpolation')).toMatchInlineSnapshot(`"<interpolation_before> "{" <lbrace_after> {word} [{spec}] <rbrace_before> "}" <interpolation_after>"`);
	});
});
