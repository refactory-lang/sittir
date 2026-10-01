import { allGrammars } from '@sittir/codegen/grammars';

const grammars = allGrammars();
if (grammars.length === 0) {
	console.error('no grammars resolved');
	process.exit(1);
}
console.log(grammars.join(' '));
