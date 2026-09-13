/**
 * transform-enrich-lift.test.ts — unit coverage for resolvePatch's ALIAS +
 * enrich-lift branch (enrichLiftArmOf, renameEnrichLift) and the sibling
 * alias() re-homing path in resolveAliasPlaceholder.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { alias } from '../primitives/alias.ts';
import { withWireContext } from '../wire/wire.ts';
import { setGroupLiftRuleMap } from '../transform/transform-path.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

describe('resolvePatch — ALIAS + enrich-lift', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('re-homes a hoisted enrich alias to the variant\'s hidden name and renames the lift symbol', () => {
		const liftBody = { type: 'SEQ', members: [{ type: 'STRING', value: 'x' }, { type: 'SYMBOL', name: 'Y' }] } as any;
		setGroupLiftRuleMap({ get: (n: string) => (n === '_lift1' ? liftBody : undefined), set: () => {} });
		try {
			const { result: patched, ctx } = withWireContext('hoisted_alias', () => {
				const g = globalThis as any;
				const aliasMember = {
					type: 'ALIAS',
					content: { type: 'SYMBOL', name: '_lift1', metadata: { author: 'enrich' } },
					named: true,
					value: '_lift1'
				};
				const original = g.seq(g.choice(aliasMember, { type: 'SYMBOL', name: 'Other' } as any));
				return transform(original, { '0/0': variant('picked') }) as any;
			});

			expect(ctx.deposits.get('_hoisted_alias_picked')).toEqual({ ...liftBody, annotations: { hoisted: true } });
			expect(ctx.symbolRenames.get('_lift1')).toBe('_hoisted_alias_picked');
			const pickedArm = patched.members[0].members[0];
			expect(pickedArm.value).toBe('hoisted_alias_picked');
			expect(pickedArm.content.name).toBe('_hoisted_alias_picked');
		} finally {
			setGroupLiftRuleMap(undefined);
		}
	});

	it('alias() re-homes a bare symbol reference to an authored rule without minting a synthetic deposit', () => {
		const { result: patched, ctx } = withWireContext('rehome', () => {
			const original = { type: 'SYMBOL', name: 'authored_rule' } as any;
			return transform(original, { '.': alias('public_name') } as any) as any;
		});

		expect(patched.type).toBe('ALIAS');
		expect(patched.named).toBe(true);
		expect(patched.value).toBe('public_name');
		expect(patched.content).toEqual({ type: 'SYMBOL', name: 'authored_rule' });
		expect(ctx.deposits.size).toBe(0);
	});
});
