import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const [root, grammar, out] = process.argv.slice(2);
const workspace = path.dirname(new URL(import.meta.url).pathname);
const language = (await import(root + '/packages/' + grammar + '/dist/index.js')).default;
const engine = await language.createEngine({ nodeStorage: 'object' });
const entries = JSON.parse(fs.readFileSync(workspace + '/corpus-' + grammar + '.json', 'utf8'));
const attempt = (fn) => {
	try {
		return { status: 'ok', value: fn() };
	} catch (e) {
		return { status: 'refused', message: e.message };
	}
};
const cases = [];
for (const entry of entries) {
	try {
		const node = engine.parse(entry.source);
		const rendered = node.$render();
		const edits = [];
		for (const key of Object.keys(node.$with ?? {}).sort()) {
			const setter = node.$with[key];
			if (typeof setter !== 'function' || typeof node[key] !== 'function') continue;
			const changed = attempt(() => {
				const value = node[key]();
				const copy =
					Array.isArray(value) && setter.length === 0
						? setter.call(node.$with, ...value)
						: setter.call(node.$with, value);
				return copy.$render();
			});
			edits.push({ key, ...changed });
		}
		cases.push({
			entry: entry.name,
			status: 'ok',
			sourceSha256: createHash('sha256').update(entry.source).digest('hex'),
			rendered,
			engineRendered: engine.render(node).toString(),
			parseErrors: node.$errors?.length ?? null,
			edits
		});
	} catch (e) {
		cases.push({ entry: entry.name, status: 'refused', message: e.message });
	}
}
let built;
if (grammar === 'rust') {
	const b = engine.build;
	const name = b.identifier('f');
	const fn = b.functionItem({ name, parameters: b.parameters(), body: b.block({ statements: [] }) });
	const renamed = fn.$with.name(b.identifier('g'));
	built = {
		rendered: fn.$render(),
		engineRendered: engine.render(fn).toString(),
		sameName: fn.name() === name,
		edited: renamed.$render(),
		originalAfterEdit: fn.$render(),
		namedProperty: '$named' in fn,
		json: attempt(() => JSON.stringify(fn)),
		releaseAvailable: typeof engine.release === 'function'
	};
}
engine.dispose();
const result = {
	capturedAt: new Date().toISOString(),
	root,
	grammar,
	storage: 'object',
	construction: 'object',
	entries: entries.length,
	cases,
	built
};
fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(
	JSON.stringify({
		grammar,
		entries: entries.length,
		rendered: cases.filter((x) => x.status === 'ok').length,
		refused: cases.filter((x) => x.status !== 'ok').length,
		built
	})
);
