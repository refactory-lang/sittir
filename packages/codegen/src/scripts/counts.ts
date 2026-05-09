/**
 * Compatibility shim — delegates to the canonical validator CLI.
 *
 * Canonical entry point:
 *   npx tsx packages/validator/src/cli.ts counts [grammar...]
 */
import { runCountsCli } from '../../../validator/src/cli.ts';
await runCountsCli(process.argv.slice(2));

