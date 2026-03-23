import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_require_clause', () => {
  it('should create a import_require_clause node via builder', () => {
    const builder = ir.import_require_clause(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('import_require_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.import_require_clause(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
