import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export const EMITTER_TSCONFIG = join('packages', 'codegen', 'tsconfig.emitter.json');

const EMITTER_PACKAGE = join('packages', 'codegen');

export interface PinnedTypeEscape {
	readonly file: string;
	readonly reason: string;
}

export interface PinnedTypeScope {
	readonly cwd: string;
	readonly checkout: string;
	readonly pinned: string;
}

const LOCAL_REASONS = [/^Matched by include pattern /, /^Imported via '\.\.?\//];

const real = (path: string): string => (existsSync(path) ? realpathSync(path) : path);

const within = (dir: string, path: string): boolean => {
	const rel = relative(dir, path);
	return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
};

export function pinnedTypeEscapes(explained: string, { cwd, checkout, pinned }: PinnedTypeScope): PinnedTypeEscape[] {
	const [packages, emitter, pin] = [join(real(checkout), 'packages'), join(real(checkout), EMITTER_PACKAGE), real(pinned)];
	const live = (file: string): boolean => within(packages, file) && !within(pin, file) && !file.split(sep).includes('node_modules');
	const local = (file: string, reason: string): boolean => within(emitter, file) && LOCAL_REASONS.some((pattern) => pattern.test(reason));
	const escapes: PinnedTypeEscape[] = [];
	let file: string | undefined;
	let reported = false;
	for (const line of explained.split('\n')) {
		if (!/^\s/.test(line)) {
			file = line.trim() === '' ? undefined : real(resolve(cwd, line.trim()));
			reported = false;
			continue;
		}
		const reason = line.trim();
		if (file === undefined || reported || reason.startsWith('File ') || !live(file) || local(file, reason)) continue;
		escapes.push({ file, reason });
		reported = true;
	}
	return escapes;
}

export function explainFiles(config: string, cwd: string): string {
	return execFileSync('pnpm', ['exec', 'tsc', '-p', config, '--noEmit', '--noCheck', '--explainFiles'], { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
}
