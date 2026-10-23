// @ts-nocheck — evaluated with the DSL globals evaluate() installs
import { enrich } from '../../dsl/enrich.ts';
import { resolveGrammarJsPath } from '../../dsl/resolve-grammar.ts';

const name = globalThis.__enrichedUpstreamGrammar__;
const base = (await import(resolveGrammarJsPath(name))).default;

export default grammar(enrich(base), { name: base.grammar.name, rules: {} });
