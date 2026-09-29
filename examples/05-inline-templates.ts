import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);

export function renderDirectlyWithoutInlineTemplates() {
	return engine.build.statement.function({
		visibilityModifier: 'pub',
		name: 'render_config',
		parameters: engine.build.parameters.strict(),
		returnType: engine.build.synonym.type('String'),
		body: engine.build.block.strict(),
	}).$render();
}
