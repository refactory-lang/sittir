import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import python from '../src/index.ts';

const object = await sharedEngine(() => createEngine(python, { nodeStorage: 'object' }));
const arenas = {
	arena: await sharedEngine(() => createEngine(python, { nodeStorage: 'arena' })),
	'arena checked at run time': await sharedEngine(() => createEngine(python, { nodeStorage: 'arena', verifyStructure: 'runtime' }))
};

type StringStart = { prefix(): string | undefined; $with: { quote(quote: string): StringStart; prefix(prefix: string): StringStart } };
type ReadString = { stringStart(): StringStart };

function stringStartOf(py: typeof object, source: string): StringStart {
	const line = (py.parse(`${source}\n`) as unknown as { statements(): readonly { statements(): readonly { content(): ReadString }[] }[] }).statements()[0]!;
	return line.statements()[0]!.content().stringStart();
}

describe.each(Object.entries({ object, ...arenas }))('a $with of a string start keeps the spelling of the prefix it leaves alone (%s)', (_, py) => {
	it.each([
		["UR'a'", 'UR"'],
		['fr"a"', 'fr"'],
		['B"a"', 'B"']
	])('%s with quote " renders %s', (source, rendered) => {
		expect(String(py.render(stringStartOf(py, source).$with.quote('"') as never))).toBe(rendered);
	});

	it('a second edit of the edited start keeps it too', () => {
		const once = stringStartOf(py, "UR'a'").$with.quote('"');
		expect(String(py.render(once.$with.quote("'") as never))).toBe("UR'");
	});
});

describe.each(Object.entries(arenas))('a $with of a string start prefix (%s)', (_, py) => {
	const parsed = (source: string): StringStart => stringStartOf(py, source);
	const built = (source: string): StringStart => stringStartOf(py, source).$with.quote("'");

	it.each([
		['parsed', 'B"a"', 'b', 'B"', parsed],
		['parsed', 'fr"a"', 'rf', 'fr"', parsed],
		['built', 'B"a"', 'b', "B'", built],
		['built', 'fr"a"', 'rf', "fr'", built]
	] as const)('the member it reads, set on a %s start of %s, keeps its spelling', (_, source, member, rendered, start) => {
		const node = start(source);
		expect(node.prefix()).toBe(member);
		expect(String(py.render(node.$with.prefix(member) as never))).toBe(rendered);
	});

	it.each([
		['parsed', 'B"a"', 'b', 'B"', parsed],
		['built', 'fr"a"', 'rf', "fr'", built]
	] as const)('the member it reads, set on a %s start of %s whose prefix was never read, keeps its spelling', (_, source, member, rendered, start) => {
		expect(String(py.render(start(source).$with.prefix(member) as never))).toBe(rendered);
	});

	it.each([
		['parsed', parsed, "'"],
		['built', built, '"']
	])('the spelling setter on a %s start respells what it sets and keeps the prefix', (_, start, quote) => {
		expect(String(py.render(start('B"a"').$with.quote(quote) as never))).toBe(`B${quote}`);
	});

	it.each([
		['parsed', parsed],
		['built', built]
	])('another member, set on a %s start, writes the spelling the builder writes', (_, start) => {
		expect(String(py.render(start('B"a"').$with.prefix('rb') as never))).toMatch(/^rb["']$/);
	});
});
