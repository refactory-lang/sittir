#!/usr/bin/env npx tsx
/**
 * Detailed round-trip failure report for all grammars.
 */
import { validateRoundTrip } from '../src/validate-roundtrip.ts';
import { readFileSync } from 'fs';

async function main() {
	for (const grammar of ['rust', 'typescript', 'python']) {
		const yaml = readFileSync(`packages/${grammar}/templates.yaml`, 'utf-8');
		console.log(`\n=== ${grammar.toUpperCase()} ===`);
		const r = await validateRoundTrip(grammar, yaml);

		// Group errors by kind
		const byKind = new Map<string, typeof r.errors>();
		for (const e of r.errors) {
			const m = e.name.match(/\[(\w+)\]/);
			const kind = m ? m[1]! : e.name;
			if (!byKind.has(kind)) byKind.set(kind, []);
			byKind.get(kind)!.push(e);
		}

		const sorted = [...byKind.entries()].sort((a, b) => b[1].length - a[1].length);
		for (const [kind, errs] of sorted) {
			console.log(`  ${kind}: ${errs.length} failures`);
			console.log(`    sample: ${errs[0]!.message.slice(0, 100)}`);
		}
		console.log(`  ---`);
		console.log(`  ${r.pass}/${r.total} pass, ${r.fail} fail, ${r.skip} skip, ${byKind.size} kinds affected`);
	}
}

main().catch(console.error);
