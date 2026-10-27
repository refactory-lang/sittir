// Every corpus case the factory validator builds as records, on every grammar:
// each built view's `$with` setter, given its own slot's value, rebuilds
// through the row its record makes to the same structure. So the row's reader
// of a builder's input from a record's slots feeds every builder the corpus
// reaches as its signature takes it.
import { describe, expect, it } from 'vitest';
import { isNode, snapshotOf, storedSlotValues } from '@sittir/common/utils';
import { builtRefOf } from '../../common/src/built-ref.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../codegen/src/__tests__/helpers/timeouts.ts';
import { useValidationConstruction, useValidationNodeStorage } from '../src/validate/common.ts';
import { validateFactoryStorage } from '../src/validate/factory-storage.ts';
import { structureOf } from '../../../examples/helpers.ts';

useValidationNodeStorage('arena');
useValidationConstruction('record');

type Setters = Readonly<Record<string, (...args: unknown[]) => unknown>>;

function items(value: unknown): readonly unknown[] | undefined {
	if (value === null || typeof value !== 'object' || isNode(value) || !(Symbol.iterator in value)) return undefined;
	return [...(value as Iterable<unknown>)];
}

function builtViews(node: object, out: Set<object>): Set<object> {
	if (builtRefOf(node) === undefined || out.has(node)) return out;
	out.add(node);
	for (const [, value] of storedSlotValues(node)) {
		for (const child of items(value) ?? [value]) if (isNode(child)) builtViews(child, out);
	}
	return out;
}

const structure = (node: unknown): string => JSON.stringify(structureOf(snapshotOf(node as object)));

function sameStructure(view: object, edit: () => unknown): string | undefined {
	const before = structure(view);
	let after: string;
	try {
		after = structure(edit());
	} catch (error) {
		return `throws: ${(error as Error).message.slice(0, 160)}`;
	}
	return after === before ? undefined : `rebuilds ${after.slice(0, 160)}`;
}

describe.each(['rust', 'typescript', 'python', 'regex', 'scm'])('the %s corpus rebuilds through the rows its records make', (grammar) => {
	it(
		'every setter of every built view, given its own value, rebuilds the same structure',
		async () => {
			const failed = new Map<string, string>();
			const setters = new Set<string>();
			await validateFactoryStorage(grammar, 'native', {
				onBuilt: (built, at) => {
					for (const view of builtViews(built, new Set())) {
						const members = view as Record<string, unknown> & { readonly $type: number; readonly $with?: Setters };
						for (const [name, set] of Object.entries(members.$with ?? {})) {
							const read = members[name];
							if (typeof read !== 'function' || read.length !== 0) continue;
							setters.add(`${members.$type}.${name}`);
							const own = (read as () => unknown).call(view);
							const problem = sameStructure(view, () => set(...(items(own) ?? [own])));
							if (problem !== undefined) failed.set(`kind ${members.$type}.${name}`, `${at.entry}: ${problem}`);
						}
					}
				}
			});
			expect(setters.size).toBeGreaterThan(0);
			expect(Object.fromEntries(failed)).toEqual({});
		},
		FULL_PIPELINE_TIMEOUT
	);
});
