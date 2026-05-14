import { describe, expect, it } from 'vitest';

import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype
} from '../compiler/node-map.ts';
import type { AssembledNode } from '../compiler/node-map.ts';
import type { ChoiceRule, SeqRule } from '../compiler/rule.ts';
import type { NodeMap } from '../compiler/types.ts';
import { emitRenderModule } from '../emitters/render-module.ts';
import { makeNodeMapWith } from './helpers/node-map-fixtures.ts';

const nodeMapWith = makeNodeMapWith;

function makeMinimalNodeMap(): NodeMap {
	const callRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'callee',
				content: { type: 'symbol', name: '_expression' }
			},
			{
				type: 'field',
				name: 'keyword',
				content: { type: 'symbol', name: 'kw_fn' }
			},
			{
				type: 'field',
				name: 'operator',
				content: { type: 'symbol', name: 'operator' }
			},
			{
				type: 'field',
				name: 'semicolon',
				content: { type: 'string', value: ';' }
			}
		]
	};
	const expressionRule: ChoiceRule = {
		type: 'choice',
		members: [
			{ type: 'symbol', name: 'identifier' },
			{ type: 'symbol', name: 'call_expression' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('call_expression', new AssembledBranch('call_expression', callRule, callRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	nodes.set('kw_fn', new AssembledKeyword('kw_fn', { type: 'string', value: 'fn' }));
	nodes.set('self', new AssembledKeyword('self', { type: 'string', value: 'self' }));
	nodes.set(
		'operator',
		new AssembledEnum('operator', {
			type: 'enum',
			members: [
				{ type: 'string', value: '+' },
				{ type: 'string', value: '-' }
			]
		})
	);
	nodes.set('_expression', new AssembledSupertype('_expression', expressionRule, ['identifier', 'call_expression']));
	return nodeMapWith(nodes);
}

function makeRequiredChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('child_parent', new AssembledBranch('child_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeOptionalChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'optional',
				content: { type: 'symbol', name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('optional_parent', new AssembledBranch('optional_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeRepeatedChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'repeat1',
				content: { type: 'symbol', name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('repeated_parent', new AssembledBranch('repeated_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeReservedNestedSupertypeNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'value',
				content: { type: 'symbol', name: '_expression' }
			}
		]
	};
	const literalRule: ChoiceRule = {
		type: 'choice',
		members: [{ type: 'symbol', name: 'string_literal' }]
	};
	const expressionRule: ChoiceRule = {
		type: 'choice',
		members: [
			{ type: 'symbol', name: '_literal' },
			{ type: 'symbol', name: 'identifier' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('parent_expression', new AssembledBranch('parent_expression', parentRule, parentRule));
	nodes.set('string_literal', new AssembledPattern('string_literal', { type: 'pattern', value: '".*"' }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	nodes.set('_literal', new AssembledSupertype('_literal', literalRule, ['string_literal']));
	nodes.set('_expression', new AssembledSupertype('_expression', expressionRule, ['_literal', 'identifier']));
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
		expect(emitted.libRs.contents).toContain('pub use dispatch::render_dispatch;');
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
