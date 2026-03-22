// Public entry point for the rust-ir library.
// Auto-generated types + hand-written render/validate pipeline.

export type {
	RustGrammar,
	StructItem,
	StructItemConfig,
	FunctionItem,
	FunctionItemConfig,
	UseDeclaration,
	UseDeclarationConfig,
	ImplItem,
	ImplItemConfig,
	IfExpression,
	IfExpressionConfig,
	MacroInvocation,
	MacroInvocationConfig,
	SourceFile,
	SourceFileConfig,
	RustIrNode,
	ValidationResult,
} from './types.js';

export { render } from './render-valid.js';
export { renderSilent } from './render.js';
export { validateFast, validateFast as validate, assertValid } from './validate-fast.js';

export { structItem } from './nodes/struct-item.js';
export { functionItem } from './nodes/function.js';
export { useDeclaration } from './nodes/use.js';
export { implItem } from './nodes/impl.js';
export { ifExpression } from './nodes/if.js';
export { macroInvocation } from './nodes/macro-invocation.js';
export { sourceFile } from './nodes/source-file.js';

export { ir } from './fluent.js';
