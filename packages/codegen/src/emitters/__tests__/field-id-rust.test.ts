import { describe, expect, it } from 'vitest';
import { emitFieldIdRust, fieldConstName } from '../field-id-rust.ts';

describe('emitFieldIdRust', () => {
	it('emits one FieldId constant per parser field, in id order', () => {
		const tables = {
			sourceArtifact: 'parser.c',
			fieldIds: new Map([
				['return_type', { id: 3 }],
				['name', { id: 1 }],
				['body', { id: 2 }]
			])
		};
		expect(emitFieldIdRust('rust', tables)).toBe(
			[
				'// @generated from packages/rust/.sittir/src/parser.c — do not hand-edit.',
				'',
				'use ::sittir_core::types::FieldId;',
				'',
				'pub const NAME: FieldId = FieldId(1);',
				'pub const BODY: FieldId = FieldId(2);',
				'pub const RETURN_TYPE: FieldId = FieldId(3);',
				''
			].join('\n')
		);
	});

	it('names a field constant by the field name in upper case', () => {
		expect(fieldConstName('type_parameters')).toBe('TYPE_PARAMETERS');
	});
});
