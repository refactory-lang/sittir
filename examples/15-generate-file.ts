import { writeFileSync } from 'node:fs';
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);

export function generateCacheModule() {
	const file = engine.build.sourceFile({
		statements: [
			engine.build.statement.struct.unit({
				visibilityModifier: 'pub',
				name: engine.build.synonym.type('Cache'),
			}),
			engine.build.statement.function({
				visibilityModifier: 'pub',
				name: 'new_cache',
				parameters: engine.build.parameters.strict(),
				body: engine.build.block.strict(),
			}),
		],
	});

	return file.$render();
}

export function saveCacheModule(path: string) {
	writeFileSync(path, generateCacheModule(), 'utf8');
	return path;
}
