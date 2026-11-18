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

export { parseTypeCheckDiagnostics, probeDiagnostics, tsrsDiagnostics, typeCheckOutput, type TypeCheckDiagnostic, type TypeCheckProbe } from './typecheck.ts';
export { PORTABLE_TYPED_FILE, PORTABLE_TYPED_TSCONFIG, type PortableTypedOutput, type PortableTypedUnemitted } from './emitters/overlays/portable/typed.ts';
export { exactSlotsOf, rawGroupOf, type ExactSet, type ExactSlots, type RawArm, type RawReason } from './emitters/overlays/portable/exact.ts';
export { grammarMapName } from './emitters/overlays/portable/grammar-map.ts';
