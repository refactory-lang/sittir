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

import { describe, expect, it } from 'vitest';
import type {
	AliasRule,
	ChoiceRule,
	DedentRule,
	EnumRule,
	FieldRule,
	GroupRule,
	IndentRule,
	NewlineRule,
	OptionalRule,
	PatternRule,
	Repeat1Rule,
	RepeatRule,
	Rule,
	SeqRule,
	StringRule,
	SymbolRule,
	TerminalRule,
	TokenRule,
	VariantRule
} from '../../compiler/rule.ts';
import type { AssembledNonterminal, NodeOrTerminal } from '../../compiler/node-map.ts';
import { emitRule, type EmitCtx } from '../templates.ts';

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
	kind: 'terminal',
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
		source: 'grammar',
		...overrides
	} as AssembledNonterminal;
}

describe('emitRule — string', () => {
	it('returns string rule values verbatim', () => {
		const rule: StringRule = { type: 'string', value: 'fn' };
		expect(emitRule(rule, makeCtx())).toBe('fn');
	});

	it('escapes brace pairs that collide with Jinja syntax', () => {
		const rule: StringRule = { type: 'string', value: '{}' };
		expect(emitRule(rule, makeCtx())).toBe('{ }');
	});
});

describe('emitRule — pattern', () => {
	it('emits nothing for raw patterns', () => {
		const rule: PatternRule = { type: 'pattern', value: '[a-z]+' };
		expect(emitRule(rule, makeCtx())).toBe('');
	});
});

describe('emitRule — enum', () => {
	it('emits the first member as a literal', () => {
		const rule: EnumRule = {
			type: 'enum',
			members: [
				{ type: 'string', value: 'pub' },
				{ type: 'string', value: 'priv' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('pub');
	});

	it('emits empty when the enum has no members', () => {
		const rule: EnumRule = { type: 'enum', members: [] };
		expect(emitRule(rule, makeCtx())).toBe('');
	});
});

describe('emitRule — seq', () => {
	it('concatenates members', () => {
		const rule: SeqRule = {
			type: 'seq',
			members: [
				{ type: 'string', value: 'fn' },
				{ type: 'string', value: ' ' },
				{ type: 'string', value: 'main' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('fn main');
	});

	it('recurses into nested seqs', () => {
		const rule: SeqRule = {
			type: 'seq',
			members: [
				{ type: 'string', value: '(' },
				{
					type: 'seq',
					members: [
						{ type: 'string', value: 'a' },
						{ type: 'string', value: 'b' }
					]
				},
				{ type: 'string', value: ')' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('(ab)');
	});
});

describe('emitRule — transparent wrappers', () => {
	it('recurses into token content', () => {
		const inner: StringRule = { type: 'string', value: 'foo' };
		const rule: TokenRule = { type: 'token', content: inner, immediate: false };
		expect(emitRule(rule, makeCtx())).toBe('foo');
	});

	it('recurses into terminal content', () => {
		const inner: StringRule = { type: 'string', value: 'bar' };
		const rule: TerminalRule = { type: 'terminal', content: inner };
		expect(emitRule(rule, makeCtx())).toBe('bar');
	});

	it('recurses into unnamed alias content', () => {
		const inner: StringRule = { type: 'string', value: 'baz' };
		const rule: AliasRule = { type: 'alias', content: inner, named: false, value: 'baz' };
		expect(emitRule(rule, makeCtx())).toBe('baz');
	});

	it('recurses into variant content', () => {
		const inner: StringRule = { type: 'string', value: 'qux' };
		const rule: VariantRule = { type: 'variant', name: 'q', content: inner };
		expect(emitRule(rule, makeCtx())).toBe('qux');
	});

	it('recurses into group content', () => {
		const inner: StringRule = { type: 'string', value: 'grp' };
		const rule: GroupRule = { type: 'group', name: 'g', content: inner };
		expect(emitRule(rule, makeCtx())).toBe('grp');
	});
});

// PR2 Task 3.B3: field / optional / repeat / repeat1 are wrapper rule types
// that must NOT appear in RenderRule input. emitRule throws defensively if
// it encounters them. Wrapper attributes (fieldName / multiplicity /
// separator) are now on the leaf symbol instead.
describe('emitRule — wrapper types throw (PR2 Task 3.B3)', () => {
	it('throws when given a field rule (wrapper removed in RenderRule)', () => {
		const rule: FieldRule = {
			type: 'field',
			name: 'name',
			content: { type: 'symbol', name: 'identifier' }
		};
		expect(() => emitRule(rule, makeCtx())).toThrow("unexpected wrapper 'field'");
	});

	it('throws when given an optional rule (wrapper removed in RenderRule)', () => {
		const rule: OptionalRule = {
			type: 'optional',
			content: { type: 'string', value: ';' }
		};
		expect(() => emitRule(rule, makeCtx())).toThrow("unexpected wrapper 'optional'");
	});

	it('throws when given a repeat rule (wrapper removed in RenderRule)', () => {
		const rule: RepeatRule = {
			type: 'repeat',
			content: { type: 'symbol', name: 'item' }
		};
		expect(() => emitRule(rule, makeCtx())).toThrow("unexpected wrapper 'repeat'");
	});

	it('throws when given a repeat1 rule (wrapper removed in RenderRule)', () => {
		const rule: Repeat1Rule = {
			type: 'repeat1',
			content: { type: 'symbol', name: 'item' }
		};
		expect(() => emitRule(rule, makeCtx())).toThrow("unexpected wrapper 'repeat1'");
	});
});

// In RenderRule, field facts are leaf attributes on the inner symbol.
// emitRule dispatches to emitSymbol which reads fieldName / multiplicity.
describe('emitRule — symbol with fieldName attribute (RenderRule field path)', () => {
	it('emits a scalar slot when fieldName is set and no multiplicity', () => {
		const rule: SymbolRule = {
			type: 'symbol',
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
			type: 'symbol',
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
			type: 'symbol',
			name: 'expression',
			id: 'r3',
			fieldName: 'args',
			multiplicity: 'array',
			separator: ', '
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
			type: 'symbol',
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
			type: 'symbol',
			name: 'identifier',
			fieldName: 'field_name'
		};
		expect(emitRule(rule, makeCtx())).toBe('{{ field_name }}');
	});
});

describe('emitRule — symbol', () => {
	it('emits a slot when a slot back-pointer exists', () => {
		const rule: SymbolRule = { type: 'symbol', name: 'expression', id: 's1' };
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
		const rule: SymbolRule = {
			type: 'symbol',
			name: '_kw_async',
			source: 'link',
			literal: 'async'
		};
		expect(emitRule(rule, makeCtx())).toBe('async');
	});

	it('emits nothing for a link symbol without a literal', () => {
		const rule: SymbolRule = { type: 'symbol', name: '_kw_void', source: 'link' };
		expect(emitRule(rule, makeCtx())).toBe('');
	});

	it('inlines a hidden helper rule when present in ctx.rules', () => {
		const helperBody: StringRule = { type: 'string', value: 'pub(crate)' };
		const rule: SymbolRule = { type: 'symbol', name: '_visibility' };
		const ctx = makeCtx({ rules: { _visibility: helperBody } });
		expect(emitRule(rule, ctx)).toBe('pub(crate)');
	});

	it('falls back to the kind-named slot when no slot back-pointer or helper exists', () => {
		const rule: SymbolRule = { type: 'symbol', name: 'identifier' };
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
			type: 'symbol',
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
			type: 'symbol',
			name: 'item',
			id: 'r11',
			multiplicity: 'array',
			separator: ','
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
			type: 'symbol',
			name: 'item',
			id: 'r12',
			multiplicity: 'array',
			separator: { rules: [{ type: 'string', value: ',' }], trailing: true }
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
			type: 'choice',
			members: [
				{ type: 'string', value: '+' },
				{ type: 'string', value: '-' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('+');
	});

	it('skips empty branches and emits the first non-empty one', () => {
		const rule: ChoiceRule = {
			type: 'choice',
			members: [
				{ type: 'pattern', value: '' },
				{ type: 'string', value: '*' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('*');
	});

	it('returns empty when no branch produces output', () => {
		const rule: ChoiceRule = {
			type: 'choice',
			members: [
				{ type: 'pattern', value: '' },
				{ type: 'pattern', value: '' }
			]
		};
		expect(emitRule(rule, makeCtx())).toBe('');
	});
});

describe('emitRule — structural whitespace', () => {
	it('emits an indent', () => {
		const rule: IndentRule = { type: 'indent' };
		expect(emitRule(rule, makeCtx())).toBe('\n  ');
	});

	it('emits a dedent', () => {
		const rule: DedentRule = { type: 'dedent' };
		expect(emitRule(rule, makeCtx())).toBe('\n');
	});

	it('emits a newline', () => {
		const rule: NewlineRule = { type: 'newline' };
		expect(emitRule(rule, makeCtx())).toBe('\n');
	});
});

describe('emitRule — exhaustive default', () => {
	it('returns empty for supertype rules (handled by per-modelType emit instead)', () => {
		const rule: Rule = {
			type: 'supertype',
			name: '_expression',
			subtypes: ['binary_expression']
		};
		expect(emitRule(rule, makeCtx())).toBe('');
	});

	it('returns empty for polymorph rules (handled by per-modelType emit instead)', () => {
		const rule: Rule = {
			type: 'polymorph',
			forms: [{ name: 'a', content: { type: 'string', value: 'A' } }]
		};
		expect(emitRule(rule, makeCtx())).toBe('');
	});
});
