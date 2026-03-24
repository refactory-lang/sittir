import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DottedName, Identifier } from '../types.js';


class DottedNameBuilder extends Builder<DottedName> {
  private _children: Builder<Identifier>[] = [];

  constructor(...children: Builder<Identifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' . ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DottedName {
    return {
      kind: 'dotted_name',
      children: this._children.map(c => c.build(ctx)),
    } as DottedName;
  }

  override get nodeKind(): 'dotted_name' { return 'dotted_name'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: '.', type: '.' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { DottedNameBuilder };

export function dotted_name(...children: Builder<Identifier>[]): DottedNameBuilder {
  return new DottedNameBuilder(...children);
}

export interface DottedNameOptions {
  nodeKind: 'dotted_name';
  children?: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace dotted_name {
  export function from(input: Omit<DottedNameOptions, 'nodeKind'> | Builder<Identifier> | string | (Builder<Identifier> | string)[]): DottedNameBuilder {
    const options: Omit<DottedNameOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<DottedNameOptions, 'nodeKind'>
      : { children: input } as Omit<DottedNameOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new DottedNameBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v));
    return b;
  }
}
