import { validateFactoryRoundTrip } from '../validate/factory-roundtrip.ts';
import { join } from 'node:path';

async function main() {
	for (const grammar of ['rust', 'typescript', 'python'] as const) {
		const templatesPath = join(process.cwd(), 'packages', grammar, 'templates');
		const r = await validateFactoryRoundTrip(grammar, templatesPath);
		console.log(
			`\n=== ${grammar} === total=${r.total} pass=${r.pass} fail=${r.fail} skip=${r.skip} astMatch=${r.astMatchPass}`
		);
		const buckets = new Map<string, Array<{ kind: string; msg: string }>>();
		for (const err of r.errors) {
			const key = (err.message.split(':')[0] ?? '').slice(0, 60);
			if (!buckets.has(key)) buckets.set(key, []);
			buckets
				.get(key)!
				.push({ kind: err.kind, msg: err.message.slice(0, 140) });
		}
		for (const [key, items] of [...buckets.entries()]
			.sort((a, b) => b[1].length - a[1].length)
			.slice(0, 8)) {
			const byKind = new Map<string, number>();
			for (const it of items)
				byKind.set(it.kind, (byKind.get(it.kind) ?? 0) + 1);
			console.log(`  [${items.length}] ${key}`);
			for (const [k, n] of [...byKind.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, 8))
				console.log(`     ${k}: ${n}`);
			console.log(`     sample: ${items[0]?.msg}`);
		}
	}
}
main().catch((e) => {
	console.error(e);
	process.exit(1);
});
