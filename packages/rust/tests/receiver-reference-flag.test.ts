import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import type { NodeStorageOptions } from '@sittir/types';
import rust from '../src/index.ts';

type Guard = (node: unknown) => boolean;
type Read = { readonly $path?: string; readonly [key: string]: unknown };

const STORAGES: readonly (readonly [string, NodeStorageOptions])[] = [
	['arena storage', {}],
	['object storage', { nodeStorage: 'object' }]
];

const implOf = (receiver: string): string => `impl S {\n    fn f(${receiver}) {}\n}\n`;

const receiverIn = (value: unknown): Read | undefined => {
	if (value === null || typeof value !== 'object') return undefined;
	if (typeof (value as Read).$path === 'string' && /^declaration\.parameter\.(receiver|self)/.test((value as Read).$path!)) return value as Read;
	for (const item of Object.values(value)) {
		const found = receiverIn(item);
		if (found !== undefined) return found;
	}
	return undefined;
};

describe.each(STORAGES)("a receiver's & is a flag, in %s", (_storage, storage) => {
	const runtimeOf = async () => portableRuntime(await createEngine(rust, { api: 'strict', ...storage }));
	const reference = (is: unknown): Guard => (is as { declaration: { parameter: { receiver: { reference: Guard } } } }).declaration.parameter.receiver.reference;

	it('holds on a parsed receiver that writes the &, and not on one that does not', async () => {
		const runtime = await runtimeOf();
		const receivers = (source: string): unknown[] => [...(runtime.engine.parse(source) as { $query(): { $descendants: { ofType(kind: number): Iterable<unknown> } } }).$query().$descendants.ofType(rust.kinds.SelfParameter)];
		expect(receivers(implOf('&self')).map(reference(runtime.is))).toEqual([true]);
		expect(receivers(implOf('&mut self')).map(reference(runtime.is))).toEqual([true]);
		expect(receivers(implOf('self')).map(reference(runtime.is))).toEqual([false]);
		expect(receivers(implOf('mut self')).map(reference(runtime.is))).toEqual([false]);
	});

	it('reads the & as a flag of the receiver', async () => {
		const runtime = await runtimeOf();
		const read = (receiver: string): Read | undefined => receiverIn(runtime.read(runtime.engine.parse(implOf(receiver))));
		expect(read('&self')).toMatchObject({ $flags: ['reference'] });
		expect(read('&mut self')?.$flags).toEqual(expect.arrayContaining(['reference', 'mutable']));
		expect(read('self')).not.toHaveProperty('$flags');
		expect(read('mut self')).toMatchObject({ $flags: ['mutable'] });
	});

	it('reads and builds a receiver back with its &, and one without it without', async () => {
		const runtime = await runtimeOf();
		const roundTrip = (source: string): string => String(runtime.engine.render(runtime.build(runtime.read(runtime.engine.parse(source)) as never) as never));
		for (const receiver of ['&self', '&mut self', 'self', 'mut self']) expect(roundTrip(implOf(receiver))).toBe(implOf(receiver));
	});
});
