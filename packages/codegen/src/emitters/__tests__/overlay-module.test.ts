import { describe, it, expect } from 'vitest';
import { OVERLAY_CHAIN, overlayFrame, overlayImportPath } from '../overlays/module.ts';

describe('overlay chain frame', () => {
	it('chain order and import paths', () => {
		expect(OVERLAY_CHAIN).toEqual(['refines', 'polymorphs', 'supertypes']);
		expect(overlayImportPath(0)).toBe('../bundle.js');
		expect(overlayImportPath(1)).toBe('./refines.js');
		expect(overlayImportPath(2)).toBe('./polymorphs.js');
	});

	it('frame imports what the body uses and re-exports the previous layer', () => {
		const body = ['export const x = {', '\t...B.x,', '\tcurly: { strict: F.buildXCurly },', '};'];
		const lines = overlayFrame('../bundle.js', body, ["import * as F from '../raw.js';"]);
		expect(lines).toContain("import * as B from '../bundle.js';");
		expect(lines).toContain("import * as F from '../raw.js';");
		expect(lines).toContain("export * from '../bundle.js';");
	});

	it('omits an import the body never references', () => {
		// A layer that only re-exports names neither namespace, and an
		// emitted import nothing uses is a lint error in the generated
		// package — the strict generated-lint gate has zero tolerance.
		const lines = overlayFrame('./polymorphs.js', []);
		expect(lines).not.toContain("import * as B from './polymorphs.js';");
		expect(lines).toContain("export * from './polymorphs.js';");
	});

	it('keeps only the extra imports the body actually names', () => {
		const body = ['export const x = { ...B.x, id: TSKindId.X };'];
		const lines = overlayFrame('../bundle.js', body, [
			"import * as F from '../raw.js';",
			"import { TSKindId } from '../../types.js';"
		]);
		expect(lines).toContain("import { TSKindId } from '../../types.js';");
		expect(lines).not.toContain("import * as F from '../raw.js';");
	});
});
