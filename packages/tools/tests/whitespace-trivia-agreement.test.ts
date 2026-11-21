import { afterAll, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import type { Engine, LanguageAPI } from '@sittir/types';
import { releaseTrackedEngines } from './helpers/track-engines.ts';

vi.mock('@sittir/common', async (importOriginal) => (await import('./helpers/track-engines.ts')).trackingEngines(await importOriginal<typeof import('@sittir/common')>()));
afterAll(releaseTrackedEngines);

/**
 * The text a loose trivia string is read by (`triviaFacts.whitespace`) admits
 * every line-break member's own text. Space and tab members are never asked:
 * the query classifies only runs that hold a line break.
 */
const grammars = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;

describe('whitespace members read the same as loose text', () => {
	for (const grammar of grammars) {
		it(`${grammar}: every line-break member's text is admitted as loose whitespace`, async () => {
			const language = (await import(`../../${grammar}/src/index.ts`)).default;
			const engine = (await createEngine(language)) as Engine<LanguageAPI>;
			const whitespace = engine.trivia.whitespace;
			const members = Object.entries(whitespace?.kindIdByText ?? {}).filter(([text]) => text.includes('\n'));
			expect(members.length).toBeGreaterThan(0);
			for (const [text] of members) expect(whitespace!.run.test(text), `${grammar} run admits ${JSON.stringify(text)}`).toBe(true);
		});
	}
});
