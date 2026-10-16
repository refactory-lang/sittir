import rust from '@sittir/rust';

const rs = await rust.createEngine();

export function renderPublicStruct() {
	return rs.build.statement.struct.unit({
		visibilityModifier: 'pub',
		name: 'Config',
	}).$render();
}

export function renderSourceFile() {
	return rs.build.sourceFile({
		statements: [
			rs.build.statement.function({
				visibilityModifier: 'pub',
				name: 'main',
				parameters: rs.build.parameters.strict(),
				body: rs.build.block.strict(),
			}),
		],
	}).$render();
}
