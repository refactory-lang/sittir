import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('augmented_assignment', () => {
  it('should build with correct kind', () => {
    const builder = ir.augmentedAssignment(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('augmented_assignment');
    expect((node as any).left).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.augmentedAssignment(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('augmented_assignment');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.augmentedAssignment(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
