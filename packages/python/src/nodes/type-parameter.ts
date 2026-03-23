import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeParameter } from '../types.js';


class TypeParameterBuilder extends Builder<TypeParameter> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameter {
    return {
      kind: 'type_parameter',
      children: this._children.map(c => c.build(ctx)),
    } as TypeParameter;
  }

  override get nodeKind(): string { return 'type_parameter'; }

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

export function type_parameter(...children: Builder[]): TypeParameterBuilder {
  return new TypeParameterBuilder(...children);
}

export interface TypeParameterOptions {
  children: Builder | (Builder)[];
}

export namespace type_parameter {
  export function from(options: TypeParameterOptions): TypeParameterBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new TypeParameterBuilder(..._arr);
    return b;
  }
}
