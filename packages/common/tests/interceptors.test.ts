import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import rust, { type RustAPI } from '@sittir/rust';
import type { BuilderMode, CreateEngineOptions, Engine, EngineOptions, Interceptor, Language } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';

const engines: { dispose(): void }[] = [];
afterEach(() => {
	for (const engine of engines.splice(0)) engine.dispose();
});

async function engineOf(options?: EngineOptions<RustAPI>): Promise<Engine<RustAPI>> {
	const engine = await createEngine(rust, options);
	engines.push(engine);
	return engine;
}

describe('engine middleware', () => {
	it('composes hooks in registration order', async () => {
		const events: string[] = [];
		const middleware = (label: string): Interceptor<RustAPI> => ({
			render(_call, next) {
				events.push(`${label}:before`);
				const text = next();
				events.push(`${label}:after`);
				return `${label}(${text})`;
			}
		});
		const engine = await createEngine(rust, { api: 'strict', intercept: [middleware('outer'), {}, middleware('inner')] });
		engines.push(engine);
		const node = engine.build.integerLiteral.decimal({ content: 255 });
		expect(engine.render(node).toString()).toBe('outer(inner(255))');
		expect(events).toEqual(['outer:before', 'inner:before', 'inner:after', 'outer:after']);
	});

	it('keeps each builder of the build table one function, and the table read-only', async () => {
		const engine = await createEngine(rust, { api: 'strict' });
		engines.push(engine);
		const node = engine.build.integerLiteral.decimal({ content: 255 });
		expect(engine.isFactoryNode(node)).toBe(true);
		expect(node.$render()).toBe('255');
		expect(engine.build.integerLiteral.decimal).toBe(engine.build.integerLiteral.decimal);
		expect(() => Reflect.set(engine.build, 'identifier', () => node)).toThrow('read-only');
	});

	it('observes the wrapped parse once and preserves errors and lazy children', async () => {
		const sources: string[] = [];
		const engine = await engineOf({
			intercept: [
				{
					parse(call, next) {
						sources.push(call.source);
						return next();
					}
				}
			]
		});
		const root = engine.parse('fn example() {}');
		expect(engine.isParsedNode(root.statements()[0])).toBe(true);
		expect(sources).toEqual(['fn example() {}']);
		expect(() => engine.parse('fn {', { errors: 'throw' })).toThrow();
		expect(sources).toEqual(['fn example() {}', 'fn {']);
	});

	it('runs lazy render middleware once with resolved options across output methods', async () => {
		const directory = mkdtempSync(join(tmpdir(), 'sittir-intercept-'));
		const calls: unknown[] = [];
		const output = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		try {
			const engine = await engineOf({
				render: { layout: { indent: '  ' } },
				intercept: [
					{
						render(call, next) {
							calls.push(call);
							return `[${next()}]`;
						}
					}
				]
			});
			using rendered = engine.render(engine.build.identifier('x'), { layout: { indent: '\t' } });
			expect(calls).toEqual([]);
			expect(rendered.toString()).toBe('[x]');
			expect(rendered.toString()).toBe('[x]');
			expect(rendered.print()).toBe('[x]');
			expect(output).toHaveBeenCalledWith('[x]');
			const path = join(directory, 'output.rs');
			rendered.save(path);
			expect(readFileSync(path, 'utf8')).toBe('[x]');
			expect(calls).toHaveLength(1);
			expect(calls[0]).toMatchObject({ options: { layout: { indent: '\t' } } });
		} finally {
			output.mockRestore();
			rmSync(directory, { recursive: true, force: true });
		}
	});

	it('shows middleware the engine and call layout settings merged key by key', async () => {
		const calls: { options: unknown }[] = [];
		const engine = await engineOf({
			render: { layout: { indent: '  ' } },
			intercept: [
				{
					render(call, next) {
						calls.push(call);
						return next();
					}
				}
			]
		});
		engine.render(engine.build.identifier('x'), { layout: { newline: '\r\n' } }).toString();
		expect(calls[0]!.options).toEqual({ layout: { indent: '  ', newline: '\r\n' } });
	});

	it('runs build callbacks and node render methods through the same render hook', async () => {
		const events: string[] = [];
		const engine = await engineOf({
			intercept: [
				{
					render(_call, next) {
						events.push('render');
						return next().toUpperCase();
					}
				}
			]
		});
		expect(engine.render((build) => build.identifier('one')).toString()).toBe('ONE');
		expect(engine.build.identifier('two').$render()).toBe('TWO');
		expect(events).toEqual(['render', 'render']);
	});

	it('propagates hook errors and leaves other engines unaffected', async () => {
		const cause = new Error('middleware refused');
		const intercepted = await engineOf({
			intercept: [
				{
					parse() {
						throw cause;
					},
					render() {
						throw cause;
					}
				}
			]
		});
		const plain = await engineOf();
		expect(intercepted.build.identifier('x').$type).toBe(plain.build.identifier('x').$type);
		expect(() => intercepted.parse('')).toThrow(cause);
		using rendered = intercepted.render(plain.build.identifier('x'));
		expect(() => rendered.toString()).toThrow(cause);
		expect(plain.build.identifier('x').$render()).toBe('x');
	});

	it('supports render short circuits and retains output disposal', async () => {
		const engine = await engineOf({ intercept: [{ render: () => 'cached' }] });
		const rendered = engine.render(engine.build.identifier('x'));
		expect(rendered.toString()).toBe('cached');
		rendered[Symbol.dispose]();
		expect(() => rendered.toString()).toThrow('rendered text disposed');
	});


	it('permits a parse short circuit and snapshots the registered hook list', async () => {
		const plain = await engineOf();
		const cached = plain.parse('fn cached() {}');
		const intercept: Interceptor<RustAPI>[] = [{ parse: () => cached }];
		const engine = await engineOf({ intercept });
		intercept.push({
			parse() {
				throw new Error('registered after construction');
			}
		});
		expect(engine.parse('this source is never parsed')).toBe(cached);
	});

	it('captures render storage at the original boundary and releases even unused inner output', async () => {
		const hooks = await rust.load();
		let released = 0;
		const language: Language<RustAPI> = {
			...rust,
			createEngine: <const R extends RustAPI['options'], const M extends BuilderMode>(options?: CreateEngineOptions<RustAPI, R, M>) => createEngine<RustAPI, R, M>(language, options),
			load: async () => ({
				...hooks,
				createNative(options) {
					const native = hooks.createNative(options);
					return {
						...native,
						render(node, options) {
							const rendered = native.render(node, options);
							return {
								...rendered,
								[Symbol.dispose]() {
									released++;
									rendered[Symbol.dispose]();
								}
							};
						}
					};
				}
			})
		};
		const engine = await createEngine(language, { nodeStorage: 'object', intercept: [{ render: (_call, next) => next() }] });
		try {
			const node = engine.build.identifier('before');
			const rendered = engine.render(node);
			expect(Reflect.set(node, '$text', 'after')).toBe(true);
			expect(rendered.toString()).toBe('before');
			rendered[Symbol.dispose]();
			expect(released).toBe(1);
			const unused = engine.render(node);
			unused[Symbol.dispose]();
			expect(released).toBe(2);
		} finally {
			engine.dispose();
		}
	});
});
