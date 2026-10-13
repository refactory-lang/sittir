import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { lead, match } from '../../dsl/bind.ts';
import { assertGatePasses, unexpectableExpectEntries } from '../../compiler/diagnostics/grammar-diagnostics.ts';
import { deriveLeads, readBindings } from '../index.ts';

let dir: string;
let base: RawGrammar;
let edits: RawGrammar;

beforeAll(async () => {
	dir = mkdtempSync(join(tmpdir(), 'bindings-leads-'));
	const baseModule = join(dir, 'base.mjs');
	writeFileSync(
		baseModule,
		`export default grammar({
	name: 'leadtest',
	rules: {
		source_file: $ => repeat($.function_item),
		function_item: $ => seq('fn', $.identifier, $.parameters, $.arguments),
		parameters: $ => seq('(', optional($.parameters_elements), ')'),
		parameters_elements: $ => seq(field('item', $._parameter), repeat(seq(',', field('item', $._parameter))), optional(',')),
		arguments: $ => seq('[', $.identifier, $.identifier, ']'),
		_parameter: $ => choice($.attributed_parameter, $.required_parameter),
		attributed_parameter: $ => seq(optional($.attribute), choice($.self_parameter, $.parameter)),
		required_parameter: $ => seq(field('pattern', choice($.this, $.identifier)), optional(seq(':', field('type', $.identifier)))),
		parameter: $ => seq(field('name', choice($.self, $.identifier)), ':', $.identifier),
		attribute: _ => '#',
		self_parameter: _ => '&self',
		self: _ => 'self',
		this: _ => 'this',
		identifier: _ => /[a-z]+/
	}
});
`
	);
	base = await evaluateSittirGrammar(baseModule, 'leadtest');
	const editsModule = join(dir, 'edits.mjs');
	writeFileSync(
		editsModule,
		`export default grammar({
	name: 'leadedits',
	rules: {
		source_file: $ => repeat(choice($.function_item, $.method_item, $.closure, $.lambda, $.macro_item, $.macro_elements, $.table, $._table_rows_receiver)),
		function_item: $ => seq('fn', $.parameters),
		parameters: $ => seq('(', optional(field('elements', $.parameters_elements)), ')'),
		parameters_elements: $ => seq(field('item', $.attributed_parameter), repeat(seq(',', field('item', $.attributed_parameter))), optional(',')),
		method_item: $ => seq('method', '(', optional(field('elements', $.method_elements)), ')'),
		method_elements: $ => seq(field('item', $.attributed_parameter), repeat(seq(',', field('item', $.attributed_parameter)))),
		closure: $ => seq('|', optional(field('params', $.closure_elements)), '|'),
		lambda: $ => seq('\\\\', optional(field('args', $.closure_elements)), '->'),
		closure_elements: $ => seq(field('item', $.attributed_parameter), repeat(seq(',', field('item', $.attributed_parameter)))),
		macro_item: $ => seq('macro', '(', optional($.macro_elements), ')'),
		macro_elements: $ => seq(field('item', $.attributed_parameter), repeat(seq(',', field('item', $.attributed_parameter)))),
		table: $ => seq('table', '{', optional(field('rows', $.table_rows)), '}'),
		table_rows: $ => seq(field('item', $.row), repeat(seq(';', field('item', $.row)))),
		row: $ => seq(choice($.attribute, $.identifier), ':', $.identifier),
		_table_rows_receiver: _ => 'recv',
		attributed_parameter: $ => seq(optional($.attribute), choice($.self_parameter, $.parameter, $.variadic_parameter)),
		parameter: $ => seq($._param_name, ':', $.identifier),
		variadic_parameter: $ => seq('...', $._param_name),
		_param_name: $ => field('name', choice($.self, $.identifier)),
		attribute: _ => '#',
		self_parameter: _ => '&self',
		self: _ => 'self',
		identifier: _ => /[a-z]+/
	}
});
`
	);
	edits = await evaluateSittirGrammar(editsModule, 'leadedits');
}, 120_000);

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const FILE = 'packages/leadtest/bindings.scm';
const RECEIVER = '(function_item (parameters (parameters_elements . (attributed_parameter (self_parameter)) @receiver))) @declaration.method';
const derived = async (text: string) => deriveLeads({ file: FILE, base, facts: await readBindings(text) });

describe('deriveLeads', () => {
	it('derives one lead from a capture on the anchored first item of a separated list', async () => {
		expect(await derived(RECEIVER)).toEqual({
			leads: [lead('parameters_elements', 'item', 'receiver', match('attributed_parameter', [match('self_parameter')]))],
			diagnostics: []
		});
	});

	it('derives one lead from several claims on one list whose match trees agree', async () => {
		const result = await derived(`${RECEIVER}\n${RECEIVER.replace('@declaration.method', '@declaration.function')}`);
		expect(result.leads).toHaveLength(1);
		expect(result.diagnostics).toEqual([]);
	});

	it('unions the admits of claims on one list whose root kind and field agree', async () => {
		const typed = '(function_item (parameters (parameters_elements . (attributed_parameter (parameter name: (self))) @receiver))) @declaration.method';
		expect(await derived(`${RECEIVER}\n${typed}`)).toEqual({
			leads: [lead('parameters_elements', 'item', 'receiver', match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] })]))],
			diagnostics: []
		});
	});

	it('refuses claims on one list that anchor different kinds, naming both lines', async () => {
		const other = '(function_item (parameters (parameters_elements . (required_parameter pattern: (this)) @receiver))) @declaration.function';
		const result = await derived(`${RECEIVER}\n${other}`);
		expect(result.leads).toEqual([]);
		expect(result.diagnostics).toMatchObject([
			{
				scope: 'grammar',
				code: 'lead-refused',
				grammar: 'leadtest',
				canProceed: false,
				details: { file: FILE, lines: [1, 2], list: 'parameters_elements', reason: 'the claims anchor different kinds: attributed_parameter, required_parameter' }
			}
		]);
	});

	it('refuses claims on one list that restrict one kind on different fields', async () => {
		const pattern = '(function_item (parameters (parameters_elements . (required_parameter pattern: (this)) @receiver))) @declaration.method';
		const typed = '(function_item (parameters (parameters_elements . (required_parameter type: (identifier)) @receiver))) @declaration.method';
		const result = await derived(`${pattern}\n${typed}`);
		expect(result.leads).toEqual([]);
		expect(result.diagnostics).toMatchObject([{ code: 'lead-refused', details: { lines: [1, 2], reason: 'the claims restrict required_parameter on different fields: pattern, type' } }]);
	});

	it('refuses claims on one list that capture two lead fields', async () => {
		const result = await derived(`${RECEIVER}\n${RECEIVER.replace('@receiver', '@self')}`);
		expect(result.leads).toEqual([]);
		expect(result.diagnostics.map((d) => d.details?.lines)).toEqual([[1, 2]]);
	});

	it('refuses a match tree the lead cannot say, with its claim line and reason', async () => {
		const result = await derived(`\n${RECEIVER.replace('(self_parameter)', '(_)')}`);
		expect(result.leads).toEqual([]);
		expect(result.diagnostics).toMatchObject([{ code: 'lead-refused', details: { file: FILE, lines: [2], reason: 'a wildcard' } }]);
		expect(result.diagnostics[0]?.message).toContain(`${FILE}:2`);
	});

	it('derives no lead from an anchored capture outside a separated list', async () => {
		expect(await derived('(function_item (arguments . (identifier) @receiver)) @declaration.method')).toEqual({ leads: [], diagnostics: [] });
	});

	it('names a narrowed kind by the claim that classifies its pattern', async () => {
		const result = await derived(
			'(function_item (parameters (parameters_elements . (required_parameter pattern: (this)) @receiver))) @declaration.method\n(required_parameter pattern: (this)) @parameter.this'
		);
		expect(result.leads).toEqual([lead('parameters_elements', 'item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter'))]);
	});

	it('names each admit of a union by its own classifying claim, and leaves one without a claim unnamed', async () => {
		const result = await derived(
			`${RECEIVER}\n(function_item (parameters (parameters_elements . (attributed_parameter (parameter name: (self))) @receiver))) @declaration.method\n(parameter name: (self)) @parameter.self.typed`
		);
		expect(result.leads).toEqual([
			lead('parameters_elements', 'item', 'receiver', match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] }, 'typed_self_parameter')]))
		]);
	});

	it('refuses a narrowed kind two classifying claims name differently', async () => {
		const result = await derived(
			'(function_item (parameters (parameters_elements . (required_parameter pattern: (this)) @receiver))) @declaration.method\n(required_parameter pattern: (this)) @parameter.this\n(required_parameter pattern: (this)) @parameter.self'
		);
		expect(result.leads).toEqual([]);
		expect(result.diagnostics).toMatchObject([{ code: 'lead-refused', details: { reason: 'two claims name one variant: parameter.this, parameter.self' } }]);
	});

	it('blocks the gate with a refusal no expectDiagnostics entry can floor', async () => {
		const { diagnostics } = await derived(RECEIVER.replace('(self_parameter)', '(_)'));
		expect(() => assertGatePasses(diagnostics, undefined)).toThrow(/lead-refused/);
		expect(unexpectableExpectEntries('leadtest', { 'lead-refused': ['leadtest'] }).map((record) => record.details?.code)).toEqual(['lead-refused']);
	});

	it('keeps a variant name visible when its kind\'s rule name is, though the catalog stamps the kind hidden in the parse tree', async () => {
		const predictedKinds = base.predictedKinds;
		if (predictedKinds === undefined || !('entries' in predictedKinds)) throw new Error('fixture grammar carries a predicted catalog');
		const stamped = { ...base, predictedKinds: { ...predictedKinds, entries: predictedKinds.entries.map((e) => (e.kind === 'required_parameter' ? { ...e, hidden: true } : e)) } };
		const facts = await readBindings(
			'(function_item (parameters (parameters_elements . (required_parameter pattern: (this)) @receiver))) @declaration.method\n(required_parameter pattern: (this)) @parameter.this'
		);
		expect(deriveLeads({ file: FILE, base: stamped, facts }).leads).toEqual([
			lead('parameters_elements', 'item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter'))
		]);
	});
});

describe('deriveLeads refuses a lead its edit cannot make', () => {
	const refusal = async (text: string) => {
		const result = deriveLeads({ file: FILE, base: edits, facts: await readBindings(text) });
		expect(result.leads).toEqual([]);
		return result.diagnostics;
	};

	it('derives a lead its edit can make', async () => {
		const result = deriveLeads({
			file: FILE,
			base: edits,
			facts: await readBindings('(function_item (parameters (parameters_elements . (attributed_parameter (self_parameter)) @receiver))) @declaration.method')
		});
		expect(result).toEqual({ leads: [lead('parameters_elements', 'item', 'receiver', match('attributed_parameter', [match('self_parameter')]))], diagnostics: [] });
	});

	it('refuses one hidden rule narrowed two ways, naming both claim lines', async () => {
		const diagnostics = await refusal(
			'(function_item (parameters (parameters_elements . (attributed_parameter (parameter name: (self))) @receiver))) @declaration.method\n(function_item (parameters (parameters_elements . (attributed_parameter (variadic_parameter name: (identifier))) @receiver))) @declaration.method'
		);
		expect(diagnostics).toMatchObject([
			{ code: 'lead-refused', canProceed: false, details: { file: FILE, lines: [1, 2], list: 'parameters_elements', reason: "'_param_name' narrows two ways to '_param_name_receiver'" } }
		]);
	});

	it('refuses a list its owners hold under different fields', async () => {
		const diagnostics = await refusal('(closure (closure_elements . (attributed_parameter (self_parameter)) @receiver)) @declaration.function');
		expect(diagnostics).toMatchObject([{ code: 'lead-refused', details: { lines: [1], list: 'closure_elements', reason: 'the list sits in fields args, params' } }]);
	});

	it('refuses a list an owner holds other than as a field\'s content', async () => {
		const diagnostics = await refusal('(macro_item (macro_elements . (attributed_parameter (self_parameter)) @receiver)) @declaration.function');
		expect(diagnostics).toMatchObject([{ code: 'lead-refused', details: { lines: [1], list: 'macro_elements', reason: "'source_file' holds the list other than as a field's content" } }]);
	});

	it('refuses a lead that mints a name the grammar already holds', async () => {
		const diagnostics = await refusal('(table (table_rows . (row (attribute)) @receiver)) @declaration.function');
		expect(diagnostics).toMatchObject([
			{ code: 'lead-refused', details: { lines: [1], list: 'table_rows', reason: "'table_rows' mints '_table_rows_receiver', which the grammar already names" } }
		]);
	});
	it('refuses a lead whose edit conflicts with a lead on another list, checked in the order the edit applies them', async () => {
		const result = deriveLeads({
			file: FILE,
			base: edits,
			facts: await readBindings(
				'(function_item (parameters (parameters_elements . (attributed_parameter (parameter name: (self))) @receiver))) @declaration.method\n(method_item (method_elements . (attributed_parameter (parameter name: (identifier))) @receiver)) @declaration.method'
			)
		});
		expect(result.leads.map((l) => l.list)).toEqual(['method_elements']);
		expect(result.diagnostics).toMatchObject([
			{ code: 'lead-refused', details: { lines: [1], list: 'parameters_elements', reason: "'parameter' narrows two ways to '_parameter_receiver'" } }
		]);
	});
});
