/**
 * Alias census: the short aliases a portable namespace would give a vocabulary's paths, and those whose
 * name is also a flag's.
 *
 * An alias names a path by its last segment under an ancestor (or the root), where no other path under
 * that ancestor ends in the segment and no child of the ancestor is named by it: `is.expression.add` for
 * `is.expression.binary.arithmetic.add`. An alias whose segment is also a flag declared by the ancestor or
 * a kind under it reads as that flag's guard: `is.async` would be an async block, not an async function.
 *
 *   pnpm exec tsx docs/superpowers/probes/2026-10-11-receivers-and-aliases/alias-census.mts [<checkout>]
 *
 * Reads the checkout's vocabulary through the checkout's own reader (packages/tools/src/inventory/vocabulary.ts).
 * Prints the alias count, then one line per alias sharing a flag's name: the alias, its path, and the kinds
 * declaring the flag.
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

interface Member {
	readonly flag: boolean;
}
interface Vocabulary {
	readonly kinds: ReadonlyMap<string, unknown>;
	members(path: string): ReadonlyMap<string, Member>;
}

const root = process.argv[2] ?? process.cwd();
const reader = (await import(pathToFileURL(join(root, 'packages/tools/src/inventory/vocabulary.ts')).href)) as {
	readVocabulary(dir: string): Vocabulary;
};
const vocabulary = reader.readVocabulary(join(root, 'packages/types/src/vocabulary'));
const paths = [...vocabulary.kinds.keys()];
const snake = (name: string): string => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const last = (path: string): string => path.slice(path.lastIndexOf('.') + 1);
const ancestors = ['', ...new Set(paths.flatMap((p) => p.split('.').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join('.'))))];

let aliases = 0;
const rows: string[] = [];
for (const ancestor of ancestors) {
	const under = paths.filter((p) => p !== ancestor && (ancestor === '' || p.startsWith(`${ancestor}.`)));
	const depth = ancestor === '' ? 0 : ancestor.split('.').length;
	const children = new Set(under.filter((p) => p.split('.').length === depth + 1).map(last));
	const bySegment = new Map<string, string[]>();
	for (const p of under) bySegment.set(last(p), [...(bySegment.get(last(p)) ?? []), p]);
	const flags = new Map<string, string[]>();
	for (const kind of [ancestor, ...under]) {
		if (!vocabulary.kinds.has(kind)) continue;
		for (const [name, member] of vocabulary.members(kind)) if (member.flag) flags.set(snake(name), [...(flags.get(snake(name)) ?? []), kind]);
	}
	for (const [segment, matches] of bySegment) {
		if (matches.length !== 1 || children.has(segment)) continue;
		aliases++;
		const declaring = flags.get(segment);
		if (declaring === undefined) continue;
		const shown = `${declaring.slice(0, 3).join(', ')}${declaring.length > 3 ? ` +${declaring.length - 3}` : ''}`;
		rows.push(`${ancestor === '' ? '(root)' : ancestor}.${segment} -> ${matches[0]}; a flag of ${shown}`);
	}
}
process.stdout.write(`${aliases} aliases, ${rows.length} sharing a flag's name\n${rows.join('\n')}\n`);
