import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeCastExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TypeCastBuilder extends BaseBuilder<TypeCastExpression> {
  private _type: Child;
  private _value!: Child;

  constructor(type_: Child) {
    super();
    this._type = type_;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('type cast');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
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
    parts.push({ kind: 'token', text: 'type cast' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export function type_cast(type_: Child): TypeCastBuilder {
  return new TypeCastBuilder(type_);
}
