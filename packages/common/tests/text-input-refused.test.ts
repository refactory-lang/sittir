import { describe, expect, it } from 'vitest';
import python from '@sittir/python';
import regex from '@sittir/regex';
import rust from '@sittir/rust';
import scm from '@sittir/scm';
import typescript from '@sittir/typescript';
import { createEngine } from '../src/create-engine.ts';

class Coerced extends Error {}

const refuse = (): never => {
	throw new Coerced('an input was coerced to a primitive');
};

/** A node-shaped value that throws the moment anything coerces it to a string or a number. */
const probe = {
	$type: 0,
	$text: 'x',
	toString: refuse,
	valueOf: refuse,
	[Symbol.toPrimitive]: refuse
};

const SHAPES: readonly (readonly unknown[])[] = [
	[probe],
	[probe, false],
	[probe, probe],
	[{ content: probe }],
	[{ text: probe }],
	[{ name: probe }],
	[{ content: probe, suffix: probe }],
	[{ elements: [probe] }]
];

function builders(root: object, path: string, seen = new Set<unknown>()): [string, (...args: unknown[]) => unknown][] {
	if (seen.has(root)) return [];
	seen.add(root);
	const found: [string, (...args: unknown[]) => unknown][] = [];
	if (typeof root === 'function') found.push([path, root as (...args: unknown[]) => unknown]);
	for (const key of Object.keys(root)) {
		const member = (root as Record<string, unknown>)[key];
		if ((typeof member === 'function' || (typeof member === 'object' && member !== null)) && path.split('.').length < 4) {
			found.push(...builders(member as object, `${path}.${key}`, seen));
		}
	}
	return found;
}

describe('a builder or coercer takes text as text only', () => {
	it.each([
		['python', async () => (await createEngine(python)).build],
		['regex', async () => (await createEngine(regex)).build],
		['rust', async () => (await createEngine(rust)).build],
		['scm', async () => (await createEngine(scm)).build],
		['typescript', async () => (await createEngine(typescript)).build]
	] as const)('%s: no input is coerced to a string or a number', async (name, buildOf) => {
		const exposed: string[] = [];
		let called = 0;
		for (const [path, build] of builders(await buildOf(), 'build')) {
			for (const args of SHAPES) {
				try {
					build(...args);
					called++;
				} catch (error) {
					called++;
					if (error instanceof Coerced) exposed.push(`${path}(${args.map((arg) => (arg === probe ? 'probe' : JSON.stringify(arg, (_k, v) => (v === probe ? 'probe' : v)))).join(', ')})`);
				}
			}
		}
		expect(called).toBeGreaterThan(100);
		expect(exposed, `${name}: builders that coerced an input`).toEqual([]);
	}, 120_000);
});
