import type { GrammarPackage } from '../grammars.ts';
import { evaluate, type EvaluateOptions } from './evaluate.ts';
import type { RawGrammar } from '../compiler/types.ts';
import { packageEntryPath, packageSourceEntry, type PackageSourceOptions } from './resolve-grammar.ts';
import { upstreamFileTypes } from '../compiler/upstream-file-types.ts';

export type PackageEvaluationOptions = PackageSourceOptions & EvaluateOptions;

export const readsGrammarBindings = (pkg: GrammarPackage, options: PackageEvaluationOptions = {}): boolean =>
	options.unbound !== true && packageSourceEntry(pkg, options) === packageEntryPath(pkg);

export function evaluatePackage(pkg: GrammarPackage, options?: PackageEvaluationOptions): Promise<RawGrammar> {
	return evaluate(packageSourceEntry(pkg, options), upstreamFileTypes(pkg), options);
}
