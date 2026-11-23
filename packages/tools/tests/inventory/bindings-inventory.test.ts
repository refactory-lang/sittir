import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../../codegen/src/__tests__/helpers/timeouts.ts';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BindingsSyntaxError, bindingGrammars } from '@sittir/codegen/bindings';
import { bindingIssues, compileQuery } from '../../src/inventory/bindings.ts';
import {
	VOCABULARY_DIR,
	compileBindings,
	deriveVocabulary,
	vocabularyDisagreements,
	vocabularySlots
} from '../../src/inventory/index.ts';
import { type Derivation, bindingPatterns, camel, grammarInput, levelSlots, vocabularyDiagnostics } from '@sittir/codegen/bindings';
import { type Vocabulary, readVocabulary } from '@sittir/codegen/bindings';
import { compileGrammarOf, evaluateGrammar, invoke } from '../../src/codegen-surface.ts';
import { GENERATED_FILES } from '../../src/vocabulary/write.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const CEILING = JSON.parse(
	readFileSync(`${ROOT}packages/tools/tests/inventory/bindings-inventory.ceiling.json`, 'utf8')
) as {
	readonly unmapped: number;
	readonly compiling: readonly string[];
	readonly vocabularyDisagreements: readonly string[];
	readonly unroutedScope: readonly string[];
	readonly stoppedAtClones: readonly string[];
};

describe('bindingIssues', () => {
	const text = [
		'; comment (nope)',
		'(module) @file',
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
	}, FULL_PIPELINE_TIMEOUT);
	it.each([
		['an extra closing parenthesis after a pattern', '(module) @file\n(identifier) @identifier)\n(string) @string', 2],
		['an extra closing parenthesis closing the file', '(module) @file\n((identifier) @identifier))', 2],
		['an extra opening parenthesis', '(module) @file\n(((identifier) @identifier)\n(string) @string', 2]
	])('reports %s with its line and fails the compile', async (_name, text, line) => {
		const issues = await bindingIssues('python', text);
		expect(issues.map((issue) => issue.line)).toContain(line);
		await expect(compileQuery('python', text)).rejects.toThrow(BindingsSyntaxError);
	}, FULL_PIPELINE_TIMEOUT);
	it('reads a minted name as whichever of its source kinds fits where it stands', async () => {
		expect(await bindingIssues('rust', ['(generic_function function: (qualified_identifier))', '(generic_type type: (qualified_identifier))'].join('\n'))).toEqual([]);
	}, FULL_PIPELINE_TIMEOUT);
	it('reads each minted name by where it stands, however many the pattern holds', async () => {
		const items = `(source_file ${Array.from({ length: 5 }, () => '(type_item type: (qualified_identifier name: (type_identifier)))').join(' ')})`;
		expect(await bindingIssues('rust', items)).toEqual([]);
		const issues = await bindingIssues('rust', `(qualified_identifier ${Array.from({ length: 5 }, () => '(qualified_identifier)').join(' ')} (string_literal))`);
		expect(issues.map((issue) => issue.line)).toEqual([1]);
		expect(issues[0]?.message).toMatch(/^Bad pattern structure/);
	}, FULL_PIPELINE_TIMEOUT);
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
		const format = d.slots.get('expression.interpolation.format');
		const kinds = [...(format?.values() ?? [])].flatMap((slot) => [...slot.kinds]);
		expect(kinds).toContain('text:[^{}\\n]+');
		expect(d.unmapped.has('<python:format_specifier_text>')).toBe(false);
	});
	it('claims every namespace the spec names and derives no inclusion cycle', () => {
		const tops = new Set([...d.allvocab].map((v) => v.split('.')[0]));
		for (const ns of [
			'file',
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
	it('maps the arms of a python match to their clause and no longer leaves the match block placeholder unmapped', () => {
		const arms = levelSlots(d, 'statement.match').get('arms');
		expect(arms?.kinds).toContain('clause.case.match');
		expect(d.unmapped.has('<python:_match_block>')).toBe(false);
		expect(d.unmapped.has('<python:match_block>')).toBe(false);
	});
	it('keeps the unmapped count at or below the recorded ceiling', () => {
		const total = [...d.unmapped.values()].reduce((a, b) => a + b, 0);
		expect(total).toBeLessThanOrEqual(CEILING.unmapped);
	});
	it('makes a slot required only when every claiming grammar carries it and every claimed child does', () => {
		const fn = levelSlots(d, 'declaration.function');
		expect(fn.get('name')?.optional).toBe(false);
		expect(fn.get('parameters')?.optional).toBe(false);
		const method = levelSlots(d, 'declaration.method');
		expect(method.get('name')?.optional).toBe(false);
		expect(method.get('parameters')?.optional).toBe(false);
		expect(method.get('decorators')?.optional).toBe(true);
	});
	it('names a refinement literal by the slot that holds it', () => {
		const equal = d.refinements.get('expression.binary.comparison.equal');
		expect([...(equal?.literals.keys() ?? [])]).toEqual(['operator']);
	});
	it('refines by an axis value through its text alone, which no slot holds', () => {
		const constant = d.refinements.get('declaration.variable.constant');
		expect(constant?.parent).toBe('declaration.variable');
		expect([...(constant?.literals.values() ?? [])].flatMap((texts) => [...texts])).toEqual(['const']);
	});
	it('lands a container pattern capture only on the kinds its element slot names directly', () => {
		expect(levelSlots(d, 'declaration.class').get('decorators')?.grammars.has('python')).toBe(true);
		expect(levelSlots(d, 'declaration.function').get('decorators')?.grammars.has('python')).toBe(true);
		expect(levelSlots(d, 'declaration.method').get('decorators')?.grammars.has('typescript')).toBe(true);
		for (const v of [
			'declaration.enum_member',
			'declaration.field',
			'declaration.parameter',
			'declaration.parameter.receiver',
			'declaration.parameter.variadic',
			'declaration.type_parameter',
			'declaration.type_parameter.lifetime',
			'declaration.type_parameter.value'
		])
			expect(d.slots.get(v)?.get('attributes')?.grammars.has('rust'), v).toBe(true);
		for (const v of ['statement.block', 'declaration.function', 'declaration.class', 'declaration.variable'])
			expect(d.slots.get(v)?.has('declare') ?? false, v).toBe(false);
		expect(d.untargeted).toEqual([]);
		expect(d.uncaptured).toEqual([]);
	});
	it('keeps rest-type markers out of the portable slots without losing the held type', () => {
		const rest = levelSlots(d, 'type.rest');
		expect(rest.has('type')).toBe(true);
		for (const grammar of ['python', 'typescript']) expect(rest.get('type')?.grammars.has(grammar), grammar).toBe(true);
		expect(rest.has('operator')).toBe(false);
		expect(levelSlots(d, 'type.rest.map').has('operator')).toBe(false);
	});
	it('keeps bounds introducers out of the portable slots without losing the bounds', () => {
		expect([...levelSlots(d, 'clause.bounds').keys()]).toEqual([]);
		const parameter = levelSlots(d, 'declaration.type_parameter');
		for (const grammar of ['rust', 'typescript']) expect(parameter.get('bounds')?.grammars.has(grammar), grammar).toBe(true);
	});
	it('keeps the bounds of a type argument (`Iterator<Item: Copy>`), a wrapper claimed as a kind of its own, as the list of bounds its clause holds', () => {
		const argument = d.slots.get('element.type_argument');
		expect(argument?.has('constraint')).toBe(false);
		expect(argument?.get('bounds')?.kinds.has('identifier')).toBe(true);
		expect(argument?.get('bounds')?.kinds.has('clause.bounds')).toBe(false);
		expect(argument?.get('bounds')?.multiple).toBe(true);
		expect(argument?.get('bounds')?.optional).toBe(true);
		expect(argument?.get('argument')?.kinds.has('element.type_binding')).toBe(true);
		expect(d.slots.get('type.generic.turbofish')?.get('typeArguments')?.kinds).toEqual(
			new Set(['element.type_argument'])
		);
	});
	it('claims a container whose capture has no direct target as a vocabulary kind of its own', () => {
		const ambient = d.slots.get('declaration.ambient');
		expect([...(ambient?.keys() ?? [])]).toEqual(['body']);
		expect(ambient?.get('body')?.kinds.has('statement.block')).toBe(true);
		expect(levelSlots(d, 'declaration.ambient').get('body')?.optional).toBe(false);
		expect([...(d.slots.get('statement.labeled')?.keys() ?? [])].sort()).toEqual(['body', 'label']);
		for (const v of ['statement.expression', 'statement.return', 'statement.if'])
			expect(d.slots.get(v)?.get('label')?.grammars.has('typescript') ?? false, v).toBe(false);
		for (const v of ['statement.block', 'statement.loop.counted', 'statement.loop.for_each', 'statement.loop.while', 'statement.loop.do_while'])
			expect(d.slots.get(v)?.get('label')?.grammars.has('typescript') ?? false, v).toBe(true);
	});
	it('lifts a capture nested inside a container child onto the claimed kind', () => {
		const cls = levelSlots(d, 'declaration.class');
		expect(cls.has('extends')).toBe(true);
		expect(cls.has('implements')).toBe(true);
		expect(cls.has('heritage')).toBe(false);
	});
	it('renames the slot a positional wildcard capture stands at', () => {
		expect([...(d.slots.get('expression.unary')?.keys() ?? [])].sort()).toEqual(['argument']);
		expect(d.slots.get('expression.propagate')?.has('argument')).toBe(true);
		expect(d.slots.get('expression.propagate')?.has('value')).toBe(false);
	});
	it('resolves a declared container, a list and an envelope to the kinds their element admits', () => {
		const parameters = d.slots.get('declaration.function')?.get('parameters')?.kinds ?? new Set();
		expect(parameters.has('declaration.parameter')).toBe(true);
		expect([...parameters].filter((k) => k.startsWith('<'))).toEqual([]);
		const members = d.slots.get('expression.class')?.get('members');
		expect([...(members?.kinds ?? [])].sort()).toEqual([
			'declaration.constructor',
			'declaration.field',
			'declaration.method',
			'declaration.method.signature',
			'declaration.method.signature.abstract',
			'declaration.property',
			'declaration.property.getter',
			'declaration.property.setter',
			'declaration.property.signature.abstract.getter',
			'declaration.property.signature.abstract.setter',
			'declaration.property.signature.getter',
			'declaration.property.signature.setter',
			'declaration.signature.index',
			'declaration.signature.index.mapped',
			'statement.block.static'
		]);
		expect(members?.multiple).toBe(true);
	});
	it('reads a polymorph through its forms, keeping a list form apart from a scalar form', () => {
		const type = d.slots.get('clause.catch')?.get('type');
		expect(type?.multiple).toBe(true);
		expect(type?.scalar).toBe(true);
	});
	it('never makes a layout grammar slot a slot: an options-block address or a grammar slot of unclaimed kinds', () => {
		for (const [v, slots] of d.slots) {
			for (const name of ['terminator', 'automaticSemicolon', 'stringStart', 'stringEnd', 'stringOpen'])
				expect(slots.has(name), `${v}.${name}`).toBe(false);
		}
	});
});

describe('the authored vocabulary', () => {
	it('disagrees with the bindings only where the ceiling records', async () => {
		expect(vocabularyDisagreements(await deriveVocabulary(), await readVocabulary(VOCABULARY_DIR))).toEqual(CEILING.vocabularyDisagreements);
	}, 120_000);
	it.each(['rust', 'typescript', 'python'])('raises no disagreement in the generate step for %s', async (grammar) => {
		const compiled = await compileGrammarOf(grammar);
		const model = await invoke('nodeModel', 'buildNodeModel', compiled.nodeMap, compiled.generatedIdTables);
		const input = await grammarInput(grammar, await evaluateGrammar(grammar), model);
		expect(input).toBeDefined();
		if (input === undefined) return;
		expect(vocabularyDiagnostics(input)).toEqual([]);
	}, FULL_PIPELINE_TIMEOUT);
	it("stops a base's claim only at the clones the ceiling records, where the clone's own unconditional claim sits at an unrelated path", async () => {
		expect((await deriveVocabulary()).stoppedReads).toEqual(CEILING.stoppedAtClones);
	}, 120_000);
	it('has its scope routed wherever it declares one, but where the ceiling records', async () => {
		const d = await deriveVocabulary();
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		const unrouted = [...d.slots].filter(([path, slots]) => vocabulary.slots(path).has('scope') && !slots.has('scope')).map(([path]) => path);
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
			slots: (kind: string) => new Map([...vocabulary.slots(kind)].filter(([m]) => kind !== path || m !== hole))
		};
		expect(vocabularyDisagreements(d, withoutHole)).toContain(`${path}.${hole}: templated, but its interface does not declare it`);
	}, 120_000);
	it('needs no declaration for a refinement pinned slot: the read tells it, so it is no slot', async () => {
		const d = await deriveVocabulary();
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		const pinned = [...d.refinements].flatMap(([v, r]) => [...r.literals.keys()].map((field) => [v, camel(field)] as const).filter(([, p]) => !d.slots.get(v)?.has(p)));
		expect(pinned.length).toBeGreaterThan(0);
		const unpinned = {
			...vocabulary,
			slots: (kind: string) => new Map([...vocabulary.slots(kind)].filter(([m]) => !pinned.some(([v, p]) => v === kind && p === m)))
		};
		expect(vocabularyDisagreements(d, unpinned)).toEqual(vocabularyDisagreements(d, vocabulary));
	}, 120_000);

	it('is authored: no file but the generated ones says it is generated', () => {
		const generated = new Set(GENERATED_FILES);
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
			'export interface Declaration<G, K = "declaration"> {',
			"\treadonly $path: K;",
			'\treadonly name: string;',
			'}',
			'export namespace Declaration {',
			'\texport interface Function<G, K = "declaration.function">',
			'\t\textends SubKindOf<V.Declaration<G>> {',
			"\t\treadonly $path: K;",
			'\t\treadonly body?: string;',
			'\t}',
			'}',
			''
		].join('\n')
	);
	writeFileSync(join(dir, 'compositions.ts'), 'export interface FixtureFeatures {}\n');
	vocabulary = await readVocabulary(dir);
	rmSync(dir, { recursive: true, force: true });
	});

	it('keys each interface by its kind, with its parent from a multi-line extends', () => {
		expect(vocabulary.kinds.get('declaration.function')).toMatchObject({ name: 'Declaration.Function', parent: 'declaration' });
	});

	it('gives a kind its inherited slots, each marked optional or required', () => {
		expect(Object.fromEntries(vocabulary.slots('declaration.function'))).toEqual({
			body: { optional: true, flag: false },
			name: { optional: false, flag: false }
		});
	});

	it('gives the grammar-bindings derivation every slot a kind declares or inherits', () => {
		expect(vocabularySlots(vocabulary.composedAs('FixtureFeatures')).get('declaration.function')).toEqual(new Set(['body', 'name']));
	});
});

describe('readVocabulary over feature folders', () => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	const write = (file: string, lines: readonly string[]): void => {
		mkdirSync(dirname(join(dir, file)), { recursive: true });
		writeFileSync(join(dir, file), [...lines, ''].join('\n'));
	};
	write('decl.ts', [
		'export interface Declaration<G, K = "declaration"> {',
		"\treadonly $path: K;",
		'\treadonly name: string;',
		'}',
		'export namespace Declaration {',
		'\texport interface Function<G, K = "declaration.function"> extends SubKindOf<V.Declaration<G>> {',
		"\t\treadonly $path: K;",
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
		'\t\texport interface Lambda<G, K = "declaration.function.lambda"> extends SubKindOf<V.Declaration.Function<G>> {',
		"\t\t\treadonly $path: K;",
		'\t\t}',
		'\t}',
		'}'
	]);
	write('compositions.ts', ['export interface WithLambdas extends Lambdas {}', 'export interface WithoutLambdas {}', 'export interface Composed extends WithLambdas {}']);
	let vocabulary: Vocabulary;
	beforeAll(async () => {
		vocabulary = await readVocabulary(dir);
		rmSync(dir, { recursive: true, force: true });
	});

	it('holds the kinds a feature adds, under their parents', () => {
		expect(vocabulary.kinds.get('declaration.function.lambda')).toMatchObject({ name: 'Declaration.Function.Lambda', parent: 'declaration.function' });
	});

	it('gives a kind the slots a feature adds to it, optional when any declaration of one is', () => {
		expect(Object.fromEntries(vocabulary.slots('declaration.function.lambda'))).toEqual({
			arrow: { optional: true, flag: true, features: ['Lambdas'] },
			body: { optional: true, flag: false },
			name: { optional: false, flag: false }
		});
	});

	it("lists a feature's slots only for a composition that has the feature, directly or through another composition", () => {
		expect(vocabularySlots(vocabulary.composedAs('WithLambdas')).get('declaration.function')).toEqual(new Set(['arrow', 'body', 'name']));
		expect(vocabularySlots(vocabulary.composedAs('Composed')).get('declaration.function')).toEqual(new Set(['arrow', 'body', 'name']));
		expect(vocabularySlots(vocabulary.composedAs('WithoutLambdas')).get('declaration.function')).toEqual(new Set(['body', 'name']));
		expect(() => vocabulary.featuresOf('Missing')).toThrow('compositions.ts declares no composition Missing');
	});
});

describe('readVocabulary over an owner refined by a value', () => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	const write = (file: string, lines: readonly string[]): void => {
		mkdirSync(dirname(join(dir, file)), { recursive: true });
		writeFileSync(join(dir, file), [...lines, ''].join('\n'));
	};
	write('decl.ts', [
		'export interface Declaration<G, K = "declaration"> {',
		"\treadonly $path: K;",
		'\treadonly name: string;',
		'}',
		'export namespace Declaration {',
		'\texport interface Function<G, K = "declaration.function"> extends SubKindOf<V.Declaration<G>> {',
		"\t\treadonly $path: K;",
		'\t}',
		'\texport interface Public<G, K = "declaration.public"> extends RefinedBy<V.Declaration<G>, V.Modifier.Public<G>> {',
		"\t\treadonly $path: K;",
		'\t}',
		'\texport namespace Public {',
		'\t\texport interface Restricted<G, K = "declaration.public.restricted"> extends RefinedBy<V.Declaration.Public<G>, V.Modifier.Public.Restricted<G>> {',
		"\t\t\treadonly $path: K;",
		'\t\t}',
		'\t}',
		'}'
	]);
	write('modifier.ts', [
		'export interface Modifier<G, K = "modifier"> {',
		"\treadonly $path: K;",
		'}',
		'export namespace Modifier {',
		'\texport interface Public<G, K = "modifier.public"> extends SubKindOf<V.Modifier<G>> {',
		"\t\treadonly $path: K;",
		'\t}',
		'\texport namespace Public {',
		'\t\texport interface Restricted<G, K = "modifier.public.restricted"> extends SubKindOf<V.Modifier.Public<G>> {',
		"\t\t\treadonly $path: K;",
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
	write('compositions.ts', ['export interface ScopedFeatures extends Scoped {}']);
	let vocabulary: Vocabulary;
	beforeAll(async () => {
		vocabulary = await readVocabulary(dir);
		rmSync(dir, { recursive: true, force: true });
	});

	it('keeps the owner as the parent and records the value the kind is refined by', () => {
		expect(vocabulary.kinds.get('declaration.public.restricted')).toMatchObject({ parent: 'declaration.public', refines: 'modifier.public.restricted' });
	});

	it("gives an owner's refinement the slots its value adds, beside the owner's", () => {
		expect(Object.fromEntries(vocabulary.slots('declaration.public.restricted'))).toEqual({
			name: { optional: false, flag: false },
			scope: { optional: false, flag: false, features: ['Scoped'] }
		});
		expect(vocabularySlots(vocabulary.composedAs('ScopedFeatures')).get('declaration.public')).toEqual(new Set(['name']));
	});
});
