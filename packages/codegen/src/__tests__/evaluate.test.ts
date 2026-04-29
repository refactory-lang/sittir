import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	seq,
	choice,
	optional,
	repeat,
	repeat1,
	field,
	token,
	prec,
	normalize,
	createProxy,
	evaluate
} from '../compiler/evaluate.ts';
import { transform, insert, replace } from '../dsl/transform/transform.ts';
import type { SymbolRef } from '../compiler/rule.ts';
import {
	expectCompleteCatalog,
	serializeCatalog,
	walkRule
} from './helpers/rule-catalog.ts';

// Install sittir's lowercase DSL primitives as globals so transform()'s
// native-dsl delegation paths can reach them when this test imports
// transform directly (bypassing evaluate.ts's runtime injection).
const g = globalThis as Record<string, unknown>;
const savedGlobals: Record<string, unknown> = {};
beforeAll(() => {
	const fns = { seq, choice, optional, repeat, repeat1, field, token, prec };
	for (const [k, v] of Object.entries(fns)) {
		savedGlobals[k] = g[k];
		g[k] = v;
	}
});
afterAll(() => {
	for (const [k, v] of Object.entries(savedGlobals)) {
		if (v === undefined) delete g[k];
		else g[k] = v;
	}
});

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixture = (name: string) => resolve(__dirname, 'fixtures', name);

describe('Evaluate — DSL functions', () => {
	describe('normalize', () => {
		it('converts a string to a StringRule', () => {
			const rule = normalize('hello');
			expect(rule).toEqual({ type: 'string', value: 'hello' });
		});

		it('converts a RegExp to a PatternRule', () => {
			const rule = normalize(/[a-z]+/);
			expect(rule).toEqual({ type: 'pattern', value: '[a-z]+' });
		});

		it('passes through an existing Rule object', () => {
			const existing = { type: 'string' as const, value: 'x' };
			expect(normalize(existing)).toBe(existing);
		});

		it('throws on undefined', () => {
			expect(() => normalize(undefined as any)).toThrow();
		});
	});

	describe('seq', () => {
		it('produces a SeqRule with normalized members', () => {
			const rule = seq('a', 'b', 'c');
			expect(rule).toEqual({
				type: 'seq',
				members: [
					{ type: 'string', value: 'a' },
					{ type: 'string', value: 'b' },
					{ type: 'string', value: 'c' }
				]
			});
		});
	});

	describe('choice', () => {
		it('produces a ChoiceRule with mixed members', () => {
			const sym = { type: 'symbol' as const, name: 'x' };
			const rule = choice(sym, 'b');
			expect(rule).toEqual({
				type: 'choice',
				members: [
					{ type: 'symbol', name: 'x' },
					{ type: 'string', value: 'b' }
				]
			});
		});

		it('detects all-string choice as EnumRule', () => {
			const rule = choice('pub', 'crate', 'super');
			expect(rule).toEqual({
				type: 'enum',
				members: [
					{ type: 'string', value: 'pub' },
					{ type: 'string', value: 'crate' },
					{ type: 'string', value: 'super' }
				],
				source: 'grammar'
			});
		});

		it('does not produce enum when mixed with non-strings', () => {
			const sym = { type: 'symbol' as const, name: 'x' };
			const rule = choice('a', sym);
			expect(rule.type).toBe('choice');
		});
	});

	describe('optional', () => {
		it('produces an OptionalRule with normalized content', () => {
			const rule = optional('x');
			expect(rule).toEqual({
				type: 'optional',
				content: { type: 'string', value: 'x' }
			});
		});
	});

	describe('repeat', () => {
		it('produces a RepeatRule with normalized content', () => {
			const rule = repeat('x');
			expect(rule).toEqual({
				type: 'repeat',
				content: { type: 'string', value: 'x' }
			});
		});

		it('detects leading separator in seq(STRING, x)', () => {
			const sym = { type: 'symbol' as const, name: 'item' };
			const rule = repeat(seq(',', sym));
			expect(rule).toEqual({
				type: 'repeat',
				content: expect.objectContaining({ type: 'symbol', name: 'item' }),
				separator: ','
			});
		});

		it('detects trailing separator in seq(x, STRING)', () => {
			const sym = { type: 'symbol' as const, name: 'item' };
			const rule = repeat(seq(sym, ';'));
			expect(rule).toEqual({
				type: 'repeat',
				content: expect.objectContaining({ type: 'symbol', name: 'item' }),
				separator: ';',
				trailing: true
			});
		});
	});

	describe('repeat1', () => {
		it('produces a Repeat1Rule with normalized content', () => {
			const rule = repeat1('x');
			expect(rule).toEqual({
				type: 'repeat1',
				content: { type: 'string', value: 'x' }
			});
		});
	});

	describe('field', () => {
		it('produces a FieldRule with name and normalized content', () => {
			const rule = field('body', 'x');
			expect(rule).toEqual({
				type: 'field',
				name: 'body',
				content: { type: 'string', value: 'x' }
			});
		});
	});

	describe('token', () => {
		it('produces a TokenRule with immediate=false', () => {
			const rule = token('x');
			expect(rule).toEqual({
				type: 'token',
				content: { type: 'string', value: 'x' },
				immediate: false
			});
		});

		it('token.immediate produces a TokenRule with immediate=true', () => {
			const rule = token.immediate('x');
			expect(rule).toEqual({
				type: 'token',
				content: { type: 'string', value: 'x' },
				immediate: true
			});
		});
	});

	describe('createProxy — $ reference tracking', () => {
		it('returns a SymbolRule when a property is accessed', () => {
			const refs: SymbolRef[] = [];
			const $ = createProxy('source_rule', refs);
			const sym = $.block;
			expect(sym).toEqual(
				expect.objectContaining({
					type: 'symbol',
					name: 'block'
				})
			);
		});

		it('marks hidden symbols (underscore-prefixed)', () => {
			const refs: SymbolRef[] = [];
			const $ = createProxy('source_rule', refs);
			const sym = $._expression;
			expect(sym).toEqual(
				expect.objectContaining({
					type: 'symbol',
					name: '_expression',
					hidden: true
				})
			);
		});

		it('records a SymbolRef for each property access', () => {
			const refs: SymbolRef[] = [];
			const $ = createProxy('function_item', refs);
			void $.block;
			void $.parameters;
			expect(refs).toHaveLength(2);
			expect(refs[0]).toEqual({
				refType: 'symbol',
				from: 'function_item',
				to: 'block'
			});
			expect(refs[1]).toEqual({
				refType: 'symbol',
				from: 'function_item',
				to: 'parameters'
			});
		});

		it('enriches ref with fieldName when used inside field()', () => {
			const refs: SymbolRef[] = [];
			const $ = createProxy('function_item', refs);
			field('body', $.block);
			expect(refs[0]!.fieldName).toBe('body');
		});

		it('enriches ref with optional when used inside optional()', () => {
			const refs: SymbolRef[] = [];
			const $ = createProxy('function_item', refs);
			optional($.block!);
			expect(refs[0]!.optional).toBe(true);
		});

		it('enriches ref with repeated when used inside repeat()', () => {
			const refs: SymbolRef[] = [];
			const $ = createProxy('function_item', refs);
			repeat($.block!);
			expect(refs[0]!.repeated).toBe(true);
		});
	});

	describe('transform — sub-rule modification', () => {
		// transform() uses RAW positions: patches target members by their
		// literal index in the seq, including anonymous-string delimiters
		// and already-labeled field wrappers. The whole point is that the
		// author can add a name to ANY position — named or unnamed.
		const original: any = {
			type: 'seq',
			members: [
				{ type: 'string', value: '{' },
				{ type: 'symbol', name: 'block' },
				{ type: 'symbol', name: 'params' },
				{ type: 'string', value: '}' }
			]
		};

		it('wraps a positional member with a field via numeric index', () => {
			const result = transform(original, {
				1: field('body', { type: 'symbol', name: 'block' })
			});
			expect(result.type).toBe('seq');
			expect((result as any).members[1]).toEqual({
				type: 'field',
				name: 'body',
				content: { type: 'symbol', name: 'block' },
				source: 'override'
			});
		});

		it('preserves members not targeted by patches', () => {
			const result = transform(original, {
				1: field('body', { type: 'symbol', name: 'block' })
			});
			expect((result as any).members[0]).toEqual({
				type: 'string',
				value: '{'
			});
			expect((result as any).members[2]).toEqual({
				type: 'symbol',
				name: 'params'
			});
			expect((result as any).members[3]).toEqual({
				type: 'string',
				value: '}'
			});
		});

		it('marks transformed fields with source override', () => {
			const result = transform(original, {
				1: field('body', { type: 'symbol', name: 'block' })
			});
			expect((result as any).members[1].source).toBe('override');
		});

		it('supports multiple patches in one call', () => {
			const result = transform(original, {
				1: field('body', { type: 'symbol', name: 'block' }),
				2: field('parameters', { type: 'symbol', name: 'params' })
			});
			expect((result as any).members[1].name).toBe('body');
			expect((result as any).members[2].name).toBe('parameters');
		});
	});

	describe('insert — wraps position preserving content', () => {
		const original: any = {
			type: 'seq',
			members: [
				{ type: 'string', value: 'fn' },
				{ type: 'symbol', name: 'block' }
			]
		};

		it('wraps a member at a position with a field using the original content', () => {
			const result = insert(original, 1, (content: any) =>
				field('body', content)
			);
			expect((result as any).members[1]).toEqual({
				type: 'field',
				name: 'body',
				content: { type: 'symbol', name: 'block' },
				source: 'override'
			});
		});
	});

	describe('replace — substitutes at position', () => {
		const original: any = {
			type: 'seq',
			members: [
				{ type: 'string', value: 'fn' },
				{ type: 'symbol', name: 'block' },
				{ type: 'string', value: ';' }
			]
		};

		it('replaces content at a position', () => {
			const result = replace(original, 2, {
				type: 'string',
				value: '.'
			} as any);
			expect((result as any).members[2]).toEqual({
				type: 'string',
				value: '.'
			});
		});

		it('suppresses a position when replacement is null', () => {
			const result = replace(original, 2, null);
			expect((result as any).members).toHaveLength(2);
			expect((result as any).members[0]).toEqual({
				type: 'string',
				value: 'fn'
			});
			expect((result as any).members[1]).toEqual({
				type: 'symbol',
				name: 'block'
			});
		});
	});

	describe('prec', () => {
		it('strips precedence and returns the content Rule', () => {
			const rule = prec(1, 'x');
			expect(rule).toEqual({ type: 'string', value: 'x' });
		});

		it('prec.left strips precedence', () => {
			const rule = prec.left(1, 'x');
			expect(rule).toEqual({ type: 'string', value: 'x' });
		});

		it('prec.right strips precedence', () => {
			const rule = prec.right(1, 'x');
			expect(rule).toEqual({ type: 'string', value: 'x' });
		});

		it('prec.dynamic strips precedence', () => {
			const rule = prec.dynamic(1, 'x');
			expect(rule).toEqual({ type: 'string', value: 'x' });
		});
	});
});

describe('Evaluate — edge cases', () => {
	describe('T008a — transform out of bounds', () => {
		it('throws on out-of-bounds positions (matches path-mode strictness)', () => {
			// Post-review fix: flat mode used to silently skip OOB,
			// which was a footgun when path mode throws. Now both
			// modes throw so typos surface immediately.
			const original: any = {
				type: 'seq',
				members: [
					{ type: 'string', value: 'a' },
					{ type: 'string', value: 'b' }
				]
			};
			expect(() => transform(original, { 99: field('x', 'y') })).toThrow(
				/index 99 out of bounds/
			);
		});

		it('throws on non-numeric flat keys', () => {
			const original: any = {
				type: 'seq',
				members: [{ type: 'string', value: 'a' }]
			};
			// After kind-match was added to parsePath, keys that aren't
			// pure integers route through the path parser, which catches
			// the malformed segment with its own error message.
			expect(() => transform(original, { '1a': field('x', 'y') })).toThrow(
				/invalid segment '1a'/
			);
		});
	});

	describe('T008b — conflicting transforms at same position', () => {
		it('last patch wins when same position is specified twice', () => {
			const original: any = {
				type: 'seq',
				members: [
					{ type: 'symbol', name: 'a' },
					{ type: 'symbol', name: 'b' }
				]
			};
			// JS object keys: later entries overwrite earlier for same key
			const result = transform(original, {
				1: field('first', { type: 'symbol', name: 'b' })
				// @ts-ignore — intentional duplicate key test via Object.entries ordering
			});
			expect((result as any).members[1].name).toBe('first');
		});
	});

	describe('T009a — malformed grammar.js', () => {
		it('throws for a non-existent grammar file', async () => {
			await expect(evaluate('/nonexistent/grammar.js')).rejects.toThrow();
		});
	});

	describe('T010a — grammar with zero visible rules', () => {
		it('evaluates successfully (classification happens at Assemble)', async () => {
			const raw = await evaluate(fixture('hidden-only-grammar.js'));
			expect(raw.name).toBe('hidden_only');
			expect(Object.keys(raw.rules)).toContain('_expr');
		});
	});

	describe('T014a — insert/replace/suppress semantics', () => {
		const original: any = {
			type: 'seq',
			members: [
				{ type: 'string', value: 'fn' },
				{ type: 'symbol', name: 'body' },
				{ type: 'string', value: ';' }
			]
		};

		it('insert preserves original content inside the wrapper', () => {
			const result = insert(original, 1, (content: any) =>
				field('body', content)
			);
			expect((result as any).members[1].content).toEqual({
				type: 'symbol',
				name: 'body'
			});
		});

		it('replace substitutes content entirely', () => {
			const result = replace(original, 1, {
				type: 'symbol',
				name: 'new_body'
			} as any);
			expect((result as any).members[1]).toEqual({
				type: 'symbol',
				name: 'new_body'
			});
		});

		it('replace with null suppresses (removes the member)', () => {
			const result = replace(original, 2, null);
			expect((result as any).members).toHaveLength(2);
			expect((result as any).members.every((m: any) => m.value !== ';')).toBe(
				true
			);
		});
	});
});

describe('Evaluate — evaluate()', () => {
	it('evaluates a grammar.js file and returns a RawGrammar', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		expect(raw.name).toBe('test');
		expect(Object.keys(raw.rules)).toContain('source_file');
		expect(Object.keys(raw.rules)).toContain('assignment');
		expect(Object.keys(raw.rules)).toContain('_expression');
	});

	it('captures the reference graph', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		expect(raw.references.length).toBeGreaterThan(0);
		const sourceFileRefs = raw.references.filter(
			(r) => r.from === 'source_file'
		);
		expect(sourceFileRefs).toEqual([
			expect.objectContaining({
				from: 'source_file',
				to: 'statement',
				repeated: true
			})
		]);
	});

	it('populates grammar metadata', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		expect(raw.extras).toEqual([]);
		expect(raw.externals).toEqual([]);
		expect(raw.supertypes).toEqual([]);
		expect(raw.conflicts).toEqual([]);
		expect(raw.word).toBeNull();
	});

	it('detects enum from choice of strings', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		// binary_expression has field('operator', choice('+', '-', '*', '/'))
		const binExpr = raw.rules['binary_expression'];
		expect(binExpr!.type).toBe('seq');
		const operatorField = (binExpr as any).members.find(
			(m: any) => m.type === 'field' && m.name === 'operator'
		);
		expect(operatorField.content).toEqual(
			expect.objectContaining({
				type: 'enum',
				members: [
					expect.objectContaining({ type: 'string', value: '+' }),
					expect.objectContaining({ type: 'string', value: '-' }),
					expect.objectContaining({ type: 'string', value: '*' }),
					expect.objectContaining({ type: 'string', value: '/' })
				],
				source: 'grammar'
			})
		);
	});

	it('preserves pattern rules for terminals', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		expect(raw.rules['identifier']).toEqual(
			expect.objectContaining({
				type: 'pattern',
				value: '[a-z_]\\w*'
			})
		);
		expect(raw.rules['number']).toEqual(
			expect.objectContaining({ type: 'pattern', value: '\\d+' })
		);
	});

	it('captures field names in reference graph', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		const assignRefs = raw.references.filter((r) => r.from === 'assignment');
		expect(assignRefs).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ to: 'identifier', fieldName: 'name' }),
				expect.objectContaining({ to: '_expression', fieldName: 'value' })
			])
		);
	});

	it('synthesizes hidden sources for named aliases to bare symbol targets when the target kind is undeclared', async () => {
		const dir = mkdtempSync(resolve(tmpdir(), 'sittir-evaluate-'));
		const entry = resolve(dir, 'grammar.js');
		writeFileSync(
			entry,
			`module.exports = grammar({
  name: "alias-target-synthesis",
  rules: {
    source_file: ($) => $.container,
    object_type: ($) => seq("{", optional($.identifier), "}"),
    container: ($) => alias($.object_type, $.interface_body),
    identifier: ($) => /[a-z_]+/,
  },
});\n`,
			'utf8'
		);
		try {
			const raw = await evaluate(entry);
			expect(raw.rules['_interface_body']).toEqual(
				expect.objectContaining({ type: 'symbol', name: 'object_type' })
			);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('assigns inline IDs and catalog entries to every evaluated occurrence', async () => {
		const raw = await evaluate(fixture('rule-identity-grammar.js'));

		expectCompleteCatalog(raw.rules, raw.ruleCatalog);
	});

	it('uses positional IDs for identical subtrees in different branches', async () => {
		const raw = await evaluate(fixture('rule-identity-grammar.js'));
		const container = raw.rules['container']!;
		const symbolIds: string[] = [];
		walkRule(container, (rule) => {
			if (rule.type === 'symbol' && rule.name === 'identifier') {
				symbolIds.push(rule.id!);
			}
		});

		expect(symbolIds.length).toBeGreaterThanOrEqual(2);
		expect(new Set(symbolIds).size).toBe(symbolIds.length);
	});

	it('keeps catalog serialization deterministic for unchanged input', async () => {
		const first = await evaluate(fixture('rule-identity-grammar.js'));
		const second = await evaluate(fixture('rule-identity-grammar.js'));

		expect(serializeCatalog(second.ruleCatalog)).toEqual(
			serializeCatalog(first.ruleCatalog)
		);
	});

	it('records grammar, override, and evaluate-synthesized provenance roots', async () => {
		const base = await evaluate(fixture('rule-identity-grammar.js'));
		const override = await evaluate(fixture('rule-identity-override.js'));
		const baseContainer = base.ruleCatalog.byId.get(
			base.ruleCatalog.rootsByKind.get('container')!
		)!;
		const overrideContainer = override.ruleCatalog.byId.get(
			override.ruleCatalog.rootsByKind.get('container')!
		)!;
		const overrideOnly = override.ruleCatalog.byId.get(
			override.ruleCatalog.rootsByKind.get('override_only')!
		)!;
		const synthesized = base.ruleCatalog.byId.get(
			base.ruleCatalog.rootsByKind.get('_named_identifier')!
		)!;

		expect(baseContainer.provenance).toBe('grammar-authored');
		expect(overrideContainer.provenance).toBe('override-authored-or-replaced');
		expect(overrideOnly.provenance).toBe('override-authored-or-replaced');
		expect(synthesized.provenance).toBe('evaluate-synthesized');
	});

	it('anchors symbol references to the originating rule ID', async () => {
		const raw = await evaluate(fixture('rule-identity-grammar.js'));
		const refs = raw.references.filter((ref) => ref.from === 'container');

		expect(refs.length).toBeGreaterThan(0);
		expect(refs.every((ref) => ref.fromRuleId)).toBe(true);
		expect(new Set(refs.map((ref) => ref.fromRuleId))).toEqual(
			new Set([raw.ruleCatalog.rootsByKind.get('container')])
		);
	});

	it('classifies fields, aliases, leaves, references, tokens, and wrappers', async () => {
		const raw = await evaluate(fixture('rule-identity-grammar.js'));
		const classifications = raw.ruleCatalog.classificationById;
		const byRuleType = new Map<string, string[]>();
		for (const entry of raw.ruleCatalog.byId.values()) {
			const list = byRuleType.get(entry.ruleType) ?? [];
			list.push(entry.id);
			byRuleType.set(entry.ruleType, list);
		}

		expect(classifications.get(byRuleType.get('symbol')![0]!)!.kind).toBe(
			'nonterminal'
		);
		expect(classifications.get(byRuleType.get('pattern')![0]!)!.kind).toBe(
			'terminal'
		);
		expect(classifications.get(byRuleType.get('token')![0]!)!.kind).toBe(
			'terminal'
		);
		expect(classifications.get(byRuleType.get('field')![0]!)!.kind).toBe(
			'nonterminal'
		);
	});

	it('forces only the immediately wrapped field and named-alias content', async () => {
		const raw = await evaluate(fixture('rule-identity-grammar.js'));
		const forced = [...raw.ruleCatalog.classificationById.values()].filter(
			(c) => c.forcedBy === 'field' || c.forcedBy === 'named-alias'
		);

		expect(
			forced.some((c) => c.forcedBy === 'field' && c.edgeName === 'name')
		).toBe(true);
		expect(forced.some((c) => c.forcedBy === 'named-alias')).toBe(true);
		for (const classification of forced) {
			const entry = raw.ruleCatalog.byId.get(classification.ruleId)!;
			for (const childId of entry.childIds) {
				expect(
					raw.ruleCatalog.classificationById.get(childId)!.forcedBy
				).not.toBe(classification.forcedBy);
			}
		}
	});

	it('aggregates wrapper classification from descendants', async () => {
		const raw = await evaluate(fixture('rule-identity-grammar.js'));
		const entries = [...raw.ruleCatalog.byId.values()];
		const choiceEntries = entries.filter(
			(entry) => entry.ruleType === 'choice'
		);
		const repeatEntry = entries.find((entry) => entry.ruleType === 'repeat1')!;

		expect(
			choiceEntries.some(
				(entry) =>
					raw.ruleCatalog.classificationById.get(entry.id)!.kind ===
					'nonterminal'
			)
		).toBe(true);
		expect(raw.ruleCatalog.classificationById.get(repeatEntry.id)!.kind).toBe(
			'nonterminal'
		);
	});
});
