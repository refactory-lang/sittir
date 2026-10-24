import { expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

it('constructs absent, comma-only and populated receiver rest groups without a public group builder', () => {
	const content = rs.build.selfParameter.strict({ reference: true });
	const plain = rs.build.parametersElementsReceiver.strict({ content });
	const comma = rs.build.parametersElementsReceiver.strict({ content, parametersElementsReceiverGroup: [undefined] });
	const rest = rs.build.parametersElements.strict(rs.build.parameter.strict({ name: rs.build.identifier('x'), type: rs.kinds.U8Keyword }));
	const populated = rs.build.parametersElementsReceiver.strict({ content, parametersElementsReceiverGroup: [rest] });
	expect(rs.build.parameters.strict(plain).$render()).toBe('(&self)');
	expect(rs.build.parameters.strict(comma).$render()).toBe('(&self,)');
	expect(rs.build.parameters.strict(populated).$render()).toBe('(&self, x: u8)');
	expect(Object.keys(rs.build)).not.toContain('parametersElementsReceiverGroup');
});
