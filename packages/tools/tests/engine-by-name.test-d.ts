/**
 * Type-level pin: a helper generic over the grammar builds an engine and forwards
 * that grammar's declared render options with no cast, and a concrete grammar still
 * rejects an option it does not declare.
 *
 * Compile-time only: `pnpm --filter @sittir/tools type-check`.
 */

import { createEngine } from '@sittir/common';
import { languageByName, type LanguageApis } from '../src/languages.ts';

export async function engineByName<G extends keyof LanguageApis>(name: G, render?: LanguageApis[G]['options']) {
	const language = await languageByName(name);
	return createEngine(language, render === undefined ? undefined : { render });
}

export async function renderByName<G extends keyof LanguageApis>(
	name: G,
	node: LanguageApis[G]['node'],
	render: LanguageApis[G]['options']
): Promise<string> {
	return (await engineByName(name)).render(node, render).toString();
}

await engineByName('typescript', { indent: '\t' });
await engineByName('python', { indent: '    ' });
// @ts-expect-error a key the language's render options do not declare
await engineByName('python', { nope: 1 });
// @ts-expect-error a key the language's render options do not declare
await createEngine(await languageByName('rust'), { render: { nope: 1 } });
