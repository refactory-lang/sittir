import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, DeclarationStatement } from '../types.js';


class DeclarationListBuilder extends Builder<DeclarationList> {
  private _children: Builder<DeclarationStatement>[] = [];

  constructor() { super(); }

  children(...value: Builder<DeclarationStatement>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DeclarationList {
    return {
      kind: 'declaration_list',
      children: this._children.map(c => c.build(ctx)),
    } as DeclarationList;
  }

  override get nodeKind(): string { return 'declaration_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { DeclarationListBuilder };

export function declaration_list(): DeclarationListBuilder {
  return new DeclarationListBuilder();
}

export interface DeclarationListOptions {
  children?: Builder<DeclarationStatement> | (Builder<DeclarationStatement>)[];
}

export namespace declaration_list {
  export function from(options: DeclarationListOptions): DeclarationListBuilder {
    const b = new DeclarationListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
