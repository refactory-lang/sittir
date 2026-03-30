import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('switch_case', () => {
  it('should create a switch_case node via builder', () => {
    const builder = ir.switch_case(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('switch_case');
  });

  it('should render without throwing', () => {
    const builder = ir.switch_case(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
