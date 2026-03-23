import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SourceFile } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SourceFileBuilder extends BaseBuilder<SourceFile> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as SourceFile;
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

export function file(): SourceFileBuilder {
  return new SourceFileBuilder();
}
