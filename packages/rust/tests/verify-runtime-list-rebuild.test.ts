import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const listOf = (engine: any, source: string, kind: number): any => {
	const root: any = engine.parse(source);
	return [...root.$query().$descendants].find((node: any) => node?.$type === kind && node?.$with?.items && Symbol.iterator in node);
};

describe.each(['arena', 'object'] as const)('a list rebuilt from its own items under verifyStructure runtime, %s storage', (nodeStorage) => {
	it.each([
		['parameters_elements', 'fn f(x: i32, y: i32) {}\n', 'ParametersElements', 'x: i32, y: i32'],
		['field_declaration_list_elements', 'struct S { pub name: String, pub age: u32 }\n', 'FieldDeclarationListElements', 'pub name: String,\npub age: u32']
	])('rebuilds %s as it does without the check', async (_name, source, kindName, text) => {
		const rebuilt = async (verifyStructure: 'runtime' | undefined): Promise<string> => {
			using engine = await createEngine(rust, verifyStructure === undefined ? { nodeStorage } : { nodeStorage, verifyStructure });
			const kinds = engine.kinds as unknown as Record<string, number>;
			const list = listOf(engine, source, kinds[kindName]!);
			expect(list, `a ${kindName} in the source`).toBeDefined();
			return String(list.$with.items(...list).$render());
		};
		const checked = await rebuilt('runtime');
		expect(checked).toBe(await rebuilt(undefined));
		expect(checked).toBe(text);
	});
});
