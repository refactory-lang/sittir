import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';
import { languageByName } from '../../src/languages.ts';

const SCRATCH = join(dirname(fileURLToPath(import.meta.url)), '__scratch__');

async function rebuildAndRender(input: string): Promise<{ source: string; rendered: string }> {
	const source = await emitFactorySourceText('typescript', input, 'rebuild');
	mkdirSync(SCRATCH, { recursive: true });
	const file = join(SCRATCH, `separators-${Math.random().toString(36).slice(2)}.ts`);
	writeFileSync(file, source);
	try {
		const mod = (await import(/* @vite-ignore */ pathToFileURL(file).href)) as { rebuild(): unknown };
		const engine = await createEngine(await languageByName('typescript'));
		return { source, rendered: engine.render(mod.rebuild() as never).toString() };
	} finally {
		rmSync(file, { force: true });
	}
}

describe('a printed list keeps the separator its source uses', () => {
	it('names a line break between members and renders it', async () => {
		const { source, rendered } = await rebuildAndRender('type S = {\n  a: number\n  b: number\n}\n');
		expect(source).toContain('separator: ts.kinds.AutomaticSemicolon');
		expect(rendered).not.toContain(';');
	});

	it('names a comma between members and renders it', async () => {
		const { source, rendered } = await rebuildAndRender('type S = { a: number, b: number }\n');
		expect(source).toContain('separator: ts.kinds.Comma');
		expect(rendered).toContain('a: number,');
	});
});
