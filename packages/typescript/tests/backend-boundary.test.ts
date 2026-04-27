import { afterEach, describe, expect, it, vi } from "vitest";

const identifier = {
	$type: "identifier",
	$source: "factory",
	$named: true,
	$text: "x",
} as const;

describe("boundary", () => {
	afterEach(() => {
		vi.doUnmock("../src/backend.ts");
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it("surfaces native render failures instead of silently retrying on TS", async () => {
		vi.doMock("../src/backend.ts", () => ({
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

		const { render } = await import("../src/boundary.ts");
		expect(() => render(identifier)).toThrow(/native render boom/);
	});
});
