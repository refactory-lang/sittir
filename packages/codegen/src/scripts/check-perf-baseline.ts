/**
 * check-perf-baseline.ts — spec 054 FR-007.
 *
 * Reads the committed `PerfBaseline` (`specs/054-post-016-perf-tracking/baselines/perf-native.json`)
 * and a freshly produced `MetricsFile` (`metrics-native.json` in cwd or
 * the path provided via `--metrics`). Compares `ffi.meanRoundtripMs` and
 * `ffi.totalCalls`; exits per the verdict rules in spec FR-007:
 *
 *   - regression > 10% AND `SITTIR_METRICS_FFI_WARN_ONLY` unset → exit 1
 *   - regression > 10% AND `SITTIR_METRICS_FFI_WARN_ONLY=1`     → exit 0 + `[WARN]` to stderr
 *   - `collectedOn.platform` differs                            → exit 0 + `[INFO]` to stderr
 *   - `schemaVersion` differs                                   → exit 2
 *   - all good                                                  → exit 0 (silent)
 *
 * Usage:
 *   npx tsx packages/codegen/src/scripts/check-perf-baseline.ts \
 *     [--baseline <path>] [--metrics <path>]
 *
 * Default `--baseline` → `specs/054-post-016-perf-tracking/baselines/perf-native.json`
 * Default `--metrics`  → `./metrics-native.json`
 *
 * The script is also exported as a function (`checkPerfBaseline`) so unit
 * tests can stub the two file paths and exercise each verdict branch
 * deterministically.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url)).replace(/\/$/, "");

// ---------------------------------------------------------------------------
// Schema types — mirror packages/core/src/metrics.ts
// ---------------------------------------------------------------------------

/** Subset of MetricsFile we read. Keep in sync with packages/core/src/metrics.ts. */
interface MetricsFile {
	readonly schemaVersion: number;
	readonly backend: "ts" | "native";
	readonly collectedOn: {
		readonly platform: string;
		readonly nodeVersion: string;
		readonly cpuModel: string;
	};
	readonly ffi?: {
		readonly totalCalls: number;
		readonly meanRoundtripMs: number;
		readonly p99RoundtripMs: number;
		readonly meanPayloadBytes: number;
	};
}

interface PerfBaseline {
	readonly schemaVersion: number;
	readonly warnOnlyUntil: string; // ISO date
	readonly collectedOn: {
		readonly platform: string;
		readonly nodeVersion: string;
		readonly cpuModel: string;
	};
	readonly ffi: {
		readonly totalCalls: number;
		readonly meanRoundtripMs: number;
		readonly p99RoundtripMs: number;
		readonly meanPayloadBytes: number;
	};
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

export type Verdict =
	| { kind: "ok" }
	| { kind: "platform-mismatch"; baselinePlatform: string; freshPlatform: string }
	| { kind: "schema-mismatch"; baselineVersion: number; freshVersion: number }
	| {
			kind: "regression";
			field: "meanRoundtripMs" | "totalCalls";
			baseline: number;
			fresh: number;
			deltaPct: number;
			warnOnly: boolean;
	  };

const REGRESSION_THRESHOLD_PCT = 10;

/**
 * Compute the verdict for a baseline + fresh metrics pair. Pure function —
 * no I/O, no env-var reads. Caller wires the env-var (warnOnly) and exit
 * codes around it.
 */
export function evaluateVerdict(
	baseline: PerfBaseline,
	fresh: MetricsFile,
	warnOnly: boolean,
): Verdict {
	if (baseline.schemaVersion !== fresh.schemaVersion) {
		return {
			kind: "schema-mismatch",
			baselineVersion: baseline.schemaVersion,
			freshVersion: fresh.schemaVersion,
		};
	}
	if (baseline.collectedOn.platform !== fresh.collectedOn.platform) {
		return {
			kind: "platform-mismatch",
			baselinePlatform: baseline.collectedOn.platform,
			freshPlatform: fresh.collectedOn.platform,
		};
	}
	const ffi = fresh.ffi;
	if (!ffi) {
		// No FFI block in fresh metrics — only the native backend produces
		// it. Treat as "ok" (the gate doesn't apply to TS-backend runs).
		return { kind: "ok" };
	}
	const meanDelta = pctDelta(baseline.ffi.meanRoundtripMs, ffi.meanRoundtripMs);
	if (meanDelta > REGRESSION_THRESHOLD_PCT) {
		return {
			kind: "regression",
			field: "meanRoundtripMs",
			baseline: baseline.ffi.meanRoundtripMs,
			fresh: ffi.meanRoundtripMs,
			deltaPct: meanDelta,
			warnOnly,
		};
	}
	const callsDelta = pctDelta(baseline.ffi.totalCalls, ffi.totalCalls);
	if (callsDelta > REGRESSION_THRESHOLD_PCT) {
		return {
			kind: "regression",
			field: "totalCalls",
			baseline: baseline.ffi.totalCalls,
			fresh: ffi.totalCalls,
			deltaPct: callsDelta,
			warnOnly,
		};
	}
	return { kind: "ok" };
}

/** Percentage change from `before` to `after`; positive = increase. */
function pctDelta(before: number, after: number): number {
	if (before === 0) return after === 0 ? 0 : Number.POSITIVE_INFINITY;
	return ((after - before) / before) * 100;
}

// ---------------------------------------------------------------------------
// File loading
// ---------------------------------------------------------------------------

function readJson<T>(path: string): T {
	if (!existsSync(path)) {
		throw new Error(`file not found: ${path}`);
	}
	const raw = readFileSync(path, "utf-8");
	return JSON.parse(raw) as T;
}

// ---------------------------------------------------------------------------
// Top-level driver — exported for tests + CLI
// ---------------------------------------------------------------------------

/** Result of running the check end-to-end. Tests assert on `exitCode`. */
export interface CheckResult {
	exitCode: 0 | 1 | 2;
	verdict: Verdict;
	stderrLine?: string;
}

/**
 * Run the full check given concrete file paths. Returns the exit code +
 * stderr line (caller writes it). Pure I/O wrapper around `evaluateVerdict`.
 *
 * @param baselinePath - Path to the committed `PerfBaseline` JSON.
 * @param metricsPath  - Path to a freshly produced `MetricsFile` JSON.
 * @param warnOnly     - When true, regressions print a warning instead of
 *   exiting non-zero. Driven by `SITTIR_METRICS_FFI_WARN_ONLY=1` in the CLI.
 */
export function checkPerfBaseline(
	baselinePath: string,
	metricsPath: string,
	warnOnly: boolean,
): CheckResult {
	const baseline = readJson<PerfBaseline>(baselinePath);
	const fresh = readJson<MetricsFile>(metricsPath);
	const verdict = evaluateVerdict(baseline, fresh, warnOnly);

	switch (verdict.kind) {
		case "ok":
			return { exitCode: 0, verdict };
		case "schema-mismatch":
			return {
				exitCode: 2,
				verdict,
				stderrLine: `[ERROR] schemaVersion mismatch — baseline=${verdict.baselineVersion} fresh=${verdict.freshVersion}`,
			};
		case "platform-mismatch":
			return {
				exitCode: 0,
				verdict,
				stderrLine: `[INFO] platform mismatch — perf gate skipped (baseline=${verdict.baselinePlatform} fresh=${verdict.freshPlatform})`,
			};
		case "regression": {
			const line = `${verdict.warnOnly ? "[WARN]" : "[ERROR]"} ffi regression: ${verdict.field} baseline=${verdict.baseline} fresh=${verdict.fresh} delta=+${verdict.deltaPct.toFixed(2)}%`;
			return {
				exitCode: verdict.warnOnly ? 0 : 1,
				verdict,
				stderrLine: line,
			};
		}
	}
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface CliArgs {
	baseline: string;
	metrics: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
	let baseline = resolve(repoRoot, "specs/054-post-016-perf-tracking/baselines/perf-native.json");
	let metrics = resolve(process.cwd(), "metrics-native.json");
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--baseline" && i + 1 < argv.length) {
			baseline = resolve(process.cwd(), argv[++i]!);
		} else if (a === "--metrics" && i + 1 < argv.length) {
			metrics = resolve(process.cwd(), argv[++i]!);
		} else if (a === "--help" || a === "-h") {
			process.stdout.write(
				"Usage: check-perf-baseline.ts [--baseline <path>] [--metrics <path>]\n",
			);
			process.exit(0);
		}
	}
	return { baseline, metrics };
}

const isCli = (() => {
	if (process.argv[1] == null) return false;
	try {
		return pathToFileURL(process.argv[1]).href === import.meta.url;
	} catch {
		return false;
	}
})();

if (isCli) {
	const args = parseArgs(process.argv.slice(2));
	const warnOnly = process.env["SITTIR_METRICS_FFI_WARN_ONLY"] === "1";
	const result = checkPerfBaseline(args.baseline, args.metrics, warnOnly);
	if (result.stderrLine) process.stderr.write(`${result.stderrLine}\n`);
	process.exit(result.exitCode);
}
