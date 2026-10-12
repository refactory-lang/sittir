import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';
import { evaluateForDerivation } from '../../transpile/evaluate-for-derivation.ts';
import { EMPTY_CONFLICT_RESOLUTIONS } from '../conflict-resolutions.ts';

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

describe('grammar bindings on sittirGrammar', () => {
	it('applies its patches at the patch stage and its renames after grammar()', async () => {
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', BINDINGS);
		expect(Object.keys(raw.rules)).toContain('binding');
		expect(Object.keys(raw.rules)).not.toContain('let_item');
		const text = JSON.stringify(raw.rules.binding);
		expect(text).toContain('"name":"name"');
		expect(text).not.toContain('"name":"left"');
		expect(JSON.stringify(raw.rules)).toContain('"name":"annotation"');
		expect(JSON.stringify(raw.rules.call)).toMatch(/"type":"FIELD","name":"identifier","content":\{"type":"ALIAS".*"named":true,"value":"callee"/);
		expect(raw.renamedFrom).toEqual({ binding: 'let_item' });
	}, 120_000);

	it('names each reparse host, priority entry and gated host by its bound kind', async () => {
		const hosts = `reparseHosts: { hosts: { let_item: '$r', call: '$r' }, priority: ['_item', 'let_item'], gated: ['let_item'] }`;
		const raw = await evaluateSittirGrammar(baseModule, 'bindtest', `${hosts}, ${BINDINGS}`);
		expect(raw.reparseHosts).toEqual({ hosts: { binding: '$r', call: '$r' }, priority: ['_item', 'binding'], gated: ['binding'] });
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
		expect(bound.bound.sourceEdges).toMatchObject({ binding: 'let_item' });
		expect(bound.base.sourceEdges).not.toHaveProperty('binding');
	}, 120_000);

	it('applies the bound sets after the bindings, behind the renamed base sets', async () => {
		const set = (symbols: string[]) => ({
			resolution: { kind: 'AddConflict' as const, symbols },
			step: 'default' as const,
			sourceChains: symbols.map((name) => [name]),
			conflict: { symbolSequence: [], lookahead: '', interpretations: symbols }
		});
		const resolutions = { grammarHash: '', resolutions: [set(['let_item', 'call'])], bound: { grammarHash: '', resolutions: [set(['binding', 'identifier'])] } };
		const bound = await evaluateSittirGrammar(baseModule, 'bindtest', BINDINGS, resolutions);
		expect(bound.conflicts).toEqual([
			['binding', 'call'],
			['binding', 'identifier']
		]);
		expect(bound.derivationRecords?.boundResolutions.map((entry) => entry.resolution.symbols)).toEqual([['binding', 'identifier']]);
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
		expect(Object.keys(block.binding ?? {}).sort()).toEqual(['name:/before', 'terminator:/before']);
		expect(Object.keys(block._labels ?? {})).toEqual(['callee/x:/separator']);
	}, 120_000);
});
