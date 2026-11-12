import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import type { NodeStorageOptions } from '@sittir/types';
import python from '../src/index.ts';

type Guard = (node: unknown) => boolean;
type Read = { readonly $path?: string; readonly [key: string]: unknown };

const STORAGES: readonly (readonly [string, NodeStorageOptions])[] = [
	['arena storage', {}],
	['object storage', { nodeStorage: 'object' }]
];

const caseOf = (pattern: string): string => `match x:\n    case ${pattern}:\n        pass\n`;

const complexIn = (value: unknown): Read | undefined => {
	if (value === null || typeof value !== 'object') return undefined;
	if (typeof (value as Read).$path === 'string' && (value as Read).$path!.startsWith('pattern.complex'))
		return value as Read;
	for (const item of Object.values(value)) {
		const found = complexIn(item);
		if (found !== undefined) return found;
	}
	return undefined;
};

describe.each(STORAGES)("a complex pattern's leading minus is a flag, in %s", (_storage, storage) => {
	const engineOf = () => createEngine(python, { api: 'strict', ...storage });
	const sign = (is: unknown): Guard => (is as { pattern: { complex: { sign: Guard } } }).pattern.complex.sign;

	it('holds on a parsed pattern that writes the minus, and not on one that does not', async () => {
		using engine = await engineOf();
		const runtime = await portableRuntime(engine);
		const patterns = (source: string): unknown[] => [
			...(runtime.engine.parse(source) as { $query(): { $descendants: { ofType(kind: number): Iterable<unknown> } } })
				.$query()
				.$descendants.ofType(python.kinds.ComplexPattern)
		];
		expect(patterns(caseOf('-1+2j')).map(sign(runtime.is))).toEqual([true]);
		expect(patterns(caseOf('1+2j')).map(sign(runtime.is))).toEqual([false]);
	});

	it('reads the minus as a flag of the pattern', async () => {
		using engine = await engineOf();
		const runtime = await portableRuntime(engine);
		const read = (pattern: string): Read | undefined => complexIn(runtime.read(runtime.engine.parse(caseOf(pattern))));
		expect(read('-1+2j')).toMatchObject({ $path: 'pattern.complex.add', $flags: ['sign'] });
		expect(read('-1-2j')).toMatchObject({ $path: 'pattern.complex.subtract', $flags: ['sign'] });
		expect(read('1+2j')).toMatchObject({ $path: 'pattern.complex.add' });
		expect(read('1+2j')).not.toHaveProperty('$flags');
	});

	it('reads and builds a pattern back with its minus, and one without it without', async () => {
		using engine = await engineOf();
		const runtime = await portableRuntime(engine);
		const roundTrip = (source: string): string =>
			String(runtime.engine.render(runtime.build(runtime.read(runtime.engine.parse(source)) as never) as never));
		for (const pattern of ['-1 + 2j', '-1 - 2j', '1 + 2j']) expect(roundTrip(caseOf(pattern))).toBe(caseOf(pattern));
	});
});
