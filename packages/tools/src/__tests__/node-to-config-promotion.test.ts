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

const KINDS = ['identifier', 'single_field_parent', 'repeat_field_parent'];
const id = (kind: string): number => KINDS.indexOf(kind) + 1;
const kindNameFromId = (kindId: number): string | undefined => KINDS[kindId - 1];

describe('nodeToConfig field promotion', () => {
	it('uses named slot metadata instead of payload shape for singular and repeated config slots', () => {
		const leaf = { $type: id('identifier'), $named: true, $text: 'x' };

		const singularConfig = nodeToConfig(
			{
				$type: id('single_field_parent'),
				
				$named: true,
				_value: [leaf]
			} as never,
			{
				kindNameFromId,
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
				$type: id('repeat_field_parent'),
				
				$named: true,
				_items: leaf
			} as never,
			{
				kindNameFromId,
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
