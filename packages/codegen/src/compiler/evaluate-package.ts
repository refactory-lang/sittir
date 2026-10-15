import type { GrammarPackage } from '../grammars.ts';
import { evaluate, type EvaluateOptions } from './evaluate.ts';
import type { RawGrammar } from './types.ts';
import { packageSourceEntry, type PackageSourceOptions } from './resolve-grammar.ts';
import { upstreamFileTypes } from './upstream-file-types.ts';

export function evaluatePackage(pkg: GrammarPackage, options?: PackageSourceOptions & EvaluateOptions): Promise<RawGrammar> {
	return evaluate(packageSourceEntry(pkg, options), upstreamFileTypes(pkg), options);
}
