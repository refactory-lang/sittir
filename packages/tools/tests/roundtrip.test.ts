import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildFactoryNode, loadFactoryArtifacts } from '../src/exercise/roundtrip.ts';

describe('exercise roundtrip helpers', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('loads factorySlots from factory-map metadata', async () => {
		const artifacts = await loadFactoryArtifacts('rust');

		expect(artifacts.factorySlots.await_expression).toBeDefined();
		expect(artifacts.factorySlots.await_expression?.children).toMatchObject({
			unnamed: true,
			required: true,
			multiple: false
		});
	});

	it('passes factorySlots into nodeToConfig and uses normalized child args for direct factories', () => {
		const leaf = { $type: 'identifier', $named: true, $text: 'x' };
		const factory = vi.fn((value: unknown) => ({ $type: 'rebuilt', value }));
		const nodeToConfig = vi.fn(() => ({ children: leaf }));
		const getChildFactoryArgs = vi.fn(() => [leaf]);
		const common = {
			loadLanguageForGrammar: async () => {
				throw new Error('unused');
			},
			loadCorpusEntries: () => [],
			loadKindIdFromName: async () => undefined,
			loadKindNameFromId: async () => undefined,
			loadKindNames: async () => undefined,
			buildReadHandle: () => ({}),
			findNativeNodeId: () => null,
			adaptNode: () => ({}),
			findFirst: () => null,
			readNodeAt: () => ({ $type: 'direct_child' }),
			nodeToConfig,
			getChildFactoryArgs
		};
		const artifacts = {
			factoryMap: { direct_child: factory },
			factoryShapes: { direct_child: 'direct' as const },
			fieldAliasMap: {},
			factoryFields: {},
			factorySlots: {
				direct_child: {
					children: {
						unnamed: true,
						slotCount: 1,
						required: true,
						multiple: false,
						nonEmpty: false
					}
				}
			},
			polymorphVariants: {}
		};

		const result = buildFactoryNode(
			'direct_child',
			{ $type: 'direct_child' },
			{},
			artifacts,
			common,
			undefined
		);

		expect(nodeToConfig).toHaveBeenCalledWith(
			{ $type: 'direct_child' },
			expect.objectContaining({ factorySlots: artifacts.factorySlots })
		);
		expect(getChildFactoryArgs).toHaveBeenCalledWith('direct_child', { children: leaf }, artifacts.factorySlots);
		expect(factory).toHaveBeenCalledWith(leaf);
		expect(result).toEqual({ $type: 'rebuilt', value: leaf });
	});
});
