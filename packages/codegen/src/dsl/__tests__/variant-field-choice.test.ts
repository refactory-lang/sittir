import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../__tests__/helpers/sittir-grammar.ts';

let dir: string;
let baseModule: string;
let nestedModule: string;

beforeAll(() => {
	dir = mkdtempSync(join(tmpdir(), 'variant-field-choice-'));
	baseModule = join(dir, 'base.mjs');
	writeFileSync(
		baseModule,
		`export default grammar({
	name: 'usingtest',
	rules: {
		source_file: $ => repeat(choice($.declaration, $.header)),
		declaration: $ => seq(field('kind', choice('using', seq('await', 'using'))), $.identifier, ';'),
		header: $ => seq('(', field('kind', choice('using', seq('await', 'using'))), $.identifier, ')'),
		identifier: _ => /[a-z]+/
	}
});
`
	);
	nestedModule = join(dir, 'nested.mjs');
	writeFileSync(
		nestedModule,
		`export default grammar({
	name: 'nestedtest',
	rules: {
		source_file: $ => repeat($.declaration),
		declaration: $ => seq(field('kind', choice('a', seq('b', 'a'))), $.identifier, optional(seq(',', field('kind', choice('a', seq('b', 'a'))))), ';'),
		identifier: _ => /[a-z]+/
	}
});
`
	);
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

type Shape = string | readonly Shape[] | { readonly [key: string]: Shape };

function shape(rule: unknown): Shape {
	const node = rule as { type: string; name?: string; value?: string; content?: unknown; members?: unknown[] };
	if (node.type === 'FIELD') return { [node.name!]: shape(node.content) };
	if (node.type === 'SEQ' || node.type === 'CHOICE') return node.members!.map(shape);
	if (node.type === 'OPTIONAL') return { optional: shape(node.content) };
	return node.value ?? node.name!;
}

const VARIANTS = `edits: { declaration: { 'kind:/0': variant('plain', { default: true }), 'kind:/1': variant('await') } }`;

describe('variants of a choice a field holds', () => {
	it('hoist whole-arm by the field name, each variant keeping the field around its arm', async () => {
		const { rules } = await evaluateSittirGrammar(baseModule, 'usingtest', VARIANTS);
		const arms = rules.declaration as { type: string; members: { name: string; annotations?: Record<string, unknown> }[] };
		expect(arms.type).toBe('CHOICE');
		expect(arms.members.map((m) => [m.name, m.annotations?.variant, m.annotations?.default === true])).toEqual([
			['declaration_plain', 'plain', true],
			['declaration_await', 'await', false]
		]);
		expect(shape(rules.declaration_plain)).toEqual([{ kind: 'using' }, { identifier: 'identifier' }, ';']);
		expect(shape(rules.declaration_await)).toEqual([{ kind: ['await', 'using'] }, { identifier: 'identifier' }, ';']);
	}, 120_000);

	it('leave a rule that shares the hoisted arm on its own copy of the arm', async () => {
		const unbound = await evaluateSittirGrammar(baseModule, 'usingtest');
		expect(shape(unbound.rules.header)).toEqual(['(', { kind: ['using', 'declaration_arm'] }, { identifier: 'identifier' }, ')']);
		const { rules } = await evaluateSittirGrammar(baseModule, 'usingtest', VARIANTS);
		const [, kind] = shape(rules.header) as readonly Shape[];
		const [, copy] = (kind as { kind: readonly string[] }).kind;
		expect(copy).not.toBe('declaration_await');
		expect(copy).not.toBe('declaration_arm');
		expect(shape(rules[copy!])).toEqual(['await', 'using']);
	}, 120_000);

	it('keep one default when the declared default displaces one an earlier layer set', async () => {
		const layered = `edits: { declaration: [{ 'kind:/0': arm.default }, { 'kind:/0': variant('plain'), 'kind:/1': variant('await', { default: true }) }] }`;
		const { rules } = await evaluateSittirGrammar(baseModule, 'usingtest', layered);
		const arms = rules.declaration as { members: { name: string; annotations?: Record<string, unknown> }[] };
		expect(arms.members.map((m) => [m.name, m.annotations?.default === true])).toEqual([
			['declaration_plain', false],
			['declaration_await', true]
		]);
	}, 120_000);

	it('patch each arm in place when the field also sits deeper in the rule', async () => {
		const { rules } = await evaluateSittirGrammar(nestedModule, 'nestedtest', `edits: { declaration: { 'kind:/0': variant('a'), 'kind:/1': variant('b') } }`);
		const arms = { kind: ['declaration_a', 'declaration_b'] };
		expect(shape(rules.declaration)).toEqual([arms, { identifier: 'identifier' }, { optional: '_declaration_optional1' }, ';']);
		expect(shape(rules._declaration_optional1)).toEqual([',', arms]);
		expect(shape(rules.declaration_b)).toEqual(['b', 'a']);
	}, 120_000);
});
