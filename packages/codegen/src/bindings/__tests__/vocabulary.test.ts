import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { type BindingFacts, type ClaimFact, type Vocabulary, flagSegment, readVocabulary, resolveFlags } from '../index.ts';

const vocabularyIn = async (...lines: readonly string[]) => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	writeFileSync(join(dir, 'declaration.ts'), [...lines, ''].join('\n'));
	try {
		return await readVocabulary(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
};

describe('readVocabulary', () => {
	it('reads the parent a heritage clause names through V. however the reference is written', async () => {
		const vocabulary = await vocabularyIn(
			'export interface Declaration<G> {',
			"\treadonly $kind: 'declaration';",
			'\treadonly name: string;',
			'}',
			'export interface Generic<G> extends SubKindOf<V.Declaration<G>> {',
			"\treadonly $kind: 'declaration.generic';",
			'}',
			'export interface Parenthesized<G> extends SubKindOf<(V.Declaration<G>)> {',
			"\treadonly $kind: 'declaration.parenthesized';",
			'}',
			'export interface Bare<G> extends V.Declaration {',
			"\treadonly $kind: 'declaration.bare';",
			'}'
		);
		for (const path of ['declaration.generic', 'declaration.parenthesized', 'declaration.bare']) {
			expect(vocabulary.kinds.get(path)?.parent, path).toBe('declaration');
			expect([...vocabulary.members(path).keys()], path).toEqual(['name']);
		}
	});

	it('reads an interface or namespace however it is exported or declared', async () => {
		const vocabulary = await vocabularyIn(
			"export declare interface Declared<G> { readonly $kind: 'declared'; }",
			"export default interface Defaulted<G> { readonly $kind: 'defaulted'; }",
			"declare interface Ambient<G> { readonly $kind: 'ambient'; }",
			"export declare namespace Exported { export interface Inner<G> { readonly $kind: 'exported.inner'; } }",
			"declare namespace Ambient { interface Inner<G> { readonly $kind: 'ambient.inner'; } }",
			"namespace Bare { interface Inner<G> { readonly $kind: 'bare.inner'; } }"
		);
		expect([...vocabulary.kinds].map(([path, kind]) => [path, kind.name])).toEqual([
			['declared', 'Declared'],
			['defaulted', 'Defaulted'],
			['ambient', 'Ambient'],
			['exported.inner', 'Exported.Inner'],
			['ambient.inner', 'Ambient.Inner'],
			['bare.inner', 'Bare.Inner']
		]);
	});

	it('refuses a name spelled with an escape, which a syntactic reader would read as a different name', async () => {
		await expect(vocabularyIn('export interface Declaration<G> {', "\treadonly $kind: 'declaration';", '\treadonly accessor?: Fla\\u0067;', '}')).rejects.toThrow(
			/Fla\\u0067.*escape/
		);
		await expect(vocabularyIn('export interface Declaration<G> {', "\treadonly $kind: 'decl\\u0061ration';", '}')).rejects.toThrow(/escape/);
	});

	it('reads a module-keyword namespace as a namespace', async () => {
		const vocabulary = await vocabularyIn(
			"module Plain { interface Inner<G> { readonly $kind: 'plain.inner'; } }",
			"export module Exported { export interface Inner<G> { readonly $kind: 'exported.inner'; } }",
			"declare module Declared { interface Inner<G> { readonly $kind: 'declared.inner'; } }"
		);
		expect([...vocabulary.kinds].map(([path, kind]) => [path, kind.name])).toEqual([
			['plain.inner', 'Plain.Inner'],
			['exported.inner', 'Exported.Inner'],
			['declared.inner', 'Declared.Inner']
		]);
	});

	it('refuses a file that does not parse cleanly rather than reading what the parser recovered', async () => {
		await expect(vocabularyIn("interface Declaration<G> { $kind: 'declaration'; abstract?: Flag; accessor?: Flag; }")).rejects.toThrow(/declaration\.ts: .*parse/is);
	});

	it('reads a member named by a keyword like any other', async () => {
		const vocabulary = await vocabularyIn('export interface Declaration<G> {', "\treadonly $kind: 'declaration';", '\treadonly static?: Flag;', '\treadonly type: string;', '}');
		expect([...vocabulary.members('declaration')]).toEqual([
			['static', { optional: true, flag: true }],
			['type', { optional: false, flag: false }]
		]);
	});

	it('refuses a member not named by a plain identifier', async () => {
		const declaration = (member: string) => ['export interface Declaration<G> {', "\treadonly $kind: 'declaration';", `\t${member}`, '}'];
		await expect(vocabularyIn(...declaration("readonly 'async'?: Flag;"))).rejects.toThrow(/'async'.*identifier/);
		await expect(vocabularyIn(...declaration('readonly [key]?: Flag;'))).rejects.toThrow(/\[key\].*identifier/);
	});

	it('reads past a module augmentation named by a string: it augments another file and names no namespace', async () => {
		const vocabulary = await vocabularyIn(
			"export interface Declaration<G> { readonly $kind: 'declaration'; }",
			"declare module './other.ts' { interface Inner<G> extends Declaration<G> {} }"
		);
		expect([...vocabulary.kinds.keys()]).toEqual(['declaration']);
	});

	it('refuses a vocabulary kind declared inside a module augmentation named by a string, rather than dropping it', async () => {
		await expect(
			vocabularyIn("export interface Declaration<G> { readonly $kind: 'declaration'; }", "declare module './other.ts' { interface Inner<G> { readonly $kind: 'inner'; } }")
		).rejects.toThrow(/inner.*'\.\/other\.ts'/);
	});

	it('reads an interface as a kind only when its $kind is a string literal', async () => {
		const vocabulary = await vocabularyIn(
			"export interface Declaration<G> { readonly $kind: 'declaration'; readonly static?: Flag; }",
			'export interface Options { readonly $kind: true; readonly aaa?: Flag; }',
			'export interface Numbered { readonly $kind: -1; readonly bbb?: Flag; }'
		);
		expect([...vocabulary.kinds.keys()]).toEqual(['declaration']);
		expect([...vocabulary.flags]).toEqual(['static']);
	});
});

const vocabularyOf = async (...extra: readonly string[]): Promise<Vocabulary> => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	writeFileSync(
		join(dir, 'declaration.ts'),
		[
			'export interface Declaration<G> {',
			"\treadonly $kind: 'declaration';",
			'}',
			'export namespace Declaration {',
			'\texport interface Method<G> extends SubKindOf<V.Declaration<G>> {',
			"\t\treadonly $kind: 'declaration.method';",
			'\t\treadonly name: string;',
			'\t\treadonly static?: Flag;',
			'\t\treadonly privateName?: Flag;',
			'\t\treadonly body?: string;',
			'\t}',
			...extra,
			'}',
			''
		].join('\n')
	);
	try {
		return await readVocabulary(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
};

const claim = (vocab: string): ClaimFact => ({
	vocab,
	kind: 'function_definition',
	field: null,
	predicates: [],
	toplevel: true,
	within: [],
	fieldLiterals: {},
	tokens: [],
	children: []
});

describe('flagSegment', () => {
	it('reads a claim path whose last segment is a Flag of its parent path as the parent and the flag', async () => {
		const vocabulary = await vocabularyOf();
		expect(flagSegment(vocabulary, 'declaration.method.static')).toEqual({ parent: 'declaration.method', flag: 'static' });
		expect(flagSegment(vocabulary, 'declaration.method.private_name')).toEqual({ parent: 'declaration.method', flag: 'privateName' });
	});

	it('reads no flag where the last segment is a kind, a member that is data, or names nothing', async () => {
		const vocabulary = await vocabularyOf();
		expect(flagSegment(vocabulary, 'declaration.method')).toBeUndefined();
		expect(flagSegment(vocabulary, 'declaration.method.body')).toBeUndefined();
		expect(flagSegment(vocabulary, 'declaration.method.getter')).toBeUndefined();
		expect(flagSegment(vocabulary, 'declaration')).toBeUndefined();
	});

	it('refuses a path that is both a vocabulary kind and a Flag of its parent: one name names one thing', async () => {
		const vocabulary = await vocabularyOf(
			'\texport namespace Method {',
			'\t\texport interface Static<G> extends SubKindOf<V.Declaration.Method<G>> {',
			"\t\t\treadonly $kind: 'declaration.method.static';",
			'\t\t}',
			'\t}'
		);
		expect(() => flagSegment(vocabulary, 'declaration.method.static')).toThrow(/declaration\.method\.static.*kind.*declaration\.method.*static/);
	});
});

describe('resolveFlags', () => {
	it('claims a flag segment\'s parent path with the flag, and leaves every other claim as it is', async () => {
		const facts: BindingFacts = { claims: [claim('declaration.method.static'), claim('declaration.method')], members: [], containers: [], templates: [], unclaimed: [] };
		const resolved = resolveFlags(facts, await vocabularyOf(), new Map());
		expect(resolved.claims.map((c) => [c.vocab, c.flag])).toEqual([
			['declaration.method', 'static'],
			['declaration.method', undefined]
		]);
	});
});
