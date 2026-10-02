import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode, TriviaFacts } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';
import { createRenderHandle } from '../src/engine.ts';
import { inTreeEngine } from '../src/engine-scope.ts';
import { ERROR_KIND_ID } from '../src/error-kind.ts';
import { Source } from '../src/source.ts';
import { withMethods } from '../src/utils.ts';
import { triviaFacts } from './support/fake-engine.ts';

interface Options {
	readonly indent?: string;
}

const trivia: TriviaFacts = {
	...triviaFacts(),
	kindName: (type) => (type === 3 ? 'group' : type === 9 ? 'comment' : undefined),
	innerGaps: { group: ['inner'] }
};

const node = (data: Record<string, unknown>): AnyUntypedNode => withMethods(data as unknown as AnyUntypedNode);

function fakeLanguage(name: string) {
	const trees: object[] = [];
	let engines = 0;
	const hooks = {
		name,
		renderModuleHash: `hash-${name}`,
		build: {
			leaf: Object.assign((text: string) => node({ $type: 1, $text: text, $source: Source.Factory }), {
				strict: (text: string) => node({ $type: 1, $text: text, $source: Source.Factory })
			}),
			group: (...items: unknown[]) => node({ $type: 3, _items: items, $source: Source.Factory }),
			number: { bigint: (v: bigint) => node({ $type: 2, $text: String(v), $source: Source.Factory }) }
		},
		is: {
			leaf: (v: AnyUntypedNode) => v.$type === 1,
			kind: (v: AnyUntypedNode, k: number) => v.$type === k,
			expression: (v: AnyUntypedNode) => new Set([1, 3]).has(v.$type as number)
		},
		kinds: {},
		trivia,
		createNative: (opts?: { options?: Options }) => {
			const label = String.fromCharCode(65 + engines++);
			return {
				render: (n: AnyUntypedNode, call?: Options) =>
					createRenderHandle(() => `${label}:${call?.indent ?? opts?.options?.indent ?? ''}:${n.$type}`),
				applyEdits: (s: string) => s,
				parseAndRead: () => {
					const tree = { source: 'src' };
					trees.push(tree);
					return { root: { $type: 4, $source: Source.Ts, _items: [] }, tree };
				},
				dispose: () => undefined
			};
		},
		wrap: (root: object, tree: object) => inTreeEngine(tree, () => node({ ...root, $source: Source.Ts }))
	};
	return {
		language: { name, load: async () => hooks },
		hydrate: (tree: object) => inTreeEngine(tree, () => node({ $type: 5, $text: 'lazy', $source: Source.Ts })),
		trees
	};
}

async function engineOf(language: ReturnType<typeof fakeLanguage>, indent?: string) {
	return (await createEngine(
		language.language as never,
		(indent ? { render: { indent } } : undefined) as never
	)) as any;
}

const stampOf = (n: unknown): unknown => (n as { $engine?: () => unknown }).$engine?.();

describe('the nodes an engine builds and reads', () => {
	it('stamps every builder, including nested variants and flavours', async () => {
		const engine = await engineOf(fakeLanguage('fake'));
		expect(stampOf(engine.build.leaf('a'))).toBe(engine);
		expect(stampOf(engine.build.leaf.strict('a'))).toBe(engine);
		expect(stampOf(engine.build.number.bigint(1n))).toBe(engine);
		expect(stampOf(engine.build.group(engine.build.leaf('a')))).toBe(engine);
	});

	it('stamps the nodes a build callback makes', async () => {
		const engine = await engineOf(fakeLanguage('fake'));
		const rendered = engine.render((b: any) => {
			expect(stampOf(b.leaf('a'))).toBe(engine);
			return b.leaf('a');
		});
		expect(String(rendered)).toBe('A::1');
	});

	it('renders one shape differently through $render() in two engines of one language', async () => {
		const fake = fakeLanguage('fake');
		const tab = await engineOf(fake, '\t');
		const two = await engineOf(fake, '  ');
		expect(tab.build.leaf('a').$render()).toBe('A:\t:1');
		expect(two.build.leaf('a').$render()).toBe('B:  :1');
	});

	it('stamps a parsed root and a child hydrated after the parse returned', async () => {
		const fake = fakeLanguage('fake');
		const engine = await engineOf(fake);
		const root = engine.parse('src');
		expect(stampOf(root)).toBe(engine);
		expect(stampOf(fake.hydrate(fake.trees[0]!))).toBe(engine);
	});

	it('detaches every node of a disposed engine and leaves another engine alone', async () => {
		const fake = fakeLanguage('fake');
		const a = await engineOf(fake);
		const b = await engineOf(fake);
		const built = a.build.leaf('a');
		const parsed = a.parse('src');
		const other = b.build.leaf('b');
		a.dispose();
		for (const n of [built, parsed]) {
			const identity = stampOf(n) as { render?: unknown; language: { name: string } };
			expect(identity.render).toBeUndefined();
			expect(identity.language.name).toBe('fake');
			expect(() => n.$render()).toThrow(/engine disposed.*engine\.render\(node\)/);
		}
		expect(other.$render()).toBe('B::1');
	});
});

describe('rendering through an engine what another engine parsed', () => {
	it('renders a node built throughout by the calling engine directly', async () => {
		const engine = await engineOf(fakeLanguage('fake'), '>');
		const built = engine.build.group(engine.build.leaf('a'));
		expect(String(engine.render(built))).toBe('A:>:3');
		expect(built.$render()).toBe('A:>:3');
	});

	it('renders through the calling engine what another engine parsed', async () => {
		const fake = fakeLanguage('fake');
		const a = await engineOf(fake, '>');
		const b = await engineOf(fake, '<');
		const built = a.build.group(b.parse('src'));
		expect(String(a.render(built))).toBe('A:>:3');
		expect(built.$render()).toBe('A:>:3');
		expect(String(a.render(built, { indent: '!' }))).toBe('A:!:3');
		expect(String(b.render(built))).toBe('B:<:3');
	});

	it('renders through the calling engine when it parsed the children itself', async () => {
		const engine = await engineOf(fakeLanguage('fake'), '>');
		const built = engine.build.group(engine.parse('src'));
		expect(built.$render()).toBe('A:>:3');
	});

	it('renders parsed children of several engines', async () => {
		const fake = fakeLanguage('fake');
		const a = await engineOf(fake, '>');
		const b = await engineOf(fake);
		const c = await engineOf(fake);
		const built = a.build.group(b.parse('src'), c.parse('src'));
		expect(String(a.render(built))).toBe('A:>:3');
		expect(built.$render()).toBe('A:>:3');
	});

	it('renders what a disposed engine parsed', async () => {
		const fake = fakeLanguage('fake');
		const a = await engineOf(fake, '>');
		const b = await engineOf(fake);
		const built = a.build.group(b.parse('src'));
		b.dispose();
		expect(String(a.render(built))).toBe('A:>:3');
	});

	it('refuses a node of another language, naming both', async () => {
		const a = await engineOf(fakeLanguage('fake'));
		const other = await engineOf(fakeLanguage('other'));
		expect(() => a.render(other.build.leaf('x'))).toThrow('cannot render a other node through a fake engine');
	});
});

describe('the immutability of an engine', () => {
	it('refuses assignment to the engine and its build table', async () => {
		const fake = fakeLanguage('fake');
		const engine = await engineOf(fake);
		expect(() => {
			engine.render = () => undefined;
		}).toThrow(TypeError);
		expect(() => {
			engine.build.leaf = () => undefined;
		}).toThrow(/read-only/);
		expect(() => {
			engine.build.leaf.strict = () => undefined;
		}).toThrow(/read-only/);
		expect(() => {
			delete engine.build.number.bigint;
		}).toThrow(/read-only/);
		expect(() => Object.defineProperty(engine.build, 'extra', { value: 1 })).toThrow(/read-only/);
	});

	it('leaves the options the caller passed unfrozen', async () => {
		const options = { indent: '>' };
		const engine = (await createEngine(fakeLanguage('fake').language as never, { render: options } as never)) as any;
		expect(Object.isFrozen(engine)).toBe(true);
		expect(Object.isFrozen(options)).toBe(false);
		expect(engine.build.leaf('a').$render()).toBe('A:>:1');
	});

	it('still detaches on dispose', async () => {
		const engine = await engineOf(fakeLanguage('fake'));
		const built = engine.build.leaf('a');
		engine.dispose();
		expect(() => built.$render()).toThrow(/engine disposed/);
		expect(() => engine.render(built)).not.toThrow(/read-only/);
	});
});

describe('the node guards of an engine', () => {
	const parsedLeaf = (fake: ReturnType<typeof fakeLanguage>) =>
		inTreeEngine(fake.trees[0]!, () => node({ $type: 1, $text: 'p', $source: Source.Ts }));

	it('accept a node of their language, from any engine of it and from any origin', async () => {
		const fake = fakeLanguage('fake');
		const a = await engineOf(fake);
		const b = await engineOf(fake);
		b.parse('src');
		const built = b.build.leaf('x');
		const parsed = b.parse('src');
		for (const guard of ['isNode'] as const) {
			expect(a[guard](built)).toBe(true);
			expect(a[guard](parsed)).toBe(true);
		}
		expect(a.isFactoryNode(built)).toBe(true);
		expect(a.isFactoryNode(parsed)).toBe(false);
		expect(a.isParsedNode(parsed)).toBe(true);
		expect(a.isParsedNode(built)).toBe(false);
		expect(a.isParsedNode(parsedLeaf(fake))).toBe(true);
	});

	it('reject a node of another language whose kind id is valid in both', async () => {
		const a = await engineOf(fakeLanguage('fake'));
		const other = await engineOf(fakeLanguage('other'));
		const foreign = other.build.leaf('x');
		expect(foreign.$type).toBe(a.build.leaf('x').$type);
		expect(a.isNode(foreign)).toBe(false);
		expect(a.isFactoryNode(foreign)).toBe(false);
		expect(a.isEmptyNode(other.build.group())).toBe(false);
	});

	it('reject every value that carries no engine', async () => {
		const engine = await engineOf(fakeLanguage('fake'));
		const unstamped = withMethods({ $type: 1, $text: 'x', $source: Source.Factory } as unknown as AnyUntypedNode);
		for (const value of [unstamped, { $type: 1, $source: Source.Factory }, 'x', 1, null, undefined]) {
			expect(engine.isNode(value)).toBe(false);
			expect(engine.isFactoryNode(value)).toBe(false);
			expect(engine.isParsedNode(value)).toBe(false);
			expect(engine.isErrorNode(value)).toBe(false);
		}
	});

	it('still accept the nodes of a disposed engine', async () => {
		const engine = await engineOf(fakeLanguage('fake'));
		const built = engine.build.leaf('x');
		engine.dispose();
		expect(engine.isNode(built)).toBe(true);
		expect(engine.isFactoryNode(built)).toBe(true);
	});

	it('recognise an error node only when it is parsed and of their language', async () => {
		const fake = fakeLanguage('fake');
		const engine = await engineOf(fake);
		engine.parse('src');
		const error = inTreeEngine(fake.trees[0]!, () => node({ $type: ERROR_KIND_ID, $source: Source.Ts }));
		expect(engine.isErrorNode(error)).toBe(true);
		expect(engine.isErrorNode(parsedLeaf(fake))).toBe(false);
		const other = await engineOf(fakeLanguage('other'));
		expect(other.isErrorNode(error)).toBe(false);
	});

	it('take an empty node only of a kind with an inner gap and no content', async () => {
		const engine = await engineOf(fakeLanguage('fake'));
		expect(engine.isEmptyNode(engine.build.group())).toBe(true);
		expect(engine.isEmptyNode(engine.build.group(engine.build.leaf('a')))).toBe(false);
		expect(engine.isEmptyNode(engine.build.leaf('a'))).toBe(false);
		expect(engine.isEmptyNode({ $type: 3, $source: Source.Factory } as never)).toBe(false);
	});
});

describe('the kind guards of an engine', () => {
	it('accept a node of the language by its kind, and pass the extra arguments through', async () => {
		const fake = fakeLanguage('fake');
		const a = await engineOf(fake);
		const b = await engineOf(fake);
		expect(a.is.leaf(b.build.leaf('x'))).toBe(true);
		expect(a.is.leaf(b.build.group())).toBe(false);
		expect(a.is.kind(a.build.group(), 3)).toBe(true);
		expect(a.is.kind(a.build.group(), 1)).toBe(false);
	});

	it('reject a node of another language whose kind id matches', async () => {
		const a = await engineOf(fakeLanguage('fake'));
		const other = await engineOf(fakeLanguage('other'));
		const foreign = other.build.leaf('x');
		expect(foreign.$type).toBe(1);
		expect(other.is.leaf(foreign)).toBe(true);
		expect(a.is.leaf(foreign)).toBe(false);
		expect(a.is.kind(other.build.group(), 3)).toBe(false);
		expect(other.is.expression(foreign)).toBe(true);
		expect(a.is.expression(foreign)).toBe(false);
		expect(a.is.expression(a.build.leaf('y'))).toBe(true);
	});

	it('reject every value that carries no engine', async () => {
		const engine = await engineOf(fakeLanguage('fake'));
		const unstamped = withMethods({ $type: 1, $text: 'x', $source: Source.Factory } as unknown as AnyUntypedNode);
		for (const value of [unstamped, { $type: 1 }, 'x', 1, null, undefined]) {
			expect(engine.is.leaf(value)).toBe(false);
		}
	});

	it('still accept the nodes of a disposed engine', async () => {
		const engine = await engineOf(fakeLanguage('fake'));
		const built = engine.build.leaf('x');
		engine.dispose();
		expect(engine.is.leaf(built)).toBe(true);
	});

	it('are frozen', async () => {
		const engine = await engineOf(fakeLanguage('fake'));
		expect(() => {
			engine.is.leaf = () => true;
		}).toThrow(TypeError);
	});
});
