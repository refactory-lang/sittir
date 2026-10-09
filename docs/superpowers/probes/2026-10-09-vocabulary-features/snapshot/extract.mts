/**
 * Records the snapshot this probe builds on, from the binding prototype's worktree, reading it only.
 *
 * Writes, next to this file:
 * - `vocabulary.patch`: the prototype's uncommitted edits to `packages/types/src/vocabulary`, as a diff on the
 *   vocabulary of its base commit;
 * - `realization.json`: per grammar, the vocabulary paths its read entries claim and, per path, the members its
 *   routes reach, from the prototype's generated `packages/<grammar>/src/node-model-portable.json5`.
 *
 * Usage: `tsx extract.mts [<prototype worktree>]` from the repository root (default `scratchpad/wt-bindings-proto`).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROTO = resolve(process.argv[2] ?? 'scratchpad/wt-bindings-proto');
const GRAMMARS = ['python', 'rust', 'typescript'] as const;

const git = (...args: string[]): string => execFileSync('git', ['-C', PROTO, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });

const patch = git('diff', '--', 'packages/types/src/vocabulary');
writeFileSync(join(HERE, 'vocabulary.patch'), patch);

interface ModelKind {
	readonly read?: readonly { readonly vocab: string }[];
	readonly members?: readonly { readonly name: string }[];
}

const realization: Record<string, { routes: Record<string, string[]> }> = {};
for (const grammar of GRAMMARS) {
	const model = JSON.parse(readFileSync(join(PROTO, `packages/${grammar}/src/node-model-portable.json5`), 'utf8')) as {
		readonly kinds: Record<string, ModelKind>;
	};
	const routes = new Map<string, Set<string>>();
	for (const kind of Object.values(model.kinds)) {
		for (const entry of kind.read ?? []) {
			const members = routes.get(entry.vocab) ?? new Set<string>();
			for (const member of kind.members ?? []) members.add(member.name);
			routes.set(entry.vocab, members);
		}
	}
	const claims = [...routes.keys()].sort();
	realization[grammar] = { routes: Object.fromEntries(claims.map((path) => [path, [...routes.get(path)!].sort()])) };
}
// One claimed path per line, so a diff of two snapshots reads by path.
const lines = ['{'];
GRAMMARS.forEach((grammar, g) => {
	const { routes } = realization[grammar]!;
	const paths = Object.keys(routes);
	lines.push(`\t${JSON.stringify(grammar)}: {`, '\t\t"routes": {');
	paths.forEach((path, i) => lines.push(`\t\t\t${JSON.stringify(path)}: ${JSON.stringify(routes[path])}${i < paths.length - 1 ? ',' : ''}`));
	lines.push('\t\t}', `\t}${g < GRAMMARS.length - 1 ? ',' : ''}`);
});
lines.push('}');
writeFileSync(join(HERE, 'realization.json'), `${lines.join('\n')}\n`);

const base = git('rev-parse', 'HEAD').trim();
console.log(`prototype ${PROTO}`);
console.log(`base ${base}; vocabulary.patch ${patch.length} bytes`);
for (const grammar of GRAMMARS) console.log(`${grammar}: ${Object.keys(realization[grammar]!.routes).length} claimed paths`);
