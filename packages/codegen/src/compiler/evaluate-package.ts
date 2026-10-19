import type { GrammarPackage } from '../grammars.ts';
import { evaluate, evaluateDsl } from './evaluate.ts';
import type { EvaluatedGrammar, RawGrammar } from './types.ts';
import { packageSourceEntry, type PackageSourceOptions } from './resolve-grammar.ts';
import { upstreamFileTypes } from './upstream-file-types.ts';

export function evaluatePackage(pkg: GrammarPackage, options?: PackageSourceOptions): Promise<RawGrammar> {
	return evaluate(packageSourceEntry(pkg, options), upstreamFileTypes(pkg));
}

export function evaluatePackageLayer(pkg: GrammarPackage, options?: PackageSourceOptions): Promise<EvaluatedGrammar> {
	return evaluateDsl(packageSourceEntry(pkg, options));
}
