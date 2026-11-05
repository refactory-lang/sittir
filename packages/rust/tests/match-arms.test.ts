import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';

const rs = await createEngine(rust);
const trustingStrict = await createEngine(rust, { verifyStructure: 'compileTimeOnly', api: 'strict' });
const verifyingStrict = await createEngine(rust, { verifyStructure: 'runtime', api: 'strict' });

type Engine = typeof trustingStrict;
type Spread = (...arms: unknown[]) => { $render(): string };
const arm = (engine: Engine, name: string) =>
	engine.build.matchArm.blockEnding({ match: engine.build.matchPattern({ pattern: rs.build.identifier(name) }), body: engine.build.block({}) });
const last = (engine: Engine, name: string) =>
	engine.build.lastMatchArm({ match: engine.build.matchPattern({ pattern: rs.build.identifier(name) }), body: rs.build.identifier('z') });
const erased = (engine: Engine): Spread => engine.build.matchBlock as unknown as Spread;

describe("a match block's arms: every arm before the last of the arm kinds, the last its own", () => {
	it('builds the arms in order, and an empty block from no arms', () => {
		expect(trustingStrict.build.matchBlock(arm(trustingStrict, 'x'), last(trustingStrict, 'y')).$render()).toBe('{\n    x => {}\n    y => z\n}');
		expect(trustingStrict.build.matchBlock(last(trustingStrict, 'y')).$render()).toBe('{\n    y => z\n}');
		expect(trustingStrict.build.matchBlock().$render()).toBe('{}');
	});

	it('refuses, in the types, arms that do not end with the last arm or that hold it before the end', () => {
		// @ts-expect-error the last element is a last match arm
		const noLast = () => trustingStrict.build.matchBlock(arm(trustingStrict, 'x'));
		// @ts-expect-error a last match arm comes only last
		const lastFirst = () => trustingStrict.build.matchBlock(last(trustingStrict, 'y'), arm(trustingStrict, 'x'));
		expect(noLast).toBeDefined();
		expect(lastFirst).toBeDefined();
	});

	it('keeps the order in loose input to the match that holds them', () => {
		const looseArm = rs.build.matchArm.blockEnding({ match: rs.build.matchPattern({ pattern: 'x' }), body: rs.build.block({}) });
		const looseLast = rs.build.lastMatchArm({ match: rs.build.matchPattern({ pattern: 'y' }), body: 'z' });
		expect(rs.build.matchExpression({ subject: 'v', body: [looseArm, looseLast] }).$render()).toBe('match v {\n    x => {}\n    y => z\n}');
		expect(rs.build.matchExpression({ subject: 'v', body: [] }).$render()).toBe('match v {}');
		// @ts-expect-error a last match arm comes only last
		const lastFirst = () => rs.build.matchExpression({ subject: 'v', body: [looseLast, looseArm] });
		expect(lastFirst).toBeDefined();
	});

	it("refuses them at the call under verifyStructure: 'runtime', naming the slot", () => {
		expect(() => erased(verifyingStrict)(arm(verifyingStrict, 'x'))).toThrow(/match_block_arms\.\w+: ends with a node of kind \d+, not \d+/);
		expect(() => erased(verifyingStrict)(last(verifyingStrict, 'y'), last(verifyingStrict, 'w'))).toThrow(
			/match_block_arms\.\w+: holds a node of kind \d+ at 0, before its last element/
		);
	});

	it("leaves them unchecked under verifyStructure: 'compileTimeOnly'", () => {
		expect(() => erased(trustingStrict)(arm(trustingStrict, 'x'))).not.toThrow();
		expect(() => erased(trustingStrict)(last(trustingStrict, 'y'), last(trustingStrict, 'w'))).not.toThrow();
	});
});

describe('a portable match', () => {
	const runtimeOf = async () => portableRuntime(await createEngine(rust, { api: 'strict' }));
	const caseOf = (pattern: string, value: number) => ({
		$path: 'clause.case.match',
		pattern,
		body: { $path: 'literal.number.integer', $value: value },
		attributes: []
	});

	it('builds its last case as the last arm, with the comma its preference registers', async () => {
		const runtime = await runtimeOf();
		const built = runtime.build({ $path: 'statement.match', subject: 'x', body: [caseOf('a', 1), caseOf('b', 2)] } as never) as unknown as {
			$render(): string;
			body(): { matchBlockArms(): { arms(): readonly { $type: number }[] } | undefined };
		};
		expect(built.$render()).toBe('match x {\n    a => 1,\n    b => 2\n}');
		const arms = built.body().matchBlockArms()!.arms();
		expect(arms.map((a) => a.$type)).toEqual([rs.kinds.MatchArmWithComma, rs.kinds.LastMatchArm]);
		expect(runtime.read(built as never)).toEqual({ $path: 'statement.match', subject: 'x', body: [caseOf('a', 1), caseOf('b', 2)] });
	});

	it('reads an empty match as no cases, and builds it back', async () => {
		const runtime = await runtimeOf();
		const read = JSON.stringify(runtime.read(runtime.engine.parse('fn f() { match x {} }')));
		expect(read).toContain('{"$path":"statement.match","subject":"x","body":[]}');
		expect(String(runtime.engine.render(runtime.build({ $path: 'statement.match', subject: 'x', body: [] } as never) as never))).toBe('match x {}');
	});
});
