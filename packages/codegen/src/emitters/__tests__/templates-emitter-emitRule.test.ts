/**
 * Per-case tests for the new template emitter's `emitRule` dispatcher
 * (Task 2.3 of PR1 — rule-attributes-and-template-emitter refactor).
 *
 * Each Rule.type case has its own focused tests that exercise the
 * minimum machinery required: a Rule subtree + a minimal `EmitCtx`.
 * The slot back-pointer (`ctx.nodeMap.slotByRuleId`) is populated by
 * hand only for cases where a slot lookup is required — symbol /
 * field emissions. Other cases keep an empty map.
 */

import { CHOICE, DEDENT, INDENT, NEWLINE, PATTERN, SEQ, STRING, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type {
	ChoiceRule,
	DedentRule,
	EnumRule,
	IndentRule,
	NewlineRule,
	PatternRule,
	Rule,
	SeqRule,
	StringRule,
	SymbolRule
} from '../../types/rule.ts';
import type { AssembledNonterminal, NodeOrTerminal } from '../../compiler/model/node-map.ts';
import { emitRule, type EmitCtx } from '../templates.ts';
import { makeRuleMetadata } from '../../dsl/rule-metadata.ts';

function makeCtx(overrides: Partial<EmitCtx> = {}): EmitCtx {
	return {
		nodeMap: {
			slotByRuleId: new Map(),
			nodeByRuleId: new Map(),
			nodes: new Map()
		} as unknown as EmitCtx['nodeMap'],
		wordMatcher: /^\w+$/,
		isWordChar: (c: string) => /\w/.test(c),
		// No merge-hazard pairs by default — tests opt in via overrides,
		// mirroring how grammars opt in at emit time.
		isLiteralMergePair: () => false,
		externals: [],
		rules: {},
		visitingHelpers: new Set<string>(),
		emittedSlotNames: new Set(),
		...overrides
	};
}

/**
 * A minimal terminal value with `multiplicity: 'single'` so `isRequired`
 * returns `true` for test slots that represent required scalar fields.
 * Without this, `isRequired` conservatively returns `false` for empty
 * `values` arrays and the emitter wraps the slot in an `isPresent` guard.
 */
const SINGLE_REQUIRED_VALUE: NodeOrTerminal = {
	value: 'x',
	multiplicity: 'single'
};

function makeSlot(overrides: Partial<AssembledNonterminal>): AssembledNonterminal {
	return {
		name: 'value',
		propertyName: 'value',
		configKey: 'value',
		storageName: 'value',
		values: [SINGLE_REQUIRED_VALUE],
		paramName: 'value',
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		...overrides
	} as AssembledNonterminal;
}

describe('emitRule — string', () => {
	it('returns string rule values verbatim', () => {
		const rule: StringRule = { type: STRING, value: 'fn' };
		expect(emitRule(rule, makeCtx())).toBe('fn');
	});

	it('leaves brace pairs alone — they collide with nothing', () => {
		// Only a real tag opener needs separating — see separateBraceFromTag.
		const rule: StringRule = { type: STRING, value: '{}' };
		expect(emitRule(rule, makeCtx())).toBe('{}');
	});
});

describe('emitRule — pattern', () => {
	it('throws when no slot is registered and the owner has no unambiguous single slot', () => {
		// Patterns are nonterminal slots (classifyByType) — they emit a slot
		// REFERENCE, not inline text. With no registered slot, no fieldName,
		// and no single owner slot to fall back to, there is no unambiguous
		// storageName to read — emitRule throws rather than guessing a
		// hardcoded placeholder name (see emitRule's PATTERN case).
		const rule: PatternRule = { type: PATTERN, value: '[a-z]+' };
		expect(() => emitRule(rule, makeCtx())).toThrow(/no unambiguous slot to read/);
	});

	it("reads the owner's sole registered slot by its stamped storageName when lookupSlot misses", () => {
		// Same no-lookupSlot-hit, no-fieldName shape as above, but the owner
		// has exactly one registered slot — unambiguous, so its stamped
		// storageName is read directly rather than a hardcoded placeholder.
		const rule: PatternRule = { type: PATTERN, value: '[a-z]+' };
		const slot = makeSlot({ storageName: 'body' });
		expect(emitRule(rule, makeCtx({ ownerSlots: { body: slot } }))).toBe('{{ body }}');
	});
});

describe('emitRule — enum', () => {
	it('emits the first member as a literal', () => {
		// PR-P: EnumRule is now ChoiceRule with all-STRING members.
		const rule: EnumRule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: 'pub' },
				{ type: STRING, value: 'priv' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('pub');
	});

	it('emits empty when the enum has no members', () => {
		const rule: EnumRule = { type: CHOICE, members: [] };
		expect(emitRule(rule, makeCtx())).toBe('');
	});
});

describe('emitRule — seq', () => {
	it('concatenates members', () => {
		const rule: SeqRule = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'fn' },
				{ type: STRING, value: ' ' },
				{ type: STRING, value: 'main' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('fn main');
	});

	it('recurses into nested seqs, inserting a word-boundary space between adjacent word literals', () => {
		// Bug 6 fix: consecutive seq members that would merge into a single
		// lexeme at render time ('a' + 'b' -> 'ab', a different token) get a
		// space inserted between them, per the grammar's wordMatcher.
		const rule: SeqRule = {
			type: SEQ,
			members: [
				{ type: STRING, value: '(' },
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'b' }
					]
				},
				{ type: STRING, value: ')' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('(a b)');
	});

	it('inserts a space at a static merge-hazard punctuation seam, and only there', () => {
		// Mirrors the SpacingWriter's pair rule at emit time: askama fuses
		// adjacent template literals into one write, so a static '..' + '=>'
		// seam is invisible to the runtime writer and would re-lex as '..='
		// plus a dangling '>'. A pair in no token ('!' + '[') stays tight.
		const hazardCtx = makeCtx({ isLiteralMergePair: (l: string, r: string) => l === '.' && r === '=' });
		const hazard: SeqRule = {
			type: SEQ,
			members: [
				{ type: STRING, value: '..' },
				{ type: STRING, value: '=>' }
			]
		};
		expect(emitRule(hazard, hazardCtx)).toBe('.. =>');
		const benign: SeqRule = {
			type: SEQ,
			members: [
				{ type: STRING, value: '!' },
				{ type: STRING, value: '[' }
			]
		};
		expect(emitRule(benign, hazardCtx)).toBe('![');
	});
});

// PR2 Task 3.B3 / phase-visibility-tightening: field / optional / repeat /
// repeat1 are WrapperPhase-only rule variants (types/rule.ts) that collapse
// to `never` under RenderRule — `emitRule` is now typed `(rule: RenderRule)`,
// so these shapes are unconstructible as arguments and the switch's former
// defensive throw arms were deleted as genuinely unreachable code. The
// wrapper-throw regression tests these used to cover are superseded by the
// type system itself (a FieldRule/OptionalRule/RepeatRule/Repeat1Rule value
// no longer typechecks as an emitRule argument at all).

// In RenderRule, field facts are leaf attributes on the inner symbol.
// emitRule dispatches to emitSymbol which reads fieldName / multiplicity.
describe('emitRule — symbol with fieldName attribute (RenderRule field path)', () => {
	it('emits a scalar slot when fieldName is set and no multiplicity', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'identifier',
			id: 'r1',
			fieldName: 'name'
		};
		const slot = makeSlot({ name: 'name', propertyName: 'name', storageName: 'name' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['r1', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ name }}');
	});

	it('emits a list slot when fieldName is set and multiplicity is array', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'expression',
			id: 'r2',
			fieldName: 'args',
			multiplicity: 'array'
		};
		const slot = makeSlot({ name: 'args', propertyName: 'args', storageName: 'args' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['r2', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		// The default list separator is empty — the render-time writer
		// supplies word-word seam spaces. staticListInterior classifies this
		// interior for the census (the 'x' value's edges are word-class both
		// sides) but never changes emission: baking the owed space is
		// blocked until trailing-trivia edges are modeled (see its doc).
		expect(emitRule(rule, ctx)).toBe('{{ args | join("") }}');
	});

	it('uses the separator attribute when emitting a list slot', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'expression',
			id: 'r3',
			fieldName: 'args',
			multiplicity: 'array',
			separator: { value: { type: STRING, value: ', ' } }
		};
		const slot = makeSlot({ name: 'args', propertyName: 'args', storageName: 'args' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['r3', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ args | join(", ") }}');
	});

	it('emits a conditional slot when multiplicity is optional', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'expression',
			id: 'r4',
			fieldName: 'value',
			multiplicity: 'optional'
		};
		const slot = makeSlot({ name: 'value', propertyName: 'value', storageName: 'value' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['r4', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{% if value | isPresent %}{{ value }}{% endif %}');
	});

	it('uses fieldName directly (no slot) when slot is absent', () => {
		// When no slot back-pointer: fieldName drives the slot name directly.
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'identifier',
			fieldName: 'field_name'
		};
		expect(emitRule(rule, makeCtx())).toBe('{{ field_name }}');
	});
});

describe('emitRule — symbol', () => {
	it('emits a slot when a slot back-pointer exists', () => {
		const rule: SymbolRule = { type: SYMBOL, name: 'expression', id: 's1' };
		const slot = makeSlot({
			name: 'expression',
			propertyName: 'expression',
			storageName: 'expression'
		});
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['s1', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ expression }}');
	});

	it('emits the literal for a link-synthesized symbol', () => {
		// (debt PR-P1) `SymbolRule.source` (top-level) is deleted; emitSymbol
		// now keys on the STRUCTURAL `literal` field alone (link.ts's
		// `canonicalizeRuleLiterals` is the sole writer, and it always sets
		// `literal` together with `metadata.symbolSource: 'link'`, so
		// `literal !== undefined` is the exact same condition).
		const rule: SymbolRule = {
			type: SYMBOL,
			name: '_kw_async',
			literal: 'async'
		};
		expect(emitRule(rule, makeCtx())).toBe('async');
	});

	it('falls through to scalar-slot emission for a symbol tagged link-sourced but with no literal', () => {
		// (debt PR-P1) This case is UNREACHABLE from the live pipeline —
		// link.ts's one writer of `metadata.symbolSource: 'link'` always sets
		// `literal` alongside it — but exercises the boundary directly to
		// prove emitSymbol does NOT branch on the opaque `metadata` bag: with
		// `literal` absent, it must fall through past the literal-emission
		// branch to ordinary scalar-slot handling, regardless of metadata.
		const rule: SymbolRule = {
			type: SYMBOL,
			name: '_kw_void',
			metadata: makeRuleMetadata({ symbolSource: 'link' })
		};
		// Fallback: bare kind-named scalar slot, name.replace(/^_+/, '') —
		// strips only the leading underscore, not the `kw_` prefix.
		expect(emitRule(rule, makeCtx())).toBe('{{ kw_void }}');
	});

	it('inlines a hidden helper rule when present in ctx.rules', () => {
		// emitSymbol's ctx.rules fallback requires `inline: true` (RuleBase's
		// per-ref inline decision — real rules get this stamped at construction
		// for hidden (`_`-prefixed) names; this hand-built literal must set it
		// explicitly to exercise the same path).
		const helperBody: StringRule = { type: STRING, value: 'pub(crate)' };
		const rule: SymbolRule = { type: SYMBOL, name: '_visibility', inline: true };
		const ctx = makeCtx({ rules: { _visibility: helperBody } });
		expect(emitRule(rule, ctx)).toBe('pub(crate)');
	});

	it('falls back to the kind-named slot when no slot back-pointer or helper exists', () => {
		const rule: SymbolRule = { type: SYMBOL, name: 'identifier' };
		expect(emitRule(rule, makeCtx())).toBe('{{ identifier }}');
	});
});

// In RenderRule, optional wrapping is a leaf attribute (multiplicity: 'optional')
// on the inner symbol. The optional wrapper rule itself no longer appears in
// RenderRule input (throws defensively — see "wrapper types throw" suite above).
// The RenderRule path for conditional slots is tested in the fieldName suite
// (multiplicity: 'optional') and the symbol suite (multiplicity: 'optional').

// In RenderRule, repeat wrapping is a leaf attribute (multiplicity: 'array' or
// 'nonEmptyArray', separator) on the inner symbol. The repeat / repeat1 wrapper
// rule types no longer appear in RenderRule input (throw defensively — see
// "wrapper types throw" suite above).
// The RenderRule path for list slots is tested in the fieldName suite
// (multiplicity: 'array' + separator) and the symbol suite (array multiplicity).

// List-slot behavior on the symbol path (via multiplicity='array' attribute):
describe('emitRule — symbol with multiplicity array (RenderRule repeat path)', () => {
	it('emits a list slot with default separator when multiplicity is array', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'item',
			id: 'r10',
			multiplicity: 'array'
		};
		const slot = makeSlot({ name: 'item', propertyName: 'item', storageName: 'item' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['r10', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		// isMultiple(slot) is false (one 'single' value), multiplicity=array
		// → list form. Census-classified, emission unchanged (see the
		// fieldName suite's comment).
		expect(emitRule(rule, ctx)).toBe('{{ item | join("") }}');
	});

	it('keeps the empty separator and the runtime writer when edges are unknown', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'item',
			id: 'r11',
			multiplicity: 'array'
		};
		// A node-ref to an UNRESOLVED target: edge chars underivable, so the
		// interior stays with the runtime SpacingWriter.
		const slot = makeSlot({
			name: 'item',
			propertyName: 'item',
			storageName: 'item',
			values: [{ node: { kind: 'unresolved-ref', name: 'mystery' }, multiplicity: 'single' } as NodeOrTerminal]
		});
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['r11', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ item | join("") }}');
	});

	it('honours the separator attribute when emitting a list slot', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'item',
			id: 'r11',
			multiplicity: 'array',
			separator: { value: { type: STRING, value: ',' } }
		};
		const slot = makeSlot({ name: 'item', propertyName: 'item', storageName: 'item' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['r11', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ item | join(",") }}');
	});

	it('uses joinWithTrailing when trailing separator flag is set via structured separator', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'item',
			id: 'r12',
			multiplicity: 'array',
			separator: { value: { type: STRING, value: ',' }, trailing: 'mandatory' }
		};
		const slot = makeSlot({ name: 'item', propertyName: 'item', storageName: 'item' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['r12', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ item | joinWithTrailing(",") }}');
	});
});

describe('emitRule — choice', () => {
	it('emits the first branch text for a homogeneous choice', () => {
		const rule: ChoiceRule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: '+' },
				{ type: STRING, value: '-' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('+');
	});

	it('skips empty branches and emits the first non-empty one', () => {
		// A nested empty CHOICE (zero members) is the reliably-empty fixture
		// here — PATTERN no longer emits '' (it emits an unnamed content slot
		// reference; see the 'emitRule — pattern' suite above), so it can't
		// stand in for "an arm that produces no output" anymore.
		const rule: ChoiceRule = {
			type: CHOICE,
			members: [
				{ type: CHOICE, members: [] },
				{ type: STRING, value: '*' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('*');
	});

	it('returns empty when no branch produces output', () => {
		const rule: ChoiceRule = {
			type: CHOICE,
			members: [
				{ type: CHOICE, members: [] },
				{ type: CHOICE, members: [] }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('');
	});
});

describe('emitRule — structural whitespace', () => {
	it('emits an indent', () => {
		// Expression form (`{{ "\n" }}`), not a raw literal — immune to a
		// header comment's `-#}` whitespace trim when INDENT is the first
		// thing in a kind's compiled template body. See emitRule's INDENT
		// case comment.
		const rule: IndentRule = { type: INDENT };
		expect(emitRule(rule, makeCtx())).toBe('{{ "\n" }}');
	});

	it('emits a dedent', () => {
		// DEDENT contributes nothing: the repeat content it closes
		// (`_statement`-typed, always) already self-terminates its own
		// trailing newline, so a separate DEDENT newline would duplicate
		// it. See emitRule's DEDENT case comment.
		const rule: DedentRule = { type: DEDENT };
		expect(emitRule(rule, makeCtx())).toBe('');
	});

	it('emits a newline', () => {
		const rule: NewlineRule = { type: NEWLINE };
		expect(emitRule(rule, makeCtx())).toBe('\n');
	});
});

describe('emitRule — exhaustive default', () => {
	it('returns empty for supertype rules (handled by per-modelType emit instead)', () => {
		const rule: Rule = {
			type: SUPERTYPE,
			name: '_expression',
			subtypes: [{ type: SYMBOL, name: 'binary_expression' }]
		};
		expect(emitRule(rule, makeCtx())).toBe('');
	});
});

describe('emitRule — tag-boundary seams', () => {
	// The fixed×fixed join already bakes the writer's invariant into literal
	// text. A tag boundary whose BOTH edge classes are statically known has
	// a constant outcome under the same invariant, so it is baked too; a
	// boundary with a `varies` edge stays glued for the runtime writer.
	const slot = makeSlot({ name: 'left', propertyName: 'left', storageName: 'left' });
	const nodeMap = {
		slotByRuleId: new Map([['r-left', slot]]),
		nodeByRuleId: new Map(),
		nodes: new Map()
	} as unknown as EmitCtx['nodeMap'];
	const seq = (kind: string): SeqRule => ({
		type: SEQ,
		members: [
			{ type: STRING, value: 'type' },
			{ type: SYMBOL, name: kind, id: 'r-left', fieldName: 'left' }
		]
	});

	it('bakes the space when both edge classes are statically word-class', () => {
		const ctx = makeCtx({ nodeMap, rules: { identifier: { type: PATTERN, value: '[a-z]+' } } });
		expect(emitRule(seq('identifier'), ctx)).toBe('type {{ left }}');
	});

	it('leaves the boundary glued when the slot edge varies', () => {
		const ctx = makeCtx({
			nodeMap,
			rules: {
				operand: {
					type: CHOICE,
					members: [
						{ type: PATTERN, value: '[a-z]+' },
						{
							type: SEQ,
							members: [
								{ type: STRING, value: '(' },
								{ type: STRING, value: ')' }
							]
						}
					]
				}
			}
		});
		expect(emitRule(seq('operand'), ctx)).toBe('type{{ left }}');
	});
});
