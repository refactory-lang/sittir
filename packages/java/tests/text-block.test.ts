import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	record: await sharedEngine(() => createEngine(language)),
	object: await sharedEngine(() => createEngine(language, { nodeStorage: 'object' }))
};

describe.each(Object.entries(engines))('%s text block', (_, engine) => {
	const { build, kinds } = engine;

	it('built with nothing, opens its content with a line terminator', () => {
		expect(build.stringLiteralTextBlock().$render()).toBe('"""\n"""');
	});

	it('built with white space and content, writes the white space before the line terminator', () => {
		const block = build.stringLiteralTextBlock({ whiteSpace: build.textBlockWhiteSpace('  '), elements: [build.multilineStringFragment('  hi\n  ')] });
		expect(block.$render()).toBe('"""  \n  hi\n  """');
	});

	it('reads a CRLF after the opening delimiter as its line terminator, not as content', () => {
		const root = engine.parse('class A { String s = """\r\nx"""; }\n');
		const [block] = [...engine.query(root).$descendants.ofType(kinds.StringLiteralTextBlock)];
		expect(root.$errors).toEqual([]);
		expect(block!.elements().map((element) => element.$render())).toEqual(['x']);
	});

	it('renders the line terminator in the render line ending', () => {
		expect(engine.render(build.stringLiteralTextBlock(), { layout: { newline: '\r\n' } }).toString()).toBe('"""\r\n"""');
	});
});
