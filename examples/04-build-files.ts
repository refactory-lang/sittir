import rust from '@sittir/rust';

const rs = await rust.createEngine();
const rsStrict = await rust.createEngine({ api: 'strict' });

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
				parameters: rsStrict.build.parameters(),
				body: rsStrict.build.block(),
			}),
		],
	}).$render();
}
