import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('function_signature_item', () => {
  it('should create a function_signature_item node via builder', () => {
    const builder = ir.function_signature(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('function_signature_item');
  });

  it('should render without throwing', () => {
    const builder = ir.function_signature(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
