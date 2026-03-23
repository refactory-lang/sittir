import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SpreadElement } from '../types.js';


class SpreadElementBuilder extends Builder<SpreadElement> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('...');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SpreadElement {
    return {
      kind: 'spread_element',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as SpreadElement;
  }

  override get nodeKind(): string { return 'spread_element'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '...', type: '...' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { SpreadElementBuilder };

export function spread_element(children: Builder): SpreadElementBuilder {
  return new SpreadElementBuilder(children);
}

export interface SpreadElementOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace spread_element {
  export function from(options: SpreadElementOptions): SpreadElementBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new SpreadElementBuilder(_ctor);
    return b;
  }
}
