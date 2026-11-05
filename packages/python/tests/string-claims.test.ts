import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { portable, vocabularyPaths } from '@sittir/common/portable';
import python from '../src/index.ts';

type Spelling = { readonly value: string; readonly canonical?: string; readonly readOnly?: true };
type ModelNode = { readonly kind: string; readonly slots?: readonly { readonly name: string; readonly values?: readonly Spelling[] }[] };

const model = JSON.parse(readFileSync(new URL('../src/node-model.json5', import.meta.url), 'utf8')) as { readonly nodes: readonly ModelNode[] };
const spellingsOf = (slot: string): readonly Spelling[] =>
	model.nodes.find((node) => node.kind === 'string_start')!.slots!.find((s) => s.name === slot)!.values!;
const prefixes = spellingsOf('prefix');
const quotes = spellingsOf('quote').filter((quote) => quote.readOnly !== true);

type Guard = (node: unknown) => boolean;
const guard = (path: string): Guard =>
	path.split('.').reduce<Record<string, unknown>>((node, segment) => node[segment] as Record<string, unknown>, portable.is as never) as unknown as Guard;
const stringPaths = vocabularyPaths.filter((path) => path === 'literal.string' || path.startsWith('literal.string.'));

const py = await createEngine(python);

type ReadString = { prefix(): string | undefined; readonly $with: { contents(...items: unknown[]): unknown } };
const stringOf = (source: string): ReadString =>
	(py.parse(`${source}\n`) as unknown as { statements(): readonly { elements(): readonly { content(): ReadString }[] }[] }).statements()[0]!.elements()[0]!.content();
const claimsOf = (source: string): readonly string[] => stringPaths.filter((path) => guard(path)(stringOf(source)));

describe('the string claims and the prefix enum agree', () => {
	it.each(prefixes.filter((prefix) => prefix.canonical !== undefined).map((prefix) => [prefix.value, prefix.canonical!] as const))(
		'%s selects the claims its member %s selects, under every quote',
		(spelling, member) => {
			for (const { value: quote } of quotes) {
				const claims = claimsOf(`${member}${quote}x${quote}`);
				expect(claims.length).toBeGreaterThan(0);
				expect(claimsOf(`${spelling}${quote}x${quote}`)).toEqual(claims);
			}
		}
	);

	it('tells the members apart by their claims', () => {
		expect(claimsOf('rb"x"')).toContain('literal.string.bytes.raw');
		expect(claimsOf('"x"')).not.toContain('literal.string.raw');
		expect(claimsOf('t"x"')).toContain('literal.string.interpolated.deferred');
		expect(claimsOf('u"x"')).toContain('literal.string.unicode');
	});

	it('reads every spelling in the enum as its member', () => {
		for (const { value, canonical } of prefixes) expect(stringOf(`${value}"x"`).prefix()).toBe(canonical ?? value);
	});

	describe('a read-only spelling, which is read and never built', () => {
		const carriesOf = async (source: string): Promise<readonly string[]> => {
			const runtime = await portableRuntime(await createEngine(python, { api: 'strict' }));
			const reasons: string[] = [];
			runtime.read(runtime.engine.parse(`${source}\n`), (_node, carry) => reasons.push(carry.reason));
			return reasons;
		};
		const readOnly = prefixes.filter((prefix) => prefix.readOnly === true).map((prefix) => prefix.value);

		it('carries each read-only prefix spelling and the backtick under readOnly', async () => {
			expect(readOnly.sort()).toEqual(['UR', 'Ur', 'uR', 'ur']);
			for (const prefix of readOnly) expect(await carriesOf(`${prefix}"x"`)).toEqual(['readOnly']);
			expect(await carriesOf('`x`')).toEqual(['readOnly']);
		});

		it('carries no other spelling, under any quote, and reads each one back with the claims it was read with', async () => {
			const runtime = await portableRuntime(await createEngine(python, { api: 'strict' }));
			for (const { value: prefix } of prefixes.filter((spelled) => spelled.readOnly !== true))
				for (const { value: quote } of quotes) {
					const source = `${prefix}${quote}x${quote}`;
					expect(await carriesOf(source)).toEqual([]);
					const rebuilt = String(runtime.engine.render(runtime.build(runtime.read(runtime.engine.parse(`${source}\n`)) as never) as never));
					expect(claimsOf(rebuilt.trimEnd())).toEqual(claimsOf(source));
				}
		});
	});

	describe('a spelling a claim matches outside the enum', () => {
		it.each(['bf', 'rr', 'ub'])('%s reads opaque, keeps its source bytes and is carried whole', async (spelling) => {
			const engine = await createEngine(python, { api: 'strict' });
			const source = `${spelling}"y"\n`;
			const tree = engine.parse(source);
			const string = (tree as unknown as { statements(): readonly { elements(): readonly { content(): ReadString }[] }[] }).statements()[0]!.elements()[0]!.content();
			expect(string.prefix()).toBeUndefined();
			expect(String(engine.render(tree))).toBe(source);
			expect(String(engine.render(string.$with.contents(engine.build.stringContent(engine.build.stringFragment('z'))) as never))).toBe(`${spelling}"z"`);
			const runtime = await portableRuntime(engine);
			expect(String(engine.render(runtime.build(runtime.read(tree) as never) as never))).toBe(source);
		});
	});
});
