export { generate } from './compiler/generate.ts';
export type { GenerateConfig, GeneratedFiles } from './compiler/generate.ts';

export {
	runCodegen,
	runFullRegen,
	runStandaloneSteps,
	runCodegenCli,
	runGrammarDiagnosticsPreflight,
	writePortableTyped,
	type CodegenOptions
} from './run-codegen.ts';

export { parseTypeCheckDiagnostics, typeCheckOutput, type TypeCheckDiagnostic } from './typecheck.ts';
export { PORTABLE_TYPED_FILE, PORTABLE_TYPED_TSCONFIG, type PortableTypedOutput, type PortableTypedUnemitted } from './emitters/overlays/portable/typed.ts';
