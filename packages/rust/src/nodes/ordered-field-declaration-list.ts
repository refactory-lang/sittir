import type { BuilderTerminal } from '@sittir/types';
import type { OrderedFieldDeclarationList, OrderedFieldDeclarationListConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function orderedFieldDeclarationList(config: OrderedFieldDeclarationListConfig): OrderedFieldDeclarationList {
  return {
    kind: 'ordered_field_declaration_list',
    ...config,
  } as OrderedFieldDeclarationList;
}

class OrderedFieldDeclarationListBuilder implements BuilderTerminal<OrderedFieldDeclarationList> {
  private _type: string[] = [];
  private _children: string[] = [];

  constructor() {}

  type(value: string[]): this {
    this._type = value;
    return this;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): OrderedFieldDeclarationList {
    return orderedFieldDeclarationList({
      type: this._type,
      children: this._children,
    } as OrderedFieldDeclarationListConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function ordered_field_declaration_list(): OrderedFieldDeclarationListBuilder {
  return new OrderedFieldDeclarationListBuilder();
}
