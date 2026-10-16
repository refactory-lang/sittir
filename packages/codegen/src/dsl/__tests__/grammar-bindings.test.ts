import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';
import { evaluateForDerivation } from '../../transpile/evaluate-for-derivation.ts';
import { EMPTY_CONFLICT_RESOLUTIONS } from '../conflict-resolutions.ts';
import { baseNamesOf, bindGrammar, boundNameOf, lead, match } from '../bind.ts';
import { boundFieldNameOf } from '../verbs/effects.ts';

const DSL = JSON.stringify(join(__dirname, '../index.ts'));

function grammarPackageWith(config: string): { dir: string } {
	const pkg = mkdtempSync(join(dir, 'pkg-'));
	mkdirSync(join(pkg, '.sittir'));
	writeFileSync(join(pkg, '.sittir', 'resolutions.json'), JSON.stringify(EMPTY_CONFLICT_RESOLUTIONS));
	writeFileSync(
		join(pkg, 'grammar.sittir.ts'),
		`import base from ${JSON.stringify(baseModule)};\nimport resolutions from './.sittir/resolutions.json' with { type: 'json' };\nimport { sittirGrammar, bindings, rename, field, alias } from ${DSL};\nexport default sittirGrammar(base, { resolutions, name: 'bindtest', ${config} });\n`
	);
	return { dir: pkg };
}

let dir: string;
let baseModule: string;

beforeAll(() => {
	dir = mkdtempSync(join(tmpdir(), 'grammar-bindings-'));
	baseModule = join(dir, 'base.mjs');
	writeFileSync(
		baseModule,
		`export default grammar({
	name: 'bindtest',
	rules: {
		source_file: $ => repeat($._item),
		_item: $ => choice($.let_item, $.call),
		let_item: $ => seq('let', field('left', $.identifier), optional(seq(':', $.type)), ';'),
		call: $ => seq($.identifier, '(', ')', ';'),
		identifier: _ => /[a-z]+/,
		type: _ => /[A-Z][a-z]*/
	}
});
`
	);
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const BINDINGS = `bindings: bindings({
	patches: {
		let_item: { 1: field('name'), '2/0/1': field('annotation') },
		call: { '0/0': alias(sym('identifier'), sym('callee')) }
	},
	renames: [rename('let_item', 'binding')]
})`;

describe('lead and match', () => {
	it('build a lead entry: the list, its item field, the lead field and what the lead admits', () => {
		expect(lead('formal_parameters_elements', 'item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter'))).toEqual({
			list: 'formal_parameters_elements',
			item: 'item',
			field: 'receiver',
			admits: [{ kind: 'required_parameter', within: { field: 'pattern', admits: [{ kind: 'this' }] }, as: 'this_parameter' }]
		});
	});

	it('read an array as an unfielded restriction, and a bare kind as no restriction', () => {
		expect(match('self_parameter')).toEqual({ kind: 'self_parameter' });
		expect(match('attributed_parameter', [match('self_parameter')])).toEqual({ kind: 'attributed_parameter', within: { field: null, admits: [{ kind: 'self_parameter' }] } });
	});

	it('refuse a restriction of two fields', () => {
		expect(() => match('required_parameter', { pattern: [match('this')], type: [match('type_annotation')] })).toThrow(
			/restricts one field, not 2/
		);
	});

	it('applies leads after binding patches and placement splits', () => {
		const sym = (name: string) => ({ type: 'SYMBOL', name });
		const item = { type: 'FIELD', name: 'item', content: { type: 'CHOICE', members: [sym('x'), sym('y')] } };
		const grammar = {
			name: 'g',
			rules: {
				owner: { type: 'FIELD', name: 'elements', content: sym('list') },
				list: {
					type: 'SEQ',
					members: [item, { type: 'REPEAT', content: { type: 'SEQ', members: [{ type: 'STRING', value: ',' }, item] } }]
				},
				x: { type: 'STRING', value: 'x' },
				y: { type: 'STRING', value: 'y' }
			}
		};
		const bound = bindGrammar(grammar, { leads: [lead('list', 'item', 'receiver', match('x'))] });
		expect(bound.leadFrom).toEqual({ _list_receiver: 'list' });
		expect(bound.bindingEffects).toContainEqual({
			kind: 'lead',
			list: 'list',
			item: 'item',
			field: 'receiver',
			receiver: 'list_receiver',
			group: 'list_receiver_group',
			restField: 'elements',
			variants: {},
			admits: [{ kind: 'x' }]
		});
		expect(JSON.stringify(bound.rules)).toContain('"name":"receiver"');
		expect(JSON.stringify(bound.rules)).toContain('"value":"list_receiver"');
	});
});

describe('boundFieldNameOf', () => {
	it('maps a field renamed in a hidden rule through the visible owner that holds it', () => {
		const grammar = {
			rules: {
				parameter: { type: 'SYMBOL', name: '_parameter_name' },
				_parameter_name: { type: 'FIELD', name: 'name', content: { type: 'SYMBOL', name: 'identifier' } },
				other: { type: 'SYMBOL', name: 'identifier' }
			}
		};
		const nameOf = boundFieldNameOf([{ owner: '_parameter_name', from: 'pattern:', to: 'name:' }], grammar);
		expect(nameOf('parameter', 'pattern')).toBe('name');
		expect(nameOf('other', 'pattern')).toBe('pattern');
	});

	it('reads canonical field segments and scopes the rename to its owner', () => {
		const nameOf = boundFieldNameOf([{ owner: 'binding', from: 'left:', to: 'name:' }]);
		expect(nameOf('binding', 'left')).toBe('name');
		expect(nameOf('call', 'left')).toBe('left');
	});
});

describe('baseNamesOf', () => {
	it('maps an explicitly recorded binding alias without renaming unrelated source kinds', () => {
		const nameOf = boundNameOf({}, [{ kind: 'alias', from: 'line_comment_regular', to: 'text_comment' }]);
		expect(nameOf('line_comment_regular')).toBe('text_comment');
		expect(nameOf('identifier')).toBe('identifier');
	});
	it('maps a renamed rule and a clone of it to the base name', () => {
		expect(baseNamesOf({ binding: 'let_item' }, { binding_x: 'binding' })).toEqual({ binding: 'let_item', binding_x: 'let_item' });
	});

	it("maps a clone that reuses a renamed rule's base name to that name, and leaves it out", () => {
		expect(baseNamesOf({ value_parameter: 'parameter' }, { parameter: 'value_parameter' })).toEqual({
			value_parameter: 'parameter'
		});
	});
});

describe('grammar bindings on sittirGrammar', () => {
	it('applies binding patches while preserving upstream parser kind names', async () => {
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', BINDINGS);
		expect(Object.keys(raw.rules)).toContain('let_item');
		expect(Object.keys(raw.rules)).not.toContain('binding');
		const text = JSON.stringify(raw.rules.let_item);
		expect(text).toContain('"name":"name"');
		expect(text).not.toContain('"name":"left"');
		expect(JSON.stringify(raw.rules)).toContain('"name":"annotation"');
		expect(JSON.stringify(raw.rules.call)).toMatch(
			/"type":"FIELD","name":"identifier","content":\{"type":"ALIAS".*"named":true,"value":"callee"/
		);
		expect(raw.renamedFrom).toBeUndefined();
	}, 120_000);

	it('preserves parser names in each reparse host, priority entry and gated host', async () => {
		const hosts = `reparseHosts: { hosts: { let_item: '$r', call: '$r' }, priority: ['_item', 'let_item'], gated: ['let_item'] }`;
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', `${hosts}, ${BINDINGS}`);
		expect(raw.reparseHosts).toEqual({
			hosts: { let_item: '$r', call: '$r' },
			priority: ['_item', 'let_item'],
			gated: ['let_item']
		});
	}, 120_000);

	it('evaluates unbound to the grammar without its grammar bindings', async () => {
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', BINDINGS, undefined, { unbound: true });
		expect(Object.keys(raw.rules)).toContain('let_item');
		expect(Object.keys(raw.rules)).not.toContain('binding');
		expect(JSON.stringify(raw.rules.let_item)).toContain('"name":"left"');
		expect(JSON.stringify(raw.rules.call)).not.toContain('callee');
	}, 120_000);

	it('refuses a patch alias whose target names a rule of the grammar', async () => {
		await expect(
			evaluateSittirGrammar(baseModule, 'bindtest', `bindings: bindings({ patches: { call: { '0/0': alias(sym('identifier'), sym('type')) } } })`)
		).rejects.toThrow(/alias 'identifier' → 'type'.*already names/);
	}, 120_000);

	it('derives the base conflicts from the grammar without its grammar bindings', () => {
		const bound = evaluateForDerivation(grammarPackageWith(BINDINGS));
		const unbound = evaluateForDerivation(grammarPackageWith(''));
		expect(bound.base.grammarHash).toBe(unbound.base.grammarHash);
	}, 120_000);

	it('derives the bound conflicts from the bound grammar, keyed by its own hash and chained to its unbound names', () => {
		const bound = evaluateForDerivation(grammarPackageWith(BINDINGS));
		const unbound = evaluateForDerivation(grammarPackageWith(''));
		expect(unbound.bound.grammarHash).toBe(unbound.base.grammarHash);
		expect(bound.bound.grammarHash).not.toBe(unbound.bound.grammarHash);
		expect(bound.bound.baseNames).toEqual({});
		expect(bound.bound.sourceEdges).toEqual(bound.base.sourceEdges);
		expect(bound.base.baseNames).toEqual({});
	}, 120_000);

	it('applies bound conflicts after bindings while preserving upstream base names', async () => {
		const set = (symbols: string[]) => ({
			resolution: { kind: 'AddConflict' as const, symbols },
			step: 'default' as const,
			sourceChains: symbols.map((name) => [name]),
			conflict: { symbolSequence: [], lookahead: '', interpretations: symbols }
		});
		const resolutions = {
			grammarHash: '',
			resolutions: [set(['let_item', 'call'])],
			bound: { grammarHash: '', resolutions: [set(['let_item', 'identifier'])] }
		};
		const bound = await evaluateSittirGrammar(baseModule, 'bindtest', BINDINGS, resolutions);
		expect(bound.conflicts).toEqual([
			['let_item', 'call'],
			['let_item', 'identifier']
		]);
		expect(bound.derivationRecords?.boundResolutions.map((entry) => entry.resolution.symbols)).toEqual([
			['let_item', 'identifier']
		]);
		const unbound = await evaluateSittirGrammar(baseModule, 'bindtest', BINDINGS, resolutions, { unbound: true });
		expect(unbound.conflicts).toEqual([['let_item', 'call']]);
		expect(unbound.derivationRecords?.boundResolutions).toEqual([]);
	}, 120_000);

	it('rewrites the authored options through what each binding patch did', async () => {
		const options = `options: {
		let_item: { 'left:/before': preference('tight'), '";"/before': preference('tight') },
		_labels: { 'identifier/x:/separator': 'gap/separator' }
	}`;
		const bindingsOption = `bindings: bindings({
		patches: { let_item: { 1: field('name'), 3: field('terminator') }, call: { '0/0': alias(sym('identifier'), sym('callee')) } },
		renames: [rename('let_item', 'binding')]
	})`;
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', `${options}, ${bindingsOption}`);
		const block = raw.options as Record<string, Record<string, unknown>>;
		expect(Object.keys(block.let_item ?? {}).sort()).toEqual(['name:/before', 'terminator:/before']);
		expect(Object.keys(block._labels ?? {})).toEqual(['callee/x:/separator']);
	}, 120_000);
});
