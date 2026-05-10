import { ir } from '@sittir/rust';

export function renderDirectlyWithoutInlineTemplates() {
	return ir.functionItem.from({
		visibilityModifier: 'pub',
		name: 'render_config',
		parameters: ir.parameters.strict(),
		returnType: ir.from.type('String'),
		body: ir.block.strict(),
	}).$render();
}
