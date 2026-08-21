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

		it('fields both the leading and repeated occurrence of a separated-list element with the same name', () => {
			// python `dotted_name: prec(1, sep1($.identifier, '.'))` =
			//   `seq($.identifier, repeat(seq('.', $.identifier)))`.
			// `fieldSeparatedListElements` fields BOTH the leading and the
			// repeat's per-iteration occurrence with the SAME name — tree-sitter
			// merges same-named fields at different positions into one
			// array-valued field, so `import a.b.c` reads back as a single
			// `identifier: [a, b, c]` field rather than splitting across
			// field/children storage (verified against python's real
			// `dotted_name` via probe-kind).
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
			expect(rule.members[0]).toMatchObject({
				type: 'FIELD',
				name: 'identifier',
				content: { type: 'SYMBOL', name: 'identifier' }
			});
			const repeatContent = (rule.members[1] as unknown as { content: { members: Rule[] } }).content;
			expect(repeatContent.members[1]).toMatchObject({
				type: 'FIELD',
				name: 'identifier',
				content: { type: 'SYMBOL', name: 'identifier' }
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
			// collisions like `async` / `static` / `const`); the `_kw_`
			// prefix is the reserved-namespace convention shared with
			// dsl/primitives/field.ts and dsl/wire/wire.ts.
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

		it('reuses an existing base-grammar rule at `_kw_<x>_marker` instead of minting a duplicate', () => {
			const input = mkGrammar({
				_kw_async_marker: { type: STRING, value: 'async' },
				function_definition: {
					type: SEQ,
					members: [
						{ type: OPTIONAL, content: { type: STRING, value: 'async' } },
						{ type: STRING, value: 'function' },
						{ type: SYMBOL, name: 'name' }
					]
				}
			});
			const out = runEnrich(input);
			const rule = out.grammar.rules.function_definition as { type: 'SEQ'; members: Rule[] };
			expect(rule.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: {
					type: 'FIELD',
					name: 'async_marker',
					content: { type: 'SYMBOL', name: '_kw_async_marker' }
				}
			});
			// The pre-existing base-grammar rule is untouched, not replaced —
			// confirms reuse rather than a mint-over-it.
			expect(out.grammar.rules._kw_async_marker).toMatchObject({ type: 'STRING', value: 'async' });
		});

		it('declines the promotion when an existing `_kw_<x>_marker` rule has different content, reports to stderr', () => {
			const savedQuiet = process.env.SITTIR_QUIET;
			delete process.env.SITTIR_QUIET;
			try {
				const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
				const input = mkGrammar({
					_kw_async_marker: { type: STRING, value: 'unrelated_content' },
					function_definition: {
						type: SEQ,
						members: [
							{ type: OPTIONAL, content: { type: STRING, value: 'async' } },
							{ type: STRING, value: 'function' },
							{ type: SYMBOL, name: 'name' }
						]
					}
				});
				const out = runEnrich(input);
				const rule = out.grammar.rules.function_definition as { type: 'SEQ'; members: Rule[] };
				// Left unpromoted — the reserved name collides with unrelated content.
				expect(rule.members[0]).toMatchObject({
					type: 'OPTIONAL',
					content: { type: 'STRING', value: 'async' }
				});
				// The colliding base-grammar rule is untouched, not overwritten.
				expect(out.grammar.rules._kw_async_marker).toMatchObject({ type: 'STRING', value: 'unrelated_content' });
				const calls = stderrSpy.mock.calls.map((c) => String(c[0]));
				expect(
					calls.some(
						(c) =>
							c.includes('skipped optional-keyword-prefix on function_definition') &&
							c.includes("rule '_kw_async_marker' already exists in base.grammar.rules with different content")
					)
				).toBe(true);
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
			// Structured multi-slot choice arms are group-lifted by
			// mintStructuredChoiceArm into synthesized hidden rules
			// referenced via named aliases — the promotion recurses into
			// the arms FIRST and lands inside the lifted rules, each
			// `optional('<kw>')` becoming
			// `optional(field('<kw>_marker', $._kw_<kw>_marker))`.
			const rule = out.grammar.rules.stmt as {
				type: 'CHOICE';
				members: Array<{ type: 'ALIAS'; content: { type: 'SYMBOL'; name: string } }>;
			};
			expect(rule.members[0]).toMatchObject({
				type: 'ALIAS',
				content: { type: 'SYMBOL', name: '_stmt_arm1' }
			});
			expect(rule.members[1]).toMatchObject({
				type: 'ALIAS',
				content: { type: 'SYMBOL', name: '_stmt_arm2' }
			});
			const group1 = out.grammar.rules._stmt_arm1 as { type: 'SEQ'; members: Rule[] };
			const group2 = out.grammar.rules._stmt_arm2 as { type: 'SEQ'; members: Rule[] };
			expect(group1.members[0]).toMatchObject({
				type: 'OPTIONAL',
				content: { type: 'FIELD', name: 'let_marker' }
			});
			expect(group2.members[0]).toMatchObject({
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
			// FIELD(SYMBOL(_pub_marker)).
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

	describe('field-enum synthesis', () => {
		it('detects enum from choice of strings and synthesizes hidden enum rule', () => {
			const input = mkGrammar({
				binary_expression: {
					type: SEQ,
					members: [
						{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'identifier' } },
						{
							type: FIELD,
							name: 'operator',
							content: {
								type: CHOICE,
								members: [
									{ type: STRING, value: '+' },
									{ type: STRING, value: '-' },
									{ type: STRING, value: '*' },
									{ type: STRING, value: '/' }
								]
							}
						},
						{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'identifier' } }
					]
				},
				identifier: { type: SYMBOL, name: 'identifier' }
			});
			const out = runEnrich(input);
			const binExpr = out.grammar.rules.binary_expression as { type: 'SEQ'; members: Rule[] };
			const operatorField = binExpr.members.find(
				(m) => (m as { type: string; name?: string }).type === 'FIELD' && (m as { name?: string }).name === 'operator'
			) as { type: 'FIELD'; name: string; content: Rule } | undefined;
			// Field content is now a SymbolRule pointing to the synthesized kind.
			expect(operatorField!.content).toEqual(
				expect.objectContaining({
					type: 'SYMBOL',
					name: '_binary_expression_operator',
					hidden: true
				})
			);
			// The synthesized enum rule exists in the enriched rules bag, low
			// precedence so it defers to whatever else the same literal starts.
			expect(out.grammar.rules._binary_expression_operator).toEqual({
				type: 'PREC',
				content: {
					type: 'CHOICE',
					members: [
						{ type: 'STRING', value: '+' },
						{ type: 'STRING', value: '-' },
						{ type: 'STRING', value: '*' },
						{ type: 'STRING', value: '/' }
					],
					metadata: { author: 'enrich' }
				},
				value: -1
			});
		});

		it('reuses an existing rule with an identical member set instead of minting a duplicate', () => {
			const input = mkGrammar({
				accessibility_modifier: {
					type: CHOICE,
					members: [
						{ type: STRING, value: 'public' },
						{ type: STRING, value: 'private' },
						{ type: STRING, value: 'protected' }
					]
				},
				public_field_definition: {
					type: FIELD,
					name: 'modifier',
					content: {
						type: CHOICE,
						members: [
							{ type: STRING, value: 'public' },
							{ type: STRING, value: 'private' },
							{ type: STRING, value: 'protected' }
						]
					}
				}
			});
			const out = runEnrich(input);
			const field = out.grammar.rules.public_field_definition as { type: 'FIELD'; content: Rule };
			// Reuses the pre-existing VISIBLE rule directly -- no new
			// `_public_field_definition_modifier` (or similarly prefixed)
			// duplicate gets minted alongside it.
			// Full `sym()` output, not a partial match: `inline` must be stamped
			// too (see `tryExtractFieldEnum`'s doc comment) — a partial-object
			// assertion here would silently accept a symbol ref missing it.
			expect(field.content).toEqual({
				type: 'SYMBOL',
				name: 'accessibility_modifier',
				hidden: false,
				inline: false
			});
			expect(Object.keys(out.grammar.rules)).not.toContain('_public_field_definition_modifier');
		});
	});

	describe('visible-group naming', () => {
		it('names a visible group after its wrapping field when one exists at enrich time', () => {
			const input = mkGrammar({
				call: {
					type: FIELD,
					name: 'body',
					content: {
						type: OPTIONAL,
						content: {
							type: SEQ,
							members: [
								{ type: SYMBOL, name: 'a' },
								{ type: SYMBOL, name: 'b' }
							]
						}
					}
				},
				a: { type: STRING, value: 'a' },
				b: { type: STRING, value: 'b' }
			});
			const out = runEnrich(input);
			// Named after the field it fills (`_call_body`), not an opaque
			// `_call_group1` ordinal.
			expect(out.grammar.rules._call_body).toMatchObject({
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'a' },
					{ type: 'SYMBOL', name: 'b' }
				]
			});
			expect(out.grammar.rules._call_group1).toBeUndefined();
			expect(out.grammar.rules.call_group1).toBeUndefined();
			const field = out.grammar.rules.call as { type: 'FIELD'; content: Rule };
			expect(field.content).toMatchObject({
				type: 'OPTIONAL',
				content: {
					type: 'ALIAS',
					value: 'call_body',
					named: true,
					content: { type: 'SYMBOL', name: '_call_body' }
				}
			});
		});

		it('falls back to the ordinal name when the wrapping field name collides with an existing rule', () => {
			const input = mkGrammar({
				call: {
					type: FIELD,
					name: 'body',
					content: {
						type: OPTIONAL,
						content: {
							type: SEQ,
							members: [
								{ type: SYMBOL, name: 'a' },
								{ type: SYMBOL, name: 'b' }
							]
						}
					}
				},
				// Collides with the field-derived name `call_body`.
				call_body: { type: STRING, value: 'unrelated' },
				a: { type: STRING, value: 'a' },
				b: { type: STRING, value: 'b' }
			});
			const out = runEnrich(input);
			expect(out.grammar.rules._call_group).toMatchObject({
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'a' },
					{ type: 'SYMBOL', name: 'b' }
				]
			});
			// The pre-existing colliding rule is untouched.
			expect(out.grammar.rules.call_body).toMatchObject({ type: 'STRING', value: 'unrelated' });
		});

		it('names a visible group after its wrapping field for optional(choice(...)) content, not just optional(seq(...))', () => {
			// `optional(seq(...))` is peeled to the seq body before the mint path
			// below ever runs (a separate branch above this one) — this covers the
			// sibling case: a non-seq (CHOICE) body directly inside the field's
			// optional, which reaches mintStructuredChoiceArm via the "optional
			// position with a non-seq body" path and must carry the same
			// enclosing-field name through. Both choice arms are symbol-bearing
			// (matching rust's real `attribute`: `optional(choice(seq('=', value),
			// arguments))`) so the choice has two real slots and isn't collapsed
			// to a single inline-safe slot before reaching the outer arm mint.
			const input = mkGrammar({
				call: {
					type: FIELD,
					name: 'body',
					content: {
						type: OPTIONAL,
						content: {
							type: CHOICE,
							members: [
								{
									type: SEQ,
									members: [
										{ type: STRING, value: '=' },
										{ type: SYMBOL, name: 'value' }
									]
								},
								{ type: SYMBOL, name: 'arguments' }
							]
						}
					}
				},
				value: { type: STRING, value: 'v' },
				arguments: { type: STRING, value: 'args' }
			});
			const out = runEnrich(input);
			expect(out.grammar.rules._call_body).toBeDefined();
			expect(out.grammar.rules._call_group1).toBeUndefined();
			expect(out.grammar.rules.call_group1).toBeUndefined();
		});

		it('falls back to the ordinal when a DIFFERENT group body already claimed the field-derived name', () => {
			// Two distinct choice arms under the same parent each wrap a
			// STRUCTURALLY DIFFERENT optional(seq(...)) in field('body', ...) —
			// both compute the same candidate name `call_body`. The first claims
			// it; `rulesBag` alone can't see that (a synthesized hidden name only
			// ever lands in `clauseGroupRules`), so without checking
			// `clauseGroupRules` too, the second silently overwrites the first
			// arm's body instead of falling back to an ordinal.
			const input = mkGrammar({
				call: {
					type: CHOICE,
					members: [
						{
							type: SEQ,
							members: [
								{ type: STRING, value: 'k1' },
								{
									type: FIELD,
									name: 'body',
									content: {
										type: OPTIONAL,
										content: {
											type: SEQ,
											members: [
												{ type: SYMBOL, name: 'a' },
												{ type: SYMBOL, name: 'b' }
											]
										}
									}
								}
							]
						},
						{
							type: SEQ,
							members: [
								{ type: STRING, value: 'k2' },
								{
									type: FIELD,
									name: 'body',
									content: {
										type: OPTIONAL,
										content: {
											type: SEQ,
											members: [
												{ type: SYMBOL, name: 'c' },
												{ type: SYMBOL, name: 'd' }
											]
										}
									}
								}
							]
						}
					]
				},
				a: { type: STRING, value: 'a' },
				b: { type: STRING, value: 'b' },
				c: { type: STRING, value: 'c' },
				d: { type: STRING, value: 'd' }
			});
			const out = runEnrich(input);
			// The first arm's body claims `_call_body` and keeps its own content.
			expect(out.grammar.rules._call_body).toMatchObject({
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'a' },
					{ type: 'SYMBOL', name: 'b' }
				]
			});
			// The second arm falls back to an ordinal instead of overwriting it.
			expect(out.grammar.rules._call_group).toMatchObject({
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'c' },
					{ type: 'SYMBOL', name: 'd' }
				]
			});
		});

		it('does not dedupe identical content registered under different ambient precedence', () => {
			// `rule_a`'s hoisted body sits under an enclosing PREC_LEFT wrapper;
			// `rule_b`'s body is byte-for-byte identical but has no such wrapper.
			// Deduping by the BARE content (ignoring the registered body's own
			// ambientPrec) would make whichever rule enriches first silently
			// donate — or withhold — its precedence to the other, since the
			// dedupe-hit path reuses the first-registered hidden rule's body
			// wholesale. The key must be computed on the REGISTERED body
			// (content + ambientPrec), not the bare content, so these two stay
			// distinct hidden rules.
			const sharedBody = {
				type: OPTIONAL,
				content: {
					type: SEQ,
					members: [
						{ type: SYMBOL, name: 'a' },
						{ type: SYMBOL, name: 'b' }
					]
				}
			};
			const input = mkGrammar({
				rule_a: {
					type: 'PREC_LEFT',
					value: -2,
					content: { type: FIELD, name: 'body', content: sharedBody }
				} as unknown as Rule<'evaluate'>,
				rule_b: {
					type: FIELD,
					name: 'body',
					content: sharedBody
				},
				a: { type: STRING, value: 'a' },
				b: { type: STRING, value: 'b' }
			});
			const out = runEnrich(input);
			expect(out.grammar.rules._rule_a_body).toMatchObject({
				type: 'PREC_LEFT',
				value: -2,
				content: {
					type: 'SEQ',
					members: [
						{ type: 'SYMBOL', name: 'a' },
						{ type: 'SYMBOL', name: 'b' }
					]
				}
			});
			expect(out.grammar.rules._rule_b_body).toMatchObject({
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'a' },
					{ type: 'SYMBOL', name: 'b' }
				]
			});
		});

		it('does NOT use a field name from a seq/choice member position (only the direct enclosing field)', () => {
			const input = mkGrammar({
				// `field('items', ...)` wraps a SEQ; the optional(seq(...)) inside
				// one of that seq's OWN members is a distinct position, not "the
				// field's content" as a whole, so it must fall back to `_group1`.
				call: {
					type: FIELD,
					name: 'items',
					content: {
						type: SEQ,
						members: [
							{ type: SYMBOL, name: 'head' },
							{
								type: OPTIONAL,
								content: {
									type: SEQ,
									members: [
										{ type: SYMBOL, name: 'a' },
										{ type: SYMBOL, name: 'b' }
									]
								}
							}
						]
					}
				},
				head: { type: STRING, value: 'head' },
				a: { type: STRING, value: 'a' },
				b: { type: STRING, value: 'b' }
			});
			const out = runEnrich(input);
			expect(out.grammar.rules._call_group).toMatchObject({
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'a' },
					{ type: 'SYMBOL', name: 'b' }
				]
			});
			expect(out.grammar.rules._call_items).toBeUndefined();
		});
	});
});
