import { describe, it, expect } from 'vitest';
import type { TransformCtx, NormalizeCtx, SimplifyCtx } from './transforms.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';

describe('transform ctx shapes', () => {
  it('TransformCtx carries rules, inlineKinds, optional wordMatcher, diagnostics', () => {
    const ctx: TransformCtx = {
      rules: {},
      inlineKinds: new Set<string>(),
      diagnostics: new DiagnosticSink(),
    };
    expect(ctx.diagnostics).toBeInstanceOf(DiagnosticSink);
    // NormalizeCtx is an alias; SimplifyCtx extends — both ARE a TransformCtx.
    const n: NormalizeCtx = ctx;
    const s: SimplifyCtx = ctx;
    expect(n).toBe(s);
  });
});
