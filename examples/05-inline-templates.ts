import { ir } from '@sittir/rust';

export function renderDirectlyWithoutInlineTemplates() {
	return ir.statement.function({
		visibilityModifier: 'pub',
		name: 'render_config',
		parameters: ir.parameters.strict(),
		returnType: ir.synonym.type('String'),
		body: ir.block.strict(),
	}).$render();
}
