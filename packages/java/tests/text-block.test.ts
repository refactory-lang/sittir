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

	it('reads a CRLF after the opening delimiter as one line terminator', () => {
		const root = engine.parse('class A { String s = """\r\nx"""; }\n');
		const [block] = [...engine.query(root).$descendants.ofType(kinds.StringLiteralTextBlock)];
		expect(block!.lineTerminator()).toBe(kinds.CrLf);
		expect(block!.elements().map((element) => element.$render())).toEqual(['x']);
	});
});
