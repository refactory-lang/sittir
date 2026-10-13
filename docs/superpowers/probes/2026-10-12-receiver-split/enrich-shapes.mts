/**
 * What enrich would make of each receiver form, had it seen one: runs the worktree's `enrich()` on a
 * toy grammar holding the plain list and one receiver form, and prints the rules it rewrites and
 * mints, with the mints' origins. The lead edit runs in `bindGrammar`, after enrich, so the probe's
 * grammars never pass their receiver form through it; this asks enrich directly.
 *
 *   pnpm exec tsx docs/superpowers/probes/2026-10-12-receiver-split/enrich-shapes.mts
 *
 * Run from the root of the worktree whose enrich it runs (the fake DSL is enrich's unit tests').
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

type Rule = Record<string, unknown>;

const dsl = join(process.cwd(), 'packages/codegen/src/dsl');
const { enrich, getEnrichVisibleSubsequenceSources, getEnrichHiddenSubsequences } = await import(pathToFileURL(join(dsl, 'enrich.ts')).href);
const { installFakeDsl } = await import(pathToFileURL(join(dsl, '__tests__/_test-helpers.ts')).href);
installFakeDsl();

const sym = (name: string): Rule => ({ type: 'SYMBOL', name });
const str = (value: string): Rule => ({ type: 'STRING', value });
const seq = (...members: Rule[]): Rule => ({ type: 'SEQ', members });
const choice = (...members: Rule[]): Rule => ({ type: 'CHOICE', members });
const optional = (content: Rule): Rule => ({ type: 'OPTIONAL', content });
const repeat = (content: Rule): Rule => ({ type: 'REPEAT', content });
const repeat1 = (content: Rule): Rule => ({ type: 'REPEAT1', content });
const field = (name: string, content: Rule): Rule => ({ type: 'FIELD', name, content });
const alias = (content: Rule, value: string): Rule => ({ type: 'ALIAS', named: true, value, content });

const receiver = field('receiver', sym('lead'));
const item = field('item', sym('rest'));
const run = seq(repeat1(seq(str(','), item)), optional(str(',')));
const FORMS: Record<string, { form: Rule; extra?: Record<string, Rule> }> = {
	'two-rules-repeat': { form: seq(receiver, repeat(seq(str(','), item)), optional(str(','))) },
	'two-rules': { form: seq(receiver, optional(choice(str(','), run))) },
	'two-rules-tail': {
		form: seq(receiver, optional(choice(str(','), field('elements', alias(sym('_parameters_elements_receiver_tail'), 'parameters_elements_receiver_tail'))))),
		extra: { _parameters_elements_receiver_tail: run }
	},
	'two-rules-plain': { form: seq(receiver, optional(seq(str(','), optional(field('elements', sym('parameters_elements')))))) },
	'two-arms': { form: choice(seq(receiver, optional(str(','))), seq(receiver, str(','), field('elements', sym('parameters_elements')))) }
};

for (const [name, { form, extra }] of Object.entries(FORMS)) {
	const rules: Record<string, Rule> = {
		source_file: repeat(sym('parameters')),
		parameters: seq(str('('), optional(field('elements', choice(sym('parameters_elements'), alias(sym('_parameters_elements_receiver'), 'parameters_elements_receiver')))), str(')')),
		parameters_elements: seq(item, repeat(seq(str(','), item)), optional(str(','))),
		_parameters_elements_receiver: form,
		...extra,
		lead: { type: 'PATTERN', value: 'self' },
		rest: { type: 'PATTERN', value: '[a-z]+' }
	};
	const before = new Set(Object.keys(rules));
	const out = enrich({ grammar: { name: 'probe', rules: structuredClone(rules), externals: [] } }) as { grammar: { rules: Record<string, Rule> } };
	console.log(`## ${name}`);
	for (const [rule, body] of Object.entries(out.grammar.rules)) {
		if (!before.has(rule)) console.log(`  minted ${rule} = ${JSON.stringify(body)}`);
		else if (rule.includes('receiver') && JSON.stringify(body) !== JSON.stringify(rules[rule])) console.log(`  rewrote ${rule} = ${JSON.stringify(body)}`);
		else if (rule.includes('receiver')) console.log(`  kept ${rule}`);
	}
	console.log(`  visible-group sources: ${JSON.stringify([...getEnrichVisibleSubsequenceSources(out)])}`);
	console.log(`  hidden groups: ${JSON.stringify([...getEnrichHiddenSubsequences(out)])}`);
}
