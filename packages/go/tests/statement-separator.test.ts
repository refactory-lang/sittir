import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import go from '../src/index.ts';

const engine = await sharedEngine(() => createEngine(go));
const kinds = engine.kinds;
const ir = engine.build;
const statement = (name: string) => ir.expressionStatement({ expression: { $type: kinds.Identifier, text: name } as never });

describe('a Go statement list', () => {
	it('built, writes one newline between statements', () => {
		expect(ir.statements(statement('a'), statement('b')).$render!()).toBe('a\nb');
	});

	it('built with the line-break terminator as its separator, writes one newline, not the kind name', () => {
		expect(ir.statements({ separator: kinds.SourceFileText }, statement('a'), statement('b')).$render!()).toBe('a\nb');
	});

	it.each([
		['package p\n\nfunc f() {\n\ta()\n\tb()\n}\n', 'a()\nb()'],
		['package p\n\nfunc f() {\n\ta()\n\n\tb()\n}\n', 'a()\n\nb()']
	])('parsed, keeps its source: %j', (source, statements) => {
		const tree = engine.parse(source);
		expect(tree.$render!()).toBe(source);
		const [list] = [...tree.$query().$descendants.ofType(kinds.Statements)];
		expect(list!.$render!()).toBe(statements);
	});
});
