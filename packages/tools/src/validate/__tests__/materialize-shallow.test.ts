import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isCoordinate } from '@sittir/common/utils';

import { languageByName } from '../../languages.ts';
import { findWrappedNode, loadKindNameFromId, loadSlotReaders, materializeShallow } from '../common.ts';

async function shallow(nodeStorage: 'object' | 'arena', kind: string, source: string) {
	const engine = await createEngine(await languageByName('rust'), { nodeStorage });
	const readers = await loadSlotReaders('rust');
	const node = findWrappedNode(engine.parse(source), readers, kind, await loadKindNameFromId('rust'));
	if (node === undefined) throw new Error(`no ${kind} in ${JSON.stringify(source)}`);
	const data = materializeShallow(node, readers) as unknown as Record<string, unknown>;
	const rendered = engine.render(data as never).toString();
	return { data, rendered, dispose: () => engine.dispose() };
}

describe('a node read one level down, through the slot readers', () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`${nodeStorage}: holds each child as its coordinate, and renders`, async () => {
			const { data, rendered, dispose } = await shallow(nodeStorage, 'let_declaration', 'fn f() { let x = a + b; }');
			expect(isCoordinate(data._value)).toBe(true);
			expect(rendered).toBe('let x = a + b;');
			dispose();
		});

		it(`${nodeStorage}: materializes an alias envelope's content, which shares its envelope's row`, async () => {
			const { data, rendered, dispose } = await shallow(nodeStorage, 'type_identifier', 'type T = A;');
			expect(isCoordinate(data._content)).toBe(false);
			expect(rendered).toBe('T');
			dispose();
		});
	}
});
