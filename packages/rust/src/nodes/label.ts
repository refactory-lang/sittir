import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, Label } from '../types.js';


class LabelBuilder extends Builder<Label> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('\'');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Label {
    return {
      kind: 'label',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Label;
  }

  override get nodeKind(): string { return 'label'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '\'', type: '\'' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { LabelBuilder };

export function label(children: Builder): LabelBuilder {
  return new LabelBuilder(children);
}

export interface LabelOptions {
  children: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace label {
  export function from(options: LabelOptions): LabelBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new LabelBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    return b;
  }
}
