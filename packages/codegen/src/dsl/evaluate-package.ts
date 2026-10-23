import type { GrammarPackage } from '../grammars.ts';
import { evaluate, type EvaluateOptions } from './evaluate.ts';
import type { RawGrammar } from '../compiler/types.ts';
import { packageSourceEntry, type PackageSourceOptions } from './resolve-grammar.ts';
import { upstreamFileTypes } from '../compiler/upstream-file-types.ts';

export type PackageEvaluationOptions = PackageSourceOptions & EvaluateOptions;

export function evaluatePackage(pkg: GrammarPackage, options?: PackageEvaluationOptions): Promise<RawGrammar> {
	return evaluate(packageSourceEntry(pkg, options), upstreamFileTypes(pkg), options);
}
