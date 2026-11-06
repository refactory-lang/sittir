import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { type BindingFacts, type ClaimFact, type MemberFact, type ModelNode, type Vocabulary, canonicalFacts, canonicalPaths, flagSegment, readVocabulary, resolveFlags } from '../index.ts';

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
			'export interface Declaration<G, K = "declaration"> {',
			"\treadonly $path: K;",
			'\treadonly name: string;',
			'}',
			'export interface Generic<G, K = "declaration.generic"> extends SubKindOf<V.Declaration<G>> {',
			"\treadonly $path: K;",
			'}',
			'export interface Parenthesized<G, K = "declaration.parenthesized"> extends SubKindOf<(V.Declaration<G>)> {',
			"\treadonly $path: K;",
			'}',
			'export interface Bare<G, K = "declaration.bare"> extends V.Declaration {',
			"\treadonly $path: K;",
			'}'
		);
		for (const path of ['declaration.generic', 'declaration.parenthesized', 'declaration.bare']) {
			expect(vocabulary.kinds.get(path)?.parent, path).toBe('declaration');
			expect([...vocabulary.members(path).keys()], path).toEqual(['name']);
		}
	});

	it('drops a member a refinement narrows to never from its members, and keeps it on the parent', async () => {
		const vocabulary = await vocabularyIn(
			'export interface Declaration<G, K = "declaration"> {',
			"\treadonly $path: K;",
			'\treadonly name: string;',
			'\treadonly parameters?: string[];',
			'}',
			'export interface Bare<G, K = "declaration.bare"> extends SubKindOf<V.Declaration<G>> {',
			"\treadonly $path: K;",
			'\treadonly parameters?: never;',
			'}'
		);
		expect([...vocabulary.members('declaration').keys()]).toEqual(['name', 'parameters']);
		expect([...vocabulary.members('declaration.bare').keys()]).toEqual(['name']);
	});

	it('drops a member the feature that owns it narrows to never at a refinement, in every composition', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
		const write = (file: string, lines: readonly string[]): void => {
			mkdirSync(dirname(join(dir, file)), { recursive: true });
			writeFileSync(join(dir, file), [...lines, ''].join('\n'));
		};
		write('declaration.ts', [
			'export interface Declaration<G, K = "declaration"> {',
			"\treadonly $path: K;",
			'\treadonly name: string;',
			'}',
			'export namespace Declaration {',
			'\texport interface Parameter<G, K = "declaration.parameter"> extends SubKindOf<V.Declaration<G>> {',
			"\t\treadonly $path: K;",
			'\t}',
			'\texport namespace Parameter {',
			'\t\texport interface Rest<G, K = "declaration.parameter.rest"> extends SubKindOf<V.Declaration.Parameter<G>> {',
			"\t\t\treadonly $path: K;",
			'\t\t}',
			'\t}',
			'}'
		]);
		write('features/bounded/index.ts', ["export type * from './declaration.ts';", 'export interface Bounded {', '\treadonly bounded: true;', '}']);
		write('features/bounded/declaration.ts', [
			'export namespace Declaration {',
			'\texport interface Parameter<G> {',
			'\t\treadonly bounds?: string[];',
			'\t}',
			'\texport namespace Parameter {',
			'\t\texport interface Rest<G> {',
			'\t\t\treadonly bounds?: never;',
			'\t\t}',
			'\t}',
			'}'
		]);
		write('compositions.ts', ['export interface WithBounded extends Bounded {}', 'export interface WithoutBounded {}']);
		try {
			const vocabulary = await readVocabulary(dir);
			for (const view of [vocabulary, vocabulary.composedAs('WithBounded')]) {
				expect([...view.members('declaration.parameter').keys()]).toEqual(['bounds', 'name']);
				expect([...view.members('declaration.parameter.rest').keys()]).toEqual(['name']);
			}
			expect([...vocabulary.composedAs('WithoutBounded').members('declaration.parameter.rest').keys()]).toEqual(['name']);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('reads an interface or namespace however it is exported or declared', async () => {
		const vocabulary = await vocabularyIn(
			"export declare interface Declared<G, K = 'declared'> { readonly $path: K; }",
			"export default interface Defaulted<G, K = 'defaulted'> { readonly $path: K; }",
			"declare interface Ambient<G, K = 'ambient'> { readonly $path: K; }",
			"export declare namespace Exported { export interface Inner<G, K = 'exported.inner'> { readonly $path: K; } }",
			"declare namespace Ambient { interface Inner<G, K = 'ambient.inner'> { readonly $path: K; } }",
			"namespace Bare { interface Inner<G, K = 'bare.inner'> { readonly $path: K; } }"
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

	it('reads a token alias as a kind: its path from its Text path, its parent from its namespace, its flags from Flagged', async () => {
		const vocabulary = await vocabularyIn(
			"export interface Type<G, K = 'type'> { readonly $path: K; }",
			'export namespace Type {',
			"\texport type Primitive<G extends GrammarMap> = Flagged<Text<G, 'type.primitive'>, 'unsigned' | 'wide'>;",
			'\texport namespace Primitive {',
			"\t\texport type Unchecked<G extends GrammarMap> = Text<G, 'type.primitive.unchecked'>;",
			'\t}',
			"\texport type Other<G extends GrammarMap> = Slot<G, 'type', 'other', unknown>;",
			'}'
		);
		expect([...vocabulary.kinds].map(([path, kind]) => [path, kind.name, kind.parent])).toEqual([
			['type', 'Type', undefined],
			['type.primitive', 'Type.Primitive', 'type'],
			['type.primitive.unchecked', 'Type.Primitive.Unchecked', 'type.primitive']
		]);
		expect([...vocabulary.members('type.primitive')].map(([name, facts]) => [name, facts.flag])).toEqual([
			['unsigned', true],
			['wide', true]
		]);
		expect(flagSegment(vocabulary, 'type.primitive.unchecked.unsigned')).toEqual({ parent: 'type.primitive.unchecked', flag: 'unsigned' });
	});

	it('refuses a name spelled with an escape, which a syntactic reader would read as a different name', async () => {
		await expect(vocabularyIn('export interface Declaration<G, K = "declaration"> {', "\treadonly $path: K;", '\treadonly accessor?: Fla\\u0067;', '}')).rejects.toThrow(
			/Fla\\u0067.*escape/
		);
		await expect(vocabularyIn('export interface Declaration<G, K = "decl\\u0061ration"> {', "\treadonly $path: K;", '}')).rejects.toThrow(/escape/);
	});

	it('reads a module-keyword namespace as a namespace', async () => {
		const vocabulary = await vocabularyIn(
			"module Plain { interface Inner<G, K = 'plain.inner'> { readonly $path: K; } }",
			"export module Exported { export interface Inner<G, K = 'exported.inner'> { readonly $path: K; } }",
			"declare module Declared { interface Inner<G, K = 'declared.inner'> { readonly $path: K; } }"
		);
		expect([...vocabulary.kinds].map(([path, kind]) => [path, kind.name])).toEqual([
			['plain.inner', 'Plain.Inner'],
			['exported.inner', 'Exported.Inner'],
			['declared.inner', 'Declared.Inner']
		]);
	});

	it('refuses a file that does not parse cleanly rather than reading what the parser recovered', async () => {
		await expect(vocabularyIn("interface Declaration<G> { $path: 'declaration'; abstract?: Flag; accessor?: Flag; }")).rejects.toThrow(/declaration\.ts: .*parse/is);
	});

	it('stamps the arity of a member from its type: a list where it is an array, either where a union holds an array arm, and one value otherwise', async () => {
		const vocabulary = await vocabularyIn(
			'export interface Declaration<G, K = "declaration"> {',
			"\treadonly $path: K;",
			'\treadonly extern?: V.Modifier.Extern<G>;',
			"\treadonly name: G['slots']['declaration']['name'];",
			'\treadonly bounds?: V.Type.Any<G>[];',
			'\treadonly extends?: readonly (V.Type<G> | V.Clause<G>)[];',
			'\treadonly arguments: V.Expression<G> | V.Expression<G>[];',
			'}'
		);
		const members = vocabulary.members('declaration');
		expect(Object.fromEntries([...members].map(([name, member]) => [name, member.arity ?? 'one']))).toEqual({ extern: 'one', name: 'one', bounds: 'list', extends: 'list', arguments: 'either' });
	});

	it('reads a member named by a keyword like any other', async () => {
		const vocabulary = await vocabularyIn('export interface Declaration<G, K = "declaration"> {', "\treadonly $path: K;", '\treadonly static?: Flag;', '\treadonly type: string;', '}');
		expect([...vocabulary.members('declaration')]).toEqual([
			['static', { optional: true, flag: true }],
			['type', { optional: false, flag: false }]
		]);
	});

	it('refuses a member not named by a plain identifier', async () => {
		const declaration = (member: string) => ['export interface Declaration<G, K = "declaration"> {', "\treadonly $path: K;", `\t${member}`, '}'];
		await expect(vocabularyIn(...declaration("readonly 'async'?: Flag;"))).rejects.toThrow(/'async'.*identifier/);
		await expect(vocabularyIn(...declaration('readonly [key]?: Flag;'))).rejects.toThrow(/\[key\].*identifier/);
	});

	it('reads past a module augmentation named by a string: it augments another file and names no namespace', async () => {
		const vocabulary = await vocabularyIn(
			"export interface Declaration<G, K = 'declaration'> { readonly $path: K; }",
			"declare module './other.ts' { interface Inner<G> extends Declaration<G> {} }"
		);
		expect([...vocabulary.kinds.keys()]).toEqual(['declaration']);
	});

	it('refuses a vocabulary kind declared inside a module augmentation named by a string, rather than dropping it', async () => {
		await expect(
			vocabularyIn("export interface Declaration<G, K = 'declaration'> { readonly $path: K; }", "declare module './other.ts' { interface Inner<G, K = 'inner'> { readonly $path: K; } }")
		).rejects.toThrow(/inner.*'\.\/other\.ts'/);
	});

	it('reads an interface as a kind only when its $path is a type parameter, its path that parameter\'s default', async () => {
		const vocabulary = await vocabularyIn(
			"export interface Declaration<G, K = 'declaration'> { readonly $path: K; readonly static?: Flag; }",
			'export interface Options { readonly $path: true; readonly aaa?: Flag; }',
			'export interface Numbered { readonly $path: -1; readonly bbb?: Flag; }'
		);
		expect([...vocabulary.kinds.keys()]).toEqual(['declaration']);
		expect([...vocabulary.flags]).toEqual(['static']);
	});

	it('refuses a $path spelled as its path, or naming a type parameter with no path default', async () => {
		await expect(vocabularyIn("export interface Declaration<G> { readonly $path: 'declaration'; }")).rejects.toThrow(/spells its \$path/);
		await expect(vocabularyIn('export interface Declaration<G, K> { readonly $path: K; }')).rejects.toThrow(/no type parameter whose default is its path/);
	});
});

const vocabularyOf = async (...extra: readonly string[]): Promise<Vocabulary> => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	writeFileSync(
		join(dir, 'declaration.ts'),
		[
			'export interface Declaration<G, K = "declaration"> {',
			"\treadonly $path: K;",
			'}',
			'export namespace Declaration {',
			'\texport interface Method<G, K = "declaration.method"> extends SubKindOf<V.Declaration<G>> {',
			"\t\treadonly $path: K;",
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
	absent: [],
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
			'\t\texport interface Static<G, K = "declaration.method.static"> extends SubKindOf<V.Declaration.Method<G>> {',
			"\t\t\treadonly $path: K;",
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

const vocabularyFiles = async (files: Readonly<Record<string, readonly string[]>>): Promise<Vocabulary> => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	for (const [file, lines] of Object.entries(files)) writeFileSync(join(dir, file), [...lines, ''].join('\n'));
	try {
		return await readVocabulary(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
};

const SYNONYM_KINDS = [
	'export interface Declaration<G, K = "declaration"> {',
	"\treadonly $path: K;",
	'}',
	'export namespace Declaration {',
	'\texport interface Parameter<G, K = "declaration.parameter"> extends SubKindOf<V.Declaration<G>> {',
	"\t\treadonly $path: K;",
	'\t\treadonly name?: string;',
	'\t\treadonly mutable?: Flag;',
	'\t}',
	'\texport namespace Parameter {',
	'\t\texport interface Receiver<G, K = "declaration.parameter.receiver"> extends SubKindOf<V.Declaration.Parameter<G>> {',
	"\t\t\treadonly $path: K;",
	'\t\t}',
	'\t}',
	'\texport interface Self<G, K = "declaration.self"> extends SubKindOf<V.Declaration<G>> {',
	"\t\treadonly $path: K;",
	'\t}',
	'\texport interface Method<G, K = "declaration.method"> extends SubKindOf<V.Declaration<G>> {',
	"\t\treadonly $path: K;",
	'\t}',
	'}'
];

const synonymVocabulary = (table: readonly string[] = ["\treadonly receiver: 'self' | 'this';"], flags: readonly string[] = ["\treadonly mutable: 'mut';"]) =>
	vocabularyFiles({
		'declaration.ts': [...SYNONYM_KINDS, 'export interface DeclarationSynonyms {', ...table, '}'],
		'utils.ts': ['export interface FlagSynonyms {', ...flags, '}']
	});

describe('synonym tables', () => {
	it("reads each level's table beside its level kind, and the flags' table beside Flag", async () => {
		const vocabulary = await vocabularyFiles({
			'declaration.ts': [
				...SYNONYM_KINDS,
				'export interface DeclarationSynonyms {',
				"\treadonly receiver: 'self' | \"this\";",
				"\treadonly null: 'none';",
				'}',
				"export interface ExpressionSynonyms { readonly member: 'field'; }"
			],
			'utils.ts': ["export interface FlagSynonyms { readonly mutable: 'mut'; }"]
		});
		expect([...vocabulary.synonyms.levels].map(([level, table]) => [level, [...table]])).toEqual([
			[
				'declaration',
				[
					['receiver', ['self', 'this']],
					['null', ['none']]
				]
			]
		]);
		expect([...vocabulary.synonyms.flags]).toEqual([['mutable', ['mut']]]);
		expect(vocabulary.kinds.has('declaration_synonyms')).toBe(false);
	});

	it('refuses a table entry that is not a union of string literals', async () => {
		await expect(synonymVocabulary(['\treadonly receiver: string;'])).rejects.toThrow(/DeclarationSynonyms\.receiver lists its synonyms as a union of string literals/);
		await expect(synonymVocabulary(["\treadonly receiver: 'self' | number;"])).rejects.toThrow(/DeclarationSynonyms\.receiver/);
	});

	it('refuses a second table for a level, which interface merging would otherwise fold into one', async () => {
		await expect(
			vocabularyFiles({
				'declaration.ts': [...SYNONYM_KINDS, "export interface DeclarationSynonyms { readonly receiver: 'self'; }", "export interface DeclarationSynonyms { readonly method: 'fn'; }"]
			})
		).rejects.toThrow(/DeclarationSynonyms is declared more than once/);
	});

	it("refuses a second flags' table", async () => {
		await expect(
			vocabularyFiles({ 'declaration.ts': [...SYNONYM_KINDS, 'export interface FlagSynonyms {}'], 'utils.ts': ['export interface FlagSynonyms {}'] })
		).rejects.toThrow(/FlagSynonyms is declared 2 times/);
	});
});

describe('canonicalPaths', () => {
	it('reads a synonym as the canonical segment at its position, canonical names first', async () => {
		const canonical = canonicalPaths(await synonymVocabulary());
		expect(canonical('declaration.parameter.receiver')).toBe('declaration.parameter.receiver');
		expect(canonical('declaration.parameter.self')).toBe('declaration.parameter.receiver');
		expect(canonical('declaration.parameter.this')).toBe('declaration.parameter.receiver');
		expect(canonical('declaration.self')).toBe('declaration.self');
	});

	it('reads a synonym only where its canonical segment has a position, and keeps what it cannot resolve as written', async () => {
		const canonical = canonicalPaths(await synonymVocabulary());
		expect(canonical('declaration.method.this')).toBe('declaration.method.this');
		expect(canonical('declaration.unknown.this')).toBe('declaration.unknown.this');
		expect(canonical('expression.this')).toBe('expression.this');
	});

	it("reads a flag's synonym in a path's last segment as the flag, and nowhere else", async () => {
		const canonical = canonicalPaths(await synonymVocabulary());
		expect(canonical('declaration.parameter.mut')).toBe('declaration.parameter.mutable');
		expect(canonical('declaration.parameter.mut.receiver')).toBe('declaration.parameter.mut.receiver');
		expect(canonical('declaration.method.mut')).toBe('declaration.method.mut');
	});

	it('reads a segment that only prefixes kinds as a canonical name at its position', async () => {
		const canonical = canonicalPaths(
			await vocabularyFiles({
				'declaration.ts': [
					"export interface Declaration<G, K = 'declaration'> { readonly $path: K; }",
					"export namespace Declaration { export namespace Slot { export interface Receiver<G, K = 'declaration.slot.receiver'> extends SubKindOf<V.Declaration<G>> { readonly $path: K; } } }",
					"export namespace Declaration { export namespace Port { export interface Receiver<G, K = 'declaration.port.receiver'> extends SubKindOf<V.Declaration<G>> { readonly $path: K; } } }",
					"export interface DeclarationSynonyms { readonly port: 'slot' | 'socket'; }"
				]
			})
		);
		expect(canonical('declaration.slot.receiver')).toBe('declaration.slot.receiver');
		expect(canonical('declaration.socket.receiver')).toBe('declaration.port.receiver');
	});

	it('refuses a word that is a synonym of two segments at one position', async () => {
		const canonical = canonicalPaths(await synonymVocabulary(["\treadonly receiver: 'self';", "\treadonly parameter: 'param';", "\treadonly self: 'param';"]));
		expect(() => canonical('declaration.param')).toThrow(/declaration\.param spells declaration\.parameter and declaration\.self/);
	});
});

const member = (name: string): MemberFact => ({ route: 'rename', owner: 'parameter', name, field: null, kind: null, after: null, anchor: null });

describe('canonicalFacts', () => {
	it("drops a capture its pattern's predicates name where no path its claim reads declares it, and keeps one a path declares", async () => {
		const vocabulary = await vocabularyIn(
			"export interface Declaration<G, K = 'declaration'> { readonly $path: K; }",
			"export interface Constant<G, K = 'declaration.constant'> extends SubKindOf<V.Declaration<G>> { readonly $path: K; readonly name: string; }",
			"export interface Constructor<G, K = 'declaration.constructor'> extends SubKindOf<V.Declaration<G>> { readonly $path: K; readonly body: string; }"
		);
		const slot = (name: string) => ({ name, propertyName: name, required: true, multiple: false, storage: 'verbatim', kinds: ['identifier'], terminals: [] });
		const assignment: ModelNode = { kind: 'assignment', modelType: 'branch', unit: false, layout: false, seated: false, slots: [slot('name'), slot('body')], subtypes: [], defaultSubtype: null, elementKinds: [], enumMembers: [], text: null, pattern: null, variantOf: null, splitFrom: null, aliasStorage: null, interiorPart: null, shownAs: [] };
		const named = (name: string, claims: readonly number[], tested?: true): MemberFact => ({ route: 'rename', owner: 'assignment', name, field: name, kind: null, after: null, anchor: null, claims, ...(tested ? { tested } : {}) });
		const facts: BindingFacts = {
			claims: [{ ...claim('declaration.constant'), kind: 'assignment' }, { ...claim('declaration.constructor'), kind: 'assignment' }],
			members: [named('name', [0], true), named('name', [1], true), named('body', [1])],
			containers: [],
			templates: [],
			unclaimed: []
		};
		const canonical = canonicalFacts(facts, vocabulary, new Map([['assignment', assignment]]));
		expect(canonical.members.map((member) => [member.route === 'dropped' ? null : member.name, member.claims])).toEqual([
			['name', [0]],
			['body', [1]]
		]);
	});

	it("hands on canonical claim paths, template paths and flag captures, so resolveFlags reads canonical names", async () => {
		const vocabulary = await synonymVocabulary();
		const facts: BindingFacts = {
			claims: [{ ...claim('declaration.parameter.self'), kind: 'parameter' }, { ...claim('declaration.parameter.mut'), kind: 'parameter' }],
			members: [member('mut'), member('name'), member('other')],
			containers: [],
			templates: [{ vocabs: ['declaration.parameter.this'], target: 'parameter', template: '', holes: [] }],
			unclaimed: []
		};
		const parameter: ModelNode = { kind: 'parameter', modelType: 'branch', unit: false, layout: false, seated: false, slots: [], subtypes: [], defaultSubtype: null, elementKinds: [], enumMembers: [], text: null, pattern: null, variantOf: null, splitFrom: null, aliasStorage: null, interiorPart: null, shownAs: [] };
		const model = new Map([['parameter', parameter]]);
		const canonical = canonicalFacts(facts, vocabulary, model);
		expect(canonical.claims.map((c) => c.vocab)).toEqual(['declaration.parameter.receiver', 'declaration.parameter.mutable']);
		expect(canonical.templates.map((t) => t.vocabs)).toEqual([['declaration.parameter.receiver']]);
		expect(canonical.members.map((m) => (m.route === 'dropped' ? null : m.name))).toEqual(['mutable', 'name', 'other']);
		const resolved = resolveFlags(canonical, vocabulary, model);
		expect(resolved.claims.map((c) => [c.vocab, c.flag])).toEqual([
			['declaration.parameter.receiver', undefined],
			['declaration.parameter', 'mutable']
		]);
		expect(resolved.members.map((m) => [m.route === 'dropped' ? null : m.name, m.flag])).toEqual([
			['mutable', true],
			['name', undefined],
			['other', undefined]
		]);
	});
});
