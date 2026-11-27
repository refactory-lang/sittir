import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import { editedRender } from '../../common/tests/support/edited-render.ts';
import python from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(python, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(python, { nodeStorage: 'object' }))
};

const MOVED_ELSE = 'if b:\n    c\n  else:\n    if e:\n      f\n';

describe.each(Object.keys(engines) as (keyof typeof engines)[])('a rebuilt holder takes its gaps from the options, and each node under it the edit left alone keeps its own bytes (%s storage)', (storage) => {
	it('lays a node framed by ERRORs on both sides with the options\' gap beside each ERROR, and none past the holder', () => {
		expect(editedRender(engines[storage], '(x, =b=)\n', 'x')).toBe('(x, = b =)\n');
	});

	it('moves an untouched block with its rebuilt holder, its later lines re-indented from its first', () => {
		expect(editedRender(engines[storage], MOVED_ELSE, 'else:\n  if e:\n    f')).toBe('if b:\n    c\nelse:\n  if e:\n    f\n');
	});

	it('lays a rebuilt block\'s statement at the options\' depth, the untouched statement\'s later lines kept under its first', () => {
		expect(editedRender(engines[storage], MOVED_ELSE, '\n  if e:\n    f')).toBe('if b:\n    c\nelse:\n    if e:\n      f\n');
	});
});
