import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LetCondition } from '../types.js';


class LetConditionBuilder extends BaseBuilder<LetCondition> {
  private _pattern: BaseBuilder;
  private _value!: BaseBuilder;

  constructor(pattern: BaseBuilder) {
    super();
    this._pattern = pattern;
  }

  value(value: BaseBuilder): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('let');
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    parts.push('=');
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
    parts.push({ kind: 'token', text: 'let', type: 'let' });
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export function let_condition(pattern: BaseBuilder): LetConditionBuilder {
  return new LetConditionBuilder(pattern);
}
