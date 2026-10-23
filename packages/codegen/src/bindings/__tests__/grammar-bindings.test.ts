import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../__tests__/helpers/sittir-grammar.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { lead, match } from '../../dsl/bind.ts';
import { type BindingFacts, type ClaimFact, type MemberRoute, type ModelNode, type SlotModel, deriveGrammarBindings, loadBindingsModule, printBindingsModule } from '../index.ts';

const claim = (vocab: string, kind: string, extra: Partial<ClaimFact> = {}): ClaimFact => ({
	vocab,
	kind,
	field: null,
	predicates: [],
	toplevel: true,
	within: [],
	fieldLiterals: {},
	tokens: [],
	children: [],
	...extra
});

const FACTS: BindingFacts = {
	claims: [
		claim('declaration.variable', 'let_item'),
		claim('expression.call', 'call'),
		claim('expression.call.method', 'call', { tokens: ['.'] }),
		claim('type.named', 'nope')
	],
	members: [{ route: 'rename', owner: 'let_item', name: 'name', field: 'left', kind: null, after: null, anchor: null }],
	containers: [],
	templates: [],
	unclaimed: []
};
const FILE = 'packages/bindtest/bindings.scm';
const LEADS = [lead('parameters_elements', 'item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter'), match('attributed_parameter', [match('self_parameter')]))];
const named = (...names: string[]): MemberRoute[] => names.map((name) => ({ route: 'kind', name, kind: name, path: undefined }));
const NO_MEMBERS: ReadonlyMap<string, readonly MemberRoute[]> = new Map();
const NO_MODEL: SlotModel = new Map();
const ROUTES = {
	members: NO_MEMBERS,
	vocabOf: new Map([
		['let_item', 'declaration.variable'],
		['call', 'expression.call'],
		['nope', 'type.named']
	])
};
const VOCABULARY = new Map([
	['declaration.variable', new Set(['name'])],
	['expression.call', new Set<string>()]
]);

let dir: string;
let base: RawGrammar;

beforeAll(async () => {
	dir = mkdtempSync(join(tmpdir(), 'bindings-derive-'));
	const baseModule = join(dir, 'base.mjs');
	writeFileSync(
		baseModule,
		`export default grammar({
	name: 'bindtest',
	rules: {
		source_file: $ => repeat($._item),
		_item: $ => choice($.let_item, $.call),
		let_item: $ => seq('let', field('left', $.identifier), ';'),
		call: $ => seq($.identifier, '(', ')', ';'),
		identifier: _ => /[a-z]+/
	}
});
`
	);
	base = await evaluateSittirGrammar(baseModule, 'bindtest');
}, 120_000);

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('deriveGrammarBindings', () => {
	it('renames each plain claimed kind to its path\'s bound name, subkind first', () => {
		const { bindings } = deriveGrammarBindings({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.renames).toEqual({ let_item: 'variable_declaration', call: 'call_expression' });
	});

	it('makes no grammar change for a slot a claim drops', () => {
		const facts: BindingFacts = { ...FACTS, members: [{ route: 'dropped', owner: 'let_item', field: 'left', kind: null, after: null, anchor: null }] };
		const { bindings, report } = deriveGrammarBindings({ file: FILE, facts, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.patches).toEqual(new Map());
		expect(report.residue.filter((r) => r.row.startsWith('let_item.'))).toEqual([]);
	});

	it('patches a member routed to a field of another name into a field of the member\'s name', () => {
		const { bindings } = deriveGrammarBindings({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.patches).toEqual(new Map([['let_item', [[{ path: '1', edit: { field: 'name' } }]]]]));
	});

	it('patches no field for a member an anchor ties to its neighbour: its slot is a position, not a field', () => {
		const left = { route: 'rename', owner: 'let_item', name: 'name', field: 'left', kind: null, after: null, anchor: null } as const;
		const facts = { ...FACTS, members: [{ ...left, adjacent: { previous: { field: null, kind: 'identifier', after: null, anchor: null } } }] };
		const { bindings, report } = deriveGrammarBindings({ file: FILE, facts, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.patches).toEqual(new Map());
		expect(report.residue).toContainEqual({ cause: 'positional child', row: 'let_item.name' });
	});

	it('leaves each claim it does not turn into a grammar change in the residue, with the reason', () => {
		const { report } = deriveGrammarBindings({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(report.residue).toEqual([
			{ cause: 'token refinement', row: 'call → expression.call.method' },
			{ cause: 'not a base rule', row: 'nope → type.named' }
		]);
	});

	it('names a kind claimed plainly twice by its first claim, and checks its members against that claim\'s vocabulary kind', () => {
		const facts: BindingFacts = {
			...FACTS,
			claims: [claim('expression.call', 'call'), claim('expression.invocation', 'call')],
			members: [{ route: 'rename', owner: 'call', name: 'callee', field: null, kind: 'identifier', after: null, anchor: null }]
		};
		const { bindings, report } = deriveGrammarBindings({ file: FILE, facts, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.renames).toEqual({ call: 'call_expression' });
		expect(report.residue).toEqual([
			{ cause: 'kind named by an earlier claim', row: 'call → expression.invocation' },
			{ cause: 'member not in the vocabulary', row: 'call.callee' }
		]);
	});

	it('names no form by a claim that refines its supertype\'s claim with a test of its own, and still names a form by a plain claim', () => {
		const form = (kind: string, extra: Partial<ModelNode> = {}): ModelNode => ({
			kind,
			modelType: 'branch',
			slots: [],
			subtypes: [],
			elementKinds: [],
			enumMembers: [],
			text: null,
			pattern: null,
			variantOf: '_item',
			shownAs: [],
			...extra
		});
		const model: SlotModel = new Map([
			['_item', form('_item', { modelType: 'supertype', subtypes: ['let_item', 'call'], variantOf: null })],
			['let_item', form('let_item')],
			['call', form('call')]
		]);
		const parenthesized = { subject: { up: 0, down: [] }, kinds: ['identifier'], captured: false };
		const facts: BindingFacts = {
			...FACTS,
			claims: [claim('expression', '_item'), claim('expression.let', 'let_item'), claim('expression.call', 'call', { children: [parenthesized] })],
			members: []
		};
		const { bindings, report } = deriveGrammarBindings({ file: FILE, facts, base, vocabMembers: VOCABULARY, routes: ROUTES, model });
		expect(bindings.renames.let_item).toBe('let_expression');
		expect(bindings.renames).not.toHaveProperty('call');
		expect(report.residue).toContainEqual({ cause: 'child-pattern refinement', row: 'call → expression.call' });
	});

	it('checks a form\'s members against the vocabulary kind the routes name it by, though its own claims all refine its supertype\'s', () => {
		const form = (kind: string, extra: Partial<ModelNode> = {}): ModelNode => ({
			kind,
			modelType: 'branch',
			slots: [],
			subtypes: [],
			elementKinds: [],
			enumMembers: [],
			text: null,
			pattern: null,
			variantOf: '_item',
			shownAs: [],
			...extra
		});
		const model: SlotModel = new Map([
			['_item', form('_item', { modelType: 'supertype', subtypes: ['let_item', 'call'], variantOf: null })],
			['let_item', form('let_item')],
			['call', form('call')]
		]);
		const parenthesized = { subject: { up: 0, down: [] }, kinds: ['identifier'], captured: false };
		const facts: BindingFacts = { ...FACTS, claims: [claim('expression', '_item'), claim('expression.call', 'call', { children: [parenthesized] })], members: [{ route: 'rename', owner: 'call', name: 'callee', field: null, kind: 'identifier', after: null, anchor: null }] };
		const routes = { members: NO_MEMBERS, vocabOf: new Map([['_item', 'expression'], ['call', 'expression']]) };
		const { report } = deriveGrammarBindings({ file: FILE, facts, base, vocabMembers: new Map([['expression', new Set(['identifier'])]]), routes, model });
		expect(report.residue).toContainEqual({ cause: 'member not in the vocabulary', row: 'call.callee' });
	});

	describe('two kinds claiming one path', () => {
		const sharing = (members: BindingFacts['members']): BindingFacts => ({
			...FACTS,
			claims: [claim('expression.call', 'call'), claim('expression.call', 'let_item')],
			members
		});
		const vocab = new Map([['expression.call', new Set(['name', 'callee', 'private', 'key'])]]);
		const routed = (call: readonly string[], letItem: readonly string[]): ReadonlyMap<string, readonly MemberRoute[]> =>
			new Map([
				['call', named(...call)],
				['let_item', named(...letItem)]
			]);
		const derive = (facts: BindingFacts, routedMembers: ReadonlyMap<string, readonly MemberRoute[]>) =>
			deriveGrammarBindings({ file: FILE, facts, base, vocabMembers: vocab, routes: { members: routedMembers, vocabOf: new Map([['call', 'expression.call'], ['let_item', 'expression.call']]) }, model: NO_MODEL });

		it('aliases both to the path\'s name when they supply the same members, as a form restricted to a context does', () => {
			const { report } = derive(sharing([]), routed(['parameters', 'body'], ['body', 'parameters']));
			expect(report.aliases).toEqual({ call: 'call_expression', let_item: 'call_expression' });
		});

		it('keeps the further kind apart when it supplies a member the first does not, captured or not', () => {
			const { bindings, report } = derive(sharing([]), routed(['name', 'value'], ['name', 'type', 'value']));
			expect(report.aliases).toEqual({});
			expect(bindings.renames).toEqual({ call: 'call_expression' });
			expect(report.residue).toContainEqual({ cause: 'kind kept apart by its shape', row: 'let_item → expression.call' });
		});

		it('keeps the further kind apart when a flag reads it', () => {
			const facts = sharing([{ route: 'kind', owner: 'call', name: 'private', member: 'callee', kind: 'let_item' }]);
			const { bindings, report } = derive(facts, routed([], []));
			expect(report.aliases).toEqual({});
			expect(bindings.renames).toEqual({ call: 'call_expression' });
			expect(report.residue).toContainEqual({ cause: 'kind kept apart by its shape', row: 'let_item → expression.call' });
		});

		it('realizes a flag without a field edit', () => {
			const facts = sharing([{ route: 'kind', owner: 'call', name: 'private', member: 'callee', kind: 'let_item' }]);
			const { bindings, report } = derive(facts, routed([], []));
			expect(bindings.patches.size).toBe(0);
			expect(report.residue.filter((r) => r.row === 'call.private')).toEqual([]);
		});
	});


	it('keeps a renamed kind visible when its rule name is, though the catalog stamps it hidden in the parse tree', () => {
		const predictedKinds = base.predictedKinds;
		if (predictedKinds === undefined || !('entries' in predictedKinds)) throw new Error('fixture grammar carries a predicted catalog');
		const stamped = { ...base, predictedKinds: { ...predictedKinds, entries: predictedKinds.entries.map((e) => (e.kind === 'let_item' ? { ...e, hidden: true } : e)) } };
		const { bindings } = deriveGrammarBindings({ file: FILE, facts: FACTS, base: stamped, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.renames).toMatchObject({ let_item: 'variable_declaration' });
	});

	it('derives the leads and their refusals beside the other bindings', () => {
		const { bindings, diagnostics } = deriveGrammarBindings({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.leads).toEqual([]);
		expect(diagnostics).toEqual([]);
	});

	it('leaves a member its vocabulary kind does not declare in the residue', () => {
		const { bindings, report } = deriveGrammarBindings({ file: FILE, facts: FACTS, base, vocabMembers: new Map([['declaration.variable', new Set<string>()]]), routes: ROUTES, model: NO_MODEL });
		expect(bindings.patches.size).toBe(0);
		expect(report.residue).toContainEqual({ cause: 'member not in the vocabulary', row: 'let_item.name' });
	});
});

describe('printBindingsModule', () => {
	it('prints the grammar bindings with the hash of the sources it was derived from, and nothing else', () => {
		const { bindings } = deriveGrammarBindings({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		const text = printBindingsModule(bindings, 'h');
		expect(text).toContain('export default bindings({\n\thash: "h",');
		expect(text).toContain('rename("let_item", "variable_declaration")');
		expect(text).toContain('let_item: { "1": field("name") }');
		expect(text).not.toContain('facts');
	});

	it('prints no leads, and imports neither builder, where none are derived', () => {
		const { bindings } = deriveGrammarBindings({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		const text = printBindingsModule(bindings, 'h');
		expect(text).toContain('\tleads: [],\n\tsplits: ');
		expect(text).not.toMatch(/\b(lead|match)\b,/);
	});

	it('prints each lead with its match tree, beside the renames and splits', () => {
		const text = printBindingsModule({ patches: new Map(), renames: {}, leads: LEADS, splits: [] }, 'h');
		expect(text).toContain(
			'\tleads: [\n\t\tlead("parameters_elements", "item", "receiver", match("required_parameter", { "pattern": [match("this")] }, "this_parameter"), match("attributed_parameter", [match("self_parameter")]))\n\t],'
		);
		expect(text).toMatch(/import \{ bindings, lead, match \}/);
	});
});

describe('loadBindingsModule', () => {
	it('reads committed grammar bindings, alias patches included, outside the grammar\'s evaluation', async () => {
		const pkg = mkdtempSync(join(dir, 'pkg-'));
		const bindings = { patches: new Map([['call', [[{ path: '0/0', edit: { alias: { from: 'identifier', to: 'callee' } } }]]]]), renames: {}, leads: [], splits: [] };
		writeFileSync(join(pkg, 'grammar.bindings.ts'), printBindingsModule(bindings, 'h').replace("'../codegen/src/dsl/dsl-authoring.ts'", JSON.stringify(join(__dirname, '../../dsl/dsl-authoring.ts'))).replace(/^\/\/\/ <reference.*\n/m, ''));
		expect((await loadBindingsModule(pkg))?.hash).toBe('h');
	});

	it('reads the printed leads back through the builders', async () => {
		const pkg = mkdtempSync(join(dir, 'pkg-'));
		const text = printBindingsModule({ patches: new Map(), renames: {}, leads: LEADS, splits: [] }, 'h');
		writeFileSync(join(pkg, 'grammar.bindings.ts'), text.replace("'../codegen/src/dsl/dsl-authoring.ts'", JSON.stringify(join(__dirname, '../../dsl/dsl-authoring.ts'))).replace(/^\/\/\/ <reference.*\n/m, ''));
		expect((await loadBindingsModule(pkg))?.leads).toEqual(LEADS);
	});

	it('finds no grammar bindings where none are committed', async () => {
		expect(await loadBindingsModule(mkdtempSync(join(dir, 'empty-')))).toBeUndefined();
	});
});
