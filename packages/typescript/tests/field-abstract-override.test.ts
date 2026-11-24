import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

const engine = await sharedEngine(() => createEngine(typescript, { api: 'strict' }));
const runtime = await portableRuntime(engine);
const render = (node: unknown): string => String(engine.render(node as never));

const squash = (text: string): string => text.replace(/\s+/g, ' ').trim();
const classWith = (modifiers: string): string => `abstract class A extends B { ${modifiers} x: number; }\n`;

describe('a class field keeps abstract, override and readonly as flags of one kind', () => {
	it.each(['abstract override', 'abstract override readonly', 'public abstract override', 'protected abstract override readonly', 'abstract readonly', 'readonly abstract', 'static override', 'override readonly'])(
		'parses %s without errors',
		(modifiers) => {
			expect(engine.parse(classWith(modifiers)).$errors).toHaveLength(0);
		}
	);

	it.each(['static abstract', 'override abstract'])('still refuses %s', (modifiers) => {
		expect(engine.parse(classWith(modifiers)).$errors.length).toBeGreaterThan(0);
	});

	it('reads declaration.field with both flags and rebuilds the source', () => {
		const source = classWith('abstract override readonly');
		const read = runtime.read(engine.parse(source)) as unknown as { statements: { body: { $path: string; $flags: string[] }[] }[] };
		const field = read.statements[0]!.body[0]!;
		expect(field.$path).toBe('declaration.field');
		expect(field.$flags).toEqual(['abstract', 'override', 'readonly']);
		expect(squash(render(runtime.build(read as never)))).toBe(squash(source));
	});

	it('writes abstract before override', () => {
		const built = runtime.build({ $path: 'declaration.field', name: 'x', $flags: ['override', 'abstract'] } as never);
		expect(render(built)).toMatch(/abstract override x/);
	});

	it('rebuilds readonly abstract as a parse reads it', () => {
		const tree = engine.parse(classWith('readonly abstract'));
		expect(render(runtime.build(runtime.read(tree) as never))).toMatch(/\b(abstract readonly|readonly abstract) x: number;/);
	});
});
