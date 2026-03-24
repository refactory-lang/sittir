import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, MemberType, Type } from '../types.js';
import { type_ } from './type.js';
import type { TypeOptions } from './type.js';


class MemberTypeBuilder extends Builder<MemberType> {
  private _children: Builder<Type | Identifier>[] = [];

  constructor(...children: Builder<Type | Identifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('.');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MemberType {
    return {
      kind: 'member_type',
      children: this._children.map(c => c.build(ctx)),
    } as MemberType;
  }

  override get nodeKind(): 'member_type' { return 'member_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { MemberTypeBuilder };

export function member_type(...children: Builder<Type | Identifier>[]): MemberTypeBuilder {
  return new MemberTypeBuilder(...children);
}

export interface MemberTypeOptions {
  nodeKind: 'member_type';
  children?: Builder<Type | Identifier> | string | Omit<TypeOptions, 'nodeKind'> | (Builder<Type | Identifier> | string | Omit<TypeOptions, 'nodeKind'>)[];
}

export namespace member_type {
  export function from(input: Omit<MemberTypeOptions, 'nodeKind'> | Builder<Type | Identifier> | string | Omit<TypeOptions, 'nodeKind'> | (Builder<Type | Identifier> | string | Omit<TypeOptions, 'nodeKind'>)[]): MemberTypeBuilder {
    const options: Omit<MemberTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<MemberTypeOptions, 'nodeKind'>
      : { children: input } as Omit<MemberTypeOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new MemberTypeBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v instanceof Builder ? _v : type_.from(_v)));
    return b;
  }
}
