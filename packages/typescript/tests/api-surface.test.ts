/**
 * Spec 012 T063 — SC-008 gate (no breaking API changes).
 *
 * Captures the top-level export surface of `@sittir/typescript` as a
 * vitest snapshot. See `packages/rust/tests/api-surface.test.ts` for
 * the rationale + invariants this gates.
 */

import { describe, expect, test } from "vitest";

describe("@sittir/typescript — API surface snapshot (SC-008)", () => {
	test("top-level exports", async () => {
		const mod = (await import("@sittir/typescript")) as Record<string, unknown>;
		const surface: Record<string, string> = {};
		for (const name of Object.keys(mod).sort()) {
			const value = mod[name];
			surface[name] =
				value === null
					? "null"
					: typeof value === "function"
						? "function"
						: typeof value === "object"
							? Array.isArray(value)
								? "array"
								: "object"
							: typeof value;
		}
		expect(surface).toMatchSnapshot();
	});
});
