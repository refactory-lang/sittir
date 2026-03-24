import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_attribute', () => {
  it('should create a import_attribute node via builder', () => {
    const builder = ir.import_attribute(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('import_attribute');
  });

  it('should render without throwing', () => {
    const builder = ir.import_attribute(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
