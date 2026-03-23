import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeParameter, TypeParameters } from '../types.js';


class TypeParametersBuilder extends Builder<TypeParameters> {
  private _children: Builder<TypeParameter>[] = [];

  constructor(...children: Builder<TypeParameter>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('<');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameters {
    return {
      kind: 'type_parameters',
      children: this._children.map(c => c.build(ctx)),
    } as TypeParameters;
  }

  override get nodeKind(): string { return 'type_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '<', type: '<' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { TypeParametersBuilder };

export function type_parameters(...children: Builder<TypeParameter>[]): TypeParametersBuilder {
  return new TypeParametersBuilder(...children);
}

export interface TypeParametersOptions {
  children: Builder<TypeParameter> | (Builder<TypeParameter>)[];
}

export namespace type_parameters {
  export function from(options: TypeParametersOptions): TypeParametersBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new TypeParametersBuilder(..._arr);
    return b;
  }
}
