// Every corpus root without a parse error writes JSON that the engine's
// reviver builds back into a node writing the same JSON. An entry known to
// fail is named with its reason, and must still fail, so a fix retires it.
import { describe, expect, it } from 'vitest';
import { loadCorpusEntries, loadNativeEngine } from '../src/validate/common.ts';

const KNOWN: Readonly<Record<string, Readonly<Record<string, string>>>> = {};

function holdsError(value: unknown): boolean {
	if (Array.isArray(value)) return value.some(holdsError);
	if (value === null || typeof value !== 'object') return false;
	return (value as { $type?: unknown }).$type === 'ERROR' || Object.values(value).some(holdsError);
}

function roundTrips(engine: { reviver: (key: string, value: unknown) => unknown }, text: string): boolean {
	try {
		return JSON.stringify(JSON.parse(text, engine.reviver)) === text;
	} catch {
		return false;
	}
}

describe.each(['rust', 'typescript', 'python', 'regex', 'scm'])('the %s corpus round-trips through node JSON', (grammar) => {
	it('revives every root without a parse error to the same JSON, and every named exception still fails', async () => {
		const engine = await loadNativeEngine(grammar);
		const known = KNOWN[grammar] ?? {};
		const failed: string[] = [];
		const fixed: string[] = [];
		for (const entry of loadCorpusEntries(grammar)) {
			const text = JSON.stringify(engine.parse(entry.source));
			if (holdsError(JSON.parse(text))) continue;
			const ok = roundTrips(engine, text);
			if (entry.name in known) {
				if (ok) fixed.push(entry.name);
			} else if (!ok) failed.push(entry.name);
		}
		expect(failed).toEqual([]);
		expect(fixed, 'named exceptions that now round-trip').toEqual([]);
	});
});
