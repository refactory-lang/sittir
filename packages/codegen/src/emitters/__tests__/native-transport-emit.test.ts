import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';

import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype
} from '../../compiler/model/node-map.ts';
import type { GeneratedIdTables } from '../../compiler/generated-metadata.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { emitRenderModule } from '../render-module.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';

const nodeMapWith = makeNodeMapWith;

function makeMinimalNodeMap(): NodeMap {
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
				content: { type: STRING, value: ';' }
			}
		]
	};
	const expressionRule: ChoiceRule<'link'> = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'call_expression' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('call_expression', new AssembledBranch('call_expression', callRule, callRule, deleteWrapper(callRule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('kw_fn', new AssembledKeyword('kw_fn', { type: STRING, value: 'fn' }));
	nodes.set('self', new AssembledKeyword('self', { type: STRING, value: 'self' }));
	nodes.set(
		'operator',
		new AssembledEnum('operator', {
			type: CHOICE,
			members: [
				{ type: STRING, value: '+' },
				{ type: STRING, value: '-' }
			]
		})
	);
	nodes.set('_expression', new AssembledSupertype('_expression', expressionRule, ['identifier', 'call_expression']));
	return nodeMapWith(nodes);
}

function makeRequiredChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('child_parent', new AssembledBranch('child_parent', parentRule, parentRule, deleteWrapper(parentRule)));
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
	nodes.set('optional_parent', new AssembledBranch('optional_parent', parentRule, parentRule, deleteWrapper(parentRule)));
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
	nodes.set('repeated_parent', new AssembledBranch('repeated_parent', parentRule, parentRule, deleteWrapper(parentRule)));
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
	nodes.set('repeated_field_parent', new AssembledBranch('repeated_field_parent', parentRule, parentRule, deleteWrapper(parentRule)));
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
	nodes.set('optional_repeated_field_parent', new AssembledBranch('optional_repeated_field_parent', parentRule, parentRule, deleteWrapper(parentRule)));
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
	const literalRule: ChoiceRule<'link'> = {
		type: CHOICE,
		members: [{ type: SYMBOL, name: 'string_literal' }]
	};
	const expressionRule: ChoiceRule<'link'> = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: '_literal' },
			{ type: SYMBOL, name: 'identifier' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('parent_expression', new AssembledBranch('parent_expression', parentRule, parentRule, deleteWrapper(parentRule)));
	nodes.set('string_literal', new AssembledPattern('string_literal', { type: PATTERN, value: '".*"' }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('_literal', new AssembledSupertype('_literal', literalRule, ['string_literal']));
	nodes.set('_expression', new AssembledSupertype('_expression', expressionRule, ['_literal', 'identifier']));
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
	const expressionRule: ChoiceRule<'link'> = {
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
	nodes.set('supertype_alias_parent', new AssembledBranch('supertype_alias_parent', parentRule, parentRule, deleteWrapper(parentRule)));
	nodes.set('_expression', new AssembledSupertype('_expression', expressionRule, ['identifier', 'call_expression']));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('call_expression', new AssembledBranch('call_expression', callRule, callRule, deleteWrapper(callRule)));
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
	nodes.set('hidden_wrapper_parent', new AssembledBranch('hidden_wrapper_parent', parentRule, parentRule, deleteWrapper(parentRule)));
	nodes.set('_wrapped_item', new AssembledBranch('_wrapped_item', wrapperRule, wrapperRule, deleteWrapper(wrapperRule)));
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
	nodes.set('optional_repeated_parent', new AssembledBranch('optional_repeated_parent', parentRule, parentRule, deleteWrapper(parentRule)));
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
	const simpleStatementRule: ChoiceRule<'link'> = {
		type: CHOICE,
		members: [{ type: SYMBOL, name: 'expression_statement' }]
	};
	const statementRule: ChoiceRule<'link'> = {
		type: CHOICE,
		members: [{ type: SYMBOL, name: '_simple_statements' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('_simple_statement', new AssembledSupertype('_simple_statement', simpleStatementRule, ['expression_statement']));
	nodes.set('_statement', new AssembledSupertype('_statement', statementRule, ['_simple_statements']));
	nodes.set('_simple_statements', new AssembledBranch('_simple_statements', wrapperRule, wrapperRule, deleteWrapper(wrapperRule)));
	nodes.set('expression_statement', new AssembledPattern('expression_statement', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('module', new AssembledBranch('module', moduleRule, moduleRule, deleteWrapper(moduleRule)));
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
	nodes.set('field_expression', new AssembledBranch('field_expression', parentRule, parentRule, deleteWrapper(parentRule)));
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
	const shorthandRule: ChoiceRule<'link'> = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: '_reserved_identifier' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('object_like', new AssembledBranch('object_like', parentRule, parentRule, deleteWrapper(parentRule)));
	nodes.set('pair', new AssembledBranch('pair', pairRule, pairRule, deleteWrapper(pairRule)));
	nodes.set(
		'_shorthand_property_identifier',
		new AssembledSupertype('_shorthand_property_identifier', shorthandRule, [
			'identifier',
			'_reserved_identifier'
		])
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set(
		'_reserved_identifier',
		new AssembledPattern('_reserved_identifier', { type: PATTERN, value: '[a-z]+' })
	);
	return nodeMapWith(nodes);
}

describe('native transport emission', () => {
	it('emits transport-oriented Rust render support', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'call_expression.jinja',
					content: '{# @generated #}\n{{ callee }}'
				}
			],
			makeMinimalNodeMap()
		);

		expect(emitted.transportRs.contents).toContain('pub enum AnyTransport');
		expect(emitted.transportRs.contents).toContain('#[serde(tag = "$type")]');
		expect(emitted.transportRs.contents).toContain('CallExpression(CallExpressionTransport),');
		expect(emitted.transportRs.contents).toContain('pub struct CallExpressionTransport');
		expect(emitted.transportRs.contents).toContain('pub callee: ExpressionTransport,');
		expect(emitted.transportRs.contents).toContain('#[serde(rename = ";")]\n    Literal0_3b,');
		expect(emitted.transportRs.contents).not.toContain('pub struct LiteralTransport');
		expect(emitted.transportRs.contents).toContain('from_transport');
		expect(emitted.transportRs.contents).toContain('pub fn render_transport');
		expect(emitted.transportRs.contents).toContain('pub fn render_transport_parts');
		expect(emitted.transportRs.contents).toContain('render_transport_dispatch');
		expect(emitted.transportRs.contents).not.toContain('renderable native transport bridge pending');
		// Legacy NodeData render shim (render_dispatch / render_nodedata_into) is
		// retired (PR-E2 retired bridge.rs/dispatch.rs; the emitter shim is now
		// deleted too). lib.rs uses the transport path only.
		expect(emitted.libRs.contents).not.toContain('render_dispatch');
		expect(emitted.libRs.contents).not.toContain('render_nodedata_into');
		expect(emitted.libRs.contents).toContain(
			'pub use transport::{render_transport, render_transport_dispatch, render_transport_parts, AnyTransport};'
		);
		expect(emitted.transportRs.contents).not.toContain('AnyTransport::NodeData');
		expect(emitted.transportRs.contents).not.toContain('node_json');
		expect(emitted.transportRs.contents).not.toContain('JSON');
	});

	it('emits optional children as Option<T> transport', () => {
		const rust = emitRenderModule(
			'rust',
			[
				{
					filename: 'optional_parent.jinja',
					content: '{# @generated #}\n{{ children }}'
				}
			],
			makeOptionalChildrenNodeMap()
		).transportRs.contents;

		expect(rust).toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: Option<IdentifierTransport>,'
		);
		expect(rust).not.toContain('pub children: Option<Vec<IdentifierTransport>>');
		expect(rust).not.toContain('pub children: OneOrMany<IdentifierTransport>');
	});

	it('emits required singular children as bare transport values', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'child_parent.jinja',
					content: '{# @generated #}\n{{ children }}'
				}
			],
			makeRequiredChildrenNodeMap()
		);
		const start = emitted.transportRs.contents.indexOf('pub struct ChildParentTransport');
		const end = emitted.transportRs.contents.indexOf('}', start);
		const structBody = emitted.transportRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: IdentifierTransport,'
		);
		expect(structBody).not.toContain('pub children: Option<');
		expect(structBody).not.toContain('pub children: Vec<');
		expect(structBody).not.toContain('OneOrMany<');
	});

	it('collapses supertype-plus-subtype unnamed children to the supertype transport directly', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'supertype_alias_parent.jinja',
					content: '{# @generated #}\n{{ children }}'
				}
			],
			makeSupertypeAndSubtypeChildrenNodeMap()
		);
		const start = emitted.transportRs.contents.indexOf('pub struct SupertypeAliasParentTransport');
		const end = emitted.transportRs.contents.indexOf('}', start);
		const structBody = emitted.transportRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: ExpressionTransport,'
		);
		expect(emitted.transportRs.contents).not.toContain('pub enum SupertypeAliasParentChildTransportSlot');
	});

	it('emits repeated children as Vec transport instead of OneOrMany', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'repeated_parent.jinja',
					content: '{# @generated #}\n{{ children | join(" ") }}'
				}
			],
			makeRepeatedChildrenNodeMap()
		);
		const start = emitted.transportRs.contents.indexOf('pub struct RepeatedParentTransport');
		const end = emitted.transportRs.contents.indexOf('}', start);
		const structBody = emitted.transportRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: Vec<IdentifierTransport>,'
		);
		expect(structBody).not.toContain('OneOrMany<IdentifierTransport>');
	});

	it('emits optional repeated unnamed children as Vec transport', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'optional_repeated_parent.jinja',
					content: '{# @generated #}\n{{ children | join(" ") }}'
				}
			],
			makeOptionalRepeatedChildrenNodeMap()
		);
		const start = emitted.transportRs.contents.indexOf('pub struct OptionalRepeatedParentTransport');
		const end = emitted.transportRs.contents.indexOf('}', start);
		const structBody = emitted.transportRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: Vec<IdentifierTransport>,'
		);
		expect(structBody).not.toContain('pub children: Option<Vec<IdentifierTransport>>');
	});

	it('widens statement unions through transparent hidden wrappers', () => {
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				_statement: 109,
				_simple_statements: 110,
				expression_statement: 122
			},
			sourceArtifact: 'test'
		};
		const emitted = emitRenderModule(
			'python',
			[
				{
					filename: 'module.jinja',
					content: '{# @generated #}\n{{ children | join("\\n") }}'
				}
			],
			makeTransparentStatementWrapperNodeMap(),
			generatedIdTables
		).transportRs.contents;

		expect(emitted).toContain('pub enum StatementTransport {');
		expect(emitted).toContain('SimpleStatements(Box<SimpleStatementsTransport>),');
		expect(emitted).toContain('ExpressionStatement(ExpressionStatementTransport),');
		expect(emitted).toContain('122 => Ok(Self::ExpressionStatement(');
	});

	it('accepts visible alias kind ids for hidden-wrapper child enums', () => {
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				wrapped_item: 410,
				integer: 411,
				identifier: 412
			},
			sourceArtifact: 'test'
		};
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'hidden_wrapper_parent.jinja',
					content: '{# @generated #}\n{{ children }}'
				}
			],
			makeHiddenWrapperChildEnumNodeMap(),
			generatedIdTables
		).transportRs.contents;

		expect(emitted).toContain('pub enum HiddenWrapperParentChildTransportSlot {');
		expect(emitted).toContain('410 => return Ok(Self::WrappedItem(Box::new(');
		expect(emitted).toContain('411 => return Ok(Self::Integer(');
	});

	it('lets supertype-backed child enums fall back to object parsing before unknown-kind errors', () => {
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
			[
				{
					filename: 'object_like.jinja',
					content: '{# @generated #}\n{{ children | join(", ") }}'
				}
			],
			makeSupertypeBackedChildEnumNodeMap(),
			generatedIdTables
		).transportRs.contents;

		expect(emitted).toContain('pub enum ObjectLikeChildTransportSlot {');
		expect(emitted).toContain('Pair(Box<PairTransport>),');
		expect(emitted).toContain('Identifier(IdentifierTransport),');
		expect(emitted).toContain('ReservedIdentifier(ReservedIdentifierTransport),');
		expect(emitted).toContain(
			'if String::from_napi_value(env, napi_val).is_ok() || ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val).is_ok() {'
		);
		expect(emitted).toContain('if let Some(other) = kind_id {');
		expect(emitted).toContain('"unknown kind id {{other}} in ObjectLikeChildTransportSlot"');
	});

	it('emits per-slot typed enum for named heterogeneous fields (cleanup-rules §E1)', () => {
		// Named heterogeneous field gets its own typed enum
		// `<ParentTypeName><FieldName>TransportSlot` — symmetry with unnamed `$children`
		// slots. After spec 024 cleanup-§E1, the per-slot enum is load-bearing:
		// the struct field type IS the enum (no longer `Box<AnyTransport>`).
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				field_expression: 600,
				field_identifier: 601,
				integer_literal: 602
			},
			sourceArtifact: 'test'
		};
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'field_expression.jinja',
					content: '{# @generated #}\n{{ field }}'
				}
			],
			makeNamedHeterogeneousFieldNodeMap(),
			generatedIdTables
		).transportRs.contents;

		expect(emitted).toContain('pub enum FieldExpressionFieldTransportSlot {');
		expect(emitted).toContain('FieldIdentifier(FieldIdentifierTransport),');
		expect(emitted).toContain('IntegerLiteral(IntegerLiteralTransport),');
		// Bridge fn naming follows `<typeSnake>_<fieldSnake>_transport_slot_to_any` for named slots —
		// part of the live transport→AnyTransport per-slot-enum bridge that
		// converts a per-slot enum back to `AnyTransport`.
		expect(emitted).toContain(
			'fn field_expression_field_transport_slot_to_any(t: FieldExpressionFieldTransportSlot) -> AnyTransport {'
		);
		// Per-slot enum is now load-bearing — struct field type IS the enum.
		expect(emitted).toContain('pub field: FieldExpressionFieldTransportSlot');
		expect(emitted).not.toContain('pub field: Box<AnyTransport>');
	});

	it('emits repeated named fields as Vec transport instead of OneOrMany', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'repeated_field_parent.jinja',
					content: '{# @generated #}\n{{ items | join(" ") }}'
				}
			],
			makeRepeatedFieldNodeMap()
		);
		const start = emitted.transportRs.contents.indexOf('pub struct RepeatedFieldParentTransport');
		const end = emitted.transportRs.contents.indexOf('}', start);
		const structBody = emitted.transportRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "_items"))]\n    pub items: Vec<IdentifierTransport>,'
		);
		expect(structBody).not.toContain('OneOrMany<IdentifierTransport>');
	});

	it('emits optional repeated named fields as Option<Vec<T>> transport', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'optional_repeated_field_parent.jinja',
					content: '{# @generated #}\n{{ items | join(" ") }}'
				}
			],
			makeOptionalRepeatedFieldNodeMap()
		);
		const start = emitted.transportRs.contents.indexOf('pub struct OptionalRepeatedFieldParentTransport');
		const end = emitted.transportRs.contents.indexOf('}', start);
		const structBody = emitted.transportRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "_items"))]\n    pub items: Option<Vec<IdentifierTransport>>,'
		);
		expect(structBody).not.toContain('Option<OneOrMany<IdentifierTransport>>');
	});

	it('flattens reserved nested supertypes in Rust transport enums', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'parent_expression.jinja',
					content: '{# @generated #}\n{{ value }}'
				}
			],
			makeReservedNestedSupertypeNodeMap()
		);

		expect(emitted.transportRs.contents).toContain('pub enum ExpressionTransport');
		expect(emitted.transportRs.contents).toContain('StringLiteral(StringLiteralTransport),');
		expect(emitted.transportRs.contents).toContain('Identifier(IdentifierTransport),');
		expect(emitted.transportRs.contents).not.toContain('Literal(Box<LiteralTransport>)');
		expect(emitted.transportRs.contents).not.toContain('literal_transport_to_any');
	});

	it('emits keyword-safe Rust transport identifiers with serde kind renames', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'self.jinja',
					content: '{# @generated #}\n{{ text }}'
				}
			],
			makeMinimalNodeMap()
		);

		expect(emitted.transportRs.contents).toContain('#[serde(rename = "self")]\n    Self_(Self_Transport),');
		expect(emitted.transportRs.contents).toContain('pub struct Self_Transport');
		expect(emitted.transportRs.contents).not.toContain('\n    Self(SelfTransport),');
	});
});
