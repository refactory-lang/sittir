// Measures whether enrich, run once over a grammar's top layer with the sidecars of the enrichment that
// layer was built on, changes any rule: the fixpoint check that completion runs at every layer.
// Run from the checkout to measure, with top-fixpoint.patch applied:
//   SITTIR_PROBE_TOP_FIXPOINT=1 pnpm exec tsx docs/superpowers/probes/2026-10-15-authoring-dsl/top-fixpoint.ts [grammar…]
// Prints one `[top-fixpoint] <grammar>: fixpoint` line per grammar, or the rules enrich would add, remove or change.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const checkout = process.cwd();
const { evaluateDsl } = (await import(pathToFileURL(join(checkout, 'packages/codegen/src/compiler/evaluate.ts')).href)) as {
	evaluateDsl: (entry: string) => Promise<unknown>;
};
const grammars = process.argv.slice(2);
for (const grammar of grammars.length > 0 ? grammars : ['rust', 'typescript', 'python']) {
	await evaluateDsl(join(checkout, 'packages', grammar, 'grammar.sittir.ts'));
}
