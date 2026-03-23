import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TraitBounds, Type, TypeIdentifier, TypeParameter } from '../types.js';


class TypeParameterBuilder extends Builder<TypeParameter> {
  private _bounds?: Builder<TraitBounds>;
  private _defaultType?: Builder<Type>;
  private _name: Builder<TypeIdentifier>;

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  bounds(value: Builder<TraitBounds>): this {
    this._bounds = value;
    return this;
  }

  defaultType(value: Builder<Type>): this {
    this._defaultType = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    if (this._defaultType) {
      parts.push('=');
      if (this._defaultType) parts.push(this.renderChild(this._defaultType, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameter {
    return {
      kind: 'type_parameter',
      bounds: this._bounds?.build(ctx),
      defaultType: this._defaultType?.build(ctx),
      name: this._name.build(ctx),
    } as TypeParameter;
  }

  override get nodeKind(): string { return 'type_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    if (this._defaultType) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._defaultType) parts.push({ kind: 'builder', builder: this._defaultType, fieldName: 'defaultType' });
    }
    return parts;
  }
}

export type { TypeParameterBuilder };

export function type_parameter(name: Builder<TypeIdentifier>): TypeParameterBuilder {
  return new TypeParameterBuilder(name);
}

export interface TypeParameterOptions {
  bounds?: Builder<TraitBounds>;
  defaultType?: Builder<Type>;
  name: Builder<TypeIdentifier> | string;
}

export namespace type_parameter {
  export function from(options: TypeParameterOptions): TypeParameterBuilder {
    const _ctor = options.name;
    const b = new TypeParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.bounds !== undefined) b.bounds(options.bounds);
    if (options.defaultType !== undefined) b.defaultType(options.defaultType);
    return b;
  }
}
