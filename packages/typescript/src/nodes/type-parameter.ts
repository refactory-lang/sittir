import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeParameter } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TypeParameterBuilder extends BaseBuilder<TypeParameter> {
  private _constraint?: Child;
  private _name: Child;
  private _value?: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  constraint(value: Child): this {
    this._constraint = value;
    return this;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    if (this._constraint) parts.push(this.renderChild(this._constraint, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameter {
    return {
      kind: 'type_parameter',
      constraint: this._constraint ? this.renderChild(this._constraint, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as TypeParameter;
  }

  override get nodeKind(): string { return 'type_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    if (this._constraint) parts.push({ kind: 'builder', builder: this._constraint, fieldName: 'constraint' });
    return parts;
  }
}

export function type_parameter(name: Child): TypeParameterBuilder {
  return new TypeParameterBuilder(name);
}
