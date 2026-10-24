import { resolveRoutes } from '@sittir/codegen/bindings';
import { bindingsModule, loadInputs } from './inventory/index.ts';
const g = globalThis as { __fallback?: Set<string>; __strip?: Set<string> };
for (const grammar of ['python', 'rust', 'typescript'] as const) {
	for (const [layer, run] of [
		['bound', async () => { const [input] = await loadInputs([grammar]); resolveRoutes(input!); }],
		['unbound', async () => { await bindingsModule(grammar); }]
	] as const) {
		g.__fallback = new Set(); g.__strip = new Set();
		await run();
		console.log(`${grammar} ${layer}: fallback ${g.__fallback.size} [${[...g.__fallback].sort().join(', ')}]; strip ${g.__strip.size} [${[...g.__strip].sort().join(', ')}]`);
	}
}
process.exit(0);
