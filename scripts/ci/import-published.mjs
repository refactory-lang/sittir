// Imports every entry point of every published workspace package with the
// Node that runs this script, so a dist that uses syntax or a global that
// Node lacks fails here rather than in a consumer's install.
import { readdirSync, readFileSync } from 'node:fs';

const packages = new URL('../../packages/', import.meta.url);
const failures = [];
let loaded = 0;
for (const dir of readdirSync(packages, { withFileTypes: true })) {
	if (!dir.isDirectory()) continue;
	let manifest;
	try {
		manifest = JSON.parse(readFileSync(new URL(`${dir.name}/package.json`, packages), 'utf8'));
	} catch {
		continue;
	}
	if (manifest.private) continue;
	const entries = new Set();
	for (const target of Object.values(manifest.exports ?? { '.': manifest.main })) {
		const file = typeof target === 'string' ? target : (target.import ?? target.default);
		if (typeof file === 'string' && !file.includes('*') && !file.endsWith('.json')) entries.add(file);
	}
	for (const file of entries) {
		try {
			await import(new URL(`${dir.name}/${file}`, packages).href);
			loaded++;
		} catch (error) {
			failures.push(`${manifest.name} ${file}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}
console.log(`${loaded} entry points loaded on Node ${process.version}`);
if (failures.length > 0) {
	console.error(failures.join('\n'));
	process.exit(1);
}
