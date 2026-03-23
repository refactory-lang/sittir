import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UpdateExpression } from '../types.js';


class UpdateBuilder extends BaseBuilder<UpdateExpression> {
  private _argument: BaseBuilder;
  private _operator!: BaseBuilder;

  constructor(argument: BaseBuilder) {
    super();
    this._argument = argument;
  }

  operator(value: BaseBuilder): this {
    this._operator = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._argument) parts.push(this.renderChild(this._argument, ctx));
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
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
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    return parts;
  }
}

export function update(argument: BaseBuilder): UpdateBuilder {
  return new UpdateBuilder(argument);
}
