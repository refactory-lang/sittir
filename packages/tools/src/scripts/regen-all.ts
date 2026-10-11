import { REPO_ROOT, stableGrammars } from '@sittir/codegen/grammars';
import { regenerateGrammars } from '../regen.ts';

const status = regenerateGrammars(stableGrammars(), REPO_ROOT);
if (status !== 0) process.exit(status);
