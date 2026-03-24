import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { IntersectionType, Type } from '../types.js';


class IntersectionTypeBuilder extends Builder<IntersectionType> {
  private _children: Builder<Type>[] = [];

  constructor(...children: Builder<Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length === 1) {
      parts.push('&');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' & ', ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IntersectionType {
    return {
      kind: 'intersection_type',
      children: this._children.map(c => c.build(ctx)),
    } as IntersectionType;
  }

  override get nodeKind(): 'intersection_type' { return 'intersection_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: '&', type: '&' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { IntersectionTypeBuilder };

export function intersection_type(...children: Builder<Type>[]): IntersectionTypeBuilder {
  return new IntersectionTypeBuilder(...children);
}

export interface IntersectionTypeOptions {
  nodeKind: 'intersection_type';
  children?: Builder<Type> | (Builder<Type>)[];
}

export namespace intersection_type {
  export function from(input: Omit<IntersectionTypeOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): IntersectionTypeBuilder {
    const options: Omit<IntersectionTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<IntersectionTypeOptions, 'nodeKind'>
      : { children: input } as Omit<IntersectionTypeOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new IntersectionTypeBuilder(..._arr);
    return b;
  }
}
