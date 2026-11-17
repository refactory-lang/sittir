import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import type { PortableStructure } from '@sittir/types';
import { describe, expect, it } from 'vitest';
import { languageByName } from '../../src/languages.ts';

const isStructure = (value: unknown): value is PortableStructure =>
	typeof value === 'object' && value !== null && !Array.isArray(value) && typeof (value as { readonly $path?: unknown }).$path === 'string';

function* structuresIn(value: unknown): Generator<PortableStructure> {
	if (Array.isArray(value)) for (const item of value) yield* structuresIn(item);
	else if (isStructure(value)) {
		yield value;
		for (const [key, member] of Object.entries(value)) if (!key.startsWith('$')) yield* structuresIn(member);
	}
}

describe('a member typed by its token texts reads its token and builds it back, value for value', () => {
	it.each([
		['rust', 'const X: u8 = 1u8;\n', { $path: 'literal.number.integer', suffix: 'u8' }],
		['rust', 'const X: u8 = 0x1Fu8;\n', { $path: 'literal.number.integer.hex', suffix: 'u8' }],
		['rust', 'macro_rules! m { ($x:expr) => {}; }\n', { $path: 'element.macro.token_binding', fragment: 'expr' }],
		['python', 'x = 0X1F\n', { $path: 'literal.number.integer.hex', $value: 31 }],
		['typescript', 'x = 1E5;\n', { $path: 'literal.number.float.scientific', $value: 100000 }],
		['typescript', 'x = 0B101;\n', { $path: 'literal.number.integer.binary', $value: 5 }]
	] as const)('%s %j', async (grammar, source, token) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const read = runtime.read(engine.parse(source));
		expect([...structuresIn(read)]).toContainEqual(expect.objectContaining(token));
		const rebuilt = engine.render(runtime.build(read as never) as never).toString();
		expect(runtime.read(engine.parse(rebuilt))).toEqual(read);
	});
});
