import { resolve } from 'node:path';
import { assertGrammar, stableGrammars } from '@sittir/codegen/grammars';
import { assembleNativePackages, declareNativePackages, grammarNapiPackage, publishNativePackages } from '../native-pack.ts';

const USAGE = 'usage: native-packages.ts assemble <artifacts dir> [grammar...] | publish [--dry-run] [grammar...]';

const [command, ...rest] = process.argv.slice(2);
const dryRun = rest.includes('--dry-run');
const named = rest.filter((arg) => arg !== '--dry-run');
const grammarsOf = (names: readonly string[]) => (names.length === 0 ? stableGrammars() : names.map(assertGrammar));

if (command === 'assemble') {
	const [artifacts, ...names] = named;
	if (artifacts === undefined) throw new Error(USAGE);
	for (const grammar of grammarsOf(names)) {
		const pkg = grammarNapiPackage(grammar);
		for (const dir of assembleNativePackages(pkg, resolve(artifacts))) console.log(`${grammar}: ${dir}`);
		declareNativePackages(pkg);
	}
} else if (command === 'publish') {
	for (const grammar of grammarsOf(named)) publishNativePackages(grammarNapiPackage(grammar), dryRun);
} else {
	throw new Error(USAGE);
}
