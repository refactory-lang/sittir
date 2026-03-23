import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Type, TypeArguments, TypeBinding, TypeIdentifier } from '../types.js';


class TypeBindingBuilder extends Builder<TypeBinding> {
  private _name: Builder;
  private _type!: Builder;
  private _typeArguments?: Builder;

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  typeArguments(value: Builder): this {
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

export type { TypeBindingBuilder };

export function type_binding(name: Builder): TypeBindingBuilder {
  return new TypeBindingBuilder(name);
}

export interface TypeBindingOptions {
  name: Builder<TypeIdentifier> | string;
  type: Builder<Type>;
  typeArguments?: Builder<TypeArguments>;
}

export namespace type_binding {
  export function from(options: TypeBindingOptions): TypeBindingBuilder {
    const _ctor = options.name;
    const b = new TypeBindingBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.type !== undefined) b.type(options.type);
    if (options.typeArguments !== undefined) b.typeArguments(options.typeArguments);
    return b;
  }
}
