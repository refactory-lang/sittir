import type { BuilderTerminal } from '@sittir/types';
import type { EnumVariantList, EnumVariantListConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function enumVariantList(config: EnumVariantListConfig): EnumVariantList {
  return {
    kind: 'enum_variant_list',
    ...config,
  } as EnumVariantList;
}

class EnumVariantListBuilder implements BuilderTerminal<EnumVariantList> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): EnumVariantList {
    return enumVariantList({
      children: this._children,
    } as EnumVariantListConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function enum_variant_list(): EnumVariantListBuilder {
  return new EnumVariantListBuilder();
}
