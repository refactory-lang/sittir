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
	ClauseRule,
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
import type { AssembledNonterminal } from '../../compiler/node-map.ts';
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
		...overrides
	};
}

function makeSlot(overrides: Partial<AssembledNonterminal>): AssembledNonterminal {
	return {
		name: 'value',
		propertyName: 'value',
		configKey: 'value',
		storageName: 'value',
		values: [],
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

describe('emitRule — field', () => {
	it('emits a scalar slot via slotByRuleId back-pointer', () => {
		const inner: SymbolRule = { type: 'symbol', name: 'identifier', id: 'r1' };
		const rule: FieldRule = { type: 'field', name: 'name', content: inner, id: 'f1' };
		const slot = makeSlot({ name: 'name', propertyName: 'name', storageName: 'name' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['f1', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ name }}');
	});

	it('emits a list slot when multiplicity is array', () => {
		const inner: SymbolRule = { type: 'symbol', name: 'expression', id: 'r2' };
		const rule: FieldRule = {
			type: 'field',
			name: 'args',
			content: inner,
			id: 'f2',
			multiplicity: 'array'
		};
		const slot = makeSlot({ name: 'args', propertyName: 'args', storageName: 'args' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['f2', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ args | join(" ") }}');
	});

	it('uses the rule separator when emitting a list slot', () => {
		const inner: SymbolRule = { type: 'symbol', name: 'expression', id: 'r3' };
		const rule: FieldRule = {
			type: 'field',
			name: 'args',
			content: inner,
			id: 'f3',
			multiplicity: 'array',
			separator: ', '
		};
		const slot = makeSlot({ name: 'args', propertyName: 'args', storageName: 'args' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['f3', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ args | join(", ") }}');
	});

	it('falls back to the snakeCase of the fieldName when the slot is absent', () => {
		const inner: SymbolRule = { type: 'symbol', name: 'identifier' };
		const rule: FieldRule = { type: 'field', name: 'field_name', content: inner };
		expect(emitRule(rule, makeCtx())).toBe('{{ fieldName }}');
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

describe('emitRule — optional', () => {
	it('wraps the inner emit in a Jinja isPresent conditional keyed by the field name', () => {
		const inner: FieldRule = {
			type: 'field',
			name: 'value',
			content: { type: 'symbol', name: 'expression', id: 's2' },
			id: 'f4'
		};
		const slot = makeSlot({ name: 'value', propertyName: 'value', storageName: 'value' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['f4', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		const rule: OptionalRule = { type: 'optional', content: inner };
		expect(emitRule(rule, ctx)).toBe('{%- if value | isPresent %}{{ value }}{%- endif %}');
	});

	it('returns empty for an optional whose inner emit is empty', () => {
		const rule: OptionalRule = {
			type: 'optional',
			content: { type: 'pattern', value: '\\s+' }
		};
		expect(emitRule(rule, makeCtx())).toBe('');
	});
});

describe('emitRule — repeat / repeat1', () => {
	it('emits a list slot via the inner field with default separator', () => {
		const innerSymbol: SymbolRule = { type: 'symbol', name: 'item', id: 'r4' };
		const innerField: FieldRule = {
			type: 'field',
			name: 'items',
			content: innerSymbol,
			id: 'f5',
			multiplicity: 'array'
		};
		const rule: RepeatRule = { type: 'repeat', content: innerField };
		const slot = makeSlot({ name: 'items', propertyName: 'items', storageName: 'items' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['f5', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ items | join(" ") }}');
	});

	it('uses the repeat separator when present', () => {
		const innerSymbol: SymbolRule = { type: 'symbol', name: 'item', id: 'r5' };
		const innerField: FieldRule = {
			type: 'field',
			name: 'items',
			content: innerSymbol,
			id: 'f6',
			multiplicity: 'array',
			separator: ','
		};
		const rule: Repeat1Rule = { type: 'repeat1', content: innerField, separator: ',' };
		const slot = makeSlot({ name: 'items', propertyName: 'items', storageName: 'items' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['f6', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ items | join(",") }}');
	});

	it('emits a trailing-separator filter when rule.trailing is set', () => {
		const innerSymbol: SymbolRule = { type: 'symbol', name: 'item', id: 'r6' };
		const innerField: FieldRule = {
			type: 'field',
			name: 'items',
			content: innerSymbol,
			id: 'f7',
			multiplicity: 'array',
			separator: ','
		};
		const rule: RepeatRule = {
			type: 'repeat',
			content: innerField,
			separator: ',',
			trailing: true
		};
		const slot = makeSlot({ name: 'items', propertyName: 'items', storageName: 'items' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['f7', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe('{{ items | joinWithTrailing(",") }}');
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

describe('emitRule — clause', () => {
	it('behaves like optional, wrapping the body in a conditional keyed by the clause name', () => {
		const body: SeqRule = {
			type: 'seq',
			members: [
				{ type: 'string', value: ':' },
				{
					type: 'field',
					name: 'return_type',
					content: { type: 'symbol', name: 'type', id: 's3' },
					id: 'f8'
				}
			]
		};
		const rule: ClauseRule = { type: 'clause', name: 'return_type', content: body };
		const slot = makeSlot({
			name: 'return_type',
			propertyName: 'returnType',
			storageName: 'return_type'
		});
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['f8', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitRule(rule, ctx)).toBe(
			'{%- if returnType | isPresent %}:{{ returnType }}{%- endif %}'
		);
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
