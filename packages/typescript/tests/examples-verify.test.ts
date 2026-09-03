// Runtime verification of the TypeScript use-case examples against the native
// engine: every export executes and produces what the guide promises.
import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '@sittir/typescript';
import { dogfoodContract } from '../../../examples/helpers.ts';
import { rebuildFormat, formatBoundary, returnResult } from '../../../examples/18-dogfood-typescript.ts';
import {
	rebuildFormatStrict,
	formatBoundaryStrict,
	returnResultStrict
} from '../../../examples/18-dogfood-typescript-strict.ts';

// GAP inventory (examples/18): A=2 cross-cutting (statement arms, import
// clauses) B=1 (type-annotation wrapper) C=1 cross-cutting (required
// punctuation slots). The surface cannot compose a real TypeScript file yet, so both
// contract assertions are pinned.
describe('examples/18 dogfood typescript (format.ts)', () => {
	const target = new URL('../../common/src/format.ts', import.meta.url).pathname;
	it('builds and renders the fragments that cross the boundary', () => {
		expect(rebuildFormat().$render()).toContain('function applyFormat');
	});
	it('composes a member expression once its separator is supplied', () => {
		expect(formatBoundary().$render()).toBe('format.boundary');
	});
	it('renders a return statement with its expression', () => {
		expect(returnResult().$render()).toBe('return result;');
	});
	it.fails('re-parses to the same tree as the real file', () => {
		expect(dogfoodContract(createEngine(), rebuildFormat(), target).reparsesEqual).toBe(true);
	});
	it.fails('is identical to the real file modulo whitespace', () => {
		expect(dogfoodContract(createEngine(), rebuildFormat(), target).sameModuloWhitespace).toBe(true);
	});
});

// The strict half: same items through `.strict` alone, so each gap lands on the
// layer that owns it.
describe('examples/18 dogfood typescript — strict factory surface', () => {
	it('builds a function declaration and a program', () => {
		expect(rebuildFormatStrict().$render()).toContain('function applyFormat');
	});
	it('composes a member expression once its separator is supplied', () => {
		expect(formatBoundaryStrict().$render()).toBe('format.boundary');
	});
	it('renders a return statement with its expression', () => {
		expect(returnResultStrict().$render()).toBe('return result;');
	});
});

// Ceiling, never a floor: an artefact kind moves off the top-level namespace
// onto its parent, so this count only shrinks.
describe('ir entry ratchet', () => {
	it('exposes no more top-level builders than the recorded ceiling', () => {
		// Grouped namespaces and `synonym` are objects, not builders — the
		// ratchet tracks builder exposure, so only callable entries count.
		const builders = Object.keys(ir).filter((k) => typeof (ir as Record<string, unknown>)[k] === 'function');
		expect(builders.length).toBeLessThanOrEqual(255);
	});
});
