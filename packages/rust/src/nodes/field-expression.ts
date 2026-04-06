import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldExpression } from '../types.js';


class FieldBuilder extends BaseBuilder<FieldExpression> {
  private _field: BaseBuilder;
  private _value!: BaseBuilder;

  constructor(field: BaseBuilder) {
    super();
    this._field = field;
  }

  value(value: BaseBuilder): this {
    this._value = value;
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
      field: this.renderChild(this._field, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
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

export function field(field: BaseBuilder): FieldBuilder {
  return new FieldBuilder(field);
}
