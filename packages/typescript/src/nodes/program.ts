import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Program } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ProgramBuilder extends BaseBuilder<Program> {
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

  build(ctx?: RenderContext): Program {
    return {
      kind: 'program',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Program;
  }

  override get nodeKind(): string { return 'program'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function file(): ProgramBuilder {
  return new ProgramBuilder();
}
