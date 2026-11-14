import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const SOURCES = ['f"a {{{b}"', 'f"a {{{b}}}"'];

async function engineIn(storage: 'arena' | 'object') {
	return createEngine(python, { nodeStorage: storage });
}

function stringIn(py: Awaited<ReturnType<typeof engineIn>>, source: string) {
	const [string] = Array.from(py.parse(`${source}\n`).$query().$descendants.ofType(py.kinds.String));
	if (string === undefined || typeof string === 'number' || !py.is.string(string))
		throw new Error(`no string in ${source}`);
	return string;
}

describe.each(['arena', 'object'] as const)('an escaped brace before an interpolation, in %s storage', (storage) => {
	it.each(SOURCES)('renders %j as it was read', async (source) => {
		using py = await engineIn(storage);
		expect(py.render(py.parse(`${source}\n`, { depth: Infinity })).toString()).toBe(`${source}\n`);
	});

	it.each(SOURCES)('keeps %j when its content is rebuilt around the escape it read', async (source) => {
		using py = await engineIn(storage);
		const string = stringIn(py, source);
		const [content, ...rest] = string.contents();
		if (content === undefined || !py.is.stringContent(content)) throw new Error(`no string content in ${source}`);
		expect(py.render(string.$with.contents(content.$with.elements(...content.elements()), ...rest)).toString()).toBe(
			source
		);
	});

	it.each(SOURCES)('keeps %j when its read content meets a rebuilt string', async (source) => {
		using py = await engineIn(storage);
		const string = stringIn(py, source);
		expect(py.render(string.$with.contents(...string.contents())).toString()).toBe(source);
	});
});
