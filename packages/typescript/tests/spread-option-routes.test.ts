import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

const engine = await sharedEngine(() => createEngine(typescript));
const b = engine.build;

function declarators(): readonly unknown[] {
	const [statement] = engine.parse('using x = f, y = g;').statements() as unknown as readonly { variableDeclarators(): readonly unknown[] }[];
	return statement!.variableDeclarators();
}

describe('an option route of a builder that takes its children positionally', () => {
	it('takes the children the builder takes, with the routed option set', () => {
		const [x, y] = declarators();
		expect(String(engine.render(b.usingDeclaration.plain.semi(x as never, y as never)))).toBe('using x = f, y = g;');
		expect(String(engine.render(b.usingDeclaration.await.semi(x as never, y as never)))).toBe('await using x = f, y = g;');
		expect(String(engine.render(b.usingDeclaration.plain.automaticSemicolon(x as never)))).not.toContain(';');
	});

	it('takes the config the build surface takes in place of the children', () => {
		const [x, y] = declarators();
		expect(String(engine.render(b.usingDeclaration.await.semi({ variableDeclarators: [x, y] } as never)))).toBe('await using x = f, y = g;');
	});

	it('refuses the routed option among its arguments', () => {
		const [x] = declarators();
		// @ts-expect-error -- the route sets automaticSemicolon itself
		expect(() => b.usingDeclaration.plain.semi({ automaticSemicolon: ';' }, x as never)).toThrow();
	});
});
