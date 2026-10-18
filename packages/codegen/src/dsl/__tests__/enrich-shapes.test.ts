import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enrich, withEnrichSidecarsOf } from '../enrich.ts';
import { enrichShapesOf, type EnrichShape } from '../enrich-shapes.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const optional = (content: unknown) => ({ type: 'OPTIONAL', content });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });

function grammarOf(rules: Record<string, unknown>) {
	return { grammar: { name: 'test', rules, externals: [] } };
}

function enriched(rules: Record<string, unknown>) {
	return enrich(grammarOf(rules) as unknown as Parameters<typeof enrich>[0]) as unknown as { grammar: { rules: Record<string, unknown> } };
}

function codesOf(grammar: unknown, ruleName: string): string[] {
	return enrichShapesOf(grammar)
		.filter((shape: EnrichShape) => shape.ruleName === ruleName)
		.map((shape) => shape.code)
		.sort();
}

describe('the shapes enrich records', () => {
	it('records an optional token followed by an optional field as one lone optional token', () => {
		const result = enriched({
			parameters: seq(str('('), field('self', sym('self_parameter')), optional(seq(str(','), optional(field('elements', sym('parameter_list'))))), str(')')),
			self_parameter: str('self'),
			parameter_list: str('x')
		});
		expect(codesOf(result, 'parameters')).toContain('lone-optional-token');
		expect(codesOf(result, 'parameters')).not.toContain('optional-sequence-inline');
	});

	it('records an optional sequence with one slot as an inline optional sequence', () => {
		const result = enriched({
			parent: seq(field('name', sym('identifier')), optional(seq(str('for'), field('x', sym('expr'))))),
			identifier: { type: 'PATTERN', value: '[a-z]+' },
			expr: { type: 'PATTERN', value: '[0-9]+' }
		});
		expect(codesOf(result, 'parent')).toContain('optional-sequence-inline');
	});

	it('records nothing when enrich meets its own output', () => {
		const first = enriched({
			parameters: seq(str('('), field('self', sym('self_parameter')), optional(seq(str(','), optional(field('elements', sym('parameter_list'))))), str(')')),
			self_parameter: str('self'),
			parameter_list: str('x')
		});
		const second = enrich(withEnrichSidecarsOf(first as never, first) as never);
		expect(enrichShapesOf(second)).toEqual([]);
	});
});

describe('the shapes enrich records when it rewrites a choice', () => {
	const alias = (value: string, content: unknown) => ({ type: 'ALIAS', named: true, value, content });
	const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
	const token = (content: unknown) => ({ type: 'TOKEN', content });

	it('records an alias over a choice as alias-over-choice, and writes the distributed form', () => {
		const result = enriched({ parent: alias('x', choice(sym('a'), sym('b'))), a: str('a'), b: str('b') });
		expect(codesOf(result, 'parent')).toContain('alias-over-choice');
		expect((result.grammar.rules.parent as { type: string }).type).toBe('CHOICE');
	});

	it('records a token over a choice of strings as leaf-enum-token', () => {
		const result = enriched({ op: token(choice(str('+'), str('-'))) });
		expect(codesOf(result, 'op')).toContain('leaf-enum-token');
	});

	it('records a choice whose every member is optional as shared-optional-choice, and not a choice with a required member', () => {
		const shared = enriched({ parent: seq(str('('), choice(optional(field('a', sym('x'))), optional(field('b', sym('y')))), str(')')), x: str('x'), y: str('y') });
		expect(codesOf(shared, 'parent')).toContain('shared-optional-choice');
		const required = enriched({ parent: seq(str('('), choice(optional(field('a', sym('x'))), field('b', sym('y'))), str(')')), x: str('x'), y: str('y') });
		expect(codesOf(required, 'parent')).not.toContain('shared-optional-choice');
	});

	it('records nothing for a rule none of the three rewrites touch', () => {
		const result = enriched({ plain: seq(str('('), field('a', sym('x')), str(')')), x: str('x') });
		expect(codesOf(result, 'plain')).toEqual([]);
	});
});
