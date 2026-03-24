import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, Label } from '../types.js';


class LabelBuilder extends Builder<Label> {
  private _children: Builder<Identifier>[] = [];

  constructor(children: Builder<Identifier>) {
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
      children: this._children[0]!.build(ctx),
    } as Label;
  }

  override get nodeKind(): 'label' { return 'label'; }

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

export function label(children: Builder<Identifier>): LabelBuilder {
  return new LabelBuilder(children);
}

export interface LabelOptions {
  nodeKind: 'label';
  children: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace label {
  export function from(input: Omit<LabelOptions, 'nodeKind'> | Builder<Identifier> | string | (Builder<Identifier> | string)[]): LabelBuilder {
    const options: Omit<LabelOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<LabelOptions, 'nodeKind'>
      : { children: input } as Omit<LabelOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new LabelBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    return b;
  }
}
