import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';
import { languageByName } from '../../src/languages.ts';
import { releaseTrackedEngines } from '../helpers/track-engines.ts';

vi.mock('@sittir/common', async (importOriginal) => (await import('../helpers/track-engines.ts')).trackingEngines(await importOriginal<typeof import('@sittir/common')>()));
afterAll(releaseTrackedEngines);

const SCRATCH = join(dirname(fileURLToPath(import.meta.url)), '__scratch__');

async function rebuilt(grammar: 'rust' | 'python' | 'typescript', input: string): Promise<string> {
	const source = await emitFactorySourceText(grammar, input, 'rebuild');
	mkdirSync(SCRATCH, { recursive: true });
	const file = join(SCRATCH, `blank-after-comment-${Math.random().toString(36).slice(2)}.ts`);
	writeFileSync(file, source);
	try {
		const mod = (await import(/* @vite-ignore */ pathToFileURL(file).href)) as { rebuild(): unknown };
		using engine = await createEngine(await languageByName(grammar));
		try {
			return engine.render(mod.rebuild() as never).toString();
		} finally {
			engine.dispose();
		}
	} finally {
		rmSync(file, { force: true });
	}
}

describe('a blank line after a line comment survives the printed rebuild', () => {
	it.each([
		['rust', '//! head\n//! more\n\nuse a::b;\n'],
		['rust', '// c\n\nfn f() {}\n'],
		['python', '# c\n\nx = 1\n'],
		['typescript', '// c\n\nconst x = 1;\n']
	] as const)('%s: %j', async (grammar, input) => {
		expect(await rebuilt(grammar, input)).toBe(input);
	});
});
