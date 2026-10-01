import { allGrammars, stableGrammars } from '@sittir/codegen/grammars';

const GRAMMAR_SETS = { all: allGrammars, stable: stableGrammars };

const set = process.argv[2] ?? 'stable';
if (set !== 'all' && set !== 'stable') {
	console.error(`usage: list-grammars [${Object.keys(GRAMMAR_SETS).join('|')}]`);
	process.exit(1);
}
const grammars = GRAMMAR_SETS[set]();
if (grammars.length === 0) {
	console.error(`no ${set} grammars resolved`);
	process.exit(1);
}
console.log(grammars.join(' '));
