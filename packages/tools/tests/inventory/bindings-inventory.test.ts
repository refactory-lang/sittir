import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bindingIssues, bindingPatterns } from '../../src/inventory/bindings.ts';
import { VOCABULARY_DIR } from '../../src/vocabulary/read.ts';
import { GENERATED_FILES } from '../../src/vocabulary/write.ts';
import { compileBindings, deriveVocabulary, inventoryGrammars, vocabularyDisagreements } from '../../src/inventory/index.ts';
import { type Derivation, levelMembers } from '../../src/inventory/derive.ts';
import { readVocabulary } from '../../src/inventory/vocabulary.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const CEILING = JSON.parse(
	readFileSync(`${ROOT}packages/tools/tests/inventory/bindings-inventory.ceiling.json`, 'utf8')
) as {
	readonly unmapped: number;
	readonly compiling: readonly string[];
	readonly vocabularyDisagreements: readonly string[];
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
		const reports = await compileBindings(inventoryGrammars());
		expect(reports.map((r) => r.grammar)).toEqual([...inventoryGrammars()]);
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
		expect(method.get('accessor')?.optional).toBe(true);
	});
	it('names a refinement literal by the converged member, not the grammar field', () => {
		const equal = d.refinements.get('expression.binary.comparison.equal');
		expect([...(equal?.literals.keys() ?? [])]).toEqual(['operator']);
		expect([...(d.refinements.get('declaration.method.getter')?.literals.keys() ?? [])]).toEqual(['accessor']);
	});
	it('lands a container pattern capture only on the kinds its element slot names directly', () => {
		expect(levelMembers(d, 'declaration.class').get('decorators')?.grammars.has('python')).toBe(true);
		expect(levelMembers(d, 'declaration.function').get('decorators')?.grammars.has('python')).toBe(true);
		expect(levelMembers(d, 'declaration.method').get('decorators')?.grammars.has('typescript')).toBe(true);
		for (const v of [
			'declaration.enum_member',
			'declaration.field',
			'declaration.type_parameter',
			'declaration.type_parameter.const',
			'declaration.type_parameter.lifetime'
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
		expect([...(d.members.get('expression.unary')?.keys() ?? [])].sort()).toEqual(['argument', 'operator']);
		expect(d.members.get('expression.try')?.has('argument')).toBe(true);
		expect(d.members.get('expression.try')?.has('value')).toBe(false);
	});
	it('resolves a declared container, a list and an envelope to the kinds their element admits', () => {
		const parameters = d.members.get('declaration.function')?.get('parameters')?.kinds ?? new Set();
		expect(parameters.has('declaration.parameter')).toBe(true);
		expect([...parameters].filter((k) => k.startsWith('<'))).toEqual([]);
		const body = d.members.get('declaration.class.abstract')?.get('body');
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
	it('never makes a layout slot a member: an options-block address, a separator, or a slot of unclaimed kinds', () => {
		for (const [v, members] of d.members) {
			for (const name of ['terminator', 'automaticSemicolon', 'separator', 'stringStart', 'stringEnd', 'stringOpen'])
				expect(members.has(name), `${v}.${name}`).toBe(false);
		}
	});
});

describe('the authored vocabulary', () => {
	it('disagrees with the bindings only where the ceiling records', async () => {
		expect(vocabularyDisagreements(await deriveVocabulary(), readVocabulary(VOCABULARY_DIR))).toEqual(CEILING.vocabularyDisagreements);
	}, 120_000);
	it('reports a template hole its interface does not declare', async () => {
		const d = await deriveVocabulary();
		const vocabulary = readVocabulary(VOCABULARY_DIR);
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

	it('is authored: no file but the feature tool’s output says it is generated', () => {
		const generated = new Set(GENERATED_FILES);
		for (const entry of readdirSync(VOCABULARY_DIR, { recursive: true, encoding: 'utf8' })) {
			const file = entry.split(sep).join(posix.sep);
			if (!file.endsWith('.ts') || generated.has(file)) continue;
			expect(readFileSync(join(VOCABULARY_DIR, file), 'utf8'), file).not.toMatch(/^\/\/ Generated/m);
		}
	});
});

describe('readVocabulary', () => {
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
	const vocabulary = readVocabulary(dir);
	rmSync(dir, { recursive: true, force: true });

	it('keys each interface by its kind, with its parent from a multi-line extends', () => {
		expect(vocabulary.kinds.get('declaration.function')).toMatchObject({ name: 'Declaration.Function', parent: 'declaration' });
	});

	it('gives a kind its inherited members, each marked optional or required', () => {
		expect(Object.fromEntries(vocabulary.members('declaration.function'))).toEqual({
			body: { optional: true },
			name: { optional: false }
		});
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
		'\t\treadonly arrow?: boolean;',
		'\t}',
		'\texport namespace Function {',
		'\t\texport interface Lambda<G> extends SubKindOf<V.Declaration.Function<G>> {',
		"\t\t\treadonly $kind: 'declaration.function.lambda';",
		'\t\t}',
		'\t}',
		'}'
	]);
	const vocabulary = readVocabulary(dir);
	rmSync(dir, { recursive: true, force: true });

	it('holds the kinds a feature adds, under their parents', () => {
		expect(vocabulary.kinds.get('declaration.function.lambda')).toMatchObject({ name: 'Declaration.Function.Lambda', parent: 'declaration.function' });
	});

	it('gives a kind the members a feature adds to it, optional when any declaration of one is', () => {
		expect(Object.fromEntries(vocabulary.members('declaration.function.lambda'))).toEqual({
			arrow: { optional: true },
			body: { optional: true },
			name: { optional: false }
		});
	});
});
