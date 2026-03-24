import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('enum_assignment', () => {
  it('should create a enum_assignment node via builder', () => {
    const builder = ir.enum_assignment(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('enum_assignment');
  });

  it('should render without throwing', () => {
    const builder = ir.enum_assignment(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
