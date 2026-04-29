// @sittir/core — Grammar-driven render engine (runtime only)
// All type definitions live in @sittir/types.

export { createRenderer } from './loader.ts';
export { createRendererFromConfig } from './render.ts';
export type { BoundRenderer, RulesConfig } from './render.ts';
export { validateFull } from './validate.ts';
export { replace, bindRange, replaceField, applyEdits } from './edit.ts';
export { toCst } from './cst.ts';
export { readNode } from './readNode.ts';
export type { TreeHandle } from './readNode.ts';
export {
	withMetrics,
	recordFfi,
	dumpMetrics,
	metricsEnabled
} from './metrics.ts';
export type { MetricsFile, PerKindMetrics, FfiMetrics } from './metrics.ts';
export { assertNativeNodeData, isNativeNodeData } from './native-boundary.ts';
export { applyFormat, rebaseTrivia } from './format.ts';
