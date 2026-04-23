/**
 * Backend-selection shim — spec 012 T018 (stub; T039 fills the real
 * selection algorithm). Picks between the native backend
 * (`@sittir/rust-native`) and the TypeScript fallback. See
 * specs/012-rust-core-port/contracts/backend-selection.md for the
 * runtime-selection contract.
 *
 * This stub always reports the TS fallback. It is intentionally tiny
 * so consumers can depend on `getActiveBackend()` and the
 * `BackendName` / `BackendStatus` types today; the implementation
 * flips to real native-load behaviour in T039 without changing the
 * public surface.
 */

/** Which backend is currently serving render/read/splice. */
export type BackendName = 'native' | 'typescript';

/** Result of a backend selection. Frozen — consumers cannot mutate. */
export interface BackendStatus {
	name: BackendName;
	/** Populated on fallback. Absent when `name === 'native'`. */
	reason?: string;
	/**
	 * Hash-comparison outcome when native was considered. Absent when
	 * native didn't load at all (stub always returns absent).
	 */
	hashMatch?: boolean;
}

/**
 * Module-local singleton cache. Computed once on first call and then
 * returned by-reference for the rest of the process lifetime. Matches
 * the contract's "never retried, reference-stable" invariant.
 */
let cached: BackendStatus | null = null;

/** Package identifier baked into the `SITTIR_BACKEND_DEBUG` log line. */
const PACKAGE_ID = 'sittir/rust';

/**
 * Return the active backend for this package. Safe to call from any
 * consumer code path — never throws, never writes to stdout, writes
 * at most one line to stderr across the process lifetime (gated on
 * `SITTIR_BACKEND_DEBUG`).
 *
 * The stub always selects the TypeScript fallback. T039 replaces
 * this body with the real try-native-then-hash-compare algorithm.
 */
export function getActiveBackend(): BackendStatus {
	if (cached !== null) return cached;
	const status: BackendStatus = Object.freeze({
		name: 'typescript' as const,
		reason: 'not yet implemented',
	});
	if (process.env.SITTIR_BACKEND_DEBUG) {
		try {
			process.stderr.write(
				`${PACKAGE_ID}: backend = ${status.name}, reason = ${status.reason}\n`,
			);
		} catch {
			// Never throw on stderr write failure — contract invariant.
		}
	}
	cached = status;
	return status;
}
