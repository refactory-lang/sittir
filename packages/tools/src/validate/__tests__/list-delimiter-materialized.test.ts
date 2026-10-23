import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import { languageByName } from '../../languages.ts';
import {
	loadCanonicalKindNameFromId,
	loadSlotAccessorOf,
	materialize,
	separatedListFactoryOptions,
	walkWrappedTree,
	type TypedNode
} from '../common.ts';

const CASES = [
	{ grammar: 'rust', list: 'use_clauses', source: 'use a::{b, c,};\n' },
	{ grammar: 'python', list: 'argument_list_elements', source: 'f(a, b,)\n' },
	{ grammar: 'typescript', list: 'formal_parameters_elements', source: 'function f(a, b,) {}\n' }
] as const;

describe("a separated list's trailing delimiter, through the validator walk", () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		for (const { grammar, list, source } of CASES) {
			it(`${grammar} ${list} (${nodeStorage}): materializes as Delimiter.Trailing and becomes the factory option`, async () => {
				const engine = await createEngine(await languageByName(grammar), { nodeStorage });
				const accessorOf = await loadSlotAccessorOf(grammar);
				const kindName = (await loadCanonicalKindNameFromId(grammar))!;
				const found: TypedNode[] = [];
				walkWrappedTree(engine.parse(source), accessorOf, (node) => {
					if (kindName(node.$type) === list) found.push(node);
				});
				expect(found).toHaveLength(1);
				const data = materialize(found[0], accessorOf) as unknown as Record<string, unknown>;
				expect(data._delimiter).toBe(Delimiter.Trailing);
				expect(separatedListFactoryOptions(data)).toEqual({ delimiter: Delimiter.Trailing });
				engine.dispose();
			});
		}
	}
});
