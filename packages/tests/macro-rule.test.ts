import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('macro_rule', () => {
  it('should create a macro_rule node via builder', () => {
    const builder = ir.macro_rule(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('macro_rule');
  });

  it('should render without throwing', () => {
    const builder = ir.macro_rule(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
