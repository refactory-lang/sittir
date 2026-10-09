import { describe, expect, it } from 'vitest';
import { nodeToConfig } from '../validate/common.ts';
import { validateFactoryStorage } from '../validate/factory-storage.ts';

function makeFactorySlots(
	kind: string,
	slots: Record<
		string,
		{
			unnamed: boolean;
			slotCount: number;
			required: boolean;
			multiple: boolean;
			nonEmpty: boolean;
		}
	>
) {
	return { [kind]: slots };
}

describe('nodeToConfig field promotion', () => {
	it('uses named slot metadata instead of payload shape for singular and repeated config slots', () => {
		const leaf = { $type: 'identifier', $source: 0, $named: true, $text: 'x' };

		const singularConfig = nodeToConfig(
			{
				$type: 'single_field_parent',
				$source: 0,
				$named: true,
				_value: [leaf]
			} as never,
			{
				factorySlots: makeFactorySlots('single_field_parent', {
					value: {
						unnamed: false,
						slotCount: 1,
						required: true,
						multiple: false,
						nonEmpty: false
					}
				})
			}
		);

		const repeatedConfig = nodeToConfig(
			{
				$type: 'repeat_field_parent',
				$source: 0,
				$named: true,
				_items: leaf
			} as never,
			{
				factorySlots: makeFactorySlots('repeat_field_parent', {
					items: {
						unnamed: false,
						slotCount: 1,
						required: true,
						multiple: true,
						nonEmpty: true
					}
				})
			}
		);

		expect(singularConfig.value).toEqual(leaf);
		expect(repeatedConfig.items).toEqual([leaf]);
	});

	it('keeps python argument_list factory reconstruction from re-emitting double-wrapped unnamed children', async () => {
		const result = await validateFactoryStorage('python', 'native');
		const regression = result.errors.find(
			(error) =>
				error.kind === 'argument_list' &&
				error.entry === 'Matching specific values' &&
				error.message === 're-parse error: "((,\\"Goodbye!\\",))"'
		);

		expect(regression).toBeUndefined();
	}, 60000);
});
