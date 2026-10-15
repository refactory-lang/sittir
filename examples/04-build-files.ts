import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);

export function renderPublicStruct() {
	return engine.build.statement.struct.unit({
		visibilityModifier: 'pub',
		name: engine.build.synonym.type('Config'),
	}).$render();
}

export function renderSourceFile() {
	return engine.build.sourceFile({
		statements: [
			engine.build.statement.function({
				visibilityModifier: 'pub',
				name: 'main',
				parameters: engine.build.parameters.strict(),
				body: engine.build.block.strict(),
			}),
		],
	}).$render();
}
