import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

type Snapshotted = { $snapshot(): unknown };

describe.each(['object', 'arena'] as const)('a template follows its tag directly, %s storage', (nodeStorage) => {
	const statements = async (source: string) => {
		const ts = await createEngine(typescript, { nodeStorage });
		return { ts, statements: ts.parse(source).statements() as unknown as readonly Snapshotted[] };
	};

	it('writes a tagged template with no space before its backtick', async () => {
		const { ts, statements: [statement] } = await statements('tag  `a${b}c`;\n');
		using _ts = ts;
		expect(String(ts.render(statement!.$snapshot() as never))).toBe('tag`a${b}c`;');
	});

	it('keeps the space a declared left face gives a template', async () => {
		const { ts, statements: [declaration, fn, alias] } = await statements('const y=`x`;\nfunction f() { return`x`; }\ntype T=`a${B}`;\n');
		using _ts = ts;
		expect(String(ts.render(declaration!.$snapshot() as never))).toBe('const y = `x`;');
		expect(String(ts.render(alias!.$snapshot() as never))).toBe('type T = `a${B}`;');
		expect(String(ts.render(fn!.$snapshot() as never))).toBe('function f() {\n  return `x`;\n}\n');
	});
});
