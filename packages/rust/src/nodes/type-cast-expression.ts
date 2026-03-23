import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Type, TypeCastExpression } from '../types.js';


class TypeCastExpressionBuilder extends Builder<TypeCastExpression> {
  private _type!: Builder<Type>;
  private _value: Builder<Expression>;

  constructor(value: Builder<Expression>) {
    super();
    this._value = value;
  }

  type(value: Builder<Type>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    parts.push('as');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeCastExpression {
    return {
      kind: 'type_cast_expression',
      type: this._type?.build(ctx),
      value: this._value.build(ctx),
    } as TypeCastExpression;
  }

  override get nodeKind(): string { return 'type_cast_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { TypeCastExpressionBuilder };

export function type_cast_expression(value: Builder<Expression>): TypeCastExpressionBuilder {
  return new TypeCastExpressionBuilder(value);
}

export interface TypeCastExpressionOptions {
  type: Builder<Type>;
  value: Builder<Expression>;
}

export namespace type_cast_expression {
  export function from(options: TypeCastExpressionOptions): TypeCastExpressionBuilder {
    const b = new TypeCastExpressionBuilder(options.value);
    if (options.type !== undefined) b.type(options.type);
    return b;
  }
}
