import { checkLayouts, packLayouts } from '../native-layouts.ts';

const USAGE = 'usage: native-layouts pack <bindings> <out> | check <packs> <target> [--container <image>]';

const [command, ...args] = process.argv.slice(2);
if (command === 'pack' && args.length === 2) {
	const [bindings, out] = args as [string, string];
	const packs = packLayouts(bindings, out);
	console.log(`packed ${Object.keys(packs.packages).length} packages, ${Object.keys(packs.platforms).length} platform packages and ${Object.keys(packs.skewed).length} built from another commit into ${out}`);
} else if (command === 'check' && (args.length === 2 || (args.length === 4 && args[2] === '--container'))) {
	const [packs, target, , container] = args as [string, string, string?, string?];
	let failed = false;
	for (const { layout, gaps } of await checkLayouts(packs, target, container)) {
		failed ||= gaps.length > 0;
		console.log(`${target} ${layout}: ${gaps.length === 0 ? 'pass' : `fail\n  ${gaps.join('\n  ')}`}`);
	}
	process.exitCode = failed ? 1 : 0;
} else {
	console.error(USAGE);
	process.exitCode = 1;
}
