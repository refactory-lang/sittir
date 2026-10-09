import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { type BindingFacts, type ClaimFact, deriveOverlay, loadBindingsModule, printBindingsModule } from '../index.ts';

const claim = (vocab: string, kind: string, extra: Partial<ClaimFact> = {}): ClaimFact => ({
	vocab,
	kind,
	field: null,
	predicates: [],
	toplevel: true,
	within: [],
	fieldLiterals: {},
	tokens: [],
	...extra
});

const FACTS: BindingFacts = {
	claims: [
		claim('declaration.variable', 'let_item'),
		claim('expression.call', 'call'),
		claim('expression.call.method', 'call', { tokens: ['.'] }),
		claim('type.named', 'nope')
	],
	members: [{ route: 'rename', owner: 'let_item', name: 'name', field: 'left', kind: null, after: null }],
	containers: [],
	templates: [],
	unclaimed: []
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

describe('deriveOverlay', () => {
	it('renames each plain claimed kind to its path\'s bound name, subkind first', () => {
		const { overlay } = deriveOverlay({ grammar: 'bindtest', facts: FACTS, base, vocabMembers: VOCABULARY });
		expect(overlay.renames).toEqual({ let_item: 'variable_declaration', call: 'call_expression' });
	});

	it('patches a member routed to a field of another name into a field of the member\'s name', () => {
		const { overlay } = deriveOverlay({ grammar: 'bindtest', facts: FACTS, base, vocabMembers: VOCABULARY });
		expect(overlay.patches).toEqual(new Map([['let_item', [[{ path: '1', edit: { field: 'name' } }]]]]));
	});

	it('leaves each claim it does not turn into a grammar change in the residue, with the reason', () => {
		const { report } = deriveOverlay({ grammar: 'bindtest', facts: FACTS, base, vocabMembers: VOCABULARY });
		expect(report.residue).toEqual([
			{ cause: 'token refinement', row: 'call → expression.call.method' },
			{ cause: 'not a base rule', row: 'nope → type.named' }
		]);
	});

	it('leaves a member its vocabulary kind does not declare in the residue', () => {
		const { overlay, report } = deriveOverlay({ grammar: 'bindtest', facts: FACTS, base, vocabMembers: new Map([['declaration.variable', new Set<string>()]]) });
		expect(overlay.patches.size).toBe(0);
		expect(report.residue).toContainEqual({ cause: 'member not in the vocabulary', row: 'let_item.name' });
	});
});

describe('printBindingsModule', () => {
	it('prints the overlay with the hash of the sources it was derived from, and nothing else', () => {
		const { overlay } = deriveOverlay({ grammar: 'bindtest', facts: FACTS, base, vocabMembers: VOCABULARY });
		const text = printBindingsModule(overlay, 'h');
		expect(text).toContain('export default bindings({\n\thash: "h",');
		expect(text).toContain('rename("let_item", "variable_declaration")');
		expect(text).toContain('let_item: { "1": field("name") }');
		expect(text).not.toContain('facts');
	});
});

describe('loadBindingsModule', () => {
	it('reads a committed overlay, alias patches included, outside the grammar\'s evaluation', async () => {
		const pkg = mkdtempSync(join(dir, 'pkg-'));
		const overlay = { patches: new Map([['call', [[{ path: '0/0', edit: { alias: { from: 'identifier', to: 'callee' } } }]]]]), renames: {}, splits: [] };
		writeFileSync(join(pkg, 'grammar.bindings.ts'), printBindingsModule(overlay, 'h').replace("'../codegen/src/dsl/dsl-authoring.ts'", JSON.stringify(join(__dirname, '../../dsl/dsl-authoring.ts'))).replace(/^\/\/\/ <reference.*\n/m, ''));
		expect((await loadBindingsModule(pkg))?.hash).toBe('h');
	});

	it('finds no overlay where none is committed', async () => {
		expect(await loadBindingsModule(mkdtempSync(join(dir, 'empty-')))).toBeUndefined();
	});
});
