import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { subset } from 'semver';
import { describe, expect, it } from 'vitest';
import {
	NATIVE_NAPI_CONFIG,
	NATIVE_TARGETS,
	NODE_API_NODE_RANGES,
	allGrammars,
	grammarPackageDir,
	nativeCrateDir,
	nodeRangeOfNodeApi,
	workspaceNodeApiLevel
} from '../../grammars.ts';
import { nativeCrateFiles } from '../native-crate.ts';

const nodeApiLevel = workspaceNodeApiLevel();
const nativeFloor = nodeRangeOfNodeApi(nodeApiLevel);
const recordedLevels = Object.keys(NODE_API_NODE_RANGES).map(Number);
const crateManifest = (grammar: string, level: number): string => nativeCrateFiles(grammar, level).find((file) => file.path === 'package.json')!.contents;
const admitsOnlyLoadable = (range: string): boolean => subset(range, nativeFloor);

describe('a grammar crate builds its binding', () => {
	it('under the release profile for CI and publishing, and the gate profile for local regeneration', () => {
		const pkg = JSON.parse(crateManifest('rust', nodeApiLevel)) as { scripts: Record<string, string> };
		expect(pkg.scripts).toEqual({
			build: 'tsx ../../../scripts/build-native.mts rust --release',
			'build:debug': 'tsx ../../../scripts/build-native.mts rust',
			'build:gate': 'tsx ../../../scripts/build-native.mts rust --profile gate'
		});
	});
});

describe("napi reads a grammar crate's config from its own file", () => {
	it('names the binary, the stem of the platform packages and the targets', () => {
		const config = nativeCrateFiles('rust', nodeApiLevel).find((file) => file.path === NATIVE_NAPI_CONFIG);
		expect(JSON.parse(config?.contents ?? '{}')).toEqual({ binaryName: 'sittir-rust', packageName: 'sittir-rust', targets: [...NATIVE_TARGETS] });
	});

	it('keeps the version and the napi config out of the crate manifest: the grammar package holds the one version', () => {
		const pkg = JSON.parse(crateManifest('rust', nodeApiLevel)) as Record<string, unknown>;
		expect(pkg).not.toHaveProperty('version');
		expect(pkg).not.toHaveProperty('napi');
	});
});

describe('every grammar crate holds the generated crate files', () => {
	for (const grammar of allGrammars()) {
		for (const file of nativeCrateFiles(grammar, nodeApiLevel)) {
			it(`${grammar} ${file.path}`, () => {
				expect(readFileSync(join(nativeCrateDir(grammar), file.path), 'utf8')).toBe(file.contents);
			});
		}
	}
});

describe('a grammar addon links the shared engine', () => {
	const files = nativeCrateFiles('python', nodeApiLevel);
	const buildScript = files.find((file) => file.path === 'build.rs')!.contents;
	const manifest = files.find((file) => file.path === 'Cargo.toml')!.contents;

	it('finds the engine and std in its own folder: an @loader_path rpath on macOS, a RUNPATH of $ORIGIN on Linux', () => {
		expect(buildScript).toContain('cargo:rustc-cdylib-link-arg=-Wl,-rpath,@loader_path');
		expect(buildScript).toContain('cargo:rustc-cdylib-link-arg=-Wl,-rpath,$ORIGIN');
		expect(buildScript).toContain('cargo:rustc-cdylib-link-arg=-Wl,--enable-new-dtags');
	});

	it('compiles its parser and scanners to allocate through the runtime allocator slots', () => {
		expect(buildScript.match(/allocate_through_runtime\(&mut \w+\);/g)).toHaveLength(2);
		expect(buildScript).toContain('build.define("TREE_SITTER_REUSE_ALLOCATOR", None);');
	});

	it('reaches each slot the engine exports through its import on MSVC', () => {
		expect(buildScript).toContain('std::env::var("DEP_SITTIR_ENGINE_ALLOCATOR_SLOTS")');
		expect(buildScript).toContain('build.define(slot, format!("(*__imp_{slot})").as_str());');
	});

	it('depends on the engine, whose build hands it the slot names', () => {
		expect(manifest).toMatch(/^sittir-engine = \{ workspace = true \}$/m);
	});

	it('declares no tree-sitter of its own, and reaches the one the engine holds', () => {
		expect(manifest).not.toMatch(/^tree-sitter = /m);
		expect(files.find((file) => file.path === 'src/lib.rs')!.contents).toContain('use sittir_core::tree_sitter;');
	});
});

describe('a native addon publishes the Node floor of the Node-API level it builds with', () => {
	it('writes the range of the workspace napi feature into the crate manifest', () => {
		const pkg = JSON.parse(crateManifest('rust', nodeApiLevel)) as { engines: { node: string } };
		expect(pkg.engines.node).toBe(nativeFloor);
	});

	it('leaves the committed crate manifest stale when the napi feature moves to another level', () => {
		const otherLevel = recordedLevels.find((level) => level !== nodeApiLevel)!;
		expect(crateManifest('rust', otherLevel)).not.toBe(readFileSync(join(nativeCrateDir('rust'), 'package.json'), 'utf8'));
	});

	it('refuses a Node-API level the table records no range for', () => {
		const unrecorded = Math.max(...recordedLevels) + 1;
		expect(() => crateManifest('rust', unrecorded)).toThrow(`Node-API ${unrecorded} has no Node range in NODE_API_NODE_RANGES`);
	});
});

describe('a grammar package admits no Node its native addon cannot load', () => {
	for (const grammar of allGrammars()) {
		it(grammar, () => {
			const { engines } = JSON.parse(readFileSync(join(grammarPackageDir(grammar), 'package.json'), 'utf8')) as { engines?: { node?: string } };
			expect(engines?.node).toBeDefined();
			expect(admitsOnlyLoadable(engines!.node!)).toBe(true);
		});
	}

	it('fails a range that admits a Node below the native floor', () => {
		expect(admitsOnlyLoadable('>=20.0.0')).toBe(false);
	});
});
