import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UnaryExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class UnaryBuilder extends BaseBuilder<UnaryExpression> {
  private _argument: Child;
  private _operator!: Child;

  constructor(argument: Child) {
    super();
    this._argument = argument;
  }

  operator(value: Child): this {
    this._operator = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('unary');
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    if (this._argument) parts.push(this.renderChild(this._argument, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnaryExpression {
    return {
      kind: 'unary_expression',
      argument: this.renderChild(this._argument, ctx),
      operator: this._operator ? this.renderChild(this._operator, ctx) : undefined,
    } as unknown as UnaryExpression;
  }

  override get nodeKind(): string { return 'unary_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'unary' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    return parts;
  }
}

export function unary(argument: Child): UnaryBuilder {
  return new UnaryBuilder(argument);
}
