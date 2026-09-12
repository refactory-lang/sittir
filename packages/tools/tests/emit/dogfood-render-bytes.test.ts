import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

const CASES = [
	['rust', '17-dogfood-rust.generated.ts', 'rebuildSpliceGenerated', 'dogfood-rust.rendered'],
	['typescript', '18-dogfood-typescript.generated.ts', 'rebuildFormatGenerated', 'dogfood-typescript.rendered'],
	['python', '19-dogfood-python.generated.ts', 'rebuildPython4spaceGenerated', 'dogfood-python.rendered']
] as const;

describe('dogfood rebuild render bytes', () => {
	for (const [grammar, file, exportName, fixture] of CASES) {
		it(`${grammar}: ${exportName} renders the committed fixture byte-for-byte`, async () => {
			const absolute = ROOT + 'examples/' + file;
			const mod = (await import(pathToFileURL(absolute).href)) as Record<string, () => { $render(): string }>;
			const rendered = mod[exportName]!().$render();
			const expected = readFileSync(ROOT + 'packages/tools/tests/emit/__fixtures__/' + fixture, 'utf8');
			expect(rendered).toBe(expected);
		});
	}
});
