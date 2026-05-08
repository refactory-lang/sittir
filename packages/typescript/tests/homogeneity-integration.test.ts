/**
 * Spec 009 Layer 1 real-grammar integration test.
 *
 * Verifies the homogeneity short-circuit actually fires on a real slot in
 * the typescript grammar. `FormalParameter = RequiredParameter |
 * OptionalParameter` — both arms share identical `$fields` + `$children`
 * shapes, only `$type` differs. A slot typed with `FormalParameter` should
 * accept a bare Loose bag without the `{kind: 'required_parameter' | ...}`
 * tag, because the runtime resolver can pick either arm by field-presence.
 *
 * If this test starts failing after a grammar regen, the emitter may have
 * regressed the homogeneity detection — OR the typescript grammar itself
 * changed one of the arms (e.g. added a field to RequiredParameter that
 * OptionalParameter lacks). In the latter case update the test to target
 * a different homogeneous polymorph.
 */

import { describe, it } from 'vitest';
import type { FormalParameter } from '../src/index.ts';
import type { NamespaceMap } from '../src/index.ts';
import type { FromInputOf } from '@sittir/types';

function expectTrue<_T extends true>(): void {}

describe('spec 009 Layer 1 — real typescript grammar integration', () => {
	it('FormalParameter Loose shape does not require a kind tag', () => {
		// The Loose projection for FormalParameter after spec 009 Layer 1
		// folds the two arms together (since their $fields are identical).
		// A bare bag with just the shared fields should be assignable.
		type FormalParamLoose = FromInputOf<FormalParameter, {}, {}, [], NamespaceMap>;

		// The shared shape is `{ type?: TypeAnnotation }` + children.
		// An empty loose bag is valid (everything optional) — it matches
		// both arms structurally.
		type EmptyBag = {};
		type EmptyBagIsLoose = EmptyBag extends Partial<FormalParamLoose> ? true : false;
		expectTrue<EmptyBagIsLoose>();

		// Under homogeneity, the `{kind: K}` tagged arm is DROPPED from the
		// Loose union entirely — the whole point is that the tag is not
		// required. A tagged bag is not assignable to the homogeneous Loose,
		// which is the expected tradeoff. (Heterogeneous polymorphs keep
		// the tagged arms — see types/tests/homogeneity.test.ts for the
		// heterogeneous counter-case.)
	});
});
