import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeBinding } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TypeBindingBuilder extends BaseBuilder<TypeBinding> {
  private _name: Child;
  private _type!: Child;
  private _typeArguments?: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  type(value: Child): this {
    this._type = value;
    return this;
  }

  typeArguments(value: Child): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    parts.push('=');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeBinding {
    return {
      kind: 'type_binding',
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      typeArguments: this._typeArguments ? this.renderChild(this._typeArguments, ctx) : undefined,
    } as unknown as TypeBinding;
  }

  override get nodeKind(): string { return 'type_binding'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export function type_binding(name: Child): TypeBindingBuilder {
  return new TypeBindingBuilder(name);
}
