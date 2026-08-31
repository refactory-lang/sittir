import { describe, it, expect } from 'vitest';
import { OVERLAY_CHAIN, overlayFrame, overlayImportPath } from '../overlays/module.ts';

describe('overlay chain frame', () => {
	it('chain order and import paths', () => {
		expect(OVERLAY_CHAIN).toEqual(['refines', 'polymorphs', 'supertypes']);
		expect(overlayImportPath(0)).toBe('../bundle.js');
		expect(overlayImportPath(1)).toBe('./refines.js');
		expect(overlayImportPath(2)).toBe('./polymorphs.js');
	});

	it('frame imports and re-exports the previous layer', () => {
		const lines = overlayFrame('../bundle.js', ["import * as F from '../raw.js';"]);
		expect(lines).toContain("import * as B from '../bundle.js';");
		expect(lines).toContain("import * as F from '../raw.js';");
		expect(lines).toContain("export * from '../bundle.js';");
	});
});
