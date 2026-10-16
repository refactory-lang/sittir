import type { GrammarPackage } from '../grammars.ts';
import { evaluate } from './evaluate.ts';
import type { RawGrammar } from './types.ts';
import { packageSourceEntry, type PackageSourceOptions } from './resolve-grammar.ts';
import { upstreamFileTypes } from './upstream-file-types.ts';

export function evaluatePackage(pkg: GrammarPackage, options?: PackageSourceOptions): Promise<RawGrammar> {
	return evaluate(packageSourceEntry(pkg, options), upstreamFileTypes(pkg));
}
