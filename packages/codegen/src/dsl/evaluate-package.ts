import { layerPath, type GrammarPackage } from '../grammars.ts';
import { evaluate, evaluateDsl, generatedLayerDiagnostics } from './evaluate.ts';
import type { EvaluatedGrammar, RawGrammar } from '../compiler/types.ts';
import type { ProjectedGrammar } from './verbs/effects.ts';
import { packageSourceEntry, type PackageSourceOptions } from './resolve-grammar.ts';
import { upstreamFileTypes } from '../compiler/upstream-file-types.ts';

export interface PackageEvaluationOptions extends PackageSourceOptions {
	readonly checkGeneratedLayers?: boolean;
}

export const readsGrammarBindings = (pkg: GrammarPackage, options: PackageEvaluationOptions = {}): boolean =>
	options.unbound !== true && packageSourceEntry(pkg, options) === layerPath(pkg, 'top');

export async function evaluatePackage(pkg: GrammarPackage, options: PackageEvaluationOptions = {}): Promise<ProjectedGrammar<RawGrammar>> {
	const entry = packageSourceEntry(pkg, options);
	const produced = await evaluate(entry, upstreamFileTypes(pkg));
	if (options.checkGeneratedLayers !== true) return produced;
	const generated = await generatedLayerDiagnostics(entry);
	return generated.length === 0 ? produced : { ...produced, layerDiagnostics: [...(produced.layerDiagnostics ?? []), ...generated] };
}

export function evaluatePackageLayer(pkg: GrammarPackage, options?: PackageSourceOptions): Promise<ProjectedGrammar<EvaluatedGrammar>> {
	return evaluateDsl(packageSourceEntry(pkg, options));
}
