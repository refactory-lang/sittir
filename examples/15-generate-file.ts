import { writeFileSync } from 'node:fs';
import { ir } from '@sittir/rust';

export function generateCacheModule() {
	const file = ir.sourceFile({
		statements: [
			ir.statement.struct.unit({
				visibilityModifier: 'pub',
				name: ir.synonym.type('Cache'),
			}),
			ir.statement.function({
				visibilityModifier: 'pub',
				name: 'new_cache',
				parameters: ir.parameters.strict(),
				body: ir.block.strict(),
			}),
		],
	});

	return file.$render();
}

export function saveCacheModule(path: string) {
	writeFileSync(path, generateCacheModule(), 'utf8');
	return path;
}
