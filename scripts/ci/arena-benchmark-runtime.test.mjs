import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pack, restore } from './arena-benchmark-runtime.mjs';

test('runtime bundles preserve relative paths and reject a changed runtime or corrupted archive before extraction', () => {
	const directory = mkdtempSync(join(tmpdir(), 'arena-bundle-test-'));
	try {
		const root = join(directory, 'source');
		const output = join(directory, 'bundles');
		const destination = join(directory, 'restored');
		const stamp = { commit: 'revision', platform: 'linux', arch: 'x64', node: 'pinned', rust: 'pinned' };
		mkdirSync(join(root, 'packages/regex/native'), { recursive: true });
		mkdirSync(join(root, 'node_modules/.cache/sittir/native-build'), { recursive: true });
		writeFileSync(join(root, 'packages/regex/native/addon.node'), 'binary');
		writeFileSync(join(root, 'node_modules/.cache/sittir/native-build/stamp.json'), 'stamp');
		pack({
			root,
			directory: output,
			label: 'native-regex',
			paths: ['packages/regex/native', 'node_modules/.cache/sittir/native-build'],
			stamp
		});
		restore({ root: destination, directory: output, required: ['native-regex'], stamp });
		assert.equal(readFileSync(join(destination, 'packages/regex/native/addon.node'), 'utf8'), 'binary');
		assert.equal(
			readFileSync(join(destination, 'node_modules/.cache/sittir/native-build/stamp.json'), 'utf8'),
			'stamp'
		);
		assert.throws(
			() => restore({ root: destination, directory: output, required: ['typescript'], stamp }),
			/missing runtime bundle/
		);
		for (const field of ['commit', 'platform', 'arch', 'node', 'rust'])
			assert.throws(
				() => restore({ root: destination, directory: output, stamp: { ...stamp, [field]: 'changed' } }),
				/runtime identity/
			);
		writeFileSync(join(output, 'native-regex.tar.gz'), 'corrupted');
		assert.throws(() => restore({ root: destination, directory: output, stamp }), /checksum/);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
