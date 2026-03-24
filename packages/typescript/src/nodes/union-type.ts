import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Type, UnionType } from '../types.js';


class UnionTypeBuilder extends Builder<UnionType> {
  private _children: Builder<Type>[] = [];

  constructor(...children: Builder<Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length === 1) {
      parts.push('|');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' | ', ctx));
    }
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
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: '|', type: '|' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { UnionTypeBuilder };

export function union_type(...children: Builder<Type>[]): UnionTypeBuilder {
  return new UnionTypeBuilder(...children);
}

export interface UnionTypeOptions {
  nodeKind: 'union_type';
  children?: Builder<Type> | (Builder<Type>)[];
}

export namespace union_type {
  export function from(input: Omit<UnionTypeOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): UnionTypeBuilder {
    const options: Omit<UnionTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<UnionTypeOptions, 'nodeKind'>
      : { children: input } as Omit<UnionTypeOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new UnionTypeBuilder(..._arr);
    return b;
  }
}
