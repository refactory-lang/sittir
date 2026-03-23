import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UpdateExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class UpdateBuilder extends BaseBuilder<UpdateExpression> {
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
    parts.push('update');
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    if (this._argument) parts.push(this.renderChild(this._argument, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UpdateExpression {
    return {
      kind: 'update_expression',
      argument: this.renderChild(this._argument, ctx),
      operator: this._operator ? this.renderChild(this._operator, ctx) : undefined,
    } as unknown as UpdateExpression;
  }

  override get nodeKind(): string { return 'update_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'update' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    return parts;
  }
}

export function update(argument: Child): UpdateBuilder {
  return new UpdateBuilder(argument);
}
