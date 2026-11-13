import { describe, expect, it } from 'vitest';
import { assemblePredicted, rawIdTablesOf, withFixtureLexicalRanks } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { computeNodeSCC } from '../../compiler/scc.ts';
import { resolveRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import { NO_JOINS, type JoinFacts } from '../../compiler/model/join-seams/index.ts';
import { collectKindEntries } from '../kind-discriminant.ts';
import { runTemplateEmitter, stampStaticSpacing } from '../templates.ts';
import type { Body } from '../render-body.ts';

const upstream = {
	extras: '/\\s/',
	rules: [
		'source: ($) => repeat($.pair)',
		"pair: ($) => seq(field('head', $.parens), field('tail', $.braces))",
		"parens: ($) => seq('(', repeat($.word), ')')",
		"braces: ($) => seq('{', repeat($.word), '}')"
	].join(', ')
};

async function pairBody(joins: JoinFacts): Promise<Body> {
	const raw = await evaluateTempGrammar(upstream, '');
	const { nodeMap, generatedIdTables } = assemblePredicted(raw, withFixtureLexicalRanks(rawIdTablesOf(raw)));
	nodeMap.scc = computeNodeSCC(nodeMap);
	const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
	const rulesConfig = {
		nodeMap,
		kindEntries,
		options: raw.options,
		whitespaceText: whitespaceTextOf(raw.renderAs, nodeMap)
	};
	const renderRules = resolveRenderRules(rulesConfig, (spaced) =>
		stampStaticSpacing(nodeMap, 'demo', spaced, kindEntries, joins)
	).seamed;
	const body = runTemplateEmitter({ grammar: 'demo', nodeMap, kindEntries, renderRules, joins }).bodies.get('pair');
	if (body === undefined) throw new Error('demo: no body for pair');
	return body;
}

const glued = (body: Body) => JSON.stringify(body).includes('"kind":"adjacent"');

describe('static spacing stamps each seam with the join pairs the emission uses', () => {
	it('glues two slots statically when no join pair spans their edges', async () => {
		expect(glued(await pairBody(NO_JOINS))).toBe(true);
	});

	it('leaves the seam to the runtime when a join pair spans their edges', async () => {
		expect(glued(await pairBody({ ...NO_JOINS, pairs: ['){'] }))).toBe(false);
	});
});
