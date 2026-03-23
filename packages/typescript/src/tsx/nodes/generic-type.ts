import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericType, NestedTypeIdentifier, TypeArguments, TypeIdentifier } from '../types.js';


class GenericTypeBuilder extends Builder<GenericType> {
  private _name: Builder<NestedTypeIdentifier | TypeIdentifier>;
  private _typeArguments!: Builder<TypeArguments>;

  constructor(name: Builder<NestedTypeIdentifier | TypeIdentifier>) {
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

export function generic_type(name: Builder<NestedTypeIdentifier | TypeIdentifier>): GenericTypeBuilder {
  return new GenericTypeBuilder(name);
}

export interface GenericTypeOptions {
  name: Builder<NestedTypeIdentifier | TypeIdentifier>;
  typeArguments: Builder<TypeArguments>;
}

export namespace generic_type {
  export function from(options: GenericTypeOptions): GenericTypeBuilder {
    const b = new GenericTypeBuilder(options.name);
    if (options.typeArguments !== undefined) b.typeArguments(options.typeArguments);
    return b;
  }
}
