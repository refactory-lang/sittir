import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FieldBuilder extends BaseBuilder<FieldExpression> {
  private _field: Child;
  private _value!: Child;

  constructor(field: Child) {
    super();
    this._field = field;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('field');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
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
    parts.push({ kind: 'token', text: 'field' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    if (this._field) parts.push({ kind: 'builder', builder: this._field, fieldName: 'field' });
    return parts;
  }
}

export function field(field: Child): FieldBuilder {
  return new FieldBuilder(field);
}
