import { describe, expect, it } from 'vitest';
import { nodeToConfig } from '../validate/common.ts';

describe('nodeToConfig field promotion', () => {
	it('promotes lexical_declaration children into declarators and semicolon', () => {
		const config = nodeToConfig(
			{
				$type: 'lexical_declaration',
				_kind: { $type: 'const', $named: false, $text: 'const' },
				'_;': { $type: ';', $named: false, $text: ';' },
				$children: [
					{
						$type: 'variable_declarator',
						$named: true,
						$text: 'bar = "baz"'
					}
				]
			} as never,
			{
				factoryFields: {
					lexical_declaration: ['kind', 'declarators', 'semicolon']
				}
			}
		);

		expect(config).toMatchObject({
			kind: { $text: 'const' },
			declarators: [{ $type: 'variable_declarator' }],
			semicolon: { $text: ';' }
		});
		expect(config).not.toHaveProperty('children');
	});

	it('promotes object_type delimiters and members without treating separators as closing', () => {
		const config = nodeToConfig(
			{
				$type: 'object_type',
				'_{': { $type: '{', $named: false, $text: '{' },
				'_;': { $type: ';', $named: false, $text: ';' },
				'_}': { $type: '}', $named: false, $text: '}' },
				$children: [
					{
						$type: 'property_signature',
						$named: true,
						$text: 'foo: string'
					}
				]
			} as never,
			{
				factoryFields: {
					object_type: ['opening', 'members', 'closing']
				}
			}
		);

		expect(config).toMatchObject({
			opening: { $text: '{' },
			members: [{ $type: 'property_signature' }],
			closing: { $text: '}' }
		});
		expect(config).not.toHaveProperty('children');
	});
});
