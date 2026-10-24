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
	const file = join(SCRATCH, `forwarded-options-${Math.random().toString(36).slice(2)}.ts`);
	writeFileSync(file, source);
	try {
		const mod = (await import(/* @vite-ignore */ pathToFileURL(file).href)) as { rebuild(): unknown };
		const engine = await createEngine(await languageByName('typescript'));
		return { source, rendered: engine.render(mod.rebuild() as never).toString() };
	} finally {
		rmSync(file, { force: true });
	}
}

describe('an owner that forwards to a list and has options of its own', () => {
	it('is printed with the list built as its value and its own options second', async () => {
		const { source, rendered } = await rebuildAndRender('class A {\n  static {\n    x = 1;\n  }\n}\n');
		expect(source).toContain('ts.build.classStaticBlock.strict(ts.build.statementBlock.strict(');
		expect(rendered.replace(/\s+/g, ' ')).toContain('static { x = 1; }');
	}, 60_000);
});
