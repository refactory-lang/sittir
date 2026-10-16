import rust from '@sittir/rust';

const rs = await rust.createEngine();

export function renderFunction() {
	return rs.build.statement.function({
		visibilityModifier: 'pub',
		name: 'render_config',
		parameters: rs.build.parameters.strict(),
		returnType: 'String',
		body: rs.build.block.strict(),
	}).$render();
}
