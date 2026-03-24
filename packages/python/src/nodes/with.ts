import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, WithItem } from '../types.js';


class WithBuilder extends Builder<WithItem> {
  private _value: Builder<Expression>;

  constructor(value: Builder<Expression>) {
    super();
    this._value = value;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WithItem {
    return {
      kind: 'with_item',
      value: this._value.build(ctx),
    } as WithItem;
  }

  override get nodeKind(): 'with_item' { return 'with_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { WithBuilder };

export function with_(value: Builder<Expression>): WithBuilder {
  return new WithBuilder(value);
}

export interface WithItemOptions {
  nodeKind: 'with_item';
  value: Builder<Expression>;
}

export namespace with_ {
  export function from(input: Omit<WithItemOptions, 'nodeKind'> | Builder<Expression>): WithBuilder {
    const options: Omit<WithItemOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'value' in input
      ? input as Omit<WithItemOptions, 'nodeKind'>
      : { value: input } as Omit<WithItemOptions, 'nodeKind'>;
    const b = new WithBuilder(options.value);
    return b;
  }
}
