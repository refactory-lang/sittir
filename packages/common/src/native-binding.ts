import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Where a grammar package keeps its native binaries, and how they are named. */
export interface NativeBindingSpec {
	/** The package the binaries ship in, as its consumers name it. */
	readonly packageName: string;
	/** The stem of every binary: `<binaryName>.<platform suffix>.node`. */
	readonly binaryName: string;
	/** The directory holding the loader and the binaries. */
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

export function engineStampFileOf(binaryFile: string): string {
	return binaryFile.replace(/\.node$/, '.engine-stamp');
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

function builtStamp(dir: string, file: string): string | undefined {
	try {
		return readFileSync(join(dir, engineStampFileOf(file)), 'utf8').trim();
	} catch {
		return undefined;
	}
}

function engineSkew(spec: NativeBindingSpec, file: string, messages: readonly string[]): string | undefined {
	if (!messages.some((message) => LOADER_SYMBOL_FAILURE.test(message))) return undefined;
	const loaded = loadedEngine();
	const built = builtStamp(spec.dir, file);
	if (loaded === undefined || built === undefined || built === loaded.stamp) return undefined;
	return `${ENGINE_REFUSAL}${spec.binaryName} was built against engine ${built} but loaded engine ${loaded.stamp} from ${loaded.path ?? 'an unknown path'}`;
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
 * was never tried: the override and the loader's own error. Otherwise, when
 * the package holds no binary for the host: the file it looked for and the
 * platforms it does ship. When the binary is there: the reason it would not load —
 * the engine's refusal when the binary was built against another engine release than
 * the one the process mapped, whether the engine refused it or the loader found a
 * symbol missing.
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
	const shipped = shippedSuffixes(spec);
	if (!shipped.includes(suffix)) {
		return (
			`${spec.packageName} has no native binary for ${suffix}: looked for native/${file}; ` +
			`it ships ${shipped.length === 0 ? 'none' : shipped.join(', ')}`
		);
	}
	const reason =
		messages.find((message) => message.startsWith(ENGINE_REFUSAL)) ??
		engineSkew(spec, file, messages) ??
		messages.find((message) => message.includes(file) && !message.startsWith('Cannot find module')) ??
		messages[0]!;
	return `${spec.packageName}: native/${file} is present and failed to load: ${reason}`;
}
