import { CHOICE, FIELD, OPTIONAL, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import type { Rule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import { readRuleMetadata } from '../rule-metadata.ts';

// Minimal helper: build a tree-sitter grammar result in the shape our
// grammarFn produces — `{ grammar: { name, rules } }`.
function mkGrammar(rules: Record<string, Rule<'evaluate'>>) {
	return { grammar: { name: 'test', rules } };
}

// enrich() returns a new grammar with enriched rules in place.
function runEnrich(input: ReturnType<typeof mkGrammar>) {
	return enrich(input) as unknown as {
		grammar: { name: string; rules: Record<string, Rule<'evaluate'>> };
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
					type: SEQ,
					members: [
						{ type: SYMBOL, name: 'function' },
						{ type: STRING, value: '(' },
						{ type: SYMBOL, name: 'arguments' },
						{ type: STRING, value: ')' }
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
					type: SEQ,
					members: [
						{ type: SYMBOL, name: 'function' },
						{ type: STRING, value: '(' },
						{ type: SYMBOL, name: 'arguments' },
						{ type: STRING, value: ')' }
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
					type: SEQ,
					members: [
						{ type: SYMBOL, name: 'function' },
						{ type: STRING, value: '(' },
						{ type: SYMBOL, name: 'arguments' },
						{ type: STRING, value: ')' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.call as { type: 'SEQ'; members: Rule[] };
			expect(rule.members[0]).toMatchObject({
				type: 'FIELD',
				name: 'function',
				content: { type: 'SYMBOL', name: 'function' }
			});
			expect(readRuleMetadata((rule.members[0] as { metadata?: unknown }).metadata)?.fieldSource).toBe('enriched');
			expect(rule.members[2]).toMatchObject({
				type: 'FIELD',
				name: 'arguments',
				content: { type: 'SYMBOL', name: 'arguments' }
			});
			expect(readRuleMetadata((rule.members[2] as { metadata?: unknown }).metadata)?.fieldSource).toBe('enriched');
			// String delimiters untouched
			expect(rule.members[1]).toMatchObject({ type: 'STRING', value: '(' });
			expect(rule.members[3]).toMatchObject({ type: 'STRING', value: ')' });
		});

		it('skips when a field with the same name already exists', () => {
			const savedQuiet = process.env.SITTIR_QUIET;
			delete process.env.SITTIR_QUIET;
			try {
				const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
				const input = mkGrammar({
					foo: {
						type: SEQ,
						members: [
							{
								type: FIELD,
								name: 'expression',
								content: { type: STRING, value: '(' }
							},
							{ type: SYMBOL, name: 'expression' }
						]
					}
				});
				const out = runEnrich(input);
				const rule = out.grammar.rules.foo as { type: 'SEQ'; members: Rule[] };
				// Second member (bare symbol) stays bare — already-taken name
				expect(rule.members[1]).toMatchObject({
					type: 'SYMBOL',
					name: 'expression'
				});
				const calls = stderrSpy.mock.calls.map((c) => String(c[0]));
				// Pass was renamed kind-to-name → symbol-to-field in 80ee7ad9
				// (passes 1+3 merged into one symbol-to-field pass + fixed-point loop).
				expect(calls.some((c) => c.includes('skipped symbol-to-field on foo'))).toBe(true);
			} finally {
				if (savedQuiet !== undefined) process.env.SITTIR_QUIET = savedQuiet;
			}
		});

		it('numbers duplicate references — same kind appears multiple times', () => {
			// Tree-sitter records field tags per-occurrence; the validator
			// and downstream codegen need distinct field names to route each
			// child correctly. The legacy behavior left duplicates bare,
			// which lost positional information; numbered suffixes
			// (`<name>1`, `<name>2`, …) preserve it.
			const input = mkGrammar({
				binary_expr: {
					type: SEQ,
					members: [
						{ type: SYMBOL, name: 'expression' },
						{ type: STRING, value: '+' },
						{ type: SYMBOL, name: 'expression' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.binary_expr as {
				type: 'SEQ';
				members: Rule[];
			};
			expect(rule.members[0]).toMatchObject({
				type: 'FIELD',
				name: 'expression1',
				content: { type: 'SYMBOL', name: 'expression' }
			});
			expect(readRuleMetadata((rule.members[0] as { metadata?: unknown }).metadata)?.fieldSource).toBe('enriched');
			expect(rule.members[2]).toMatchObject({
				type: 'FIELD',
				name: 'expression2',
				content: { type: 'SYMBOL', name: 'expression' }
			});
			expect(readRuleMetadata((rule.members[2] as { metadata?: unknown }).metadata)?.fieldSource).toBe('enriched');
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
					type: SEQ,
					members: [
						{ type: SYMBOL, name: 'identifier' },
						{
							type: REPEAT,
							content: {
								type: SEQ,
								members: [
									{ type: STRING, value: '.' },
									{ type: SYMBOL, name: 'identifier' }
								]
							}
						}
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.dotted_name as {
				type: 'SEQ';
				members: Rule[];
			};
			// Top-level identifier MUST stay bare (no enrich-added field)
			expect(rule.members[0]).toMatchObject({
				type: 'SYMBOL',
				name: 'identifier'
			});
		});

		it('skips hidden-kind references (leading underscore)', () => {
			const input = mkGrammar({
				foo: {
					type: SEQ,
					members: [
						{ type: SYMBOL, name: '_statement' },
						{ type: STRING, value: ';' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.foo as { type: 'SEQ'; members: Rule[] };
			// Hidden kind stays bare — sittir Link handles alias resolution
			expect(rule.members[0]).toMatchObject({
				type: 'SYMBOL',
				name: '_statement'
			});
		});

		it('leaves existing field wrappers in place', () => {
			const input = mkGrammar({
				assign: {
					type: SEQ,
					members: [
						{
							type: FIELD,
							name: 'left',
							content: { type: SYMBOL, name: 'expression' }
						},
						{ type: STRING, value: '=' },
						{ type: SYMBOL, name: 'rhs' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.assign as { type: 'SEQ'; members: Rule[] };
			// Existing field preserved
			expect(rule.members[0]).toMatchObject({ type: 'FIELD', name: 'left' });
			// rhs promoted
			expect(rule.members[2]).toMatchObject({
				type: 'FIELD',
				name: 'rhs'
			});
			expect(readRuleMetadata((rule.members[2] as { metadata?: unknown }).metadata)?.fieldSource).toBe('enriched');
		});
	});

	describe('optional keyword-prefix promotion (pass 2)', () => {
		it('promotes optional(identifier-shaped string) to optional(field)', () => {
			const input = mkGrammar({
				function_definition: {
					type: SEQ,
					members: [
						{ type: OPTIONAL, content: { type: STRING, value: 'async' } },
						{ type: STRING, value: 'def' },
						{ type: SYMBOL, name: 'name' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.function_definition as {
				type: 'SEQ';
				members: Rule[];
			};
			// optional(field('<kw>_marker', SYMBOL(_kw_<kw>_marker))) —
			// the FIELD's content is a synthesized SYMBOL reference so
			// tree-sitter's normalizer preserves it. The `_marker` suffix
			// is the canonical semantic name (avoids JS-reserved-keyword
			// collisions like `async` / `static` / `const`).
			expect(rule.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: {
					type: 'FIELD',
					name: 'async_marker',
					content: { type: 'SYMBOL', name: '_kw_async_marker' }
				}
			});
			expect(
				readRuleMetadata(
					((rule.members[0] as { content?: unknown }).content as { metadata?: unknown } | undefined)?.metadata
				)?.fieldSource
			).toBe('enriched');
			// 'def' is NOT promoted — bare leading literal, only the
			// optional variant is handled (spec 006 restriction).
			expect(rule.members[1]).toMatchObject({ type: 'STRING', value: 'def' });
		});

		it('does not promote non-identifier-shaped literals', () => {
			const input = mkGrammar({
				conditional: {
					type: SEQ,
					members: [
						{ type: OPTIONAL, content: { type: STRING, value: '::' } },
						{ type: SYMBOL, name: 'path' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.conditional as {
				type: 'SEQ';
				members: Rule[];
			};
			// '::' is punctuation — untouched
			expect(rule.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'STRING', value: '::' }
			});
		});

		it('skips when a field with the same name already exists, reports to stderr', () => {
			const savedQuiet = process.env.SITTIR_QUIET;
			delete process.env.SITTIR_QUIET;
			try {
				const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
				const input = mkGrammar({
					decorated_fn: {
						type: SEQ,
						members: [
							{
								type: FIELD,
								name: 'async_marker',
								content: { type: STRING, value: 'async' }
							},
							{ type: OPTIONAL, content: { type: STRING, value: 'async' } }
						]
					}
				});
				const out = runEnrich(input);
				const rule = out.grammar.rules.decorated_fn as {
					type: 'SEQ';
					members: Rule[];
				};
				// Second member stays unpromoted — `async_marker` collides
				// with the existing FIELD on member 0.
				expect(rule.members[1]).toMatchObject({
					type: 'OPTIONAL',
					content: { type: 'STRING', value: 'async' }
				});
				const calls = stderrSpy.mock.calls.map((c) => String(c[0]));
				expect(calls.some((c) => c.includes('skipped optional-keyword-prefix on decorated_fn'))).toBe(true);
			} finally {
				if (savedQuiet !== undefined) process.env.SITTIR_QUIET = savedQuiet;
			}
		});

		it('recurses into choice members', () => {
			const input = mkGrammar({
				stmt: {
					type: CHOICE,
					members: [
						{
							type: SEQ,
							members: [
								{ type: OPTIONAL, content: { type: STRING, value: 'let' } },
								{ type: SYMBOL, name: 'binding' }
							]
						},
						{
							type: SEQ,
							members: [
								{
									type: OPTIONAL,
									content: { type: STRING, value: 'const' }
								},
								{ type: SYMBOL, name: 'binding' }
							]
						}
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.stmt as {
				type: 'CHOICE';
				members: Array<{ type: 'SEQ'; members: Rule[] }>;
			};
			// Both choice branches get the optional-keyword promotion
			// (named `<token>_marker`).
			const branch0 = rule.members[0]!;
			const branch1 = rule.members[1]!;
			expect(branch0.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'let_marker' }
			});
			expect(branch1.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'const_marker' }
			});
		});

		it('recurses into nested wrappers (optional/repeat)', () => {
			const input = mkGrammar({
				block: {
					type: REPEAT,
					content: {
						type: SEQ,
						members: [
							{ type: OPTIONAL, content: { type: STRING, value: 'pub' } },
							{ type: SYMBOL, name: 'item' }
						]
					}
				}
			});
			const out = runEnrich(input);
			// enrich no longer auto-decomposes — group synthesis lives in
			// dsl/wire/auto-groups.ts now. enrich just runs its own
			// passes (optional-keyword promotion, multiplicity stamping,
			// field wrappers) and leaves the structural shape alone, so
			// the repeat's seq content is preserved and the inner
			// optional-keyword promotion still wraps the 'pub' string as
			// FIELD(SYMBOL(_kw_pub)).
			const rule = out.grammar.rules.block as {
				type: 'REPEAT';
				content: { type: 'SEQ'; members: Rule[] };
			};
			expect(rule.content.type).toBe('SEQ');
			expect(rule.content.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'pub_marker' }
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
					type: 'PREC',
					value: 1,
					content: {
						type: 'SEQ',
						members: [
							{
								type: 'OPTIONAL',
								content: { type: 'STRING', value: 'static' }
							},
							{ type: 'OPTIONAL', content: { type: 'STRING', value: 'async' } },
							{ type: 'OPTIONAL', content: { type: 'STRING', value: 'move' } },
							{ type: 'SYMBOL', name: 'parameters' }
						]
					}
				} as unknown as Rule
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.closure_expression as unknown as {
				type: 'PREC';
				value: number;
				content: { type: 'SEQ'; members: Rule[] };
			};
			// prec wrapper preserved (we ride the wrapper back on top, not strip it).
			expect(rule.type).toBe('PREC');
			expect(rule.value).toBe(1);
			// Each optional-keyword promoted as `<token>_marker`.
			expect(rule.content.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'static_marker' }
			});
			expect(rule.content.members[1]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'async_marker' }
			});
			expect(rule.content.members[2]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'move_marker' }
			});
		});

		it('descends through prec.left(...) wrappers (python for_in_clause)', () => {
			// for_in_clause: prec.left(seq(optional('async'), 'for', ...)).
			const input = mkGrammar({
				for_in_clause: {
					type: 'PREC_LEFT',
					value: 1,
					content: {
						type: 'SEQ',
						members: [
							{ type: 'OPTIONAL', content: { type: 'STRING', value: 'async' } },
							{ type: 'STRING', value: 'for' },
							{ type: 'SYMBOL', name: 'pattern' }
						]
					}
				} as unknown as Rule
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.for_in_clause as unknown as {
				type: 'PREC_LEFT';
				value: number;
				content: { type: 'SEQ'; members: Rule[] };
			};
			expect(rule.type).toBe('PREC_LEFT');
			expect(rule.content.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'async_marker' }
			});
		});

		it('descends through prec.right(...) wrappers (ts assignment_expression)', () => {
			// assignment_expression: prec.right('assign', seq(
			//   optional('using'), field('left', ...), '=', field('right', ...)))
			const input = mkGrammar({
				assignment_expression: {
					type: 'PREC_RIGHT',
					value: 'assign',
					content: {
						type: 'SEQ',
						members: [
							{ type: 'OPTIONAL', content: { type: 'STRING', value: 'using' } },
							{
								type: 'FIELD',
								name: 'left',
								content: { type: 'SYMBOL', name: 'expression' }
							},
							{ type: 'STRING', value: '=' },
							{
								type: 'FIELD',
								name: 'right',
								content: { type: 'SYMBOL', name: 'expression' }
							}
						]
					}
				} as unknown as Rule
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.assignment_expression as unknown as {
				type: 'PREC_RIGHT';
				value: string;
				content: { type: 'SEQ'; members: Rule[] };
			};
			expect(rule.type).toBe('PREC_RIGHT');
			expect(rule.content.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'using_marker' }
			});
			// Existing `field('left', ...)` and `field('right', ...)` untouched.
			expect(rule.content.members[1]).toMatchObject({
				type: 'FIELD',
				name: 'left'
			});
			expect(rule.content.members[3]).toMatchObject({
				type: 'FIELD',
				name: 'right'
			});
		});

		it('descends through prec.dynamic(...) wrappers', () => {
			const input = mkGrammar({
				dyn_rule: {
					type: 'PREC_DYNAMIC',
					value: 5,
					content: {
						type: 'SEQ',
						members: [
							{
								type: 'OPTIONAL',
								content: { type: 'STRING', value: 'extern' }
							},
							{ type: 'SYMBOL', name: 'body' }
						]
					}
				} as unknown as Rule
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.dyn_rule as unknown as {
				type: 'PREC_DYNAMIC';
				value: number;
				content: { type: 'SEQ'; members: Rule[] };
			};
			expect(rule.type).toBe('PREC_DYNAMIC');
			expect(rule.content.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'extern_marker' }
			});
		});

		it('respects pre-existing field-name claims on the inner seq of a prec wrapper', () => {
			// prec-wrapped seq with an existing `field('async_marker', ...)`
			// on a sibling position — the optional('async') below MUST be
			// skipped (collision) instead of silently double-binding the name.
			const savedQuiet = process.env.SITTIR_QUIET;
			delete process.env.SITTIR_QUIET;
			try {
				const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
				const input = mkGrammar({
					wrapped: {
						type: 'PREC',
						value: 1,
						content: {
							type: 'SEQ',
							members: [
								{
									type: 'FIELD',
									name: 'async_marker',
									content: { type: 'STRING', value: 'async' }
								},
								{ type: 'OPTIONAL', content: { type: 'STRING', value: 'async' } }
							]
						}
					} as unknown as Rule
				});
				const out = runEnrich(input);
				const rule = out.grammar.rules.wrapped as unknown as {
					type: 'PREC';
					content: { type: 'SEQ'; members: Rule[] };
				};
				// Second member stays unpromoted — collision with member 0.
				expect(rule.content.members[1]).toMatchObject({
					type: 'OPTIONAL',
					content: { type: 'STRING', value: 'async' }
				});
				const calls = stderrSpy.mock.calls.map((c) => String(c[0]));
				expect(calls.some((c) => c.includes('skipped optional-keyword-prefix on wrapped'))).toBe(true);
			} finally {
				if (savedQuiet !== undefined) process.env.SITTIR_QUIET = savedQuiet;
			}
		});
	});

	describe('non-seq rules', () => {
		it('passes through choice rules unchanged', () => {
			const input = mkGrammar({
				expr: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'a' },
						{ type: SYMBOL, name: 'b' }
					]
				}
			});
			const out = runEnrich(input);
			expect(out.grammar.rules.expr).toEqual(input.grammar.rules.expr);
		});

		it('passes through bare symbol rules unchanged', () => {
			const input = mkGrammar({
				alias_rule: { type: SYMBOL, name: 'target' }
			});
			const out = runEnrich(input);
			expect(out.grammar.rules.alias_rule).toEqual(input.grammar.rules.alias_rule);
		});
	});
});
