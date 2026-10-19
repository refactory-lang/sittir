import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { emittedTemplates } from './support/emitted-templates.ts';
import { EMPTY, slot } from '../render-body.ts';
import { describe, expect, it } from 'vitest';

import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype
} from '../../compiler/model/node-map.ts';
import type { GeneratedIdTables, GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { emitRenderModule } from '../render-module.ts';
import { PAYLOAD_CEILING_BYTES } from '../boxed-payloads.ts';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flatten } from '../../compiler/flatten.ts';

const nodeMapWith = makeNodeMapWith;

const MINIMAL_TOKENS = { semi: ';', plus: '+', minus: '-' };

function makeMinimalNodeMap(kindEntries: readonly GeneratedKindEntry[]): NodeMap {
	const opts = { kindEntries };
	const callRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'callee',
				content: { type: SYMBOL, name: '_expression' }
			},
			{
				type: FIELD,
				name: 'keyword',
				content: { type: SYMBOL, name: 'kw_fn' }
			},
			{
				type: FIELD,
				name: 'operator',
				content: { type: SYMBOL, name: 'operator' }
			},
			{
				type: FIELD,
				name: 'semicolon',
				content: { type: REPEAT, content: { type: STRING, value: ';' } }
			}
		]
	};
	const expressionRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'call_expression' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('call_expression', new AssembledBranch('call_expression', flatten(callRule), flatten(callRule), opts));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }, opts));
	nodes.set('kw_fn', new AssembledKeyword('kw_fn', { type: STRING, value: 'fn' }, opts));
	nodes.set('self', new AssembledKeyword('self', { type: STRING, value: 'self' }, opts));
	nodes.set(
		'operator',
		new AssembledEnum(
			'operator',
			{
				type: CHOICE,
				members: [
					{ type: STRING, value: '+' },
					{ type: STRING, value: '-' }
				]
			},
			opts
		)
	);
	nodes.set(
		'_expression',
		new AssembledSupertype('_expression', expressionRule, [{ name: 'identifier' }, { name: 'call_expression' }], opts)
	);
	return nodeMapWith(nodes);
}

function makeRequiredChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('child_parent', new AssembledBranch('child_parent', flatten(parentRule), flatten(parentRule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeOptionalChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: OPTIONAL,
				content: { type: SYMBOL, name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('optional_parent', new AssembledBranch('optional_parent', flatten(parentRule), flatten(parentRule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeRepeatedChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: REPEAT1,
				content: { type: SYMBOL, name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('repeated_parent', new AssembledBranch('repeated_parent', flatten(parentRule), flatten(parentRule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeRepeatedFieldNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'items',
				content: {
					type: REPEAT1,
					content: { type: SYMBOL, name: 'identifier' }
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'repeated_field_parent',
		new AssembledBranch('repeated_field_parent', flatten(parentRule), flatten(parentRule))
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeOptionalRepeatedFieldNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'items',
				content: {
					type: REPEAT,
					content: { type: SYMBOL, name: 'identifier' }
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'optional_repeated_field_parent',
		new AssembledBranch('optional_repeated_field_parent', flatten(parentRule), flatten(parentRule))
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeReservedNestedSupertypeNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'value',
				content: { type: SYMBOL, name: '_expression' }
			}
		]
	};
	const literalRule: ChoiceRule = {
		type: CHOICE,
		members: [{ type: SYMBOL, name: 'string_literal' }]
	};
	const expressionRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: '_literal' },
			{ type: SYMBOL, name: 'identifier' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('parent_expression', new AssembledBranch('parent_expression', flatten(parentRule), flatten(parentRule)));
	nodes.set('string_literal', new AssembledPattern('string_literal', { type: PATTERN, value: '".*"' }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('_literal', new AssembledSupertype('_literal', literalRule, [{ name: 'string_literal' }]));
	nodes.set(
		'_expression',
		new AssembledSupertype('_expression', expressionRule, [{ name: '_literal' }, { name: 'identifier' }])
	);
	return nodeMapWith(nodes);
}

function makeSupertypeAndSubtypeChildrenNodeMap(): NodeMap {
	const parentRule: ChoiceRule<'link'> = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: '_expression' },
			{ type: SYMBOL, name: 'identifier' }
		]
	};
	const expressionRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'call_expression' }
		]
	};
	const callRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'supertype_alias_parent',
		new AssembledBranch('supertype_alias_parent', flatten(parentRule), flatten(parentRule))
	);
	nodes.set(
		'_expression',
		new AssembledSupertype('_expression', expressionRule, [{ name: 'identifier' }, { name: 'call_expression' }])
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('call_expression', new AssembledBranch('call_expression', flatten(callRule), flatten(callRule)));
	return nodeMapWith(nodes);
}

function makeHiddenWrapperChildEnumNodeMap(): NodeMap {
	const wrapperRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const parentRule: ChoiceRule<'link'> = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: '_wrapped_item' },
			{ type: SYMBOL, name: 'integer' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'hidden_wrapper_parent',
		new AssembledBranch('hidden_wrapper_parent', flatten(parentRule), flatten(parentRule))
	);
	nodes.set('_wrapped_item', new AssembledBranch('_wrapped_item', flatten(wrapperRule), flatten(wrapperRule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('integer', new AssembledPattern('integer', { type: PATTERN, value: '[0-9]+' }));
	return nodeMapWith(nodes);
}

function makeOptionalRepeatedChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: REPEAT,
				content: { type: SYMBOL, name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'optional_repeated_parent',
		new AssembledBranch('optional_repeated_parent', flatten(parentRule), flatten(parentRule))
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeTransparentStatementWrapperNodeMap(): NodeMap {
	const wrapperRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: '_simple_statement' }]
	};
	const moduleRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: REPEAT1,
				content: { type: SYMBOL, name: '_statement' }
			}
		]
	};
	const simpleStatementRule: ChoiceRule = {
		type: CHOICE,
		members: [{ type: SYMBOL, name: 'expression_statement' }]
	};
	const statementRule: ChoiceRule = {
		type: CHOICE,
		members: [{ type: SYMBOL, name: '_simple_statements' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'_simple_statement',
		new AssembledSupertype('_simple_statement', simpleStatementRule, [{ name: 'expression_statement' }])
	);
	nodes.set('_statement', new AssembledSupertype('_statement', statementRule, [{ name: '_simple_statements' }]));
	nodes.set(
		'_simple_statements',
		new AssembledBranch('_simple_statements', flatten(wrapperRule), flatten(wrapperRule))
	);
	nodes.set('expression_statement', new AssembledPattern('expression_statement', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('module', new AssembledBranch('module', flatten(moduleRule), flatten(moduleRule)));
	return nodeMapWith(nodes);
}

// Mirrors `field_expression.field` from tree-sitter-rust: a named field whose
// `types` list is `field_identifier | integer_literal` — two distinct concrete
// kinds with no grammar supertype covering both. Under cleanup-rules §E1, such
// a named heterogeneous field should also get a per-slot typed enum.
function makeNamedHeterogeneousFieldNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'field',
				content: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'field_identifier' },
						{ type: SYMBOL, name: 'integer_literal' }
					]
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('field_expression', new AssembledBranch('field_expression', flatten(parentRule), flatten(parentRule)));
	nodes.set(
		'field_identifier',
		new AssembledPattern('field_identifier', { type: PATTERN, value: '[a-zA-Z_][a-zA-Z0-9_]*' })
	);
	nodes.set('integer_literal', new AssembledPattern('integer_literal', { type: PATTERN, value: '[0-9]+' }));
	return nodeMapWith(nodes);
}

function makeSupertypeBackedChildEnumNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: REPEAT1,
				content: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'pair' },
						{ type: SYMBOL, name: '_shorthand_property_identifier' }
					]
				}
			}
		]
	};
	const pairRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const shorthandRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: '_reserved_identifier' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('object_like', new AssembledBranch('object_like', flatten(parentRule), flatten(parentRule)));
	nodes.set('pair', new AssembledBranch('pair', flatten(pairRule), flatten(pairRule)));
	nodes.set(
		'_shorthand_property_identifier',
		new AssembledSupertype('_shorthand_property_identifier', shorthandRule, [
			{ name: 'identifier' },
			{ name: '_reserved_identifier' }
		])
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('_reserved_identifier', new AssembledPattern('_reserved_identifier', { type: PATTERN, value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

describe('native node emission', () => {
	it('boxes a pinned payload, asserts it over the ceiling, and refuses a pin no choice holds', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeMinimalNodeMap, MINIMAL_TOKENS);
		const templates = emittedTemplates({ call_expression: slot('callee') });
		const emitted = emitRenderModule('rust', templates, nodeMap, generatedIdTables, { boxedPayloads: ['CallExpressionNode'] }).nodeRs.contents;
		expect(emitted).toContain('    CallExpression(Box<CallExpressionNode>),');
		expect(emitted).toMatch(new RegExp(`^const _: \\(\\) = assert!\\(::core::mem::size_of::<CallExpressionNode>\\(\\) > ${PAYLOAD_CEILING_BYTES}, "`, 'm'));
		expect(() => emitRenderModule('rust', templates, nodeMap, generatedIdTables, { boxedPayloads: ['UnheldNode'] })).toThrow(
			'UnheldNode is pinned in boxed-payloads.ts but no choice holds it'
		);
	});

	it('emits node-oriented Rust render support', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeMinimalNodeMap, MINIMAL_TOKENS);
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ call_expression: slot('callee') }),
			nodeMap,
			generatedIdTables
		);

		expect(emitted.nodeRs.contents).toContain('pub enum AnyNode');
		expect(emitted.nodeRs.contents).toContain('#[node(choice, view = AnyNodeRecord)]\npub enum AnyNode {');
		expect(emitted.nodeRs.contents).toContain('CallExpression(CallExpressionNode),');
		expect(emitted.nodeRs.contents).toContain('pub struct CallExpressionNode');
		expect(emitted.nodeRs.contents).toContain('pub callee: ::sittir_core::SlotValue<ExpressionNode>,');
		expect(emitted.nodeRs.contents).toMatch(/pub enum AnyNode \{[^}]*\n    #\[kind\(kind::SEMI\)\]\n    Semi,/);
		expect(emitted.nodeRs.contents).not.toContain('pub struct LiteralNode');
		// The render entry points are `render_node_dispatch` and
		// `render_node_parts`; no standalone `from_node` bridge exists.
		expect(emitted.nodeRs.contents).toContain('pub fn render_node_dispatch');
		expect(emitted.nodeRs.contents).toContain('pub fn render_node_parts');
		expect(emitted.nodeRs.contents).not.toContain('renderable native node bridge pending');
		// Legacy UntypedNode render shim (render_dispatch / render_nodedata_into) is
		// retired (PR-E2 retired bridge.rs/dispatch.rs; the emitter shim is now
		// deleted too). lib.rs uses the node path only.
		expect(emitted.libRs.contents).not.toContain('render_dispatch');
		expect(emitted.libRs.contents).not.toContain('render_nodedata_into');
		expect(emitted.libRs.contents).toContain(
			'pub use node::{render_node_dispatch, render_node_parts, AnyNode, RenderRoot};'
		);
		expect(emitted.nodeRs.contents).not.toContain('AnyNode::UntypedNode');
		expect(emitted.nodeRs.contents).not.toContain('node_json');
		// (No blanket "JSON" ban — a legitimate `JSON.stringify` mention now
		// appears in an unrelated FromNapiValue error-message doc comment. The
		// two checks above already pin the retirement of the legacy bridge.)
	});

	// Kind-named slots (docs/superpowers/specs/2026-05-17-kind-named-slots-design.md)
	// unified naming ACROSS emitters, including this Rust node layer:
	// unnamed positional children now use their own kind-derived field name
	// (`_identifier`/`identifier`) instead of the generic `$children`/`children`
	// key. The remaining cases below update field names accordingly.
	it('emits optional children as Option<T> node', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeOptionalChildrenNodeMap);
		const rust = emitRenderModule(
			'rust',
			emittedTemplates({ optional_parent: EMPTY }),
			nodeMap,
			generatedIdTables
		).nodeRs.contents;

		expect(rust).toContain(
			'#[wire(key = "_identifier")]\n    #[slot(word = 2, width = 5)]\n    pub identifier: Option<::sittir_core::SlotValue<IdentifierNode>>,'
		);
		expect(rust).not.toContain('pub identifier: Option<Vec<');
		expect(rust).not.toContain('pub identifier: OneOrMany<');
	});

	it('emits required singular children as bare node values', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeRequiredChildrenNodeMap);
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ child_parent: EMPTY }),
			nodeMap,
			generatedIdTables
		);
		const start = emitted.nodeRs.contents.indexOf('pub struct ChildParentNode');
		const end = emitted.nodeRs.contents.indexOf('}', start);
		const structBody = emitted.nodeRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[wire(key = "_identifier")]\n    #[slot(word = 2, width = 5)]\n    pub identifier: ::sittir_core::SlotValue<IdentifierNode>,'
		);
		expect(structBody).not.toContain('pub identifier: Option<');
		expect(structBody).not.toContain('pub identifier: Vec<');
		expect(structBody).not.toContain('OneOrMany<');
	});

	it('falls back to a per-slot enum (expanded to concrete kinds) when a slot mixes a supertype ref with an explicit subtype ref', () => {
		// classifySlot (node-common.ts) only collapses a slot onto a bare
		// `<Supertype>Node` when the slot's kind set EXACTLY equals that
		// supertype's full resolved subtype set — a documented, deliberate
		// safety rule (a looser subset-collapse risked FromNapiValue recursing
		// through a wide/self-recursive supertype and overflowing the native
		// stack). This slot's raw kind set is {_expression, identifier} — the
		// supertype's OWN name plus one of its subtype's names, not a set
		// equal to {identifier, call_expression} — so it correctly falls to
		// `heterogeneous`, which expands to concrete kinds in a per-slot enum
		// (also renamed Child→Content, see kind-named-slots note above)
		// instead of collapsing to the supertype type directly.
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeSupertypeAndSubtypeChildrenNodeMap);
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ supertype_alias_parent: EMPTY }),
			nodeMap,
			generatedIdTables
		);
		const start = emitted.nodeRs.contents.indexOf('pub struct SupertypeAliasParentNode');
		const end = emitted.nodeRs.contents.indexOf('}', start);
		const structBody = emitted.nodeRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[wire(key = "_content")]\n    #[slot(word = 2, width = 5)]\n    pub content: ::sittir_core::SlotValue<SupertypeAliasParentContentNodeSlot>,'
		);
		expect(emitted.nodeRs.contents).toContain('pub enum SupertypeAliasParentContentNodeSlot {');
		expect(emitted.nodeRs.contents).toContain('Identifier(IdentifierNode),');
		expect(emitted.nodeRs.contents).toContain('CallExpression(CallExpressionNode),');
	});

	it('emits repeated children as a NonEmptyVec node instead of OneOrMany', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeRepeatedChildrenNodeMap);
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ repeated_parent: EMPTY }),
			nodeMap,
			generatedIdTables
		);
		const start = emitted.nodeRs.contents.indexOf('pub struct RepeatedParentNode');
		const end = emitted.nodeRs.contents.indexOf('}', start);
		const structBody = emitted.nodeRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[wire(key = "_identifier")]\n    #[slot(word = 2, width = 2, run = 5)]\n    pub identifier: ::sittir_core::NonEmptyVec<::sittir_core::SlotValue<IdentifierNode>>,'
		);
		expect(structBody).not.toContain('OneOrMany<');
	});

	it('emits optional repeated unnamed children as a Vec node, an empty list being [] (same rule as named fields)', () => {
		// rustNodeSlotType's `wrap()` applies one typing rule to named and
		// unnamed slots alike: a repeat1 list is a NonEmptyVec, any other list a
		// Vec, never optional. The sibling optional named-field case below takes
		// the same `wrap()` call to the same shape.
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeOptionalRepeatedChildrenNodeMap);
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ optional_repeated_parent: EMPTY }),
			nodeMap,
			generatedIdTables
		);
		const start = emitted.nodeRs.contents.indexOf('pub struct OptionalRepeatedParentNode');
		const end = emitted.nodeRs.contents.indexOf('}', start);
		const structBody = emitted.nodeRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[wire(key = "_identifier")]\n    #[slot(word = 2, width = 2, run = 5)]\n    pub identifier: Vec<::sittir_core::SlotValue<IdentifierNode>>,'
		);
	});

	it('widens statement unions through transparent hidden wrappers', () => {
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				_statement: 109,
				_simple_statements: 110,
				expression_statement: 122,
				module: 123
			},
			sourceArtifact: 'test'
		};
		const emitted = emitRenderModule(
			'python',
			emittedTemplates({ module: EMPTY }),
			makeTransparentStatementWrapperNodeMap(),
			generatedIdTables
		).nodeRs.contents;

		expect(emitted).toContain('pub enum StatementNode {');
		// SCC-driven Box rule (emitPerSlotChildEnum / rustNodeSlotType):
		// a variant boxes only when it shares an SCC with its owner in the
		// singular-reference graph. This fixture's chain (module → _statement →
		// _simple_statements → _simple_statement → expression_statement) has no
		// cycle back to _statement, so SimpleStatements stays unboxed — a more
		// precise replacement for the old "always Box a branch-kind variant"
		// default, not a regression.
		expect(emitted).toContain('SimpleStatements(SimpleStatementsNode),');
		expect(emitted).toContain('ExpressionStatement(ExpressionStatementNode),');
		expect(emitted).toMatch(/    #\[kind\([^\n]*\)\]\n    ExpressionStatement\(/);
	});

	it('accepts a hidden wrapper kind id for hidden-wrapper child enums', () => {
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				_wrapped_item: 410,
				integer: 411,
				identifier: 412,
				hidden_wrapper_parent: 413
			},
			sourceArtifact: 'test'
		};
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ hidden_wrapper_parent: EMPTY }),
			makeHiddenWrapperChildEnumNodeMap(),
			generatedIdTables
		).nodeRs.contents;

		expect(emitted).toContain('pub enum HiddenWrapperParentContentNodeSlot {');
		expect(emitted).toMatch(/    #\[kind\([^\n]*\)\]\n    WrappedItem\(/);
		expect(emitted).toMatch(/    #\[kind\([^\n]*\)\]\n    Integer\(/);
	});

	it('claims each member of a supertype-backed child enum by its kind', () => {
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				object_like: 500,
				pair: 501,
				identifier: 502,
				_reserved_identifier: 503,
				_shorthand_property_identifier: 422
			},
			sourceArtifact: 'test'
		};
		const emitted = emitRenderModule(
			'typescript',
			emittedTemplates({ object_like: EMPTY }),
			makeSupertypeBackedChildEnumNodeMap(),
			generatedIdTables
		).nodeRs.contents;

		expect(emitted).toContain('pub enum ObjectLikeContentNodeSlot {');
		// No SCC cycle in this fixture (object_like → pair → identifier is
		// linear) — Pair stays unboxed, same SCC-driven rule as the
		// transparent-wrapper case above.
		expect(emitted).toContain('Pair(PairNode),');
		expect(emitted).toContain('Identifier(IdentifierNode),');
		expect(emitted).toContain('ReservedIdentifier(ReservedIdentifierNode),');
		for (const variant of ['Pair', 'Identifier', 'ReservedIdentifier']) {
			expect(emitted).toMatch(new RegExp(`    #\\[kind\\([^\\n]*\\)\\]\\n    ${variant}\\(`));
		}
	});

	it('emits per-slot typed enum for named heterogeneous fields (cleanup-rules §E1)', () => {
		// Named heterogeneous field gets its own typed enum
		// `<ParentTypeName><FieldName>NodeSlot` — symmetry with unnamed `$children`
		// slots. After spec 024 cleanup-§E1, the per-slot enum is load-bearing:
		// the struct field type IS the enum (no longer `Box<AnyNode>`).
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				field_expression: 600,
				field_identifier: 601,
				integer_literal: 602
			},
			fieldIds: { field: 1 },
			sourceArtifact: 'test'
		};
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ field_expression: slot('field') }),
			makeNamedHeterogeneousFieldNodeMap(),
			generatedIdTables
		).nodeRs.contents;

		expect(emitted).toContain('pub enum FieldExpressionFieldNodeSlot {');
		expect(emitted).toContain('FieldIdentifier(FieldIdentifierNode),');
		expect(emitted).toContain('IntegerLiteral(IntegerLiteralNode),');
		expect(emitted).not.toContain('_node_slot_to_any');
		// Per-slot enum is now load-bearing — struct field type IS the enum.
		expect(emitted).toContain('pub field: ::sittir_core::SlotValue<FieldExpressionFieldNodeSlot>');
		expect(emitted).not.toContain('Box<AnyNode>>');
	});

	it('emits repeated named fields as a NonEmptyVec node instead of OneOrMany', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeRepeatedFieldNodeMap);
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ repeated_field_parent: slot('items') }),
			nodeMap,
			generatedIdTables
		);
		const start = emitted.nodeRs.contents.indexOf('pub struct RepeatedFieldParentNode');
		const end = emitted.nodeRs.contents.indexOf('}', start);
		const structBody = emitted.nodeRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[wire(key = "_items")]\n    #[slot(field = field::ITEMS, word = 2, width = 2, run = 5)]\n    pub items: ::sittir_core::NonEmptyVec<::sittir_core::SlotValue<IdentifierNode>>,'
		);
		expect(structBody).not.toContain('OneOrMany<');
	});

	it('emits optional repeated named fields as a Vec node, an empty list being []', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeOptionalRepeatedFieldNodeMap);
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ optional_repeated_field_parent: slot('items') }),
			nodeMap,
			generatedIdTables
		);
		const start = emitted.nodeRs.contents.indexOf('pub struct OptionalRepeatedFieldParentNode');
		const end = emitted.nodeRs.contents.indexOf('}', start);
		const structBody = emitted.nodeRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[wire(key = "_items")]\n    #[slot(field = field::ITEMS, word = 2, width = 2, run = 5)]\n    pub items: Vec<::sittir_core::SlotValue<IdentifierNode>>,'
		);
		expect(structBody).not.toContain('OneOrMany<');
	});

	it('flattens reserved nested supertypes in Rust node enums', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeReservedNestedSupertypeNodeMap);
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ parent_expression: slot('value') }),
			nodeMap,
			generatedIdTables
		);

		expect(emitted.nodeRs.contents).toContain('pub enum ExpressionNode');
		expect(emitted.nodeRs.contents).toContain('StringLiteral(StringLiteralNode),');
		expect(emitted.nodeRs.contents).toContain('Identifier(IdentifierNode),');
		expect(emitted.nodeRs.contents).not.toContain('Literal(Box<LiteralNode>)');
		expect(emitted.nodeRs.contents).not.toContain('literal_node_to_any');
	});

	it('emits keyword-safe Rust node identifiers decoded by kind id', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeMinimalNodeMap, MINIMAL_TOKENS);
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ self: slot('text') }),
			nodeMap,
			generatedIdTables
		);

		expect(emitted.nodeRs.contents).toMatch(/pub enum AnyNode \{[^}]*\n    #\[kind\(kind::SELF\)\]\n    Self_,/);
		expect(emitted.nodeRs.contents).toContain('pub enum Self_Node {\n    #[kind(kind::SELF)]\n    Self_,\n}');
		expect(emitted.nodeRs.contents).not.toContain('\n    Self,');
	});
});
