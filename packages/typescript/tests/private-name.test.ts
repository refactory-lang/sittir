import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import typescript from '../src/index.ts';

const runtime = await portableRuntime(await createEngine(typescript, { api: 'strict' }));
const carriesOf = (source: string): string[] => {
	const carries: string[] = [];
	runtime.read(runtime.engine.parse(source, { errors: 'throw' }), (node) => carries.push(String(runtime.engine.trivia.kindName(node.$type))));
	return carries;
};
const roundTrip = (source: string): string => String(runtime.engine.render(runtime.build(runtime.read(runtime.engine.parse(source, { errors: 'throw' })) as never) as never));

describe('a private name reads as its content, and its flag writes the #', () => {
	it('reads this.#bar as a member whose property is bar, flagged privateName', () => {
		expect(JSON.stringify(runtime.read(runtime.engine.parse('this.#bar;\n', { errors: 'throw' })))).toContain('{"$path":"expression.member","$flags":["privateName"],"object":"this","property":"bar"}');
	});

	it.each(['this.#bar = 1;\n', 'class A {\n  #x = 1;\n  #m() {}\n  get #g() {\n    return 1;\n  }\n}\n'])('reads %j with nothing carried, and builds it back as written', (source) => {
		expect(carriesOf(source)).toEqual([]);
		expect(roundTrip(source)).toBe(source);
	});
});
