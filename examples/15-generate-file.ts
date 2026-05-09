import { writeFileSync } from 'node:fs';
import { ir } from '@sittir/rust';

export function generateCacheModule() {
	const file = ir.sourceFile.from({
		statements: [
			ir.structItem.unit.from({
				visibilityModifier: 'pub',
				name: ir.from.type('Cache'),
			}),
			ir.functionItem.from({
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
