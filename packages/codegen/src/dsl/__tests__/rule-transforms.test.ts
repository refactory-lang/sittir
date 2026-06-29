import { describe, it, expect } from 'vitest';
import type { TransformCtx, SimplifyCtx } from '../rule-transforms.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';

describe('transform ctx shapes', () => {
  it('TransformCtx carries rules, inlineKinds, optional wordMatcher, diagnostics', () => {
    const ctx: TransformCtx = {
      rules: {},
      inlineKinds: new Set<string>(),
      diagnostics: new DiagnosticSink(),
    };
    expect(ctx.diagnostics).toBeInstanceOf(DiagnosticSink);
    // SimplifyCtx extends TransformCtx — a bare TransformCtx literal satisfies it.
    // (NormalizeCtx moved to compiler/normalize.ts as a BaseCtx subclass.)
    const s: SimplifyCtx = ctx;
    expect(s.diagnostics).toBeInstanceOf(DiagnosticSink);
  });
});
