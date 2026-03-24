import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericType, Identifier, TypeParameter } from '../types.js';
import { type_parameter } from './type-parameter.js';
import type { TypeParameterOptions } from './type-parameter.js';


class GenericTypeBuilder extends Builder<GenericType> {
  private _children: Builder<Identifier | TypeParameter>[] = [];

  constructor(...children: Builder<Identifier | TypeParameter>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericType {
    return {
      kind: 'generic_type',
      children: this._children.map(c => c.build(ctx)),
    } as GenericType;
  }

  override get nodeKind(): 'generic_type' { return 'generic_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { GenericTypeBuilder };

export function generic_type(...children: Builder<Identifier | TypeParameter>[]): GenericTypeBuilder {
  return new GenericTypeBuilder(...children);
}

export interface GenericTypeOptions {
  nodeKind: 'generic_type';
  children?: Builder<Identifier | TypeParameter> | string | Omit<TypeParameterOptions, 'nodeKind'> | (Builder<Identifier | TypeParameter> | string | Omit<TypeParameterOptions, 'nodeKind'>)[];
}

export namespace generic_type {
  export function from(input: Omit<GenericTypeOptions, 'nodeKind'> | Builder<Identifier | TypeParameter> | string | Omit<TypeParameterOptions, 'nodeKind'> | (Builder<Identifier | TypeParameter> | string | Omit<TypeParameterOptions, 'nodeKind'>)[]): GenericTypeBuilder {
    const options: Omit<GenericTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<GenericTypeOptions, 'nodeKind'>
      : { children: input } as Omit<GenericTypeOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new GenericTypeBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v instanceof Builder ? _v : type_parameter.from(_v)));
    return b;
  }
}
