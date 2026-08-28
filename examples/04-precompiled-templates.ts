import { ir } from '@sittir/rust';

export function renderPublicStruct() {
	return ir.statement.struct.unit({
		visibilityModifier: 'pub',
		name: ir.synonym.type('Config'),
	}).$render();
}

export function renderSourceFile() {
	return ir.sourceFile({
		statements: [
			ir.statement.function({
				visibilityModifier: 'pub',
				name: 'main',
				parameters: ir.parameters.strict(),
				body: ir.block.strict(),
			}),
		],
	}).$render();
}
