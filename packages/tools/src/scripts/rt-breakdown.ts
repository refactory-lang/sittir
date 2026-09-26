import { stableGrammars } from '@sittir/codegen/grammars';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';

for (const g of stableGrammars()) {
	const r = await validateReadRenderParse(g, { backend: 'native' });
	console.log(
		g,
		'pass=',
		r.pass,
		'fail=',
		r.fail,
		'skip=',
		r.skip,
		'total=',
		r.total,
		'astMatch=',
		r.astMatchPass,
		'errors=',
		r.errors.length,
		'astMismatches=',
		r.astMismatches.length
	);
}
