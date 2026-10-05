/** Are parsed (wrapped) nodes fast-properties objects? */
import v8 from 'node:v8';
import { readFileSync } from 'node:fs';
v8.setFlagsFromString('--allow-natives-syntax');
const fast = new Function('o', 'return %HasFastProperties(o)') as (o: object) => boolean;
const WT = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = (await import(`${WT}/packages/common/src/index.ts`)) as { createEngine: (l: unknown, o?: unknown) => Promise<any> };
const language = ((await import(`${WT}/packages/rust/src/index.ts`)) as { default: unknown }).default;
const engine = await createEngine(language);
const source = readFileSync(`${WT}/rust/crates/sittir-core/src/engine.rs`, 'utf8');
const camel = (slot: string) => slot.replace(/^_/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const seen = new Set<object>();
const walk = (node: any): void => {
	if (node === null || typeof node !== 'object') return;
	if (Array.isArray(node)) { for (const entry of node) walk(entry); return; }
	if (seen.has(node)) return;
	seen.add(node);
	for (const key of Object.keys(node)) {
		if (!key.startsWith('_') || node[key] == null) continue;
		const accessor = node[camel(key)];
		let child: unknown = node[key];
		if (typeof accessor === 'function') { try { child = accessor.call(node); } catch { continue; } }
		walk(child);
	}
};
for (const deep of [false, true]) {
	seen.clear();
	walk(engine.parse(source, deep ? { deep: true } : undefined));
	const nodes = [...seen].filter((n) => typeof (n as { $type?: unknown }).$type === 'number');
	const withMembers = nodes.filter((n) => Object.getOwnPropertyDescriptor(n, '$trivia') !== undefined);
	console.log(`${deep ? 'deep' : 'shallow'} parse: ${nodes.length} nodes reached; ${withMembers.length} carry $trivia; fast-properties among those: ${withMembers.filter(fast).length}; among the rest: ${nodes.filter((n) => !withMembers.includes(n)).filter(fast).length} of ${nodes.length - withMembers.length}`);
}
