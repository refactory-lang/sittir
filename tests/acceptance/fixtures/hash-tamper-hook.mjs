// Node module-customization-hooks loader (stable since Node 20.6/22) used
// by hash-mismatch-check-runner.mjs. Intercepts any grammar package's
// compiled `dist/hash.js` and substitutes a known-wrong
// `TEMPLATE_BUNDLE_HASH`, simulating a template-bundle hash drift between
// TS-codegen output and the baked-in Rust const — see
// us1-hash-mismatch.test.ts for why this runs in a separate plain Node
// process rather than through vi.doMock.
export async function load(url, context, nextLoad) {
	if (url.endsWith('/hash.js') && url.includes('/dist/')) {
		return {
			format: 'module',
			shortCircuit: true,
			source: "export const TEMPLATE_BUNDLE_HASH = 'deadbeef-tampered-hash-not-the-real-one';"
		};
	}
	return nextLoad(url, context);
}
