/**
 * Backend-selection shim — spec 012 T040 (real selection algorithm;
 * overwrites the T019 stub). Picks between the native backend
 * (the grammar-local `sittir-typescript` build) and the TypeScript fallback. See
 * specs/012-rust-core-port/contracts/backend-selection.md for the
 * runtime-selection contract.
 *
 * The selection runs once per module load, is cached as a module-local
 * singleton, never retries, and is reference-stable across the process
 * lifetime. A failure to load native falls back silently to the TS
 * engine; consumers see the decision via `getActiveBackend()` and
 * optionally via the `SITTIR_BACKEND_DEBUG` stderr nudge.
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type {
	JsBackendStatusLike,
	NativeBackendStatusLike,
	NativeEngineLike as CoreNativeEngineLike,
	NativeModuleLike
} from '@sittir/core/engine';
import { TEMPLATE_BUNDLE_HASH } from './hash.js';

const NATIVE_RENDER_TRANSPORT_ABI = 1;

/** Which backend is currently serving render/read/splice. */
export type BackendName = 'native' | 'js';
/** User-facing backend choices. `auto` is the default policy. */
export type BackendChoice = 'auto' | 'native' | 'wasm' | 'js';

export type NativeBackendStatus = NativeBackendStatusLike<NativeModule> & {
	readonly hashMatch: true;
};

export type JsBackendStatus = JsBackendStatusLike & {
	readonly reason: string;
};

/** Result of a backend selection. Frozen — consumers cannot mutate. */
export type BackendStatus = NativeBackendStatus | JsBackendStatus;

/**
 * Structural shape of the grammar-local `sittir-typescript` native module. Matches
 * contracts/napi-api.md — we only require `SittirEngine` with the
 * documented surface. Declared locally (not imported) so the package
 * type-checks even when the native package is not installed.
 */
export interface NativeEngine extends CoreNativeEngineLike<unknown> {
	readonly templateBundleHash: string;
	readonly nativeRenderTransportAbi: number;
	findAndRead(source: string, pattern: string): string;
}

export interface NativeModule extends NativeModuleLike<unknown, NativeEngine> {
	SittirEngine: new (options?: { format?: string }) => NativeEngine;
}

/**
 * Module-local singleton cache. Computed once on first call and then
 * returned by-reference for the rest of the process lifetime. Matches
 * the contract's "never retried, reference-stable" invariant.
 */
let cached: BackendStatus | null = null;

/** Fires only once across the process lifetime — see emitDebug. */
let debugEmitted = false;

/** Package identifier baked into the `SITTIR_BACKEND_DEBUG` log line. */
const PACKAGE_ID = 'sittir/typescript';

/** Workspace-local native module path for the grammar-owned binary. */
const NATIVE_MODULE_PATH = fileURLToPath(new URL('../../../rust/crates/sittir-typescript/index.js', import.meta.url));

function createJsStatus(reason: string, hashMatch?: false): JsBackendStatus {
	if (hashMatch === false) {
		return Object.freeze({ name: 'js', reason, hashMatch: false });
	}
	return Object.freeze({ name: 'js', reason });
}

function createNativeStatus(native: NativeModule): NativeBackendStatus {
	return Object.freeze({ name: 'native', hashMatch: true, native });
}

/**
 * Emit the `SITTIR_BACKEND_DEBUG` stderr line exactly once per process
 * lifetime. Guarded by both the env var and the module-scoped flag so
 * repeat `getActiveBackend()` calls after the singleton is cached do
 * not re-emit.
 */
function emitDebug(status: BackendStatus): void {
	if (debugEmitted) return;
	if (!process.env.SITTIR_BACKEND_DEBUG) return;
	debugEmitted = true;
	const suffix = status.name === 'js' ? `, reason = ${status.reason}` : '';
	try {
		process.stderr.write(`${PACKAGE_ID}: backend = ${status.name}${suffix}\n`);
	} catch {
		// Never throw on stderr write failure — contract invariant.
	}
}

/**
 * Attempt to `require` the grammar-local native build. Uses
 * `createRequire(import.meta.url)` so ESM consumers can still resolve
 * CJS native backends. Returns either the loaded module or a status
 * object carrying the fallback reason.
 */
function tryLoadNative(): NativeModule | { reason: string } {
	try {
		const req = createRequire(import.meta.url);
		const mod = req(NATIVE_MODULE_PATH) as NativeModule;
		return mod;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		// Cannot-find-module surfaces as the common "platform not supported"
		// case; other errors get the generic native-load-failed phrasing.
		if (/Cannot find module/i.test(message) || /MODULE_NOT_FOUND/.test(message)) {
			return { reason: 'native binary not available for this platform' };
		}
		return { reason: `native load failed: ${message}` };
	}
}

/**
 * Run the native load + hash-compare algorithm from
 * contracts/backend-selection.md. Silently falls back to the TS engine
 * on any failure; the reason field carries enough context for the
 * `SITTIR_BACKEND_DEBUG` nudge and programmatic inspection via
 * `getActiveBackend()`.
 *
 * `SITTIR_BACKEND` forced-selection (documented as non-normative in
 * the contract):
 *   - `js` — skip the native load entirely; status.reason
 *     records the override.
 *   - `wasm` — reserved grammar-local backend choice. Until the
 *     package ships a WASM engine, status.reason records the request
 *     and the language package serves the JS backend.
 *   - `native` — disable the silent fall-back; any native-load or
 *     hash-mismatch failure throws loudly so CI parity-diffing
 *     runs fail visibly instead of silently re-running on TS.
 *   - unset / any other value — default try-native-else-JS flow.
 */
function computeBackend(): BackendStatus {
	const forced = process.env.SITTIR_BACKEND;
	if (forced === 'js') {
		return createJsStatus('forced by SITTIR_BACKEND=js');
	}
	if (forced === 'wasm') {
		return createJsStatus('forced by SITTIR_BACKEND=wasm, but @sittir/typescript does not package a WASM backend yet');
	}

	const loaded = tryLoadNative();
	if ('reason' in loaded) {
		if (forced === 'native') {
			throw new Error(`SITTIR_BACKEND=native but native engine unavailable — ${loaded.reason}`);
		}
		return createJsStatus(loaded.reason);
	}

	let hashMatch: boolean;
	let nativeHash: string;
	let nativeRenderTransportAbi: number;
	try {
		const engine = new loaded.SittirEngine();
		nativeHash = engine.templateBundleHash;
		nativeRenderTransportAbi = engine.nativeRenderTransportAbi;
		hashMatch = nativeHash.toLowerCase() === TEMPLATE_BUNDLE_HASH.toLowerCase();
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (forced === 'native') {
			throw new Error(`SITTIR_BACKEND=native but native-engine error at init: ${message}`);
		}
		return createJsStatus(`native-engine error at init: ${message}`);
	}

	if (!hashMatch) {
		if (forced === 'native') {
			throw new Error(
				`SITTIR_BACKEND=native but template-bundle hash mismatch (native=${nativeHash}, ts=${TEMPLATE_BUNDLE_HASH})`
			);
		}
		return createJsStatus('template-bundle hash mismatch', false);
	}

	if (nativeRenderTransportAbi !== NATIVE_RENDER_TRANSPORT_ABI) {
		if (forced === 'native') {
			throw new Error(
				`SITTIR_BACKEND=native but native render transport ABI mismatch (native=${String(nativeRenderTransportAbi)}, ts=${NATIVE_RENDER_TRANSPORT_ABI})`
			);
		}
		return createJsStatus('native render transport ABI mismatch');
	}

	return createNativeStatus(loaded);
}

/**
 * Return the active backend for this package. Safe to call from any
 * consumer code path — never throws, never writes to stdout, writes
 * at most one line to stderr across the process lifetime (gated on
 * `SITTIR_BACKEND_DEBUG`).
 */
export function getActiveBackend(): BackendStatus {
	if (cached !== null) return cached;
	cached = computeBackend();
	emitDebug(cached);
	return cached;
}
