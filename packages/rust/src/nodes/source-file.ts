import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationStatement, ExpressionStatement, Shebang, SourceFile } from '../types.js';


class SourceFileBuilder extends Builder<SourceFile> {
  private _children: Builder<DeclarationStatement | ExpressionStatement | Shebang>[] = [];

  constructor() { super(); }

  children(...value: Builder<DeclarationStatement | ExpressionStatement | Shebang>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SourceFile {
    return {
      kind: 'source_file',
      children: this._children.map(c => c.build(ctx)),
    } as SourceFile;
  }

  override get nodeKind(): string { return 'source_file'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { SourceFileBuilder };

export function source_file(): SourceFileBuilder {
  return new SourceFileBuilder();
}

export interface SourceFileOptions {
  children?: Builder<DeclarationStatement | ExpressionStatement | Shebang> | (Builder<DeclarationStatement | ExpressionStatement | Shebang>)[];
}

export namespace source_file {
  export function from(options: SourceFileOptions): SourceFileBuilder {
    const b = new SourceFileBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
