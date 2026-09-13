// Two forms whose flat name is also claimed by a deeper flattening: the
// claimant nearest the parent wins, so the direct member-expression arm is
// reachable under `restPattern` and the `from` arm under `default`.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

describe('the nearest claimant of a flat name', () => {
	it('mounts a rest pattern over a member expression on a tuple parameter', () => {
		const node = ir.tupleParameter.restPattern.memberExpression({
			name: [{ object: ir.identifier('a'), separator: '.', property: 'b' }],
			type: ir.typeAnnotation(ir.identifier('T'))
		});
		expect(node.$type).toBe(TSKindId.TupleParameter);
		expect(node.$render().toString()).toBe('...a.b: T');
	});

	it("mounts the default export's from form on the export statement", () => {
		expect(typeof ir.exportStatement.default.from).toBe('function');
	});
});
