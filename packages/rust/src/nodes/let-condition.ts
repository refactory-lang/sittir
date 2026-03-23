import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LetCondition } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class LetConditionBuilder extends BaseBuilder<LetCondition> {
  private _pattern: Child;
  private _value!: Child;

  constructor(pattern: Child) {
    super();
    this._pattern = pattern;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LetCondition {
    return {
      kind: 'let_condition',
      pattern: this.renderChild(this._pattern, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as LetCondition;
  }

  override get nodeKind(): string { return 'let_condition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export function let_condition(pattern: Child): LetConditionBuilder {
  return new LetConditionBuilder(pattern);
}
