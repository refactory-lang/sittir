import { describe, it, expect } from 'vitest';
import { BindingsSyntaxError, bindingPatterns, readBindings } from '../../src/inventory/bindings.ts';

describe('readBindings', () => {
	it('reads claims, member captures, field literals, quantifiers, containers and predicates', () => {
		const facts = readBindings(
			[
				'(function_definition (parameters (identifier)* @names)) @declaration.function',
				'(binary_expression operator: "+") @expression.binary.arithmetic.add',
				'(decorated_definition (decorator)* @decorators definition: (_) @element)',
				'((function_definition name: (identifier) @name) @declaration.constructor (#eq? @name "__init__"))'
			].join('\n')
		);
		expect(facts.claims.map((c) => [c.vocab, c.kind, c.predicate, c.toplevel])).toEqual([
			['declaration.function', 'function_definition', false, true],
			['expression.binary.arithmetic.add', 'binary_expression', false, true],
			['declaration.constructor', 'function_definition', true, true]
		]);
		expect(facts.claims[1]?.fieldLiterals).toEqual({ operator: '+' });
		expect(facts.members).toEqual([
			{
				route: 'nested',
				owner: 'function_definition',
				name: 'names',
				parent: 'parameters',
				multiple: true,
				via: ['parameters'],
				field: null,
				kind: 'identifier'
			},
			{ route: 'rename', owner: 'function_definition', key: 'name', name: 'name' }
		]);
		expect(facts.containers).toEqual([
			{
				kind: 'decorated_definition',
				element: { field: 'definition', kind: null },
				captures: [{ name: 'decorators', token: false, multiple: true, field: null, kind: 'decorator' }]
			}
		]);
	});

	it('reads a template regex as its literal runs and named holes', () => {
		const { templates } = readBindings(
			'((function_definition name: (identifier) @name) @declaration.method.dunder (#match? @name "^__(?<stem>.*)__$"))'
		);
		expect(templates).toEqual([
			{ vocabs: ['declaration.method.dunder'], target: 'name', template: '__${string}__', holes: ['stem'] }
		]);
	});

	it('reads a token capture as the presence of the token', () => {
		const { members } = readBindings('(expression_statement ";" @semi) @statement.expression');
		expect(members).toEqual([{ route: 'presence', owner: 'expression_statement', name: 'semi', via: [] }]);
	});

	it('gives each option of an alternation the field and the captures of the alternation', () => {
		const { members } = readBindings('(foo name: [(a) (b)] @x) @y.z');
		expect(members).toEqual([
			{ route: 'rename', owner: 'foo', key: 'name', name: 'x' },
			{ route: 'rename', owner: 'foo', key: 'name', name: 'x' }
		]);
	});

	it('reads a keyword or punctuation capture in claim position as a token class, never a claim', () => {
		const { claims, members } = readBindings(
			[
				'["def" "class"] @keyword.declaration',
				'(crate) @keyword.import',
				'(crate) @identifier.crate',
				'(lexical_declaration kind: _ @keyword) @declaration.variable'
			].join('\n')
		);
		expect(claims.map((c) => c.vocab)).toEqual(['identifier.crate', 'declaration.variable']);
		expect(members).toEqual([{ route: 'rename', owner: 'lexical_declaration', key: 'kind', name: 'keyword' }]);
	});

	it('reads a top-level alternation as one pattern per option', () => {
		const { claims } = readBindings('[(true) (false)] @literal.boolean');
		expect(claims.map((c) => [c.vocab, c.kind])).toEqual([
			['literal.boolean', 'true'],
			['literal.boolean', 'false']
		]);
	});

	it('ignores comments, including one that holds quotes and parentheses', () => {
		const { claims } = readBindings('; a comment with "quotes" and (parens\n(identifier) @identifier');
		expect(claims.map((c) => c.vocab)).toEqual(['identifier']);
	});

	it('refuses a file that does not parse, naming the line', () => {
		expect(() => readBindings('(call [ (identifier) (number)')).toThrow(BindingsSyntaxError);
		expect(() => readBindings('(identifier) @identifier\n(call [ (identifier) (number)')).toThrow(/line 2/);
	});
});

describe('bindingPatterns', () => {
	it('slices each top-level pattern by its byte span, after multibyte comments', () => {
		const patterns = bindingPatterns('; ── module ──\n(module) @module\n; ── é\n(identifier) @identifier\n');
		expect(patterns.map((p) => [p.line, p.source])).toEqual([
			[2, '(module) @module'],
			[4, '(identifier) @identifier']
		]);
	});
});
