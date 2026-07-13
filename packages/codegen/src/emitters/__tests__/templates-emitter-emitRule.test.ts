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

import { CHOICE, DEDENT, GROUP, INDENT, NEWLINE, PATTERN, SEQ, STRING, SUPERTYPE, SYMBOL, VARIANT } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type {
	ChoiceRule,
	DedentRule,
	EnumRule,
	GroupRule,
	IndentRule,
	NewlineRule,
	PatternRule,
	Rule,
	SeqRule,
	StringRule,
	SymbolRule,
	VariantRule
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
		externals: [],
		rules: {},
		visitingHelpers: new Set<string>(),
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
		hasTrailing: false,
		hasLeading: false,
		...overrides
	} as AssembledNonterminal;
}

describe('emitRule — string', () => {
	it('returns string rule values verbatim', () => {
		const rule: StringRule = { type: STRING, value: 'fn' };
		expect(emitRule(rule, makeCtx())).toBe('fn');
	});

	it('escapes brace pairs that collide with Jinja syntax', () => {
		const rule: StringRule = { type: STRING, value: '{}' };
		expect(emitRule(rule, makeCtx())).toBe('{ }');
	});
});

describe('emitRule — pattern', () => {
	it('emits nothing for raw patterns', () => {
		const rule: PatternRule = { type: PATTERN, value: '[a-z]+' };
		expect(emitRule(rule, makeCtx())).toBe('');
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

	it('recurses into nested seqs', () => {
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
		expect(emitRule(rule, makeCtx())).toBe('(ab)');
	});
});

describe('emitRule — transparent wrappers', () => {
	// PR-P Task 2: TerminalRule deleted — no 'recurses into terminal content' test needed.
	// Terminal-shape rules now classify by shape at Assemble; they have no 'terminal' wrapper
	// in the rule tree, so emitRule never sees a TERMINAL node.

	// phase-visibility-tightening: 'recurses into token content' / 'recurses
	// into unnamed alias content' tests deleted — TOKEN and ALIAS are
	// WrapperPhase-only (types/rule.ts) and collapse to `never` under
	// RenderRule; `emitRule`'s TOKEN/ALIAS switch arms were deleted as
	// unreachable (empirically confirmed dead across all 3 grammars — see
	// templates.ts's emitRule comment). TokenRule/AliasRule values no longer
	// typecheck as emitRule arguments at all.

	it('recurses into variant content', () => {
		const inner: StringRule = { type: STRING, value: 'qux' };
		const rule: VariantRule = { type: VARIANT, name: 'q', content: inner };
		expect(emitRule(rule, makeCtx())).toBe('qux');
	});

	it('recurses into group content', () => {
		const inner: StringRule = { type: STRING, value: 'grp' };
		const rule: GroupRule = { type: GROUP, name: 'g', content: inner };
		expect(emitRule(rule, makeCtx())).toBe('grp');
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
		expect(emitRule(rule, ctx)).toBe('{{ args | join(" ") }}');
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
		const helperBody: StringRule = { type: STRING, value: 'pub(crate)' };
		const rule: SymbolRule = { type: SYMBOL, name: '_visibility' };
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
		// isMultiple(slot) is false (values=[]), multiplicity=array → list form
		expect(emitRule(rule, ctx)).toBe('{{ item | join(" ") }}');
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
		const rule: ChoiceRule = {
			type: CHOICE,
			members: [
				{ type: PATTERN, value: '' },
				{ type: STRING, value: '*' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('*');
	});

	it('returns empty when no branch produces output', () => {
		const rule: ChoiceRule = {
			type: CHOICE,
			members: [
				{ type: PATTERN, value: '' },
				{ type: PATTERN, value: '' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('');
	});
});

describe('emitRule — structural whitespace', () => {
	it('emits an indent', () => {
		const rule: IndentRule = { type: INDENT };
		expect(emitRule(rule, makeCtx())).toBe('\n  ');
	});

	it('emits a dedent', () => {
		const rule: DedentRule = { type: DEDENT };
		expect(emitRule(rule, makeCtx())).toBe('\n');
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
			subtypes: ['binary_expression']
		};
		expect(emitRule(rule, makeCtx())).toBe('');
	});

});
