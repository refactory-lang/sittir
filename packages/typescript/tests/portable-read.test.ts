import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import typescript from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };

const runtime = await portableRuntime(await createEngine(typescript, { api: 'strict', verifyStructure: 'runtime' }));
const read = (source: string): Read => runtime.read(runtime.engine.parse(source)) as Read;
const roundTrip = (source: string): string => String(runtime.engine.render(runtime.build(read(source)) as never));
const firstOf = (source: string): unknown => (read(source).statements as readonly Read[])[0];

describe('the portable read', () => {
	it('reads the members a binding captures from its slot, and builds an import back', () => {
		const clause = { $path: 'clause.import.names', content: [{ $path: 'clause.import.specifier', name: 'a' }, { $path: 'clause.import.specifier', name: 'b', alias: 'c' }] };
		expect(firstOf('import {a, b as c} from "x";')).toMatchObject({ importClause: clause });
		expect(roundTrip('import {a, b as c} from "x";')).toBe('import { a, b as c } from "x";\n');
	});

	it('builds text through the seat whose leaf builds it back: a parameter name in its pattern, an object key as itself', () => {
		expect(roundTrip('function f(a: number) {}')).toBe('function f(a: number) {}\n');
		expect(roundTrip('const o = {a: 1};')).toBe('const o = { a: 1 };\n');
	});

	it('builds an exported declaration, and a catch clause whose parameter the clause takes flattened', () => {
		expect(roundTrip('export function g() {}')).toBe('export function g() {}\n');
		expect(roundTrip('try {} catch (e: unknown) {}')).toBe('try {} catch (e: unknown) {}\n');
	});

	it('carries a node whose flags its path cannot build, so a static readonly field keeps both', () => {
		const field = (firstOf('class C { static readonly x = 1; }') as { readonly body: readonly unknown[] }).body[0];
		expect(field).toMatchObject({ $type: typescript.kinds.PublicFieldDefinitionPlain });
		expect(roundTrip('class C { static readonly x = 1; }')).toBe('class C {\n  static readonly x = 1;\n}\n');
	});

	it('builds a string in the quote form whose spelling admits its text, and in the default form when both do', () => {
		expect(roundTrip(`let s = 'say "hi"';`)).toBe(`let s = 'say "hi"';\n`);
		expect(roundTrip("let s = 'a';")).toBe('let s = "a";\n');
	});

	it('builds a class method signature with the terminator its grammar declares by default', () => {
		expect(roundTrip('declare class C { foo(): void; }')).toBe('declare class C {\n  foo(): void\n}\n');
	});

	it('leaves out a member whose route needs a member the node does not have', () => {
		expect(firstOf('import x = require("y");')).not.toHaveProperty('source');
		expect(roundTrip('import x = require("y");')).toBe('import x = require("y");\n');
	});
});
