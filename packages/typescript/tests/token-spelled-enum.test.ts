import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

type Member = { accessibilityModifier(): unknown };

function firstMemberOf(source: string): Member {
	const declaration = ts.parse(source).statements()[0] as unknown as {
		body(): { contents(): readonly { member(): Member }[] };
	};
	return declaration.body().contents()[0]!.member();
}

describe('an enum node spelled only by its keyword token', () => {
	it('stores the keyword the token spells', () => {
		expect(firstMemberOf('class A { public a: string; }\n').accessibilityModifier()).toBe(ts.kinds.PublicKeyword);
	});
});
