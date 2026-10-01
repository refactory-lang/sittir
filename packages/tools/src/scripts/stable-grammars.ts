import { stableGrammars } from '@sittir/codegen/grammars';

const grammars = stableGrammars();
if (grammars.length === 0) {
	console.error('no stable grammars resolved');
	process.exit(1);
}
console.log(grammars.join(' '));
