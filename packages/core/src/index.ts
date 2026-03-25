// @sittir/core — Grammar-driven render engine
// TODO: Planned migration to Rust/WASM via @refactory/typescript-to-rust

export type {
	NodeData,
	RenderTemplate,
	RenderRule,
	TemplateElement,
	ParsedTemplate,
	Edit,
	ByteRange,
	Position,
	CSTNode,
	RenderContext,
} from './types.ts';

export { parseTemplate } from './sexpr.ts';
export { render } from './render.ts';
export type { RulesRegistry, JoinByMap } from './render.ts';
export { validateFull } from './validate.ts';
export { toEdit, replace, bindRange, replaceField } from './edit.ts';
export type { ReplaceTarget, AssignableNode, KindOf, Renderable } from './edit.ts';
export { toCst } from './cst.ts';
export { resolveFromInput, resolveFieldValue } from './from.ts';
export type { FromFieldInfo, FromContext, FromValue, FromObject } from './from.ts';
