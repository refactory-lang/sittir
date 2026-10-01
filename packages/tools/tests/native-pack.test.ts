import { describe, expect, it } from 'vitest';
import { nativePackGaps, unexpectedNativeBinaries } from '../src/native-pack.ts';

const binding = { binaryName: 'sittir-rust', loader: 'index.cjs', typings: 'index.d.ts' };
const packed = (...files: string[]) => files.map((file) => `package/${file}`);

describe('nativePackGaps', () => {
	it('accepts a pack holding the loader, its typings and every required binary', () => {
		const entries = packed(
			'dist/index.js',
			'native/index.cjs',
			'native/index.d.ts',
			'native/sittir-rust.darwin-arm64.node',
			'native/sittir-rust.linux-x64-gnu.node'
		);
		expect(nativePackGaps(entries, binding, ['darwin-arm64', 'linux-x64-gnu'])).toEqual([]);
	});

	it('names each required binary the pack lacks', () => {
		const entries = packed('native/index.cjs', 'native/index.d.ts', 'native/sittir-rust.darwin-arm64.node');
		expect(nativePackGaps(entries, binding, ['darwin-arm64', 'linux-x64-gnu', 'win32-x64-msvc'])).toEqual([
			'native/sittir-rust.linux-x64-gnu.node',
			'native/sittir-rust.win32-x64-msvc.node'
		]);
	});

	it('names a missing loader and missing typings', () => {
		const entries = packed('dist/index.js', 'native/sittir-rust.darwin-arm64.node');
		expect(nativePackGaps(entries, binding, ['darwin-arm64'])).toEqual(['native/index.cjs', 'native/index.d.ts']);
	});
});

describe('unexpectedNativeBinaries', () => {
	it('names each packed binary outside the required platforms', () => {
		const entries = packed(
			'native/index.cjs',
			'native/sittir-rust.darwin-arm64.node',
			'native/sittir-rust.win32-arm64-msvc.node',
			'dist/other.node'
		);
		expect(unexpectedNativeBinaries(entries, binding, ['darwin-arm64'])).toEqual([
			'native/sittir-rust.win32-arm64-msvc.node'
		]);
	});

	it('finds none in a pack holding exactly the required binaries', () => {
		const entries = packed('native/sittir-rust.darwin-arm64.node', 'native/sittir-rust.linux-x64-gnu.node');
		expect(unexpectedNativeBinaries(entries, binding, ['darwin-arm64', 'linux-x64-gnu'])).toEqual([]);
	});
});
