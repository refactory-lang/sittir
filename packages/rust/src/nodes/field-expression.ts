import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, FieldExpression, FieldIdentifier, IntegerLiteral } from '../types.js';


class FieldBuilder extends Builder<FieldExpression> {
  private _field!: Builder;
  private _value: Builder;

  constructor(value: Builder) {
    super();
    this._value = value;
  }

  field(value: Builder): this {
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
      field: this._field ? this.renderChild(this._field, ctx) : undefined,
      value: this.renderChild(this._value, ctx),
    } as unknown as FieldExpression;
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

export type { FieldBuilder };

export function field(value: Builder): FieldBuilder {
  return new FieldBuilder(value);
}

export interface FieldExpressionOptions {
  field: Builder<FieldIdentifier | IntegerLiteral>;
  value: Builder<Expression>;
}

export namespace field {
  export function from(options: FieldExpressionOptions): FieldBuilder {
    const b = new FieldBuilder(options.value);
    if (options.field !== undefined) b.field(options.field);
    return b;
  }
}
