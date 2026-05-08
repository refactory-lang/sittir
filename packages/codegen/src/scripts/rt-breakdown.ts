import { validateReadRenderParse } from '../validate/read-render-parse.ts';
import { resolve } from 'node:path';

for (const g of ['rust', 'python', 'typescript']) {
	const tp = resolve(new URL('../../../..', import.meta.url).pathname, `packages/${g}/templates`);
	const r = await validateReadRenderParse(g, tp);
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
