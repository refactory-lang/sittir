import { bootstrap } from '../src/bootstrap/bootstrap.ts';
import { EMITTER_TSCONFIG, explainFiles, pinnedTypeEscapes } from '../src/bootstrap/pinned-types.ts';
import { REPO_ROOT } from '../src/grammars.ts';

const pinned = bootstrap(REPO_ROOT);
const escapes = pinnedTypeEscapes(explainFiles(EMITTER_TSCONFIG, REPO_ROOT), { cwd: REPO_ROOT, checkout: REPO_ROOT, pinned });
for (const { file, reason } of escapes) {
	console.error(`pinned-types-escape: ${file} is in the emitter's program (${reason}); the emitter is typed by the pinned build at ${pinned}`);
}
if (escapes.length > 0) process.exit(1);
