import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe('a rebuilt deep-read node', () => {
	/** The first statement of `source`, read at the given depth, renamed to `g` and rendered. */
	async function renamed(source: string, deep: boolean): Promise<string> {
		const engine = await createEngine(python);
		const statement = engine.parse(source, { deep }).statements()[0];
		if (statement === undefined || typeof statement === 'number' || !engine.is.functionDefinition(statement))
			throw new Error('expected a function definition');
		return String(engine.render(statement.$with.name(engine.build.identifier('g'))));
	}

	it('keeps the source bytes of its untouched children, as a shallow read does', async () => {
		const source = 'def  f( a ):\n  pass\n';
		const shallow = await renamed(source, false);
		expect(shallow).toContain('( a ):');
		expect(await renamed(source, true)).toBe(shallow);
	});

	it('renders a deep child that owns a comment with its content intact (canonical gaps around it until relative coordinates land)', async () => {
		const rendered = await renamed('def f(a):  # c\n  pass\n', true);
		expect(rendered.replace(/[ \t]+/g, '')).toContain('defg(a):#c\n');
		expect(rendered).toContain('pass');
	});
});
