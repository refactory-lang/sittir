import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../../languages.ts';
import { loadNodeModel, loadSlotAccessorOf, loadStorageKindNameFromId, separatedListFactoryOptions, walkWrappedTree, type TypedNode } from '../common.ts';

const CASES = [
	{ name: 'a comma, not the declared default', source: 'type T = { a: string, b: number };\n', separator: 'comma' },
	{ name: 'a line break', source: 'type T = {\n  a: string\n  b: number\n};\n', separator: '_automatic_semicolon' },
	{ name: 'the declared default', source: 'type T = { a: string; b: number };\n', separator: 'semi' }
] as const;

describe("a parsed list's separator becomes the factory option its rebuild takes", () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		for (const { name, source, separator } of CASES) {
			it(`typescript object_type_content (${nodeStorage}): ${name}`, async () => {
				const engine = await createEngine(await languageByName('typescript'), { nodeStorage });
				const accessorOf = await loadSlotAccessorOf('typescript');
				const kindName = await loadStorageKindNameFromId('typescript');
				const slots = (await loadNodeModel('typescript')).factorySlots['object_type_content'];
				const found: TypedNode[] = [];
				walkWrappedTree(engine.parse(source), accessorOf, (node) => {
					if (kindName(node.$type) === 'object_type_content') found.push(node);
				});
				expect(found).toHaveLength(1);
				const options = separatedListFactoryOptions(found[0], accessorOf, slots);
				expect(options?.separator === undefined ? undefined : kindName(options.separator)).toBe(separator);
				const omitted = separatedListFactoryOptions(found[0], accessorOf, slots, true)?.separator;
				expect(omitted === undefined ? undefined : kindName(omitted)).toBe(separator === 'semi' ? undefined : separator);
				engine.dispose();
			});
		}
	}
});
