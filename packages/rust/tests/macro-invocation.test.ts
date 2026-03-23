import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('macro_invocation', () => {
  it('should create a macro_invocation node via builder', () => {
    const builder = ir.macro_invocation(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('macro_invocation');
  });

  it('should render without throwing', () => {
    const builder = ir.macro_invocation(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
