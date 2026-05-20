/**
 * Per-modelType emit tests for the new template emitter
 * (Task 2.4 of PR1 — rule-attributes-and-template-emitter refactor).
 *
 * Each emit function (branch / group / multi / polymorph) is exercised
 * with a minimal in-memory fixture: an AssembledNode-shaped mock that
 * only carries the fields each function reads (`modelType`, `rule`,
 * and — for polymorph — `forms` with `.name` + `.rule`).
 *
 * Polymorph emission aggregates per-form templates inside
 * `{%- if $variant == "X" -%}...{%- endif -%}` guards; the other three
 * modelTypes are thin pass-throughs into `emitRule(node.rule, ctx)`.
 */

import { describe, expect, it } from 'vitest';
import type {
	FieldRule,
	Repeat1Rule,
	RepeatRule,
	Rule,
	SeqRule,
	StringRule,
	SymbolRule
} from '../../compiler/rule.ts';
import type {
	AssembledBranch,
	AssembledGroup,
	AssembledMulti,
	AssembledNonterminal,
	AssembledPolymorph
} from '../../compiler/node-map.ts';
import {
	emitBranchTemplate,
	emitGroupTemplate,
	emitMultiTemplate,
	emitPolymorphTemplate,
	type EmitCtx
} from '../templates.ts';

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

// Minimal mock factories — the per-modelType emit functions only read
// `node.rule` (or `node.forms`); the rest of the AssembledNode surface is
// irrelevant for these unit tests.
function mockBranch(rule: Rule): AssembledBranch {
	return { modelType: 'branch', rule } as unknown as AssembledBranch;
}

function mockGroup(rule: Rule, name = 'g'): AssembledGroup {
	return { modelType: 'group', rule, name } as unknown as AssembledGroup;
}

function mockMulti(rule: RepeatRule | Repeat1Rule): AssembledMulti {
	return { modelType: 'multi', rule } as unknown as AssembledMulti;
}

function mockPolymorph(forms: AssembledGroup[]): AssembledPolymorph {
	return { modelType: 'polymorph', forms } as unknown as AssembledPolymorph;
}

describe('emitBranchTemplate', () => {
	it('emits a single literal for a string-only rule', () => {
		const rule: StringRule = { type: 'string', value: 'fn' };
		expect(emitBranchTemplate(mockBranch(rule), makeCtx())).toBe('fn');
	});

	it('emits literal + slot for a seq with a field', () => {
		const inner: SymbolRule = { type: 'symbol', name: 'identifier', id: 'r1' };
		const fieldRule: FieldRule = { type: 'field', name: 'name', content: inner, id: 'f1' };
		const rule: SeqRule = {
			type: 'seq',
			members: [{ type: 'string', value: 'fn ' }, fieldRule]
		};
		const slot = makeSlot({ name: 'name', propertyName: 'name', storageName: 'name' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['f1', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitBranchTemplate(mockBranch(rule), ctx)).toBe('fn {{ name }}');
	});

	it('emits multiple slots interleaved with literals', () => {
		const a: FieldRule = {
			type: 'field',
			name: 'left',
			content: { type: 'symbol', name: 'expression', id: 'rL' },
			id: 'fL'
		};
		const b: FieldRule = {
			type: 'field',
			name: 'right',
			content: { type: 'symbol', name: 'expression', id: 'rR' },
			id: 'fR'
		};
		const rule: SeqRule = {
			type: 'seq',
			members: [a, { type: 'string', value: ' + ' }, b]
		};
		const slotL = makeSlot({ name: 'left', propertyName: 'left', storageName: 'left' });
		const slotR = makeSlot({ name: 'right', propertyName: 'right', storageName: 'right' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([
					['fL', slotL],
					['fR', slotR]
				]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitBranchTemplate(mockBranch(rule), ctx)).toBe('{{ left }} + {{ right }}');
	});
});

describe('emitGroupTemplate', () => {
	it('emits a single literal for a string-only rule', () => {
		const rule: StringRule = { type: 'string', value: 'pub' };
		expect(emitGroupTemplate(mockGroup(rule), makeCtx())).toBe('pub');
	});

	it('emits literal + slot for a seq with a field', () => {
		const inner: SymbolRule = { type: 'symbol', name: 'identifier', id: 'rg1' };
		const fieldRule: FieldRule = { type: 'field', name: 'name', content: inner, id: 'fg1' };
		const rule: SeqRule = {
			type: 'seq',
			members: [{ type: 'string', value: 'mod ' }, fieldRule]
		};
		const slot = makeSlot({ name: 'name', propertyName: 'name', storageName: 'name' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['fg1', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitGroupTemplate(mockGroup(rule), ctx)).toBe('mod {{ name }}');
	});
});

describe('emitMultiTemplate', () => {
	it('emits a list slot when the inner is a field', () => {
		const innerSym: SymbolRule = { type: 'symbol', name: 'item', id: 'rm1' };
		const innerField: FieldRule = {
			type: 'field',
			name: 'items',
			content: innerSym,
			id: 'fm1',
			multiplicity: 'array'
		};
		const rule: RepeatRule = { type: 'repeat', content: innerField };
		const slot = makeSlot({ name: 'items', propertyName: 'items', storageName: 'items' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['fm1', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitMultiTemplate(mockMulti(rule), ctx)).toBe('{{ items | join(" ") }}');
	});

	it('honours the repeat separator for repeat1', () => {
		const innerSym: SymbolRule = { type: 'symbol', name: 'item', id: 'rm2' };
		const innerField: FieldRule = {
			type: 'field',
			name: 'items',
			content: innerSym,
			id: 'fm2',
			multiplicity: 'array',
			separator: ','
		};
		const rule: Repeat1Rule = { type: 'repeat1', content: innerField, separator: ',' };
		const slot = makeSlot({ name: 'items', propertyName: 'items', storageName: 'items' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['fm2', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitMultiTemplate(mockMulti(rule), ctx)).toBe('{{ items | join(",") }}');
	});
});

describe('emitPolymorphTemplate', () => {
	it('emits a single `$variant`-guarded body for a one-form polymorph', () => {
		const rule: StringRule = { type: 'string', value: 'A' };
		const form = mockGroup(rule, 'formA');
		expect(emitPolymorphTemplate(mockPolymorph([form]), makeCtx())).toBe(
			'{%- if $variant == "formA" -%}A{%- endif -%}'
		);
	});

	it('aggregates two forms into separate `$variant` guards', () => {
		const ruleA: StringRule = { type: 'string', value: 'A' };
		const ruleB: StringRule = { type: 'string', value: 'B' };
		const formA = mockGroup(ruleA, 'formA');
		const formB = mockGroup(ruleB, 'formB');
		const out = emitPolymorphTemplate(mockPolymorph([formA, formB]), makeCtx());
		expect(out).toBe(
			'{%- if $variant == "formA" -%}A{%- endif -%}' +
				'{%- if $variant == "formB" -%}B{%- endif -%}'
		);
	});

	it('emits Jinja slots inside each form body', () => {
		const symA: SymbolRule = { type: 'symbol', name: 'expression', id: 'rpa' };
		const fieldA: FieldRule = { type: 'field', name: 'left', content: symA, id: 'fpa' };
		const ruleA: SeqRule = {
			type: 'seq',
			members: [fieldA, { type: 'string', value: ' + ' }, fieldA]
		};
		const ruleB: StringRule = { type: 'string', value: 'B' };
		const slotL = makeSlot({ name: 'left', propertyName: 'left', storageName: 'left' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['fpa', slotL]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		const formA = mockGroup(ruleA, 'binary');
		const formB = mockGroup(ruleB, 'literal');
		expect(emitPolymorphTemplate(mockPolymorph([formA, formB]), ctx)).toBe(
			'{%- if $variant == "binary" -%}{{ left }} + {{ left }}{%- endif -%}' +
				'{%- if $variant == "literal" -%}B{%- endif -%}'
		);
	});

	it('emits empty string for a polymorph with no forms', () => {
		expect(emitPolymorphTemplate(mockPolymorph([]), makeCtx())).toBe('');
	});
});
