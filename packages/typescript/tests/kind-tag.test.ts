import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

describe('a bag tags its kind with $type, so a slot named kind stays data', () => {
	it('builds a lexical_declaration bag carrying both the $type tag and its let/const kind slot', () => {
		const declarator = { $type: ts.kinds.VariableDeclaratorPlain, name: 'x', value: '1' } as const;
		const built = ts.build.statementBlock({
			statements: [
				{ $type: ts.kinds.LexicalDeclaration, kind: ts.kinds.ConstKeyword, terminator: ts.kinds.Semi, declarators: [declarator] },
				{ $type: ts.kinds.LexicalDeclaration, kind: ts.kinds.LetKeyword, terminator: ts.kinds.Semi, declarators: [declarator] }
			]
		});
		expect(built.$render()).toMatch(/const x = 1;\s*let x = 1;/);
	});
});
