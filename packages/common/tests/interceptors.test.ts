import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import rust, { type RustAPI } from '@sittir/rust';
import type { Engine, EngineOptions, Interceptor, Language } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';

const engines: Engine<RustAPI>[] = [];
afterEach(() => {
	for (const engine of engines.splice(0)) engine.dispose();
});

async function engineOf(options?: EngineOptions<RustAPI>): Promise<Engine<RustAPI>> {
	const engine = await createEngine(rust, options);
	engines.push(engine);
	return engine;
}

describe('engine middleware', () => {
	it('composes hooks in registration order and scopes nested builders', async () => {
		const events: string[] = [];
		const middleware = (label: string): Interceptor<RustAPI> => ({
			build(call, next) {
				events.push(`${label}:before:${call.path.join('.')}`);
				const node = next();
				events.push(`${label}:after:${call.path.join('.')}`);
				return node;
			}
		});
		const engine = await engineOf({ intercept: [middleware('outer'), {}, middleware('inner')] });
		const node = engine.build.integerLiteral.decimal.strict({ content: 255 });
		expect(events).toEqual([
			'outer:before:integerLiteral.decimal.strict',
			'inner:before:integerLiteral.decimal.strict',
			'inner:after:integerLiteral.decimal.strict',
			'outer:after:integerLiteral.decimal.strict'
		]);
		expect(engine.isFactoryNode(node)).toBe(true);
		expect(node.$render()).toBe('255');
		expect(engine.build.integerLiteral.decimal.strict).toBe(engine.build.integerLiteral.decimal.strict);
		expect(() => Reflect.set(engine.build, 'identifier', () => node)).toThrow('read-only');
	});

	it('lets a build hook substitute a node without running the builder', async () => {
		const { build } = await rust.load();
		const hook: Interceptor<RustAPI> = {
			build(call) {
				expect(call.args).toEqual(['original']);
				return build.identifier('replacement');
			}
		};
		const engine = await engineOf({ intercept: [hook] });
		const node = engine.build.identifier('original');
		expect(engine.isFactoryNode(node)).toBe(true);
		expect(node.$render()).toBe('replacement');
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

	it('runs build callbacks and node render methods through the same hooks', async () => {
		const events: string[] = [];
		const engine = await engineOf({
			intercept: [
				{
					build(call, next) {
						events.push(call.path.join('.'));
						return next();
					},
					render(_call, next) {
						events.push('render');
						return next().toUpperCase();
					}
				}
			]
		});
		expect(engine.render((build) => build.identifier('one')).toString()).toBe('ONE');
		expect(engine.build.identifier('two').$render()).toBe('TWO');
		expect(events).toEqual(['identifier', 'render', 'identifier', 'render']);
	});

	it('propagates hook errors and leaves other engines unaffected', async () => {
		const cause = new Error('middleware refused');
		const intercepted = await engineOf({
			intercept: [
				{
					build() {
						throw cause;
					},
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
		expect(() => intercepted.build.identifier('x')).toThrow(cause);
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

	it('retains the file-verb refusal while file hooks are reserved', async () => {
		const hook = vi.fn(async (_change, next: () => Promise<void>) => next());
		const engine = await engineOf({ intercept: [{ file: hook }] });
		expect(() => engine.write('out.rs', engine.parse(''))).toThrow('not implemented');
		expect(hook).not.toHaveBeenCalled();
	});

	it('reports the actual access path when two builders share a function', async () => {
		interface AliasedAPI extends RustAPI {
			readonly build: RustAPI['build'] & { readonly alias: RustAPI['build']['identifier'] };
		}
		const hooks = await rust.load();
		const language: Language<AliasedAPI> = {
			name: 'rust',
			fileTypes: rust.fileTypes,
			createEngine: (options) => createEngine(language, options),
			load: async () => ({ ...hooks, build: { ...hooks.build, alias: hooks.build.identifier } })
		};
		const recorded: string[] = [];
		const engine = await createEngine(language, {
			intercept: [
				{
					build(call, next) {
						recorded.push(call.path.join('.'));
						return next();
					}
				}
			]
		});
		try {
			expect(engine.build.alias('a').$render()).toBe('a');
			expect(engine.build.identifier('b').$render()).toBe('b');
			expect(engine.build.alias).toBe(engine.build.alias);
			expect(recorded).toEqual(['alias', 'identifier']);
		} finally {
			engine.dispose();
		}
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
			createEngine: (options) => createEngine(language, options),
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
		const engine = await createEngine(language, { intercept: [{ render: (_call, next) => next() }] });
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
