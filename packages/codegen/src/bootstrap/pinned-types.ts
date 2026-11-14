import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

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

const LOCAL_REASONS = [/^Matched by include pattern /, /^Imported via (['"])\.\.?\//];

const real = (path: string): string => (existsSync(path) ? realpathSync(path) : path);

const within = (dir: string, path: string): boolean => {
	const rel = relative(dir, path);
	return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
};

function packageOwner(): (file: string) => string | undefined {
	const owners = new Map<string, string | undefined>();
	const ownerOf = (dir: string): string | undefined => {
		if (owners.has(dir)) return owners.get(dir);
		const manifest = join(dir, 'package.json');
		const named = existsSync(manifest) ? (JSON.parse(readFileSync(manifest, 'utf8')) as { readonly name?: string }).name : undefined;
		const owner = named ?? (dirname(dir) === dir ? undefined : ownerOf(dirname(dir)));
		owners.set(dir, owner);
		return owner;
	};
	return (file) => ownerOf(dirname(file));
}

export function pinnedTypeEscapes(explained: string, { cwd, checkout, pinned }: PinnedTypeScope): PinnedTypeEscape[] {
	const [emitter, pin] = [join(real(checkout), EMITTER_PACKAGE), real(pinned)];
	const ownerOf = packageOwner();
	const unpinned = (file: string): boolean => (ownerOf(file)?.startsWith('@sittir/') ?? false) && !within(pin, file);
	const local = (file: string, reason: string): boolean => within(emitter, file) && LOCAL_REASONS.some((pattern) => pattern.test(reason));
	const escapes = new Map<string, PinnedTypeEscape>();
	let file: string | undefined;
	for (const line of explained.split('\n')) {
		if (!/^\s/.test(line)) {
			file = line.trim() === '' ? undefined : real(resolve(cwd, line.trim()));
			continue;
		}
		const reason = line.trim();
		if (file === undefined || escapes.has(file) || reason.startsWith('File ') || !unpinned(file) || local(file, reason)) continue;
		escapes.set(file, { file, reason });
	}
	return [...escapes.values()];
}

export function explainFiles(config: string, cwd: string): string {
	const { stdout, stderr, error } = spawnSync('pnpm', ['exec', 'tsc', '-p', config, '--noEmit', '--noCheck', '--explainFiles'], { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
	if (error !== undefined) throw error;
	if (stdout.trim() === '') throw new Error(`tsc listed no files for ${config}: ${stderr}`);
	return stdout;
}
