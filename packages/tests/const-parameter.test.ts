import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('const_parameter', () => {
  it('should create a const_parameter node via builder', () => {
    const builder = ir.const_parameter(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('const_parameter');
  });

  it('should render without throwing', () => {
    const builder = ir.const_parameter(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
