import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('token_binding_pattern', () => {
  it('should create a token_binding_pattern node via builder', () => {
    const builder = ir.token_binding_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('token_binding_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.token_binding_pattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
