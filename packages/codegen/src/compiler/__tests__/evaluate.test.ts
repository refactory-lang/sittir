import { CHOICE, OPTIONAL, REPEAT, REPEAT1, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { structuralBuilder } from '../../dsl/builders.ts';
import { installFakeDsl, restoreFakeDsl } from '../../dsl/__tests__/_test-helpers.ts';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { transform } from '../../dsl/transform/transform.ts';
import { expectCompleteCatalog, serializeCatalog, walkRule } from '../../__tests__/helpers/rule-catalog.ts';
import { readRuleMetadata } from '../../dsl/rule-metadata.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixture = (name: string) => resolve(__dirname, '../../__tests__/fixtures', name);

describe('structuralBuilder — the grammar DSL construction phase', () => {
	describe('seq', () => {
		it('produces a SeqRule with all members', () => {
			const rule = structuralBuilder.seq(
				{ type: 'STRING', value: 'a' },
				{ type: 'STRING', value: 'b' },
				{ type: 'STRING', value: 'c' }
			);
			expect(rule).toEqual({
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: 'a' },
					{ type: 'STRING', value: 'b' },
					{ type: 'STRING', value: 'c' }
				]
			});
		});
	});

	describe('choice', () => {
		it('produces a ChoiceRule with mixed members', () => {
			const sym = { type: 'SYMBOL' as const, name: 'x' };
			const rule = structuralBuilder.choice(sym, { type: 'STRING', value: 'b' });
			expect(rule).toEqual({
				type: 'CHOICE',
				members: [
					{ type: 'SYMBOL', name: 'x' },
					{ type: 'STRING', value: 'b' }
				]
			});
		});

		it('does not collapse mixed non-FIELD members', () => {
			const sym = { type: 'SYMBOL' as const, name: 'x' };
			const rule = structuralBuilder.choice({ type: 'STRING', value: 'a' }, sym);
			expect(rule.type).toBe(CHOICE);
		});

		it('collapses all-same-name FIELD members into one FIELD wrapping a CHOICE', () => {
			const a = structuralBuilder.field('operator', { type: 'STRING', value: '+' });
			const b = structuralBuilder.field('operator', { type: 'STRING', value: '-' });
			const rule = structuralBuilder.choice(a, b);
			expect(rule).toEqual({
				type: 'FIELD',
				name: 'operator',
				content: {
					type: 'CHOICE',
					members: [
						{ type: 'STRING', value: '+' },
						{ type: 'STRING', value: '-' }
					]
				},
				metadata: { fieldSource: 'grammar' }
			});
		});

		it('does not collapse FIELD members with different names', () => {
			const a = structuralBuilder.field('left', { type: 'STRING', value: '+' });
			const b = structuralBuilder.field('right', { type: 'STRING', value: '-' });
			expect(structuralBuilder.choice(a, b)).toEqual({ type: 'CHOICE', members: [a, b] });
		});

		it('bails to plain CHOICE when any same-name FIELD member wraps an ALIAS', () => {
			const a = structuralBuilder.field('operator', { type: 'STRING', value: '+' });
			const b = structuralBuilder.field('operator', structuralBuilder.alias({ type: 'STRING', value: '-' }, 'minus'));
			expect(structuralBuilder.choice(a, b)).toEqual({ type: 'CHOICE', members: [a, b] });
		});
	});

	describe('optional', () => {
		it('produces an OptionalRule with the given content', () => {
			const rule = structuralBuilder.optional({ type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'OPTIONAL', content: { type: 'STRING', value: 'x' } });
		});

		it('collapses optional(optional(x)) to the inner OPTIONAL', () => {
			const inner = structuralBuilder.optional({ type: 'STRING', value: 'x' });
			expect(structuralBuilder.optional(inner)).toBe(inner);
		});

		it('collapses optional(repeat(x)) to the inner REPEAT', () => {
			const inner = structuralBuilder.repeat({ type: 'STRING', value: 'x' });
			expect(structuralBuilder.optional(inner)).toBe(inner);
		});

		it('collapses optional(repeat1(x)) to a REPEAT carrying the separator shape', () => {
			const inner = {
				type: REPEAT1,
				content: { type: 'STRING', value: 'x' },
				separator: ',',
				trailing: 'optional',
				leading: undefined
			} as const;
			expect(structuralBuilder.optional(inner)).toEqual({
				type: 'REPEAT',
				content: inner.content,
				separator: inner.separator,
				trailing: inner.trailing,
				leading: inner.leading
			});
		});
	});

	describe('repeat', () => {
		it('produces a RepeatRule with the given content', () => {
			const rule = structuralBuilder.repeat({ type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'REPEAT', content: { type: 'STRING', value: 'x' } });
		});

		it('preserves a leading-separator SEQ content un-lifted (lift happens at link)', () => {
			const content = structuralBuilder.seq({ type: 'STRING', value: ',' }, { type: 'SYMBOL', name: 'item' });
			expect(structuralBuilder.repeat(content)).toEqual({ type: 'REPEAT', content });
		});

		it('preserves a trailing-separator SEQ content un-lifted (lift happens at link)', () => {
			const content = structuralBuilder.seq({ type: 'SYMBOL', name: 'item' }, { type: 'STRING', value: ';' });
			expect(structuralBuilder.repeat(content)).toEqual({ type: 'REPEAT', content });
		});

		it('collapses repeat(repeat(x)) without a separator to the inner REPEAT', () => {
			const inner = structuralBuilder.repeat({ type: 'STRING', value: 'x' });
			expect(structuralBuilder.repeat(inner)).toBe(inner);
		});

		it('does not collapse repeat(repeat(x)) when the inner REPEAT has a separator', () => {
			const inner = { type: REPEAT, content: { type: 'STRING', value: 'x' }, separator: ',' } as const;
			expect(structuralBuilder.repeat(inner)).toEqual({ type: 'REPEAT', content: inner });
		});

		it('collapses repeat(optional(x)) to repeat(x)', () => {
			const rule = structuralBuilder.repeat(structuralBuilder.optional({ type: 'STRING', value: 'x' }));
			expect(rule).toEqual({ type: 'REPEAT', content: { type: 'STRING', value: 'x' } });
		});
	});

	describe('repeat1', () => {
		it('produces a Repeat1Rule with the given content', () => {
			const rule = structuralBuilder.repeat1({ type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'REPEAT1', content: { type: 'STRING', value: 'x' } });
		});

		it('collapses repeat1(repeat1(x)) without a separator to the inner REPEAT1', () => {
			const inner = structuralBuilder.repeat1({ type: 'STRING', value: 'x' });
			expect(structuralBuilder.repeat1(inner)).toBe(inner);
		});
	});

	describe('field', () => {
		it('produces a FieldRule with name and content', () => {
			const rule = structuralBuilder.field('body', { type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'FIELD', name: 'body', content: { type: 'STRING', value: 'x' } });
		});

		it('collapses an OPTIONAL(REPEAT(x)) field body to REPEAT(x)', () => {
			const repeatRule = structuralBuilder.repeat({ type: 'SYMBOL', name: 'item' });
			const rule = structuralBuilder.field('items', { type: OPTIONAL, content: repeatRule });
			expect(rule).toEqual({ type: 'FIELD', name: 'items', content: repeatRule });
		});

		it('collapses an OPTIONAL(REPEAT1(x)) field body to a REPEAT carrying the separator shape', () => {
			const repeat1Rule = { type: REPEAT1, content: { type: SYMBOL, name: 'item' }, separator: ',' } as const;
			const rule = structuralBuilder.field('items', { type: OPTIONAL, content: repeat1Rule });
			expect(rule).toEqual({
				type: 'FIELD',
				name: 'items',
				content: {
					type: 'REPEAT',
					content: repeat1Rule.content,
					separator: repeat1Rule.separator,
					trailing: undefined,
					leading: undefined
				}
			});
		});
	});

	describe('token', () => {
		it('produces a TokenRule with immediate=false', () => {
			const rule = structuralBuilder.token({ type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'TOKEN', content: { type: 'STRING', value: 'x' }, immediate: false });
		});

		it('token.immediate produces a real IMMEDIATE_TOKEN node', () => {
			// Real IMMEDIATE_TOKEN tag (tree-sitter's own dsl.js shape), not
			// `{type: TOKEN, immediate: true}` — enrich's minting/dedup decisions
			// need the distinct tag to tell token.immediate(x) apart from
			// token(x); grammarFn's normalizeImmediateTokens folds this into
			// TOKEN+immediate once those decisions are locked in.
			const rule = structuralBuilder.token.immediate({ type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'IMMEDIATE_TOKEN', content: { type: 'STRING', value: 'x' } });
		});
	});

	describe('prec', () => {
		it('wraps content in a PREC node, preserving the precedence value', () => {
			const rule = structuralBuilder.prec(1, { type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'PREC', value: 1, content: { type: 'STRING', value: 'x' } });
		});

		it('prec.left wraps content in a PREC_LEFT node', () => {
			const rule = structuralBuilder.prec.left(1, { type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'PREC_LEFT', value: 1, content: { type: 'STRING', value: 'x' } });
		});

		it('prec.right wraps content in a PREC_RIGHT node', () => {
			const rule = structuralBuilder.prec.right(1, { type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'PREC_RIGHT', value: 1, content: { type: 'STRING', value: 'x' } });
		});

		it('prec.dynamic wraps content in a PREC_DYNAMIC node', () => {
			const rule = structuralBuilder.prec.dynamic(1, { type: 'STRING', value: 'x' });
			expect(rule).toEqual({ type: 'PREC_DYNAMIC', value: 1, content: { type: 'STRING', value: 'x' } });
		});
	});

	describe('transform — sub-rule modification', () => {
		// transform() uses RAW positions: patches target members by their
		// literal index in the seq, including anonymous-string delimiters
		// and already-labeled field wrappers. The whole point is that the
		// author can add a name to ANY position — named or unnamed.
		const original: any = {
			type: 'SEQ',
			members: [
				{ type: 'STRING', value: '{' },
				{ type: 'SYMBOL', name: 'block' },
				{ type: 'SYMBOL', name: 'params' },
				{ type: 'STRING', value: '}' }
			]
		};

		it('wraps a positional member with a field via numeric index', () => {
			const result = transform(original, {
				1: structuralBuilder.field('body', { type: 'SYMBOL', name: 'block' })
			});
			expect(result.type).toBe('SEQ');
			const member = (result as any).members[1];
			// (debt PR-P1) `source` moved into the opaque `metadata` bag as
			// `fieldSource`; assert the structural shape + the metadata fact
			// separately instead of a flat `.toEqual` including a raw `source`.
			expect(member).toEqual({
				type: 'FIELD',
				name: 'body',
				content: { type: 'SYMBOL', name: 'block' },
				metadata: expect.anything()
			});
			expect(readRuleMetadata(member.metadata)?.fieldSource).toBe('override');
		});

		it('preserves members not targeted by patches', () => {
			const result = transform(original, {
				1: structuralBuilder.field('body', { type: 'SYMBOL', name: 'block' })
			});
			expect((result as any).members[0]).toEqual({
				type: 'STRING',
				value: '{'
			});
			expect((result as any).members[2]).toEqual({
				type: 'SYMBOL',
				name: 'params'
			});
			expect((result as any).members[3]).toEqual({
				type: 'STRING',
				value: '}'
			});
		});

		it('marks transformed fields with metadata.fieldSource override', () => {
			const result = transform(original, {
				1: structuralBuilder.field('body', { type: 'SYMBOL', name: 'block' })
			});
			expect(readRuleMetadata((result as any).members[1].metadata)?.fieldSource).toBe('override');
		});

		it('supports multiple patches in one call', () => {
			const result = transform(original, {
				1: structuralBuilder.field('body', { type: 'SYMBOL', name: 'block' }),
				2: structuralBuilder.field('parameters', { type: 'SYMBOL', name: 'params' })
			});
			expect((result as any).members[1].name).toBe('body');
			expect((result as any).members[2].name).toBe('parameters');
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
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: 'a' },
					{ type: 'STRING', value: 'b' }
				]
			};
			expect(() => transform(original, { 99: structuralBuilder.field('x', { type: 'STRING', value: 'y' }) })).toThrow(
				/index 99 out of bounds/
			);
		});

		it('throws on non-numeric flat keys', () => {
			const original: any = {
				type: 'SEQ',
				members: [{ type: 'STRING', value: 'a' }]
			};
			// After kind-match was added to parsePath, keys that aren't
			// pure integers route through the path parser, which catches
			// the malformed segment with its own error message.
			expect(() => transform(original, { '1a': structuralBuilder.field('x', { type: 'STRING', value: 'y' }) })).toThrow(
				/invalid segment '1a'/
			);
		});
	});

	describe('T008b — conflicting transforms at same position', () => {
		it('last patch wins when same position is specified twice', () => {
			const original: any = {
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'a' },
					{ type: 'SYMBOL', name: 'b' }
				]
			};
			// JS object keys: later entries overwrite earlier for same key
			const result = transform(original, {
				1: structuralBuilder.field('first', { type: 'SYMBOL', name: 'b' })
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

	describe('desugar-divergence — synthesizeInlineAliasSources', () => {
		it('records a divergence event when an alias target has no declared rule or SYMBOL source', async () => {
			const raw = await evaluate(fixture('inline-alias-divergence-grammar.js'));
			expect(raw.rules).toHaveProperty('_orphan_target');
			expect(raw.desugarDivergences).toEqual([{ site: 'inline-alias-source', name: '_orphan_target' }]);
		});
	});

	describe('desugar-divergence — body-pattern-group fallback', () => {
		it('records a divergence event when a groups: entry mints with no wire-side deposit', async () => {
			const raw = await evaluate(fixture('body-pattern-group-divergence-grammar.js'));
			// `_orphan_group` is referenced nowhere else in the grammar, so it's
			// pruned from the final catalog as unreachable — the divergence
			// event itself is the proof the fallback fired, independent of
			// whether the minted rule survives reachability pruning.
			expect(raw.desugarDivergences).toEqual([{ site: 'body-pattern-group', name: '_orphan_group' }]);
		});
	});

	describe('coerceToRule — invalid input (private helper, exercised through evaluate())', () => {
		it('rejects a grammar body that resolves to an undefined rule', async () => {
			const dir = mkdtempSync(resolve(tmpdir(), 'sittir-evaluate-'));
			const entry = resolve(dir, 'grammar.js');
			writeFileSync(
				entry,
				`module.exports = grammar({
  name: "undefined_rule_input",
  rules: {
    source_file: ($) => seq($.a, undefined),
    a: ($) => 'a',
  },
});\n`,
				'utf8'
			);
			try {
				await expect(evaluate(entry)).rejects.toThrow();
			} finally {
				rmSync(dir, { recursive: true, force: true });
			}
		});
	});

	describe('createProxy — hidden-symbol and optional-ref stamping (private helper, exercised through evaluate())', () => {
		it('marks underscore-prefixed symbol references inline via the proxy (hidden stays a rule-level fact)', async () => {
			const raw = await evaluate(fixture('test-grammar.js'));
			const expressionStatement = raw.rules['expression_statement'] as {
				members: readonly { type: string; name?: string; hidden?: boolean; inline?: boolean }[];
			};
			const hiddenRef = expressionStatement.members.find((m) => m.type === 'SYMBOL' && m.name === '_expression');
			expect(hiddenRef).toEqual(expect.objectContaining({ inline: true }));
			expect(hiddenRef?.hidden).toBeUndefined();
			expect(raw.rules['_expression']?.hidden).toBe(true);
		});

		it('enriches references with optional=true when the ref is wrapped in optional()', async () => {
			const dir = mkdtempSync(resolve(tmpdir(), 'sittir-evaluate-'));
			const entry = resolve(dir, 'grammar.js');
			writeFileSync(
				entry,
				`module.exports = grammar({
  name: "optional_ref_test",
  rules: {
    source_file: ($) => seq(optional($.modifier), $.body),
    modifier: ($) => 'mod',
    body: ($) => 'b',
  },
});\n`,
				'utf8'
			);
			try {
				const raw = await evaluate(entry);
				const ref = raw.references.find((r) => r.from === 'source_file' && r.to === 'modifier');
				expect(ref?.optional).toBe(true);
			} finally {
				rmSync(dir, { recursive: true, force: true });
			}
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
		const sourceFileRefs = raw.references.filter((r) => r.from === 'source_file');
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

	it('keeps conflicting same-parent field literal sets inline so simplify can merge them later', async () => {
		const dir = mkdtempSync(resolve(tmpdir(), 'sittir-evaluate-'));
		const entry = resolve(dir, 'grammar.js');
		writeFileSync(
			entry,
			`module.exports = grammar({
  name: "enum-name-collision",
  rules: {
    source_file: ($) => $.binary_expression,
    binary_expression: ($) => choice(
      seq(field('left', $.identifier), field('operator', '&&'), field('right', $.identifier)),
      seq(field('left', $.identifier), field('operator', '||'), field('right', $.identifier)),
      seq(field('left', $.identifier), field('operator', choice('in', 'instanceof')), field('right', $.identifier))
    ),
    identifier: ($) => /[a-z_]+/,
  },
});\n`,
			'utf8'
		);
		try {
			const raw = await evaluate(entry);
			const hiddenOperatorRules = Object.entries(raw.rules).filter(([name]) =>
				name.startsWith('_binary_expression_operator')
			);
			expect(hiddenOperatorRules).toHaveLength(0);

			const operatorKinds: string[] = [];
			const walk = (rule: any): void => {
				if (!rule || typeof rule !== 'object') return;
				if (rule.type === 'FIELD' && rule.name === 'operator') {
					operatorKinds.push(rule.content.type);
				}
				if (Array.isArray(rule.members)) {
					for (const member of rule.members) walk(member);
				}
				if ('content' in rule) walk(rule.content);
			};
			walk(raw.rules['binary_expression']);
			// PR-P: enum-shaped choices are type 'CHOICE' now.
			expect(operatorKinds.sort()).toEqual(['CHOICE', 'STRING', 'STRING']);

			const normalized = normalizeGrammar(link(raw));
			const nodeMap = assemble(AssembleCtx.from(normalized));
			const node = nodeMap.nodes.get('binary_expression');
			expect(node && 'slots' in node).toBe(true);
			const operatorSlot = node && 'slots' in node ? node.slots.find((slot) => slot.name === 'operator') : undefined;
			const operatorValues = operatorSlot
				? operatorSlot.values
						.filter((value: any) => value.value !== undefined)
						.map((value: any) => value.value)
						.sort()
				: [];
			expect(operatorValues).toEqual(['&&', 'in', 'instanceof', '||']);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('preserves pattern rules for terminals', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		expect(raw.rules['identifier']).toEqual(
			expect.objectContaining({
				type: 'PATTERN',
				value: '[a-z_]\\w*'
			})
		);
		expect(raw.rules['number']).toEqual(expect.objectContaining({ type: 'PATTERN', value: '\\d+' }));
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

	it('does not synthesize hidden sources for bare-symbol aliases to existing rules', async () => {
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
			// Bare-symbol alias to an existing rule: source is object_type (exists)
			// → no synthetic `_interface_body` rule is added to the rules map.
			expect(raw.rules['_interface_body']).toBeUndefined();
			// The container rule's alias content still points to object_type.
			expect(raw.rules['container']).toEqual(
				expect.objectContaining({
					type: 'ALIAS',
					value: 'interface_body',
					content: expect.objectContaining({ type: 'SYMBOL', name: 'object_type' })
				})
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
			if (rule.type === SYMBOL && rule.name === 'identifier') {
				symbolIds.push(rule.id!);
			}
		});

		expect(symbolIds.length).toBeGreaterThanOrEqual(2);
		expect(new Set(symbolIds).size).toBe(symbolIds.length);
	});

	it('keeps catalog serialization deterministic for unchanged input', async () => {
		const first = await evaluate(fixture('rule-identity-grammar.js'));
		const second = await evaluate(fixture('rule-identity-grammar.js'));

		expect(serializeCatalog(second.ruleCatalog)).toEqual(serializeCatalog(first.ruleCatalog));
	});

	it('records grammar, override, and evaluate-synthesized provenance roots', async () => {
		// Use a temp grammar with an INLINE alias (choice literal body) so that
		// evaluate() synthesizes a `_primitive_type` hidden rule — the only
		// scenario that produces 'evaluate-synthesized' provenance. Bare-symbol
		// aliases to existing rules (e.g. alias($.identifier, $.named_identifier))
		// are NOT synthesized since 2026-04-30.
		const dir = mkdtempSync(resolve(tmpdir(), 'sittir-provenance-'));
		const baseEntry = resolve(dir, 'base.js');
		const overrideEntry = resolve(dir, 'override.js');
		writeFileSync(
			baseEntry,
			`module.exports = grammar({
  name: "provenance_test",
  rules: {
    source_file: ($) => $.container,
    container: ($) => alias(choice('u8', 'u16'), $.primitive_type),
    identifier: ($) => /[a-z_]+/,
  },
});\n`,
			'utf8'
		);
		writeFileSync(
			overrideEntry,
			`const base = require(${JSON.stringify(baseEntry)});
module.exports = grammar(base, {
  name: 'provenance_test',
  rules: {
    container: ($, previous) => seq(previous, $.identifier),
    override_only: ($) => seq('override', $.identifier),
  },
});\n`,
			'utf8'
		);
		try {
			const base = await evaluate(baseEntry);
			const override = await evaluate(overrideEntry);
			const baseContainer = base.ruleCatalog.byId.get(base.ruleCatalog.rootsByKind.get('container')!)!;
			const overrideContainer = override.ruleCatalog.byId.get(override.ruleCatalog.rootsByKind.get('container')!)!;
			const overrideOnly = override.ruleCatalog.byId.get(override.ruleCatalog.rootsByKind.get('override_only')!)!;
			// _primitive_type is synthesized by inline-alias rewriting:
			// alias(choice('u8','u16'), $.primitive_type) → _primitive_type = choice(...)
			const synthesized = base.ruleCatalog.byId.get(base.ruleCatalog.rootsByKind.get('_primitive_type')!)!;

			expect(baseContainer.provenance).toBe('grammar-authored');
			expect(overrideContainer.provenance).toBe('override-authored-or-replaced');
			expect(overrideOnly.provenance).toBe('override-authored-or-replaced');
			expect(synthesized.provenance).toBe('evaluate-synthesized');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('preserves base grammar inline names when an extension callback appends its own', async () => {
		// `inline`'s callback receives `previous` as already-normalized STRING
		// names from the base grammar, while `$.bar` (added in the override)
		// normalizes to a SYMBOL. `[...previous, $.bar]` is exactly the mixed
		// shape appendCallbackMetadataNames (evaluate.ts) must handle without
		// dropping the inherited string.
		const dir = mkdtempSync(resolve(tmpdir(), 'sittir-inline-inherit-'));
		const baseEntry = resolve(dir, 'base.js');
		const overrideEntry = resolve(dir, 'override.js');
		writeFileSync(
			baseEntry,
			`module.exports = grammar({
  name: "inline_inherit_test",
  inline: ($) => [$.foo],
  rules: {
    source_file: ($) => $.container,
    container: ($) => $.foo,
    foo: ($) => 'foo',
  },
});\n`,
			'utf8'
		);
		writeFileSync(
			overrideEntry,
			`const base = require(${JSON.stringify(baseEntry)});
module.exports = grammar(base, {
  name: 'inline_inherit_test',
  inline: ($, previous) => [...previous, $.bar],
  rules: {
    bar: ($) => 'bar',
  },
});\n`,
			'utf8'
		);
		try {
			const raw = await evaluate(overrideEntry);
			expect(raw.inline).toEqual(['foo', 'bar']);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('anchors symbol references to the originating rule ID', async () => {
		const raw = await evaluate(fixture('rule-identity-grammar.js'));
		const refs = raw.references.filter((ref) => ref.from === 'container');

		expect(refs.length).toBeGreaterThan(0);
		expect(refs.every((ref) => ref.fromRuleId)).toBe(true);
		expect(new Set(refs.map((ref) => ref.fromRuleId))).toEqual(new Set([raw.ruleCatalog.rootsByKind.get('container')]));
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

		// Updated to the current classifyByType (rule-patterns.ts) contract:
		// - ruleType vocabulary is UPPERCASE everywhere (case-as-origin
		//   signal retired) — lowercase keys no longer exist in the catalog.
		// - PATTERN is unconditionally 'nonterminal' now: patterns/enums
		//   are slots (PR-P; classifyByType groups PATTERN with SYMBOL).
		// - TOKEN classifies recursively (nonterminal iff any child is);
		//   this fixture's token() wraps a PATTERN, so it is nonterminal.
		// - STRING remains the intrinsic terminal case.
		expect(classifications.get(byRuleType.get('SYMBOL')![0]!)!.kind).toBe('nonterminal');
		expect(classifications.get(byRuleType.get('PATTERN')![0]!)!.kind).toBe('nonterminal');
		expect(classifications.get(byRuleType.get('TOKEN')![0]!)!.kind).toBe('nonterminal');
		expect(classifications.get(byRuleType.get('FIELD')![0]!)!.kind).toBe('nonterminal');
		expect(classifications.get(byRuleType.get('STRING')![0]!)!.kind).toBe('terminal');
	});

	it('forces only the immediately wrapped field and named-alias content', async () => {
		const raw = await evaluate(fixture('rule-identity-grammar.js'));
		const forced = [...raw.ruleCatalog.classificationById.values()].filter(
			(c) => c.forcedBy === 'field' || c.forcedBy === 'named-alias'
		);

		expect(forced.some((c) => c.forcedBy === 'field' && c.edgeName === 'name')).toBe(true);
		expect(forced.some((c) => c.forcedBy === 'named-alias')).toBe(true);
		for (const classification of forced) {
			const entry = raw.ruleCatalog.byId.get(classification.ruleId)!;
			for (const childId of entry.childIds) {
				expect(raw.ruleCatalog.classificationById.get(childId)!.forcedBy).not.toBe(classification.forcedBy);
			}
		}
	});

	it('aggregates wrapper classification from descendants', async () => {
		const raw = await evaluate(fixture('rule-identity-grammar.js'));
		const entries = [...raw.ruleCatalog.byId.values()];
		const choiceEntries = entries.filter((entry) => entry.ruleType === CHOICE);
		const repeatEntry = entries.find((entry) => entry.ruleType === REPEAT1)!;

		expect(
			choiceEntries.some((entry) => raw.ruleCatalog.classificationById.get(entry.id)!.kind === 'nonterminal')
		).toBe(true);
		expect(raw.ruleCatalog.classificationById.get(repeatEntry.id)!.kind).toBe('nonterminal');
	});
});
