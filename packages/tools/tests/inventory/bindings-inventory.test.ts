import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bindingGrammars } from '@sittir/codegen/bindings';
import { bindingIssues } from '../../src/inventory/bindings.ts';
import {
	VOCABULARY_DIR,
	compileBindings,
	deriveVocabulary,
	vocabularyDisagreements,
	vocabularyMembers
} from '../../src/inventory/index.ts';
import { type Derivation, FLAGS_PATH, bindingPatterns, camel, levelMembers } from '@sittir/codegen/bindings';
import { type Vocabulary, readVocabulary } from '@sittir/codegen/bindings';
import { GENERATED_FILES } from '../../src/vocabulary/write.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const CEILING = JSON.parse(
	readFileSync(`${ROOT}packages/tools/tests/inventory/bindings-inventory.ceiling.json`, 'utf8')
) as {
	readonly unmapped: number;
	readonly compiling: readonly string[];
	readonly vocabularyDisagreements: readonly string[];
	readonly unroutedScope: readonly string[];
};

describe('bindingIssues', () => {
	const text = [
		'; comment (nope)',
		'(module) @module',
		'(no_such_kind) @a',
		'(function_definition no_such_field: (identifier))',
		'(identifier) @identifier'
	].join('\n');
	it('splits a bindings file into its top-level patterns with their lines', async () => {
		expect((await bindingPatterns(text)).map((p) => p.line)).toEqual([2, 3, 4, 5]);
	});
	it('lists every unknown node and field, not just the first', async () => {
		expect(await bindingIssues('python', text)).toEqual([
			{ line: 3, message: 'unknown node no_such_kind' },
			{ line: 4, message: 'unknown field no_such_field' }
		]);
	});
});

describe('compileBindings', () => {
	it('reports each bindings file against its parser and never loses a compiling grammar', async () => {
		const reports = await compileBindings(bindingGrammars());
		expect(reports.map((r) => r.grammar)).toEqual([...bindingGrammars()]);
		for (const report of reports) {
			if (CEILING.compiling.includes(report.grammar)) expect(report.error, report.grammar).toBeNull();
		}
	}, 120_000);
});

describe('deriveVocabulary', () => {
	let d: Derivation;
	beforeAll(async () => {
		d = await deriveVocabulary();
	}, 120_000);
	it('reads a minted text kind as the token text it replaced', () => {
		const format = d.members.get('expression.interpolation.format');
		const kinds = [...(format?.values() ?? [])].flatMap((member) => [...member.kinds]);
		expect(kinds).toContain('text:[^{}\\n]+');
		expect(d.unmapped.has('<python:format_specifier_text>')).toBe(false);
	});
	it('claims every namespace the spec names and derives no inclusion cycle', () => {
		const tops = new Set([...d.allvocab].map((v) => v.split('.')[0]));
		for (const ns of [
			'module',
			'declaration',
			'statement',
			'clause',
			'argument',
			'element',
			'expression',
			'pattern',
			'type',
			'literal',
			'identifier',
			'modifier',
			'attribute',
			'comment'
		]) {
			expect(tops.has(ns), ns).toBe(true);
		}
		expect(d.cycles).toEqual([]);
	});
	it('keeps the unmapped count at or below the recorded ceiling', () => {
		const total = [...d.unmapped.values()].reduce((a, b) => a + b, 0);
		expect(total).toBeLessThanOrEqual(CEILING.unmapped);
	});
	it('makes a member required only when every claiming grammar carries it and every claimed child does', () => {
		const fn = levelMembers(d, 'declaration.function');
		expect(fn.get('name')?.optional).toBe(false);
		expect(fn.get('parameters')?.optional).toBe(false);
		const method = levelMembers(d, 'declaration.method');
		expect(method.get('name')?.optional).toBe(false);
		expect(method.get('parameters')?.optional).toBe(false);
		expect(method.get('decorators')?.optional).toBe(true);
	});
	it('names a refinement literal by the member that holds it', () => {
		const equal = d.refinements.get('expression.binary.comparison.equal');
		expect([...(equal?.literals.keys() ?? [])]).toEqual(['operator']);
	});
	it('refines by an axis value through its text alone, which no member holds', () => {
		const constant = d.refinements.get('declaration.variable.constant');
		expect(constant?.parent).toBe('declaration.variable');
		expect([...(constant?.literals.values() ?? [])].flatMap((texts) => [...texts])).toEqual(['const']);
	});
	it('lands a container pattern capture only on the kinds its element slot names directly', () => {
		expect(levelMembers(d, 'declaration.class').get('decorators')?.grammars.has('python')).toBe(true);
		expect(levelMembers(d, 'declaration.function').get('decorators')?.grammars.has('python')).toBe(true);
		expect(levelMembers(d, 'declaration.method').get('decorators')?.grammars.has('typescript')).toBe(true);
		for (const v of [
			'declaration.enum_member',
			'declaration.field',
			'declaration.type_parameter',
			'declaration.type_parameter.lifetime',
			'declaration.type_parameter.value'
		])
			expect(d.members.get(v)?.get('attributes')?.grammars.has('rust'), v).toBe(true);
		expect(d.members.get('declaration.parameter')?.has('attributes')).toBe(false);
		for (const v of ['statement.block', 'declaration.function', 'declaration.class', 'declaration.variable'])
			expect(d.members.get(v)?.has('declare') ?? false, v).toBe(false);
		expect(d.untargeted).toEqual([]);
		expect(d.uncaptured).toEqual([]);
	});
	it('keeps the bounds of a type argument (`Iterator<Item: Copy>`), a wrapper claimed as a kind of its own', () => {
		const argument = d.members.get('element.type_argument');
		expect(argument?.get('constraint')?.kinds).toEqual(new Set(['clause.bounds']));
		expect(argument?.get('constraint')?.optional).toBe(true);
		expect(argument?.get('content')?.kinds.has('element.type_binding')).toBe(true);
		expect(d.members.get('type.generic.turbofish')?.get('typeArguments')?.kinds).toEqual(
			new Set(['element.type_argument'])
		);
	});
	it('claims a container whose capture has no direct target as a vocabulary kind of its own', () => {
		const ambient = d.members.get('declaration.ambient');
		expect([...(ambient?.keys() ?? [])]).toEqual(['content']);
		expect(ambient?.get('content')?.kinds.has('statement.block')).toBe(true);
		expect(levelMembers(d, 'declaration.ambient').get('content')?.optional).toBe(false);
		expect([...(d.members.get('statement.labeled')?.keys() ?? [])].sort()).toEqual(['body', 'label']);
		for (const v of ['statement.expression', 'statement.return', 'statement.block', 'statement.if'])
			expect(d.members.get(v)?.get('label')?.grammars.has('typescript') ?? false, v).toBe(false);
	});
	it('lifts a capture nested inside a container child onto the claimed kind', () => {
		const cls = levelMembers(d, 'declaration.class');
		expect(cls.has('extends')).toBe(true);
		expect(cls.has('implements')).toBe(true);
		expect(cls.has('heritage')).toBe(false);
	});
	it('renames the slot a positional wildcard capture stands at', () => {
		expect([...(d.members.get('expression.unary')?.keys() ?? [])].sort()).toEqual(['argument']);
		expect(d.members.get('expression.try')?.has('argument')).toBe(true);
		expect(d.members.get('expression.try')?.has('value')).toBe(false);
	});
	it('resolves a declared container, a list and an envelope to the kinds their element admits', () => {
		const parameters = d.members.get('declaration.function')?.get('parameters')?.kinds ?? new Set();
		expect(parameters.has('declaration.parameter')).toBe(true);
		expect([...parameters].filter((k) => k.startsWith('<'))).toEqual([]);
		const body = d.members.get('expression.class')?.get('body');
		expect([...(body?.kinds ?? [])].sort()).toEqual([
			'declaration.field',
			'declaration.method',
			'declaration.method.signature',
			'declaration.method.signature.abstract',
			'declaration.signature.index',
			'statement.block.static'
		]);
		expect(body?.multiple).toBe(true);
	});
	it('reads a polymorph through its forms, keeping a list form apart from a scalar form', () => {
		const exception = d.members.get('clause.except')?.get('exception');
		expect(exception?.multiple).toBe(true);
		expect(exception?.scalar).toBe(true);
	});
	it('never makes a layout slot a member: an options-block address or a slot of unclaimed kinds', () => {
		for (const [v, members] of d.members) {
			for (const name of ['terminator', 'automaticSemicolon', 'stringStart', 'stringEnd', 'stringOpen'])
				expect(members.has(name), `${v}.${name}`).toBe(false);
		}
	});
});

describe('the authored vocabulary', () => {
	it('disagrees with the bindings only where the ceiling records', async () => {
		expect(vocabularyDisagreements(await deriveVocabulary(), await readVocabulary(VOCABULARY_DIR))).toEqual(CEILING.vocabularyDisagreements);
	}, 120_000);
	it('has its scope routed wherever it declares one, but where the ceiling records', async () => {
		const d = await deriveVocabulary();
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		const unrouted = [...d.members].filter(([path, members]) => vocabulary.members(path).has('scope') && !members.has('scope')).map(([path]) => path);
		expect(unrouted.sort()).toEqual(CEILING.unroutedScope);
	}, 120_000);
	it('reports a template hole its interface does not declare', async () => {
		const d = await deriveVocabulary();
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		const [path, holes] = [...d.holes].find(([, h]) => h.size > 0) ?? [];
		const [hole] = holes?.keys() ?? [];
		expect(hole).toBeDefined();
		if (path === undefined || hole === undefined) return;
		const withoutHole = {
			...vocabulary,
			members: (kind: string) => new Map([...vocabulary.members(kind)].filter(([m]) => kind !== path || m !== hole))
		};
		expect(vocabularyDisagreements(d, withoutHole)).toContain(`${path}.${hole}: templated, but its interface does not declare it`);
	}, 120_000);
	it('needs no declaration for a refinement pinned slot: the read tells it, so it is no member', async () => {
		const d = await deriveVocabulary();
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		const pinned = [...d.refinements].flatMap(([v, r]) => [...r.literals.keys()].map((field) => [v, camel(field)] as const).filter(([, p]) => !d.members.get(v)?.has(p)));
		expect(pinned.length).toBeGreaterThan(0);
		const unpinned = {
			...vocabulary,
			members: (kind: string) => new Map([...vocabulary.members(kind)].filter(([m]) => !pinned.some(([v, p]) => v === kind && p === m)))
		};
		expect(vocabularyDisagreements(d, unpinned)).toEqual(vocabularyDisagreements(d, vocabulary));
	}, 120_000);

	it('is authored: no file but the generated ones says it is generated', () => {
		const generated = new Set([...GENERATED_FILES, relative(VOCABULARY_DIR, FLAGS_PATH).split(sep).join(posix.sep)]);
		for (const entry of readdirSync(VOCABULARY_DIR, { recursive: true, encoding: 'utf8' })) {
			const file = entry.split(sep).join(posix.sep);
			if (!file.endsWith('.ts') || generated.has(file)) continue;
			expect(readFileSync(join(VOCABULARY_DIR, file), 'utf8'), file).not.toMatch(/^\/\/ Generated/m);
		}
	});
});

describe('readVocabulary', () => {
	let vocabulary: Vocabulary;
	beforeAll(async () => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, 'decl.ts'),
		[
			'export interface Declaration<G> {',
			"\treadonly $kind: 'declaration';",
			'\treadonly name: string;',
			'}',
			'export namespace Declaration {',
			'\texport interface Function<G>',
			'\t\textends SubKindOf<V.Declaration<G>> {',
			"\t\treadonly $kind: 'declaration.function';",
			'\t\treadonly body?: string;',
			'\t}',
			'}',
			''
		].join('\n')
	);
	vocabulary = await readVocabulary(dir);
	rmSync(dir, { recursive: true, force: true });
	});

	it('keys each interface by its kind, with its parent from a multi-line extends', () => {
		expect(vocabulary.kinds.get('declaration.function')).toMatchObject({ name: 'Declaration.Function', parent: 'declaration' });
	});

	it('gives a kind its inherited members, each marked optional or required', () => {
		expect(Object.fromEntries(vocabulary.members('declaration.function'))).toEqual({
			body: { optional: true, flag: false },
			name: { optional: false, flag: false }
		});
	});

	it('gives the grammar-bindings derivation every member a kind declares or inherits', () => {
		expect(vocabularyMembers(vocabulary).get('declaration.function')).toEqual(new Set(['body', 'name']));
	});
});

describe('readVocabulary over feature folders', () => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	const write = (file: string, lines: readonly string[]): void => {
		mkdirSync(dirname(join(dir, file)), { recursive: true });
		writeFileSync(join(dir, file), [...lines, ''].join('\n'));
	};
	write('decl.ts', [
		'export interface Declaration<G> {',
		"\treadonly $kind: 'declaration';",
		'\treadonly name: string;',
		'}',
		'export namespace Declaration {',
		'\texport interface Function<G> extends SubKindOf<V.Declaration<G>> {',
		"\t\treadonly $kind: 'declaration.function';",
		'\t\treadonly body?: string;',
		'\t}',
		'}'
	]);
	write('features/lambdas/index.ts', ["export type * from './decl.ts';", 'export interface Lambdas {', '\treadonly lambdas: true;', '}']);
	write('features/lambdas/decl.ts', [
		'export namespace Declaration {',
		'\texport interface Function<G> {',
		'\t\treadonly body: string;',
		'\t\treadonly arrow?: Flag;',
		'\t}',
		'\texport namespace Function {',
		'\t\texport interface Lambda<G> extends SubKindOf<V.Declaration.Function<G>> {',
		"\t\t\treadonly $kind: 'declaration.function.lambda';",
		'\t\t}',
		'\t}',
		'}'
	]);
	let vocabulary: Vocabulary;
	beforeAll(async () => {
		vocabulary = await readVocabulary(dir);
		rmSync(dir, { recursive: true, force: true });
	});

	it('holds the kinds a feature adds, under their parents', () => {
		expect(vocabulary.kinds.get('declaration.function.lambda')).toMatchObject({ name: 'Declaration.Function.Lambda', parent: 'declaration.function' });
	});

	it('gives a kind the members a feature adds to it, optional when any declaration of one is', () => {
		expect(Object.fromEntries(vocabulary.members('declaration.function.lambda'))).toEqual({
			arrow: { optional: true, flag: true },
			body: { optional: true, flag: false },
			name: { optional: false, flag: false }
		});
	});
});

describe('readVocabulary over an owner refined by a value', () => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	const write = (file: string, lines: readonly string[]): void => {
		mkdirSync(dirname(join(dir, file)), { recursive: true });
		writeFileSync(join(dir, file), [...lines, ''].join('\n'));
	};
	write('decl.ts', [
		'export interface Declaration<G> {',
		"\treadonly $kind: 'declaration';",
		'\treadonly name: string;',
		'}',
		'export namespace Declaration {',
		'\texport interface Function<G> extends SubKindOf<V.Declaration<G>> {',
		"\t\treadonly $kind: 'declaration.function';",
		'\t}',
		'\texport interface Public<G> extends RefinedBy<V.Declaration<G>, V.Modifier.Public<G>> {',
		"\t\treadonly $kind: 'declaration.public';",
		'\t}',
		'\texport namespace Public {',
		'\t\texport interface Restricted<G> extends RefinedBy<V.Declaration.Public<G>, V.Modifier.Public.Restricted<G>> {',
		"\t\t\treadonly $kind: 'declaration.public.restricted';",
		'\t\t}',
		'\t}',
		'}'
	]);
	write('modifier.ts', [
		'export interface Modifier<G> {',
		"\treadonly $kind: 'modifier';",
		'}',
		'export namespace Modifier {',
		'\texport interface Public<G> extends SubKindOf<V.Modifier<G>> {',
		"\t\treadonly $kind: 'modifier.public';",
		'\t}',
		'\texport namespace Public {',
		'\t\texport interface Restricted<G> extends SubKindOf<V.Modifier.Public<G>> {',
		"\t\t\treadonly $kind: 'modifier.public.restricted';",
		'\t\t}',
		'\t}',
		'}'
	]);
	write('features/scoped/index.ts', ["export type * from './modifier.ts';", 'export interface Scoped {', '\treadonly scoped: true;', '}']);
	write('features/scoped/modifier.ts', [
		'export namespace Modifier {',
		'\texport namespace Public {',
		'\t\texport interface Restricted<G> {',
		'\t\t\treadonly scope: string;',
		'\t\t}',
		'\t}',
		'}'
	]);
	let vocabulary: Vocabulary;
	beforeAll(async () => {
		vocabulary = await readVocabulary(dir);
		rmSync(dir, { recursive: true, force: true });
	});

	it('keeps the owner as the parent and records the value the kind is refined by', () => {
		expect(vocabulary.kinds.get('declaration.public.restricted')).toMatchObject({ parent: 'declaration.public', refines: 'modifier.public.restricted' });
	});

	it("gives an owner's refinement the members its value adds, beside the owner's", () => {
		expect(Object.fromEntries(vocabulary.members('declaration.public.restricted'))).toEqual({
			name: { optional: false, flag: false },
			scope: { optional: false, flag: false }
		});
		expect(vocabularyMembers(vocabulary).get('declaration.public')).toEqual(new Set(['name']));
	});
});
