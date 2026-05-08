import { describe, expect, it } from 'vitest';

import {
	AssembledBranch,
	AssembledEnum,
	AssembledGroup,
	AssembledKeyword,
	AssembledPattern,
	AssembledMulti,
	AssembledPolymorph,
	AssembledSupertype
} from '../compiler/node-map.ts';
import type { AssembledNode } from '../compiler/node-map.ts';
import type { ChoiceRule, SeqRule } from '../compiler/rule.ts';
import type { NodeMap } from '../compiler/types.ts';
import { emitClientUtils } from '../emitters/client-utils.ts';
import { emitRenderModule } from '../emitters/render-module.ts';
import { emitTypes } from '../emitters/types.ts';
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

function makePolymorphNodeMap(): NodeMap {
	const leftRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'left',
				content: { type: 'symbol', name: 'identifier' }
			}
		]
	};
	const rightRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'right',
				content: { type: 'symbol', name: 'identifier' }
			}
		]
	};
	const parentRule: ChoiceRule = {
		type: 'choice',
		members: [
			{ type: 'symbol', name: 'expression__form_left' },
			{ type: 'symbol', name: 'expression__form_right' }
		]
	};
	const leftForm = new AssembledGroup('expression__form_left', leftRule, leftRule, {
		name: 'left_form',
		parentKind: 'expression'
	});
	const rightForm = new AssembledGroup('expression__form_right', rightRule, rightRule, {
		name: 'right_form',
		parentKind: 'expression'
	});
	const nodes = new Map<string, AssembledNode>();
	nodes.set('expression', new AssembledPolymorph('expression', parentRule, [leftForm, rightForm]));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return nodeMapWith(nodes, new Set(['expression__form_left', 'expression__form_right']));
}

function makeTypeNameCollisionNodeMap(): NodeMap {
	const nodes = new Map<string, AssembledNode>();
	nodes.set('true', new AssembledKeyword('true', { type: 'string', value: 'true' }));
	nodes.set('True', new AssembledKeyword('True', { type: 'string', value: 'True' }));
	return nodeMapWith(nodes);
}

function makeHiddenSourceVisibleTransportNodeMap(): NodeMap {
	const listRule = {
		type: 'repeat1',
		content: { type: 'symbol', name: 'identifier' }
	} as const;
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: '_child_list' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('parent', new AssembledBranch('parent', parentRule, parentRule));
	nodes.set('_child_list', new AssembledMulti('_child_list', listRule));
	nodes.set('child_list', new AssembledBranch('child_list', listRule, listRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeSupertypeTerminalCollisionNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'separator',
				content: { type: 'symbol', name: '::' }
			},
			{
				type: 'field',
				name: 'path',
				content: { type: 'symbol', name: '_path' }
			}
		]
	};
	const pathRule: ChoiceRule = {
		type: 'choice',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('parent', new AssembledBranch('parent', parentRule, parentRule));
	nodes.set('::', new AssembledKeyword('::', { type: 'string', value: '::' }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	nodes.set('_path', new AssembledSupertype('_path', pathRule, ['identifier']));
	return nodeMapWith(nodes);
}

describe('native transport emission', () => {
	it('emits data-only TS transport types from the NodeMap shape', () => {
		const contents = emitTypes({
			grammar: 'rust',
			nodeMap: makeMinimalNodeMap()
		});
		const transportSection = contents.slice(contents.indexOf('// Native render transport types'));

		expect(transportSection).toContain('export namespace CallExpression');
		expect(transportSection).toContain('export interface Transport');
		expect(transportSection).toContain('readonly $type: "call_expression";');
		expect(transportSection).toContain('readonly callee: Expression.Transport;');
		expect(transportSection).toContain('readonly keyword: KwFn.Transport;');
		expect(transportSection).toContain('readonly operator: Operator.Transport;');
		expect(transportSection).toContain('readonly semicolon: LiteralTransport<number, ";">;');
		expect(transportSection).toContain('export type TransportFor<K extends SyntaxKind | keyof KindMap> =');
		expect(transportSection).toContain('K extends "call_expression" ? CallExpression.Transport :');
		expect(transportSection).toContain('export type AnyTransport =');
		expect(transportSection).toContain('export interface LiteralTransport');
		expect(transportSection).toContain('  | LiteralTransport<number, ";">');
		expect(transportSection).not.toContain('readonly $fields');
		expect(transportSection).toContain('export type Transport = TerminalTransport<number, string>;');
		expect(transportSection).toContain('export type Transport = TerminalTransport<number, "fn">;');
		expect(transportSection).toContain('export type Transport = TerminalTransport<number, "+" | "-">;');
		expect(transportSection).not.toContain('AnyNodeData');
		expect(transportSection).not.toContain('render(): string');
		expect(transportSection).not.toContain('toEdit(');
		expect(transportSection).not.toContain('replace(');
	});

	it('emits polymorph transport as per-form data interfaces with a variant union', () => {
		const contents = emitTypes({
			grammar: 'rust',
			nodeMap: makePolymorphNodeMap()
		});
		const transportSection = contents.slice(contents.indexOf('// Native render transport types'));

		expect(transportSection).toContain('export namespace ExpressionUFormLeft');
		expect(transportSection).toContain("readonly $variant: 'left_form';");
		expect(transportSection).toContain('readonly left: Identifier.Transport;');
		expect(transportSection).toContain('export namespace ExpressionUFormRight');
		expect(transportSection).toContain("readonly $variant: 'right_form';");
		expect(transportSection).toContain('readonly right: Identifier.Transport;');
		expect(transportSection).toContain(
			'export type Transport = ExpressionUFormLeft.Transport | ExpressionUFormRight.Transport;'
		);
		expect(transportSection).not.toContain(
			'readonly left: Identifier.Transport;\n    readonly right: Identifier.Transport;'
		);
	});

	it('emits optional children consistently across TS transport and Rust serde', () => {
		const nodeMap = makeOptionalChildrenNodeMap();
		const types = emitTypes({ grammar: 'rust', nodeMap });
		const utils = emitClientUtils({ nodeMap });
		const rust = emitRenderModule(
			'rust',
			[
				{
					filename: 'optional_parent.jinja',
					content: '{# @generated #}\n{{ children | join(" ") }}'
				}
			],
			nodeMap
		).transportRs.contents;

		expect(types).toContain('readonly $children?: Identifier.Transport;');
		expect(utils).toContain('const nativeTransportRawChildFieldRules: Record<string, NativeTransportRawChildRule> = {');
		expect(utils).toContain('"optional_parent": {');
		expect(utils).toContain('childrenRequired: false,');
		expect(utils).toContain('childrenMultiple: false,');
		// Phase 1/2 typed transport: single-kind children use concrete type
		// instead of Box<AnyTransport>. Single-child slots use Option<T> not Option<Vec<T>>.
		expect(rust).toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: Option<IdentifierTransport>,'
		);
	});

	it('emits grammar-local native render transport projection', () => {
		const contents = emitClientUtils({ nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain('export function toNativeRenderTransport(node: unknown): AnyTransport');
		// ADR-0018 Phase 2: $fields removed from utils; _<name> storage keys iterated via Object.entries.
		expect(contents).toContain("const projKey = key.startsWith('_') ? key.slice(1) : key;");
		expect(contents).toContain('projectRawChildrenIntoFields(projected, resolvedKind);');
		expect(contents).toContain('inferNativeTransportVariant(projected, resolvedKind);');
		expect(contents).toContain('coerceNativeTransportChildren(projected, resolvedKind);');
		expect(contents).toContain('coerceKeywordPresenceFields(projected, resolvedKind);');
		expect(contents).toContain('const nativeTransportAliasTargetToSource');
		expect(contents).toContain('const nativeTransportRawChildFieldRules');
		expect(contents).toContain('const nativeTransportVariantRules');
		// ADR-0018 Phase 2: _<name> keys are stripped to bare names before projection.
		expect(contents).toContain('projected[projKey] = projectTransportValue(child, `${path}.${projKey}`);');
		expect(contents).toContain('if (typeof child === "function") continue;');
		// ADR-0018 Phase 2: guard uses projKey (bare name after _ strip), not raw key.
		expect(contents).toContain('if (projKey in projected) continue;');
		// Transport assertions removed — no assertNativeRenderTransport or per-kind validators.
		expect(contents).not.toContain('assertNativeRenderTransport');
		expect(contents).not.toContain('function assertCallExpressionTransport(');
		expect(contents).not.toContain('assertDataOnlyObject');
		expect(contents).not.toContain('node.$fields');
		expect(contents).toContain("key === 'render' || key === 'toEdit' || key === 'replace'");
		expect(contents).not.toContain('collapseTerminalFields(');
		expect(contents).not.toContain('native-boundary');
		expect(contents).not.toContain('assertNativeNodeData');
	});

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

		// Transport types live in transport.rs (spec 024 split).
		expect(emitted.transportRs.contents).toContain('pub enum AnyTransport');
		expect(emitted.transportRs.contents).toContain('#[serde(tag = "$type")]');
		expect(emitted.transportRs.contents).toContain('CallExpression(CallExpressionTransport),');
		expect(emitted.transportRs.contents).toContain('pub struct CallExpressionTransport');
		// Phase 1/2 typed transport: single-kind fields use concrete types.
		// callee references _expression (supertype) → ExpressionTransport.
		expect(emitted.transportRs.contents).toContain('pub callee: ExpressionTransport,');
		// Literal variants are unit variants — no LiteralTransport payload.
		expect(emitted.transportRs.contents).toContain('#[serde(rename = ";")]\n    Literal0_3b,');
		expect(emitted.transportRs.contents).not.toContain('pub struct LiteralTransport');
		expect(emitted.transportRs.contents).toContain('from_transport');
		expect(emitted.transportRs.contents).toContain('pub fn render_transport');
		expect(emitted.transportRs.contents).toContain('pub fn render_transport_parts');
		expect(emitted.transportRs.contents).toContain('render_transport_dispatch');
		expect(emitted.transportRs.contents).not.toContain('renderable native transport bridge pending');
		// mod.rs re-exports from dispatch and transport (spec 024 split).
		expect(emitted.libRs.contents).toContain('pub use dispatch::render_dispatch;');
		expect(emitted.libRs.contents).toContain(
			'pub use transport::{render_transport, render_transport_dispatch, render_transport_parts, AnyTransport};'
		);
		expect(emitted.transportRs.contents).not.toContain('AnyTransport::NodeData');
		expect(emitted.transportRs.contents).not.toContain('node_json');
		expect(emitted.transportRs.contents).not.toContain('JSON');
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

		// Transport types live in transport.rs (spec 024 split).
		expect(emitted.transportRs.contents).toContain('#[serde(rename = "self")]\n    Self_(Self_Transport),');
		expect(emitted.transportRs.contents).toContain('pub struct Self_Transport');
		expect(emitted.transportRs.contents).not.toContain('\n    Self(SelfTransport),');
	});

	it('does not default required Rust transport children', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'child_parent.jinja',
					content: '{# @generated #}\n{{ children | join(" ") }}'
				}
			],
			makeRequiredChildrenNodeMap()
		);
		// Transport structs live in transport.rs (spec 024 split).
		const start = emitted.transportRs.contents.indexOf('pub struct ChildParentTransport');
		const end = emitted.transportRs.contents.indexOf('}', start);
		const structBody = emitted.transportRs.contents.slice(start, end);

		// Phase 1/2 typed transport: single-kind children use concrete type.
		// Required single-child slots use bare T — not Vec<T> or Option<T>.
		expect(structBody).toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: IdentifierTransport,'
		);
		expect(structBody).not.toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: Option<'
		);
		expect(structBody).not.toContain(
			'#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: Vec<'
		);
	});

	it('emits Rust polymorph transport as a variant-tagged form enum', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'expression.jinja',
					content: '{# @generated #}\n{{ variant }}'
				}
			],
			makePolymorphNodeMap()
		);

		// Transport types live in transport.rs (spec 024 split).
		expect(emitted.transportRs.contents).toContain('pub enum ExpressionTransport');
		// Phase D: polymorph transport uses custom FromNapiValue dispatch on "$variant"
		// instead of serde tag (napi-bindings take over the JS boundary in Phase B/C).
		expect(emitted.transportRs.contents).toContain(
			'impl ::napi::bindgen_prelude::FromNapiValue for ExpressionTransport'
		);
		expect(emitted.transportRs.contents).toContain('"left_form" => Ok(Self::ExpressionUFormLeft(');
		expect(emitted.transportRs.contents).toContain('ExpressionUFormLeft(ExpressionUFormLeftTransport),');
		expect(emitted.transportRs.contents).toContain('pub struct ExpressionUFormLeftTransport');
		// Phase 1: single-kind fields emit concrete types instead of Box<AnyTransport>.
		// left and right both reference only 'identifier' → IdentifierTransport.
		expect(emitted.transportRs.contents).toContain('pub left: IdentifierTransport,');
		expect(emitted.transportRs.contents).toContain('pub right: IdentifierTransport,');
	});

	it('uses one transport projection for colliding type names', () => {
		const nodeMap = makeTypeNameCollisionNodeMap();
		const types = emitTypes({ grammar: 'python', nodeMap });
		const rust = emitRenderModule(
			'python',
			[
				{
					filename: 'true.jinja',
					content: '{# @generated #}\n{{ text }}'
				}
			],
			nodeMap
		).transportRs.contents;

		expect(types).toContain('export type Transport = TerminalTransport<number, "true">;');
		expect(types).toContain('  | True.Transport');
		expect(types).not.toContain('TerminalTransport<number, "True">');
		expect(rust).toContain('#[serde(rename = "true")]\n    True(TrueTransport),');
		expect(rust).not.toContain('#[serde(rename = "True")]\n    True(TrueTransport),');
	});

	it('resolves hidden source multis to visible transport nodes', () => {
		const nodeMap = makeHiddenSourceVisibleTransportNodeMap();
		const types = emitTypes({ grammar: 'python', nodeMap });

		expect(types).toContain('readonly $children: ChildList.Transport;');
		expect(types).not.toContain('_ChildList.Transport');
	});

	it('inlines fixed terminals whose type names collide with supertypes', () => {
		const nodeMap = makeSupertypeTerminalCollisionNodeMap();
		const types = emitTypes({ grammar: 'rust', nodeMap });

		expect(types.match(/export namespace Path/g)).toHaveLength(1);
		expect(types).toContain('readonly separator: TerminalTransport<number, "::">;');
		expect(types).toContain('readonly path: Path.Transport;');
		expect(types).toContain('export namespace Path');
		expect(types).toContain('export type Transport = Identifier.Transport;');
		expect(types).toContain('  | LiteralTransport<number, "::">');
	});
});
