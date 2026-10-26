// Every corpus root without a parse error revives on a records engine through
// the input each kind's builder takes, read back from the JSON's slots; then
// every built view's `$with` setter, given its own slot's value, rebuilds
// through the row its record makes, writing the same JSON. So both readers of
// a builder's input from slots, the reviver's and the row's, feed every
// builder they reach as its signature takes it.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { useRecordConstruction } from '@sittir/common/engine';
import { isNode, storedSlotValues } from '@sittir/common/utils';
import { builtRefOf } from '../../common/src/built-ref.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../codegen/src/__tests__/helpers/timeouts.ts';
import { requireGrammarModule } from '../src/grammar-internals.ts';
import { languageByName } from '../src/languages.ts';
import { loadCorpusEntries } from '../src/validate/common.ts';

type Engine = {
	parse(source: string): object;
	reviver(key: string, value: unknown): unknown;
};
type Setters = Readonly<Record<string, (...args: unknown[]) => unknown>>;

function holdsError(value: unknown): boolean {
	if (Array.isArray(value)) return value.some(holdsError);
	if (value === null || typeof value !== 'object') return false;
	return (value as { $type?: unknown }).$type === 'ERROR' || Object.values(value).some(holdsError);
}

function items(value: unknown): readonly unknown[] | undefined {
	if (value === null || typeof value !== 'object' || isNode(value) || !(Symbol.iterator in value)) return undefined;
	return [...(value as Iterable<unknown>)];
}

function builtViews(node: object, out: object[]): object[] {
	if (builtRefOf(node) === undefined || out.includes(node)) return out;
	out.push(node);
	for (const [, value] of storedSlotValues(node)) {
		for (const child of items(value) ?? [value]) if (isNode(child)) builtViews(child, out);
	}
	return out;
}

function sameJSON(view: object, edit: () => unknown): string | undefined {
	const before = JSON.stringify(view);
	let after: string;
	try {
		after = JSON.stringify(edit());
	} catch (error) {
		return `throws: ${(error as Error).message.slice(0, 160)}`;
	}
	return after === before ? undefined : `writes ${after.slice(0, 160)}`;
}

describe.each(['rust', 'typescript', 'python', 'regex', 'scm'])('the %s corpus rebuilds through the input its builders take', (grammar) => {
	it(
		'revives every root on records, and every setter of every built view, given its own value, writes the same JSON',
		async () => {
			const engine = (await createEngine(await languageByName(grammar), { nodeStorage: 'arena' })) as unknown as Engine;
			useRecordConstruction(engine, await requireGrammarModule(grammar, 'factories/records.ts'));
			const failed = new Map<string, string>();
			for (const entry of loadCorpusEntries(grammar)) {
				const text = JSON.stringify(engine.parse(entry.source));
				if (holdsError(JSON.parse(text))) continue;
				let root: unknown;
				try {
					root = JSON.parse(text, engine.reviver);
				} catch (error) {
					failed.set(`${entry.name}: revive`, (error as Error).message.slice(0, 160));
					continue;
				}
				if (JSON.stringify(root) !== text) failed.set(`${entry.name}: revive`, 'writes other JSON');
				for (const view of builtViews(root as object, [])) {
					const members = view as Record<string, unknown> & { readonly $type: number; readonly $with?: Setters };
					for (const [name, set] of Object.entries(members.$with ?? {})) {
						const read = members[name];
						if (typeof read !== 'function' || read.length !== 0) continue;
						const own = (read as () => unknown).call(view);
						const problem = sameJSON(view, () => set(...(items(own) ?? [own])));
						if (problem !== undefined) failed.set(`kind ${members.$type}.${name}`, `${entry.name}: ${problem}`);
					}
				}
			}
			expect(Object.fromEntries(failed)).toEqual({});
		},
		FULL_PIPELINE_TIMEOUT
	);
});
