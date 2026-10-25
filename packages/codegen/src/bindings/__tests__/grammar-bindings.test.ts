import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar, writeSittirGrammarPackage } from '../../__tests__/helpers/sittir-grammar.ts';
import { evaluate } from '../../dsl/evaluate.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import type { GrammarBindingsInput } from '../grammar-bindings.ts';
import { NO_FILE_TYPES } from '../../compiler/upstream-file-types.ts';
import { lead, type Split } from '../../dsl/bind.ts';
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
	absent: [],
	tokens: [],
	children: [],
	...extra
});

const FACTS: BindingFacts = {
	claims: [
		claim('declaration.variable', 'let_item'),
		claim('expression.call', 'call'),
		claim('expression.call.method', 'call', { tokens: ['.'] }),
		claim('type.unit', 'nope')
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
		['nope', 'type.unit']
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
			{ cause: 'not a base rule', row: 'nope → type.unit' }
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
			splitFrom: null,
			aliasStorage: null,
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
			splitFrom: null,
			aliasStorage: null,
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

	it("places a split through the owner's field that reaches its container, names each visible clone by its place, and steps each holder's authored field on the way", () => {
		const symbol = (name: string) => ({ type: 'SYMBOL', name });
		const rules = {
			...base.rules,
			trait_x: { type: 'SEQ', members: [{ type: 'STRING', value: 'trait' }, { type: 'FIELD', name: 'body', content: symbol('list_x') }] },
			class_x: { type: 'SEQ', members: [{ type: 'STRING', value: 'class' }, { type: 'FIELD', name: 'body', content: symbol('_suite_x') }] },
			_suite_x: { type: 'CHOICE', members: [symbol('block_x'), symbol('identifier')] },
			list_x: { type: 'REPEAT', content: symbol('fn_x') },
			block_x: {
				type: 'FIELD',
				name: 'statements',
				metadata: { fieldSource: 'enriched' },
				content: { type: 'REPEAT', content: { type: 'CHOICE', members: [symbol('fn_x'), symbol('deco_x')] } }
			},
			deco_x: { type: 'SEQ', members: [symbol('identifier'), { type: 'FIELD', name: 'definition', content: symbol('fn_x') }] },
			fn_x: { type: 'SEQ', members: [{ type: 'STRING', value: 'fn' }, symbol('identifier')] }
		};
		const facts: BindingFacts = {
			...FACTS,
			claims: [
				claim('declaration.method', 'fn_x', { toplevel: false, within: ['list_x', 'trait_x'] }),
				claim('declaration.method', 'fn_x', { toplevel: false, within: ['block_x', 'class_x'] }),
				claim('declaration.method', 'fn_x', { toplevel: false, within: ['deco_x', 'block_x', 'class_x'] })
			],
			members: []
		};
		const { bindings } = bind({ file: FILE, facts, base: { ...base, rules }, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL } as never);
		const body = { field: 'body', kind: 'block_x', as: 'block_x_class_x' };
		expect(bindings.splits).toEqual([
			{ owner: 'trait_x', path: [{ field: 'body', kind: 'list_x', as: 'trait_x_body' }, { field: null, kind: 'fn_x', as: null }], as: 'method_declaration' },
			{ owner: 'class_x', path: [body, { field: null, kind: 'fn_x', as: null }], as: 'method_declaration' },
			{
				owner: 'class_x',
				path: [body, { field: null, kind: 'deco_x', as: 'deco_x_class_x' }, { field: 'definition', kind: 'fn_x', as: null }],
				as: 'method_declaration'
			}
		]);
	});

	it('leaves a supertype a split path enters unnamed, so its clone stays hidden', () => {
		const symbol = (name: string) => ({ type: 'SYMBOL', name });
		const rules = {
			...base.rules,
			class_y: { type: 'SEQ', members: [{ type: 'STRING', value: 'class' }, { type: 'FIELD', name: 'body', content: symbol('block_y') }] },
			block_y: { type: 'REPEAT', content: symbol('stmt_y') },
			stmt_y: { type: 'CHOICE', members: [symbol('fn_y'), symbol('identifier')] },
			fn_y: { type: 'SEQ', members: [{ type: 'STRING', value: 'fn' }, symbol('identifier')] }
		};
		const facts: BindingFacts = {
			...FACTS,
			claims: [claim('declaration.method', 'fn_y', { toplevel: false, within: ['stmt_y', 'block_y', 'class_y'] })],
			members: []
		};
		const grammar = { ...base, rules, supertypes: [symbol('stmt_y')] };
		const { bindings } = bind({ file: FILE, facts, base: grammar, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL } as never);
		expect(bindings.splits).toEqual([
			{
				owner: 'class_y',
				path: [
					{ field: 'body', kind: 'block_y', as: 'class_y_body' },
					{ field: null, kind: 'stmt_y', as: null },
					{ field: null, kind: 'fn_y', as: null }
				],
				as: 'method_declaration'
			}
		]);
	});

	describe("a claim on a word's text", () => {
		const symbol = (name: string) => ({ type: 'SYMBOL', name });
		const named = (leaf: string, content: object) => ({ type: 'FIELD', name: 'name', content: { type: 'ALIAS', named: true, value: leaf, content } });
		const optionalField = (name: string, text: string) => ({ type: 'CHOICE', members: [{ type: 'FIELD', name, content: { type: 'STRING', value: text } }, { type: 'BLANK' }] });
		const literalGrammar = (): RawGrammar => {
			const rules = {
				...base.rules,
				class_m: { type: 'SEQ', members: [{ type: 'STRING', value: 'class' }, { type: 'FIELD', name: 'body', content: { type: 'REPEAT', content: symbol('member_m') } }] },
				member_m: { type: 'SEQ', members: [symbol('meth'), { type: 'STRING', value: ';' }] },
				object_m: { type: 'SEQ', members: [{ type: 'STRING', value: '{' }, symbol('meth'), { type: 'STRING', value: '}' }] },
				meth: { type: 'CHOICE', members: [symbol('meth_plain'), symbol('meth_get')] },
				meth_plain: { type: 'SEQ', members: [optionalField('static', 'static'), named('prop_id', symbol('identifier')), symbol('_sig')] },
				_sig: { type: 'SEQ', members: [optionalField('type_parameters', '<T>'), { type: 'STRING', value: '()' }] },
				meth_get: { type: 'SEQ', members: [{ type: 'STRING', value: 'get' }, named('prop_id', symbol('identifier'))] },
				text_m: { type: 'SEQ', members: [{ type: 'FIELD', name: 'name', content: symbol('string_m') }] },
				string_m: { type: 'PATTERN', value: '"[a-z]*"' }
			};
			return { ...base, rules, word: 'identifier', supertypes: [symbol('meth')] } as never;
		};
		const literalClaim = (kind: string, within: readonly string[], leaf: string, text: string, absent: readonly string[] = []): ClaimFact => {
			const subject = { up: 0, down: [{ field: 'name', kind: leaf, after: null, anchor: null }] };
			return claim('declaration.constructor', kind, {
				toplevel: within.length === 0,
				within,
				absent,
				predicates: [{ operator: 'eq', capture: 'name', arguments: [{ text }], subject }],
				children: [{ subject, kinds: [leaf], captured: true }]
			});
		};
		const derive = (claims: readonly ClaimFact[]) =>
			bind({ file: FILE, facts: { ...FACTS, claims, members: [] }, base: literalGrammar(), vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL } as never);

		it('splits beside its source at the site it names, through a supertype the path has to name', () => {
			const { bindings, diagnostics } = derive([literalClaim('meth_plain', ['member_m'], 'prop_id', 'constructor')]);
			expect(diagnostics).toEqual([]);
			expect(bindings.splits).toEqual([
				{
					owner: 'member_m',
					path: [
						{ field: null, kind: 'meth', as: null },
						{ field: null, kind: 'meth_plain', as: null }
					],
					as: 'constructor_declaration',
					literal: { field: 'name', leaf: 'prop_id', texts: ['constructor'], absent: [], relax: [] }
				}
			]);
		});

		it('splits a kind the placed claims mint at each site they mint it, checked against the rule it is minted from', () => {
			const grammar = literalGrammar();
			const rules = { ...grammar.rules, trait_m: { type: 'SEQ', members: [{ type: 'STRING', value: 'trait' }, { type: 'FIELD', name: 'body', content: { type: 'REPEAT', content: symbol('member_m') } }] } };
			const minting = (owner: string) => claim('declaration.method', 'meth_plain', { toplevel: false, within: ['member_m', owner] });
			const claims = [minting('class_m'), minting('trait_m'), literalClaim('method_declaration', [], 'prop_id', 'constructor')];
			const { bindings, diagnostics, report } = bind({ file: FILE, facts: { ...FACTS, claims, members: [] }, base: { ...grammar, rules }, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL } as never);
			expect(diagnostics).toEqual([]);
			expect(report.residue).toEqual([]);
			const literal = { field: 'name', leaf: 'prop_id', texts: ['constructor'], absent: [], relax: [] };
			const [classMethod, traitMethod, classInit, traitInit] = bindings.splits;
			expect(bindings.splits).toHaveLength(4);
			expect([classMethod, traitMethod].map((split) => [split!.owner, split!.as, split!.literal])).toEqual([
				['class_m', 'method_declaration', undefined],
				['trait_m', 'method_declaration', undefined]
			]);
			expect(classInit).toEqual({ ...classMethod, as: 'constructor_declaration', literal });
			expect(traitInit).toEqual({ ...traitMethod, as: 'constructor_declaration', literal });
			expect(derive([literalClaim('method_declaration', [], 'prop_id', 'constructor')]).report.residue).toContainEqual({ cause: 'literal split names no site', row: 'method_declaration → declaration.constructor' });
		});

		it('relaxes the literal back into each display at every site that relaxes the keywords its own site does and admits the display, on the outermost choice a nested one sits in', () => {
			const relaxed = (leaf: string, text: string) => ({ type: 'ALIAS', named: true, value: leaf, content: { type: 'STRING', value: text } });
			const word = (leaf: string) => ({ type: 'ALIAS', named: true, value: leaf, content: symbol('identifier') });
			const grammar = literalGrammar();
			const rules = {
				...grammar.rules,
				meth_plain: { type: 'SEQ', members: [optionalField('static', 'static'), { type: 'FIELD', name: 'name', content: { type: 'CHOICE', members: [word('prop_id'), relaxed('prop_id', 'get')] } }, symbol('_sig')] },
				pair_m: { type: 'SEQ', members: [{ type: 'FIELD', name: 'key', content: { type: 'CHOICE', members: [word('prop_id'), relaxed('prop_id', 'get')] } }, { type: 'STRING', value: ':' }] },
				expr_m: { type: 'CHOICE', members: [symbol('identifier'), relaxed('identifier', 'get')] },
				let_m: { type: 'CHOICE', members: [symbol('identifier'), relaxed('identifier', 'let')] },
				nested_m: { type: 'CHOICE', members: [{ type: 'CHOICE', members: [symbol('identifier'), relaxed('identifier', 'get')] }, symbol('string_m')] },
				hidden_m: { type: 'CHOICE', members: [{ type: 'CHOICE', members: [relaxed('identifier', 'get'), symbol('string_m')] }, { type: 'PREC', value: 1, content: symbol('_ident') }] },
				_ident: { type: 'CHOICE', members: [symbol('string_m'), symbol('identifier')] },
				closed_m: { type: 'CHOICE', members: [relaxed('prop_id', 'get'), relaxed('prop_id', 'set')] },
				seq_m: { type: 'CHOICE', members: [{ type: 'SEQ', members: [{ type: 'STRING', value: '(' }, symbol('identifier'), { type: 'STRING', value: ')' }] }, relaxed('identifier', 'get')] }
			};
			const { bindings, diagnostics } = bind({ file: FILE, facts: { ...FACTS, claims: [literalClaim('meth_plain', ['member_m'], 'prop_id', 'constructor')], members: [] }, base: { ...grammar, rules }, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL } as never);
			expect(diagnostics).toEqual([]);
			expect(bindings.splits.map((split) => split.literal?.relax)).toEqual([
				[
					{ kind: 'meth_plain', path: '1/name:', display: 'prop_id' },
					{ kind: 'pair_m', path: '0/key:', display: 'prop_id' },
					{ kind: 'expr_m', path: '.', display: 'identifier' },
					{ kind: 'nested_m', path: '.', display: 'identifier' },
					{ kind: 'hidden_m', path: '.', display: 'identifier' }
				]
			]);
		});

		it('refuses a placement whose container reaches a kind on its path through several fields', () => {
			const grammar = literalGrammar();
			const both = (child: string) => ({ type: 'SEQ', members: [{ type: 'FIELD', name: 'left', content: symbol(child) }, { type: 'STRING', value: '=' }, { type: 'FIELD', name: 'right', content: symbol(child) }] });
			const rules = { ...grammar.rules, assign_m: both('meth_plain'), texts_m: both('text_m') };
			const claims = [literalClaim('meth_plain', ['assign_m'], 'prop_id', 'constructor'), claim('declaration.method', 'text_m', { toplevel: false, within: ['texts_m'] })];
			const { bindings, report } = bind({ file: FILE, facts: { ...FACTS, claims, members: [] }, base: { ...grammar, rules }, vocabMembers: VOCABULARY, routes: ROUTES, model: NO_MODEL } as never);
			expect(bindings.splits).toEqual([]);
			expect(report.residue).toEqual([
				{ cause: 'placement reaches a kind through several fields', row: 'meth_plain → declaration.constructor' },
				{ cause: 'placement reaches a kind through several fields', row: 'text_m → declaration.method' }
			]);
		});

		it('blanks each field the claim negates in its copy, through the hidden rule that holds it', () => {
			const { bindings, diagnostics } = derive([literalClaim('meth_plain', ['member_m'], 'prop_id', 'constructor', ['static', 'type_parameters'])]);
			expect(diagnostics).toEqual([]);
			expect(bindings.splits.map((split) => split.literal?.absent)).toEqual([
				[
					{ field: 'static', through: [] },
					{ field: 'type_parameters', through: ['_sig'] }
				]
			]);
		});

		it('leaves the claim in the residue when a field it negates is no field of its kind', () => {
			const { bindings, report } = derive([literalClaim('meth_plain', ['member_m'], 'prop_id', 'constructor', ['nope'])]);
			expect(bindings.splits).toEqual([]);
			expect(report.residue).toContainEqual({ cause: 'negated field is not a field of the split kind', row: 'meth_plain → declaration.constructor' });
		});

		it("refuses the split when the leaf is not the grammar's word or an alias of it", () => {
			const { bindings, diagnostics } = derive([literalClaim('text_m', ['member_m'], 'string_m', 'abc')]);
			expect(bindings.splits).toEqual([]);
			expect(diagnostics).toMatchObject([
				{ code: 'literal-split-not-keyword', canProceed: false, details: { leaf: 'string_m', reason: "string_m is not the grammar's word or an alias of it" } }
			]);
		});

		it('refuses the split when the word does not match the literal', () => {
			const { bindings, diagnostics } = derive([literalClaim('meth_plain', ['member_m'], 'prop_id', 'Not-A-Word')]);
			expect(bindings.splits).toEqual([]);
			expect(diagnostics).toMatchObject([{ code: 'literal-split-not-keyword', details: { texts: ['Not-A-Word'], reason: 'Not-A-Word is not word-shaped' } }]);
		});

		it('leaves the claim in the residue when it names no site', () => {
			const { bindings, report } = derive([literalClaim('meth_plain', [], 'prop_id', 'constructor')]);
			expect(bindings.splits).toEqual([]);
			expect(report.residue).toContainEqual({ cause: 'literal split names no site', row: 'meth_plain → declaration.constructor' });
		});
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

	it('prints each split as an alias at its path under its owner, and imports lead and match only beside a lead', () => {
		const split: Split = {
			owner: 'trait_item',
			path: [
				{ field: 'body', kind: 'declaration_list', as: 'trait_body' },
				{ field: null, kind: 'function_item', as: null }
			],
			as: 'method_declaration'
		};
		const text = printBindingsModule({ patches: new Map([['let_item', [[{ path: '1', edit: { field: 'name' } }]]]]), renames: {}, leads: [], splits: [split] }, 'h');
		expect(text).toContain("import { alias, enrich, field, wire } from '../codegen/src/dsl/dsl-authoring.ts';");
		expect(text).toContain('export const renames = {};');
		expect(text).toContain('trait_item: { "body:/(declaration_list as trait_body)/(function_item)": alias("method_declaration") }');
	});

	it('prints a split on a literal as a narrowed copy beside its source, nesting the copy of each hidden rule a blanked field sits in', () => {
		const split: Split = {
			owner: 'member_m',
			path: [{ field: null, kind: 'meth_plain', as: null }],
			as: 'constructor_declaration',
			literal: { field: 'name', leaf: 'prop_id', texts: ['constructor'], absent: [{ field: 'static', through: [] }, { field: 'type_parameters', through: ['_sig'] }], relax: [] }
		};
		const text = printBindingsModule({ patches: new Map(), renames: {}, leads: [], splits: [split] }, 'h');
		expect(text).toContain("import { alias, copy, edit, enrich, wire } from '../codegen/src/dsl/dsl-authoring.ts';");
		expect(text).toContain(
			'member_m: { "(meth_plain)": ($, member) => choice(member, alias(edit(copy("meth_plain"), { "name:": alias("constructor", $.prop_id), "static:": blank(), "(_sig)": edit(copy("_sig"), { "type_parameters:": blank() }) }), $.constructor_declaration)) }'
		);
	});

	it('prints a split on a literal at a site a placed claim aliases as one edit that aliases the member beside the copy', () => {
		const path = [
			{ field: 'body', kind: 'block_m', as: 'block_class_m' },
			{ field: null, kind: 'meth_plain', as: null }
		];
		const literal = { field: 'name', leaf: 'prop_id', texts: ['__init__'], absent: [], relax: [] };
		const splits: Split[] = [
			{ owner: 'class_m', path, as: 'constructor_declaration', literal },
			{ owner: 'class_m', path, as: 'method_declaration' }
		];
		const text = printBindingsModule({ patches: new Map(), renames: {}, leads: [], splits }, 'h');
		expect(text).toContain(
			'class_m: { "body:/(block_m as block_class_m)/(meth_plain)": ($, member) => choice(alias(member, $.method_declaration), alias(edit(copy("meth_plain"), { "name:": alias("__init__", $.prop_id) }), $.constructor_declaration)) }'
		);
	});

	it('prefers a split that relaxes its literal elsewhere, and adds the literal to the choice of keywords each site relaxes', () => {
		const split: Split = {
			owner: 'member_m',
			path: [{ field: null, kind: 'meth_plain', as: null }],
			as: 'constructor_declaration',
			literal: {
				field: 'name',
				leaf: 'prop_id',
				texts: ['constructor'],
				absent: [],
				relax: [
					{ kind: 'pair_m', path: '0/key:', display: 'prop_id' },
					{ kind: 'expr_m', path: '.', display: 'identifier' }
				]
			}
		};
		const text = printBindingsModule({ patches: new Map(), renames: {}, leads: [], splits: [split] }, 'h');
		expect(text).toContain(
			'member_m: { "(meth_plain)": ($, member) => choice(member, prec.dynamic(1, alias(edit(copy("meth_plain"), { "name:": alias("constructor", $.prop_id) }), $.constructor_declaration))) }'
		);
		expect(text).toContain('pair_m: { "0/key:": ($, member) => ({ ...member, members: [...member.members, alias("constructor", $.prop_id)] }) }');
		expect(text).toContain('expr_m: { ".": ($, member) => ({ ...member, members: [...member.members, alias("constructor", $.identifier)] }) }');
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

	it('splits a literal only at the site its placed claim aliases, not at an alias the grammar already shows by that name', async () => {
		const pkg = mkdtempSync(join(dir, 'pkg-'));
		const shownBase = join(dir, 'shown.mjs');
		writeFileSync(
			shownBase,
			`export default grammar({
	name: 'bindtest',
	word: $ => $.identifier,
	rules: {
		source_file: $ => repeat($.cls),
		cls: $ => seq('class', $.meth, alias($.meth, $.method_declaration)),
		meth: $ => seq('def', field('name', $.identifier)),
		identifier: _ => /[a-z_]+/
	}
});
`
		);
		writeSittirGrammarPackage(pkg, shownBase, 'bindtest');
		const path = [{ field: null, kind: 'meth', as: null }];
		const literal = { field: 'name', leaf: 'identifier', texts: ['init'], absent: [], relax: [] };
		const splits: Split[] = [
			{ owner: 'cls', path, as: 'method_declaration' },
			{ owner: 'cls', path, as: 'constructor_declaration', literal }
		];
		const printed = printBindingsModule({ patches: new Map(), renames: {}, leads: [], splits }, 'h');
		writeFileSync(
			join(pkg, BINDINGS_MODULE),
			printed.replace("'../codegen/src/dsl/dsl-authoring.ts'", JSON.stringify(join(__dirname, '../../dsl/dsl-authoring.ts'))).replace(/^\/\/\/ <reference.*\n/m, '')
		);
		const raw = await evaluate(layerPath({ dir: pkg }, 'top'), NO_FILE_TYPES);
		const [, enriched, shown] = (raw.rules.cls as unknown as { readonly members: readonly { readonly content?: unknown }[] }).members;
		expect(enriched).toMatchObject({ type: 'FIELD', metadata: { fieldSource: 'enriched' } });
		expect(enriched!.content).toMatchObject({ type: 'CHOICE', members: [{ type: 'ALIAS', value: 'method_declaration' }, { type: 'ALIAS', value: 'constructor_declaration' }] });
		expect(shown).toMatchObject({ type: 'ALIAS', value: 'method_declaration', content: { type: 'SYMBOL', name: 'meth' } });
		expect(raw.bindingEffects).toContainEqual({ kind: 'alias', from: 'meth', to: 'method_declaration', scope: 'cls' });
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
					splitFrom: null,
					aliasStorage: null,
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

describe('a claim on a supertype owner', () => {
	const grammarOf = (armBlock: string): string => `export default grammar({
	name: 'bindtest',
	supertypes: $ => [$.arm, $.clause],
	rules: {
		source_file: $ => repeat(choice($.arm, $.clause)),
		arm: $ => choice($.arm_comma, $.arm_block, $.arm_else),
		arm_comma: $ => seq(field('pattern', $.identifier), '=>', $.identifier, ','),
		arm_block: $ => ${armBlock},
		arm_else: $ => seq('else', '=>', '{', '}'),
		clause: $ => choice($.clause_bare, $.clause_paren),
		clause_bare: $ => seq('with', $.item, repeat(seq(',', $.item))),
		clause_paren: $ => seq('with', '(', field('items_list', $.clause_items), ')'),
		clause_items: $ => seq($.item, repeat(seq(',', $.item))),
		item: _ => /[A-Z]+/,
		identifier: _ => /[a-z]+/
	}
});
`;
	let forms: RawGrammar;
	let taken: RawGrammar;
	let body: RawGrammar;

	beforeAll(async () => {
		const formsBase = join(dir, 'forms.mjs');
		const takenBase = join(dir, 'taken.mjs');
		const bodyBase = join(dir, 'body.mjs');
		writeFileSync(formsBase, grammarOf("seq(field('pattern', $.identifier), '=>', '{', '}')"));
		writeFileSync(takenBase, grammarOf("seq(field('pattern', $.identifier), '=>', field('match', $.identifier))"));
		writeFileSync(bodyBase, grammarOf("seq('{', field('body', $.identifier), '}')"));
		forms = await evaluateSittirGrammar(formsBase, 'bindtest');
		taken = await evaluateSittirGrammar(takenBase, 'bindtest');
		body = await evaluateSittirGrammar(bodyBase, 'bindtest');
	}, 120_000);

	const slot = (name: string, kinds: readonly string[], multiple = false) => ({ name, propertyName: name, required: true, multiple, storage: 'verbatim', kinds, terminals: [] });
	const node = (kind: string, extra: Partial<ModelNode> = {}): ModelNode => ({
		kind,
		modelType: 'branch',
		slots: [],
		subtypes: [],
		elementKinds: [],
		enumMembers: [],
		text: null,
		pattern: null,
		variantOf: null,
		splitFrom: null,
		aliasStorage: null,
		shownAs: [],
		...extra
	});
	const modelOf = ({ bareMultiple = true, armBlockSlots = [slot('pattern', ['identifier'])] } = {}): SlotModel =>
		new Map([
			['arm', node('arm', { modelType: 'supertype', subtypes: ['arm_comma', 'arm_block', 'arm_else'] })],
			['arm_comma', node('arm_comma', { variantOf: 'arm', slots: [slot('pattern', ['identifier'])] })],
			['arm_block', node('arm_block', { variantOf: 'arm', slots: armBlockSlots })],
			['arm_else', node('arm_else', { variantOf: 'arm' })],
			['clause', node('clause', { modelType: 'supertype', subtypes: ['clause_bare', 'clause_paren'] })],
			['clause_bare', node('clause_bare', { variantOf: 'clause', slots: [slot('item', ['item'], bareMultiple)] })],
			['clause_paren', node('clause_paren', { variantOf: 'clause', slots: [slot('items_list', ['clause_items'])] })],
			['clause_items', node('clause_items', { modelType: 'list', elementKinds: ['item'], slots: [slot('item', ['item'], true)] })]
		]);
	const rename = (owner: string, name: string, field: string) => ({ route: 'rename', owner, name, field, kind: null, after: null, anchor: null }) as const;
	const factsOf = (...members: ReturnType<typeof rename>[]): BindingFacts => ({ ...FACTS, claims: [], members });
	const routes = {
		members: NO_MEMBERS,
		vocabOf: new Map([
			['arm', 'clause.arm'],
			['clause', 'clause.resource']
		])
	};
	const vocab = new Map([
		['clause.arm', new Set(['match', 'pattern'])],
		['clause.resource', new Set(['items'])]
	]);
	const derive = (base: RawGrammar, model: SlotModel, ...members: ReturnType<typeof rename>[]) =>
		bind({ file: FILE, facts: factsOf(...members), base, vocabMembers: vocab, routes, model });

	it("renames the field at each form that holds it, and leaves a form holding no such member alone", () => {
		const { bindings, report } = derive(forms, modelOf(), rename('arm', 'match', 'pattern'));
		expect(report.fieldRenames).toEqual([
			{ owner: 'arm_comma', from: 'pattern', to: 'match' },
			{ owner: 'arm_block', from: 'pattern', to: 'match' }
		]);
		expect([...bindings.patches.keys()]).toEqual(['arm_block', 'arm_comma']);
		expect(report.realizedMembers).toEqual(['arm.match']);
		expect(report.residue).toEqual([]);
	});

	it("renames a field of another name at a form that holds the member in the same shape: a list held directly or through a list kind", () => {
		const { report } = derive(forms, modelOf(), rename('clause', 'items', 'items_list'));
		expect(report.fieldRenames).toEqual([
			{ owner: 'clause_bare', from: 'item', to: 'items' },
			{ owner: 'clause_paren', from: 'items_list', to: 'items' }
		]);
		expect(report.realizedMembers).toEqual(['clause.items']);
	});

	it('refuses the row when a form holds the member\'s kinds only under a field the grammar names otherwise', () => {
		const { bindings, report } = derive(body, modelOf({ armBlockSlots: [slot('body', ['identifier'])] }), rename('arm', 'match', 'pattern'));
		expect(report.fieldRenames).toEqual([]);
		expect(bindings.patches).toEqual(new Map());
		expect(report.residue).toEqual([{ cause: 'a form holds the member only under a field the grammar names otherwise', row: 'arm.match' }]);
	});

	it('refuses the rename at every form when one form holds the member in another shape', () => {
		const { bindings, report } = derive(forms, modelOf({ bareMultiple: false }), rename('clause', 'items', 'items_list'));
		expect(report.fieldRenames).toEqual([]);
		expect(bindings.patches).toEqual(new Map());
		expect(report.residue).toEqual([{ cause: 'a form holds the member in another shape', row: 'clause.items' }]);
	});

	it("refuses the whole row once when one form's rename is refused", () => {
		const model = modelOf({ armBlockSlots: [slot('pattern', ['identifier']), slot('match', ['identifier'])] });
		const { bindings, report } = derive(taken, model, rename('arm', 'match', 'pattern'));
		expect(report.fieldRenames).toEqual([]);
		expect(bindings.patches).toEqual(new Map());
		expect(report.realizedMembers).toEqual([]);
		expect(report.residue).toEqual([{ cause: 'member name is already a field of the owner', row: 'arm.match' }]);
	});

	it('realizes the member with no edit when every form already spells it', () => {
		const { bindings, report } = derive(forms, modelOf(), rename('arm', 'pattern', 'pattern'));
		expect(report.fieldRenames).toEqual([]);
		expect(bindings.patches).toEqual(new Map());
		expect(report.realizedMembers).toEqual(['arm.pattern']);
	});
});
