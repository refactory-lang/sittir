import { describe, expect, it } from 'vitest';
import { assemblePredicted, rawIdTablesOf, withFixtureLexicalRanks } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { NO_JOINS } from '../../compiler/model/join-seams/index.ts';
import { resolveRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import { computeNodeSCC } from '../../compiler/scc.ts';
import { collectKindEntries } from '../kind-discriminant.ts';
import type { Body } from '../render-body.ts';
import { runTemplateEmitter, stampStaticSpacing } from '../templates.ts';

const upstream = {
	extras: '/\\s/',
	rules: [
		'source: ($) => repeat(choice($.type_definition, $.type_descriptor, $.pointer_declarator))',
		"type_definition: ($) => seq('typedef', $._type_definition_type, field('declarator', $.identifier), ';')",
		"_type_definition_type: ($) => seq(repeat($.type_qualifier), field('type', $.identifier), repeat($.type_qualifier))",
		"type_descriptor: ($) => seq(repeat($.type_qualifier), field('type', $.identifier), repeat($.type_qualifier), field('declarator', optional($.pointer_declarator)))",
		"pointer_declarator: ($) => seq('*', repeat($.type_qualifier), field('declarator', $.identifier))",
		"type_qualifier: () => choice('const', 'volatile')",
		'identifier: () => /[a-z]+/'
	].join(', ')
};

const qualifierRuns = "{ 0: field('type_qualifiers'), 2: field('type_qualifiers') }";
const edits = `edits: { _type_definition_type: ${qualifierRuns}, type_descriptor: ${qualifierRuns} }`;

async function emit() {
	const raw = await evaluateTempGrammar(upstream, edits);
	const { nodeMap, generatedIdTables } = assemblePredicted(raw, withFixtureLexicalRanks(rawIdTablesOf(raw)));
	nodeMap.scc = computeNodeSCC(nodeMap);
	const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
	const rulesConfig = { nodeMap, kindEntries, options: raw.options, whitespaceText: whitespaceTextOf(raw.renderAs, nodeMap) };
	const renderRules = resolveRenderRules(rulesConfig, (spaced) => stampStaticSpacing(nodeMap, 'demo', spaced, kindEntries, NO_JOINS)).seamed;
	return { nodeMap, bodies: runTemplateEmitter({ grammar: 'demo', nodeMap, kindEntries, renderRules, joins: NO_JOINS }).bodies };
}

let emitted: ReturnType<typeof emit> | undefined;
const emittedOnce = () => (emitted ??= emit());

const placed = (body: Body | undefined): readonly string[] =>
	(body ?? []).flatMap((part) => (part.kind === 'slot' ? [part.name] : part.kind === 'text' ? [`'${part.text}'`] : []));

describe('type qualifiers on both sides of a type', () => {
	for (const kind of ['type_definition', 'type_descriptor']) {
		it(
			`${kind} holds both qualifier runs in one slot that a rebuild writes before the type, so \`int const\` rebuilds as \`const int\``,
			async () => {
				const { nodeMap, bodies } = await emittedOnce();
				const slots = nodeMap.nodes.get(kind)!.slots.filter((slot) => slot.values.some((value) => value.parseKind?.name === 'type_qualifier'));
				expect(slots.map((slot) => [slot.storageName, slot.isUnnamed])).toEqual([['type_qualifiers', false]]);
				const order = placed(bodies.get(kind));
				expect(order.filter((name) => name === 'type_qualifiers')).toHaveLength(1);
				expect(order.indexOf('type_qualifiers')).toBeLessThan(order.indexOf('type'));
			},
			FULL_PIPELINE_TIMEOUT
		);
	}

	it(
		'a pointer declarator writes its qualifiers after the star, so `int * const p` keeps its order',
		async () => {
			const { bodies } = await emittedOnce();
			const order = placed(bodies.get('pointer_declarator'));
			expect(order.indexOf("'*'")).toBeLessThan(order.indexOf('type_qualifier'));
			expect(order.indexOf('type_qualifier')).toBeLessThan(order.indexOf('declarator'));
		},
		FULL_PIPELINE_TIMEOUT
	);
});
