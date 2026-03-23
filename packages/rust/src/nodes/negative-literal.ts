import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FloatLiteral, IntegerLiteral, NegativeLiteral } from '../types.js';


class NegativeLiteralBuilder extends Builder<NegativeLiteral> {
  private _children: Builder<FloatLiteral | IntegerLiteral>[] = [];

  constructor(children: Builder<FloatLiteral | IntegerLiteral>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('-');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NegativeLiteral {
    return {
      kind: 'negative_literal',
      children: this._children[0]?.build(ctx),
    } as NegativeLiteral;
  }

  override get nodeKind(): string { return 'negative_literal'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '-', type: '-' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { NegativeLiteralBuilder };

export function negative_literal(children: Builder<FloatLiteral | IntegerLiteral>): NegativeLiteralBuilder {
  return new NegativeLiteralBuilder(children);
}

export interface NegativeLiteralOptions {
  children: Builder<FloatLiteral | IntegerLiteral> | (Builder<FloatLiteral | IntegerLiteral>)[];
}

export namespace negative_literal {
  export function from(options: NegativeLiteralOptions): NegativeLiteralBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new NegativeLiteralBuilder(_ctor);
    return b;
  }
}
