import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('switch_default', () => {
  it('should create a switch_default node via builder', () => {
    const builder = ir.switch_default();
    const node = builder.build();
    expect(node.kind).toBe('switch_default');
  });

  it('should render without throwing', () => {
    const builder = ir.switch_default();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
