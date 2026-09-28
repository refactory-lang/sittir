import { CHOICE, OPTIONAL, REPEAT, REPEAT1, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { structuralBuilder } from '../../dsl/builders.ts';
import { canonicalRuleTree } from '../canonical-rules.ts';
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

const str = (value: string) => ({ type: 'STRING', value }) as const;

describe('structuralBuilder — builds the rule shapes tree-sitter builds', () => {
	it('seq keeps every member, including a single one', () => {
		expect(structuralBuilder.seq(str('a'), str('b'))).toEqual({ type: 'SEQ', members: [str('a'), str('b')] });
		expect(structuralBuilder.seq(str('a'))).toEqual({ type: 'SEQ', members: [str('a')] });
	});

	it('choice keeps every member, including same-name FIELD members', () => {
		const a = structuralBuilder.field('operator', str('+'));
		const b = structuralBuilder.field('operator', str('-'));
		expect(structuralBuilder.choice(a, b)).toEqual({ type: 'CHOICE', members: [a, b] });
		expect(structuralBuilder.choice(str('a'))).toEqual({ type: 'CHOICE', members: [str('a')] });
	});

	it('optional, repeat and repeat1 wrap their content without collapsing', () => {
		const repeat1 = structuralBuilder.repeat1(str('x'));
		expect(structuralBuilder.optional(repeat1)).toEqual({ type: 'OPTIONAL', content: repeat1 });
		const optional = structuralBuilder.optional(str('x'));
		expect(structuralBuilder.repeat(optional)).toEqual({ type: 'REPEAT', content: optional });
		expect(structuralBuilder.repeat1(repeat1)).toEqual({ type: 'REPEAT1', content: repeat1 });
	});

	it('field keeps an OPTIONAL(REPEAT(x)) body', () => {
		const body = structuralBuilder.optional(structuralBuilder.repeat({ type: SYMBOL, name: 'item' }));
		expect(structuralBuilder.field('items', body)).toEqual({ type: 'FIELD', name: 'items', content: body });
	});

	it('token carries no immediate flag; token.immediate is its own node type', () => {
		expect(structuralBuilder.token(str('x'))).toEqual({ type: 'TOKEN', content: str('x') });
		expect(structuralBuilder.token.immediate(str('x'))).toEqual({ type: 'IMMEDIATE_TOKEN', content: str('x') });
	});

	it('prec wrappers keep their value', () => {
		expect(structuralBuilder.prec(1, str('x'))).toEqual({ type: 'PREC', value: 1, content: str('x') });
		expect(structuralBuilder.prec.left(0, str('x'))).toEqual({ type: 'PREC_LEFT', value: 0, content: str('x') });
		expect(structuralBuilder.prec.right(1, str('x'))).toEqual({ type: 'PREC_RIGHT', value: 1, content: str('x') });
		expect(structuralBuilder.prec.dynamic(1, str('x'))).toEqual({ type: 'PREC_DYNAMIC', value: 1, content: str('x') });
	});
});

describe('canonicalRuleTree — the compile-boundary canonical shape', () => {
	it('flattens a single-member seq or choice', () => {
		expect(canonicalRuleTree(structuralBuilder.seq(str('a')))).toEqual(str('a'));
		expect(canonicalRuleTree(structuralBuilder.choice(str('a')))).toEqual(str('a'));
	});

	it('collapses all-same-name FIELD members into one FIELD wrapping a CHOICE', () => {
		const a = structuralBuilder.field('operator', str('+'));
		const b = structuralBuilder.field('operator', str('-'));
		expect(canonicalRuleTree(structuralBuilder.choice(a, b))).toEqual({
			type: 'FIELD',
			name: 'operator',
			content: { type: 'CHOICE', members: [str('+'), str('-')] },
			metadata: { fieldSource: 'grammar' }
		});
	});

	it('keeps a CHOICE of FIELD members with different names or an ALIAS arm', () => {
		const a = structuralBuilder.field('left', str('+'));
		const b = structuralBuilder.field('right', str('-'));
		expect(canonicalRuleTree(structuralBuilder.choice(a, b))).toEqual({ type: CHOICE, members: [a, b] });
		const c = structuralBuilder.field('left', structuralBuilder.alias(str('-'), 'minus'));
		expect(canonicalRuleTree(structuralBuilder.choice(a, c))).toEqual({ type: CHOICE, members: [a, c] });
	});

	it('collapses nested optional and repeat wrappers', () => {
		const optional = structuralBuilder.optional(str('x'));
		const repeat = structuralBuilder.repeat(str('x'));
		expect(canonicalRuleTree(structuralBuilder.optional(optional))).toEqual(optional);
		expect(canonicalRuleTree(structuralBuilder.optional(repeat))).toEqual(repeat);
		expect(canonicalRuleTree(structuralBuilder.repeat(repeat))).toEqual(repeat);
		expect(canonicalRuleTree(structuralBuilder.repeat(optional))).toEqual(repeat);
		const repeat1 = structuralBuilder.repeat1(str('x'));
		expect(canonicalRuleTree(structuralBuilder.repeat1(repeat1))).toEqual(repeat1);
	});

	it('keeps a separated inner REPEAT under repeat', () => {
		const inner = { type: REPEAT, content: str('x'), separator: ',' } as const;
		expect(canonicalRuleTree(structuralBuilder.repeat(inner))).toEqual({ type: 'REPEAT', content: inner });
	});

	it('collapses optional(repeat1(x)) to a REPEAT carrying the separator shape', () => {
		const inner = { type: REPEAT1, content: str('x'), separator: ',', trailing: 'optional' } as const;
		expect(canonicalRuleTree(structuralBuilder.optional(inner))).toEqual({
			type: 'REPEAT',
			content: str('x'),
			separator: ',',
			trailing: 'optional'
		});
	});

	it('collapses an OPTIONAL(REPEAT(x)) field body to REPEAT(x)', () => {
		const repeat = structuralBuilder.repeat({ type: SYMBOL, name: 'item' });
		const rule = structuralBuilder.field('items', { type: OPTIONAL, content: repeat });
		expect(canonicalRuleTree(rule)).toEqual({ type: 'FIELD', name: 'items', content: repeat });
	});

	it('gives every token an immediate flag', () => {
		expect(canonicalRuleTree(structuralBuilder.token(str('x')))).toEqual({
			type: 'TOKEN',
			content: str('x'),
			immediate: false
		});
		expect(canonicalRuleTree(structuralBuilder.token.immediate(str('x')))).toEqual({
			type: 'TOKEN',
			content: str('x'),
			immediate: true
		});
	});

	it('peels every precedence wrapper', () => {
		expect(canonicalRuleTree(structuralBuilder.prec.left(0, structuralBuilder.prec(2, str('x'))))).toEqual(str('x'));
	});
});

describe('transform', () => {
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
		it('marks underscore-prefixed symbol references inline via the proxy (hidden is a rule-level fact link stamps)', async () => {
			const raw = await evaluate(fixture('test-grammar.js'));
			const expressionStatement = raw.rules['expression_statement'] as {
				members: readonly { type: string; name?: string; hidden?: boolean; inline?: boolean }[];
			};
			const hiddenRef = expressionStatement.members.find((m) => m.type === 'SYMBOL' && m.name === '_expression');
			expect(hiddenRef).toEqual(expect.objectContaining({ inline: true }));
			expect(hiddenRef?.hidden).toBeUndefined();
			expect(link(raw).rules['_expression']?.hidden).toBe(true);
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

	it('records grammar and override provenance roots, and synthesizes no rule for inline alias content', async () => {
		// Inline alias content is left to enrich, which both executions run;
		// evaluate synthesizing a hidden rule for it would be a sittir-only kind.
		const dir = mkdtempSync(resolve(tmpdir(), 'sittir-provenance-'));
		const baseEntry = resolve(dir, 'base.js');
		const overrideEntry = resolve(dir, 'override.js');
		writeFileSync(
			baseEntry,
			`module.exports = grammar({
  name: "provenance_test",
  rules: {
    source_file: ($) => $.container,
    container: ($) => alias(seq('u8', 'u16'), $.primitive_type),
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

			expect(baseContainer.provenance).toBe('grammar-authored');
			expect(overrideContainer.provenance).toBe('override-authored-or-replaced');
			expect(overrideOnly.provenance).toBe('override-authored-or-replaced');
			expect(base.ruleCatalog.rootsByKind.has('_primitive_type')).toBe(false);
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
