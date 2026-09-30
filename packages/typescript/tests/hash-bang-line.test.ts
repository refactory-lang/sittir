// A hash-bang line ends only at a line break, so whatever follows it starts a
// new line: from a factory-built program, and from a parsed one whose
// hash-bang is still a coordinate when a statement is replaced.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

const letX = (value: string) =>
	ts.build.lexicalDeclaration.strict({
		kind: ts.kinds.LetKeyword,
		declarators: [ts.build.variableDeclarator.plain.strict({ name: ts.build.identifier('x'), value: ts.build.number(value) })]
	});

describe('hash_bang_line', () => {
	it('breaks the line after a built hash-bang, and the text reparses to the same program', () => {
		const text = ts.build.program.strict({ hashBangLine: ts.build.hashBangLine('/usr/bin/env node'), statements: [letX('1')] }).$render();
		expect(text).toBe('#!/usr/bin/env node\nlet x = 1;');
		const reparsed = ts.parse(text);
		expect(reparsed.hashBangLine()?.$render()).toBe('#!/usr/bin/env node\n');
		expect(reparsed.statements()).toHaveLength(1);
	});

	it('breaks the line after a read hash-bang when the statement after it is rebuilt', () => {
		const engine = ts;
		const program = engine.parse('#!/usr/bin/env node\nlet x = 1;\n');
		const rebuilt = program.$with.statements([letX('2')]);
		expect(rebuilt.$render()).toBe('#!/usr/bin/env node\nlet x = 2;');
	});
});
