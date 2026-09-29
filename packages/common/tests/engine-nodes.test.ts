import { describe, expect, it } from 'vitest';
import type { AnyNodeData, GrammarFacts } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';
import { createRenderHandle } from '../src/engine.ts';
import { inTreeEngine } from '../src/engine-scope.ts';
import { Source } from '../src/source.ts';
import { withMethods } from '../src/utils.ts';

interface Options {
	readonly indent?: string;
}

const facts: GrammarFacts = {
	render: () => 'unscoped',
	toEdit: () => ({ startPos: 0, endPos: 0, insertedText: 'unscoped' }),
	trivia: { kindName: () => undefined, kinds: new Set<string>(), innerGaps: {} }
};

const node = (data: Record<string, unknown>): AnyNodeData => withMethods(data as unknown as AnyNodeData, facts);

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
		is: {},
		kinds: {},
		trivia: facts.trivia,
		createNative: (opts?: { options?: Options }) => {
			const label = String.fromCharCode(65 + engines++);
			return {
				render: (n: AnyNodeData, call?: Options) =>
					createRenderHandle(() => `${label}:${call?.indent ?? opts?.options?.indent ?? ''}:${n.$type}`),
				applyEdits: (s: string) => s,
				parseAndRead: () => {
					const tree = { source: 'src' };
					trees.push(tree);
					return { root: { $type: 4, $source: Source.Ts, _items: [] }, tree };
				},
				holdsTree: () => true,
				dispose: () => undefined
			};
		},
		wrap: (root: object, tree: object) => inTreeEngine(tree, () => node({ ...root, $source: Source.Ts }))
	};
	return {
		language: { name, load: async () => hooks },
		expand: (tree: object) => inTreeEngine(tree, () => node({ $type: 5, $text: 'lazy', $source: Source.Ts })),
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

	it('stamps a parsed root and a child expanded after the parse returned', async () => {
		const fake = fakeLanguage('fake');
		const engine = await engineOf(fake);
		const root = engine.parse('src');
		expect(stampOf(root)).toBe(engine);
		expect(stampOf(fake.expand(fake.trees[0]!))).toBe(engine);
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

	it('renders through the one engine that parsed its children, with the calling engine options', async () => {
		const fake = fakeLanguage('fake');
		const a = await engineOf(fake, '>');
		const b = await engineOf(fake, '<');
		const built = a.build.group(b.parse('src'));
		expect(String(a.render(built))).toBe('B:>:3');
		expect(built.$render()).toBe('B:>:3');
		expect(String(a.render(built, { indent: '!' }))).toBe('B:!:3');
	});

	it('renders through the calling engine when it parsed the children itself', async () => {
		const engine = await engineOf(fakeLanguage('fake'), '>');
		const built = engine.build.group(engine.parse('src'));
		expect(built.$render()).toBe('A:>:3');
	});

	it('throws, naming the engines, when the parsed children come from several', async () => {
		const fake = fakeLanguage('fake');
		const a = await engineOf(fake);
		const b = await engineOf(fake);
		const c = await engineOf(fake);
		const built = a.build.group(b.parse('src'), c.parse('src'));
		expect(() => a.render(built)).toThrow(/several engines \(fake#\d+, fake#\d+\)/);
		expect(() => built.$render()).toThrow(/several engines/);
	});

	it('throws when a parsing engine is disposed', async () => {
		const fake = fakeLanguage('fake');
		const a = await engineOf(fake);
		const b = await engineOf(fake);
		const built = a.build.group(b.parse('src'));
		b.dispose();
		expect(() => a.render(built)).toThrow(/engine disposed/);
	});

	it('refuses a node of another language, naming both', async () => {
		const a = await engineOf(fakeLanguage('fake'));
		const other = await engineOf(fakeLanguage('other'));
		expect(() => a.render(other.build.leaf('x'))).toThrow('cannot render a other node through a fake engine');
	});
});
