import { generatedFieldIds, type GeneratedIdTables } from '../dsl/symbol-table.ts';

export function fieldConstName(name: string): string {
	return name.toUpperCase();
}

export function emitFieldIdRust(grammar: string, tables: GeneratedIdTables): string {
	const lines = [
		`// @generated from packages/${grammar}/.sittir/src/parser.c — do not hand-edit.`,
		'',
		'use ::sittir_core::types::FieldId;',
		''
	];
	for (const { name, id } of generatedFieldIds(tables)) lines.push(`pub const ${fieldConstName(name)}: FieldId = FieldId(${id});`);
	lines.push('');
	return lines.join('\n');
}
