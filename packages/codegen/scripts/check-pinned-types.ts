import { bootstrap } from '../src/bootstrap/bootstrap.ts';
import { explainEmitterFiles, pinnedTypeEscapes } from '../src/bootstrap/pinned-types.ts';
import { REPO_ROOT } from '../src/grammars.ts';

const pinned = bootstrap(REPO_ROOT);
const escapes = pinnedTypeEscapes(explainEmitterFiles(REPO_ROOT), REPO_ROOT, pinned);
for (const { specifier, importer, resolved } of escapes) {
	console.error(`pinned-types-escape: '${specifier}' from ${importer} resolves to ${resolved}, outside the pinned build at ${pinned}`);
}
if (escapes.length > 0) process.exit(1);
