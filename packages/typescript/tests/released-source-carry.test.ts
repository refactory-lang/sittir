import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { unitSidesOf } from '../../common/src/node-data.ts';
import typescript from '../src/index.ts';

const SOURCE = 'declare module A { export var foo; };\nlet x = 1;\n';

interface Edited {
	readonly root: Disposable;
	readonly copy: { $render(): string };
}

type Settable = Disposable & { readonly $with: Record<string, (...values: unknown[]) => Edited['copy']> } & Record<string, () => unknown>;

function edited(engine: { parse(source: string): unknown }): Edited {
	const root = engine.parse(SOURCE) as Settable;
	const key = Object.keys(root.$with)
		.sort()
		.find((name) => typeof root.$with[name] === 'function' && typeof root[name] === 'function');
	if (key === undefined) throw new Error('the root has no member to set');
	const value = root[key]!();
	const setter = root.$with[key]!;
	return { root, copy: Array.isArray(value) && setter.length === 0 ? setter.call(root.$with, ...value) : setter.call(root.$with, value) };
}

const unitShape = (node: object) => (unitSidesOf(node) ?? []).map((unit) => ({ slot: unit.slot, item: unit.item, leading: unit.leading?.length ?? 0, trailing: unit.trailing?.length ?? 0 }));

const refusal = (run: () => unknown): string => {
	try {
		run();
	} catch (error) {
		return String(error);
	}
	return 'no refusal';
};

describe.each(['arena', 'object'] as const)("a copy of a parsed node whose source is released (%s storage)", (nodeStorage) => {
	it('renders and reads its unit sides as one whose source is kept', async () => {
		const engine = await createEngine(typescript, { nodeStorage });
		try {
			const kept = edited(engine);
			const released = edited(engine);
			released.root[Symbol.dispose]();
			expect(released.copy.$render()).toBe(kept.copy.$render());
			expect(kept.copy.$render()).toBe(SOURCE);
			expect(unitShape(released.copy)).toEqual(unitShape(kept.copy));
			expect(unitShape(kept.copy)).not.toEqual([]);
		} finally {
			engine.dispose();
		}
	});

	it('answers after its engine is disposed as one rendered before the dispose', async () => {
		const engine = await createEngine(typescript, { nodeStorage });
		const unrendered = edited(engine);
		const rendered = edited(engine);
		rendered.copy.$render();
		engine.dispose();
		expect(refusal(() => unrendered.copy.$render())).toBe(refusal(() => rendered.copy.$render()));
	});
});
