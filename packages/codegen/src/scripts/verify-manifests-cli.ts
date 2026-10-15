import { assertGeneratedManifestsClean, stagedInputPathspecs } from './generated-manifest.ts';
import { withIndexSnapshot } from './index-snapshot.ts';
import { REPO_ROOT, stableGrammars } from '../grammars.ts';

try {
	if (process.argv.includes('--staged')) {
		await withIndexSnapshot(REPO_ROOT, stagedInputPathspecs(), ({ root, visible }) =>
			assertGeneratedManifestsClean(stableGrammars(), { root, visible, checkout: REPO_ROOT })
		);
	} else {
		assertGeneratedManifestsClean();
	}
	process.exit(0);
} catch (e) {
	console.error((e as Error).message);
	process.exit(1);
}
