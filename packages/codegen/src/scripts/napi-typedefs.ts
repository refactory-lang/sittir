import { execSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const targetDirs = new Map<string, string>();

function cargoTargetDir(cwd: string): string {
	const cached = targetDirs.get(cwd);
	if (cached !== undefined) return cached;
	const metadata = execSync('cargo metadata --format-version 1 --no-deps', { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	const dir = (JSON.parse(metadata) as { target_directory: string }).target_directory;
	targetDirs.set(cwd, dir);
	return dir;
}

function napiTypedefDirs(targetDir: string, grammar: string): string[] {
	const root = join(targetDir, 'napi-rs');
	if (!existsSync(root)) return [];
	const own = new RegExp(`^sittir-${grammar}-[0-9a-f]+$`);
	return readdirSync(root)
		.filter((name) => own.test(name))
		.map((name) => join(root, name));
}

export function removeNapiTypedefs(targetDir: string, grammar: string): void {
	for (const dir of napiTypedefDirs(targetDir, grammar)) rmSync(dir, { recursive: true, force: true });
}

export function clearNapiTypedefs(grammar: string, cwd: string): void {
	removeNapiTypedefs(cargoTargetDir(join(cwd, 'rust')), grammar);
}
