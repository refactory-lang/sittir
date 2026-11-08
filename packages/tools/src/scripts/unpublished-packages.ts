import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PACKAGES_DIR } from '@sittir/codegen/grammars';

interface PublishedManifest {
	readonly name: string;
	readonly version: string;
	readonly private?: boolean;
}

function isPublished({ name, version }: PublishedManifest): boolean {
	const view = spawnSync('npm', ['view', `${name}@${version}`, 'version'], { encoding: 'utf-8', shell: process.platform === 'win32' });
	if (view.status === 0) return view.stdout.trim() !== '';
	if (view.stderr.includes('E404')) return false;
	throw new Error(`npm view ${name}@${version} failed:\n${view.stderr}`);
}

const unpublished = readdirSync(PACKAGES_DIR)
	.map((dir) => join(PACKAGES_DIR, dir, 'package.json'))
	.filter((path) => existsSync(path))
	.map((path) => JSON.parse(readFileSync(path, 'utf-8')) as PublishedManifest)
	.filter((manifest) => manifest.private !== true && !isPublished(manifest));
for (const { name, version } of unpublished) console.log(`${name}@${version}`);
