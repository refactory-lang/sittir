import {
	describe,
	it,
	expect,
	vi,
	afterEach,
	beforeAll,
	afterAll
} from 'vitest';
import { enrich } from '../enrich.ts';
import type { Rule } from '../../compiler/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

// Minimal helper: build a tree-sitter grammar result in the shape our
// grammarFn produces — `{ grammar: { name, rules } }`.
function mkGrammar(rules: Record<string, Rule>) {
	return { grammar: { name: 'test', rules } };
}

// enrich() returns a new grammar with enriched rules in place.
function runEnrich(input: ReturnType<typeof mkGrammar>) {
	return enrich(input) as unknown as {
		grammar: { name: string; rules: Record<string, Rule> };
	};
}

describe('enrich()', () => {
	beforeAll(() => {
		installFakeDsl();
	});
	afterAll(() => {
		restoreFakeDsl();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('purity & non-mutation', () => {
		it('does not mutate the input grammar', () => {
			const input = mkGrammar({
				call: {
					type: 'seq',
					members: [
						{ type: 'symbol', name: 'function' },
						{ type: 'string', value: '(' },
						{ type: 'symbol', name: 'arguments' },
						{ type: 'string', value: ')' }
					]
				}
			});
			const snapshot = JSON.stringify(input);
			enrich(input);
			expect(JSON.stringify(input)).toBe(snapshot);
		});

		it('is idempotent — enrich(enrich(g)) ≡ enrich(g)', () => {
			const input = mkGrammar({
				call: {
					type: 'seq',
					members: [
						{ type: 'symbol', name: 'function' },
						{ type: 'string', value: '(' },
						{ type: 'symbol', name: 'arguments' },
						{ type: 'string', value: ')' }
					]
				}
			});
			const once = enrich(input);
			const twice = enrich(once);
			expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
		});
	});

	describe('kind-to-name field wrapping', () => {
		it('wraps unambiguous symbol references as named fields', () => {
			const input = mkGrammar({
				call: {
					type: 'seq',
					members: [
						{ type: 'symbol', name: 'function' },
						{ type: 'string', value: '(' },
						{ type: 'symbol', name: 'arguments' },
						{ type: 'string', value: ')' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.call as { type: 'seq'; members: Rule[] };
			expect(rule.members[0]).toMatchObject({
				type: 'field',
				name: 'function',
				content: { type: 'symbol', name: 'function' },
				source: 'enriched'
			});
			expect(rule.members[2]).toMatchObject({
				type: 'field',
				name: 'arguments',
				content: { type: 'symbol', name: 'arguments' },
				source: 'enriched'
			});
			// String delimiters untouched
			expect(rule.members[1]).toMatchObject({ type: 'string', value: '(' });
			expect(rule.members[3]).toMatchObject({ type: 'string', value: ')' });
		});

		it('skips when a field with the same name already exists', () => {
			const savedQuiet = process.env.SITTIR_QUIET;
			delete process.env.SITTIR_QUIET;
			try {
				const stderrSpy = vi
					.spyOn(process.stderr, 'write')
					.mockImplementation(() => true);
				const input = mkGrammar({
					foo: {
						type: 'seq',
						members: [
							{
								type: 'field',
								name: 'expression',
								content: { type: 'string', value: '(' }
							},
							{ type: 'symbol', name: 'expression' }
						]
					}
				});
				const out = runEnrich(input);
				const rule = out.grammar.rules.foo as { type: 'seq'; members: Rule[] };
				// Second member (bare symbol) stays bare — already-taken name
				expect(rule.members[1]).toMatchObject({
					type: 'symbol',
					name: 'expression'
				});
				const calls = stderrSpy.mock.calls.map((c) => String(c[0]));
				// Pass was renamed kind-to-name → symbol-to-field in 80ee7ad9
				// (passes 1+3 merged into one symbol-to-field pass + fixed-point loop).
				expect(
					calls.some((c) => c.includes('skipped symbol-to-field on foo'))
				).toBe(true);
			} finally {
				if (savedQuiet !== undefined) process.env.SITTIR_QUIET = savedQuiet;
			}
		});

		it('skips ambiguous references — same kind appears multiple times', () => {
			const input = mkGrammar({
				binary_expr: {
					type: 'seq',
					members: [
						{ type: 'symbol', name: 'expression' },
						{ type: 'string', value: '+' },
						{ type: 'symbol', name: 'expression' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.binary_expr as {
				type: 'seq';
				members: Rule[];
			};
			// Both stays bare — ambiguous which is THE expression
			expect(rule.members[0]).toMatchObject({
				type: 'symbol',
				name: 'expression'
			});
			expect(rule.members[2]).toMatchObject({
				type: 'symbol',
				name: 'expression'
			});
		});

		it('skips when the same kind also appears inside a REPEAT in the same body', () => {
			// python `dotted_name: prec(1, sep1($.identifier, '.'))` =
			//   `seq($.identifier, repeat(seq('.', $.identifier)))`.
			// The bare top-level identifier was being auto-promoted to
			// `field('identifier', $.identifier)` because the symbol-count
			// scan only looked at top-level seq positions. The repeat-
			// wrapped identifier surfaces as an unfielded `$children`
			// entry — promoting the bare one splits the same kind across
			// `$fields.identifier` and `$children`, which the variadic
			// factory `dottedName(...children: Identifier[])` can't
			// reconstruct (no leading-field slot).
			const input = mkGrammar({
				dotted_name: {
					type: 'seq',
					members: [
						{ type: 'symbol', name: 'identifier' },
						{
							type: 'repeat',
							content: {
								type: 'seq',
								members: [
									{ type: 'string', value: '.' },
									{ type: 'symbol', name: 'identifier' }
								]
							}
						}
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.dotted_name as {
				type: 'seq';
				members: Rule[];
			};
			// Top-level identifier MUST stay bare (no enrich-added field)
			expect(rule.members[0]).toMatchObject({
				type: 'symbol',
				name: 'identifier'
			});
		});

		it('skips hidden-kind references (leading underscore)', () => {
			const input = mkGrammar({
				foo: {
					type: 'seq',
					members: [
						{ type: 'symbol', name: '_statement' },
						{ type: 'string', value: ';' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.foo as { type: 'seq'; members: Rule[] };
			// Hidden kind stays bare — sittir Link handles alias resolution
			expect(rule.members[0]).toMatchObject({
				type: 'symbol',
				name: '_statement'
			});
		});

		it('leaves existing field wrappers in place', () => {
			const input = mkGrammar({
				assign: {
					type: 'seq',
					members: [
						{
							type: 'field',
							name: 'left',
							content: { type: 'symbol', name: 'expression' }
						},
						{ type: 'string', value: '=' },
						{ type: 'symbol', name: 'rhs' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.assign as { type: 'seq'; members: Rule[] };
			// Existing field preserved
			expect(rule.members[0]).toMatchObject({ type: 'field', name: 'left' });
			// rhs promoted
			expect(rule.members[2]).toMatchObject({
				type: 'field',
				name: 'rhs',
				source: 'enriched'
			});
		});
	});

	describe('optional keyword-prefix promotion (pass 2)', () => {
		it('promotes optional(identifier-shaped string) to optional(field)', () => {
			const input = mkGrammar({
				function_definition: {
					type: 'seq',
					members: [
						{ type: 'optional', content: { type: 'string', value: 'async' } },
						{ type: 'string', value: 'def' },
						{ type: 'symbol', name: 'name' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.function_definition as {
				type: 'seq';
				members: Rule[];
			};
			// optional(field('<kw>_marker', SYMBOL(_kw_<kw>_marker))) —
			// the FIELD's content is a synthesized SYMBOL reference so
			// tree-sitter's normalizer preserves it. The `_marker` suffix
			// is the canonical semantic name (avoids JS-reserved-keyword
			// collisions like `async` / `static` / `const`).
			expect(rule.members[0]).toMatchObject({
				type: 'optional',
				content: {
					type: 'field',
					name: 'async_marker',
					content: { type: 'symbol', name: '_kw_async_marker' },
					source: 'enriched'
				}
			});
			// 'def' is NOT promoted — bare leading literal, only the
			// optional variant is handled (spec 006 restriction).
			expect(rule.members[1]).toMatchObject({ type: 'string', value: 'def' });
		});

		it('does not promote non-identifier-shaped literals', () => {
			const input = mkGrammar({
				conditional: {
					type: 'seq',
					members: [
						{ type: 'optional', content: { type: 'string', value: '::' } },
						{ type: 'symbol', name: 'path' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.conditional as {
				type: 'seq';
				members: Rule[];
			};
			// '::' is punctuation — untouched
			expect(rule.members[0]).toMatchObject({
				type: 'optional',
				content: { type: 'string', value: '::' }
			});
		});

		it('skips when a field with the same name already exists, reports to stderr', () => {
			const savedQuiet = process.env.SITTIR_QUIET;
			delete process.env.SITTIR_QUIET;
			try {
				const stderrSpy = vi
					.spyOn(process.stderr, 'write')
					.mockImplementation(() => true);
				const input = mkGrammar({
					decorated_fn: {
						type: 'seq',
						members: [
							{
								type: 'field',
								name: 'async_marker',
								content: { type: 'string', value: 'async' }
							},
							{ type: 'optional', content: { type: 'string', value: 'async' } }
						]
					}
				});
				const out = runEnrich(input);
				const rule = out.grammar.rules.decorated_fn as {
					type: 'seq';
					members: Rule[];
				};
				// Second member stays unpromoted — `async_marker` collides
				// with the existing FIELD on member 0.
				expect(rule.members[1]).toMatchObject({
					type: 'optional',
					content: { type: 'string', value: 'async' }
				});
				const calls = stderrSpy.mock.calls.map((c) => String(c[0]));
				expect(
					calls.some((c) =>
						c.includes('skipped optional-keyword-prefix on decorated_fn')
					)
				).toBe(true);
			} finally {
				if (savedQuiet !== undefined) process.env.SITTIR_QUIET = savedQuiet;
			}
		});

		it('recurses into choice members', () => {
			const input = mkGrammar({
				stmt: {
					type: 'choice',
					members: [
						{
							type: 'seq',
							members: [
								{ type: 'optional', content: { type: 'string', value: 'let' } },
								{ type: 'symbol', name: 'binding' }
							]
						},
						{
							type: 'seq',
							members: [
								{
									type: 'optional',
									content: { type: 'string', value: 'const' }
								},
								{ type: 'symbol', name: 'binding' }
							]
						}
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.stmt as {
				type: 'choice';
				members: Array<{ type: 'seq'; members: Rule[] }>;
			};
			// Both choice branches get the optional-keyword promotion
			// (named `<token>_marker`).
			const branch0 = rule.members[0]!;
			const branch1 = rule.members[1]!;
			expect(branch0.members[0]).toMatchObject({
				type: 'optional',
				content: { type: 'field', name: 'let_marker' }
			});
			expect(branch1.members[0]).toMatchObject({
				type: 'optional',
				content: { type: 'field', name: 'const_marker' }
			});
		});

		it('recurses into nested wrappers (optional/repeat)', () => {
			const input = mkGrammar({
				block: {
					type: 'repeat',
					content: {
						type: 'seq',
						members: [
							{ type: 'optional', content: { type: 'string', value: 'pub' } },
							{ type: 'symbol', name: 'item' }
						]
					}
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.block as {
				type: 'repeat';
				content: { type: 'seq'; members: Rule[] };
			};
			expect(rule.content.members[0]).toMatchObject({
				type: 'optional',
				content: { type: 'field', name: 'pub_marker' }
			});
		});

		it('descends through prec(...) wrappers (rust closure_expression)', () => {
			// closure_expression: prec(closure, seq(
			//   optional('static'), optional('async'), optional('move'),
			//   field('parameters', ...), ...))
			// Without prec descent, the optional puncts inside the prec'd
			// seq would NOT be auto-promoted at the codegen surface.
			const input = mkGrammar({
				closure_expression: {
					type: 'prec',
					value: 1,
					content: {
						type: 'seq',
						members: [
							{
								type: 'optional',
								content: { type: 'string', value: 'static' }
							},
							{ type: 'optional', content: { type: 'string', value: 'async' } },
							{ type: 'optional', content: { type: 'string', value: 'move' } },
							{ type: 'symbol', name: 'parameters' }
						]
					}
				} as unknown as Rule
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.closure_expression as unknown as {
				type: 'prec';
				value: number;
				content: { type: 'seq'; members: Rule[] };
			};
			// prec wrapper preserved (we ride the wrapper back on top, not strip it).
			expect(rule.type).toBe('prec');
			expect(rule.value).toBe(1);
			// Each optional-keyword promoted as `<token>_marker`.
			expect(rule.content.members[0]).toMatchObject({
				type: 'optional',
				content: { type: 'field', name: 'static_marker' }
			});
			expect(rule.content.members[1]).toMatchObject({
				type: 'optional',
				content: { type: 'field', name: 'async_marker' }
			});
			expect(rule.content.members[2]).toMatchObject({
				type: 'optional',
				content: { type: 'field', name: 'move_marker' }
			});
		});

		it('descends through prec.left(...) wrappers (python for_in_clause)', () => {
			// for_in_clause: prec.left(seq(optional('async'), 'for', ...)).
			const input = mkGrammar({
				for_in_clause: {
					type: 'prec_left',
					value: 1,
					content: {
						type: 'seq',
						members: [
							{ type: 'optional', content: { type: 'string', value: 'async' } },
							{ type: 'string', value: 'for' },
							{ type: 'symbol', name: 'pattern' }
						]
					}
				} as unknown as Rule
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.for_in_clause as unknown as {
				type: 'prec_left';
				value: number;
				content: { type: 'seq'; members: Rule[] };
			};
			expect(rule.type).toBe('prec_left');
			expect(rule.content.members[0]).toMatchObject({
				type: 'optional',
				content: { type: 'field', name: 'async_marker' }
			});
		});

		it('descends through prec.right(...) wrappers (ts assignment_expression)', () => {
			// assignment_expression: prec.right('assign', seq(
			//   optional('using'), field('left', ...), '=', field('right', ...)))
			const input = mkGrammar({
				assignment_expression: {
					type: 'prec_right',
					value: 'assign',
					content: {
						type: 'seq',
						members: [
							{ type: 'optional', content: { type: 'string', value: 'using' } },
							{
								type: 'field',
								name: 'left',
								content: { type: 'symbol', name: 'expression' }
							},
							{ type: 'string', value: '=' },
							{
								type: 'field',
								name: 'right',
								content: { type: 'symbol', name: 'expression' }
							}
						]
					}
				} as unknown as Rule
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.assignment_expression as unknown as {
				type: 'prec_right';
				value: string;
				content: { type: 'seq'; members: Rule[] };
			};
			expect(rule.type).toBe('prec_right');
			expect(rule.content.members[0]).toMatchObject({
				type: 'optional',
				content: { type: 'field', name: 'using_marker' }
			});
			// Existing `field('left', ...)` and `field('right', ...)` untouched.
			expect(rule.content.members[1]).toMatchObject({
				type: 'field',
				name: 'left'
			});
			expect(rule.content.members[3]).toMatchObject({
				type: 'field',
				name: 'right'
			});
		});

		it('descends through prec.dynamic(...) wrappers', () => {
			const input = mkGrammar({
				dyn_rule: {
					type: 'prec_dynamic',
					value: 5,
					content: {
						type: 'seq',
						members: [
							{
								type: 'optional',
								content: { type: 'string', value: 'extern' }
							},
							{ type: 'symbol', name: 'body' }
						]
					}
				} as unknown as Rule
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.dyn_rule as unknown as {
				type: 'prec_dynamic';
				value: number;
				content: { type: 'seq'; members: Rule[] };
			};
			expect(rule.type).toBe('prec_dynamic');
			expect(rule.content.members[0]).toMatchObject({
				type: 'optional',
				content: { type: 'field', name: 'extern_marker' }
			});
		});

		it('respects pre-existing field-name claims on the inner seq of a prec wrapper', () => {
			// prec-wrapped seq with an existing `field('async_marker', ...)`
			// on a sibling position — the optional('async') below MUST be
			// skipped (collision) instead of silently double-binding the name.
			const savedQuiet = process.env.SITTIR_QUIET;
			delete process.env.SITTIR_QUIET;
			try {
				const stderrSpy = vi
					.spyOn(process.stderr, 'write')
					.mockImplementation(() => true);
				const input = mkGrammar({
					wrapped: {
						type: 'prec',
						value: 1,
						content: {
							type: 'seq',
							members: [
								{
									type: 'field',
									name: 'async_marker',
									content: { type: 'string', value: 'async' }
								},
								{ type: 'optional', content: { type: 'string', value: 'async' } }
							]
						}
					} as unknown as Rule
				});
				const out = runEnrich(input);
				const rule = out.grammar.rules.wrapped as unknown as {
					type: 'prec';
					content: { type: 'seq'; members: Rule[] };
				};
				// Second member stays unpromoted — collision with member 0.
				expect(rule.content.members[1]).toMatchObject({
					type: 'optional',
					content: { type: 'string', value: 'async' }
				});
				const calls = stderrSpy.mock.calls.map((c) => String(c[0]));
				expect(
					calls.some((c) =>
						c.includes('skipped optional-keyword-prefix on wrapped')
					)
				).toBe(true);
			} finally {
				if (savedQuiet !== undefined) process.env.SITTIR_QUIET = savedQuiet;
			}
		});
	});

	describe('non-seq rules', () => {
		it('passes through choice rules unchanged', () => {
			const input = mkGrammar({
				expr: {
					type: 'choice',
					members: [
						{ type: 'symbol', name: 'a' },
						{ type: 'symbol', name: 'b' }
					]
				}
			});
			const out = runEnrich(input);
			expect(out.grammar.rules.expr).toEqual(input.grammar.rules.expr);
		});

		it('passes through bare symbol rules unchanged', () => {
			const input = mkGrammar({
				alias_rule: { type: 'symbol', name: 'target' }
			});
			const out = runEnrich(input);
			expect(out.grammar.rules.alias_rule).toEqual(
				input.grammar.rules.alias_rule
			);
		});
	});
});
