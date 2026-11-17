import { describe, expect, it } from 'vitest';
import { readVocabulary, textValued, VOCABULARY_DIR } from '@sittir/codegen/bindings';
import { takesTextValue } from '@sittir/common/engine';
import type { PortableBuildTable } from '@sittir/types';
import { build as python } from '../../../python/src/portable/table.ts';
import { build as rust } from '../../../rust/src/portable/table.ts';
import { build as typescript } from '../../../typescript/src/portable/table.ts';

const TABLES: Readonly<Record<string, PortableBuildTable>> = { python, rust, typescript };

describe('a text $value', () => {
	it('is declared at exactly the paths a grammar builds from text alone, and builds no other value there', async () => {
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		const valueAt = (path: string) => (vocabulary.kinds.get(path)?.text === true ? undefined : vocabulary.kinds.has(path) ? vocabulary.members(path).get('$value') : undefined);
		for (const [grammar, table] of Object.entries(TABLES)) {
			const paths = Object.entries(table.paths);
			const fromText = paths
				.filter(([path, built]) => built.arms.some((arm) => takesTextValue(table, arm)) && built.arms.every((arm) => arm.slots.length === 0) && (valueAt(path) === undefined || valueAt(path)?.text === true))
				.map(([path]) => path)
				.sort();
			const declared = paths.flatMap(([path]) => (textValued(vocabulary, path) ? [path] : [])).sort();
			expect(declared, grammar).toEqual(fromText);
		}
	});
});
