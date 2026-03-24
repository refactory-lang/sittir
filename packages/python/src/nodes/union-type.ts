import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Type, UnionType } from '../types.js';
import { type_ } from './type.js';
import type { TypeOptions } from './type.js';


class UnionTypeBuilder extends Builder<UnionType> {
  private _children: Builder<Type>[] = [];

  constructor(...children: Builder<Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('|');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnionType {
    return {
      kind: 'union_type',
      children: this._children.map(c => c.build(ctx)),
    } as UnionType;
  }

  override get nodeKind(): 'union_type' { return 'union_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: '|', type: '|' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { UnionTypeBuilder };

export function union_type(...children: Builder<Type>[]): UnionTypeBuilder {
  return new UnionTypeBuilder(...children);
}

export interface UnionTypeOptions {
  nodeKind: 'union_type';
  children?: Builder<Type> | Omit<TypeOptions, 'nodeKind'> | (Builder<Type> | Omit<TypeOptions, 'nodeKind'>)[];
}

export namespace union_type {
  export function from(input: Omit<UnionTypeOptions, 'nodeKind'> | Builder<Type> | Omit<TypeOptions, 'nodeKind'> | (Builder<Type> | Omit<TypeOptions, 'nodeKind'>)[]): UnionTypeBuilder {
    const options: Omit<UnionTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<UnionTypeOptions, 'nodeKind'>
      : { children: input } as Omit<UnionTypeOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new UnionTypeBuilder(..._arr.map(_v => _v instanceof Builder ? _v : type_.from(_v)));
    return b;
  }
}
