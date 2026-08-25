import { ir } from '@sittir/rust';

export function renderPublicStruct() {
	return ir.structItem.unit({
		visibilityModifier: 'pub',
		name: ir.from.type('Config'),
	}).$render();
}

export function renderSourceFile() {
	return ir.sourceFile({
		statements: [
			ir.functionItem({
				visibilityModifier: 'pub',
				name: 'main',
				parameters: ir.parameters.strict(),
				body: ir.block.strict(),
			}),
		],
	}).$render();
}
