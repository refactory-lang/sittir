/**
 * Opt-in render telemetry — spec 054-post-016-perf-tracking.
 *
 * Gated entirely on the `SITTIR_METRICS=1` env var, which is read ONCE
 * at module initialisation and cached as a boolean. When the var is unset,
 * `withMetrics` is a transparent passthrough with zero runtime cost — no
 * branch inside the hot path, no allocation.
 *
 * Writes `metrics-{ts,native}.json` via `dumpMetrics()`, which validators
 * call after their final render pass when the env var is set.
 */

import { writeFileSync } from 'node:fs';
import { join as pathJoin } from 'node:path';
import os from 'node:os';

// ---------------------------------------------------------------------------
// Boot-time flag — evaluated ONCE, never re-read.
// ---------------------------------------------------------------------------

const METRICS_ENABLED: boolean = process.env['SITTIR_METRICS'] === '1';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PerKindMetrics {
	readonly grammar: string;
	readonly callCount: number;
	/** Arithmetic mean of per-call wall time in milliseconds. */
	readonly meanMs: number;
	/** 99th-percentile wall time in milliseconds (exact — sorted sample). */
	readonly p99Ms: number;
	/** Total output bytes across all calls for this kind. */
	readonly outputBytes: number;
	/** Heap delta (heapUsed after − before) summed across calls, bytes. */
	readonly heapDeltaBytes: number;
	/** FFI payload bytes (JSON.stringify size) — native backend only. */
	readonly napiCopyBytes?: number;
}

export interface FfiMetrics {
	readonly totalCalls: number;
	readonly meanRoundtripMs: number;
	readonly p99RoundtripMs: number;
	readonly meanPayloadBytes: number;
}

export interface MetricsFile {
	readonly schemaVersion: 1;
	readonly backend: 'ts' | 'native';
	readonly collectedAt: string;
	readonly collectedOn: {
		readonly platform: string;
		readonly nodeVersion: string;
		readonly cpuModel: string;
	};
	readonly memory: {
		readonly tsHeapDeltaBytes: number;
		readonly rustResidentDeltaBytes?: number;
		readonly napiCopyBytes?: number;
		readonly napiCopyBytesEstimate: boolean;
	};
	readonly ffi?: FfiMetrics;
	readonly perKind: Readonly<Record<string, PerKindMetrics>>;
}

// ---------------------------------------------------------------------------
// Internal accumulator (module-private)
// ---------------------------------------------------------------------------

interface KindBucket {
	grammar: string;
	callCount: number;
	totalMs: number;
	samples: number[];
	outputBytes: number;
	heapDeltaBytes: number;
	napiCopyBytes: number;
}

interface FfiBucket {
	totalCalls: number;
	totalMs: number;
	samples: number[];
	totalPayloadBytes: number;
}

const _perKind = new Map<string, KindBucket>();
const _ffi: FfiBucket = {
	totalCalls: 0,
	totalMs: 0,
	samples: [],
	totalPayloadBytes: 0
};

function _key(grammar: string, kind: string): string {
	return `${grammar}:${kind}`;
}

function _p99(samples: number[]): number {
	if (samples.length === 0) return 0;
	const sorted = [...samples].sort((a, b) => a - b);
	const idx = Math.max(0, Math.ceil(sorted.length * 0.99) - 1);
	return sorted[idx]!;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Wrap a render call with telemetry capture. When `SITTIR_METRICS=1` is unset
 * this is a transparent passthrough — zero overhead, no allocation, no branch
 * inside the hot path (the guard is eliminated at module-load time by the
 * conditional below that replaces the function reference with an identity).
 *
 * @param grammar - Grammar name, e.g. `'rust'`.
 * @param kind - Node kind, e.g. `'function_item'`.
 * @param fn - Render thunk; its return value is passed through unchanged.
 * @returns The return value of `fn()`.
 */
export function withMetrics<T>(grammar: string, kind: string, fn: () => T): T {
	if (!METRICS_ENABLED) return fn();

	const before = performance.now();
	const heapBefore = process.memoryUsage().heapUsed;
	// Errors propagate unchanged — metrics path never swallows exceptions.
	const result = fn();
	const afterMs = performance.now() - before;
	const heapDelta = process.memoryUsage().heapUsed - heapBefore;
	const outputBytes =
		typeof result === 'string'
			? (result as string).length
			: JSON.stringify(result).length;

	const k = _key(grammar, kind);
	const existing = _perKind.get(k);
	if (existing) {
		existing.callCount++;
		existing.totalMs += afterMs;
		existing.samples.push(afterMs);
		existing.outputBytes += outputBytes;
		existing.heapDeltaBytes += heapDelta;
	} else {
		_perKind.set(k, {
			grammar,
			callCount: 1,
			totalMs: afterMs,
			samples: [afterMs],
			outputBytes,
			heapDeltaBytes: heapDelta,
			napiCopyBytes: 0
		});
	}

	return result;
}

/**
 * Record a single FFI (napi) round-trip cost. Called by boundary.ts around
 * each `engine.render(JSON.stringify(node))` call when SITTIR_METRICS=1.
 *
 * @param grammar - Grammar name (used for per-kind correlation).
 * @param kind - Node kind (used to attribute `napiCopyBytes` to the right bucket).
 * @param payloadBytes - `JSON.stringify(node).length` — proxy for wire size.
 * @param roundtripMs - Elapsed time from stringify to napi return, milliseconds.
 * @param outputBytes - Length of the returned string from napi.
 */
export function recordFfi(
	grammar: string,
	kind: string,
	payloadBytes: number,
	roundtripMs: number,
	outputBytes: number
): void {
	if (!METRICS_ENABLED) return;

	_ffi.totalCalls++;
	_ffi.totalMs += roundtripMs;
	_ffi.samples.push(roundtripMs);
	_ffi.totalPayloadBytes += payloadBytes;

	// Attribute napi copy bytes to the per-kind bucket.
	const k = _key(grammar, kind);
	const existing = _perKind.get(k);
	if (existing) {
		existing.napiCopyBytes += payloadBytes + outputBytes;
	} else {
		_perKind.set(k, {
			grammar,
			callCount: 0, // withMetrics drives the count; this is FFI-only attribution
			totalMs: 0,
			samples: [],
			outputBytes: 0,
			heapDeltaBytes: 0,
			napiCopyBytes: payloadBytes + outputBytes
		});
	}
}

/**
 * Serialise the accumulated MetricsStore to `metrics-{ts,native}.json`.
 * No-op when `SITTIR_METRICS=1` is unset.
 *
 * @param backend - Which backend produced the metrics.
 * @param outDir - Directory to write the file into (defaults to `process.cwd()`).
 */
export function dumpMetrics(backend: 'ts' | 'native', outDir?: string): void {
	if (!METRICS_ENABLED) return;

	const dir = outDir ?? process.cwd();
	const filename = `metrics-${backend}.json`;

	const perKindOut: Record<string, PerKindMetrics> = {};
	let totalHeapDelta = 0;
	let totalNapiCopy = 0;

	// Sort by key for deterministic diffs.
	const sortedKeys = [..._perKind.keys()].sort();
	for (const k of sortedKeys) {
		const b = _perKind.get(k)!;
		const kindName = k.split(':')[1] ?? k;
		const meanMs = b.callCount > 0 ? b.totalMs / b.callCount : 0;
		const p99Ms = _p99(b.samples);
		const entry: PerKindMetrics = {
			grammar: b.grammar,
			callCount: b.callCount,
			meanMs: Number(meanMs.toFixed(4)),
			p99Ms: Number(p99Ms.toFixed(4)),
			outputBytes: b.outputBytes,
			heapDeltaBytes: b.heapDeltaBytes,
			...(backend === 'native' && b.napiCopyBytes > 0
				? { napiCopyBytes: b.napiCopyBytes }
				: {})
		};
		perKindOut[kindName] = entry;
		totalHeapDelta += b.heapDeltaBytes;
		totalNapiCopy += b.napiCopyBytes;
	}

	const ffiOut: FfiMetrics | undefined =
		backend === 'native' && _ffi.totalCalls > 0
			? {
					totalCalls: _ffi.totalCalls,
					meanRoundtripMs: Number((_ffi.totalMs / _ffi.totalCalls).toFixed(4)),
					p99RoundtripMs: Number(_p99(_ffi.samples).toFixed(4)),
					meanPayloadBytes: Math.round(_ffi.totalPayloadBytes / _ffi.totalCalls)
				}
			: undefined;

	const rssNow = process.memoryUsage().rss;
	const file: MetricsFile = {
		schemaVersion: 1,
		backend,
		collectedAt: new Date().toISOString(),
		collectedOn: {
			platform: process.platform,
			nodeVersion: process.version,
			cpuModel: os.cpus()[0]?.model ?? 'unknown'
		},
		memory: {
			tsHeapDeltaBytes: totalHeapDelta,
			...(backend === 'native'
				? {
						rustResidentDeltaBytes: rssNow,
						napiCopyBytes: totalNapiCopy,
						napiCopyBytesEstimate: true
					}
				: { napiCopyBytesEstimate: false })
		},
		...(ffiOut ? { ffi: ffiOut } : {}),
		perKind: perKindOut
	};

	writeFileSync(
		pathJoin(dir, filename),
		JSON.stringify(file, null, 2) + '\n',
		'utf-8'
	);
}

/**
 * Whether metrics collection is active. Exposed so call sites that need to
 * branch (e.g. FFI boundary timer) can gate on a single property read rather
 * than re-evaluating the env var.
 */
export const metricsEnabled: boolean = METRICS_ENABLED;
