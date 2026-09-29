// A hash-bang line ends only at a line break, so whatever follows it starts a
// new line: from a factory-built program, and from a parsed one whose
// hash-bang is still a coordinate when a statement is replaced.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

const letX = (value: string) =>
	ir.lexicalDeclaration.strict({
		kind: TSKindId.LetKeyword,
		declarators: [ir.variableDeclarator.plain.strict({ name: ir.identifier('x'), value: ir.number(value) })]
	});

type Program = {
	hashBangLine(): { $render(): string } | undefined;
	statements(): readonly unknown[];
	$with: { statements(...v: readonly unknown[]): unknown };
};

describe('hash_bang_line', () => {
	it('breaks the line after a built hash-bang, and the text reparses to the same program', () => {
		const text = ir.program.strict({ hashBangLine: ir.hashBangLine('/usr/bin/env node'), statements: [letX('1')] }).$render();
		expect(text).toBe('#!/usr/bin/env node\nlet x = 1;');
		const reparsed = createEngine().parse(text) as unknown as Program;
		expect(reparsed.hashBangLine()?.$render()).toBe('#!/usr/bin/env node\n');
		expect(reparsed.statements()).toHaveLength(1);
	});

	it('breaks the line after a read hash-bang when the statement after it is rebuilt', () => {
		const engine = createEngine();
		const program = engine.parse('#!/usr/bin/env node\nlet x = 1;\n') as unknown as Program;
		const rebuilt = program.$with.statements(letX('2'));
		expect(engine.render(rebuilt as never).toString()).toBe('#!/usr/bin/env node\nlet x = 2;');
	});
});
