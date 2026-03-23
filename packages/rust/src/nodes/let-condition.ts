import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, LetCondition, Pattern } from '../types.js';


class LetConditionBuilder extends Builder<LetCondition> {
  private _pattern: Builder;
  private _value!: Builder;

  constructor(pattern: Builder) {
    super();
    this._pattern = pattern;
  }

  value(value: Builder): this {
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

export type { LetConditionBuilder };

export function let_condition(pattern: Builder): LetConditionBuilder {
  return new LetConditionBuilder(pattern);
}

export interface LetConditionOptions {
  pattern: Builder<Pattern>;
  value: Builder<Expression>;
}

export namespace let_condition {
  export function from(options: LetConditionOptions): LetConditionBuilder {
    const b = new LetConditionBuilder(options.pattern);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
