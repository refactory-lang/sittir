import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';

// A kind with one required forwarding slot (body: Block) beside optional
// sibling slots (moveMarker) takes no argument on either surface.
// Construction only: $render() needs the native binding.
describe('optional sibling + one required forwarding slot', () => {
	it('constructs empty on the strict surface without throwing', () => {
		expect(ir.asyncBlock.strict().body().$type).toBeDefined();
		expect(ir.genBlock.strict().body().$type).toBeDefined();
		expect(ir.loopExpression.strict().body().$type).toBeDefined();
		expect(ir.scopedUseList.strict().$type).toBeDefined();
	});
	it('constructs empty on the loose surface without throwing', () => {
		expect(ir.asyncBlock().body().$type).toBeDefined();
		expect(ir.genBlock().body().$type).toBeDefined();
		expect(ir.loopExpression().body().$type).toBeDefined();
		expect(ir.scopedUseList().$type).toBeDefined();
	});
});
