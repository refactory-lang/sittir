import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type PatternNode, parseQuery, walk } from '../../src/inventory/query.ts';
import { compileBindings, deriveVocabulary, INVENTORY_GRAMMARS } from '../../src/inventory/index.ts';
import { levelMembers } from '../../src/inventory/derive.ts';
import { renderVocabularyFile, vocabularyFiles } from '../../src/inventory/emit.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const CEILING = JSON.parse(
	readFileSync(`${ROOT}packages/tools/tests/inventory/bindings-inventory.ceiling.json`, 'utf8')
) as {
	readonly unmapped: number;
	readonly compiling: readonly string[];
};

const nodes = (p: PatternNode | undefined): PatternNode[] => (p ? [...walk(p)] : []);

describe('parseQuery', () => {
	it('reads claims, member captures, field literals, quantifiers, containers and predicates', () => {
		const [claim, refinement, container, predicate] = parseQuery(
			[
				'(function_definition (parameters (identifier)* @names)) @declaration.function',
				'(binary_expression operator: "+") @expression.binary.arithmetic.add',
				'(decorated_definition (decorator)* @decorators definition: (_) @element)',
				'((function_definition name: (identifier) @name) @declaration.constructor (#eq? @name "__init__"))'
			].join('\n')
		);
		expect(claim?.kind).toBe('function_definition');
		expect(claim?.captures).toEqual(['declaration.function']);
		expect(nodes(claim).find((n) => n.captures.includes('names'))?.quantifier).toBe('*');
		expect(refinement?.fieldLiterals).toEqual({ operator: '+' });
		expect(container?.children.some((c) => c.field === 'definition' && c.captures.includes('element'))).toBe(true);
		expect(predicate?.kind).toBe('<group>');
		expect(nodes(predicate).some((n) => n.predicates.some((p) => p[0] === '#eq?'))).toBe(true);
	});
});

describe('compileBindings', () => {
	it('reports each bindings file against its parser and never loses a compiling grammar', async () => {
		const reports = await compileBindings(INVENTORY_GRAMMARS);
		expect(reports.map((r) => r.grammar)).toEqual([...INVENTORY_GRAMMARS]);
		for (const report of reports) {
			if (CEILING.compiling.includes(report.grammar)) expect(report.error, report.grammar).toBeNull();
		}
	}, 120_000);
});

describe('deriveVocabulary', () => {
	const d = deriveVocabulary();
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
		expect(levelMembers(d, 'expression.update').get('content')?.optional).toBe(false);
		expect(levelMembers(d, 'declaration.method').get('accessorKind')?.optional).toBe(true);
	});
	it('assigns a container pattern captures to the kinds its element admits', () => {
		expect(levelMembers(d, 'declaration.class').get('decorators')?.grammars.has('python')).toBe(true);
		expect(levelMembers(d, 'declaration.function').get('declare')?.grammars.has('typescript')).toBe(true);
	});
	it('lifts a capture nested inside a container child onto the claimed kind', () => {
		const cls = levelMembers(d, 'declaration.class');
		expect(cls.has('extends')).toBe(true);
		expect(cls.has('implements')).toBe(true);
		expect(cls.has('heritage')).toBe(false);
	});
});

describe('vocabularyFiles', () => {
	it('renders a namespace through the typescript factories', () => {
		const files = vocabularyFiles(deriveVocabulary());
		expect(files.map((f) => f.name)).toContain('context');
		const comment = files.find((f) => f.name === 'comment');
		expect(comment).toBeDefined();
		if (!comment) return;
		const source = renderVocabularyFile(comment);
		expect(source).toContain('export interface Comment<G extends GrammarContext>');
		expect(source).toContain("import type { GrammarContext } from './context.ts';");
	});
	it('spells a sub-kind as its parent narrowed by SubKindOf, importing the helpers it uses', () => {
		const files = vocabularyFiles(deriveVocabulary());
		const modifier = files.find((f) => f.name === 'modifier');
		expect(modifier).toBeDefined();
		if (!modifier) return;
		const source = renderVocabularyFile(modifier);
		expect(source).toContain('extends Simplify<SubKindOf<V.Modifier<G>>>');
		expect(source).toContain("import type { Simplify } from 'type-fest';");
		expect(source).toContain("import type { SubKindOf } from './utils.ts';");
		expect(source).not.toContain('extends V.');
	});
});
