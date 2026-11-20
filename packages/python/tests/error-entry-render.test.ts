import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { ERROR_KIND_ID } from '@sittir/common/error-kind';
import { sharedEngine } from '@sittir/common/testing';
import python from '../src/index.ts';

const storages = {
	object: await sharedEngine(() => createEngine(python, { nodeStorage: 'object' })),
	arena: await sharedEngine(() => createEngine(python, { nodeStorage: 'arena' }))
};

type Sided = { $trivia?: { trailing?(): readonly unknown[] }; $render(): unknown };

const holdsError = (entries: readonly unknown[]) => entries.some((entry) => typeof entry === 'object' && entry !== null && '$type' in entry && entry.$type === ERROR_KIND_ID);

describe.each(Object.entries(storages))('a side holding an ERROR, %s storage', (_, py) => {
	it('renders the node the ERROR trails with the ERROR', () => {
		const root = py.parse('print(a, b=c)\n');
		const owners = [...root.$query().$descendants].map((node) => node as unknown as Sided).filter((node) => holdsError(node.$trivia?.trailing?.() ?? []));
		expect(owners).toHaveLength(1);
		expect(String(owners[0]!.$render()).replace(/\s+/g, '')).toBe('b=c');
	});
});
