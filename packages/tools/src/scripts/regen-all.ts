import { REPO_ROOT, stableGrammars } from '@sittir/codegen/grammars';
import { regenerateGrammars } from '../regen.ts';

const force = process.argv.includes('--force') || process.env.SITTIR_REGEN_FORCE === '1';
const verbose = process.argv.includes('--verbose') || process.env.SITTIR_REGEN_VERBOSE === '1';
const status = await regenerateGrammars(stableGrammars(), REPO_ROOT, { force, verbose });
if (status !== 0) process.exit(status);
