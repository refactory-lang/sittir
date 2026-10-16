import { join } from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { evaluateDsl, withDslGlobals } from '../../compiler/evaluate.ts';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';
import type { GrammarResult } from '../enrich.ts';
import { enrichFixpoint } from '../layer.ts';
import { layerRecordOf } from '../layer-record.ts';

const PACKAGES = join(__dirname, '../../../..');
const require = createRequire(import.meta.url);
const checks = vi.hoisted(() => ({ count: 0, bases: [] as string[], empty: false }));

vi.mock('../sittir-grammar.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../sittir-grammar.ts')>();
	const withBindings = <B extends Parameters<typeof actual.sittirGrammar>[0], P, O>(
		...[base, config]: Parameters<typeof actual.sittirGrammar<B, P, O>>
	) => actual.sittirGrammar<B, P, O>(base, { ...config, bindings: checks.empty ? {} : (config.bindings ?? {}) });
	return { ...actual, sittirGrammar: withBindings };
});

vi.mock('../enrich.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../enrich.ts')>();
	return {
		...actual,
		withEnrichSidecarsOf: <G extends object>(grammar: G, enriched: unknown): G => {
			checks.count++;
			checks.bases.push(JSON.stringify(grammar));
			return actual.withEnrichSidecarsOf(grammar, enriched);
		}
	};
});

describe('the grammar bindings layer', () => {
	it('enriches the completed authored layer before any binding edit', async () => {
		checks.bases.length = 0;
		const raw = await evaluateTempGrammar(
			{ extras: '', rules: "holder: $ => seq('(', $.word, ')')" },
			"edits: { holder: { 1: field('authored') } }, bindings: bindings({ patches: { holder: { 1: field('portable') } } })"
		);
		expect(checks.bases).toHaveLength(1);
		expect(checks.bases[0]).toContain('"name":"authored"');
		expect(checks.bases[0]).not.toContain('"name":"portable"');
		expect(JSON.stringify(raw.rules.holder)).toContain('"name":"portable"');
	});

	it('applies a lead to the field produced by the binding patch', async () => {
		const raw = await evaluateTempGrammar(
			{
				extras: '',
				rules: `holder: $ => seq('(', field('elements', $.entries), ')'),
				entries: $ => seq(field('item', choice($.head, $.tail)), repeat(seq(',', field('item', choice($.head, $.tail))))),
				head: _ => 'self', tail: _ => 'value'`
			},
			`bindings: bindings({
				patches: { entries: { 0: field('entry'), '1/0/1': field('entry') } },
				leads: [{ list: 'entries', item: 'entry', field: 'receiver', admits: [{ kind: 'head' }] }]
			})`
		);
		expect(raw.leadFrom).toEqual({ _entries_receiver: 'entries' });
		expect(JSON.stringify(raw.rules._entries_receiver)).toContain('"name":"receiver"');
		expect(JSON.stringify(raw.rules.holder)).toContain('"value":"entries_receiver"');
		expect(JSON.stringify(raw.rules.entries)).toContain('"name":"entry"');
		expect(raw.rules).toHaveProperty('entries_receiver_group');
		expect(JSON.stringify(raw.rules._entries_receiver)).toContain('"name":"entries_receiver_group"');
	});

	it('records a hidden helper field rename against its owners before a lead narrows their helper references', async () => {
		const raw = await evaluateTempGrammar(
			{
				extras: '',
				rules: `holder: $ => seq('(', field('elements', $.entries), ')'),
			entries: $ => seq(field('item', $.parameter), repeat(seq(',', field('item', $.parameter)))),
			parameter: $ => seq($._name, ':', $.word),
			_name: $ => seq(field('pattern', choice($.head, $.tail)), '!'), head: _ => 'self', tail: _ => 'value'`
			},
			`bindings: bindings({ patches: { _name: { 0: field('name') } }, leads: [{ list: 'entries', item: 'item', field: 'receiver', admits: [{ kind: 'parameter', within: { field: 'pattern', admits: [{ kind: 'head' }] }, as: 'receiver_parameter' }] }] })`
		);
		expect(raw.bindingEffects).toContainEqual({ kind: 'segment', owner: 'parameter', from: 'pattern:', to: 'name:' });
	});

	it.each(['rust', 'typescript', 'python'])(
		"takes %s's wired grammar as a base enrich leaves unchanged",
		async (grammar) => {
			checks.count = 0;
			checks.empty = true;
			try {
				await expect(evaluateDsl(join(PACKAGES, grammar, 'grammar.sittir.ts'))).resolves.toBeDefined();
				expect(checks.count).toBeGreaterThan(0);
			} finally {
				checks.empty = false;
			}
		},
		240_000
	);

	it.each(['regex', 'scm'])(
		"completes %s's layer as a base enrich leaves unchanged",
		async (grammar) => {
			const evaluated = await evaluateDsl(join(PACKAGES, grammar, 'grammar.sittir.ts'));
			const record = layerRecordOf({ grammar: evaluated });
			expect(record?.depth).toBe(1);
			const { changed } = await withDslGlobals(async () => enrichFixpoint({ grammar: evaluated } as unknown as GrammarResult, record!.sidecars));
			expect(changed).toEqual([]);
		},
		240_000
	);

	it('refuses a configured layer whose base enrich would reshape', async () => {
		checks.count = 0;
		await expect(
			evaluateSittirGrammar(require.resolve('tree-sitter-c/grammar.js'), 'c', 'bindings: bindings({})')
		).rejects.toThrow(
			/grammar bindings: enrich changes _type_declarator, generic_expression, sized_type_specifier, sized_type_specifier_arm/
		);
		expect(checks.count).toBeGreaterThan(0);
	}, 120_000);
});
