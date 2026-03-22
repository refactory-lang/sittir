import type { BuilderTerminal } from '@sittir/types';
import type { DeclarationList, DeclarationListConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function declarationList(config: DeclarationListConfig): DeclarationList {
  return {
    kind: 'declaration_list',
    ...config,
  } as DeclarationList;
}

class DeclarationListBuilder implements BuilderTerminal<DeclarationList> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): DeclarationList {
    return declarationList({
      children: this._children,
    } as DeclarationListConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function declaration_list(): DeclarationListBuilder {
  return new DeclarationListBuilder();
}
