import { afterEach, describe, expect, it, vi } from 'vitest';
import * as common from '../src/validate/common.ts';
import { buildFactoryNode, loadFactoryArtifacts, run } from '../src/exercise/roundtrip.ts';

const KINDS = ['identifier', 'number_literal', 'direct_child', 'spread_child', 'rebuilt_direct', 'rebuilt_spread'];
const id = (kind: string): number => KINDS.indexOf(kind) + 1;
const kindNameFromId = (kindId: number): string | undefined => KINDS[kindId - 1];
const noSlots: common.SlotAccessorOf = (typeId) => ({ kind: String(typeId), accessors: {}, delimiter: false });

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
			required: true,
			multiple: false
		});
	});

	it('uses real metadata-driven child args for direct child-backed factories', () => {
		const leaf = { $type: id('identifier'), $named: true, $text: 'x' };
		const artifacts = {
			factoryMap: {
				direct_child: (value: unknown) => ({ $type: id('rebuilt_direct'), value })
			},
			factoryShapes: { direct_child: 'direct' as const },
			fieldAliasMap: {},
			factoryFields: {},
			factorySlots: {
				direct_child: {
					children: {
						propertyName: 'children',
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
			{ $type: id('direct_child'), _children: leaf } as never,
			artifacts,
			common,
			noSlots,
			kindNameFromId
		);

		expect(result).toEqual({ $type: id('rebuilt_direct'), value: leaf });
	});

	it('uses real metadata-driven child args for spread child-backed factories', () => {
		const left = { $type: id('identifier'), $named: true, $text: 'x' };
		const right = { $type: id('number_literal'), $named: true, $text: '1' };
		const artifacts = {
			factoryMap: {
				spread_child: (...args: unknown[]) => ({ $type: id('rebuilt_spread'), args })
			},
			factoryShapes: { spread_child: 'spread' as const },
			fieldAliasMap: {},
			factoryFields: {},
			factorySlots: {
				spread_child: {
					children: {
						propertyName: 'children',
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
			{ $type: id('spread_child'), _children: [left, right] } as never,
			artifacts,
			common,
			noSlots,
			kindNameFromId
		);

		expect(result).toEqual({ $type: id('rebuilt_spread'), args: [left, right] });
	});

	it('runs the real roundtrip path with metadata-driven child reconstruction', async () => {
		const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
		const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

		await expect(run({ grammar: 'rust', kinds: ['await_expression'] })).resolves.toBe(0);

		expect(stdout).toHaveBeenCalled();
		expect(stderr).not.toHaveBeenCalled();
	});

	it.each([
		['rust', 2],
		['python', 10],
		['typescript', 2]
	])('rebuilds every built-in %s case from an engine parse', async (grammar, cases) => {
		const lines: string[] = [];
		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
			lines.push(String(chunk));
			return true;
		});

		await expect(run({ grammar, kinds: [] })).resolves.toBe(0);

		expect(lines.join('')).toMatch(new RegExp(`\\n${cases} pass, 0 fail, 0 skip\\n$`));
	});
});
