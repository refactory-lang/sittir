import { assertGeneratedManifestsClean } from './generated-manifest.ts';
import { withIndexSnapshot } from './index-snapshot.ts';
import { allGrammars, REPO_ROOT, stableGrammars, nativeCrateRelDir } from '../grammars.ts';

try {
	if (process.argv.includes('--staged')) {
		const pathspecs = [
			'packages/codegen/src',
			...allGrammars().flatMap((g) => [`packages/${g}`, nativeCrateRelDir(g)])
		];
		await withIndexSnapshot(REPO_ROOT, pathspecs, ({ root, visible }) =>
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
