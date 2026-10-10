import { describe, it, expect } from 'vitest';
import { BindingsSyntaxError, bindingPatterns, readBindings } from '../index.ts';

describe('readBindings', () => {
	it('reads a second single-segment capture on a node as the presence of that node\'s kind in the slot the first capture names', async () => {
		const facts = await readBindings('(public_field_definition name: (private_property_identifier) @name @private)');
		expect(facts.members).toEqual([
			{ route: 'rename', owner: 'public_field_definition', name: 'name', field: 'name', kind: null, after: null, anchor: null },
			{ route: 'kind', owner: 'public_field_definition', name: 'private', member: 'name', kind: 'private_property_identifier' }
		]);
	});
	it('reads a single-segment capture beside the top node\'s claim as a further claim: no member sits on the claimed node itself', async () => {
		const facts = await readBindings('(shorthand_property_identifier) @element.pair @key');
		expect(facts.claims.map((c) => [c.vocab, c.kind])).toEqual([
			['element.pair', 'shorthand_property_identifier'],
			['key', 'shorthand_property_identifier']
		]);
		expect(facts.members).toEqual([]);
	});
	it('reads a single-segment capture beside a claim on a nested node as a member of the top claim', async () => {
		const facts = await readBindings('(function_definition body: (block (expression_statement (string) @doc @literal.string.docstring))) @declaration.function');
		expect(facts.claims.map((c) => [c.vocab, c.kind])).toEqual([
			['declaration.function', 'function_definition'],
			['literal.string.docstring', 'string']
		]);
		expect(facts.members.map((m) => [m.route, m.owner, m.name])).toEqual([['nested', 'function_definition', 'doc']]);
	});
	it('still reads a lone single-segment capture on the top node as a claim', async () => {
		const facts = await readBindings('(source_file) @module');
		expect(facts.claims.map((c) => [c.vocab, c.kind])).toEqual([['module', 'source_file']]);
		expect(facts.members).toEqual([]);
	});
	it('keeps a presence capture\'s token text beside its name', async () => {
		const facts = await readBindings('(function_item "async" @isAsync) @declaration.function');
		expect(facts.members).toEqual([{ route: 'presence', owner: 'function_item', name: 'isAsync', token: 'async', via: [] }]);
	});
	it('keeps a property predicate that tests no capture', async () => {
		const facts = await readBindings('((identifier) @identifier.local (#is-not? local))');
		expect(facts.claims[0]?.predicates).toEqual([{ operator: 'is-not', capture: null, arguments: [{ text: 'local' }], subject: null }]);
	});
	it('keeps every predicate with its operator, capture and arguments, and leaves directives out', async () => {
		const facts = await readBindings(
			'((identifier) @identifier.self (#match? @identifier.self "^self$") (#lua-match? @identifier.self "%a") (#eq? @identifier.self @identifier.self) (#set! reason "x"))'
		);
		expect(facts.claims[0]?.predicates).toEqual([
			{ operator: 'match', capture: 'identifier.self', arguments: [{ text: '^self$' }], subject: { up: 0, down: [] } },
			{ operator: 'lua-match', capture: 'identifier.self', arguments: [{ text: '%a' }], subject: { up: 0, down: [] } },
			{ operator: 'eq', capture: 'identifier.self', arguments: [{ capture: 'identifier.self' }], subject: { up: 0, down: [] } }
		]);
	});

	it('places a predicate\'s capture relative to the claimed node: the claim itself, a node under it, or one under an enclosing node', async () => {
		const facts = await readBindings(
			[
				'((boolean) @literal.boolean.true (#eq? @literal.boolean.true "true"))',
				'((string (string_start) @_p) @literal.string.f (#match? @_p "^[fF]"))',
				'((decorated_definition (decorator (identifier) @_d) (function_definition) @declaration.method.static) (#eq? @_d "staticmethod"))'
			].join('\n')
		);
		expect(facts.claims.map((c) => c.predicates.map((p) => p.subject))).toEqual([
			[{ up: 0, down: [] }],
			[{ up: 0, down: [{ field: null, kind: 'string_start', after: null, anchor: null }] }],
			[
				{
					up: 1,
					down: [
						{ field: null, kind: 'decorator', after: null, anchor: null },
						{ field: null, kind: 'identifier', after: null, anchor: null }
					]
				}
			]
		]);
	});

	it('keeps the field a claimed node sits under in its enclosing node', async () => {
		const facts = await readBindings(['(closure_parameters (_) @declaration.parameter)', '(let_declaration pattern: (_) @declaration.variable)'].join('\n'));
		expect(facts.claims.map((c) => [c.kind, c.field, c.within])).toEqual([
			['_', null, ['closure_parameters']],
			['_', 'pattern', ['let_declaration']]
		]);
	});

	it('reads claims, member captures, field literals, quantifiers, containers and predicates', async () => {
		const facts = await readBindings(
			[
				'(function_definition (parameters (identifier)* @names)) @declaration.function',
				'(binary_expression operator: "+") @expression.binary.arithmetic.add',
				'(decorated_definition (decorator)* @decorators definition: (_) @element)',
				'((function_definition name: (identifier) @name) @declaration.constructor (#eq? @name "__init__"))'
			].join('\n')
		);
		expect(facts.claims.map((c) => [c.vocab, c.kind, c.predicates, c.toplevel])).toEqual([
			['declaration.function', 'function_definition', [], true],
			['expression.binary.arithmetic.add', 'binary_expression', [], true],
			[
				'declaration.constructor',
				'function_definition',
				[
					{
						operator: 'eq',
						capture: 'name',
						arguments: [{ text: '__init__' }],
						subject: { up: 0, down: [{ field: 'name', kind: 'identifier', after: null, anchor: null }] }
					}
				],
				true
			]
		]);
		expect(facts.claims[1]?.fieldLiterals).toEqual({ operator: '+' });
		expect(facts.members).toEqual([
			{
				route: 'nested',
				owner: 'function_definition',
				name: 'names',
				parent: 'parameters',
				multiple: true,
				via: [{ field: null, kind: 'parameters', after: null, anchor: null }],
				field: null,
				kind: 'identifier',
				after: null,
				anchor: null
			},
			{ route: 'rename', owner: 'function_definition', name: 'name', field: 'name', kind: 'identifier', after: null, anchor: null }
		]);
		expect(facts.containers).toEqual([
			{
				kind: 'decorated_definition',
				element: { field: 'definition', kind: null, after: null, anchor: null },
				captures: [{ name: 'decorators', token: null, multiple: true, field: null, kind: 'decorator', after: null, anchor: null }],
				dropped: [],
				reason: null,
				pattern: { line: 3, source: '(decorated_definition (decorator)* @decorators definition: (_) @element)' }
			}
		]);
	});

	it('reads a slot a container drops on purpose, from a pattern grouped with its reason', async () => {
		const source =
			'((attributed_argument (attribute_item)* @dropped (_) @element) (#set! reason "the element is a supertype"))';
		expect((await readBindings(source)).containers).toEqual([
			{
				kind: 'attributed_argument',
				element: { field: null, kind: null, after: { field: null, kind: 'attribute_item', after: null, anchor: null }, anchor: null },
				captures: [],
				dropped: [{ field: null, kind: 'attribute_item', after: null, anchor: null }],
				reason: 'the element is a supertype',
				pattern: { line: 1, source }
			}
		]);
	});

	it('keeps the text of a token a container captures', async () => {
		const { containers } = await readBindings('(ambient_declaration "declare" @declare (_) @element)');
		expect(containers[0]?.captures.map((c) => [c.name, c.token])).toEqual([['declare', 'declare']]);
	});

	it('selects an unfielded wildcard by its position after the node pattern before it, never after a token', async () => {
		const { members, containers } = await readBindings(
			[
				'(index_expression (_) @object (_) @index) @expression.subscript',
				'(unary_expression "-" (_) @argument) @expression.unary.negation',
				'(attributed_parameter (attribute_item)? (_) @element)'
			].join('\n')
		);
		const first = { field: null, kind: null, after: null, anchor: null };
		expect(members).toEqual([
			{ route: 'rename', owner: 'index_expression', name: 'object', ...first },
			{ route: 'rename', owner: 'index_expression', name: 'index', field: null, kind: null, after: first, anchor: null },
			{ route: 'rename', owner: 'unary_expression', name: 'argument', ...first }
		]);
		expect(containers.map((c) => c.element)).toEqual([
			{ field: null, kind: null, after: { field: null, kind: 'attribute_item', after: null, anchor: null }, anchor: null }
		]);
	});

	it('reads an unclaimed pattern as its kind and its reason, never a claim', async () => {
		const facts = await readBindings('((string_start) @unclaimed (#set! reason "string delimiter, not content"))');
		expect(facts.unclaimed).toEqual([{ kind: 'string_start', reason: 'string delimiter, not content' }]);
		expect(facts.claims).toEqual([]);
	});

	it('records the kinds enclosing a claim below the top, nearest first', async () => {
		const { claims } = await readBindings(
			[
				'(closure_parameters (_) @declaration.parameter)',
				'(impl_item_body (declaration_list (function_item) @declaration.method))'
			].join('\n')
		);
		expect(claims.map((c) => [c.vocab, c.kind, c.toplevel, c.within])).toEqual([
			['declaration.parameter', '_', false, ['closure_parameters']],
			['declaration.method', 'function_item', false, ['declaration_list', 'impl_item_body']]
		]);
	});

	it('reads a template regex as its literal runs and named holes', async () => {
		const { templates } = await readBindings(
			'((function_definition name: (identifier) @name) @declaration.method.dunder (#match? @name "^__(?<stem>.*)__$"))'
		);
		expect(templates).toEqual([
			{ vocabs: ['declaration.method.dunder'], target: 'name', template: '__${string}__', holes: ['stem'] }
		]);
	});

	it('reads a token capture as the presence of the token', async () => {
		const { members } = await readBindings('(expression_statement ";" @semi) @statement.expression');
		expect(members).toEqual([{ route: 'presence', owner: 'expression_statement', name: 'semi', token: ';', via: [] }]);
	});

	it('gives each option of an alternation the field and the captures of the alternation', async () => {
		const { members } = await readBindings('(foo name: [(a) (b)] @x) @y.z');
		expect(members).toEqual([
			{ route: 'rename', owner: 'foo', name: 'x', field: 'name', kind: 'a', after: null, anchor: null },
			{ route: 'rename', owner: 'foo', name: 'x', field: 'name', kind: 'b', after: null, anchor: null }
		]);
	});

	it('reads a keyword or punctuation capture in claim position as a token class, never a claim', async () => {
		const { claims, members } = await readBindings(
			[
				'["def" "class"] @keyword.declaration',
				'(crate) @keyword.import',
				'(crate) @identifier.crate',
				'(lexical_declaration kind: _ @keyword) @declaration.variable'
			].join('\n')
		);
		expect(claims.map((c) => c.vocab)).toEqual(['identifier.crate', 'declaration.variable']);
		expect(members).toEqual([
			{ route: 'rename', owner: 'lexical_declaration', name: 'keyword', field: 'kind', kind: null, after: null, anchor: null }
		]);
	});

	it('reads a top-level alternation as one pattern per option', async () => {
		const { claims } = await readBindings('[(true) (false)] @literal.boolean');
		expect(claims.map((c) => [c.vocab, c.kind])).toEqual([
			['literal.boolean', 'true'],
			['literal.boolean', 'false']
		]);
	});

	it('ignores comments, including one that holds quotes and parentheses', async () => {
		const { claims } = await readBindings('; a comment with "quotes" and (parens\n(identifier) @identifier');
		expect(claims.map((c) => c.vocab)).toEqual(['identifier']);
	});

	it('refuses a file that does not parse, naming the line', async () => {
		await expect(readBindings('(call [ (identifier) (number)')).rejects.toThrow(BindingsSyntaxError);
		await expect(readBindings('(identifier) @identifier\n(call [ (identifier) (number)')).rejects.toThrow(/line 2/);
	});

	it('marks each step a member descends through with the anchor that pins it to its parent\'s first child', async () => {
		const { members } = await readBindings(
			'(function_definition body: (suite_block (block . (simple_statements (simple_statements_elements . item: (expression_statement (string) @doc))))))'
		);
		expect(members).toEqual([
			{
				route: 'nested',
				owner: 'function_definition',
				name: 'doc',
				parent: 'expression_statement',
				multiple: false,
				via: [
					{ field: 'item', kind: 'expression_statement', after: null, anchor: 'first' },
					{ field: null, kind: 'simple_statements_elements', after: null, anchor: null },
					{ field: null, kind: 'simple_statements', after: null, anchor: 'first' },
					{ field: null, kind: 'block', after: null, anchor: null },
					{ field: 'body', kind: 'suite_block', after: null, anchor: null }
				],
				field: null,
				kind: 'string',
				after: null,
				anchor: null
			}
		]);
	});

	it('pins a child to its parent\'s last child when the anchor follows it', async () => {
		const { members } = await readBindings('(block (expression_statement) @last .) @statement.block');
		expect(members).toEqual([
			{ route: 'rename', owner: 'block', name: 'last', field: null, kind: 'expression_statement', after: null, anchor: 'last' }
		]);
	});

	it('keeps an anchor below the claimed node on the member that descends through it', async () => {
		const { claims, members } = await readBindings(
			'(impl_item_body (declaration_list (function_item (parameters (parameters_elements . (attributed_parameter (self_parameter) @receiver)))) @declaration.method))'
		);
		expect(claims.map((c) => [c.vocab, c.within])).toEqual([['declaration.method', ['declaration_list', 'impl_item_body']]]);
		expect(members.flatMap((m) => (m.route === 'nested' ? m.via.map((step) => [step.kind, step.anchor]) : []))).toEqual([
			['attributed_parameter', 'first'],
			['parameters_elements', null],
			['parameters', null],
			['function_item', null],
			['declaration_list', null]
		]);
	});

	it.each([
		['the claimed node', '(parameters (parameters_elements . (identifier) @declaration.parameter.self))'],
		['a node enclosing the claim', '(block . (expression_statement (identifier) @identifier.statement))']
	])('refuses an anchor on %s: an anchor constrains only a step below the claim', async (_where, pattern) => {
		await expect(readBindings(`(module) @module\n${pattern}`)).rejects.toThrow(/line 2: .*anchor.*@(declaration\.parameter\.self|identifier\.statement)/);
	});

	it.each([
		['between two children', '(block (expression_statement) . (expression_statement)) @statement.block'],
		['between two grouped patterns', '((comment) . (function_definition)) @declaration.function']
	])('refuses an anchor %s: it ties siblings together, which no step expresses', async (_where, pattern) => {
		await expect(readBindings(pattern)).rejects.toThrow(/line 1: .*anchor.*sibling/);
	});
});

describe('bindingPatterns', () => {
	it('slices each top-level pattern by its byte span, after multibyte comments', async () => {
		const patterns = await bindingPatterns('; ── module ──\n(module) @module\n; ── é\n(identifier) @identifier\n');
		expect(patterns.map((p) => [p.line, p.source])).toEqual([
			[2, '(module) @module'],
			[4, '(identifier) @identifier']
		]);
	});
});
