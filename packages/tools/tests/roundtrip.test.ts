import { afterEach, describe, expect, it, vi } from 'vitest';
import * as common from '../src/validate/common.ts';
import { buildFactoryNode, loadFactoryArtifacts, run } from '../src/exercise/roundtrip.ts';

describe('exercise roundtrip helpers', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('loads factorySlots from factory-map metadata', async () => {
		const artifacts = await loadFactoryArtifacts('rust');

		expect(artifacts.factorySlots.await_expression).toBeDefined();
		// rust's await_expression carries its operand in a named `expression`
		// field, not an unnamed `children` slot — current codegen assigns
		// semantic field names where the grammar makes one available.
		expect(artifacts.factorySlots.await_expression?.expression).toMatchObject({
			unnamed: false,
			required: true,
			multiple: false
		});
	});

	it('uses real metadata-driven child args for direct child-backed factories', () => {
		const leaf = { $type: 'identifier', $named: true, $text: 'x' };
		const artifacts = {
			factoryMap: {
				direct_child: (value: unknown) => ({ $type: 'rebuilt_direct', value })
			},
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
			{ $type: 'direct_child', $other: [leaf] },
			{},
			artifacts,
			common,
			undefined
		);

		expect(result).toEqual({ $type: 'rebuilt_direct', value: leaf });
	});

	it('uses real metadata-driven child args for spread child-backed factories', () => {
		const left = { $type: 'identifier', $named: true, $text: 'x' };
		const right = { $type: 'number_literal', $named: true, $text: '1' };
		const artifacts = {
			factoryMap: {
				spread_child: (...args: unknown[]) => ({ $type: 'rebuilt_spread', args })
			},
			factoryShapes: { spread_child: 'spread' as const },
			fieldAliasMap: {},
			factoryFields: {},
			factorySlots: {
				spread_child: {
					children: {
						unnamed: true,
						slotCount: 1,
						required: true,
						multiple: true,
						nonEmpty: true
					}
				}
			},
			polymorphVariants: {}
		};

		const result = buildFactoryNode(
			'spread_child',
			{ $type: 'spread_child', $other: [left, right] },
			{},
			artifacts,
			common,
			undefined
		);

		expect(result).toEqual({ $type: 'rebuilt_spread', args: [left, right] });
	});

	it('runs the real roundtrip path with metadata-driven child reconstruction', async () => {
		const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
		const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

		await expect(run({ grammar: 'rust', kinds: ['await_expression'] })).resolves.toBe(0);

		expect(stdout).toHaveBeenCalled();
		expect(stderr).not.toHaveBeenCalled();
	});
});
