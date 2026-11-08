import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/** Where a grammar package's native binaries are found, and how they are named. */
export interface NativeBindingSpec {
	/** The grammar package, as its consumers name it. */
	readonly packageName: string;
	/** The stem of every binary: `<binaryName>.<platform suffix>.node`. */
	readonly binaryName: string;
	/** The stem of the per-platform packages a release publishes the binaries in: `<platformPackage>-<platform suffix>`. */
	readonly platformPackage: string;
	/** The directory holding the loader, and in a workspace build the host's binary. */
	readonly dir: string;
}

/** The host a binary is chosen for. `libc` is set on linux only. */
export interface HostPlatform {
	readonly platform: string;
	readonly arch: string;
	readonly libc?: 'gnu' | 'musl';
}

/** The running process's host. A linux process that reports no glibc version runs on musl. */
export function hostPlatform(): HostPlatform {
	if (process.platform !== 'linux') return { platform: process.platform, arch: process.arch };
	const header = (process.report?.getReport() as { header?: { glibcVersionRuntime?: string } } | undefined)?.header;
	return { platform: 'linux', arch: process.arch, libc: header?.glibcVersionRuntime === undefined ? 'musl' : 'gnu' };
}

/** The suffix a host's binary carries, in the spelling the build gives it (`darwin-arm64`, `linux-x64-gnu`, `win32-x64-msvc`). */
export function platformSuffix(host: HostPlatform): string {
	if (host.platform === 'linux') return `linux-${host.arch}-${host.libc ?? 'gnu'}`;
	if (host.platform === 'win32') return `win32-${host.arch}-msvc`;
	return `${host.platform}-${host.arch}`;
}

const TARGET_ARCH: Readonly<Record<string, string>> = { aarch64: 'arm64', x86_64: 'x64' };
const TARGET_PLATFORM: Readonly<Record<string, string>> = { darwin: 'darwin', linux: 'linux', windows: 'win32' };

/**
 * The suffix a build target's binary carries.
 *
 * @param target - A Rust target triple, e.g. `aarch64-unknown-linux-musl`.
 * @returns The suffix, in the spelling {@link platformSuffix} gives the matching host.
 * @throws When the triple names an architecture or system no binary is named for.
 */
export function targetSuffix(target: string): string {
	const [cpu, , system, env] = target.split('-');
	const arch = TARGET_ARCH[cpu ?? ''];
	const platform = TARGET_PLATFORM[system ?? ''];
	if (arch === undefined || platform === undefined) throw new Error(`no native binary name for target '${target}'`);
	return platformSuffix({ platform, arch, ...(env === 'musl' || env === 'gnu' ? { libc: env } : {}) });
}

export function platformPackageName(stem: string, suffix: string): string {
	return `${stem}-${suffix}`;
}

export function engineLibraryName(suffix: string): string {
	if (suffix.startsWith('darwin-')) return 'libsittir_engine.dylib';
	if (suffix.startsWith('win32-')) return 'sittir_engine.dll';
	return 'libsittir_engine.so';
}

const STD_LIBRARY_NAME = String.raw`(?:lib)?std-[0-9a-f]+\.(?:dylib|so|dll)`;
const STD_LIBRARY = new RegExp(`^${STD_LIBRARY_NAME}$`);
const LINKED_STD_LIBRARY = new RegExp(`${STD_LIBRARY_NAME}(?=\\0)`, 'g');

export function isStdLibrary(file: string): boolean {
	return STD_LIBRARY.test(file);
}

export function stdLibrariesLinkedBy(image: string): string[] {
	return [...new Set(readFileSync(image).toString('latin1').match(LINKED_STD_LIBRARY) ?? [])];
}

function shippedSuffixes(spec: NativeBindingSpec): string[] {
	if (!existsSync(spec.dir)) return [];
	const prefix = `${spec.binaryName}.`;
	return readdirSync(spec.dir)
		.filter((name) => name.startsWith(prefix) && name.endsWith('.node'))
		.map((name) => name.slice(prefix.length, -'.node'.length))
		.sort();
}

const LOADER_OVERRIDES = ['NAPI_RS_NATIVE_LIBRARY_PATH', 'NAPI_RS_FORCE_WASI'] as const;

export const LOADED_ENGINE = Symbol.for('sittir.engine');

const ENGINE_REFUSAL = 'sittir: ';
const LOADER_SYMBOL_FAILURE =
	/Symbol not found|undefined symbol|Error relocating .*: symbol not found|The specified procedure could not be found/;

interface LoadedEngine {
	readonly stamp: string;
	readonly path?: string;
}

const STAMP_MARKER = Buffer.from('sittir-engine-stamp:');
const STAMP_SHAPE = /^[0-9A-Za-z.+-]+@[0-9A-Za-z._-]+$/;
const STAMP_MAX_LENGTH = 256;

export function engineStampOf(image: string): string {
	const bytes = readFileSync(image);
	const stamps = new Set<string>();
	for (let at = bytes.indexOf(STAMP_MARKER); at >= 0; at = bytes.indexOf(STAMP_MARKER, at + 1)) {
		const start = at + STAMP_MARKER.length;
		const length = bytes.subarray(start, start + STAMP_MAX_LENGTH).indexOf(0);
		const text = length < 0 ? '' : bytes.toString('latin1', start, start + length);
		if (STAMP_SHAPE.test(text)) stamps.add(text);
	}
	if (stamps.size === 0) throw new Error(`${image} holds no engine stamp`);
	if (stamps.size > 1) throw new Error(`${image} holds ${stamps.size} differing engine stamps: ${[...stamps].join(', ')}`);
	return [...stamps][0]!;
}

export function recordLoadedEngine(native: { engineStamp?(): { stamp: string; path?: string | null } }): void {
	const registry = globalThis as Record<symbol, unknown>;
	if (registry[LOADED_ENGINE] !== undefined || typeof native.engineStamp !== 'function') return;
	try {
		const { stamp, path } = native.engineStamp();
		registry[LOADED_ENGINE] = Object.freeze(path === undefined || path === null ? { stamp } : { stamp, path });
	} catch {
		return;
	}
}

function loadedEngine(): LoadedEngine | undefined {
	const entry = (globalThis as Record<symbol, unknown>)[LOADED_ENGINE];
	if (typeof entry !== 'object' || entry === null) return undefined;
	const { stamp, path } = entry as Record<string, unknown>;
	if (typeof stamp !== 'string' || (path !== undefined && typeof path !== 'string')) return undefined;
	return path === undefined ? { stamp } : { stamp, path };
}

function builtStamp(image: string): string | undefined {
	try {
		return engineStampOf(image);
	} catch {
		return undefined;
	}
}

function engineSkew(binaryName: string, image: string, messages: readonly string[]): string | undefined {
	if (!messages.some((message) => LOADER_SYMBOL_FAILURE.test(message))) return undefined;
	const loaded = loadedEngine();
	const built = builtStamp(image);
	if (loaded === undefined || built === undefined || built === loaded.stamp) return undefined;
	return `${ENGINE_REFUSAL}${binaryName} was built against engine ${built} but loaded engine ${loaded.stamp} from ${loaded.path ?? 'an unknown path'}`;
}

interface BinaryHome {
	readonly dir: string;
	readonly label: string;
}

function binaryHomes(spec: NativeBindingSpec, suffix: string): BinaryHome[] {
	const name = platformPackageName(spec.platformPackage, suffix);
	try {
		const manifest = createRequire(join(spec.dir, 'index.cjs')).resolve(`${name}/package.json`);
		return [{ dir: spec.dir, label: 'native/' }, { dir: dirname(manifest), label: `${name}/` }];
	} catch {
		return [{ dir: spec.dir, label: 'native/' }];
	}
}

function linkedStd(image: string): string[] {
	try {
		return stdLibrariesLinkedBy(image);
	} catch {
		return [];
	}
}

function missingCopy(home: BinaryHome, file: string, suffix: string): string | undefined {
	const missing = [engineLibraryName(suffix), ...linkedStd(join(home.dir, file))].find((library) => !existsSync(join(home.dir, library)));
	return missing === undefined ? undefined : `${missing}, which it links, is missing from ${home.label}`;
}

function messagesOf(error: unknown): string[] {
	const messages: string[] = [];
	const seen = new Set<unknown>();
	for (let current = error; current !== undefined && current !== null && !seen.has(current); ) {
		seen.add(current);
		messages.push(current instanceof Error ? current.message : String(current));
		current = current instanceof Error ? current.cause : undefined;
	}
	return messages;
}

/**
 * Why a grammar package's native binding did not load, for the host it was
 * loaded on.
 *
 * @param spec - The package, its binaries' name stem and their directory.
 * @param error - What the loader threw.
 * @param host - The host to explain the failure for; the running process by default.
 * @param env - The environment the loader ran in; the running process's by default.
 * @returns One line. When the environment redirected the loader
 * (`NAPI_RS_NATIVE_LIBRARY_PATH`, `NAPI_RS_FORCE_WASI`), the packaged binary
 * was never tried: the override and the loader's own error. Otherwise the
 * binary is looked for where the loader looks for it: `native/`, then the
 * installed per-platform package. When neither holds it: the file, the package
 * and the platforms `native/` holds. When the binary is there: the reason it
 * would not load — the engine's refusal when it was built against another
 * engine release than the one the process mapped, whether the engine refused it
 * or the loader found a symbol missing; else the first engine or std copy it
 * links that is missing beside it; else the loader's error.
 */
export function nativeLoadFailure(
	spec: NativeBindingSpec,
	error: unknown,
	host: HostPlatform = hostPlatform(),
	env: Readonly<Record<string, string | undefined>> = process.env
): string {
	const messages = messagesOf(error);
	const override = LOADER_OVERRIDES.find((name) => env[name]);
	if (override !== undefined) {
		return (
			`${spec.packageName}: the native loader was redirected by ${override}=${env[override]} ` +
			`and did not try the packaged binary: ${messages.at(-1)!}`
		);
	}
	const suffix = platformSuffix(host);
	const file = `${spec.binaryName}.${suffix}.node`;
	const home = binaryHomes(spec, suffix).find(({ dir }) => existsSync(join(dir, file)));
	if (home === undefined) {
		const shipped = shippedSuffixes(spec);
		return (
			`${spec.packageName} has no native binary for ${suffix}: looked for native/${file} ` +
			`and the package ${platformPackageName(spec.platformPackage, suffix)}; native/ holds ${shipped.length === 0 ? 'none' : shipped.join(', ')}`
		);
	}
	const reason =
		messages.find((message) => message.startsWith(ENGINE_REFUSAL)) ??
		engineSkew(spec.binaryName, join(home.dir, file), messages) ??
		missingCopy(home, file, suffix) ??
		messages.find((message) => message.includes(file) && !message.startsWith('Cannot find module')) ??
		messages[0]!;
	return `${spec.packageName}: ${home.label}${file} is present and failed to load: ${reason}`;
}
