import { expect, it, vi } from 'vitest';
import { _fromMap } from '../../python/src/factories/coerce.ts';
import { TSKindId } from '../../python/src/types.ts';
import { validateFrom } from '../src/validate/from.ts';
import { validateTemplateCoverage } from '../src/validate/template-coverage.ts';

it('keeps both physical Python lambda factories in the from validation universe', async () => {
	const ordinary = vi.spyOn(_fromMap, 'lambda');
	const restricted = vi.spyOn(_fromMap, 'lambda_within_for_in_clause');
	const result = await validateFrom('python');
	expect(ordinary).toHaveBeenCalledWith(expect.objectContaining({ $type: TSKindId.Lambda }));
	expect(restricted).toHaveBeenCalledWith(expect.objectContaining({ $type: TSKindId.LambdaWithinForInClause }));
	ordinary.mockRestore();
	restricted.mockRestore();
	expect(result.errors).toEqual([]);
	expect(result.total).toBe(180);
	expect(result.pass).toBe(180);
	expect(result.excluded.filter((entry) => entry.kind === 'lambda_expression')).toEqual([]);
}, 120000);

it('checks both physical Python lambda templates behind their shared display', () => {
	const result = validateTemplateCoverage('python');
	expect(result.issues).toEqual([]);
	expect(result.total).toBe(149);
	expect(result.pass).toBe(149);
	expect(result.excluded.filter((entry) => entry.entry === 'lambda_expression')).toEqual([]);
});
