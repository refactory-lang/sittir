import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';

const engine = await rust.createEngine();
const is = engine.is as unknown as Record<string, any>;
const build = engine.build as unknown as Record<string, any>;

const visibilityOf = (source: string) => {
	const item = engine.parse(source).statements()[0] as unknown as { visibilityModifier(): unknown };
	return item.visibilityModifier();
};

describe('visibility modifier seat chain', () => {
	it('answers the scoped path guard on pub(in a::b)', () => {
		expect(is.visibilityModifier.pub.scope.inPath(visibilityOf('pub(in a::b) fn f() {}'))).toBe(true);
	});

	it('answers the crate scope and refuses the path guard on pub(crate)', () => {
		const vm = visibilityOf('pub(crate) fn f() {}');
		expect(is.visibilityModifier.pub.scope.inPath(vm)).toBe(false);
		expect(is.visibilityModifier.pub.scope.crate(vm)).toBe(true);
	});

	it('answers pub with no scope on a plain pub', () => {
		const vm = visibilityOf('pub fn f() {}');
		expect(is.visibilityModifier.pub(vm)).toBe(true);
		expect(is.visibilityModifier.pub.scope(vm)).toBe(false);
	});

	it('answers the scope guard on a built node by its own scope', () => {
		const built = build.visibilityModifier.pub.scope.crate();
		expect(is.visibilityModifier.pub.scope.crate(built)).toBe(true);
		expect(is.visibilityModifier.pub.scope.self(built)).toBe(false);
	});

	it('refuses a bare kind id', () => {
		expect(is.visibilityModifier.pub(rust.kinds.VisibilityModifier)).toBe(false);
	});
});
