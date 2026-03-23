import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssociatedType, TraitBounds, TypeIdentifier, TypeParameters, WhereClause } from '../types.js';


class AssociatedTypeBuilder extends Builder<AssociatedType> {
  private _bounds?: Builder<TraitBounds>;
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _children: Builder<WhereClause>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  bounds(value: Builder<TraitBounds>): this {
    this._bounds = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  children(...value: Builder<WhereClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('type');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AssociatedType {
    return {
      kind: 'associated_type',
      bounds: this._bounds?.build(ctx),
      name: this._name.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      children: this._children[0]?.build(ctx),
    } as AssociatedType;
  }

  override get nodeKind(): string { return 'associated_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'type', type: 'type' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { AssociatedTypeBuilder };

export function associated_type(name: Builder<TypeIdentifier>): AssociatedTypeBuilder {
  return new AssociatedTypeBuilder(name);
}

export interface AssociatedTypeOptions {
  bounds?: Builder<TraitBounds>;
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters>;
  children?: Builder<WhereClause> | (Builder<WhereClause>)[];
}

export namespace associated_type {
  export function from(options: AssociatedTypeOptions): AssociatedTypeBuilder {
    const _ctor = options.name;
    const b = new AssociatedTypeBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.bounds !== undefined) b.bounds(options.bounds);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
