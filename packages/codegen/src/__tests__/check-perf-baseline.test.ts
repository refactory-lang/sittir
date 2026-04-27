/**
 * Tests for `check-perf-baseline.ts` — spec 054 / FR-007.
 *
 * Exercises each verdict branch of the perf regression-checker:
 *   - ok (no regression, schema + platform match)
 *   - schema-mismatch (exit 2)
 *   - platform-mismatch (exit 0 + INFO)
 *   - regression > 10% on `meanRoundtripMs` (exit 1, or 0 + WARN under warnOnly)
 *   - regression > 10% on `totalCalls` (exit 1, or 0 + WARN under warnOnly)
 *   - small change ≤ 10% (no regression — gate respects threshold)
 *
 * Tests feed in-memory baseline + fresh objects to `evaluateVerdict` so
 * the surface stays free of filesystem I/O. The CLI wrapper handles file
 * access; these tests cover the verdict logic exhaustively.
 */

import { describe, it, expect } from "vitest";
import { evaluateVerdict } from "../scripts/check-perf-baseline.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BaselineFfi {
	totalCalls: number;
	meanRoundtripMs: number;
	p99RoundtripMs: number;
	meanPayloadBytes: number;
}

function makeBaseline(ffi: BaselineFfi): Parameters<typeof evaluateVerdict>[0] {
	return {
		schemaVersion: 1,
		warnOnlyUntil: "2026-05-26",
		collectedOn: {
			platform: "darwin",
			nodeVersion: "v24.15.0",
			cpuModel: "Apple M4 Pro",
		},
		ffi,
	};
}

function makeFresh(
	ffi: BaselineFfi | undefined,
	overrides: Partial<{ schemaVersion: number; backend: "ts" | "native"; platform: string }> = {},
): Parameters<typeof evaluateVerdict>[1] {
	return {
		schemaVersion: overrides.schemaVersion ?? 1,
		backend: overrides.backend ?? "native",
		collectedOn: {
			platform: overrides.platform ?? "darwin",
			nodeVersion: "v24.15.0",
			cpuModel: "Apple M4 Pro",
		},
		...(ffi ? { ffi } : {}),
	};
}

const baselineFfi: BaselineFfi = {
	totalCalls: 893,
	meanRoundtripMs: 0.0045,
	p99RoundtripMs: 0.0373,
	meanPayloadBytes: 531,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("evaluateVerdict", () => {
	it("returns ok when fresh matches baseline exactly", () => {
		const v = evaluateVerdict(makeBaseline(baselineFfi), makeFresh(baselineFfi), false);
		expect(v.kind).toBe("ok");
	});

	it("returns ok when meanRoundtripMs increases by ≤ 10%", () => {
		const fresh: BaselineFfi = { ...baselineFfi, meanRoundtripMs: 0.0045 * 1.09 };
		const v = evaluateVerdict(makeBaseline(baselineFfi), makeFresh(fresh), false);
		expect(v.kind).toBe("ok");
	});

	it("returns ok when totalCalls decreases (improvements aren't regressions)", () => {
		const fresh: BaselineFfi = { ...baselineFfi, totalCalls: 700 };
		const v = evaluateVerdict(makeBaseline(baselineFfi), makeFresh(fresh), false);
		expect(v.kind).toBe("ok");
	});

	it("flags meanRoundtripMs regression > 10%", () => {
		const fresh: BaselineFfi = { ...baselineFfi, meanRoundtripMs: 0.0045 * 1.2 };
		const v = evaluateVerdict(makeBaseline(baselineFfi), makeFresh(fresh), false);
		expect(v.kind).toBe("regression");
		if (v.kind === "regression") {
			expect(v.field).toBe("meanRoundtripMs");
			expect(v.deltaPct).toBeGreaterThan(10);
			expect(v.warnOnly).toBe(false);
		}
	});

	it("flags totalCalls regression > 10%", () => {
		const fresh: BaselineFfi = { ...baselineFfi, totalCalls: 1100 };
		const v = evaluateVerdict(makeBaseline(baselineFfi), makeFresh(fresh), false);
		expect(v.kind).toBe("regression");
		if (v.kind === "regression") {
			expect(v.field).toBe("totalCalls");
			expect(v.deltaPct).toBeGreaterThan(10);
		}
	});

	it("propagates warnOnly into regression verdict", () => {
		const fresh: BaselineFfi = { ...baselineFfi, meanRoundtripMs: 0.0045 * 1.2 };
		const v = evaluateVerdict(makeBaseline(baselineFfi), makeFresh(fresh), true);
		expect(v.kind).toBe("regression");
		if (v.kind === "regression") expect(v.warnOnly).toBe(true);
	});

	it("returns platform-mismatch when collectedOn.platform differs", () => {
		const v = evaluateVerdict(
			makeBaseline(baselineFfi),
			makeFresh(baselineFfi, { platform: "linux" }),
			false,
		);
		expect(v.kind).toBe("platform-mismatch");
		if (v.kind === "platform-mismatch") {
			expect(v.baselinePlatform).toBe("darwin");
			expect(v.freshPlatform).toBe("linux");
		}
	});

	it("returns schema-mismatch when schemaVersion differs", () => {
		const v = evaluateVerdict(
			makeBaseline(baselineFfi),
			makeFresh(baselineFfi, { schemaVersion: 2 }),
			false,
		);
		expect(v.kind).toBe("schema-mismatch");
	});

	it("rejects a metrics file with backend ts for the native perf gate", () => {
		const v = evaluateVerdict(
			makeBaseline(baselineFfi),
			{ ...makeFresh(baselineFfi), backend: "ts" },
			false,
		);
		expect(v.kind).toBe("backend-mismatch");
	});

	it("rejects a native metrics file with no ffi block", () => {
		const v = evaluateVerdict(makeBaseline(baselineFfi), makeFresh(undefined), false);
		expect(v.kind).toBe("missing-ffi");
	});

	it("prefers schema-mismatch over platform-mismatch when both differ", () => {
		const v = evaluateVerdict(
			makeBaseline(baselineFfi),
			makeFresh(baselineFfi, { schemaVersion: 2, platform: "linux" }),
			false,
		);
		expect(v.kind).toBe("schema-mismatch");
	});
});
