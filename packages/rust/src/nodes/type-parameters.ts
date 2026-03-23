import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, ConstParameter, LifetimeParameter, Metavariable, TypeParameter, TypeParameters } from '../types.js';


class TypeParametersBuilder extends Builder<TypeParameters> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('<');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    if (this._children[3]) parts.push(this.renderChild(this._children[3]!, ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameters {
    return {
      kind: 'type_parameters',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TypeParameters;
  }

  override get nodeKind(): string { return 'type_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '<', type: '<' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    if (this._children[3]) parts.push({ kind: 'builder', builder: this._children[3]! });
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { TypeParametersBuilder };

export function type_parameters(...children: Builder[]): TypeParametersBuilder {
  return new TypeParametersBuilder(...children);
}

export interface TypeParametersOptions {
  children: Builder<AttributeItem | ConstParameter | LifetimeParameter | Metavariable | TypeParameter> | (Builder<AttributeItem | ConstParameter | LifetimeParameter | Metavariable | TypeParameter>)[];
}

export namespace type_parameters {
  export function from(options: TypeParametersOptions): TypeParametersBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new TypeParametersBuilder(..._arr);
    return b;
  }
}
