import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

// A kind with one required forwarding slot (body: Block) beside optional
// sibling slots (moveMarker) takes no argument on either surface.
// Construction only: $render() needs the native binding.
describe('optional sibling + one required forwarding slot', () => {
	it('constructs empty on the strict surface without throwing', () => {
		expect(rs.build.asyncBlock.strict().body().$type).toBeDefined();
		expect(rs.build.genBlock.strict().body().$type).toBeDefined();
		expect(rs.build.loopExpression.strict().body().$type).toBeDefined();
		expect(rs.build.scopedUseList.strict().$type).toBeDefined();
	});
	it('constructs empty on the loose surface without throwing', () => {
		expect(rs.build.asyncBlock().body().$type).toBeDefined();
		expect(rs.build.genBlock().body().$type).toBeDefined();
		expect(rs.build.loopExpression().body().$type).toBeDefined();
		expect(rs.build.scopedUseList().$type).toBeDefined();
	});
});
