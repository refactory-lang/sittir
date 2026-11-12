import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join, posix, relative, sep } from 'node:path';

export type PathFlavor = Pick<typeof posix, 'relative' | 'sep'>;

export function filesUnder(path: string): string[] {
	if (!existsSync(path)) return [];
	const stat = statSync(path);
	if (stat.isFile()) return isJunkFile(basename(path)) ? [] : [path];
	if (!stat.isDirectory()) return [];
	return readdirSync(path).flatMap((name) => filesUnder(join(path, name)));
}

function isJunkFile(name: string): boolean {
	return name === '.DS_Store';
}

export function posixRelative(from: string, to: string, flavor: PathFlavor = { relative, sep }): string {
	return flavor.relative(from, to).split(flavor.sep).join(posix.sep);
}

export function namedFrom(root: string, files: Iterable<string>, flavor?: PathFlavor): { readonly name: string; readonly file: string }[] {
	return [...files].map((file) => ({ name: posixRelative(root, file, flavor), file })).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
