import { assertGeneratedManifestsClean } from './generated-manifest.ts';

try {
	assertGeneratedManifestsClean();
	process.exit(0);
} catch (e) {
	console.error((e as Error).message);
	process.exit(1);
}
