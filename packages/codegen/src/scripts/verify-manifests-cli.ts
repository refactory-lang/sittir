/**
 * Standalone manifest-verification CLI — used by the git pre-commit hook.
 * Exits non-zero (with the formatted MODIFIED/MISSING/SOURCE-CHANGED report) when
 * any grammar's generated artifacts no longer match its committed manifest, so an
 * inconsistent generated state (e.g. a staged manifest without its regenerated
 * test-fixtures.json) can't be committed. Fast: hash comparison only, no cargo.
 */
import { assertGeneratedManifestsClean } from './generated-manifest.ts';

try {
	assertGeneratedManifestsClean();
	process.exit(0);
} catch (e) {
	console.error((e as Error).message);
	process.exit(1);
}
