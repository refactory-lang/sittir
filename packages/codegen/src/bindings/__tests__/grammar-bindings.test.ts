import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { type BindingFacts, type ClaimFact, type MemberRoute, deriveGrammarBindings, loadBindingsModule, printBindingsModule } from '../index.ts';

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
const named = (...names: string[]): MemberRoute[] => names.map((name) => ({ route: 'kind', name, kind: name, path: undefined }));
const NO_MEMBERS: ReadonlyMap<string, readonly MemberRoute[]> = new Map();
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
		const { bindings } = deriveGrammarBindings({ facts: FACTS, base, vocabMembers: VOCABULARY, routedMembers: NO_MEMBERS });
		expect(bindings.renames).toEqual({ let_item: 'variable_declaration', call: 'call_expression' });
	});

	it('makes no grammar change for a slot a claim drops', () => {
		const facts: BindingFacts = { ...FACTS, members: [{ route: 'dropped', owner: 'let_item', field: 'left', kind: null, after: null, anchor: null }] };
		const { bindings, report } = deriveGrammarBindings({ facts, base, vocabMembers: VOCABULARY, routedMembers: NO_MEMBERS });
		expect(bindings.patches).toEqual(new Map());
		expect(report.residue.filter((r) => r.row.startsWith('let_item.'))).toEqual([]);
	});

	it('patches a member routed to a field of another name into a field of the member\'s name', () => {
		const { bindings } = deriveGrammarBindings({ facts: FACTS, base, vocabMembers: VOCABULARY, routedMembers: NO_MEMBERS });
		expect(bindings.patches).toEqual(new Map([['let_item', [[{ path: '1', edit: { field: 'name' } }]]]]));
	});

	it('patches no field for a member an anchor ties to its neighbour: its slot is a position, not a field', () => {
		const left = { route: 'rename', owner: 'let_item', name: 'name', field: 'left', kind: null, after: null, anchor: null } as const;
		const facts = { ...FACTS, members: [{ ...left, adjacent: { previous: { field: null, kind: 'identifier', after: null, anchor: null } } }] };
		const { bindings, report } = deriveGrammarBindings({ facts, base, vocabMembers: VOCABULARY, routedMembers: NO_MEMBERS });
		expect(bindings.patches).toEqual(new Map());
		expect(report.residue).toContainEqual({ cause: 'positional child', row: 'let_item.name' });
	});

	it('leaves each claim it does not turn into a grammar change in the residue, with the reason', () => {
		const { report } = deriveGrammarBindings({ facts: FACTS, base, vocabMembers: VOCABULARY, routedMembers: NO_MEMBERS });
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
		const { bindings, report } = deriveGrammarBindings({ facts, base, vocabMembers: VOCABULARY, routedMembers: NO_MEMBERS });
		expect(bindings.renames).toEqual({ call: 'call_expression' });
		expect(report.residue).toEqual([
			{ cause: 'kind named by an earlier claim', row: 'call → expression.invocation' },
			{ cause: 'member not in the vocabulary', row: 'call.callee' }
		]);
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
			deriveGrammarBindings({ facts, base, vocabMembers: vocab, routedMembers });

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


	it('leaves a member its vocabulary kind does not declare in the residue', () => {
		const { bindings, report } = deriveGrammarBindings({ facts: FACTS, base, vocabMembers: new Map([['declaration.variable', new Set<string>()]]), routedMembers: NO_MEMBERS });
		expect(bindings.patches.size).toBe(0);
		expect(report.residue).toContainEqual({ cause: 'member not in the vocabulary', row: 'let_item.name' });
	});
});

describe('printBindingsModule', () => {
	it('prints the grammar bindings with the hash of the sources it was derived from, and nothing else', () => {
		const { bindings } = deriveGrammarBindings({ facts: FACTS, base, vocabMembers: VOCABULARY, routedMembers: NO_MEMBERS });
		const text = printBindingsModule(bindings, 'h');
		expect(text).toContain('export default bindings({\n\thash: "h",');
		expect(text).toContain('rename("let_item", "variable_declaration")');
		expect(text).toContain('let_item: { "1": field("name") }');
		expect(text).not.toContain('facts');
	});
});

describe('loadBindingsModule', () => {
	it('reads committed grammar bindings, alias patches included, outside the grammar\'s evaluation', async () => {
		const pkg = mkdtempSync(join(dir, 'pkg-'));
		const bindings = { patches: new Map([['call', [[{ path: '0/0', edit: { alias: { from: 'identifier', to: 'callee' } } }]]]]), renames: {}, splits: [] };
		writeFileSync(join(pkg, 'grammar.bindings.ts'), printBindingsModule(bindings, 'h').replace("'../codegen/src/dsl/dsl-authoring.ts'", JSON.stringify(join(__dirname, '../../dsl/dsl-authoring.ts'))).replace(/^\/\/\/ <reference.*\n/m, ''));
		expect((await loadBindingsModule(pkg))?.hash).toBe('h');
	});

	it('finds no grammar bindings where none are committed', async () => {
		expect(await loadBindingsModule(mkdtempSync(join(dir, 'empty-')))).toBeUndefined();
	});
});
