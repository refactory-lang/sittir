import { afterEach, describe, expect, it, vi } from "vitest";

const identifier = {
	$type: "identifier",
	$source: "factory",
	$named: true,
	$text: "x",
} as const;

describe("boundary", () => {
	afterEach(() => {
		vi.doUnmock("../src/backend.js");
		vi.restoreAllMocks();
		vi.resetModules();
	});

	function mockNativeFailureBackend(): void {
		vi.resetModules();
		vi.doMock("../src/backend.js", () => ({
			getActiveBackend: () => ({
				name: "native",
				hashMatch: true,
				native: {
					SittirEngine: class {
						render() {
							throw new Error("native render boom");
						}

						applyEdits() {
							throw new Error("native apply boom");
						}
					},
				},
			}),
		}));
	}

	it("surfaces native render failures instead of silently retrying on TS", async () => {
		mockNativeFailureBackend();
		const { render } = await import("../src/boundary.ts");
		expect(() => render(identifier)).toThrow(/native render boom/);
	});

	it("surfaces native applyEdits failures instead of silently retrying on TS", async () => {
		mockNativeFailureBackend();
		const { applyEdits } = await import("../src/boundary.ts");
		expect(() => applyEdits("abc", [])).toThrow(/native apply boom/);
	});
});
