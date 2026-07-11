import { defineConfig } from 'oxfmt';
import { OXFMT_CONFIG } from './packages/codegen/src/oxfmt-config.ts';

// Single source of truth lives in packages/codegen/src/oxfmt-config.ts —
// codegen's writeFile() needs the same settings for in-pipeline formatting
// of generated .ts output, and that package can't reach a repo-root-relative
// import once only its dist ships. This file derives from that module
// instead of duplicating the settings.
export default defineConfig(OXFMT_CONFIG);
