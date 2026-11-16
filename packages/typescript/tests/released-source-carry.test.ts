import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sidesOf, unitSidesOf } from '../../common/src/node-data.ts';
import typescript from '../src/index.ts';

const SOURCE = 'declare module A { export var foo; };\nlet x = 1;\n';
const SIDED = '// lead\nlet x = 1; // trail\n// last\n';

interface Edited {
	readonly root: Disposable;
	readonly copy: { $render(): string };
}

type Settable = Disposable & { readonly $with: Record<string, (...values: unknown[]) => Edited['copy']> } & Record<string, () => unknown>;

const sideShape = (node: object) => Object.fromEntries(Object.entries(sidesOf(node) ?? {}).map(([side, entries]) => [side, entries.length]));

function sided(root: Settable): Settable {
	const found = (root.statements!() as Settable[]).find((statement) => Object.keys(sideShape(statement)).length > 0);
	if (found === undefined) throw new Error('no statement holds a side');
	return found;
}

function edited(engine: { parse(source: string): unknown }, source = SOURCE, pick: (root: Settable) => Settable = (root) => root): Edited {
	const root = engine.parse(source) as Settable;
	const node = pick(root);
	const key = Object.keys(node.$with)
		.sort()
		.find((name) => typeof node.$with[name] === 'function' && typeof node[name] === 'function');
	if (key === undefined) throw new Error('the node has no member to set');
	const value = node[key]!();
	const setter = node.$with[key]!;
	return { root, copy: Array.isArray(value) && setter.length === 0 ? setter.call(node.$with, ...value) : setter.call(node.$with, value) };
}

const unitShape = (node: object) => (unitSidesOf(node) ?? []).map((unit) => ({ slot: unit.slot, item: unit.item, leading: unit.leading?.length ?? 0, trailing: unit.trailing?.length ?? 0 }));

const addon = createRequire(import.meta.url)('../native/index.cjs') as Record<string, (...args: unknown[]) => unknown>;

const writeSide = addon.writeBuiltTriviaSide!;
let sideWrites = 0;
addon.writeBuiltTriviaSide = function (this: unknown, ...args: unknown[]) {
	sideWrites++;
	return writeSide.apply(this, args);
};

function sideWritesIn(run: () => void): number {
	const before = sideWrites;
	run();
	return sideWrites - before;
}

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

	it('renders and reads its sides as one whose source is kept', async () => {
		const engine = await createEngine(typescript, { nodeStorage });
		try {
			const kept = edited(engine, SIDED, sided);
			const released = edited(engine, SIDED, sided);
			released.root[Symbol.dispose]();
			expect(released.copy.$render()).toBe(kept.copy.$render());
			expect(sideShape(released.copy)).toEqual(sideShape(kept.copy));
			expect(sideShape(kept.copy)).not.toEqual({});
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

describe('an edit of a parsed node (arena storage)', () => {
	it('writes no side of its copy', async () => {
		const engine = await createEngine(typescript, { nodeStorage: 'arena' });
		try {
			let copy: Edited['copy'] | undefined;
			expect(sideWritesIn(() => void (copy = edited(engine, SIDED, sided).copy))).toBe(0);
			expect(sideShape(copy!)).not.toEqual({});
		} finally {
			engine.dispose();
		}
	});
});
