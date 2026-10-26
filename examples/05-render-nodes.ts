import rust from '@sittir/rust';

const rs = await rust.createEngine();
const rsStrict = await rust.createEngine({ api: 'strict' });

export function renderFunction() {
	return rs.build.statement.function({
		visibilityModifier: 'pub',
		name: 'render_config',
		parameters: rsStrict.build.parameters(),
		returnType: 'String',
		body: rsStrict.build.block(),
	}).$render();
}
