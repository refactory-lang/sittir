import type { GrammarPackage } from '../grammars.ts';
import { bindingsPathIn } from '../bindings/facts.ts';
import { assertBindingsFresh } from '../bindings/hash.ts';
import { loadBindingsModule } from '../bindings/module.ts';
import { evaluate, type EvaluateOptions } from './evaluate.ts';
import type { RawGrammar } from '../compiler/types.ts';
import { packageSourceEntry, type PackageSourceOptions } from './resolve-grammar.ts';
import { upstreamFileTypes } from '../compiler/upstream-file-types.ts';

export type PackageEvaluationOptions = PackageSourceOptions & EvaluateOptions;

export async function evaluatePackage(pkg: GrammarPackage, options: PackageEvaluationOptions = {}): Promise<RawGrammar> {
	if (options.unbound !== true && options.base !== true) assertBindingsFresh(pkg.name, (await loadBindingsModule(pkg.dir))?.hash, bindingsPathIn(pkg.dir));
	return evaluate(packageSourceEntry(pkg, options), upstreamFileTypes(pkg), options);
}
