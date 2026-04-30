import { describe, expect, it } from 'vitest';

import {
	AssembledBranch,
	AssembledContainer,
	AssembledEnum,
	AssembledGroup,
	AssembledKeyword,
	AssembledLeaf,
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

function nodeMapWith(
	nodes: Map<string, AssembledNode>,
	polymorphFormKinds: ReadonlySet<string> = new Set()
): NodeMap {
	return {
		name: 'rust',
		nodes,
		signatures: { signatures: new Map() },
		projections: { projections: new Map() },
		derivations: {
			inferredFields: [],
			promotedRules: [],
			repeatedShapes: []
		},
		rules: {},
		externals: new Set(),
		word: undefined,
		polymorphFormKinds
	} satisfies NodeMap;
}

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
	nodes.set(
		'call_expression',
		new AssembledBranch('call_expression', callRule, callRule)
	);
	nodes.set(
		'identifier',
		new AssembledLeaf('identifier', { type: 'pattern', value: '[a-z]+' })
	);
	nodes.set(
		'kw_fn',
		new AssembledKeyword('kw_fn', { type: 'string', value: 'fn' })
	);
	nodes.set(
		'self',
		new AssembledKeyword('self', { type: 'string', value: 'self' })
	);
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
	nodes.set(
		'_expression',
		new AssembledSupertype('_expression', expressionRule, [
			'identifier',
			'call_expression'
		])
	);
	return nodeMapWith(nodes);
}

function makeRequiredChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'child_parent',
		new AssembledBranch('child_parent', parentRule, parentRule)
	);
	nodes.set(
		'identifier',
		new AssembledLeaf('identifier', { type: 'pattern', value: '[a-z]+' })
	);
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
	nodes.set(
		'optional_parent',
		new AssembledBranch('optional_parent', parentRule, parentRule)
	);
	nodes.set(
		'identifier',
		new AssembledLeaf('identifier', { type: 'pattern', value: '[a-z]+' })
	);
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
	const leftForm = new AssembledGroup(
		'expression__form_left',
		leftRule,
		leftRule,
		{ name: 'left_form', parentKind: 'expression' }
	);
	const rightForm = new AssembledGroup(
		'expression__form_right',
		rightRule,
		rightRule,
		{ name: 'right_form', parentKind: 'expression' }
	);
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'expression',
		new AssembledPolymorph('expression', parentRule, [leftForm, rightForm])
	);
	nodes.set(
		'identifier',
		new AssembledLeaf('identifier', { type: 'pattern', value: '[a-z]+' })
	);
	return nodeMapWith(
		nodes,
		new Set(['expression__form_left', 'expression__form_right'])
	);
}

function makeTypeNameCollisionNodeMap(): NodeMap {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'true',
		new AssembledKeyword('true', { type: 'string', value: 'true' })
	);
	nodes.set(
		'True',
		new AssembledKeyword('True', { type: 'string', value: 'True' })
	);
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
	nodes.set(
		'child_list',
		new AssembledContainer('child_list', listRule, listRule)
	);
	nodes.set(
		'identifier',
		new AssembledLeaf('identifier', { type: 'pattern', value: '[a-z]+' })
	);
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
	nodes.set(
		'identifier',
		new AssembledLeaf('identifier', { type: 'pattern', value: '[a-z]+' })
	);
	nodes.set('_path', new AssembledSupertype('_path', pathRule, ['identifier']));
	return nodeMapWith(nodes);
}

describe('native transport emission', () => {
	it('emits data-only TS transport types from the NodeMap shape', () => {
		const contents = emitTypes({
			grammar: 'rust',
			nodeMap: makeMinimalNodeMap()
		});
		const transportSection = contents.slice(
			contents.indexOf('// Native render transport types')
		);

		expect(transportSection).toContain('export namespace CallExpression');
		expect(transportSection).toContain('export interface Transport');
		expect(transportSection).toContain("readonly $type: 'call_expression';");
		expect(transportSection).toContain(
			'readonly callee: Expression.Transport;'
		);
		expect(transportSection).toContain('readonly keyword: KwFn.Transport;');
		expect(transportSection).toContain(
			'readonly operator: Operator.Transport;'
		);
		expect(transportSection).toContain(
			'readonly semicolon: LiteralTransport<";", ";">;'
		);
		expect(transportSection).toContain(
			'export type TransportFor<K extends SyntaxKind | keyof KindMap> ='
		);
		expect(transportSection).toContain(
			'K extends "call_expression" ? CallExpression.Transport :'
		);
		expect(transportSection).toContain('export type AnyTransport =');
		expect(transportSection).toContain('export interface LiteralTransport');
		expect(transportSection).toContain('  | LiteralTransport<";", ";">');
		expect(transportSection).not.toContain('readonly $fields');
		expect(transportSection).toContain(
			'export type Transport = TerminalTransport<"identifier", string>;'
		);
		expect(transportSection).toContain(
			'export type Transport = TerminalTransport<"kw_fn", "fn">;'
		);
		expect(transportSection).toContain(
			'export type Transport = TerminalTransport<"operator", "+" | "-">;'
		);
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
		const transportSection = contents.slice(
			contents.indexOf('// Native render transport types')
		);

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
		const rust = emitRenderModule(
			'rust',
			[
				{
					filename: 'optional_parent.jinja',
					content: '{# @generated #}\n{{ children | join(" ") }}'
				}
			],
			nodeMap
		).templatesRs.contents;

		expect(types).toContain(
			'readonly $children?: readonly [Identifier.Transport];'
		);
		expect(rust).toContain(
			'#[serde(rename = "$children")]\n    #[serde(default)]\n    pub children: Option<Vec<Box<AnyTransport>>>,'
		);
	});

	it('emits grammar-local native render transport validators', () => {
		const contents = emitClientUtils({ nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain(
			'export function toNativeRenderTransport(node: unknown): AnyTransport'
		);
		expect(contents).toContain('const fields = value.$fields;');
		expect(contents).toContain('projectRawChildrenIntoFields(projected);');
		expect(contents).toContain('inferNativeTransportVariant(projected);');
		expect(contents).toContain('const nativeTransportAliasTargetToSource');
		expect(contents).toContain('const nativeTransportRawChildFieldRules');
		expect(contents).toContain('const nativeTransportVariantRules');
		expect(contents).toContain(
			'projected[key] = projectTransportValue(child, `${path}.${key}`);'
		);
		expect(contents).toContain('if (typeof child === "function") continue;');
		expect(contents).toContain('if (key in projected) continue;');
		expect(contents).toContain(
			'assertNativeRenderTransport(node: unknown): asserts node is AnyTransport'
		);
		expect(contents).toContain('case "call_expression":');
		expect(contents).toContain('case "identifier":');
		expect(contents).toContain('assertCallExpressionTransport(node,');
		expect(contents).toContain(
			'assertTransportValue(node["callee"], `${path}.callee`, [{"type":"identifier"},{"type":"call_expression"}] as const);'
		);
		expect(contents).toContain(
			'assertTransportValue(node["keyword"], `${path}.keyword`, [{"type":"kw_fn","text":"fn"}] as const);'
		);
		expect(contents).toContain(
			'assertTransportValue(node["operator"], `${path}.operator`, [{"type":"operator","text":"+"},{"type":"operator","text":"-"}] as const);'
		);
		expect(contents).toContain('case ";":');
		expect(contents).toContain(
			'assertLiteralTransport(node, \'node\', ";", ";");'
		);
		expect(contents).toContain(
			'assertTransportValue(node["semicolon"], `${path}.semicolon`, [{"type":";","text":";"}] as const);'
		);
		expect(contents).not.toContain('node.$fields');
		expect(contents).toContain(
			'assertTextIn(node.$text, `${path}.$text`, ["fn"] as const);'
		);
		expect(contents).toContain(
			'assertTextIn(node.$text, `${path}.$text`, ["+","-"] as const);'
		);
		expect(contents).toContain(
			"key === 'render' || key === 'toEdit' || key === 'replace'"
		);
		expect(contents).toContain("key === '$format'");
		expect(contents).toContain(
			'$format is not supported by the native render boundary; pass format separately'
		);
		expect(contents).not.toContain('native-boundary');
		expect(contents).not.toContain('assertNativeNodeData');
	});

	it('emits polymorph transport validators that dispatch on the form variant', () => {
		const contents = emitClientUtils({ nodeMap: makePolymorphNodeMap() });

		expect(contents).toContain('case "expression":');
		expect(contents).toContain('switch (node.$variant)');
		expect(contents).toContain('case "left_form":');
		expect(contents).toContain(
			'assertExpressionUFormLeftTransport(node, path);'
		);
		expect(contents).toContain(
			'assertTransportVariant(node, path, "left_form");'
		);
		expect(contents).toContain(
			'if (node["left"] === undefined) throw new TypeError(`${path}.left` + \' is required\');'
		);
		expect(contents).toContain(
			'assertTransportValue(node["left"], `${path}.left`, [{"type":"identifier"}] as const);'
		);
		expect(contents).toContain('case "right_form":');
		expect(contents).toContain(
			'assertExpressionUFormRightTransport(node, path);'
		);
		expect(contents).toContain(
			'if (node["right"] === undefined) throw new TypeError(`${path}.right` + \' is required\');'
		);
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

		expect(emitted.templatesRs.contents).toContain('pub enum AnyTransport');
		expect(emitted.templatesRs.contents).toContain('#[serde(tag = "$type")]');
		expect(emitted.templatesRs.contents).toContain(
			'CallExpression(CallExpressionTransport),'
		);
		expect(emitted.templatesRs.contents).toContain(
			'pub struct CallExpressionTransport'
		);
		expect(emitted.templatesRs.contents).toContain(
			'pub callee: Box<AnyTransport>,'
		);
		expect(emitted.templatesRs.contents).toContain(
			'#[serde(rename = ";")]\n    Literal0_3b(LiteralTransport),'
		);
		expect(emitted.templatesRs.contents).toContain(
			'pub struct LiteralTransport'
		);
		expect(emitted.templatesRs.contents).toContain('from_transport');
		expect(emitted.templatesRs.contents).toContain('pub fn render_transport');
		expect(emitted.templatesRs.contents).toContain(
			'pub fn render_transport_parts'
		);
		expect(emitted.templatesRs.contents).toContain(
			'let node = node_data_from_transport(transport)?;'
		);
		expect(emitted.templatesRs.contents).toContain('render_dispatch(&node)');
		expect(emitted.templatesRs.contents).not.toContain(
			'renderable native transport bridge pending'
		);
		expect(emitted.libRs.contents).toContain(
			'pub use templates::{render_dispatch, render_transport, render_transport_parts, AnyTransport};'
		);
		expect(emitted.templatesRs.contents).not.toContain(
			'AnyTransport::NodeData'
		);
		expect(emitted.templatesRs.contents).not.toContain('node_json');
		expect(emitted.templatesRs.contents).not.toContain('JSON');
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

		expect(emitted.templatesRs.contents).toContain(
			'#[serde(rename = "self")]\n    Self_(Self_Transport),'
		);
		expect(emitted.templatesRs.contents).toContain('pub struct Self_Transport');
		expect(emitted.templatesRs.contents).not.toContain(
			'\n    Self(SelfTransport),'
		);
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
		const start = emitted.templatesRs.contents.indexOf(
			'pub struct ChildParentTransport'
		);
		const end = emitted.templatesRs.contents.indexOf('}', start);
		const structBody = emitted.templatesRs.contents.slice(start, end);

		expect(structBody).toContain(
			'#[serde(rename = "$children")]\n    pub children: Vec<Box<AnyTransport>>,'
		);
		expect(structBody).not.toContain(
			'#[serde(rename = "$children")]\n    #[serde(default)]'
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

		expect(emitted.templatesRs.contents).toContain(
			'pub enum ExpressionTransport'
		);
		expect(emitted.templatesRs.contents).toContain(
			'#[serde(tag = "$variant")]'
		);
		expect(emitted.templatesRs.contents).toContain(
			'#[serde(rename = "left_form")]\n    ExpressionUFormLeft(ExpressionUFormLeftTransport),'
		);
		expect(emitted.templatesRs.contents).toContain(
			'pub struct ExpressionUFormLeftTransport'
		);
		expect(emitted.templatesRs.contents).toContain(
			'pub left: Box<AnyTransport>,'
		);
		expect(emitted.templatesRs.contents).toContain(
			'pub right: Box<AnyTransport>,'
		);
	});

	it('uses one transport projection for colliding type names', () => {
		const nodeMap = makeTypeNameCollisionNodeMap();
		const types = emitTypes({ grammar: 'python', nodeMap });
		const utils = emitClientUtils({ nodeMap });
		const rust = emitRenderModule(
			'python',
			[
				{
					filename: 'true.jinja',
					content: '{# @generated #}\n{{ text }}'
				}
			],
			nodeMap
		).templatesRs.contents;

		expect(types).toContain(
			'export type Transport = TerminalTransport<"true", "true">;'
		);
		expect(types).toContain('  | True.Transport');
		expect(types).not.toContain('TerminalTransport<"True", "True">');
		expect(utils).toContain('case "true":');
		expect(utils).not.toContain('case "True":');
		expect(rust).toContain(
			'#[serde(rename = "true")]\n    True(TrueTransport),'
		);
		expect(rust).not.toContain(
			'#[serde(rename = "True")]\n    True(TrueTransport),'
		);
	});

	it('resolves hidden source multis to visible transport nodes', () => {
		const nodeMap = makeHiddenSourceVisibleTransportNodeMap();
		const types = emitTypes({ grammar: 'python', nodeMap });
		const utils = emitClientUtils({ nodeMap });

		expect(types).toContain(
			'readonly $children: readonly [ChildList.Transport];'
		);
		expect(types).not.toContain('_ChildList.Transport');
		expect(utils).toContain(
			'assertTransportValue(node.$children[i], `${path}.$children[${i}]`, [{"type":"child_list"}] as const);'
		);
		expect(utils).not.toContain('{"type":"_child_list"}');
	});

	it('inlines fixed terminals whose type names collide with supertypes', () => {
		const nodeMap = makeSupertypeTerminalCollisionNodeMap();
		const types = emitTypes({ grammar: 'rust', nodeMap });
		const utils = emitClientUtils({ nodeMap });

		expect(types.match(/export namespace Path/g)).toHaveLength(1);
		expect(types).toContain(
			'readonly separator: TerminalTransport<"::", "::">;'
		);
		expect(types).toContain('readonly path: Path.Transport;');
		expect(types).toContain('export namespace Path');
		expect(types).toContain('export type Transport = Identifier.Transport;');
		expect(types).toContain('  | LiteralTransport<"::", "::">');
		expect(utils).toContain('case "::":');
		expect(utils).toContain(
			'assertLiteralTransport(node, \'node\', "::", "::");'
		);
	});
});
