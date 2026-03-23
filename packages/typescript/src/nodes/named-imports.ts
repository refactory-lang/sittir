import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportSpecifier, NamedImports } from '../types.js';


class NamedImportsBuilder extends Builder<NamedImports> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NamedImports {
    return {
      kind: 'named_imports',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as NamedImports;
  }

  override get nodeKind(): string { return 'named_imports'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { NamedImportsBuilder };

export function named_imports(): NamedImportsBuilder {
  return new NamedImportsBuilder();
}

export interface NamedImportsOptions {
  children?: Builder<ImportSpecifier> | (Builder<ImportSpecifier>)[];
}

export namespace named_imports {
  export function from(options: NamedImportsOptions): NamedImportsBuilder {
    const b = new NamedImportsBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
