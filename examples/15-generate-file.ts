import { writeFileSync } from 'node:fs';
import rust from '@sittir/rust';

const rs = await rust.createEngine();
const rsStrict = await rust.createEngine({ api: 'strict' });

export function generateCacheModule() {
	const file = rs.build.sourceFile({
		statements: [
			rs.build.statement.struct.unit({
				visibilityModifier: 'pub',
				name: 'Cache',
			}),
			rs.build.statement.function({
				visibilityModifier: 'pub',
				name: 'new_cache',
				parameters: rsStrict.build.parameters(),
				body: rsStrict.build.block(),
			}),
		],
	});

	return file.$render();
}

export function saveCacheModule(path: string) {
	writeFileSync(path, generateCacheModule(), 'utf8');
	return path;
}
