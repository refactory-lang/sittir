import { describe, it, expect } from 'vitest';
import { createEngine } from '../src/create-engine.ts';
import { createRenderHandle } from '../src/engine.ts';

interface FakeRenderOptions {
	readonly indent?: string;
}

function fakeLanguage(name = 'fake') {
	let loads = 0;
	const created: (FakeRenderOptions | undefined)[] = [];
	const natives: { readonly disposed: boolean }[] = [];
	const hooks = {
		name,
		renderModuleHash: 'hash',
		build: {
			leaf: Object.assign((text: string) => ({ $type: 1, text }), {
				strict: (text: string) => ({ $type: 1, text, strict: true }),
				coerce: (text: string) => ({ $type: 1, text })
			}),
			number: {
				bigint: Object.assign((v: bigint) => ({ $type: 2, text: String(v) }), {
					strict: (v: bigint) => ({ $type: 2, text: String(v), strict: true })
				})
			}
		},
		is: {},
		kinds: { Leaf: 1 },
		trivia: { kindName: () => undefined, kinds: new Set<string>(), innerGaps: {} },
		createNative: (opts?: { options?: FakeRenderOptions }) => {
			created.push(opts?.options);
			let disposed = false;
			const native = {
				render: (n: { text?: string }, call?: FakeRenderOptions) =>
					createRenderHandle(() => `${call?.indent ?? opts?.options?.indent ?? ''}${n.text ?? ''}`),
				applyEdits: (s: string) => `${s}!`,
				parseAndRead: (s: string) => ({ root: { $type: 1, text: s }, tree: { source: s } }),
				holdsTree: () => true,
				dispose: () => {
					disposed = true;
				},
				get disposed() {
					return disposed;
				}
			};
			natives.push(native);
			return native;
		},
		wrap: (root: object, tree: object) => ({ ...root, wrappedWith: tree })
	};
	return {
		language: {
			name,
			load: async () => {
				loads++;
				return hooks;
			}
		},
		loads: () => loads,
		created,
		natives
	};
}

const engineOf = async (options?: object, f = fakeLanguage()) =>
	(await createEngine(f.language as never, options as never)) as any;

describe('createEngine', () => {
	it('loads a language once', async () => {
		const f = fakeLanguage();
		await createEngine(f.language as never);
		await createEngine(f.language as never);
		expect(f.loads()).toBe(1);
	});

	it('does not cache a failed load, and rejects with the cause', async () => {
		const cause = new Error('native binding missing');
		let attempts = 0;
		const broken = {
			name: 'broken',
			load: async () => {
				attempts++;
				throw cause;
			}
		};
		await expect(createEngine(broken as never)).rejects.toMatchObject({
			message: 'failed to load language "broken"',
			cause
		});
		await expect(createEngine(broken as never)).rejects.toMatchObject({ cause });
		expect(attempts).toBe(2);
	});

	it('exposes the language, guards and kinds from the hooks', async () => {
		const e = await engineOf();
		expect(e.language.name).toBe('fake');
		expect(e.renderModuleHash).toBe('hash');
		expect(e.kinds).toEqual({ Leaf: 1 });
	});

	it('builds through nested variant builders and their flavours', async () => {
		const e = await engineOf();
		expect(String(e.render(e.build.number.bigint(1n)))).toBe('1');
		expect(e.build.leaf.strict('a')).toMatchObject({ strict: true });
	});

	it('maps the render option onto the native engine options', async () => {
		const f = fakeLanguage();
		await createEngine(f.language as never, { render: { indent: '>' } } as never);
		expect(f.created).toEqual([{ indent: '>' }]);
	});

	it('renders a build callback', async () => {
		const e = await engineOf({ render: { indent: '>' } });
		expect(String(e.render((b: any) => b.leaf('a')))).toBe('>a');
	});

	it('resolves flat per-call render options over the engine options', async () => {
		const e = await engineOf({ render: { indent: '>' } });
		expect(String(e.render(e.build.leaf('a'), { indent: '#' }))).toBe('#a');
	});

	it('two engines of one language share no state', async () => {
		const f = fakeLanguage();
		const a = await engineOf({ render: { indent: 'A' } }, f);
		const b = await engineOf({ render: { indent: 'B' } }, f);
		expect(String(a.render(a.build.leaf('n')))).toBe('An');
		expect(String(b.render(b.build.leaf('n')))).toBe('Bn');
	});

	it('parses through the native engine and wraps the root with its tree', async () => {
		const e = await engineOf();
		expect(e.parse('src')).toEqual({ $type: 1, text: 'src', wrappedWith: { source: 'src' } });
	});

	it('applies edits through the native engine', async () => {
		const e = await engineOf();
		expect(e.applyEdits('x', [])).toBe('x!');
	});

	it('disposes its native engine', async () => {
		const f = fakeLanguage();
		const e = await engineOf(undefined, f);
		expect(f.natives.map((n) => n.disposed)).toEqual([false]);
		e.dispose();
		expect(f.natives.map((n) => n.disposed)).toEqual([true]);
	});

	it('throws on a rendered handle used after disposal', async () => {
		const e = await engineOf();
		const r = e.render(e.build.leaf('a'));
		expect(r.toString()).toBe('a');
		r[Symbol.dispose]();
		expect(() => r.toString()).toThrow('rendered text disposed');
		expect(() => r.print()).toThrow('rendered text disposed');
		expect(() => r.save('/dev/null')).toThrow('rendered text disposed');
	});

	it('rejects the surfaces and interceptors it does not implement', async () => {
		const f = fakeLanguage();
		await expect(createEngine(f.language as never, { api: 'portable' } as never)).rejects.toThrow(
			'api "portable" is not implemented'
		);
		await expect(createEngine(f.language as never, { api: 'strict' } as never)).rejects.toThrow(
			'api "strict" is not implemented'
		);
		await expect(createEngine(f.language as never, { intercept: [{}] } as never)).rejects.toThrow(
			'interceptors are not implemented'
		);
		expect(f.loads()).toBe(0);
		await expect(createEngine(f.language as never, { api: 'default', intercept: [] } as never)).resolves.toBeDefined();
	});

	it('rejects the file verbs it does not implement', async () => {
		const e = await engineOf();
		await expect(e.read('a')).rejects.toThrow('file verb "read" is not implemented');
		expect(() => e.create('a', () => e.build.leaf('a'))).toThrow('file verb "create" is not implemented');
		expect(() => e.edit('a', (r: unknown) => r)).toThrow('file verb "edit" is not implemented');
		expect(() => e.write('a', e.build.leaf('a'))).toThrow('file verb "write" is not implemented');
	});
});
