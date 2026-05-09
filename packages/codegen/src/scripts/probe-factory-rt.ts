/**
 * Compatibility shim — delegates to the canonical validator CLI.
 *
 * Canonical entry point:
 *   npx tsx packages/validator/src/cli.ts probe-factory [grammar...]
 */
import { runProbeFactoryCli } from '../../../validator/src/cli.ts';
await runProbeFactoryCli(process.argv.slice(2));
