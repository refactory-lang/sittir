import { expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const rsStrict = await createEngine(rust, { api: 'strict' });

it('constructs absent, comma-only and populated receiver rest groups without a public group builder', () => {
	const content = rsStrict.build.selfParameter({ reference: true });
	const plain = rsStrict.build.parametersElementsReceiver({ content });
	const comma = rsStrict.build.parametersElementsReceiver({ content, parametersElementsReceiverGroup: [undefined] });
	const rest = rsStrict.build.parametersElements(rsStrict.build.parameter({ name: rsStrict.build.identifier('x'), type: rs.kinds.U8Keyword }));
	const populated = rsStrict.build.parametersElementsReceiver({ content, parametersElementsReceiverGroup: [rest] });
	expect(rsStrict.build.parameters(plain).$render()).toBe('(&self)');
	expect(rsStrict.build.parameters(comma).$render()).toBe('(&self,)');
	expect(rsStrict.build.parameters(populated).$render()).toBe('(&self, x: u8)');
	expect(Object.keys(rs.build)).not.toContain('parametersElementsReceiverGroup');
});
