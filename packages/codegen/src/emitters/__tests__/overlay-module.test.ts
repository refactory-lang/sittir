import { describe, it, expect } from 'vitest';
import { localRef, memberAt, moduleRef, tableRef, usedImports, withMembers, type Ref } from '../overlays/module.ts';

describe('builder table wiring helpers', () => {
	it('keeps only the imports the body names', () => {
		const imports = ["import * as F from './raw.js';", "import { TSKindId } from '../types.js';"];
		expect(usedImports(imports, ['const x = { id: TSKindId.X };'])).toEqual(["import { TSKindId } from '../types.js';"]);
		expect(usedImports(imports, ['const x = F.buildX;'])).toEqual(["import * as F from './raw.js';"]);
	});

	it('spells a table entry, a module builder and a wiring local with their types', () => {
		expect(tableRef('buildX')).toEqual({ value: "$at('buildX')", type: "Table['buildX']" });
		expect(moduleRef('F', 'buildX')).toEqual({ value: 'F.buildX', type: 'typeof F.buildX' });
		expect(localRef('x')).toEqual({ value: 'x', type: "Routes<Table>['x']", local: 'x' });
	});

	it('returns a callable with no members as itself', () => {
		const callable = tableRef('buildX');
		expect(withMembers(callable, false, [])).toBe(callable);
	});

	it('delegates a shared callable before attaching members, and attaches to an owned one', () => {
		const members = [{ key: 'semi', ref: localRef('x$semi') }];
		const shared = withMembers(tableRef('buildX'), false, members);
		expect(shared.value).toBe("Object.freeze(Object.assign(delegate($at('buildX')), { semi: x$semi } as const))");
		expect(shared.type).toBe("Table['buildX'] & { readonly semi: Routes<Table>['x$semi'] }");
		const owned = withMembers(localRef('x$arm'), true, members);
		expect(owned.value).toBe('Object.freeze(Object.assign(x$arm, { semi: x$semi } as const))');
	});

	it('freezes members with no callable as a plain namespace', () => {
		const namespace = withMembers(undefined, false, [{ key: 'a', ref: moduleRef('F', 'buildA') }]);
		expect(namespace.value).toBe('Object.freeze({ a: F.buildA } as const)');
		expect(namespace.type).toBe('{ readonly a: typeof F.buildA }');
	});

	it('types a spread member as the spread entry itself', () => {
		const ref = withMembers(tableRef('buildX'), false, [{ spread: localRef('sub') }]);
		expect(ref.value).toBe("Object.freeze(Object.assign(delegate($at('buildX')), { ...sub } as const))");
		expect(ref.type).toBe("Table['buildX'] & Routes<Table>['sub']");
	});

	it('resolves a member path through members, locals and spreads', () => {
		const arm = localRef('host$arm');
		const sub = withMembers(undefined, false, [{ key: 'inner', ref: localRef('sub$inner') }]);
		const host = withMembers(tableRef('buildHost'), false, [
			{ key: 'arm', ref: arm },
			{ key: 'alias', ref: localRef('aliased') },
			{ key: 'spread', ref: withMembers(tableRef('buildS'), false, [{ spread: localRef('sub') }]) }
		]);
		const aliased = withMembers(tableRef('buildA'), false, [{ key: 'deep', ref: localRef('aliased$deep') }]);
		const locals = new Map<string, Ref>([
			['host', host],
			['sub', sub],
			['aliased', aliased]
		]);
		expect(memberAt(locals, host, ['arm'])).toBe(arm);
		expect(memberAt(locals, host, ['alias', 'deep'])?.type).toBe("Routes<Table>['aliased$deep']");
		expect(memberAt(locals, host, ['spread', 'inner'])?.type).toBe("Routes<Table>['sub$inner']");
		expect(memberAt(locals, host, ['missing'])).toBeUndefined();
	});
});
