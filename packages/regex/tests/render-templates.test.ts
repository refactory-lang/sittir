import { describe, expect, it } from 'vitest';
import { sharedEngine } from '@sittir/common/testing';
import regex from '../src/index.ts';

const engines = {
	object: await sharedEngine(() => regex.createEngine({ nodeStorage: 'object' })),
	arena: await sharedEngine(() => regex.createEngine({ nodeStorage: 'arena' }))
};

describe.each(['object', 'arena'] as const)('a render from templates in %s storage', (storage) => {
	const engine = engines[storage];

	it.each(['a(\nb)', '(\nb)', 'a(?:\nb)', '[-a-z]{2}\n\\.\\b(\n[a-z]*\n)'])('keeps the line breaks inside a group %j', (source) => {
		expect(engine.diagnostics.renderTemplates(engine.parse(source))).toBe(source);
	});
});
