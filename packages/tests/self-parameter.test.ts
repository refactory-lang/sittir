import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('self_parameter', () => {
  it('should create a self_parameter node via builder', () => {
    const builder = ir.self_parameter([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('self_parameter');
  });

  it('should render without throwing', () => {
    const builder = ir.self_parameter([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
