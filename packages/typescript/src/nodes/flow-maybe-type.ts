import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FlowMaybeType, PrimaryType } from '../types.js';


class FlowMaybeTypeBuilder extends Builder<FlowMaybeType> {
  private _children: Builder<PrimaryType>[] = [];

  constructor(children: Builder<PrimaryType>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('?');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FlowMaybeType {
    return {
      kind: 'flow_maybe_type',
      children: this._children[0]!.build(ctx),
    } as FlowMaybeType;
  }

  override get nodeKind(): 'flow_maybe_type' { return 'flow_maybe_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '?', type: '?' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { FlowMaybeTypeBuilder };

export function flow_maybe_type(children: Builder<PrimaryType>): FlowMaybeTypeBuilder {
  return new FlowMaybeTypeBuilder(children);
}

export interface FlowMaybeTypeOptions {
  nodeKind: 'flow_maybe_type';
  children: Builder<PrimaryType> | (Builder<PrimaryType>)[];
}

export namespace flow_maybe_type {
  export function from(input: Omit<FlowMaybeTypeOptions, 'nodeKind'> | Builder<PrimaryType> | (Builder<PrimaryType>)[]): FlowMaybeTypeBuilder {
    const options: Omit<FlowMaybeTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<FlowMaybeTypeOptions, 'nodeKind'>
      : { children: input } as Omit<FlowMaybeTypeOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new FlowMaybeTypeBuilder(_ctor);
    return b;
  }
}
