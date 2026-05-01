// Explicit generic engine boundary.
//
// Root @sittir/core remains the low-level primitive surface. Grammar packages
// import engine helpers from this subpath so the generic engine facade does not
// blur together with render/read/edit primitives.

export { createJsEngine, resolveEngineFormat, createGrammarEngine } from './engine.ts';
export type {
	SittirEngineLike,
	SittirEngineReader,
	ParseAndReadResult,
	JsEngineOptions,
	GrammarEngineConfig,
	EngineOptions
} from './engine.ts';
export {
	assertRenderableNodeData,
	isRenderableNodeData,
	assertNativeNodeData,
	isNativeNodeData
} from './native-boundary.ts';
