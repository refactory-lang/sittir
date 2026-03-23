import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('spread_element', () => {
  it('should create a spread_element node via builder', () => {
    const builder = ir.spread_element(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('spread_element');
  });

  it('should render without throwing', () => {
    const builder = ir.spread_element(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
