import { REPO_ROOT, stableGrammars } from '@sittir/codegen/grammars';
import { regenerateGrammars } from '../regen.ts';

try {
	regenerateGrammars(stableGrammars(), REPO_ROOT);
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}
