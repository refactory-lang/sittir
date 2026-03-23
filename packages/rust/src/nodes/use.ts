import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UseDeclaration } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class UseBuilder extends BaseBuilder<UseDeclaration> {
  private _argument: Child;
  private _children: Child[] = [];

  constructor(argument: Child) {
    super();
    this._argument = argument;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('use');
    if (this._argument) parts.push(this.renderChild(this._argument, ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UseDeclaration {
    return {
      kind: 'use_declaration',
      argument: this.renderChild(this._argument, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as UseDeclaration;
  }

  override get nodeKind(): string { return 'use_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'use', type: 'use' });
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export function use_(argument: Child): UseBuilder {
  return new UseBuilder(argument);
}
