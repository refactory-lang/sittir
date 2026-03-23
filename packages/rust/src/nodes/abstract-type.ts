import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, BoundedType, FunctionType, GenericType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, TypeParameters } from '../types.js';


class AbstractTypeBuilder extends Builder<AbstractType> {
  private _trait: Builder<BoundedType | FunctionType | GenericType | RemovedTraitBound | ScopedTypeIdentifier | TupleType | TypeIdentifier>;
  private _children: Builder<TypeParameters>[] = [];

  constructor(trait: Builder<BoundedType | FunctionType | GenericType | RemovedTraitBound | ScopedTypeIdentifier | TupleType | TypeIdentifier>) {
    super();
    this._trait = trait;
  }

  children(...value: Builder<TypeParameters>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('impl');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._trait) parts.push(this.renderChild(this._trait, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AbstractType {
    return {
      kind: 'abstract_type',
      trait: this._trait.build(ctx),
      children: this._children[0]?.build(ctx),
    } as AbstractType;
  }

  override get nodeKind(): string { return 'abstract_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'impl', type: 'impl' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
    return parts;
  }
}

export type { AbstractTypeBuilder };

export function abstract_type(trait: Builder<BoundedType | FunctionType | GenericType | RemovedTraitBound | ScopedTypeIdentifier | TupleType | TypeIdentifier>): AbstractTypeBuilder {
  return new AbstractTypeBuilder(trait);
}

export interface AbstractTypeOptions {
  trait: Builder<BoundedType | FunctionType | GenericType | RemovedTraitBound | ScopedTypeIdentifier | TupleType | TypeIdentifier>;
  children?: Builder<TypeParameters> | (Builder<TypeParameters>)[];
}

export namespace abstract_type {
  export function from(options: AbstractTypeOptions): AbstractTypeBuilder {
    const b = new AbstractTypeBuilder(options.trait);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
