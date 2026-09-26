import { describe, expect, it } from 'vitest';
import { wire, makeSimpleDollarProxy } from '../wire/wire.ts';
import { ENRICH_VISIBLE_GROUP_SOURCES_KEY } from '../enrich.ts';

type Fn = ($: unknown, previous?: unknown) => unknown;
const str = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const repeat1 = (content: unknown) => ({ type: 'REPEAT1', content });
const precLeft = (content: unknown) => ({ type: 'PREC_LEFT', value: 0, content });
const pair = () => seq(sym('op'), sym('operand'));

function enrichedBase(rules: Record<string, unknown>, minted: string[]) {
	const base = { name: 'g', rules: { ...rules } };
	Object.defineProperty(base, ENRICH_VISIBLE_GROUP_SOURCES_KEY, { value: new Set(minted), enumerable: false });
	return base;
}

function wiredBody(
	wired: { rules: Record<string, Fn> },
	base: { rules: Record<string, unknown> },
	name: string,
	previous: unknown
) {
	return wired.rules[name]!(makeSimpleDollarProxy(), previous);
}

describe('wire adopts an enrich-minted visible group an authored groups: pattern covers', () => {
	it('rewrites references to the authored alias and drops the minted rule on a whole-body match', () => {
		const host = seq(sym('left'), repeat1(sym('host_group')));
		const base = enrichedBase({ host, host_group: pair() }, ['host_group']);
		const wired = wire({ groups: { host_pair: () => pair() } } as never, base as never) as unknown as {
			rules: Record<string, Fn>;
		};
		expect(base.rules).not.toHaveProperty('host_group');
		expect(wired.rules).not.toHaveProperty('host_group');
		const body = wiredBody(wired, base, 'host', host) as { members: [unknown, { content: unknown }] };
		expect(body.members[1].content).toMatchObject({
			type: 'ALIAS',
			value: 'host_pair',
			content: { type: 'SYMBOL', name: '_host_pair' }
		});
	});

	it('matches through the ambient-prec wrapper enrich re-registered on the minted body', () => {
		const host = precLeft(seq(sym('left'), repeat1(sym('host_group'))));
		const base = enrichedBase({ host, host_group: precLeft(pair()) }, ['host_group']);
		const wired = wire({ groups: { host_pair: () => pair() } } as never, base as never) as unknown as {
			rules: Record<string, Fn>;
		};
		expect(base.rules).not.toHaveProperty('host_group');
		const body = wiredBody(wired, base, 'host', host) as { content: { members: [unknown, { content: unknown }] } };
		expect(body.content.members[1].content).toMatchObject({ type: 'ALIAS', value: 'host_pair' });
	});

	it('keeps the minted group on a partial match, with the pattern replaced inside it', () => {
		const mintedBody = seq(str('('), pair(), str(')'));
		const host = seq(sym('left'), repeat1(sym('host_group')));
		const base = enrichedBase({ host, host_group: mintedBody }, ['host_group']);
		const wired = wire({ groups: { host_pair: () => pair() } } as never, base as never) as unknown as {
			rules: Record<string, Fn>;
		};
		expect(base.rules).toHaveProperty('host_group');
		const group = wiredBody(wired, base, 'host_group', mintedBody) as { members: unknown[] };
		expect(group.members[1]).toMatchObject({ type: 'ALIAS', value: 'host_pair' });
		const body = wiredBody(wired, base, 'host', host) as { members: [unknown, { content: unknown }] };
		expect(body.members[1].content).toEqual(sym('host_group'));
	});

	it('never adopts a same-shaped rule enrich did not mint', () => {
		const host = seq(sym('left'), repeat1(sym('host_group')));
		const base = enrichedBase({ host, host_group: pair() }, []);
		wire({ groups: { host_pair: () => pair() } } as never, base as never);
		expect(base.rules).toHaveProperty('host_group');
	});
});
