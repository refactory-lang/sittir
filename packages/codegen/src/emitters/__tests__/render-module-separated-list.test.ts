/**
 * render-module.ts — 'separatedList' render wiring (separator-as-slot Task 5).
 *
 * Covers:
 * - renderTransportDataStruct: `leading_sep`/`trailing_sep`/`separator_kind`
 *   sibling transport-struct fields, gated on leadingMode/trailingMode/
 *   separatorRule exactly like wrap.ts's `emitSeparatedListWrap` wire capture.
 * - buildTypedTemplateBody: real `leading`/`trailing`/`separator` expressions
 *   in the emitted `ListNonterminalView` for 'separatedList' kinds, instead
 *   of the hardcoded `false`/literal every other list-shaped slot still uses.
 */

import { CHOICE, FIELD, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledPattern, AssembledSeparatedList, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { Repeat1Rule, RepeatRule, Rule, SeqRule } from '../../types/rule.ts';
import type { GeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';
import { emitRenderModule } from '../render-module.ts';

const MEMBER_ELEMENT_RULE: Rule<'link'> = { type: SYMBOL, name: 'member' };

function makeMemberNodeMap(rule: Repeat1Rule | RepeatRule, opts: { separatorRule: Rule<'link'> | undefined }) {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'member_list',
		new AssembledSeparatedList('member_list', rule, undefined, {
			separatorRule: opts.separatorRule,
			simplifiedRule: MEMBER_ELEMENT_RULE,
			renderRule: MEMBER_ELEMENT_RULE
		})
	);
	nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

/**
 * Plain 'branch' node with a repeated NAMED field ('items', a list-shaped
 * slot just like AssembledSeparatedList's content) — used to prove the
 * `node instanceof AssembledSeparatedList` guard in buildTypedTemplateBody
 * actually scopes the real leading/trailing/separator wiring to
 * 'separatedList' kinds only, and doesn't leak onto ordinary list-shaped
 * fields on other modelTypes (the exact mis-scoping class PR-T's original,
 * reverted Task 4 attempt had).
 */
function makeBranchWithListFieldNodeMap() {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'items',
				content: {
					type: REPEAT1,
					content: { type: SYMBOL, name: 'member' }
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('branch_with_list_field', new AssembledBranch('branch_with_list_field', parentRule, deleteWrapper(parentRule), deleteWrapper(parentRule)));
	nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

const GENERATED_ID_TABLES: GeneratedIdTables = {
	kindIds: {
		member_list: 1,
		member: 2,
		comma: {
			id: 3,
			parser: { cSymbol: 'anon_sym_COMMA', parserName: 'comma', symbolName: ',', anon: true, aux: false, alias: false, hidden: false }
		},
		semi: {
			id: 4,
			parser: { cSymbol: 'anon_sym_SEMI', parserName: 'semi', symbolName: ';', anon: true, aux: false, alias: false, hidden: false }
		}
	},
	sourceArtifact: 'test'
};

describe('renderTransportDataStruct — separatedList sibling fields', () => {
	it('emits leading_sep/trailing_sep/separator_kind for a nonterminal separator with both flanks optional', () => {
		const sepChoice: Rule<'link'> = {
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		};
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: sepChoice, trailing: true, leading: true }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: sepChoice });
		const emitted = emitRenderModule('rust', [], nodeMap, GENERATED_ID_TABLES).transportRs.contents;

		expect(emitted).toContain('pub leading_sep: Option<bool>,');
		expect(emitted).toContain('pub trailing_sep: Option<bool>,');
		expect(emitted).toContain('pub separator_kind: Option<u16>,');
		expect(emitted).toContain('napi(js_name = "_leading_sep")');
		expect(emitted).toContain('napi(js_name = "_trailing_sep")');
		expect(emitted).toContain('napi(js_name = "_separator_kind")');
	});

	it('omits separator_kind and leading_sep for a literal-separator node with only an optional trailing flank', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' }, trailing: true }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule('rust', [], nodeMap, GENERATED_ID_TABLES).transportRs.contents;

		expect(emitted).not.toContain('pub separator_kind:');
		expect(emitted).not.toContain('pub leading_sep:');
		expect(emitted).toContain('pub trailing_sep: Option<bool>,');
	});

	it('emits no sibling fields at all for a mandatory (non-optional) literal separator', () => {
		const rule: RepeatRule = {
			type: REPEAT,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' } }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule('rust', [], nodeMap, GENERATED_ID_TABLES).transportRs.contents;

		expect(emitted).not.toContain('pub separator_kind:');
		expect(emitted).not.toContain('pub leading_sep:');
		expect(emitted).not.toContain('pub trailing_sep:');
	});
});

describe('buildTypedTemplateBody — separatedList ListNonterminalView wiring', () => {
	it('resolves leading/trailing from the transport-struct fields and separator via a KindId match, for a nonterminal separator with both flanks optional', () => {
		const sepChoice: Rule<'link'> = {
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		};
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: sepChoice, trailing: true, leading: true }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: sepChoice });
		const emitted = emitRenderModule(
			'rust',
			[{ filename: 'member_list.jinja', content: '{# @generated #}\n{{ member | join(", ") }}' }],
			nodeMap,
			GENERATED_ID_TABLES
		).transportRs.contents;

		expect(emitted).toContain('leading: node.leading_sep.unwrap_or(false),');
		expect(emitted).toContain('trailing: node.trailing_sep.unwrap_or(false),');
		expect(emitted).toContain('separator: match node.separator_kind {');
		expect(emitted).toContain('Some(3) => ",",');
		expect(emitted).toContain('Some(4) => ";",');
	});

	it('emits literal false/false and the plain literal separator for a mandatory literal separator (no capture fields)', () => {
		const rule: RepeatRule = {
			type: REPEAT,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' } }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule(
			'rust',
			[{ filename: 'member_list.jinja', content: '{# @generated #}\n{{ member | join(", ") }}' }],
			nodeMap,
			GENERATED_ID_TABLES
		).transportRs.contents;

		expect(emitted).toContain('leading: false,');
		expect(emitted).toContain('trailing: false,');
		expect(emitted).toMatch(/separator: ",",/);
		expect(emitted).not.toContain('separator: match node.separator_kind');
	});

	it('resolves only trailing from the transport-struct field for a literal separator with an optional trailing flank', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' }, trailing: true }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule(
			'rust',
			[{ filename: 'member_list.jinja', content: '{# @generated #}\n{{ member | join(", ") }}' }],
			nodeMap,
			GENERATED_ID_TABLES
		).transportRs.contents;

		expect(emitted).toContain('leading: false,');
		expect(emitted).toContain('trailing: node.trailing_sep.unwrap_or(false),');
	});

	it('resolves only leading from the transport-struct field for a literal separator with an optional leading flank (mirror of the trailing-only case)', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' }, leading: true }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule(
			'rust',
			[{ filename: 'member_list.jinja', content: '{# @generated #}\n{{ member | join(", ") }}' }],
			nodeMap,
			GENERATED_ID_TABLES
		).transportRs.contents;

		expect(emitted).toContain('leading: node.leading_sep.unwrap_or(false),');
		expect(emitted).toContain('trailing: false,');
	});

	it('leaves a plain branch kind\'s list-shaped field hardcoded leading:false/trailing:false and a plain literal separator (guard scoping)', () => {
		const nodeMap = makeBranchWithListFieldNodeMap();
		const emitted = emitRenderModule(
			'rust',
			[{ filename: 'branch_with_list_field.jinja', content: '{# @generated #}\n{{ items | join(", ") }}' }],
			nodeMap,
			GENERATED_ID_TABLES
		).transportRs.contents;

		expect(emitted).not.toContain('pub leading_sep:');
		expect(emitted).not.toContain('pub trailing_sep:');
		expect(emitted).not.toContain('pub separator_kind:');
		expect(emitted).toContain('leading: false,');
		expect(emitted).toContain('trailing: false,');
		expect(emitted).not.toContain('separator: match node.separator_kind');
	});
});
