import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const command = (name, args, root) => execFileSync(name, args, { cwd: root, encoding: 'utf8' }).trim();
const validLabel = (value) => assert(/^[a-z][a-z0-9-]*$/.test(value), 'invalid runtime bundle label');
const validPath = (value) =>
	assert(value && !value.startsWith('/') && !value.split('/').includes('..'), 'unsafe runtime bundle path');

export function identity(root = process.cwd()) {
	return {
		commit: command('git', ['rev-parse', 'HEAD'], root),
		platform: process.platform,
		arch: process.arch,
		node: process.version,
		abi: process.versions.modules,
		rust: command('rustc', ['-Vv'], root),
		cargo: digest(readFileSync(join(root, 'Cargo.toml'))),
		rustflags: process.env.RUSTFLAGS ?? null,
		encodedRustflags: process.env.CARGO_ENCODED_RUSTFLAGS ?? null
	};
}

export function pack({ directory, label, paths, root = process.cwd(), stamp = identity(root) }) {
	validLabel(label);
	assert(paths.length, 'empty runtime bundle');
	paths.forEach(validPath);
	mkdirSync(directory, { recursive: true });
	const archive = `${label}.tar.gz`;
	execFileSync('tar', ['-czf', resolve(directory, archive), '-C', root, '--', ...paths]);
	const manifest = {
		format: 1,
		label,
		archive,
		identity: stamp,
		sha256: digest(readFileSync(join(directory, archive)))
	};
	writeFileSync(join(directory, `${label}.manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
	return manifest;
}

export function restore({ directory, required = [], root = process.cwd(), stamp = identity(root) }) {
	const manifests = readdirSync(directory)
		.filter((name) => name.endsWith('.manifest.json'))
		.sort()
		.map((name) => JSON.parse(readFileSync(join(directory, name), 'utf8')));
	assert(manifests.length, 'missing runtime bundles');
	const labels = manifests.map((manifest) => manifest.label);
	assert.equal(new Set(labels).size, labels.length, 'duplicate runtime bundle');
	for (const label of required) assert(labels.includes(label), `missing runtime bundle ${label}`);
	for (const manifest of manifests) {
		assert.equal(manifest.format, 1);
		validLabel(manifest.label);
		assert.equal(manifest.archive, `${manifest.label}.tar.gz`);
		assert.deepEqual(manifest.identity, stamp, 'runtime identity mismatch');
		const archive = join(directory, manifest.archive);
		assert.equal(digest(readFileSync(archive)), manifest.sha256, 'runtime bundle checksum mismatch');
		for (const member of command('tar', ['-tzf', archive]).split('\n')) validPath(member);
		assert(
			command('tar', ['-tvzf', archive])
				.split('\n')
				.every((line) => line[0] === '-' || line[0] === 'd'),
			'unsupported runtime bundle link'
		);
	}
	mkdirSync(root, { recursive: true });
	for (const manifest of manifests)
		execFileSync('tar', [
			'-xzf',
			join(directory, manifest.archive),
			'-C',
			root,
			'--no-same-owner',
			'--no-same-permissions'
		]);
	return manifests;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	const [action, directory, label, ...paths] = process.argv.slice(2);
	if (action === 'pack') console.log(JSON.stringify(pack({ directory, label, paths })));
	else if (action === 'restore')
		console.log(
			JSON.stringify(
				restore({ directory, required: [label, ...paths].filter(Boolean) }).map((manifest) => manifest.label)
			)
		);
	else
		throw new Error(
			'usage: arena-benchmark-runtime.mjs pack <directory> <label> <paths...> | restore <directory> <required labels...>'
		);
}
