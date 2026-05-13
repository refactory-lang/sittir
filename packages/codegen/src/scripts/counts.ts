/**
 * Compatibility shim — delegate the historical codegen counts path to the
 * canonical validator CLI counts implementation.
 */
import { pathToFileURL } from 'node:url';

export async function run(argv: string[]): Promise<number> {
	const { runCountsCli } = await import(new URL('../../../validator/src/cli.ts', import.meta.url).href);
	await runCountsCli(argv, 'native');
	return 0;
}

const isCli = (() => {
	if (process.argv[1] == null) return false;
	try {
		return pathToFileURL(process.argv[1]).href === import.meta.url;
	} catch {
		return false;
	}
})();

if (isCli) {
	await run(process.argv.slice(2));
}
