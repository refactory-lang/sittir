import { describe, it, expect } from 'vitest';
import { emitOverlayModule, emitFactoriesIndex, overlayImportPath, OVERLAY_CHAIN } from '../overlays/module.ts';

describe('overlay module text', () => {
	it('re-exports the previous layer and attaches props with attachProps', () => {
		const text = emitOverlayModule({
			importPath: '../raw.js',
			attachments: [
				{
					builder: 'buildLineComment',
					props: [
						{ key: 'docInner', typeExpr: 'typeof F.buildLineCommentDocInner', valueExpr: 'F.buildLineCommentDocInner' }
					]
				}
			]
		});
		expect(text).toContain("import * as F from '../raw.js';");
		expect(text).toContain("import { attachProps } from '../../utils.js';");
		expect(text).toContain("export * from '../raw.js';");
		expect(text).toContain(
			'export const buildLineComment: typeof F.buildLineComment & {\n  docInner: typeof F.buildLineCommentDocInner;\n} = attachProps(F.buildLineComment, {\n  docInner: F.buildLineCommentDocInner,\n});'
		);
	});

	it('quotes keys that are not identifiers', () => {
		const text = emitOverlayModule({
			importPath: './refines.js',
			attachments: [{ builder: 'buildX', props: [{ key: 'doc-inner', typeExpr: 'number', valueExpr: '1' }] }]
		});
		expect(text).toContain('"doc-inner": number;');
		expect(text).toContain('"doc-inner": 1,');
	});

	it('chain paths and the index re-export', () => {
		expect(OVERLAY_CHAIN).toEqual(['refines', 'polymorphs', 'supertypes']);
		expect(overlayImportPath(0)).toBe('../raw.js');
		expect(overlayImportPath(2)).toBe('./polymorphs.js');
		expect(emitFactoriesIndex('supertypes')).toContain("export * from './overlays/supertypes.js';");
		expect(emitFactoriesIndex(undefined)).toContain("export * from './raw.js';");
	});
});
