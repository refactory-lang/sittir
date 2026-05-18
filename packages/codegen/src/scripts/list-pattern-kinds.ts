import { readFileSync } from 'node:fs';
import JSON5 from 'json5';

const path = process.argv[2] ?? 'packages/rust/src/node-model.json5';
const data = JSON5.parse(readFileSync(path, 'utf-8')) as {
	nodes?: { kind?: string; name?: string; modelType?: string }[];
};
const kinds = (data.nodes ?? [])
	.filter((n) => n.modelType === 'pattern')
	.map((n) => n.kind ?? n.name ?? '<?>')
	.sort();
console.log(`# ${path}: ${kinds.length} pattern-modeled kinds`);
for (const k of kinds) console.log(`  ${k}`);
