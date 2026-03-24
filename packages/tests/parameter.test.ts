import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('parameter', () => {
  it('should create a parameter node via builder', () => {
    const builder = ir.parameter(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('parameter');
  });

  it('should render without throwing', () => {
    const builder = ir.parameter(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
