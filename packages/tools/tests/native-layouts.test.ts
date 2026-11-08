import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { engineRefusalGap, layoutFiles, shippedLayoutGaps, type LayoutPacks } from '../src/native-layouts.ts';

const packs: LayoutPacks = {
	packages: { '@sittir/types': 'ship/types.tgz', '@sittir/common': 'ship/common.tgz', '@sittir/python': 'ship/python.tgz', '@sittir/rust': 'ship/rust.tgz' },
	platforms: { 'sittir-python-linux-x64-gnu': 'ship/python-gnu.tgz', 'sittir-rust-linux-x64-gnu': 'ship/rust-gnu.tgz', 'sittir-rust-darwin-arm64': 'ship/rust-darwin.tgz' },
	skewed: { 'sittir-rust-linux-x64-gnu': 'skew/rust-gnu.tgz', 'sittir-rust-darwin-arm64': 'skew/rust-darwin.tgz' },
	stamps: {}
};

const consumerOf = (skewed: boolean) => {
	const files = layoutFiles('/packs', packs, skewed);
	const manifest = JSON.parse(files['package.json']!) as { dependencies: Record<string, string>; overrides: Record<string, string> };
	const workspace = JSON.parse(files['pnpm-workspace.yaml']!) as { overrides: Record<string, string> };
	return { manifest, workspace };
};

describe('layoutFiles', () => {
	it('depends on the grammar packs and resolves everything they pull in to its pack, for npm and pnpm alike', () => {
		const { manifest, workspace } = consumerOf(false);
		expect(manifest.dependencies).toEqual({ '@sittir/python': 'file:/packs/ship/python.tgz', '@sittir/rust': 'file:/packs/ship/rust.tgz' });
		expect(manifest.overrides).toEqual({
			'@sittir/types': 'file:/packs/ship/types.tgz',
			'@sittir/common': 'file:/packs/ship/common.tgz',
			'sittir-python-linux-x64-gnu': 'file:/packs/ship/python-gnu.tgz',
			'sittir-rust-linux-x64-gnu': 'file:/packs/ship/rust-gnu.tgz',
			'sittir-rust-darwin-arm64': 'file:/packs/ship/rust-darwin.tgz'
		});
		expect(workspace.overrides).toEqual(manifest.overrides);
	});

	it("takes the second grammar's platform packs from the other commit for the skew consumer", () => {
		const { overrides } = consumerOf(true).manifest;
		expect(overrides['sittir-python-linux-x64-gnu']).toBe('file:/packs/ship/python-gnu.tgz');
		expect(overrides['sittir-rust-linux-x64-gnu']).toBe('file:/packs/skew/rust-gnu.tgz');
		expect(overrides['sittir-rust-darwin-arm64']).toBe('file:/packs/skew/rust-darwin.tgz');
	});
});

function installed(): { readonly root: string; readonly python: string; readonly rust: string } {
	const root = mkdtempSync(join(tmpdir(), 'sittir-layout-'));
	const python = join(root, 'node_modules', 'sittir-python-linux-x64-gnu');
	const rust = join(root, 'node_modules', '@sittir', 'rust', 'node_modules', 'sittir-rust-linux-x64-gnu');
	for (const dir of [python, rust]) mkdirSync(dir, { recursive: true });
	for (const file of [join(python, 'libsittir_engine.so'), join(python, 'libstd-0a1b.so'), join(rust, 'libsittir_engine.so')]) writeFileSync(file, '');
	return { root, python, rust };
}

describe('shippedLayoutGaps', () => {
	it('accepts one engine and one std image from the first grammar platform package, and both addons from their own', () => {
		const { python, rust } = installed();
		const mapped = [
			{ image: join(python, 'sittir-python.linux-x64-gnu.node'), kind: 'addon' as const },
			{ image: join(python, 'libsittir_engine.so'), kind: 'engine' as const, stamp: '0.1.0@a' },
			{ image: join(python, 'libstd-0a1b.so'), kind: 'std' as const },
			{ image: join(rust, 'sittir-rust.linux-x64-gnu.node'), kind: 'addon' as const }
		];
		expect(shippedLayoutGaps(mapped, ['python', 'rust'], 'linux-x64-gnu')).toEqual([]);
	});

	it('names a second engine image, a missing std image, an image away from the first addon, and an addon from the wrong folder', () => {
		const { python, rust } = installed();
		const mapped = [
			{ image: join(python, 'sittir-python.linux-x64-gnu.node'), kind: 'addon' as const },
			{ image: join(python, 'libsittir_engine.so'), kind: 'engine' as const, stamp: '0.1.0@a' },
			{ image: join(rust, 'libsittir_engine.so'), kind: 'engine' as const, stamp: '0.1.0@a' },
			{ image: join(rust, 'sittir-rust.linux-x64-gnu.node'), kind: 'addon' as const }
		];
		expect(shippedLayoutGaps(mapped, ['python', 'rust'], 'linux-x64-gnu')).toEqual([
			`the process mapped 2 engine images, not 1: ${join(python, 'libsittir_engine.so')}, ${join(rust, 'libsittir_engine.so')}`,
			'the process mapped 0 std images, not 1: none',
			`${join(rust, 'libsittir_engine.so')} is not beside the first addon, in ${python}`
		]);
		const swapped = [
			{ image: join(rust, 'sittir-python.linux-x64-gnu.node'), kind: 'addon' as const },
			{ image: join(python, 'libsittir_engine.so'), kind: 'engine' as const },
			{ image: join(python, 'libstd-0a1b.so'), kind: 'std' as const }
		];
		expect(shippedLayoutGaps(swapped, ['python', 'rust'], 'linux-x64-gnu')).toEqual([
			`the process mapped the addons ${join(rust, 'sittir-python.linux-x64-gnu.node')}, not sittir-python-linux-x64-gnu/sittir-python.linux-x64-gnu.node then sittir-rust-linux-x64-gnu/sittir-rust.linux-x64-gnu.node`,
			`${join(python, 'libsittir_engine.so')} is not beside the first addon, in ${rust}`,
			`${join(python, 'libstd-0a1b.so')} is not beside the first addon, in ${rust}`
		]);
	});

	it('compares folders by where their links lead', () => {
		const { root, python, rust } = installed();
		const linked = join(root, 'node_modules', 'linked-python');
		symlinkSync(python, linked);
		const mapped = [
			{ image: join(linked, 'sittir-python.linux-x64-gnu.node'), kind: 'addon' as const },
			{ image: join(python, 'libsittir_engine.so'), kind: 'engine' as const },
			{ image: join(linked, 'libstd-0a1b.so'), kind: 'std' as const },
			{ image: join(rust, 'sittir-rust.linux-x64-gnu.node'), kind: 'addon' as const }
		];
		expect(shippedLayoutGaps(mapped, ['python', 'rust'], 'linux-x64-gnu')).toEqual([]);
	});
});

describe('engineRefusalGap', () => {
	const { python } = installed();
	const engine = join(python, 'libsittir_engine.so');
	const expected = {
		packageName: '@sittir/rust',
		home: 'sittir-rust-linux-x64-gnu/',
		file: 'sittir-rust.linux-x64-gnu.node',
		binaryName: 'sittir-rust',
		built: '0.1.0@b',
		loaded: '0.1.0@a',
		engine
	};
	const refusal = (built: string, path: string) =>
		`@sittir/rust: sittir-rust-linux-x64-gnu/sittir-rust.linux-x64-gnu.node is present and failed to load: sittir: sittir-rust was built against engine ${built} but loaded engine 0.1.0@a from ${path}`;

	it('accepts a refusal naming both stamps and the engine the process mapped', () => {
		expect(engineRefusalGap(refusal('0.1.0@b', engine), expected)).toBeUndefined();
		expect(engineRefusalGap(`could not create the rust engine: ${refusal('0.1.0@b', engine)}\n    at createEngine`, expected)).toBeUndefined();
	});

	it('names a refusal with other stamps, and a refusal naming another engine', () => {
		expect(engineRefusalGap(refusal('0.1.0@c', engine), expected)).toContain('expected a refusal containing');
		const elsewhere = join(mkdtempSync(join(tmpdir(), 'sittir-layout-')), 'libsittir_engine.so');
		writeFileSync(elsewhere, '');
		expect(engineRefusalGap(refusal('0.1.0@b', elsewhere), expected)).toBe(`the refusal names ${elsewhere}, not ${engine}`);
	});

	it('names a second grammar that loaded', () => {
		expect(engineRefusalGap(undefined, expected)).toBe('@sittir/rust loaded beside an engine of another stamp');
	});
});
