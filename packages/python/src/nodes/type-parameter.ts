import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Type, TypeParameter } from '../types.js';
import { type_ } from './type.js';
import type { TypeOptions } from './type.js';


class TypeParameterBuilder extends Builder<TypeParameter> {
  private _children: Builder<Type>[] = [];

  constructor(...children: Builder<Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameter {
    return {
      kind: 'type_parameter',
      children: this._children.map(c => c.build(ctx)),
    } as TypeParameter;
  }

  override get nodeKind(): 'type_parameter' { return 'type_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { TypeParameterBuilder };

export function type_parameter(...children: Builder<Type>[]): TypeParameterBuilder {
  return new TypeParameterBuilder(...children);
}

export interface TypeParameterOptions {
  nodeKind: 'type_parameter';
  children?: Builder<Type> | Omit<TypeOptions, 'nodeKind'> | (Builder<Type> | Omit<TypeOptions, 'nodeKind'>)[];
}

export namespace type_parameter {
  export function from(input: Omit<TypeParameterOptions, 'nodeKind'> | Builder<Type> | Omit<TypeOptions, 'nodeKind'> | (Builder<Type> | Omit<TypeOptions, 'nodeKind'>)[]): TypeParameterBuilder {
    const options: Omit<TypeParameterOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TypeParameterOptions, 'nodeKind'>
      : { children: input } as Omit<TypeParameterOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new TypeParameterBuilder(..._arr.map(_v => _v instanceof Builder ? _v : type_.from(_v)));
    return b;
  }
}
