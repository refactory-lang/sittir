import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericType, Identifier, ScopedIdentifier, ScopedTypeIdentifier, TypeArguments, TypeIdentifier } from '../types.js';


class GenericTypeBuilder extends Builder<GenericType> {
  private _type: Builder;
  private _typeArguments!: Builder;

  constructor(type_: Builder) {
    super();
    this._type = type_;
  }

  typeArguments(value: Builder): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericType {
    return {
      kind: 'generic_type',
      type: this.renderChild(this._type, ctx),
      typeArguments: this._typeArguments ? this.renderChild(this._typeArguments, ctx) : undefined,
    } as unknown as GenericType;
  }

  override get nodeKind(): string { return 'generic_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export type { GenericTypeBuilder };

export function generic_type(type_: Builder): GenericTypeBuilder {
  return new GenericTypeBuilder(type_);
}

export interface GenericTypeOptions {
  type: Builder<Identifier | ScopedIdentifier | ScopedTypeIdentifier | TypeIdentifier>;
  typeArguments: Builder<TypeArguments>;
}

export namespace generic_type {
  export function from(options: GenericTypeOptions): GenericTypeBuilder {
    const b = new GenericTypeBuilder(options.type);
    if (options.typeArguments !== undefined) b.typeArguments(options.typeArguments);
    return b;
  }
}
