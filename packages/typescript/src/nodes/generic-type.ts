import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericType, NestedTypeIdentifier, TypeArguments, TypeIdentifier } from '../types.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';


class GenericTypeBuilder extends Builder<GenericType> {
  private _name: Builder<TypeIdentifier | NestedTypeIdentifier>;
  private _typeArguments!: Builder<TypeArguments>;

  constructor(name: Builder<TypeIdentifier | NestedTypeIdentifier>) {
    super();
    this._name = name;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericType {
    return {
      kind: 'generic_type',
      name: this._name.build(ctx),
      typeArguments: this._typeArguments?.build(ctx),
    } as GenericType;
  }

  override get nodeKind(): string { return 'generic_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export type { GenericTypeBuilder };

export function generic_type(name: Builder<TypeIdentifier | NestedTypeIdentifier>): GenericTypeBuilder {
  return new GenericTypeBuilder(name);
}

export interface GenericTypeOptions {
  name: Builder<TypeIdentifier | NestedTypeIdentifier> | string;
  typeArguments: Builder<TypeArguments> | TypeArgumentsOptions;
}

export namespace generic_type {
  export function from(options: GenericTypeOptions): GenericTypeBuilder {
    const _ctor = options.name;
    const b = new GenericTypeBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      b.typeArguments(_v instanceof Builder ? _v : type_arguments.from(_v as TypeArgumentsOptions));
    }
    return b;
  }
}
