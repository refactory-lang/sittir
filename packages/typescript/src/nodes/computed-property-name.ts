import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ComputedPropertyName, Expression } from '../types.js';


class ComputedPropertyNameBuilder extends Builder<ComputedPropertyName> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ComputedPropertyName {
    return {
      kind: 'computed_property_name',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ComputedPropertyName;
  }

  override get nodeKind(): string { return 'computed_property_name'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ComputedPropertyNameBuilder };

export function computed_property_name(children: Builder): ComputedPropertyNameBuilder {
  return new ComputedPropertyNameBuilder(children);
}

export interface ComputedPropertyNameOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace computed_property_name {
  export function from(options: ComputedPropertyNameOptions): ComputedPropertyNameBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ComputedPropertyNameBuilder(_ctor);
    return b;
  }
}
