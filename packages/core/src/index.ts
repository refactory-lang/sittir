// @sittir/core — Grammar-driven render engine (runtime only)
// All type definitions live in @sittir/types.

export { createRenderer, loadTemplates } from './render.ts';
export type { BoundRenderer, RulesConfig } from './render.ts';
export { validateFull } from './validate.ts';
export { replace, bindRange, replaceField } from './edit.ts';
export { toCst } from './cst.ts';
export { readNode, buildRoutingMap, buildFieldPromotionMap } from './readNode.ts';
export type { TreeHandle, OverridesConfig, OverrideFieldSpec, NodeOverrides, RoutingMap, FieldPromotionMap } from './readNode.ts';
