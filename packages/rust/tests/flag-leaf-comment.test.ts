import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const SOURCES = ['let mut /* c */ x = 1;\n', 'let mut // c\n    x = 1;\n'];

describe.each(['arena', 'object'] as const)('a comment between a flag keyword and the slot after it, %s storage', (nodeStorage) => {
	it.each(SOURCES)('renders as it reads, plain and rebuilt from the root: %j', async (source) => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root: any = rs.parse(source);
		expect(String(rs.render(root))).toBe(source);
		expect(String(root.$with.statements(...root.statements()).$render())).toBe(source);
	});

	it('stays with the slot after the flag when another slot is replaced', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root: any = rs.parse(SOURCES[0]!);
		const [declaration] = root.statements();
		const edited = root.$with.statements(declaration.$with.value(rs.build.integerLiteral('2')));
		expect(String(edited.$render())).toBe('let mut /* c */ x = 2;\n');
	});

	it.each(SOURCES)('goes with the slot after the flag when that slot is replaced: %j', async (source) => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root: any = rs.parse(source);
		const [declaration] = root.statements();
		const edited = root.$with.statements(declaration.$with.name(rs.build.identifier('y')));
		expect(String(edited.$render())).toBe('let mut y = 1;\n');
	});
});
