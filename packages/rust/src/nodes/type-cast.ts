import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeCastExpression } from '../types.js';


class TypeCastBuilder extends BaseBuilder<TypeCastExpression> {
  private _type: BaseBuilder;
  private _value!: BaseBuilder;

  constructor(type_: BaseBuilder) {
    super();
    this._type = type_;
  }

  value(value: BaseBuilder): this {
    this._value = value;
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
      type: this.renderChild(this._type, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as TypeCastExpression;
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

export function type_cast(type_: BaseBuilder): TypeCastBuilder {
  return new TypeCastBuilder(type_);
}
