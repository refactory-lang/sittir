import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstrainedType, Type } from '../types.js';
import { type_ } from './type.js';
import type { TypeOptions } from './type.js';


class ConstrainedTypeBuilder extends Builder<ConstrainedType> {
  private _children: Builder<Type>[] = [];

  constructor(...children: Builder<Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push(':');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstrainedType {
    return {
      kind: 'constrained_type',
      children: this._children.map(c => c.build(ctx)),
    } as ConstrainedType;
  }

  override get nodeKind(): 'constrained_type' { return 'constrained_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ConstrainedTypeBuilder };

export function constrained_type(...children: Builder<Type>[]): ConstrainedTypeBuilder {
  return new ConstrainedTypeBuilder(...children);
}

export interface ConstrainedTypeOptions {
  nodeKind: 'constrained_type';
  children?: Builder<Type> | Omit<TypeOptions, 'nodeKind'> | (Builder<Type> | Omit<TypeOptions, 'nodeKind'>)[];
}

export namespace constrained_type {
  export function from(input: Omit<ConstrainedTypeOptions, 'nodeKind'> | Builder<Type> | Omit<TypeOptions, 'nodeKind'> | (Builder<Type> | Omit<TypeOptions, 'nodeKind'>)[]): ConstrainedTypeBuilder {
    const options: Omit<ConstrainedTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ConstrainedTypeOptions, 'nodeKind'>
      : { children: input } as Omit<ConstrainedTypeOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ConstrainedTypeBuilder(..._arr.map(_v => _v instanceof Builder ? _v : type_.from(_v)));
    return b;
  }
}
