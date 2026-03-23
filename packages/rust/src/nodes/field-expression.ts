import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, FieldExpression, FieldIdentifier, IntegerLiteral } from '../types.js';


class FieldExpressionBuilder extends Builder<FieldExpression> {
  private _field!: Builder<FieldIdentifier | IntegerLiteral>;
  private _value: Builder<Expression>;

  constructor(value: Builder<Expression>) {
    super();
    this._value = value;
  }

  field(value: Builder<FieldIdentifier | IntegerLiteral>): this {
    this._field = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    parts.push('.');
    if (this._field) parts.push(this.renderChild(this._field, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldExpression {
    return {
      kind: 'field_expression',
      field: this._field?.build(ctx),
      value: this._value.build(ctx),
    } as FieldExpression;
  }

  override get nodeKind(): string { return 'field_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._field) parts.push({ kind: 'builder', builder: this._field, fieldName: 'field' });
    return parts;
  }
}

export type { FieldExpressionBuilder };

export function field_expression(value: Builder<Expression>): FieldExpressionBuilder {
  return new FieldExpressionBuilder(value);
}

export interface FieldExpressionOptions {
  field: Builder<FieldIdentifier | IntegerLiteral>;
  value: Builder<Expression>;
}

export namespace field_expression {
  export function from(options: FieldExpressionOptions): FieldExpressionBuilder {
    const b = new FieldExpressionBuilder(options.value);
    if (options.field !== undefined) b.field(options.field);
    return b;
  }
}
