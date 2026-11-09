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
export { PORTABLE_TS6_TSCONFIG, PORTABLE_TYPED_FILE, PORTABLE_TYPED_TSCONFIG, PORTABLE_TYPE_TEST_LANES, type PortableTypedOutput, type PortableTypedUnemitted } from './emitters/overlays/portable/typed.ts';
export { exactSlotsOf, rawGroupOf, type ExactSet, type ExactSlots, type RawArm, type RawReason } from './emitters/overlays/portable/exact.ts';
export { grammarMapName } from './emitters/overlays/portable/grammar-map.ts';
