import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar, writeSittirGrammarPackage } from '../../compiler/__tests__/_sittir-grammar.ts';
import { evaluate } from '../../compiler/evaluate.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import type { GrammarBindingsInput } from '../grammar-bindings.ts';
import { NO_FILE_TYPES } from '../../compiler/upstream-file-types.ts';
import { lead, split } from '../../dsl/bind.ts';
import { match } from '../../dsl/primitives/narrow.ts';
import { BINDINGS_MODULE, layerPath } from '../../grammars.ts';
import {
	type BindingFacts,
	type ClaimFact,
	type GrammarBindings,
	type MemberRoute,
	type ModelNode,
	type SlotModel,
	deriveGrammarBindings,
	loadBindingsHash,
	printBindingsModule,
	REGENERATE_BINDINGS_COMMAND
} from '../index.ts';

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
let baseModule: string;
let base: RawGrammar;

// The fixture's layer is its own evaluated rules; a case that needs a different layer passes `layerRules` itself.
const bind = (input: Omit<GrammarBindingsInput, 'layerRules'> & Partial<Pick<GrammarBindingsInput, 'layerRules'>>) =>
	deriveGrammarBindings({ layerRules: input.base.rules, ...input } as GrammarBindingsInput);

beforeAll(async () => {
	dir = mkdtempSync(join(tmpdir(), 'bindings-derive-'));
	baseModule = join(dir, 'base.mjs');
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
	it("renames each plain claimed kind to its path's bound name, subkind first", () => {
		const { bindings } = bind({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.renames).toEqual({ let_item: 'variable_declaration', call: 'call_expression' });
	});

	it('makes no grammar change for a slot a claim drops', () => {
		const facts: BindingFacts = {
			...FACTS,
			members: [{ route: 'dropped', owner: 'let_item', field: 'left', kind: null, after: null, anchor: null }]
		};
		const { bindings, report } = bind({ file: FILE, facts, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.patches).toEqual(new Map());
		expect(report.residue.filter((r) => r.row.startsWith('let_item.'))).toEqual([]);
	});

	it('lands a field patch on the layer rule index when a blank() member sits before the field', () => {
		const layerRules = {
			...base.rules,
			let_item: {
				type: 'SEQ',
				members: [{ type: 'BLANK' }, { type: 'STRING', value: 'let' }, { type: 'FIELD', name: 'left', content: { type: 'SYMBOL', name: 'identifier' } }, { type: 'STRING', value: ';' }]
			}
		};
		const { bindings } = bind({ layerRules, file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL } as never);
		expect(bindings.patches).toEqual(new Map([['let_item', [[{ path: '2', edit: { field: 'name' } }]]]]));
	});

	it("patches a member routed to a field of another name into a field of the member's name", () => {
		const { bindings } = bind({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.patches).toEqual(new Map([['let_item', [[{ path: '1', edit: { field: 'name' } }]]]]));
	});

	it('patches no field for a member an anchor ties to its neighbour: its slot is a position, not a field', () => {
		const left = { route: 'rename', owner: 'let_item', name: 'name', field: 'left', kind: null, after: null, anchor: null } as const;
		const facts = { ...FACTS, members: [{ ...left, adjacent: { previous: { field: null, kind: 'identifier', after: null, anchor: null } } }] };
		const { bindings, report } = bind({ file: FILE, facts, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.patches).toEqual(new Map());
		expect(report.residue).toContainEqual({ cause: 'positional child', row: 'let_item.name' });
	});

	it('leaves each claim it does not turn into a grammar change in the residue, with the reason', () => {
		const { report } = bind({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(report.residue).toEqual([
			{ cause: 'token refinement', row: 'call → expression.call.method' },
			{ cause: 'not a base rule', row: 'nope → type.named' }
		]);
	});

	it("names a kind claimed plainly twice by its first claim, and checks its members against that claim's vocabulary kind", () => {
		const facts: BindingFacts = {
			...FACTS,
			claims: [claim('expression.call', 'call'), claim('expression.invocation', 'call')],
			members: [{ route: 'rename', owner: 'call', name: 'callee', field: null, kind: 'identifier', after: null, anchor: null }]
		};
		const { bindings, report } = bind({
			file: FILE,
			facts,
			base,
			vocabMembers: VOCABULARY,
			routes: ROUTES,
			model: NO_MODEL
		});
		expect(bindings.renames).toEqual({ call: 'call_expression' });
		expect(report.residue).toEqual([
			{ cause: 'kind named by an earlier claim', row: 'call → expression.invocation' },
			{ cause: 'member not in the vocabulary', row: 'call.callee' }
		]);
	});

	it("names no form by a claim that refines its supertype's claim with a test of its own, and still names a form by a plain claim", () => {
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
		const { bindings, report } = bind({ file: FILE, facts, base, vocabMembers: VOCABULARY, routes: ROUTES, model });
		expect(bindings.renames.let_item).toBe('let_expression');
		expect(bindings.renames).not.toHaveProperty('call');
		expect(report.residue).toContainEqual({ cause: 'child-pattern refinement', row: 'call → expression.call' });
	});

	it("checks a form's members against the vocabulary kind the routes name it by, though its own claims all refine its supertype's", () => {
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
		const { report } = bind({ file: FILE, facts, base, vocabMembers: new Map([['expression', new Set(['identifier'])]]), routes, model });
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
			bind({ file: FILE, facts, base, vocabMembers: vocab, routes: { members: routedMembers, vocabOf: new Map([['call', 'expression.call'], ['let_item', 'expression.call']]) }, model: NO_MODEL });

		it("aliases both to the path's name when they supply the same members, as a form restricted to a context does", () => {
			const { report } = derive(sharing([]), routed(['parameters', 'body'], ['body', 'parameters']));
			expect(report.aliases).toEqual({ call: 'call_expression', let_item: 'call_expression' });
		});

		it('keeps the further kind apart when it supplies a member the first does not, captured or not', () => {
			const { bindings, report } = derive(sharing([]), routed(['name', 'value'], ['name', 'type', 'value']));
			expect(report.aliases).toEqual({});
			expect(bindings.renames).toEqual({ call: 'call_expression' });
			expect(report.residue).toContainEqual({ cause: 'kind kept apart by its shape', row: 'let_item → expression.call' });
		});

		it('keeps a terminal and a nonterminal apart even when both supply no portable members', () => {
			const facts = {
				...FACTS,
				claims: [claim('expression.call', 'call'), claim('expression.call', 'identifier')],
				members: []
			};
			const { bindings, report } = derive(facts, NO_MEMBERS);
			expect(report.aliases).toEqual({});
			expect(bindings.renames).toEqual({ call: 'call_expression' });
			expect(report.residue).toContainEqual({
				cause: 'kind kept apart by its shape',
				row: 'identifier → expression.call'
			});
		});

		it('merges only base rules, so a claim whose one other kind is no base rule renames its kind, and the report names the partition', () => {
			const facts = {
				...FACTS,
				claims: [claim('expression.call', 'nope'), claim('expression.call', 'call'), claim('expression.call', 'let_item')],
				members: []
			};
			const { bindings, report } = derive(facts, routed([], ['name']));
			expect(report.aliases).toEqual({});
			expect(bindings.patches.size).toBe(0);
			expect(bindings.renames).toEqual({ call: 'call_expression' });
			expect(report.residue).toContainEqual({
				cause: 'claimed kinds not merged',
				row: 'expression.call: call | let_item; not a base rule: nope'
			});
		});

		it('keeps the further kind apart when a flag reads it', () => {
			const facts = sharing([{ route: 'kind', owner: 'call', name: 'private', member: 'callee', kind: 'let_item' }]);
			const { bindings, report } = derive(facts, routed([], []));
			expect(report.aliases).toEqual({});
			expect(bindings.renames).toEqual({ call: 'call_expression' });
			expect(report.residue).toContainEqual({
				cause: 'kind kept apart by its shape',
				row: 'let_item → expression.call'
			});
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
		const { bindings } = bind({ file: FILE, facts: FACTS, base: stamped, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.renames).toMatchObject({ let_item: 'variable_declaration' });
	});

	it('derives the leads and their refusals beside the other bindings', () => {
		const { bindings, diagnostics } = bind({ file: FILE, facts: FACTS, base, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL });
		expect(bindings.leads).toEqual([]);
		expect(diagnostics).toEqual([]);
	});

	it('leaves a member its vocabulary kind does not declare in the residue', () => {
		const { bindings, report } = bind({ file: FILE, facts: FACTS, base, vocabMembers: new Map([['declaration.variable', new Set<string>()]]), routes: ROUTES, model: NO_MODEL });
		expect(bindings.patches.size).toBe(0);
		expect(report.residue).toContainEqual({ cause: 'member not in the vocabulary', row: 'let_item.name' });
	});
});

const EDITS: GrammarBindings['patches'] = new Map([
	['let_item', [[{ path: '1', edit: { field: 'name' } }]]],
	['call', [[{ path: '0/0', edit: { alias: 'callee' } }]]]
]);

describe('printBindingsModule', () => {
	it('prints a layer over grammar.sittir.ts: the hash and the renames as data, then each edit and lead as an entry', () => {
		const text = printBindingsModule({ patches: EDITS, renames: { let_item: 'variable_declaration' }, leads: LEADS, splits: [] }, 'h');
		expect(text).toBe(`// Generated from bindings.scm and the vocabulary by \`${REGENERATE_BINDINGS_COMMAND}\`. Do not edit.
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import sittir from './grammar.sittir.ts';
import { alias, enrich, field, lead, match, wire } from '../codegen/src/dsl/dsl-authoring.ts';

export const hash = "h";

export const renames = {
	let_item: "variable_declaration"
};

export default grammar(
	enrich(sittir),
	wire({
		generated: true,
		edits: {
			let_item: { "1": field("name") },
			call: { "0/0": alias("callee") },
			parameters_elements: { ".": lead("item", "receiver", match("required_parameter", { "pattern": [match("this")] }, "this_parameter"), match("attributed_parameter", [match("self_parameter")])) }
		}
	})
);
`);
	});

	it('prints the derived bindings with the hash of the sources they came from, and nothing else', () => {
		const { bindings } = bind({
			file: FILE,
			facts: FACTS,
			base,
			vocabMembers: VOCABULARY,
			routes: ROUTES,
			model: NO_MODEL
		});
		const text = printBindingsModule(bindings, 'h');
		expect(text).toContain('export const hash = "h";');
		expect(text).toContain('\tlet_item: "variable_declaration"');
		expect(text).toContain('\t\t\tlet_item: { "1": field("name") }');
		expect(text).not.toContain('facts');
	});

	it('computes splits but prints none, and imports lead and match only beside a lead', () => {
		const text = printBindingsModule(
			{ patches: new Map([['let_item', [[{ path: '1', edit: { field: 'name' } }]]]]), renames: {}, leads: [], splits: [split('let_item', 'let_statement', { within: ['source_file'], containers: [] })] },
			'h'
		);
		expect(text).toContain("import { enrich, field, wire } from '../codegen/src/dsl/dsl-authoring.ts';");
		expect(text).toContain('export const renames = {};');
		expect(text).not.toMatch(/split|let_statement/);
	});

	it('gives a kind its patch sets first, then one set per lead on it', () => {
		const text = printBindingsModule({ patches: new Map([['parameters_elements', [[{ path: '0', edit: { field: 'item' } }]]]]), renames: {}, leads: LEADS, splits: [] }, 'h');
		expect(text).toContain('\t\t\tparameters_elements: [{ "0": field("item") }, { ".": lead("item", "receiver", ');
	});
});

describe('loadBindingsHash', () => {
	it('reads the hash a printed layer exports, without evaluating the layer', async () => {
		const pkg = mkdtempSync(join(dir, 'pkg-'));
		writeFileSync(join(pkg, BINDINGS_MODULE), printBindingsModule({ patches: EDITS, renames: {}, leads: LEADS, splits: [] }, 'h'));
		expect(await loadBindingsHash(pkg)).toBe('h');
	});

	it('finds no hash in a layer that exports none, nor where no layer is committed', async () => {
		const pkg = mkdtempSync(join(dir, 'pkg-'));
		writeFileSync(join(pkg, BINDINGS_MODULE), 'export const renames = {};\n');
		expect(await loadBindingsHash(pkg)).toBeUndefined();
		expect(await loadBindingsHash(mkdtempSync(join(dir, 'empty-')))).toBeUndefined();
	});
});

describe('the printed layer', () => {
	it('evaluates over the layer beside it, with its field and alias edits applied', async () => {
		const pkg = mkdtempSync(join(dir, 'pkg-'));
		writeSittirGrammarPackage(pkg, baseModule, 'bindtest');
		const printed = printBindingsModule({ patches: EDITS, renames: {}, leads: [], splits: [] }, 'h');
		writeFileSync(
			join(pkg, BINDINGS_MODULE),
			printed.replace("'../codegen/src/dsl/dsl-authoring.ts'", JSON.stringify(join(__dirname, '../../dsl/dsl-authoring.ts'))).replace(/^\/\/\/ <reference.*\n/m, '')
		);
		const raw = await evaluate(layerPath({ dir: pkg }, 'top'), NO_FILE_TYPES);
		expect(JSON.stringify(raw.rules.let_item)).toContain('"name":"name"');
		expect(JSON.stringify(raw.rules.let_item)).not.toContain('"name":"left"');
		expect(JSON.stringify(raw.rules.call)).toContain('"value":"callee"');
	}, 60_000);
});

describe('a child that shares a union slot', () => {
	const base = (call: string, extra: string): string => `export default grammar({
	name: 'bindtest',
	rules: {
		source_file: $ => repeat($._item),
		_item: $ => choice($.let_item, $.call),
		let_item: $ => seq('let', field('left', $.identifier), ';'),
		call: $ => ${call},
		identifier: _ => /[a-z]+/${extra}
	}
});
`;
	let union: RawGrammar;
	let lone: RawGrammar;

	beforeAll(async () => {
		const unionBase = join(dir, 'union.mjs');
		const loneBase = join(dir, 'lone.mjs');
		writeFileSync(unionBase, base("seq(choice($.identifier, $.number), '(', ')', ';')", ",\n\t\tnumber: _ => /[0-9]+/"));
		writeFileSync(loneBase, base("seq(choice($.identifier, 'x'), '(', ')', ';')", ""));
		union = await evaluateSittirGrammar(unionBase, "bindtest");
		lone = await evaluateSittirGrammar(loneBase, "bindtest");
	}, 120_000);

	const modelWith = (kinds: readonly string[]): SlotModel =>
		new Map([
			[
				"call",
				{
					kind: "call",
					modelType: "branch",
					slots: [{ name: "content", propertyName: "content", required: true, multiple: false, storage: "verbatim", kinds, terminals: [] }],
					subtypes: [],
					elementKinds: [],
					enumMembers: [],
					text: null,
					pattern: null,
					variantOf: null,
					shownAs: []
				} as ModelNode
			]
		]);
	const vocab = new Map([["expression.call", new Set(["callee"])]]);
	const facts: BindingFacts = {
		...FACTS,
		claims: [claim("expression.call", "call")],
		members: [{ route: "rename", owner: "call", name: "callee", field: null, kind: "identifier", after: null, anchor: null }]
	};

	it("takes no field wrap and is realized as a member when its slot holds other kinds too", () => {
		const { bindings, report } = bind({ file: FILE, facts, base: union, vocabMembers: vocab, routes: ROUTES, model: modelWith(["identifier", "number"]) });
		expect(report.fieldWraps).toEqual([]);
		expect(report.fieldRenames).toEqual([]);
		expect(report.realizedMembers).toEqual(["call.callee"]);
		expect(bindings.patches.get("call")).toBeUndefined();
	});

	it("still wraps a child that sits alone in its slot", () => {
		const { bindings, report } = bind({ file: FILE, facts, base: lone, vocabMembers: vocab, routes: ROUTES, model: modelWith(["identifier"]) });
		expect(report.fieldWraps).toEqual([{ owner: "call", field: "callee", target: { symbol: "identifier" } }]);
		expect(bindings.patches.get("call")).toEqual([[{ path: "0/0", edit: { field: "callee" } }]]);
	});
});
