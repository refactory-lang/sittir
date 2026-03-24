import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('call_signature', () => {
  it('should create a call_signature node via builder', () => {
    const builder = ir.call_signature(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('call_signature');
  });

  it('should render without throwing', () => {
    const builder = ir.call_signature(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
