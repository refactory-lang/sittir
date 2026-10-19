/**
 * render-module.ts — 'separatedList' render wiring (separator-as-slot Task 5).
 *
 * Covers:
 * - renderNodeDataStruct: `delimiter`/`separator_kind`
 *   sibling node-struct fields, gated on leadingDelimiter/trailingDelimiter/
 *   separatorRule exactly like wrap.ts's `emitSeparatedListWrap` wire capture.
 * - buildTypedTemplateBody: real `leading`/`trailing`/`separator` expressions
 *   in the emitted `ListView` for 'separatedList' kinds, instead
 *   of the hardcoded `false`/literal every other list-shaped slot still uses.
 */

import { collectGeneratedKindEntries } from '../../dsl/symbol-table.ts';
import { emittedTemplates } from './support/emitted-templates.ts';
import { slot } from '../render-body.ts';
import { CHOICE, FIELD, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { preference } from '../../dsl/primitives/preference.ts';
import {
	AssembledBranch,
	AssembledPattern,
	AssembledSupertype,
	AssembledList,
	type AssembledNode,
	type SeparatedListElementRule
} from '../../compiler/model/node-map.ts';
import type { SeqRule, SimplifiedRule, RenderRule } from '../../types/rule.ts';
import type { GeneratedIdTables } from '../../dsl/symbol-table.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flatten } from '../../compiler/flatten.ts';
import { emitRenderModule } from '../render-module.ts';

// A bare SYMBOL rule is structurally identical across compiler phases, but
// `simplifiedRule`/`renderRule` are nominally branded (SimplifiedRule/RenderRule
// each carry a distinct `__brand?: never` marker) — one single-typed constant
// can't satisfy both, so each gets its own phase-typed declaration.
const MEMBER_ELEMENT_SIMPLIFIED_RULE: SimplifiedRule = { type: SYMBOL, name: 'member', multiplicity: 'array' };
const MEMBER_ELEMENT_RENDER_RULE: RenderRule = { type: SYMBOL, name: 'member', multiplicity: 'array' };

function makeMemberNodeMap(rule: SeparatedListElementRule, opts: { separatorRule: RenderRule | undefined }) {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'member_list',
		new AssembledList('member_list', rule, undefined, {
			separatorRule: opts.separatorRule,
			kindEntries: collectGeneratedKindEntries(GENERATED_ID_TABLES),
			simplifiedRule: MEMBER_ELEMENT_SIMPLIFIED_RULE,
			renderRule: MEMBER_ELEMENT_RENDER_RULE
		})
	);
	nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('_layout', new AssembledSupertype('_layout', { type: 'SUPERTYPE', name: '_layout', subtypes: [] } as never, []));
	return makeNodeMapWith(nodes);
}

/**
 * Plain 'branch' node with a repeated NAMED field ('items', a list-shaped
 * slot just like AssembledList's content) — used to prove the
 * `node instanceof AssembledList` guard in buildTypedTemplateBody
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
	const parentRender = flatten(parentRule);
	nodes.set('branch_with_list_field', new AssembledBranch('branch_with_list_field', parentRender, parentRender));
	nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('_layout', new AssembledSupertype('_layout', { type: 'SUPERTYPE', name: '_layout', subtypes: [] } as never, []));
	return makeNodeMapWith(nodes);
}

const GENERATED_ID_TABLES: GeneratedIdTables = {
	kindIds: {
		branch_with_list_field: 5,
		member_list: 1,
		member: 2,
		comma: {
			id: 3,
			parser: {
				cSymbol: 'anon_sym_COMMA',
				parserName: 'comma',
				symbolName: ',', literalText: ',',
				anon: true,
				aux: false,
				alias: false,
				hidden: false
			}
		},
		semi: {
			id: 4,
			parser: {
				cSymbol: 'anon_sym_SEMI',
				parserName: 'semi',
				symbolName: ';', literalText: ';',
				anon: true,
				aux: false,
				alias: false,
				hidden: false
			}
		}
	},
	fieldIds: { items: 1 },
	sourceArtifact: 'test'
};

describe('renderNodeDataStruct — separatedList sibling fields', () => {
	it('emits delimiter/separator_kind for a nonterminal separator with both flanks optional', () => {
		const sepChoice: RenderRule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		};
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: sepChoice, trailing: 'optional', leading: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: sepChoice });
		const emitted = emitRenderModule('rust', emittedTemplates({}), nodeMap, GENERATED_ID_TABLES).nodeRs.contents;

		expect(emitted).toContain('pub delimiter: Option<::sittir_core::types::Delimiter>,');
		expect(emitted).toContain('pub separator_kind: Option<KindId>,');
		expect(emitted).toContain('wire(key = "_delimiter")');
		expect(emitted).toContain('wire(key = "_separator")');
	});

	it('omits separator_kind for a literal-separator node with only an optional trailing flank', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule('rust', emittedTemplates({}), nodeMap, GENERATED_ID_TABLES).nodeRs.contents;

		expect(emitted).not.toContain('pub separator_kind:');
		expect(emitted).toContain('pub delimiter: Option<::sittir_core::types::Delimiter>,');
	});

	it('emits no sibling fields at all for a mandatory (non-optional) literal separator', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'array',
			separator: { value: { type: STRING, value: ',' } }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule('rust', emittedTemplates({}), nodeMap, GENERATED_ID_TABLES).nodeRs.contents;

		expect(emitted).not.toContain('pub separator_kind:');
		expect(emitted).not.toContain('pub delimiter:');
	});
});

describe('buildTypedTemplateBody — separatedList ListView wiring', () => {
	it('resolves leading/trailing from the node-struct fields and separator via a KindId match, for a nonterminal separator with both flanks optional', () => {
		const sepChoice: RenderRule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		};
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: sepChoice, trailing: 'optional', leading: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: sepChoice });
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ member_list: slot('member') }),
			nodeMap,
			GENERATED_ID_TABLES
		).nodeRs.contents;

		expect(emitted).toContain('leading: node.delimiter().is_some_and(|d| d.has(::sittir_core::types::Delimiter::LEADING)),');
		expect(emitted).toContain('trailing: node.delimiter().is_some_and(|d| d.has(::sittir_core::types::Delimiter::TRAILING)),');
		expect(emitted).toMatch(/let member_separator: fn\(KindId\) -> &'static str = \|kind\| match kind \{ KindId\(3\) => ",", KindId\(4\) => ";", _ => [^}]+ \};/);
		expect(emitted).toContain('token: node.separator_kind().map_or(');
		expect(emitted).toContain('separators: Some((::sittir_core::layout::BodyLayout::slot_tokens(node.layout(), "_member"), member_separator)),');
	});

	it('fills separator_kind from the declared separator site and falls back to the declared token', () => {
		const sepChoice: RenderRule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		};
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: sepChoice, trailing: 'optional', leading: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: sepChoice });
		const emitted = emitRenderModule('rust', emittedTemplates({ member_list: slot('member') }), nodeMap, GENERATED_ID_TABLES, {
			renderRules: { rules: {} },
			options: { member_list: { 'member:/separator/kind': preference('semi') } } as never
		}).nodeRs.contents;

		expect(emitted).toContain('::sittir_core::prepare::Setting::fill(&mut parts.separator_kind, overlay, ctx.options.site_arm(options::SITE_MEMBER_LIST_MEMBER_SEPARATOR).arm);');
		expect(emitted).toContain('let chosen = ::sittir_core::prepare::Setting::chosen(&parts.separator_kind, overlay);');
		expect(emitted).toContain('if let Some(tokens) = ::sittir_core::prepare::SlotTarget::separators(&parts.member, overlay, MemberListNode::separator_kind_of, ctx).filter(|_| !chosen) {');
		expect(emitted).toContain('_ => ";" };');
	});

	it('hardcodes leading: true for a mandatory leading flank while trailing still reads the wire-captured optional flank', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, leading: 'mandatory', trailing: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ member_list: slot('member') }),
			nodeMap,
			GENERATED_ID_TABLES
		).nodeRs.contents;

		expect(emitted).toContain('leading: true,');
		expect(emitted).toContain('trailing: node.delimiter().is_some_and(|d| d.has(::sittir_core::types::Delimiter::TRAILING)),');
		// A 'mandatory' flank has no per-instance capture — no leading_sep field.
		expect(emitted).toContain('pub delimiter: Option<::sittir_core::types::Delimiter>,');
	});

	it('emits literal false/false and the plain literal separator for a mandatory literal separator (no capture fields)', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'array',
			separator: { value: { type: STRING, value: ',' } }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ member_list: slot('member') }),
			nodeMap,
			GENERATED_ID_TABLES
		).nodeRs.contents;

		expect(emitted).toContain('leading: false,');
		expect(emitted).toContain('trailing: false,');
		expect(emitted).toMatch(/token: ",",/);
		expect(emitted).not.toContain('separator: match node.separator_kind');
	});

	it('resolves only trailing from the node-struct field for a literal separator with an optional trailing flank', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ member_list: slot('member') }),
			nodeMap,
			GENERATED_ID_TABLES
		).nodeRs.contents;

		expect(emitted).toContain('leading: false,');
		expect(emitted).toContain('trailing: node.delimiter().is_some_and(|d| d.has(::sittir_core::types::Delimiter::TRAILING)),');
	});

	it('resolves only leading from the node-struct field for a literal separator with an optional leading flank (mirror of the trailing-only case)', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, leading: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ member_list: slot('member') }),
			nodeMap,
			GENERATED_ID_TABLES
		).nodeRs.contents;

		expect(emitted).toContain('leading: node.delimiter().is_some_and(|d| d.has(::sittir_core::types::Delimiter::LEADING)),');
		expect(emitted).toContain('trailing: false,');
	});

	it("leaves a plain branch kind's list-shaped field hardcoded leading:false/trailing:false and a plain literal separator (guard scoping)", () => {
		const nodeMap = makeBranchWithListFieldNodeMap();
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ branch_with_list_field: slot('items') }),
			nodeMap,
			GENERATED_ID_TABLES
		).nodeRs.contents;

		expect(emitted).not.toContain('pub delimiter:');
		expect(emitted).not.toContain('pub separator_kind:');
		expect(emitted).toContain('leading: false,');
		expect(emitted).toContain('trailing: false,');
		expect(emitted).not.toContain('separator: match node.separator_kind');
	});
});
