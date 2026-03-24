import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportSpecifier, NamedImports } from '../types.js';
import { import_specifier } from './import-specifier.js';
import type { ImportSpecifierOptions } from './import-specifier.js';


class NamedImportsBuilder extends Builder<NamedImports> {
  private _children: Builder<ImportSpecifier>[] = [];

  constructor() { super(); }

  children(...value: Builder<ImportSpecifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NamedImports {
    return {
      kind: 'named_imports',
      children: this._children.map(c => c.build(ctx)),
    } as NamedImports;
  }

  override get nodeKind(): 'named_imports' { return 'named_imports'; }

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
  nodeKind: 'named_imports';
  children?: Builder<ImportSpecifier> | Omit<ImportSpecifierOptions, 'nodeKind'> | (Builder<ImportSpecifier> | Omit<ImportSpecifierOptions, 'nodeKind'>)[];
}

export namespace named_imports {
  export function from(input: Omit<NamedImportsOptions, 'nodeKind'> | Builder<ImportSpecifier> | Omit<ImportSpecifierOptions, 'nodeKind'> | (Builder<ImportSpecifier> | Omit<ImportSpecifierOptions, 'nodeKind'>)[]): NamedImportsBuilder {
    const options: Omit<NamedImportsOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<NamedImportsOptions, 'nodeKind'>
      : { children: input } as Omit<NamedImportsOptions, 'nodeKind'>;
    const b = new NamedImportsBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : import_specifier.from(_x)));
    }
    return b;
  }
}
