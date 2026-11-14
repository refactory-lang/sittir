import { execFileSync } from 'node:child_process';
import { isAbsolute, join, relative, resolve } from 'node:path';

export const EMITTER_TSCONFIG = join('packages', 'codegen', 'tsconfig.emitter.json');

export interface PinnedTypeEscape {
	readonly specifier: string;
	readonly importer: string;
	readonly resolved: string;
}

const IMPORTED = /^\s+Imported via '(@sittir\/[^']+)' from file '([^']+)'/;

export function pinnedTypeEscapes(explained: string, cwd: string, pinned: string): PinnedTypeEscape[] {
	const inside = (path: string): boolean => {
		const rel = relative(pinned, path);
		return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
	};
	const escapes: PinnedTypeEscape[] = [];
	let file: string | undefined;
	for (const line of explained.split('\n')) {
		if (!/^\s/.test(line)) {
			file = line.trim() === '' ? undefined : resolve(cwd, line.trim());
			continue;
		}
		const imported = IMPORTED.exec(line);
		if (imported === null || file === undefined || inside(file)) continue;
		escapes.push({ specifier: imported[1]!, importer: resolve(cwd, imported[2]!), resolved: file });
	}
	return escapes;
}

export function explainEmitterFiles(root: string): string {
	return execFileSync('pnpm', ['exec', 'tsc', '-p', EMITTER_TSCONFIG, '--noEmit', '--noCheck', '--explainFiles'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
}
